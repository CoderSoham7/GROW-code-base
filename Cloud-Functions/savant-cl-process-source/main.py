import os
import re
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
from cryptography.fernet import Fernet, InvalidToken
import requests
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

# Securely load environment variables
ENCP_KEY = os.getenv('ENCP_KEY')
SCHEDULER_URL = os.getenv('SCHEDULER_URL')
GCP_BUCKET_NAME = os.getenv('GCP_BUCKET_NAME')
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

# The retry decorator now wraps the function that performs the entire operation (get key + invoke)
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

class MongoDBClient:
    def __init__(self, uri):
        self.client = MongoClient(uri)
        if self.client:
            print("MongoDB Connected: Successful")
        else:
            print("MongoDB Connected: Not Successful")

    def get_client(self):
        return self.client

class PDFProcessor:
    def __init__(self, bucket_name):
        self.client = storage.Client()
        self.bucket_name = bucket_name

    def get_pdf_text(self, filename):
        try:
            bucket = self.client.get_bucket(self.bucket_name)
            blob = storage.Blob('coverletter/' + filename, bucket)
            pdf_data = blob.download_as_bytes()
            with BytesIO(pdf_data) as pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                text = "".join([page.extract_text() for page in reader.pages]).strip()
            if len(text) >= 10:
                return text
            else:
                return "Cover Letter PDF Invalid/Corrupted. Continue with the Interview."
        except Exception as e:
            print(f"PDF Error: {e}")
            return "Cover Letter PDF Invalid/Corrupted. Continue with the Interview."

class QuestionSelector:  
    def validate_input(self, input):  
        try:  
            val_text = input.replace("$", "").replace("&", "")  
            return val_text  
        except Exception as e:  
            print("User Input Exception:", e)  
            return input  

    def encode_special_chars(self, text):
        return text.replace('\n', '\\n').replace('\t', '\\t')

    def select_questions(self, question_bank, cover_letter, dname, qp):
        
        # nobase_list1 JDs have well-defined sections specific number of questions to ask
        nobase_list1 = ["Informatica MDM Junior Dev (PL1)", 
                        "Informatica MDM Junior Developer (PL1)",
                        "Informatica MDM Developer (PL2)",
                        "Informatica MDM Senior Developer (PL3)", 
                        "Reltio Sr. Developer (PL3)", 
                        "Reltio Developer (PL2)", 
                        "Jr Reltio Dev (PL1)",
                        "Informatica Powercenter Junior Dev(PL1)",
                        "Informatica Powercenter Developer (PL2)",
                        "Informatica Powercenter Senior Developer (PL3)",
                        "Jr Informatica DG(Axon/EDC/CDGC)Developer (PL1)",
                        "Informatica DG(Axon/EDC/CDGC)Developer(PL2)",
                        "Sr Informatica DG(Axon/EDC/CDGC)Developer(PL3)",
                        "CDIT Jr Power BI Developer (PL1)",
                        "Jr IDQ Developer (PL1)",
                        "IDQ Developer(PL2)",
                        "Sr IDQ Developer(PL3)"
                        ]
        # nobase_list2 is similar to list1, but some questions have data with tabspace, newlines (unicode) which need to be properly rendered
        nobase_list2 = ["QlikView Jr.Developer (PL1)",
                        "QlikView Developer (PL2)",
                        "QlikView Sr. Developer (PL3)",
                        "MSBI Developer (PL2)",
                        "MSBI Jr.Developer (PL1)",
                        "MSBI Sr. Developer (PL3)",
                        "MSBI Testing (PL2)",
                        "Abinitio Jr Developer (PL1)",
                        "Abinitio Developer (PL2)",
                        "Abinitio Sr. Developer (PL3)"
                        ]

        if dname in nobase_list1 or dname in nobase_list2:
            # Splitting the question bank into sections using regex  
            sections = re.split(r"(Section [A-Z] : .*? \(Select any \d+ questions from this section\))", question_bank)[1:]  
            sections = [sections[n:n+2] for n in range(0, len(sections), 2)]  
        
            # Selecting random questions from each section  
            selected_questions = []
            for section in sections:
                num_questions = int(re.findall(r"\(Select any (\d+) questions from this section\)", section[0])[0])
                
                if dname in nobase_list1:
                    section_questions = [q for q in section[1].split("\n") if q.strip()]
                else:  # dname in nobase_list2
                    section_questions = re.findall(r"(?:^|\n)    (.+?)(?=\n    |\Z)", section[1], re.DOTALL)
                    section_questions = [q.strip() for q in section_questions if q.strip()]
        
                selected = random.sample(section_questions, min(num_questions, len(section_questions)))
                selected_questions.extend(selected)
            
            # Format the questions as a numbered list
            numbered_questions = [f"{i+1}. {q}" for i, q in enumerate(selected_questions)]
            ques = "\n".join(numbered_questions)
    
            if dname in nobase_list2:
                ques = self.encode_special_chars(ques)
                

        else:
            base = """  
---  
title: Interview Expert  
---  

As an Interview Expert, your mission is to generate a personalized interview question set for a potential candidate. You have at your disposal a cover letter from the candidate and a question bank of approximately 200 questions, organized into several sections and sub-sections.  

## Your Task:  

1. **Curate a Set of 20 Questions**: Based on the information provided by the candidate and the requirements of the job role, select 20 questions that will best evaluate the candidate's suitability for the position.  
2. **Represent All Sections**: Ensure your set includes at least one question from each identified section and sub-section in the question bank.  
3. **Use the Question Bank**: Verify that all questions in your final set are sourced from the question bank.  

Please note that the interview is for the job title: `{}`. Follow the question pattern: `{}`.  

## Additional Suggestions:  

- **Personalization**: Utilize specific details from the candidate's cover letter to formulate relevant questions.  
- **Role-Specific Questions**: Tailor your questions to assess the candidate's suitability for the specific job role.  
- **Competency Evaluation**: Include questions that evaluate the key competencies required for the position.  
- **Behavioral Assessment**: Incorporate behavioral questions to understand how the candidate might handle different situations at work.  

## Instruction:  
- Present your questions in a **List Format** only.  
- The output should solely consist of the curated list of questions.
- Ensure that the questions you select are **distinct** and **not redundant** in their meaning.
- If cover letter is empty/not present curate 20 questions randomly without personalization while following the guidelines as close as possible.
        """  
            
            cl_note = '''
The Following is the Candidate's Cover Letter to used as a reference while creating the personalized Interview Questions:
{}
        '''
            qb_note = '''
The Following is the Question Bank to used as a reference while creating the personalized Interview Questions:
{}
        '''
            
            
            mess = [{"role": "user", "content": qb_note+question_bank + "\n \n" + cl_note+cover_letter}]
            ques = invoke_claude_with_rotation(mess, base.format(dname, qp))
        return ques

