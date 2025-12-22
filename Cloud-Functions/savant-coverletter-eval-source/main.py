import functions_framework
from typing import Dict, Any
import json
import os
from dotenv import load_dotenv
import time
import threading
from datetime import datetime
import requests
from cryptography.fernet import Fernet
import google.oauth2.id_token
import google.auth.transport.requests
import boto3

from api_client import APIClient
from database import DatabaseManager
from agents_coverletter import CourtroomDebate

# Load environment variables
load_dotenv()

SCHEDULER_URL = os.getenv('SCHEDULER_URL')
ENCP_KEY = os.getenv('ENCP_KEY')

if not SCHEDULER_URL or not ENCP_KEY:
    raise ValueError("SCHEDULER_URL and ENCP_KEY environment variables must be set.")

cipher_suite = Fernet(ENCP_KEY)

def decrypt_data(encrypted_data):
    decrypted_data = cipher_suite.decrypt(encrypted_data)
    return decrypted_data.decode()

def get_rotated_bedrock_client():
    """
    Fetches a new key from the scheduler using a freshly generated identity token,
    decrypts it, and creates a Boto3 client. This should be called for each
    unit of work that needs a key (e.g., each debate).
    """
    url = f"{SCHEDULER_URL}"
    payload = {"op": 'getkey', "queue": 'api_keys'} 

    try:
        # Create a request object for the auth library.
        auth_req = google.auth.transport.requests.Request()
        
        # Fetch a new OIDC Identity Token for EACH attempt. This guarantees it is not expired.
        id_token = google.oauth2.id_token.fetch_id_token(auth_req, SCHEDULER_URL)

        # Make an authenticated request using the fresh token.
        response = requests.post(
            url,
            headers={
                'Authorization': f'Bearer {id_token}', 
                'Content-Type': 'application/json'
            },
            data=json.dumps(payload),
            timeout=10
        )
        # Raise an exception for bad status codes (like 401, 404, 503)
        response.raise_for_status()

        # The request was successful, now decrypt the key
        encrypted_key = response.content
        aws_creds = json.loads(decrypt_data(encrypted_key))
        
        # Create and return a fresh Boto3 client
        return boto3.client(
            'bedrock-runtime',
            aws_access_key_id=aws_creds["AWSAK"],
            aws_secret_access_key=aws_creds["AWSSAK"],
            region_name="us-east-1"  # Or your desired region
        )
    except requests.exceptions.HTTPError as e:
        print(f"FATAL: HTTP Error fetching key from scheduler: {e}. Response: {e.response.text}")
        raise  # Reraise to fail the debate
    except Exception as e:
        print(f"FATAL: A critical error occurred while trying to get a key from the scheduler: {e}")
        raise # Reraise to fail the debate

def run_debate(cover_letter: str, drive: str) -> str:
    """Run a single debate session using a freshly rotated key."""
    print("Starting debate session")

    try:
        fresh_bedrock_client = get_rotated_bedrock_client()
        debate = CourtroomDebate(fresh_bedrock_client, cover_letter, drive)
    except Exception as e:
        print(f"Could not start debate because of an error getting a client: {e}")
        return f"Error: Could not acquire a valid API key from the key scheduler. Debate aborted. Details: {e}"

    result = debate.conduct_debate()
    print("Debate completed")
    return result

def count_accepts(debate_results: list) -> int:
    """Count the number of 'Accept' decisions in debate results"""
    print("\nAnalyzing debate results...")
    accept_count = 0
    for i, result in enumerate(debate_results):
        try:
            lines = result.split('\n')
            for line in reversed(lines):
                if 'final_decision' in line.lower():
                    try:
                        start = line.find('{')
                        end = line.rfind('}') + 1
                        if start == -1 or end == 0:
                            continue
                        
                        json_str = line[start:end]
                        decision = json.loads(json_str)
                        if decision.get('final_decision', '').lower() == 'accept':
                            accept_count += 1
                        break
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            print(f"Error processing debate {i+1}: {str(e)}")
            
    print(f"\nTotal accepts: {accept_count}/5")
    return accept_count

def process_cover_letter(interview_uuid: str, db_manager: DatabaseManager):
    """Background process to evaluate cover letter"""
    try:
        # Update status to processing
        db_manager.interviews.update_one(
            {"uuid": interview_uuid},
            {"$set": {"cl_relevance": "processing"}}
        )

        # Get cover letter and drive details
        cover_letter = db_manager.get_cover_letter(interview_uuid)
        _, drive, _ = db_manager.get_interview_details(interview_uuid)

        if not cover_letter or not drive:
            db_manager.interviews.update_one(
                {"uuid": interview_uuid},
                {"$set": {"cl_relevance": "error"}}
            )
            return

        # Run 5 debates
        debate_results = []
        for i in range(5):
            print(f"--- Starting Debate {i+1}/5 ---")
            result = run_debate(cover_letter, drive)
            debate_results.append(result)

        # Calculate relevance score
        accept_count = count_accepts(debate_results)
        cl_relevance = accept_count

        # Update final results
        db_manager.interviews.update_one(
            {"uuid": interview_uuid},
            {
                "$set": {
                    "cl_relevance": cl_relevance,
                    "CoverLetterCRD": debate_results,
                    "last_updated": datetime.utcnow()
                }
            }
        )

    except Exception as e:
        print(f"Error in background process: {str(e)}")
        db_manager.interviews.update_one(
            {"uuid": interview_uuid},
            {"$set": {"cl_relevance": "error"}}
        )

def initialize_cl_relevance(db_manager: DatabaseManager, interview_uuid: str):
    """Initialize cl_relevance field if it doesn't exist"""
    result = db_manager.interviews.update_one(
        {
            "uuid": interview_uuid,
            "cl_relevance": {"$exists": False}
        },
        {"$set": {"cl_relevance": "NA"}}
    )
    return result.modified_count > 0

@functions_framework.http
def coverlettereval(request):
    """HTTP Cloud Function for cover letter evaluation"""
    try:
        # Validate request
        request_json = request.get_json(silent=True)
        if not request_json or 'interview_uuid' not in request_json:
            return {'success': False, 'error': 'Missing interview_uuid in request'}, 400

        interview_uuid = request_json['interview_uuid']
        print(f"Processing interview: {interview_uuid}")
        

        try:
            mongo_uri = os.getenv('MONGO_URI')
            if not mongo_uri:
                raise ValueError("No MongoDB URI found")
            db_manager = DatabaseManager(mongo_uri)
        except ValueError as e:
            return {'success': False, 'error': f'Configuration error: {str(e)}'}, 500

        # Initialize cl_relevance if needed
        initialize_cl_relevance(db_manager, interview_uuid)

        # Start background processing
        thread = threading.Thread(
            target=process_cover_letter,
            args=(interview_uuid, db_manager)
        )
        thread.start()

        # Return immediate acknowledgment
        return {
            'success': True,
            'message': 'Cover letter evaluation started',
            'interview_uuid': interview_uuid
        }, 200

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {'success': False, 'error': str(e)}, 500
