import React, { useState, useEffect } from "react";
import useMic from "./Interview_Hooks/useMic";
import ChatContext from './ChatContext';
import { Button, Card } from "react-bootstrap";
import { faCheck, faClone, faCopy, faMicrophone, faMicrophoneSlash, faStopCircle } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 

const VoiceRecorder = ({ onCopy }) => {
  const candidateTxt = React.useContext(ChatContext);
  const [userspeech, audioURL, isRecording, startRecording, stopRecording] = useMic();
  const [isSpeechPresent, setIsSpeechPresent] = useState(false);
  const [wasCopyButtonClicked, setWasCopyButtonClicked] = useState(false);
  const [icon, setIcon] = useState(faCopy);  
  const [buttonText, setButtonText] = useState('Copy-Paste');

  useEffect(() => {
    setIsSpeechPresent(!!userspeech);
  }, [userspeech]);

  const CopyPaste = () => {  
    const trimmedSpeech = userspeech.trim();
    navigator.clipboard.writeText(trimmedSpeech);  
    setIcon(faCheck);  
    setButtonText('Done!');  
    setWasCopyButtonClicked(true);  
    onCopy(true, trimmedSpeech);  
  
    setTimeout(() => {  
      setIcon(faClone);  
      setButtonText('Copy-Paste');  
    }, 2000);  
  
    setTimeout(() => {  
      setIsSpeechPresent(false);  
    }, 5000);  

    candidateTxt.current.value = trimmedSpeech;  
  }  

  return (
    <div className="interview-footer">
      <div id="stt-response" className="form-text my-2">
        <b>STEP 1:</b> Click mic. Record your response. Close mic. Transcript will then be generated in below text area. Then Click 'CopyPaste' button.
      </div>
      <div className="d-flex">
        <Card className="stt-card" aria-describedby="stt-response">
          <Button  
            id="copy-paste-button"  
            onClick={CopyPaste}  
            disabled={!isSpeechPresent}  
          >  
            <FontAwesomeIcon icon={icon} /> {buttonText}  
          </Button>
          <p id="user-speech">{isSpeechPresent ? userspeech : ''}</p>
        </Card>

        {!isRecording ? (
          <Button
            variant="outline-light"
            className="chat-send-btn mb-4 mt-1"
            size="md"
            onClick={startRecording}
            disabled={isRecording}
          >
            <FontAwesomeIcon icon={faMicrophoneSlash}/>
          </Button>
        ) : (
          <Button
            variant="outline-light"
            className="chat-send-btn mb-4 mt-1"
            size="md"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            <FontAwesomeIcon icon={faStopCircle} className="record-icon"/>
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;