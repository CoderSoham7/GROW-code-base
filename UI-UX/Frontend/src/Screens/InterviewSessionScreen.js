import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from './AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleNotch, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment-timezone';
import { getReqdFields } from '../Actions/UserActions';
import swal from 'sweetalert';

const InterviewSessionScreen = () => {
  const { userInfo, loading, error, loadUser } = useContext(AuthContext);
  const dispatch = useDispatch();
  const reqdFieldsData = useSelector((state) => state.getReqdFields.reqFields);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userInfo && !loading) {
      loadUser();
    }
  }, [userInfo, loading, loadUser]);

  useEffect(() => {
    if (userInfo && userInfo.interviews) {
      setIsLoading(true);
      const promises = Object.keys(userInfo.interviews).map(uuid => 
        dispatch(getReqdFields(userInfo._id, uuid))
      );
      
      Promise.all(promises)
        .then(() => setIsLoading(false))
        .catch(() => setIsLoading(false));
    }
  }, [userInfo, dispatch]);
  
  // Filter out Python Programmer sessions as they belong to the coding section
  const filteredInterviews = userInfo && userInfo.interviews ? 
    Object.entries(userInfo.interviews).filter(([uuid, interview]) => {
      const sessionData = reqdFieldsData[uuid] || interview;
      return sessionData.interview_drive !== "Python Programmer";
    }) : [];

  if (loading && !userInfo) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
        <div className="text-center">
          <FontAwesomeIcon icon={faCircleNotch} spin size="3x" style={{color: "#0961b0", marginBottom: "15px"}} />
          <h4>Loading User Information</h4>
          <p>Please wait while we retrieve your user information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
        <div className="text-center">
          <h4>Error Loading Data</h4>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
        </div>
      </div>
    );
  }

  const checkDrive = (uuid, interviewData) => {
    if (interviewData.interview_drive.toLowerCase() === "no skill assigned") {
      swal({
        title: "Interview Drive Not Assigned",
        text: `Please contact admin and ask them to assign interview drive. Provide them your ID: ${userInfo.candidate_id} and Interview ID: ${uuid}`,
        icon: "warning",
        button: "OK"
      });
      return;
    }
    // Proceed to interview if drive is assigned
  };

  const getInterviewStatus = (interview) => {
    const userTimezone = moment.tz.guess();
    const interviewDate = moment.tz(`${interview.interview_date.replace(/\s/g, '')}`, 'DD-MM-YYYY', 'Asia/Kolkata');
    const startTime = moment.tz(`${interview.interview_date.replace(/\s/g, '')} ${interview.assigned_interview_start_time}`, 'DD-MM-YYYY hh:mm A', 'Asia/Kolkata');
    const endTime = moment.tz(`${interview.interview_date.replace(/\s/g, '')} ${interview.assigned_interview_end_time}`, 'DD-MM-YYYY hh:mm A', 'Asia/Kolkata');
    const currentTime = moment().tz(userTimezone);
  
    // Check if both conditions are met: interview_completed is true AND interview_end_time is not "00:00:00 AM"
    if (interview.interview_completed && interview.interview_end_time !== "00:00:00 AM") {
      return 'COMPLETED';
    } else if (interview.interview_start_time !== "00:00:00 AM") {
      if (interview.interview_end_time === "00:00:00 AM") {
        return 'INCOMPLETE_ACTIVE';
      } else {
        return 'INCOMPLETE_ABANDONED';
      }
    } else if (interview.interview_start_time === "00:00:00 AM" && interview.interview_end_time === "00:00:00 AM") {
      if (currentTime.isSameOrBefore(endTime)) {
        return 'SCHEDULED';
      } else {
        return 'NOT ATTENDED';
      }
    }
    return 'UNKNOWN';
  };
  
  const isButtonDisabled = (interview, status) => {
    const userTimezone = moment.tz.guess();
    const endTime = moment.tz(`${interview.interview_date.replace(/\s/g, '')} ${interview.assigned_interview_end_time}`, 'DD-MM-YYYY hh:mm A', 'Asia/Kolkata');
    const currentTime = moment().tz(userTimezone);
  
    switch(status) {
      case 'COMPLETED':
      case 'NOT ATTENDED':
        return true;
      case 'INCOMPLETE_ACTIVE':
        return currentTime.isAfter(endTime); // Only disable after end time
      case 'INCOMPLETE_ABANDONED':
        return true; // Always disabled for abandoned sessions
      case 'SCHEDULED':
        return false;
      default:
        return true;
    }
  };
  
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'cand-sess-bg-scheduled text-black';
      case 'COMPLETED': return 'cand-sess-bg-completed text-white';
      case 'NOT ATTENDED': return 'cand-sess-bg-late text-white';
      case 'INCOMPLETE_ACTIVE': 
      case 'INCOMPLETE_ABANDONED': 
        return 'cand-sess-bg-incomplete text-black';
      default: return 'cand-sess-bg-default text-black';
    }
  };

  const getDisplayStatus = (status) => {
    if (status === 'INCOMPLETE_ACTIVE' || status === 'INCOMPLETE_ABANDONED') {
      return 'INCOMPLETE';
    }
    return status;
  }

  return (
    <div className="minheight white">
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "80vh"}}>
          <div className="text-center">
            <FontAwesomeIcon icon={faCircleNotch} spin size="3x" style={{color: "#0961b0", marginBottom: "15px"}} />
            <h4>Loading Interview Sessions</h4>
            <p>Please wait while we retrieve your interview sessions...</p>
          </div>
        </div>
      ) : (
        <Container>
          <Button className='btn btn-outline-light mt-3 mb-1 py-2'>    
            <a href={`/`} className='home-link'>
              <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> HOME
            </a>
          </Button> 

          <Row className='d-flex justify-content-center align-items-center'>
        {filteredInterviews.sort(([, a], [, b]) => { // Parse dates (DD - MM - YYYY format) 
          const [aDay, aMonth, aYear] = a.interview_date.split('-').map(s => s.trim()); 
          const [bDay, bMonth, bYear] = b.interview_date.split('-').map(s => s.trim());
          // Create date objects for comparison
          const aDate = new Date(aYear, aMonth - 1, aDay);
          const bDate = new Date(bYear, bMonth - 1, bDay);

          // If dates are different, sort by date
          if (aDate.getTime() !== bDate.getTime()) {
            return bDate.getTime() - aDate.getTime();
          }

          // If dates are same, sort by start time
          const parseTime = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            
            // Convert to 24-hour format for comparison
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            return hours * 60 + parseInt(minutes);
          };

          const aTime = parseTime(a.assigned_interview_start_time);
          const bTime = parseTime(b.assigned_interview_start_time);

          return bTime - aTime;
          }) .map(([uuid, interview]) => {
            const status = getInterviewStatus(interview);
            const interviewData = reqdFieldsData[uuid] || interview;
            const isDisabled = isButtonDisabled(interview, status);

            return (
              <Col md={4} className='d-flex justify-content-center my-4' key={uuid}>
                <Card style={{ width: "45vh", height: "40vh", borderRadius:"0%", marginBottom:"8vh" }} className='card-rounded'>
                  <Card.Body className="d-flex flex-column p-0" style={{color:"#08084e", paddingBottom:"2vh"}}>
                    <div className="flex-grow-1 p-3">
                      <div style={{ height: '40px', marginBottom: '10px' }}>
                        <Card.Title 
                          style={{
                            fontSize:'13px', 
                            fontWeight:"600",
                            display: '-webkit-box',
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {interviewData.interview_drive.toLowerCase() === "no skill assigned" 
                            ? "Interview drive not assigned" 
                            : interviewData.interview_drive}
                        </Card.Title>
                      </div>
                      <Card.Text style={{fontSize:'13px'}}>
                        Date: {interviewData.interview_date}<br/>
                        Time: {interviewData.assigned_interview_start_time} - {interviewData.assigned_interview_end_time}<br/>
                      </Card.Text>
                      {isDisabled ? (
                        <Button 
                          className="btn btn-primary btn-outline-light"
                          disabled
                          style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          <FontAwesomeIcon icon={faArrowRight} />
                        </Button>
                       ) : (
                        interviewData.interview_drive.toLowerCase() === "no skill assigned" ? (
                          <Button 
                            onClick={() => checkDrive(uuid, interviewData)}
                            className="btn btn-primary btn-outline-light"
                          >
                            <FontAwesomeIcon icon={faArrowRight} />
                          </Button>
                        ) : (
                          <Link 
                            to={`/interview-sessions/${uuid}/interview/instructions`}
                            className="btn btn-primary btn-outline-light"
                          >
                            <FontAwesomeIcon icon={faArrowRight} />
                          </Link>
                        )
                      )}
                    </div>
                    <p className={"p-1 text-center"} style={{fontSize:'11px', color:"#08084e"}}>
                      Interview ID: {uuid}<br/>
                    </p>
                    <div className={`p-2 text-center ${getStatusColorClass(status)}`}>
                      {getDisplayStatus(status)}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
      )}
    </div>
  );
};

export default InterviewSessionScreen;