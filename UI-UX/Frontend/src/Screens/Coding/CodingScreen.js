import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import CodingChat from "./CodingChat";
import CandidateVideo from "../Interview/CandidateVideo";
import { Button, Container, Row, Card } from "react-bootstrap";
import "./coding.css";
import { useDispatch } from "react-redux";
import { updateInterviewCompleted, updateInterviewStartEndTime } from "../../Actions/UserActions";
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "../AuthContext";
import swal from "sweetalert";
import moment from 'moment-timezone';

// Simple error boundary component to catch and handle errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in error boundary:", error);
    console.error("Error info:", errorInfo);
    
    // Notify parent component about the error if callback provided
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return null; // Parent will handle the UI
    }
    return this.props.children;
  }
}

const CodingScreen = () => {
  // Global error boundary for component
  const [hasError, setHasError] = useState(false);
  const [endSession, setEndSession] = useState(false);
  const { userInfo, setUserInfo } = useContext(AuthContext); 
  const [hasAccess, setHasAccess] = useState(false);
  const [timeBasedEnable, setTimeBasedEnable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uuid } = useParams();

  const location = useLocation();
  const session_start_time = location.state?.session_start_time;

  const checkCameraMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Camera access granted", stream);
      stream.getTracks().forEach(track => track.stop());
      setHasAccess(true);
    } catch (error) {
      console.error('Camera access denied', error);
      setHasAccess(false);
    }
  };

  // Authentication and camera access check
  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    } else {
      const loadSession = async () => {
        setIsLoading(true);
        await checkCameraMicAccess();
        setIsLoading(false);
      };
      loadSession();
    }
  }, [navigate, userInfo]);

  // Log hasAccess state changes
  useEffect(() => {
    console.log("has camera access:", hasAccess);
  }, [hasAccess]);

  // Time-based logic for enabling end session button
  useEffect(() => {
    if (session_start_time) {
      console.log('Session start time:', session_start_time);
      const checkTime = () => {
        const startTime = moment(session_start_time, "hh:mm:ss A");
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
  }, [session_start_time]);


  const handleEndSessionClick = useCallback(() => {
    swal({
      title: "End Coding Test?",
      text: "Are you sure you want to exit? Your solutions will be submitted for evaluation.",
      icon: "warning",
      buttons: ["No, cancel", "Yes, submit"],
      dangerMode: true,
    })
    .then((willEnd) => {
      if (willEnd) {
        setEndSession(true);
        SessionEnds();
      }
    });
  }, []);

  const SessionEnds = useCallback(async() => {
    const timestamp = new Date();
    var end_time = timestamp.toLocaleTimeString();
    // Don't set CSRF token to null directly in state as it needs to be sent in the API call
    dispatch(updateInterviewCompleted(userInfo._id, uuid, true, userInfo.CSRF_token, setUserInfo));
    dispatch(updateInterviewStartEndTime(userInfo._id, uuid, '00:00:00 AM', end_time, userInfo));
    // After interview is completed, CSRF token will be updated by the action
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
        <a href={`/coding-sessions/${uuid}/coding/instructions`} className='home-link'>
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

  return (
    <>
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" style={{color: "#0961b0", marginBottom: "15px"}} />
            <h4>Preparing Your Coding Test</h4>
            <p>We're setting up your session. This should only take a moment.</p>
          </div>
        </div>
      ) : !hasAccess ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <MessageCard>
            <h2>Camera Access Required</h2>
            <p>We couldn't access your camera. Please ensure you've granted permission and try again.</p>
            <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
          </MessageCard>
        </div>
      ) : (
      <Container className="h-100 d-flex justify-content-center align-items-center">
        <Row className="d-flex justify-content-center align-items-center">
          <div>
          {hasError ? (
            <ContentWrapper>
              <MessageCard>
                <h3>We encountered an error</h3>
                <p>There was a problem loading your coding session.</p>
                <div className="d-flex justify-content-center mt-4">
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Clear any problematic local storage
                      try {
                        localStorage.removeItem(`codingChatMessages_${uuid}`);
                        localStorage.removeItem(`codingChatHistory_${uuid}`);
                      } catch (err) {
                        console.warn('Error clearing storage:', err);
                      }
                      
                      // Return to instructions page
                      navigate(`/coding-sessions/${uuid}/coding/instructions`);
                    }}
                  >
                    Return to Instructions
                  </Button>
                </div>
              </MessageCard>
            </ContentWrapper>
          ) : endSession ? (
            <ContentWrapper>
              <MessageCard>
                <p>
                  Thank you for completing the coding test. Your solutions have been submitted for evaluation.
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate('/coding-sessions', { state: { refresh: true } })}
                  >
                    Return to Sessions
                  </Button>
                </p> 
              </MessageCard>  
            </ContentWrapper>
          ) : (
            <div className="coding-box">
              <div className="candidate-video">
                <CandidateVideo />
              </div>
              <div className="chat">
                <Button
                  className="end-test-button"
                  variant="outline-light"
                  size="md"
                  style={{
                    float: "right",
                    margin: "10px 10px 5px 0px",
                    height: "50%",
                    padding: "15px 10px 15px 10px"
                  }}
                  onClick={handleEndSessionClick}
                  //disabled={!timeBasedEnable}
                >
                  End Test
                </Button>
                {uuid && session_start_time ? (
                  // Wrap the CodingChat component in an error boundary
                  <ErrorBoundary onError={() => setHasError(true)}>
                    <CodingChat 
                      uuid={uuid} 
                      startTime={session_start_time}
                    />
                  </ErrorBoundary>
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
                              const savedSession = localStorage.getItem(`codingSession_${uuid}`);
                              if (savedSession) {
                                const sessionData = JSON.parse(savedSession);
                                
                                // Make sure session data has valid startTime before proceeding
                                if (sessionData && sessionData.startTime) {
                                  localStorage.setItem(`recoveryAttempt_${uuid}`, new Date().toISOString());
                                  localStorage.removeItem(`codingChatMessages_${uuid}`); // Clear potentially corrupted messages
                                  
                                  navigate(`/coding-sessions/${uuid}/coding/instructions`);
                                  return;
                                }
                              }
                              
                              // If we got here, go back to instructions
                              navigate(`/coding-sessions/${uuid}/coding/instructions`);
                            } catch (err) {
                              console.error("Error recovering session:", err);
                              navigate(`/coding-sessions/${uuid}/coding/instructions`);
                            }
                          }}
                        >
                          Recover Session
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => navigate(`/coding-sessions`)}
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

export default CodingScreen;