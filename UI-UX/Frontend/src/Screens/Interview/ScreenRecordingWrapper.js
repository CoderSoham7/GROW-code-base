import React, { useState } from 'react';  
import MediaRecorderContext from './MediaRecorderContext';  
  
const ScreenRecordingWrapper = ({ children }) => {  
  const [mediaRecorder, setMediaRecorder] = useState(null);  
  const [displayMediaStream, setDisplayMediaStream] = useState(null);  
  const [userMediaStream, setUserMediaStream] = useState(null);  
  
  return (  
    <MediaRecorderContext.Provider value={{  
      mediaRecorder, setMediaRecorder,  
      displayMediaStream, setDisplayMediaStream,  
      userMediaStream, setUserMediaStream  
    }}>  
      {children}  
    </MediaRecorderContext.Provider>  
  );  
};  
  
export default ScreenRecordingWrapper;  
