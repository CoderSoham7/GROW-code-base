import os
import random
import logging
import functions_framework
from flask import jsonify
from flask_cors import CORS
from typing import List, Optional
import boto3
from markupsafe import escape
import numpy as np
import json
import PyPDF2
from io import BytesIO
from google.cloud import storage
from google.oauth2 import service_account
from cryptography.fernet import Fernet
import requests
import re
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_random_exponential, RetryError, TryAgain
import html
from datetime import datetime

import google.auth
import google.auth.transport.requests

import google.oauth2.id_token
import google.auth.transport.requests

# --- Global setup (things that don't change per request) ---
load_dotenv()
cipher_suite = Fernet(os.getenv('ENCP_KEY'))
SCHEDULER_URL = os.getenv('SCHEDULER_URL')
cl_url = os.getenv('CL_URL')
mongo_client = MongoClient(os.getenv("MONGO_URI"))
MODEL_ID = os.getenv('MODEL_ID')

# --- Helper Functions ---
def decrypt_data(encrypted_data):
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

# The retry logic should wrap the function that makes the API call.
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
        
        # Note: Model ID for Opus is anthropic.claude-3-opus-20240229-v1:0
        response = bedrock_client.invoke_model(body=body, modelId=MODEL_ID)
        response_body = json.loads(response.get("body").read())
        return response_body["content"][0]["text"]
    except Exception as e:
        logging.error(f"Bedrock invocation attempt failed, will retry. Error: {e}")
        # Reraise the exception to trigger tenacity's retry mechanism
        raise TryAgain from e


# --- Main Application Logic ---
class MongoDBClient:
    def __init__(self, uri):
        self.client = MongoClient(uri)
        if self.client:
            print("MongoDB Connected: Successful")
        else:
            print("MongoDB Connected: Not Successful")
    
    def get_client(self):
        return self.client

class ChatInput(BaseModel):
    ID: str
    candidate_response: str
    uuid: str

