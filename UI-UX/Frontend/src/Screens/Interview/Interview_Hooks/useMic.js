import React, { useState, useEffect, useRef, useContext} from 'react';
import { useSelector } from 'react-redux';
import WriteUserSpeech from "../../../Actions/WriteUserSpeech";
import { AuthContext } from '../../AuthContext';
const useMic = () => {
  const [audioURL, setAudioURL] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [userspeech, setUserspeech] = useState("");
  const { userInfo } = useContext(AuthContext);  
  useEffect(() => {
    if (recorder === null) {
      if (isRecording) {
        requestRecorder().then(setRecorder);
      }
      return;
    }
    if (isRecording) {
      recorder.start();
    } else {
      recorder.stop();
    }
    const handleData = async(e) => {
      const a = e.data;
      const audioBlob = new Blob([a], {'type': 'audio/wav'});
      setAudioURL(window.URL.createObjectURL(audioBlob)); 
      const formData = new FormData();
      const fileName = "cand_" + userInfo._id + ".wav"; 
      formData.append("file", audioBlob, fileName);
      const res = await WriteUserSpeech(userInfo.token, formData);
      setUserspeech(res); 
    };
    recorder.addEventListener("dataavailable", handleData);
    return () => recorder.removeEventListener("dataavailable", handleData);
  }, [recorder, isRecording]);

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return [userspeech, audioURL, isRecording, startRecording, stopRecording];
};

async function requestRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return new MediaRecorder(stream);
}

export default useMic;
