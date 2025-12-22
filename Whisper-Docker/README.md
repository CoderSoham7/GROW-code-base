# Whisper FastAPI Service

## Overview

This service provides speech-to-text transcription capabilities using OpenAI's Whisper model (specifically the distil-large-v3 variant). It's implemented as a FastAPI web service in a Docker container, designed to efficiently transcribe audio files uploaded during interview sessions in the CRAB platform.

## Functionality

- **Audio Transcription**: Converts spoken audio to text using Distil-Whisper
- **Audio File Processing**: Accepts audio file uploads and processes them
- **REST API Interface**: Provides HTTP endpoints for transcription requests
- **GPU Acceleration**: Utilizes CUDA for faster inference when available

## Components

### FastAPI Application

The core service is built with FastAPI:
- RESTful API endpoints for audio processing
- CORS middleware to allow cross-origin requests
- File upload handling for audio files

### Whisper Model Integration

Uses Hugging Face's implementation of Distil-Whisper:
- Leverages the `distil-whisper/distil-large-v2` model
- Optimized with Flash Attention 2 when available
- Configurable for both CPU and GPU environments
- Efficient memory usage with chunking for long audio

## Technical Details

### Speech-to-Text Pipeline

The service implements a streamlined transcription pipeline:
1. Audio file upload endpoint receives audio data
2. File is temporarily saved to disk
3. Whisper model processes the audio file
4. Transcription is returned as plain text
5. Temporary audio file is removed

### Hardware Acceleration

The service is optimized for GPU environments:
- Automatically detects CUDA availability
- Uses half-precision (FP16) when running on GPU
- Falls back to CPU with FP32 when no GPU is available
- Implements Flash Attention 2 for optimized performance when available

### Docker Containerization

The service is packaged as a Docker container:
- Based on NVIDIA CUDA 12.2 development image
- Python 3.11 runtime
- Includes FFmpeg for audio processing
- Configured for easy deployment

## Deployment

### Prerequisites
- Docker
- NVIDIA GPU with CUDA support (recommended but optional)
- NVIDIA Container Toolkit (for GPU support)

### Environment Setup

The service is designed to be deployed as a Docker container:

```bash
# Build the Docker image
docker build -t whisper-fastapi .

# Run the container (CPU only)
docker run -p 8000:8000 whisper-fastapi

# Run with GPU support
docker run --gpus all -p 8000:8000 whisper-fastapi
```

## Usage

### API Endpoints

#### GET `/whisper/`
Returns a welcome message to verify the service is running.

**Response:**
```json
{
  "message": "This code translates speech to text using WHISPER"
}
```

#### POST `/whisper/uploadAudioBlob`
Accepts an audio file and returns the transcribed text.

**Request:**
- Content-Type: multipart/form-data
- Body: file (audio file in a supported format)

**Response:**
```
"Transcribed text from the audio file."
```

## Model Information

- **Model**: distil-whisper/distil-large-v2
- **Description**: A distilled version of Whisper Large-v2 that is faster and more efficient while maintaining similar transcription quality
- **Supported Languages**: Multilingual (primarily optimized for English)
- **Input Formats**: Various audio formats (processed by FFmpeg)

## Requirements

See `requirements.txt` for the full list of dependencies needed to run this service.

## Integration Flow

1. Client application records audio during an interview session
2. Audio is sent to the `/whisper/uploadAudioBlob` endpoint
3. Service processes the audio file using Whisper
4. Transcribed text is returned to the client
5. Client application uses the text for further processing or display

## Performance Considerations

- For optimal performance, running on a CUDA-enabled GPU is recommended
- The service uses chunking to handle longer audio files efficiently
- Processing time depends on audio length and available computing resources