class InterviewInitializer:
    def __init__(self, db_client, pdf_processor, question_selector):
        self.db_client = db_client.get_client()
        self.pdf_processor = pdf_processor
        self.question_selector = question_selector
        self.users = self.db_client.savantmongodb.users
        self.interviews = self.db_client.savantmongodb.interviews
        self.jd_collection = self.db_client.savantmongodb.OpenAIPrompts

    def initialize_interview(self, request):
        request_json = request.get_json(silent=True)
        ID = request_json['ID']
        uuid = request_json['uuid']

        user_query = {'_id': ObjectId(ID)}
        user = self.users.find_one(user_query)
        if not user:
            return jsonify({"error": "User not found"}), 404

        interview_query = {'uuid': uuid}
        interview = self.interviews.find_one(interview_query)
        if not interview:
            return jsonify({"error": "Interview not found"}), 404

        # Extract cover letter text
        covletter = interview.get('coverletter', '')
        self.interviews.update_one(interview_query, {"$set": {"covertext": 'processing'}})
        covtext = self.pdf_processor.get_pdf_text(covletter)
        covtext = self.question_selector.validate_input(covtext)
        self.interviews.update_one(interview_query, {"$set": {"covertext": covtext}})

        interview = self.interviews.find_one(interview_query)
        covtext = interview['covertext']

        # Select questions
        DriveName = interview['interview_drive']
        Driveversion = interview['interview_drive_version'].strip()
        currJD = self.jd_collection.find_one({'name': DriveName.strip(), 'skill_level_version': Driveversion})

        try:
            if "Question_bank" in currJD and len(currJD["Question_bank"]) > 1:
                questions = self.question_selector.select_questions(
                    currJD["Question_bank"], covtext, DriveName, currJD['question_pattern']
                )
                self.interviews.update_one(interview_query, {"$set": {"Questions": questions}})

            return jsonify({"message": "Interview initialized successfully"}), 200

        except RetryError as e:
            logging.error(f"Failed to generate questions after all retries: {e}")
            return jsonify({"error": "AI model failed to generate questions. Please try again later."}), 503
        except Exception as e:
            logging.error(f"A critical error occurred during question selection: {e}")
            return jsonify({"error": "An unexpected error occurred during interview initialization."}), 500


# --- Initialization of Static Components ---
pdf_processor = PDFProcessor(GCP_BUCKET_NAME)
question_selector = QuestionSelector()
mongo_client = MongoDBClient(MONGO_URI)
interview_initializer = InterviewInitializer(mongo_client, pdf_processor, question_selector)

# Cloud function
@functions_framework.http
def initialize_interview(request):
    return interview_initializer.initialize_interview(request)