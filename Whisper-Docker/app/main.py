# dependencies
import uvicorn
from starlette.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile
import os

# .py files imported
from . import speech2text
from fastapi.routing import APIRouter

from pydantic import BaseModel
from typing import Optional

class InputData(BaseModel):
    data: str

app = FastAPI(
    title="Combined API",
    description="An API for converting text to speech using VITS model and speech to text using WHISPER model"
)

# WHISPER Speech2Text app
whisper_app = APIRouter()
file_path = str()

@whisper_app.get("/", tags=["Welcome message"])
async def read_root():
    message = "This code translates speech to text using WHISPER"
    return {"message": message}

@whisper_app.post("/uploadAudioBlob")
async def upload(file: UploadFile = File(...)):
    global file_path
    a = file.file
    file_name = file.filename
    file_bytes = a.read()
    file_path = os.path.join('app/Candidate_Audio', file_name)
    with open(file_path, "wb") as f:
        # Write the bytes to the file and check the return value
        num_bytes_written = f.write(file_bytes)
        if num_bytes_written != len(file_bytes):
            print("Error: Not all bytes were written to the file")
    
    res = speech2text.whisper_transcribe(file_path)

    if os.path.exists(file_path):
            os.remove(file_path) # delete the file
    return res
    
app.include_router(whisper_app, prefix="/whisper")

# Add middleware for both apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)