import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import { faArrowLeft, faCheck, faTimes, faCircleNotch } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from "../AuthContext"; 
import { updateInterviewCompleted, updateInterviewStartEndTime, uploadCoverletter, getReqdFields } from "../../Actions/UserActions";
import moment from 'moment-timezone';
import swal from 'sweetalert';


const InterviewInstructionScreen = () => {
  const { userInfo, setUserInfo, setSessionData } = useContext(AuthContext);
  const [isInstructionsChecked, setIsInstructionsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uuid } = useParams();

  const reqdFieldsData = useSelector((state) => state.getReqdFields.reqFields);

  let displayStartDate, displayEndDate, displayStartTime, displayEndTime;
  
  useEffect(() => {
    // Don't try to fetch if userInfo isn't available yet
    if (!userInfo) {
      navigate("/login");
      return;
    }
    
    const fetchReqdFields = async () => {
      setIsLoading(true);
      try {
        // Force a fresh fetch of required fields
        await dispatch(getReqdFields(userInfo._id, uuid));
      } catch (error) {
        console.error("Error fetching required fields:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReqdFields();
  }, [navigate, userInfo, dispatch, uuid]);

  const handleInterviewTimeSlot = () => {           
    if (reqdFieldsData?.assigned_interview_start_time && reqdFieldsData?.interview_date && reqdFieldsData?.assigned_interview_end_time) {          
      const userTimezone = moment.tz.guess();            
      const serverTimezone = 'Asia/Kolkata';     
      let [startTime, startPeriod] = reqdFieldsData.assigned_interview_start_time.split(' ');            
      let [startHours, startMinutes] = startTime.split(':');            
      startHours = startPeriod === 'PM' && startHours !== '12' ? parseInt(startHours, 10) + 12 : startHours;          
      startMinutes = parseInt(startMinutes, 10) || 0;            
      let [endTime, endPeriod] = reqdFieldsData.assigned_interview_end_time.split(' ');            
      let [endHours, endMinutes] = endTime.split(':');            
      endHours = endPeriod === 'PM' && endHours !== '12' ? parseInt(endHours, 10) + 12 : endHours;          
      endMinutes = parseInt(endMinutes, 10) || 0;            
      let interviewDateParts = reqdFieldsData.interview_date.split(' - ');            
      let interviewDate = moment.tz(`${interviewDateParts[2]}-${interviewDateParts[1]}-${interviewDateParts[0]}`, serverTimezone);            
      let interviewStartTime = interviewDate.clone().set({hour: startHours, minute: startMinutes, second: 0, millisecond: 0});            
      let interviewEndTime = interviewDate.clone().set({hour: endHours, minute: endMinutes, second: 0, millisecond: 0});        
    
      if (interviewEndTime.isBefore(interviewStartTime)) {        
        interviewEndTime.add(1, 'day');        
      }         
      interviewStartTime = interviewStartTime.clone().tz(userTimezone);      
      interviewEndTime = interviewEndTime.clone().tz(userTimezone);      
      if (interviewEndTime.isBefore(interviewStartTime)) {  
        interviewStartTime.subtract(1, 'day');  
      }   
      displayStartDate = interviewStartTime.format('DD - MM - YYYY')
      displayEndDate = interviewEndTime.format('DD - MM - YYYY')
      displayStartTime = interviewStartTime.format('hh:mm A')
      displayEndTime = interviewEndTime.format('hh:mm A')
      let sysTime = moment().tz(userTimezone);      
         
      if (sysTime.isBetween(interviewStartTime, interviewEndTime, null, '[]')) {      
        return 0;    
      } else if (sysTime.isBefore(interviewStartTime)) {      
        return -1;   
      } else {      
        return 1;  
      }    
    }        
  };   

  const InterviewStarts = async() => {
    if (reqdFieldsData.interview_date == null || reqdFieldsData.assigned_interview_start_time == 'Not Assigned' || reqdFieldsData.assigned_interview_end_time == 'Not Assigned') {
      swal({      
        title: "Slot not assigned",      
        text: "Your interview slot is not scheduled. Kindly contact Admin.",      
        icon: "error",      
      }); 
    } else if (!reqdFieldsData.isCoverletter) {  
      swal({    
        title: "Pre-requisite: Coverletter",    
        text: "Please upload cover letter to proceed with interview.",    
        icon: "warning",    
      });  
    } else if (reqdFieldsData.interview_drive === "No drive") {  
      swal({  
        title: "No Interview Skill Assigned",  
        text: "To proceed with interview, kindly request admin to assign an interview skill.",  
        icon: "warning",  
      });  
    } else if (reqdFieldsData.interview_completed) {
      swal({      
        title: "Interview Attempt Over",                                        
        icon: "info",      
      });    
    } else {    
      const interviewSlot = handleInterviewTimeSlot();    
      if (interviewSlot === -1) {    
        swal({      
          title: "Please wait",      
          text: `Your interview is scheduled on ${displayStartDate} from ${displayStartTime} (local time) to ${displayEndTime} (local time). You will be able to start interview on ${displayStartDate} between ${displayStartTime} and ${displayEndTime} only.`,      
          icon: "warning",      
        });    
      } else if (interviewSlot === 1) {    
        swal({      
          title: "You are late",      
          text: `Your interview was scheduled on ${displayStartDate} between ${displayStartTime} (local time) to ${displayEndTime} (local time). You will NOT be able to access interview now due to being late. Contact Admin for any clarifications.`,      
          icon: "error",      
        });    
      } else {
        // Proceed with starting the interview
        const ctok = uuidv4(); 
        setUserInfo({ ...userInfo, CSRF_token: ctok });    
        const timestamp = new Date();
        var start_time = timestamp.toLocaleTimeString();
        const day = String(timestamp.getDate()).padStart(2, '0');
        const month = String(timestamp.getMonth() + 1).padStart(2, '0');
        const year = timestamp.getFullYear();
        const interview_date = `${day} - ${month} - ${year}`;
        try {
          // Update interview completed status
          await dispatch(updateInterviewCompleted(userInfo._id, uuid, false, ctok, setUserInfo));
          
          // Check if interview_start_time is already set
          if (reqdFieldsData.interview_start_time === "00:00:00 AM") {
            // If not set, update it
            await dispatch(updateInterviewStartEndTime(userInfo._id, uuid, start_time, '00:00:00 AM', interview_date, userInfo));
            
            // Fetch the updated reqdFields to get the new interview_start_time
            await dispatch(getReqdFields(userInfo._id, uuid));
          } else {
            // If already set, use the existing time
            start_time = reqdFieldsData.interview_start_time;
            swal({
              title: "Interview In Progress",
              text: "You're returning to an interview already in progress.",
              icon: "info",
            });
          }
          
          // Save session data to AuthContext
          const sessionKey = `interview_session_${uuid}`;
          const sessionData = {
            startTime: start_time,
            savedAt: new Date().toISOString(),
            csrfToken: ctok
          };
          setSessionData(sessionKey, sessionData);
          
          // Navigate to the interview screen with the start time (either new or existing)
          navigate(`/interview-sessions/${uuid}/interview/test`, {
            state: { interview_start_time: start_time }
          });
        } catch (error) {
          console.error("Error starting interview:", error);
          swal({
            title: "Error",
            text: "There was an error starting the interview. Please try again.",
            icon: "error",
          });
        }
      }
    }
  }
  

  const handleUploadCoverletter = () => {
    if (canReUpload === "RE-UPLOAD COVERLETTER") {
      swal({
        title: "Re-upload Coverletter?",
        text: "Are you sure you want to re-upload your coverletter? This new coverletter will be considered for your interview.",
        icon: "warning",
        buttons: ["No, cancel", "Yes, re-upload"],
        dangerMode: true,
      })
      .then((willReUpload) => {
        if (willReUpload) {
          navigate(`/interview-sessions/${uuid}/interview/instructions/upload-coverletter`);
        }
      });
    } else if (canReUpload === "UPLOAD COVERLETTER") {
      navigate(`/interview-sessions/${uuid}/interview/instructions/upload-coverletter`);
    }
  }

  const canReUpload = reqdFieldsData?.interview_start_time === "00:00:00 AM"
  ? (reqdFieldsData?.isCoverletter ? "RE-UPLOAD COVERLETTER" : "UPLOAD COVERLETTER")
  : "COVERLETTER SAVED";

  return (
    <div className="minheight white">
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <div className="text-center">
            <FontAwesomeIcon icon={faCircleNotch} spin size="3x" style={{color: "#0961b0", marginBottom: "15px"}} />
            <h4>Loading Interview Details</h4>
            <p>Please wait while we prepare your interview session...</p>
          </div>
        </div>
      ) : (
      <Container>

        <Button className='btn btn-outline-light mt-3 mb-1 py-2'>    
            <a href={`/interview-sessions`} className='home-link'>
              <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> SESSIONS
            </a>
        </Button> 

        <Row className="d-flex justify-content-center align-items-center mb-5">
          <Col
            md={10}
            className="d-flex justify-content-center align-items-center mx-auto"
          >
            <Card className='quizCard'>
              <div className='content' style={{ color: "#08084c" }}>
                <h4
                  className='quizCardHeader'
                  style={{
                    color: "#08084c",
                    fontWeight: "700",
                    textAlign: "left",
                    paddingBottom: "1.5rem",
                    marginBottom: "1.2rem",
                  }}
                >
                  Instructions
                </h4>
                <ol className='instructionsLI'>
                <li>Dress formally and ensure <b style={{ color: "#0961b0" }}>camera and microphone remain ON</b> throughout.</li>
                <li>Initiate interview by saying <b style={{ color: "#0961b0" }}>"Hello"</b> (omit your name).</li>
                <li><b style={{ color: "#0961b0" }}>Click the microphone</b> to record your answer/response.</li>
                <li>Wait for your answer to appear in text form (transcript). The <b style={{ color: "#0961b0" }}>'CopyPaste'</b> button will be <b style={{ color: "#5D5D8B" }}>disabled</b> during this time.</li>
                <li>When transcript is ready, the <b style={{ color: "#0961b0" }}>'CopyPaste'</b> button will be <b style={{ color: "#08084e" }}>enabled</b>. Click it to move your answer to the text box.</li>
                <li>Edit your answer in the text box if needed. For long answers, click <b style={{ color: "#0961b0" }}>See Full Response</b> button.</li>
                <li>For code questions: record your explanation first, paste it in the text area, then add your code.</li>
                <li><b style={{ color: "#0961b0" }}>DO NOT</b> close browser mid-interview; your session will be invalidated.</li>
                <li>When finished, <b style={{ color: "#0961b0" }}>click END INTERVIEW</b> button. This is required to complete your interview.</li>
                <li>Coverletter status: {reqdFieldsData?.isCoverletter ? (
                        <>
                          Uploaded <FontAwesomeIcon icon={faCheck} style={{ color: 'green' }} />
                        </>
                      ) : (
                        <>
                          Not uploaded <FontAwesomeIcon icon={faTimes} style={{ color: 'red' }} />
                        </>
                      )}
                  </li>
                </ol>
                <br></br>
                <Form>
                  <Form.Check
                    type="checkbox"
                    label="I accept the T&C before starting the interview"
                    checked={isInstructionsChecked}
                    onChange={() => setIsInstructionsChecked(!isInstructionsChecked)}
                  />
                </Form>

                <div className='text-center mt-4'>
                  <Button
                    variant='outline-primary'
                    className='mb-4 mt-2'
                    size='md'
                    onClick={handleUploadCoverletter}
                    disabled={canReUpload === "COVERLETTER SAVED"}
                  >
                    {canReUpload}
                  </Button>
                </div>

                <div className='text-center'>
                  <Button
                    variant='outline-light'
                    className='mb-4 mt-2'
                    size='md'
                    disabled={!isInstructionsChecked || !reqdFieldsData?.isCoverletter}
                    onClick={InterviewStarts}
                  >
                    INTERVIEW
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
      )}
    </div>
  );
};

export default InterviewInstructionScreen;