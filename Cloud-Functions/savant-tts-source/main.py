import functions_framework
from google.cloud import texttospeech
from google.oauth2 import service_account
import io
import base64
import re
import html

client = texttospeech.TextToSpeechClient()

def google_tts(text):
    text = html.unescape(text)
    text = re.sub(r'\bML\b', 'em el', text) # set custom pronounciations for abbreviations using SSML
    text = re.sub(r'\bGUI\b', 'ji yu i', text)
    text = re.sub(r'\bMS\b', 'em es', text)
    text = re.sub(r'\bBI\b', 'be i', text)
    text = re.sub(r'\bUX\b', 'yu ex', text)
    text = re.sub(r'\bUI\b', 'yu i', text)
    text = re.sub(r'\b(?:Abinitio|Ab\s+Initio)\b', 'ab ini shio', text, flags=re.IGNORECASE)
    
    synthesis_input = texttospeech.SynthesisInput(text=text)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = texttospeech.VoiceSelectionParams(  
        language_code="en-GB",   
        name="en-GB-Wavenet-C",  
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    ) 

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    # Save the response to a BytesIO buffer
    audio_buffer = io.BytesIO(response.audio_content)

    # Encode the buffer content in base64 and create the data URL
    audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode('utf-8')
    audio_data_url = f"data:audio/mp3;base64,{audio_base64}"

    return audio_data_url


@functions_framework.http
def readtext(request):
  # Set CORS headers for all responses, including errors
  headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS", # You are using POST
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600",
  }

  if request.method == "OPTIONS":
    return ("", 204, headers)

  # Check for POST request
  if request.method != "POST":
      return ('Method Not Allowed', 405, headers)

  request_json = request.get_json(silent=True)
  if request_json and 'data' in request_json:
    data = request_json['data']
    audio_data_url = google_tts(data)
    return (audio_data_url, 200, headers)
  else:
    return ('Please provide a JSON payload with a "data" key.', 400, headers)
