# Savant Cover Letter Processing Service

## Overview

This service processes cover letters for the CRAB interview system. It's implemented as a Google Cloud Function that extracts text from PDF cover letters, analyzes them, and generates personalized interview questions based on the candidate's cover letter and a predefined question bank.

## Functionality

- **PDF Processing**: Extracts text from cover letter PDFs stored in Google Cloud Storage
- **Question Generation**: Selects appropriate interview questions based on:
  - The candidate's cover letter content
  - The job description (JD) requirements
  - A predefined question bank for each role
- **Database Integration**: Updates MongoDB with extracted cover letter text and selected questions

## Components

### PDFProcessor

Handles retrieving and extracting text from PDF files stored in Google Cloud Storage:
- Downloads PDFs from the specified GCS bucket
- Extracts text using PyPDF2
- Provides error handling for invalid or corrupted PDFs

### QuestionSelector

Responsible for generating appropriate interview questions:
- Handles different question selection strategies based on job role
- For specific JD types (in `nobase_list1` and `nobase_list2`), selects questions according to predefined section requirements
- For other JD types, uses Claude AI (via AWS Bedrock) to generate personalized questions
- Ensures questions are properly formatted and encoded

### InterviewInitializer

Orchestrates the cover letter processing workflow:
- Retrieves user and interview information from MongoDB
- Updates the interview document with the extracted cover letter text
- Selects appropriate questions based on the job role and question bank
- Updates the interview document with the selected questions

### MongoDBClient

Manages the connection to the MongoDB database:
- Provides a client instance for database operations
- Handles connection initialization and status reporting

## Technical Details

### External Dependencies

- **Google Cloud Storage**: For accessing cover letter PDFs
- **MongoDB**: For storing and retrieving interview data
- **AWS Bedrock**: For AI-powered question generation (Claude Opus model)
- **Flask**: For handling HTTP requests in the cloud function environment

### Security Features

- Uses service account authentication for Google Cloud Storage
- Implements encryption for sensitive data with Fernet
- Validates and sanitizes user inputs

## Deployment

This service is designed to be deployed as a Google Cloud Function with the following requirements:

- Python 3.9+ runtime
- Environment variables:
  - `GCP_BUCKET_NAME`: Google Cloud Storage bucket name
  - `MONGO_URI`: MongoDB connection string
  - `ENCP_KEY`: Encryption key for sensitive data
- Service account key file (`savant-serviceaccount-key.json`) with appropriate permissions

## Usage

The function is triggered via HTTP requests with the following JSON payload:

```json
{
  "ID": "user_object_id",
  "uuid": "interview_uuid"
}
```

### Response

A successful response:

```json
{
  "message": "Interview initialized successfully"
}
```

Error responses include appropriate status codes and error messages.

## Requirements

See `requirements.txt` for the full list of dependencies needed to run this service.