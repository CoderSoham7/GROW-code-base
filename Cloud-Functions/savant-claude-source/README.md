# Savant Claude Interview Chat Service

## Overview

This service powers the AI interviewer functionality for the CRAB platform. It's implemented as a Google Cloud Function that utilizes Claude AI (via AWS Bedrock) to generate contextually appropriate interview questions based on candidate responses, job descriptions, and predefined question banks.

## Functionality

- **Conversational AI**: Maintains an ongoing interview conversation with candidates
- **Context-Aware Responses**: Generates questions based on:
  - Candidate's previous responses
  - Candidate's cover letter
  - Job description (JD) requirements
  - Selected question bank
- **Structured Output**: Generates responses in a structured format with reasoning and reflection
- **Database Integration**: Records all interactions in MongoDB for review and analysis

## Components

### InterviewChat

Core class that handles the interview conversation flow:
- Processes candidate responses
- Retrieves context from MongoDB (job descriptions, previous messages, etc.)
- Constructs prompts for Claude AI
- Parses AI responses
- Updates the conversation history in the database

### MongoDBClient

Manages the connection to the MongoDB database:
- Provides a client instance for database operations
- Handles connection initialization and status reporting

## Technical Details

### AI Integration

The service uses Claude 3.5 Sonnet via AWS Bedrock to generate interviewer responses:
- Implements retries with exponential backoff for API resilience
- Structures prompts to ensure quality and consistency of AI-generated questions
- Uses a specific JSON response format to separate reasoning from the actual questions

### Response Format

Claude generates structured responses in the following JSON format:
```json
{
  "Observe": "AI's observation of the candidate's response",
  "Think": "AI's analysis and thought process",
  "Ask": "The next question being considered",
  "Reflect": "Self-reflection on the question quality",
  "Revision": "Revised question if needed",
  "Interviewer": "Final response delivered to the candidate"
}
```

### Interview Bases

The system supports different interview base prompts:
- `ClaudeSecBase`: For security-focused interviews
- `ClaudeNonTechBase`: For non-technical interviews
- `ClaudeExpBase`: For expert-level technical interviews
- `ClaudeNoBase`: For standard technical interviews

### Security Features

- Uses service account authentication for Google Cloud services
- Implements encryption for sensitive data with Fernet
- Validates and sanitizes user inputs
- Implements CORS headers for API security

## Deployment

This service is designed to be deployed as a Google Cloud Function with the following requirements:

- Python 3.9+ runtime
- Environment variables:
  - `MONGO_URI`: MongoDB connection string
  - `ENCP_KEY`: Encryption key for sensitive data
- Service account key file (`savant-serviceaccount-key.json`) with appropriate permissions

## Usage

The function is triggered via HTTP POST requests with the following JSON payload:

```json
{
  "ID": "user_object_id",
  "candidate_response": "The candidate's message text",
  "uuid": "interview_uuid"
}
```

### Response

A successful response:

```json
{
  "_id": "user_object_id",
  "uuid": "interview_uuid",
  "Question": "AI-generated question for the candidate"
}
```

## Requirements

See `requirements.txt` for the full list of dependencies needed to run this service.

## Integration Flow

1. Candidate submits a response in the interview interface
2. Frontend sends the response to this Cloud Function
3. Function retrieves context and conversation history
4. Function generates a new interviewer question using Claude AI
5. Response is stored in MongoDB and returned to the frontend
6. Frontend displays the interviewer's question to the candidate