import os
import json
import logging
import functions_framework
import boto3
import requests
from flask import jsonify
from pymongo import MongoClient
from tenacity import retry, stop_after_attempt, wait_random_exponential, RetryError, TryAgain
from dotenv import load_dotenv
from cryptography.fernet import Fernet, InvalidToken

import google.auth
import google.auth.transport.requests

import google.oauth2.id_token
import google.auth.transport.requests


# --- Global setup (things that don't change per request) ---
load_dotenv()

# Securely load environment variables
ENCP_KEY = os.getenv('ENCP_KEY')
SCHEDULER_URL = os.getenv('SCHEDULER_URL')
MONGO_URI = os.getenv('MONGO_URI')
MODEL_ID = os.getenv('MODEL_ID')

# Initialize the cipher suite once
cipher_suite = Fernet(ENCP_KEY)

# --- Helper Functions ---

def decrypt_data(encrypted_data):
    """Safely decrypts data."""
    decrypted_data = cipher_suite.decrypt(encrypted_data)
    return decrypted_data.decode()

def get_rotated_bedrock_client():
    """
    Fetches a new key from the scheduler using a freshly generated identity token decrypts it, and creates a Boto3 client.
    """
    url = f"{SCHEDULER_URL}"
    payload = {"op": 'getkey', "queue": 'claude'}

    try:
        auth_req = google.auth.transport.requests.Request()
        id_token = google.oauth2.id_token.fetch_id_token(auth_req, SCHEDULER_URL) # Fetch OIDC token from scheduler

        response = requests.post(
            url,
            headers={
                'Authorization': f'Bearer {id_token}', # Auth using token
                'Content-Type': 'application/json'
            },
            data=json.dumps(payload),
            timeout=10
        )
        response.raise_for_status()

        # The request was successful, now decrypt the key
        encrypted_key = response.content
        aws_creds = json.loads(decrypt_data(encrypted_key))
        
        return boto3.client(
            'bedrock-runtime',
            aws_access_key_id=aws_creds["AWSAK"],
            aws_secret_access_key=aws_creds["AWSSAK"],
            region_name="us-east-1"
        )
        
    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP Error fetching key from scheduler: {e}. Response: {e.response.text}")
        raise
    except (json.JSONDecodeError, TypeError, google.auth.exceptions.GoogleAuthError) as e:
        logging.error(f"Failed to authenticate, decrypt, or parse key from scheduler: {e}")
        raise
    except requests.exceptions.RequestException as e:
        logging.error(f"Network error connecting to scheduler: {e}")
        raise


        
@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def invoke_claude_with_rotation(mssgs, sysp):
    """
    Gets a fresh, rotated bedrock client and then invokes the model.
    Retries the entire process if any step fails.
    """
    try:
        # Get a new client for each attempt. This is the key to rotation!
        bedrock_client = get_rotated_bedrock_client()

        body = json.dumps({
            "max_tokens": 4000,
            "messages": mssgs,
            "anthropic_version": "bedrock-2023-05-31",
            "system": sysp
        })
    
        response = bedrock_client.invoke_model(body=body, modelId=MODEL_ID)
        response_body = json.loads(response.get("body").read())
        return response_body["content"][0]["text"]
    except Exception as e:
        logging.error(f"Bedrock invocation attempt failed, will retry. Error: {e}")
        # Reraise the exception to trigger tenacity's retry mechanism
        raise TryAgain from e

# --- Class Definitions ---

class MongoDBClient:
    def __init__(self, uri):
        self.client = MongoClient(uri)
        if self.client.server_info():
            print("MongoDB Connected: Successful")
        else:
            print("MongoDB Connected: Not Successful")
    
    def get_client(self):
        return self.client

class InterviewCompletionChecker:
    def __init__(self, db_client):
        self.db_client = db_client.get_client()
        self.interviews = self.db_client.savantmongodb.interviews

    def check_completion(self, candidate_id, uuid):
        doc = self.interviews.find_one(
            {"candidate_id": candidate_id, "uuid": uuid},
            {"chatlog": 1}
        )
        
        if not doc or "chatlog" not in doc or len(doc["chatlog"]) == 0:
            return {"error": "Interview or chatlog not found"}, 404

        text = doc["chatlog"][-4:]
        text = f"'''{text}'''"

        # Claude completion checking persona
        persona = '''You are tasked with analyzing interview completeness based on transcript endings. You will be provided with the last 2-3 exchanges of an interview transcript (final interactions between interviewer and interviewee).

Input format:
[The last excerpt from the interview transcript]

CRITICAL FIRST CHECK:
- If the last message is an unanswered question from the interviewer, the interview is incomplete
- If the last message is a non-conclusive statement from the interviewer requiring response, the interview is incomplete

Then proceed with detailed analysis:

1. First Review:
   - Read and understand the context of the exchanges
   - Identify if there's a formal closing statement
   - Note if there's a post-closing Q&A sequence

2. Reflection:
   - Consider if this is a standard interview completion or a special case
   - Evaluate if there's a logical conclusion based on context
   - Assess if post-closing questions were properly addressed
   - Review if next steps (if any) were clearly communicated

3. Final Verification:
   Complete interview indicators:
   - Formal closing statements followed by proper responses to any follow-up questions
   - Clear goodbye exchanges
   - Natural conclusion even if interviewer has last word
   - Post-interview questions properly addressed
   - Clear next steps communicated (if applicable)

   Incomplete interview indicators:
   - Unanswered interviewer questions
   - Abrupt endings without closure
   - Unfinished sentences
   - Interrupted dialogue
   - Critical questions left hanging
   - Clear expectation of further response

Output format: Respond with ONLY:
"yes" - if the interview was complete (including proper closing sequences)
"no" - if the interview was incomplete

Do not include any additional explanation or commentary.'''

        try:
            response = invoke_claude_with_rotation([{"role": "user", "content": text}], persona)
            
            is_complete = response.lower().strip() == 'yes'
            
            self.interviews.update_one(
                {"candidate_id": candidate_id, "uuid": uuid},
                {"$set": {"interview_completed": is_complete}}
            )
            
            return {
                "status": "success",
                "interview_completed": is_complete,
                "candidate_id": candidate_id,
                "uuid": uuid
            }, 200
        
        except RetryError as e:
            logging.error(f"Failed to check completion after all retries for uuid {uuid}: {e}")
            return {"error": "AI model failed to respond. Could not check interview completion."}, 503
        except Exception as e:
            logging.error(f"A critical error occurred while checking completion for uuid {uuid}: {e}")
            return {"error": "An unexpected server error occurred."}, 500

# Initialize components
mongo_client = MongoDBClient(os.getenv("MONGO_URI"))
completion_checker = InterviewCompletionChecker(mongo_client)

@functions_framework.http
def check_interview_completion(request):
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600"
        }
        return ("", 204, headers)

    try:
        request_json = request.get_json(silent=True)
        
        if not request_json:
            return ({"error": "No JSON data provided"}, 400)
            
        candidate_id = request_json.get('candidate_id')
        uuid = request_json.get('uuid')
        
        if not candidate_id or not uuid:
            return ({"error": "Missing required parameters"}, 400)
            
        result, status_code = completion_checker.check_completion(candidate_id, uuid)
        
        headers = {"Access-Control-Allow-Origin": "*"}
        return (result, status_code, headers)
        
    except Exception as e:
        return ({"error": str(e)}, 500, {"Access-Control-Allow-Origin": "*"})