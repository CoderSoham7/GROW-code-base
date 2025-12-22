# Savant TTS (Text-to-Speech) Service

## Overview

The Savant TTS Service converts written text to spoken audio using Google's WaveNet text-to-speech technology. It's implemented as a Google Cloud Function that provides high-quality voice synthesis for the CRAB platform's interview functionality, allowing AI-generated responses to be read aloud to candidates.

## Functionality

- **Text-to-Speech Conversion**: Transforms written text into natural-sounding speech
- **Audio Encoding**: Provides audio in MP3 format as a base64-encoded data URL
- **Custom Pronunciation Rules**: Applies special pronunciation rules for technical terms and abbreviations

## Components

### Google Cloud Text-to-Speech Integration

Uses Google's WaveNet neural network-based TTS system:
- Provides natural-sounding speech with proper intonation and rhythm
- Uses the en-GB-Wavenet-C voice for a neutral British English accent
- Generates high-quality MP3 audio output

### Text Processing

Performs several preprocessing steps before speech synthesis:
- Unescapes HTML entities in input text
- Applies custom pronunciation rules for technical abbreviations (ML, GUI, MS, BI, UX, UI)
- Special handling for technical terms like "Abinitio"

## Technical Details

### Service Architecture

The service follows a simple request-response pattern:
- Accepts HTTP POST requests with text input
- Processes text through Google Cloud Text-to-Speech API
- Returns base64-encoded audio data as a data URL

### Voice Configuration

The service uses the following voice configuration:
- Voice: en-GB-Wavenet-C
- Gender: Neutral
- Language: British English
- Format: MP3

### Output Format

Audio is returned as a base64-encoded data URL:
```
data:audio/mp3;base64,<base64-encoded-audio-data>
```

This format allows for direct embedding in HTML audio elements or JavaScript audio playback.

### Security Features

- Uses service account authentication for Google Cloud TTS
- Implements proper CORS headers for API security
- Validates request content

## Deployment

This service is designed to be deployed as a Google Cloud Function with the following requirements:

- Python 3.9+ runtime
- Service account key file (`savant-serviceaccount-key.json`) with Text-to-Speech API access

## Usage

The function is triggered via HTTP POST requests with the following JSON payload:

```json
{
  "data": "Text to convert to speech"
}
```

### Response

A successful response contains the base64-encoded audio data URL:

```
data:audio/mp3;base64,<base64-encoded-audio-data>
```

Error responses include appropriate status codes and error messages.

## Custom Pronunciation Rules

The service applies special pronunciation rules for various technical terms and abbreviations:

| Term/Abbreviation | Pronunciation |
|------------------|---------------|
| ML | "em el" |
| GUI | "ji yu i" |
| MS | "em es" |
| BI | "be i" |
| UX | "yu ex" |
| UI | "yu i" |
| Abinitio/Ab Initio | "ab ini shio" |

These rules ensure that technical terms are pronounced correctly in the generated speech.

## Requirements

See `requirements.txt` for the full list of dependencies needed to run this service.

## Integration Flow

1. AI interviewer generates a text response
2. Frontend sends the text to this TTS service
3. Service converts the text to speech using Google Cloud TTS
4. Service returns the audio as a base64-encoded data URL
5. Frontend plays the audio to the candidate