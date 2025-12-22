import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from '../AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleNotch, faArrowLeft, faCode, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment-timezone';
import { getReqdFields } from '../../Actions/UserActions';
import swal from 'sweetalert';
import './coding.css';


const CodingSessionScreen = () => {
  const { userInfo, loading, error, loadUser } = useContext(AuthContext);
  const dispatch = useDispatch();
  const location = useLocation();
  const reqdFieldsData = useSelector((state) => state.getReqdFields.reqFields);
  const [codingSessions, setCodingSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      
      Promise.all(promises).then(() => {
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [userInfo, dispatch, refreshTrigger]);
  
  // Check if coming back from the coding test to refresh
  useEffect(() => {
    // If location state has refresh flag, update the trigger to force data refresh
    if (location.state?.refresh) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [location]);
  
  // Filter sessions to only show Python Programmer sessions
  useEffect(() => {
    if (userInfo && userInfo.interviews && reqdFieldsData) {
      const pythonSessions = Object.entries(userInfo.interviews)
        .filter(([uuid]) => {
          const sessionData = reqdFieldsData[uuid] || userInfo.interviews[uuid];
          return sessionData.interview_drive === "Python Programmer";
        })
        .map(([uuid, interview]) => ({
          uuid,
          interview,
          interviewData: reqdFieldsData[uuid] || interview
        }));
      
      setCodingSessions(pythonSessions);
    }
  }, [userInfo, reqdFieldsData]);

  if (loading) {
    return (
      <div className="minheight white d-flex justify-content-center align-items-center">
        <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="minheight white d-flex justify-content-center align-items-center">
        <div>Error: {error}</div>
      </div>
    );
  }

  const checkDrive = (uuid, interviewData) => {
    if (interviewData.interview_drive.toLowerCase() === "no skill assigned") {
      swal({
        title: "Coding Test Not Assigned",
        text: `Please contact admin and ask them to assign a coding test. Provide them your ID: ${userInfo.candidate_id} and Coding Session ID: ${uuid}`,
        icon: "warning",
        button: "OK"
      });
      return;
    }
  };

  const getSessionStatus = (interview) => {
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

  const handleManualRefresh = () => {
    setIsLoading(true);
    setRefreshTrigger(prev => prev + 1);
  }

  return (
    <div className="minheight white">

      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <div className="text-center">
            <FontAwesomeIcon icon={faCircleNotch} spin size="3x" style={{color: "#0961b0", marginBottom: "15px"}} />
            <h4>Loading Sessions</h4>
            <p>Please wait while we retrieve your coding sessions...</p>
          </div>
        </div>
      ) : (
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Button className='btn btn-outline-light mt-3 mb-1 py-2'>    
              <a href={`/`} className='home-link'>
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> HOME
              </a>
            </Button>
            {/*}
            <Button 
              className='btn btn-outline-primary mt-3 mb-1 py-2'
              onClick={handleManualRefresh}
              title="Refresh sessions"
            >    
              <FontAwesomeIcon icon={faSyncAlt} spin={isLoading} /> REFRESH
            </Button>
            */}
          </div>
          
          {codingSessions.length === 0 ? (
          <div className="no-sessions-container">
            <div className="no-sessions-card">
              <FontAwesomeIcon icon={faCode} className="no-sessions-icon" />
              <h3 className="no-sessions-title">No Coding Assessment Sessions</h3>
              <p className="no-sessions-message">
                You don't have any Python Programmer coding sessions scheduled at the moment.
                Please contact your administrator if you believe this is in error.
              </p>
            </div>
          </div>
        ) : (
          <Row className='d-flex justify-content-center align-items-center'>
          {codingSessions
            // Sort the sessions by date and time
            .sort((a, b) => {
              // Access the interview data safely
              const aInterview = a.interview || a.interviewData;
              const bInterview = b.interview || b.interviewData;
              
              // Handle potential missing date format
              try {
                const [aDay, aMonth, aYear] = aInterview.interview_date.split('-').map(s => s.trim()); 
                const [bDay, bMonth, bYear] = bInterview.interview_date.split('-').map(s => s.trim());
                
                // Create date objects for comparison
                const aDate = new Date(aYear, aMonth - 1, aDay);
                const bDate = new Date(bYear, bMonth - 1, bDay);

                // If dates are different, sort by date
                if (aDate.getTime() !== bDate.getTime()) {
                  return bDate.getTime() - aDate.getTime();
                }
                
                // Parse time strings
                const parseTime = (timeStr) => {
                  if (!timeStr || timeStr === 'Not Assigned') return 0;
                  
                  const [time, period] = timeStr.split(' ');
                  let [hours, minutes] = time.split(':');
                  hours = parseInt(hours);
                  
                  // Convert to 24-hour format
                  if (period === 'PM' && hours !== 12) hours += 12;
                  if (period === 'AM' && hours === 12) hours = 0;
                  
                  return hours * 60 + parseInt(minutes);
                };

                const aTime = parseTime(aInterview.assigned_interview_start_time);
                const bTime = parseTime(bInterview.assigned_interview_start_time);

                return bTime - aTime;
              } catch (e) {
                console.warn("Date parsing error:", e);
                return 0;
              }
            })
            .map((sessionData) => {
              const { uuid, interview, interviewData } = sessionData;
              const interviewToUse = interview || interviewData;
              const status = getSessionStatus(interviewToUse);
              const isDisabled = isButtonDisabled(interviewToUse, status);

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
                          {interview.interview_drive}
                        </Card.Title>
                      </div>
                      <Card.Text style={{fontSize:'13px'}}>
                        Date: {interviewToUse.interview_date}<br/>
                        Time: {interviewToUse.assigned_interview_start_time} - {interviewToUse.assigned_interview_end_time}<br/>
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
                          <Link 
                            to={`/coding-sessions/${uuid}/coding/instructions`}
                            className="btn btn-primary btn-outline-light"
                          >
                            <FontAwesomeIcon icon={faArrowRight} />
                          </Link>
                      )}
                    </div>
                    <p className={"p-1 text-center"} style={{fontSize:'11px', color:"#08084e"}}>
                      Coding Session ID: {uuid}<br/>
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
        )}
      </Container>
      )}
    </div>
  );
};

export default CodingSessionScreen;