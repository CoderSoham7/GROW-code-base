# Cognizant Role Accreditation Bot

## Overview

The Cognizant Role Accreditation Bot is a comprehensive AI-powered interview platform designed for technical role assessment and accreditation. This full-stack solution combines web technologies, cloud functions, and AI services to deliver automated, intelligent interview experiences for candidates and comprehensive management tools for administrators.

## Project Architecture

The CRAB system is built on a microservices architecture with three main components:

```
┌─────────────────┐    ┌──────────────────────────┐    ┌─────────────────────┐
│                 │    │                          │    │                     │
│   UI Component  │◄──►│    Cloud Functions       │◄──►│  Whisper-Docker     │
│                 │    │     (8 Services)         │    │                     │
│                 │    │                          │    │                     │
└─────────────────┘    └──────────────────────────┘    └─────────────────────┘
```

## Core Components

### 1. UI Component (`/UI`)
**Full-stack web application** serving both candidates and administrators.

- **Frontend**: React-based interview interface with real-time audio/video capabilities
- **Backend**: Node.js/Express API server with MongoDB integration
- **Key Features**:
  - Interactive interview sessions with AI-powered conversations
  - Administrative dashboard for user and interview management
  - Microsoft SSO integration for enterprise authentication
  - Real-time speech processing and response generation

### 2. Cloud Functions (`/Cloud-Functions`)
**Microservices ecosystem** powering the AI interview engine with 8 specialized services:

#### Core AI Services
- **`savant-claude`**: Interactive interview chat engine using Claude AI for real-time candidate conversations
- **`savant-cl-process`**: Cover letter analysis and personalized question generation system
- **`savant-coverletter-eval`**: AI courtroom debate system for cover letter quality assessment

#### Audio Processing Services
- **`savant-stt`**: Speech-to-text transcription service proxying to Whisper API
- **`savant-tts`**: Text-to-speech conversion using Google Cloud Wavenet voices

#### Support Services
- **`savant-scheduler`**: Centralized credential management with secure AWS key rotation
- **`savant-check-interviewcompletion`**: Interview completion status analysis using AI

#### Security & Infrastructure
- All services use Google Cloud OIDC authentication
- Encrypted credential rotation and Fernet encryption
- MongoDB integration for persistent data storage
- AWS Bedrock integration for Claude AI access

### 3. Whisper-Docker (`/Whisper-Docker`)
**Containerized speech recognition service** providing high-performance audio transcription.

- **Technology**: OpenAI Whisper with GPU acceleration support
- **Architecture**: Dockerized FastAPI service with CUDA optimization
- **Integration**: Serves as the audio processing backend for the STT service

## System Workflow

### Interview Process Flow
1. **Candidate Registration**: Web interface with profile setup and document upload
2. **Interview Assignment**: Administrative assignment of role-specific interview slots
3. **Session Initialization**: Cover letter processing and question generation
4. **AI Interview**: Real-time conversation with Claude AI interviewer
5. **Audio Processing**: Speech-to-text and text-to-speech for voice interactions
6. **Evaluation**: AI-powered assessment and scoring
7. **Results**: Comprehensive feedback and performance analytics

### Technical Data Flow
```
Candidate Audio → Whisper-Docker → savant-stt → UI Backend
                                                     ↓
UI Frontend ← savant-tts ← savant-claude ← MongoDB Database
                              ↓
                    savant-cl-process ← Cover Letter Analysis
                              ↓
                    savant-scheduler ← AWS Credential Management
```

## Key Technologies

### Frontend & UI
- **React 18.2.0** with Redux state management
- **Bootstrap 5** for responsive design
- **WebRTC** for real-time audio/video capture
- **Axios** for API communication

### Backend & APIs
- **Node.js 20** with Express.js framework
- **Google Cloud Functions** (Python 3.12)
- **FastAPI** for Whisper service
- **MongoDB** with Mongoose ODM

### AI & Machine Learning
- **Claude AI** (Anthropic) via AWS Bedrock
- **OpenAI Whisper** (Distil-Whisper large-v3)
- **Google Cloud Text-to-Speech** (Wavenet)
- **Custom AI agents** for debate-based evaluation

### Cloud & Infrastructure
- **Google Cloud Platform**: App Engine, Cloud Functions, Cloud Storage
- **AWS Bedrock**: Claude AI model access
- **Docker**: Containerization for Whisper service
- **Redis**: Credential queue management

## Deployment Architecture

### Production Environment
- **UI**: Google App Engine with VPC connector
- **Cloud Functions**: Serverless deployment across 8 services
- **Database**: MongoDB Atlas with replica sets
- **Audio Service**: Dockerized Whisper on GPU-enabled compute
- **Storage**: Google Cloud Storage for interview recordings

### Security Features
- **Microsoft Azure AD SSO** integration
- **Fernet encryption** for sensitive data
- **CORS protection** and request validation
- **Automated credential rotation**
- **VPC network isolation**

## Use Cases

### For Organizations
- **Technical Role Assessment**: Automated evaluation of programming and technical skills
- **Behavioral Analysis**: AI-powered soft skills assessment
- **Bulk Candidate Processing**: Scalable interview management
- **Performance Analytics**: Comprehensive reporting and leaderboards

### For Candidates
- **Interactive AI Interviews**: Natural conversation with AI interviewer
- **Multi-modal Assessment**: Voice, text, and document-based evaluation
- **Real-time Feedback**: Immediate response and guidance
- **Comprehensive Results**: Detailed performance analysis

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- MongoDB
- Google Cloud Platform account
- AWS account (for Bedrock access)
- Docker (for Whisper service)

### Quick Start
1. **Clone the repository**
2. **UI Setup**: Navigate to `/UI` and follow setup instructions
3. **Cloud Functions**: Deploy services following individual README guides
4. **Whisper Service**: Build and deploy the Docker container
5. **Configuration**: Set up environment variables and credentials

### Documentation
Each component contains detailed README files with:
- Installation and setup instructions
- API documentation and endpoints
- Configuration and environment variables
- Deployment guides and troubleshooting

## Architecture Benefits

- **Scalability**: Microservices architecture allows independent scaling
- **Reliability**: Redundant services and automated failover
- **Security**: Multi-layer authentication and encryption
- **Flexibility**: Modular design supports different interview types
- **Performance**: Optimized audio processing and AI response times

## Contributing

This project follows enterprise development standards with comprehensive documentation, testing, and security practices. Each component maintains its own contribution guidelines and development workflows.

---

**Author**: Aditi Chatterjee
**Organization**: Cognizant
**Version**: 2.0
**License**: ISC