import React, { useRef } from 'react';  
import MediaRecorderContext from './Screens/Interview/MediaRecorderContext';  
  
const withMediaRecorder = Component => {  
  return props => {  
    const mediaRecorderRef = useRef();  
  
    return (  
      <MediaRecorderContext.Provider value={mediaRecorderRef}>  
        <Component {...props} />  
      </MediaRecorderContext.Provider>  
    );  
  };  
};  
  
export default withMediaRecorder;  