class InterviewChat:

    def __init__(self, db_client):
        self.db_client = db_client.get_client()
        self.users = self.db_client.savantmongodb.users
        self.interviews = self.db_client.savantmongodb.interviews
        self.jd_collection = self.db_client.savantmongodb.OpenAIPrompts

    def validate_input(self, input):
        try:
            val_text = input.replace("$", "").replace("&", "")
            return val_text
        except Exception as e:
            print("User Input Exception:", e)
            return input

    def handle_request(self, request):
        if request.method == "OPTIONS":
            headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "3600",
            }
            return ("", 204, headers)

        request_json = request.get_json(silent=True)
        ID = request_json['ID']
        candidate_response = request_json['candidate_response']
        uuid = request_json['uuid']
        timestamp_format = "%I:%M %p"
        current_timestamp = datetime.now().strftime(timestamp_format)
        
        candidate_response = self.validate_input(candidate_response)
        print('Python HTTP trigger function processed a request.')

        # Query the interviews collection
        query = {'uuid': uuid}
        interview = self.interviews.find_one(query)
        if not interview:
            raise Exception(status_code=404, detail="Interview not found")
        
        user = self.users.find_one({'_id': ObjectId(ID)})
        if not user:
            raise Exception(status_code=404, detail="User not found")
        
        # Update user document to include the interview UUID if not already present
        if uuid not in user.get('interviews', []):
            self.users.update_one(
                {'_id': ObjectId(ID)},
                {'$addToSet': {'interviews': uuid}}
            )
        
        DriveName = interview['interview_drive']
        CL_input = interview.get('covertext', '')

        if "chatlog_timestamps" not in interview:
            interview["chatlog_timestamps"] = []

        newvalues = {
            "$set": {
                "chatlog": interview.get('chatlog', []) + [f"Candidate: {candidate_response}\n"],
                "chatlog_timestamps": interview["chatlog_timestamps"] + [f"Candidate_timestamp: {current_timestamp}\n"],
                "messages": interview.get('messages', []) + [{"role": "user", "content": candidate_response}]
            }
        }
        
        self.interviews.update_one(query, newvalues)

        print(f'chatlog Created or already exists.. and candidate response is updated.')
        print(f'once again retriving from mongo')
        interview = self.interviews.find_one(query)

        DriveName = self.validate_input(DriveName).strip()
        Driveversion = interview['interview_drive_version'].strip()
        Driveversion = self.validate_input(Driveversion)
        currJD = self.jd_collection.find_one({'name': DriveName.strip(), 'skill_level_version': Driveversion})
        JDskills = str(currJD['skills'])
        JDsections = str(currJD['sections'])
        JDdiffiiculty = str(currJD['difficulty'])
        JDquestion_pattern = str(currJD['question_pattern'])
        InterviewBasePrompt = str(self.jd_collection.find_one({'name': interview['ubase']})['Body'])
            
        if interview['ubase'] in ['ClaudeSecBase', 'ClaudeNonTechBase']:
            FinalBase = InterviewBasePrompt.format(DriveName, JDskills, JDdiffiiculty, JDsections, JDquestion_pattern)
        else:     
            if "Question_bank" in currJD.keys() and len(currJD["Question_bank"]) > 1:
                print("Question_bank found.")

                if interview['ubase'] == 'ClaudeExpBase':
                    qb_note = """[Note from the Admin: The following is Question Bank for You to follow while Conducting this Interview, Choose Questions Randomly from the following in each sections. You can ask followup questions based on candidate's answers if required.]"""
                    FinalBase = InterviewBasePrompt.format(DriveName, JDdiffiiculty, JDquestion_pattern)
                
                elif interview['ubase'] == 'ClaudeNoBase':
                    qb_note = """[Note from the Admin: The following is Question Bank for You to follow while Conducting this Interview, Choose Questions Sequentially from the following in each sections. You can ask followup questions based on candidate's answers if required.]"""
                    FinalBase = InterviewBasePrompt.format(DriveName, JDskills, JDdiffiiculty, JDsections, JDquestion_pattern)

                if "Questions" not in interview.keys() or len(interview["Questions"]) < 1:
                    headers = {'Content-Type': 'application/json'}
                    requests.post(cl_url, headers=headers, data=json.dumps({"ID": ID, "uuid": uuid}))
                    interview = self.interviews.find_one(query)
                FinalBase += qb_note + str(interview["Questions"])

        FinalBase += "Candidate's Cover Letter: \n" + str(CL_input)

        messages = interview['messages']

        print("messages done..")
        ADMINnote = """[
```Note from the Admin: As an AI Interviewer, Make sure to Adhere to your Instructions and Guidelines. **Only Generate** the reponse in the JSON Format. In the Following Format:
{
  "Observe": "Your observation.",
  "Think": "Your thoughts.",
  "Ask": "Your next question.",
  "Reflect": "Your reflections and any adjustments to be made.",
  "Revision": "Revised question",
  "Interviewer": "Your formulated response to the candidate."
}
```
        ]"""
        messages[-1]["content"] += ADMINnote

        try:
            # The opus() function is now invoke_bedrock_with_rotation()
            response = invoke_claude_with_rotation(messages, FinalBase)
        except RetryError as e:
            print(f"Bedrock invocation failed after all retries: {e}")
            response = "AWS Bedrock Error: Could not get a response from the model after several attempts."
        except Exception as e:
            # Catch other exceptions from get_rotated_bedrock_client
            print(f"A critical error occurred while trying to get an API key: {e}")
            response = "AWS Bedrock Error"
            
        print(response)
        print('Got response from Alex')

        next_questionjson = response.strip('```json')
        next_questionjson = next_questionjson.strip('`')
        next_questionjson = re.sub(r'(?<!\\)\n', '\\n', next_questionjson)

        print(next_questionjson)

        tnqj = type(next_questionjson)

        print(f'TYPE OF next_questionjson: {tnqj}')

        next_questionjson = json.loads(next_questionjson, strict=False)
        # next_question = str(next_questionjson['Interviewer'])
        next_question = next_questionjson['Interviewer']

        print(next_question)

        tq = type(next_question)

        print(f'TYPE OF next_question: {tq}')
        print(f'Next question: {next_question}')
        print(f'updating to database..')
        interview = self.interviews.find_one(query)
        interviewer_timestamp = datetime.now().strftime(timestamp_format)
        newvalues = {
            "$set": {
                "chatlog": interview['chatlog'] + [f"Interviewer: {next_question}"],
                "messages": interview['messages'] + [{"role": "assistant", "content": response}],
                "chatlog_timestamps": interview['chatlog_timestamps'] + [f"Interviewer_timestamp: {interviewer_timestamp}\n"]
            }
        }
        self.interviews.update_one(query, newvalues)

        data = {'_id': ID, "uuid": uuid, "Question": next_question}
        headers = {"Access-Control-Allow-Origin": "*"}
        return (data, 200, headers)

# Initialize components 
mongo_client = MongoDBClient(os.getenv("MONGO_URI"))
interview_chat = InterviewChat(mongo_client)

# Cloud function
@functions_framework.http
def chat(request):
    return interview_chat.handle_request(request)