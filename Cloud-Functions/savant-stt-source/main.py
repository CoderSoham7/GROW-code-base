from flask import Request  
import functions_framework
import requests
from flask import jsonify  
import os
import re

@functions_framework.http  
def writeText(request: Request):  
    if request.method == "OPTIONS":  
        # Allows GET requests from any origin with the Content-Type  
        # header and caches preflight response for an 3600s  
        headers = {  
            "Access-Control-Allow-Origin": "*",  
            "Access-Control-Allow-Methods": "GET",  
            "Access-Control-Allow-Headers": "Content-Type",  
            "Access-Control-Max-Age": "3600",  
        }  
  
        return ("", 204, headers)  
  
    print("request:", request.data)  
 
    # Define allowlist of permitted URLs
    url = os.getenv('WHISPER_API_URL')

    # Validate URL against allowlist before proceeding
    if not url:
        return (jsonify({"error": "URL not in allowed"}), 403, {"Access-Control-Allow-Origin": "*"})
        
    print("Sending to whisper...") 
    audio_file = request.files['file']  
    print("request file:", audio_file) 
    response = requests.post(url, files = {'file': audio_file})
    transcript = response.text
    transcript = re.sub(r'^"|"$', '', transcript).strip()
    print(f'Transcript: {transcript}')
    
    # Validate response before returning
    if response.status_code != 200:
        return (jsonify({"error": "Error from whisper service"}), 500, {"Access-Control-Allow-Origin": "*"})
    headers = {"Access-Control-Allow-Origin": "*"}  
    return (jsonify({"transcript": transcript}), 200, headers) 