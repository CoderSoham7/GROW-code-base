# Savant Scheduler Service

## Overview

The Savant Scheduler Service is a key management and rotation system implemented as a Google Cloud Function. It manages API keys for various services (AWS, Claude AI, etc.) in a Redis queue, distributing them in a round-robin fashion to ensure load balancing and prevent rate limiting issues.

## Functionality

- **API Key Management**: Stores and retrieves API keys from Redis queues
- **Key Rotation**: Implements a round-robin rotation system for keys
- **Secure Storage**: Encrypts sensitive key data before transmission
- **Queue Management**: Maintains separate queues for different services

## Components

### Redis Integration

The service connects to a Redis instance to store and manage API keys:
- Uses Redis lists for each service queue
- Implements LPOP/RPUSH pattern for round-robin rotation
- Maintains keys in JSON format

### Key Encryption

For secure transmission of API keys:
- Uses Fernet symmetric encryption to protect key data
- Encrypts keys before sending them to clients
- Manages encryption keys via environment variables

## Technical Details

### API Operations

The service supports the following operations:

1. **getkey**: 
   - Retrieves the next available key from the specified queue
   - Rotates the key to the end of the queue
   - Encrypts the key before returning it

2. **ins_keys**:
   - Adds new keys to the specified queue
   - Validates input format
   - Confirms successful insertion

### Queue Types

The service manages three distinct key queues:
- `api_keys`: General API keys
- `claude`: AWS Bedrock keys for Claude AI access
- `the4o`: Keys for The4o API services

### Security Features

- Input validation for all requests
- Queue name validation against allowed list
- Encryption of sensitive data in transit
- Environment variable-based secrets management

## Deployment

This service is designed to be deployed as a Google Cloud Function with the following requirements:

- Python 3.9+ runtime
- Environment variables:
  - `ENCP_KEY`: Encryption key for sensitive data
- External dependencies:
  - Redis instance (currently configured at 10.105.121.51:6379)

## Usage

The function is triggered via HTTP POST requests with the following JSON payloads:

### Get Key Operation

```json
{
  "op": "getkey",
  "queue": "claude"
}
```

Response: Encrypted API key data

### Insert Keys Operation

```json
{
  "op": "ins_keys",
  "queue": "claude",
  "keys": [
    {
      "AWSAK": "access_key_value",
      "AWSSAK": "secret_key_value"
    }
  ]
}
```

Response: Confirmation message with keys inserted

## Error Handling

The service provides appropriate error responses for various scenarios:
- Invalid requests: 400 Bad Request
- Empty key queues: 500 Internal Server Error
- Encryption failures: 500 Internal Server Error
- Missing encryption keys: 500 Internal Server Error

## Requirements

See `requirements.txt` for the full list of dependencies needed to run this service.

## Integration Flow

1. Other cloud functions request API keys by calling this service
2. This service retrieves a key from the appropriate Redis queue
3. The key is moved to the end of the queue (round-robin rotation)
4. The key is encrypted and returned to the caller
5. The calling service uses the key for its API operations