# Savant STT (Speech-to-Text) Service

## Overview

The Savant STT Service is a lightweight proxy service implemented as a Google Cloud Function that forwards audio recordings to a Whisper-based speech recognition API. It enables speech-to-text capabilities in the CRAB platform by connecting the frontend interview experience with a specialized Whisper API endpoint.

## Functionality

- **Audio Processing**: Accepts audio file uploads from the client application
- **API Forwarding**: Proxies requests to a dedicated Whisper speech-to-text service
- **Response Handling**: Returns transcription results back to the client

## Technical Details

### Service Architecture

This service acts as a bridge between the CRAB platform and the Whisper API:
- Accepts HTTP POST requests with audio file payloads
- Forwards the audio data to a dedicated Whisper API endpoint (http://35.224.37.187/whisper/uploadAudioBlob)
- Returns the transcription response from Whisper back to the client

### Integration Points

- **Client Integration**: Accepts multipart form data with audio file
- **Whisper API**: Connects to a separate service running the Whisper speech recognition model
- **Response Format**: Returns JSON response from Whisper API with transcription results

### Security Features

- Implements proper CORS headers for API security
- Validation of request content

## Deployment

This service is designed to be deployed as a Google Cloud Function with the following requirements:

- Python 3.9+ runtime
- Network access to the Whisper API endpoint (http://35.224.37.187)

## Usage

The function is triggered via HTTP POST requests with multipart form data:

```
POST /
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="audio.webm"
Content-Type: audio/webm

[binary audio data]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### Response

A successful response contains the transcription data returned by the Whisper API, typically in the following format:

```json
{
  "text": "Transcribed text from the audio recording",
  "duration": 5.24,
  "language": "en"
}
```

The specific response format depends on the Whisper API implementation.

## Requirements

See `requirements.txt` for the full list of dependencies needed to run this service.

## Integration Flow

1. The CRAB frontend records audio during an interview session
2. The audio is sent to this Cloud Function as a file upload
3. This service forwards the audio data to the Whisper API
4. Whisper processes the audio and returns the transcribed text
5. This service forwards the transcription back to the frontend
6. The frontend displays or processes the transcribed text

## Dependencies

- **External Whisper Service**: This function relies on a separate Whisper API endpoint for the actual speech-to-text processing
- **Functions Framework**: For handling HTTP requests in the cloud function environment
- **Requests**: For making HTTP requests to the Whisper API