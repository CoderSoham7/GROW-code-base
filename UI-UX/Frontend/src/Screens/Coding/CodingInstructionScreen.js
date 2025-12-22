import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import { faArrowLeft, faCheck, faTimes, faCircleNotch } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from "../AuthContext"; 
import { updateInterviewCompleted, updateInterviewStartEndTime, getReqdFields } from "../../Actions/UserActions";
import moment from 'moment-timezone';
import swal from 'sweetalert';

const CodingInstructionScreen = () => {
  const { userInfo, setUserInfo } = useContext(AuthContext);
  const [isInstructionsChecked, setIsInstructionsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uuid } = useParams();

  const reqdFieldsData = useSelector((state) => state.getReqdFields.reqFields);

  let displayStartDate, displayEndDate, displayStartTime, displayEndTime;
  
  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
      return;
    }
    
    const fetchReqdFields = async () => {
      setIsLoading(true);
      try {
        await dispatch(getReqdFields(userInfo._id, uuid));
      } catch (error) {
        console.error("Error fetching required fields:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReqdFields();
  }, [navigate, userInfo, dispatch, uuid]);

  const handleTimeSlot = () => {                    
    if (reqdFieldsData.assigned_interview_start_time && reqdFieldsData.interview_date && reqdFieldsData.assigned_interview_end_time) {            
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

  const SessionStarts = async() => {
    if (reqdFieldsData.interview_date == null || reqdFieldsData.assigned_interview_start_time == 'Not Assigned' || reqdFieldsData.assigned_interview_end_time == 'Not Assigned') {
      swal({      
        title: "Session not scheduled",      
        text: "Your coding session is not scheduled. Kindly contact Admin.",      
        icon: "error",      
      }); 
    } else if (reqdFieldsData.interview_drive === "No drive") {  
      swal({  
        title: "No Coding Test Assigned",  
        text: "To proceed with coding test, kindly request admin to assign a test.",  
        icon: "warning",  
      });  
    } else if (reqdFieldsData.interview_completed) {
      swal({      
        title: "Coding Test Attempt Over",                                        
        icon: "info",      
      });    
    } else {    
      const timeSlot = handleTimeSlot();    
      if (timeSlot === -1) {    
        swal({      
          title: "Please wait",      
          text: `Your coding test is scheduled on ${displayStartDate} from ${displayStartTime} (local time) to ${displayEndTime} (local time). You will be able to start the test on ${displayStartDate} between ${displayStartTime} and ${displayEndTime} only.`,      
          icon: "warning",      
        });    
      } else if (timeSlot === 1) {    
        swal({      
          title: "You are late",      
          text: `Your coding test was scheduled on ${displayStartDate} between ${displayStartTime} (local time) to ${displayEndTime} (local time). You will NOT be able to access the test now due to being late. Contact Admin for any clarifications.`,      
          icon: "error",      
        });    
      } else {
        // Proceed with starting the coding session
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
              title: "Coding Session In Progress",
              text: "You're returning to a coding session already in progress.",
              icon: "info",
            });
          }
          
          // Save session information to localStorage for recovery
          try {
            localStorage.setItem(`codingSession_${uuid}`, JSON.stringify({
              startTime: start_time,
              savedAt: new Date().toISOString()
            }));
          } catch (err) {
            console.warn('Could not save session to localStorage:', err);
          }
          
          // Navigate to the coding screen with the start time (either new or existing)
          navigate(`/coding-sessions/${uuid}/coding/test`, {
            state: { session_start_time: start_time }
          });
        } catch (error) {
          console.error("Error starting coding session:", error);
          swal({
            title: "Error",
            text: "There was an error starting the coding session. Please try again.",
            icon: "error",
          });
        }
      }
    }
  }
  
  return (
    <div className="minheight white">
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <div className="text-center">
            <FontAwesomeIcon icon={faCircleNotch} spin size="3x" style={{color: "#0961b0", marginBottom: "15px"}} />
            <h4>Loading Test Details</h4>
            <p>Please wait while we prepare your coding test...</p>
          </div>
        </div>
      ) : (
      <Container>
        <Button className='btn btn-outline-light mt-3 mb-1 py-2'>    
            <a href={`/coding-sessions`} className='home-link'>
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
                  Coding Test Instructions
                </h4>
                <ol className='instructionsLI'>
                  <li><b style={{ color: "#0961b0" }}>This is a technical coding assessment</b> to evaluate your programming skills.</li>
                  <li>The test consists of <b style={{ color: "#0961b0" }}>multiple programming questions</b> to solve.</li>
                  <li>Use the <b style={{ color: "#0961b0" }}>text editor</b> to write and submit your solutions.</li>
                  <li>You may be asked to solve problems related to <b style={{ color: "#0961b0" }}>data structures, algorithms, or specific programming concepts</b>.</li>
                  <li>Please <b style={{ color: "#0961b0" }}>read each question carefully</b> before attempting to solve it.</li>
                  <li>Your solutions should be <b style={{ color: "#0961b0" }}>complete, correct, and efficient</b>.</li>
                  <li><b style={{ color: "#0961b0" }}>DO NOT</b> close browser mid-test; your session will be invalidated.</li>
                  <li>When finished, <b style={{ color: "#0961b0" }}>click END TEST</b> button to submit all your solutions.</li>
                </ol>
                <br></br>
                <Form>
                  <Form.Check
                    type="checkbox"
                    label="I accept the T&C before starting the coding test"
                    checked={isInstructionsChecked}
                    onChange={() => setIsInstructionsChecked(!isInstructionsChecked)}
                  />
                </Form>

                <div className='text-center'>
                  <Button
                    variant='outline-light'
                    className='mb-4 mt-4'
                    size='md'
                    disabled={!isInstructionsChecked}
                    onClick={SessionStarts}
                  >
                    START CODING TEST
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

export default CodingInstructionScreen;