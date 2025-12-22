import React, { useRef, useContext } from "react";
import { useSelector } from "react-redux";
import Webcam from "react-webcam";
import { faVideoCamera } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from "../AuthContext";

const videoConstraints = {
  width: 360,
  height: 600,
  facingMode: "user"
};

const CandidateVideo = () => {
  const { userInfo } = useContext(AuthContext);  
  const webcamRef = useRef(null);
  return (
    <div>
      <div className="name-tag">
        <div className="cand-name">
         <b> {userInfo.name} </b>
        </div>
      </div>
      <Webcam
        audio={false}
        ref={webcamRef}
        videoConstraints={videoConstraints}
      />
      <div className="mt-1">
        <FontAwesomeIcon icon={faVideoCamera} className="pt-3 px-3" style={{ color: "#08084e" }}/>
        Your video & audio are being recorded.
      </div>
    </div>
  );
};

export default CandidateVideo;
