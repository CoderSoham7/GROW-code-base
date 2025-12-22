import React, { useState, useEffect, useContext, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Chat from "./Chat"
import CandidateVideo from "./CandidateVideo";
import { Button, Container, Row, Card } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { updateInterviewCompleted, updateInterviewStartEndTime } from "../../Actions/UserActions";
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 
import { AuthContext } from "../AuthContext";
import swal from "sweetalert";
import moment from 'moment-timezone';

const InterviewScreen = () => {
  const [endInterview, setEndInterview] = useState(false);
  const { userInfo, setUserInfo, getSessionData, removeSessionData } = useContext(AuthContext); 
  const [hasAccess, setHasAccess] = useState(false);
  const [chatComponentAllowsEnd, setchatComponentAllowsEnd] = useState(false);
  const [timeBasedEnable, setTimeBasedEnable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uuid } = useParams();

  const location = useLocation();
  
  // Get interview_start_time from location state or AuthContext backup
  let interview_start_time = location.state?.interview_start_time;
  
  // Try to recover from AuthContext if not available in location.state
  if (!interview_start_time) {
    const sessionKey = `interview_session_${uuid}`;
    const sessionData = getSessionData(sessionKey);
    
    if (sessionData && sessionData.startTime) {
      interview_start_time = sessionData.startTime;
      console.log("Recovered interview_start_time from AuthContext:", interview_start_time);
      
      // Also restore CSRF token if available
      if (sessionData.csrfToken && userInfo) {
        setUserInfo({
          ...userInfo,
          CSRF_token: sessionData.csrfToken
        });
      }
    }
  }

  const checkCameraMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("Camera and microphone access granted", stream);
      stream.getTracks().forEach(track => track.stop());
      setHasAccess(true);
    } catch (error) {
      console.error('Camera and microphone access denied', error);
      setHasAccess(false);
    }
  };

  // Authentication and camera/mic access check
  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    } else {
      const loadInterview = async () => {
        setIsLoading(true);
        await checkCameraMicAccess();
        setIsLoading(false);
      };
      loadInterview();
    }
  }, [navigate, userInfo]);

  // Log hasAccess state changes
  useEffect(() => {
    console.log("has camera/mic access:", hasAccess);
  }, [hasAccess]);

  // Time-based logic for enabling end interview button
  useEffect(() => {
    if (interview_start_time) {
      console.log('Interview start time:', interview_start_time);
      const checkTime = () => {
        const startTime = moment(interview_start_time, "hh:mm:ss A");
        const currentTime = moment();
        const timeDiff = currentTime.diff(startTime, 'minutes');
        
        if (timeDiff >= 30) {
          setTimeBasedEnable(true);
        }
      };

      const timer = setInterval(checkTime, 60000);
      checkTime(); // Initial check

      return () => clearInterval(timer);
    }
  }, [interview_start_time]);


  const handleEndInterviewClick = useCallback(() => {
    swal({
      title: "End Interview?",
      text: "Are you sure you want to exit? Have you ensured your interview has been completed in entirety?",
      icon: "warning",
      buttons: ["No, cancel", "Yes, exit"],
      dangerMode: true,
    })
    .then((willEnd) => {
      if (willEnd) {
        setEndInterview(true);
        InterviewEnds();
      }
    });
  }, []);

  const InterviewEnds = useCallback(async() => {
    const timestamp = new Date();
    var end_time = timestamp.toLocaleTimeString();
    
    // Don't clear session data - it's only cleared on logout
    
    setUserInfo({ ...userInfo, CSRF_token: null });  
    dispatch(updateInterviewCompleted(userInfo._id, uuid, null, setUserInfo));
    dispatch(updateInterviewStartEndTime(userInfo._id, uuid, '00:00:00 AM', end_time, userInfo));
  }, [dispatch, setUserInfo, userInfo, uuid]);

  const [formLink, setFormLink] = useState('');  
    
  const handleSelect = (e) => {  
    setFormLink(e.target.value);  
    if (e.target.value) {  
      window.open(e.target.value, "_blank");  
    }  
  };  

  const MessageCard = ({ children }) => (
    <Card className='text-center' style={{
      maxWidth: "60rem",
      width: "100%",
      fontSize: "20px",
      textAlign: "justify",
      textJustify: "inter-word",
      padding: "25px",
      color: "#08084e",
      borderColor: "#a1a7ab",
      borderWidth: "2px",
      borderRadius: "0"
    }}>
      {children}
    </Card>
  );
  
  const BackButton = ({ uuid }) => (
    <div className="w-100 text-left mb-3 mt-3">
      <Button 
        className='btn btn-outline-light py-2 px-4'
        style={{ width: 'auto' }}
      >    
        <a href={`/interview-sessions/${uuid}/interview/instructions`} className='home-link'>
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> BACK
        </a>
      </Button>
    </div>
  );
  
  const ContentWrapper = ({ children }) => (
    <Container className="h-100 d-flex flex-column justify-content-center align-items-center">
      <Row className="w-100 d-flex flex-column justify-content-center align-items-center">
        <BackButton uuid={uuid} />
        {children}
      </Row>
    </Container>
  );

  // Loading and access check handled in the return statement now

  console.log("chatComponentAllowsEnd:",chatComponentAllowsEnd)
  console.log("timeBasedEnable:",timeBasedEnable) 
  return (
    <>
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" style={{color: "#0961b0", marginBottom: "15px"}} />
            <h4>Preparing Your Interview</h4>
            <p>We're setting up your session. This should only take a moment.</p>
          </div>
        </div>
      ) : !hasAccess ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <MessageCard>
            <h2>Camera and Microphone Access Required</h2>
            <p>We couldn't access your camera or microphone. Please ensure you've granted permission and try again.</p>
            <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
          </MessageCard>
        </div>
      ) : (
      <Container className="h-100 d-flex justify-content-center align-items-center">
        <Row className="d-flex justify-content-center align-items-center">
          <div>
            {endInterview ? (
              <ContentWrapper>
                <MessageCard>
                  <p>
                    Thank you for interviewing with Cognizant Technology Solutions. Kindly fill the Feedback Form.
                    <br /><br />
                    NOTE:
                    <ul>                  
                      <li>If you are are part of BOT testing, select "BOT Testing Feedback". </li>
                      <li>If you are part of the GROW assessments, select "GROW Assessment Feedback".</li>
                      <li>Only fill 1 feedback form.</li>
                    </ul>
                    <br />
                    <select onChange={handleSelect} value={formLink} className="dropdown-btn">  
                      <option value="">Select a form</option>  
                      <option value="https://forms.office.com/r/T4x1xGCczp">BOT Testing (UAT) Feedback</option>  
                      <option value="https://forms.office.com/r/3xeqNUJGCu">GROW Assessment Feedback</option>  
                    </select>
                  </p> 
                </MessageCard>  
              </ContentWrapper>
            ) : (
              <div className="interview-box">
                <div className="candidate-video">
                  <CandidateVideo />
                </div>
                <div className="chat">
                  <Button
                    className="end-interview-button"
                    variant="outline-light"
                    size="md"
                    style={{
                      float: "right",
                      margin: "10px 10px 5px 0px",
                      height: "50%",
                      padding: "15px 10px 15px 10px"
                    }}
                    onClick={handleEndInterviewClick}
                    //disabled={!chatComponentAllowsEnd && !timeBasedEnable}
                  >
                    End Interview
                  </Button>
                  {uuid && interview_start_time ? (
                    <Chat 
                      setchatComponentAllowsEnd={setchatComponentAllowsEnd} 
                      uuid={uuid} 
                      startTime={interview_start_time}
                    />
                  ) : (
                    <div className="network-error-container">
                      <div className="network-error-message">
                        <h3>Connection Issue Detected</h3>
                        <p>Session information could not be loaded. This may be due to network connectivity issues.</p>
                        <div className="network-error-actions">
                          <Button 
                            variant="primary" 
                            className="retry-btn"
                            onClick={() => {
                              // Try to recover the session from localStorage and ensure we have all required data
                              try {
                                const savedSession = localStorage.getItem(`interviewSession_${uuid}`);
                                if (savedSession) {
                                  const sessionData = JSON.parse(savedSession);
                                  
                                  // Make sure session data has valid startTime before proceeding
                                  if (sessionData && sessionData.startTime) {
                                    localStorage.setItem(`interviewRecoveryAttempt_${uuid}`, new Date().toISOString());
                                    
                                    navigate(`/interview-sessions/${uuid}/interview/instructions`);
                                    return;
                                  }
                                }
                                
                                // If we got here, go back to instructions
                                navigate(`/interview-sessions/${uuid}/interview/instructions`);
                              } catch (err) {
                                console.error("Error recovering session:", err);
                                navigate(`/interview-sessions/${uuid}/interview/instructions`);
                              }
                            }}
                          >
                            Recover Session
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => navigate(`/interview-sessions`)}
                          >
                            Back to Sessions
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>            
              </div>
            )}
          </div>        
        </Row>
      </Container>
      )}
    </>
  );
};

export default InterviewScreen;