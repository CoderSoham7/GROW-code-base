import { createContext } from 'react';  
  
const MediaRecorderContext = createContext({  
  mediaRecorder: null,  
  setMediaRecorder: () => {},  
  displayMediaStream: null,  
  setDisplayMediaStream: () => {},  
  userMediaStream: null,  
  setUserMediaStream: () => {}  
});  
  
export default MediaRecorderContext;  
