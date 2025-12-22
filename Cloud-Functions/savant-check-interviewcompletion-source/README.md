# Savant Interview Completion Checker

## Overview

This service analyzes interview transcripts to determine if an interview has been properly concluded. It uses Claude AI to evaluate the final exchanges between the interviewer and candidate, identifying whether the conversation reached a natural conclusion or ended abruptly. The service is implemented as a Google Cloud Function.

## Functionality

- **Interview Completion Analysis**: Evaluates whether interviews have been properly concluded
- **AI-Powered Evaluation**: Uses Claude AI to analyze conversation endings
- **Automated Status Updates**: Updates interview status in the database based on analysis results

## Components

### InterviewCompletionChecker

Core class that handles the interview completion analysis:
- Retrieves the last few exchanges from an interview transcript
- Uses Claude AI to analyze the conversation closure
- Updates the interview document with the completion status
- Returns the results to the caller

### MongoDBClient

Manages the connection to the MongoDB database:
- Provides a client instance for database operations
- Handles connection initialization and status reporting

## Technical Details

### AI Analysis Criteria

The AI evaluates interview completions based on several factors:

#### Complete Interview Indicators:
- Formal closing statements with proper responses
- Clear goodbye exchanges
- Natural conclusion (even if interviewer has last word)
- Properly addressed post-interview questions
- Clear communication about next steps (if applicable)

#### Incomplete Interview Indicators:
- Unanswered interviewer questions
- Abrupt endings without closure
- Unfinished sentences
- Interrupted dialogue
- Critical questions left hanging
- Clear expectation of further response

### AWS Bedrock Integration

The service uses Claude 3.5 Sonnet via AWS Bedrock for the analysis:
- Implements retries with exponential backoff for API resilience
- Uses a specific prompt to ensure consistent evaluation
- Expects a simple "yes" or "no" response from Claude

### Security Features

- Uses environment variables for sensitive configuration
- Implements encryption for sensitive data with Fernet
- Provides proper CORS headers for API security

## Deployment

This service is designed to be deployed as a Google Cloud Function with the following requirements:

- Python 3.9+ runtime
- Environment variables:
  - `MONGO_URI`: MongoDB connection string
  - `ENCP_KEY`: Encryption key for sensitive data

## Usage

The function is triggered via HTTP POST requests with the following JSON payload:

```json
{
  "candidate_id": "candidate_identifier",
  "uuid": "interview_uuid"
}
```

### Response

A successful response:

```json
{
  "status": "success",
  "interview_completed": true|false,
  "candidate_id": "candidate_identifier",
  "uuid": "interview_uuid"
}
```

Error responses include appropriate status codes and error messages.

## Requirements

See `requirements.txt` for the full list of dependencies needed to run this service.

## Integration Flow

1. After candidate ends interview session or after a period of inactivity
2. Application calls this service to determine if the interview was properly concluded
3. Service analyzes the conversation end using Claude AI
4. Interview status is updated in MongoDB
5. Results are returned to the calling application
6. Application determines if follow-up actions are needed (e.g., prompting user to continue)