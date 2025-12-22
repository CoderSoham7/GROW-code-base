import React, { useEffect, useContext, useState, useCallback } from "react"
import moment from 'moment-timezone'
import {
  Container,
  Col,
  Row,
  Image,
  Card,
  Tab,
  Tabs,
  Button
} from "react-bootstrap"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { listSingleUser, getImage, resetUserList, userJDList } from "../Actions/UserActions"
import ResultAccordion from "../Components/ResultAccordion"
import CoverLetterDisplay from "../Components/CoverletterDisplay"
import { faArrowLeft, faEnvelope, faCircleNotch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from "./AuthContext"
import ExcelJS from 'exceljs'
import swal from "sweetalert"

const UserDetailsScreen = () => {
  const Navigate = useNavigate()
  const dispatch = useDispatch();
  const { userInfo } = useContext(AuthContext);  
  const { id } = useParams()

  const [activeKey, setActiveKey] = useState(0);
  const [uuids, setUuids] = useState([]);
  const jdData = useSelector(state => state.userJDList.jdData);
  const jdLoading = useSelector(state => state.userJDList.loading);
  const jdError = useSelector(state => state.userJDList.error);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDownloadInfo, setCurrentDownloadInfo] = useState(null);



  useEffect(() => {  
    if (!userInfo) {  
      Navigate("/login")  
    } else {  
      dispatch(listSingleUser(id, userInfo)); 
      dispatch(getImage(id, userInfo));  
    }  
  }, [Navigate, userInfo, dispatch, id]);

  useEffect(() => {
    if (!jdLoading && !jdError && jdData && currentDownloadInfo) {
      generateAndDownloadExcel(jdData, currentDownloadInfo);
      setCurrentDownloadInfo(null);
    }
  }, [jdLoading, jdError, jdData, currentDownloadInfo]);

  const user = useSelector(state => state.singleUserList.singleUserList);
  const imageUrl = useSelector(state => state.getImage.imageUrl);
  const [slideDirection, setSlideDirection] = useState('');
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    if (user && user.interviews) {
      const interviewKeys = Object.keys(user.interviews);
      setUuids(interviewKeys);
    }
  }, [user]);

  const handleGoBack = () => {
    dispatch(resetUserList());
    Navigate('/leaderboard');
  };

  const handleNext = () => {
    if (activeKey < uuids.length - 1) {
      setActiveKey(activeKey + 1);
      setSlideDirection('right');
      setContentKey(prevKey => prevKey + 1);
    }
  };
  
  const handlePrev = () => {
    if (activeKey > 0) {
      setActiveKey(activeKey - 1);
      setSlideDirection('left');
      setContentKey(prevKey => prevKey + 1);
    }
  };

  const convertGMTToLocalTime = (gmtTimeString) => {  
    const gmtMoment = moment.tz(gmtTimeString, 'hh:mm A', 'GMT');  
    return gmtMoment.tz(moment.tz.guess()).format('hh:mm A');  
  };  

  const formatChatlog = (chatlog, chatLogTimestamps) => {
    let transcript = [];
    
    if (chatlog && chatlog.length > 0) {
      const isTimestampsEmpty = !chatLogTimestamps || chatLogTimestamps.length === 0;
      const localTimeChatLogTimestamps = !isTimestampsEmpty ? chatLogTimestamps.map(tsEntry => ({
        ...tsEntry,
        [Object.keys(tsEntry)[0]]: convertGMTToLocalTime(Object.values(tsEntry)[0]),
      })) : [];

      console.log(chatlog[0], chatlog[1])
      if (chatlog[1].match(/^Candidate's Cover letter:/)){
        chatlog = chatlog.slice(2);
      }
  
      transcript = chatlog.map((entry, index) => {
        const stringWithId = Object.values(entry).join('');
        const stringWithoutId = stringWithId.replace(/([a-f\d]{24})$/, '');
        return isTimestampsEmpty ? `${stringWithoutId}` :
          `[${localTimeChatLogTimestamps[index] ? Object.values(localTimeChatLogTimestamps[index])[0] : ""}] ${stringWithoutId}`;
      });
    }
  
    const transcriptSection = {
      heading: 'Transcript',
      content: transcript  // Keep this as an array
    };
  
    return [transcriptSection];
  };

  function convertTo12HourFormat(timeStr) {  
    if (!timeStr || timeStr.includes('AM') || timeStr.includes('am') || timeStr.includes('pm') || timeStr.includes('PM')) {  
        return timeStr + " (local time)";  
    } else {  
        let timeArray = timeStr.split(':');  
        let hours = parseInt(timeArray[0]);  
        let minutes = timeArray[1];  
        let seconds = timeArray[2];  
        let ampm = hours >= 12 ? 'PM' : 'AM';  
        hours = hours % 12;  
        hours = hours ? hours : 12; 
        let strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;  
        return strTime + " (local time)";  
    }  
  }  
  const calculateDuration = (start_time, end_time) => { 
    function timeToSeconds(timeStr) {  
        if (!timeStr || timeStr === '00:00:00 AM' || timeStr === '00:00:00') {  
            return 0;  
        }  
        var timeArray = timeStr.split(/:| /);  
        var hours = parseInt(timeArray[0]);  
        var minutes = parseInt(timeArray[1]);  
        var seconds = parseInt(timeArray[2]);  
        if (timeArray.length === 4) {  
            var ampm = timeArray[3].toLowerCase();  
            if (ampm === 'pm' && hours !== 12) {  
                hours += 12;  
            }  
            if (ampm === 'am' && hours === 12) {  
                hours = 0;  
            }  
        }   
        return hours * 3600 + minutes * 60 + seconds;  
    } 
      
    if ((!start_time || start_time === '00:00:00 AM' || start_time === '00:00:00') && (!end_time || end_time === '00:00:00 AM' || end_time === '00:00:00')) {  
        return '00 hours, 00 minutes, 00 seconds';  
    } else {   
        var startTimeInSeconds = timeToSeconds(start_time);  
        var endTimeInSeconds = timeToSeconds(end_time);  
        var timeDifferenceInSeconds = endTimeInSeconds - startTimeInSeconds; 
        var hours = Math.floor(timeDifferenceInSeconds / 3600);  
        var minutes = Math.floor((timeDifferenceInSeconds % 3600) / 60);  
        var seconds = timeDifferenceInSeconds % 60;  
        return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;  
    }  
  };  
    

  function standardizeTime(timeString) { 
    if(timeString){ 
      if(timeString !== "Not Assigned" && timeString !== ''){
        let [time, period] = timeString.split(' ');  
        if (!time.includes(':')) {  
          time += ':00';  
        }   
        return `${time} ${period}`;  
      }
      else{
        return "Not Assigned"
      }
    }
  }

  const getInterviewStatus = (interview) => {
    if (!interview) return 'UNKNOWN';
  
    const currentTime = new Date();
    
    // Convert time string to Date object for comparison
    function convertTimeStringToDate(timeStr) {
      if (timeStr === "00:00:00 AM") return null;
      
      const [time, period] = timeStr.split(' ');
      const [hours, minutes, seconds] = time.split(':');
      
      const date = new Date();
      let hour = parseInt(hours);
      
      if (period === 'PM' && hour !== 12) {
          hour += 12;
      }
      if (period === 'AM' && hour === 12) {
          hour = 0;
      }
      
      date.setHours(hour, parseInt(minutes), parseInt(seconds));
      return date;
    }
  
    const interviewStartTime = convertTimeStringToDate(interview.interview_start_time);
    const interviewEndTime = convertTimeStringToDate(interview.interview_end_time);
  
    if (interview.interview_completed) {
      return "COMPLETED";
    } else if (interview.interview_start_time !== "00:00:00 AM" && !interview.interview_completed) {
      return "INCOMPLETE";
    } else if (interview.interview_start_time === "00:00:00 AM" && interview.interview_end_time === "00:00:00 AM") {
      if (interviewEndTime && currentTime <= interviewEndTime) {
        return "SCHEDULED";
      } else {
        return "NOT ATTENDED";
      }
    } else {
      return "UNKNOWN";
    }
  };
  
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'cand-sess-bg-scheduled text-black';
      case 'COMPLETED': return 'cand-sess-bg-completed text-white';
      case 'NOT ATTENDED': return 'cand-sess-bg-late text-white';
      case 'INCOMPLETE': return 'cand-sess-bg-incomplete text-black';
      default: return 'cand-sess-bg-default text-black';
    }
  };

  const triggerDownload = (buffer, filename) => {    
    const blob = new Blob([buffer], {    
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'    
    });    
    const url = window.URL.createObjectURL(blob);    
    const anchor = document.createElement('a');    
    anchor.href = url;    
    anchor.download = filename;    
    document.body.appendChild(anchor);
    anchor.click();    
    document.body.removeChild(anchor);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);    
  };  
  

  const headerFill = {  
    type: 'pattern',  
    pattern: 'solid',  
    fgColor: { argb: 'FFA7DDDE' } 
  };   
  const headerFont = {  
    color: { argb: 'FF08084E' }  
  };     
  const alignmentWrapText = {  
    vertical: 'middle',  
    horizontal: 'left',  
    wrapText: true  
  };      
  const borderStyles = {  
    top: { style: 'thin' },  
    left: { style: 'thin' },  
    bottom: { style: 'thin' },  
    right: { style: 'thin' }  
  }; 
  

  const downloadInterviewJD = useCallback(async (interview, uuid) => {
    if (isDownloading) return;
  
    setIsDownloading(true);
    setCurrentDownloadInfo({ interview, uuid });
  
    swal({
      title: "Fetching Interview Skill JD",
      text: `Candidate ID: ${user.candidate_id}\nInterview ID: ${uuid}`,
      icon: "info",
      buttons: false,
      closeOnClickOutside: false,
    });
  
    dispatch(userJDList(user.candidate_id, uuid, userInfo));
  }, [dispatch, user.candidate_id, userInfo, isDownloading]);
  
  const generateAndDownloadExcel = async (data, info) => {
    try {
      swal({
        title: "Downloading Interview Skill JD",
        text: `Candidate ID: ${user.candidate_id}\nInterview ID: ${info.uuid}`,
        icon: "success",
        buttons: false,
        timer: 2000,
      });
  
      const workbook = new ExcelJS.Workbook();
      const applyStylesToRow = (row, isHeader = false) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = alignmentWrapText;
          cell.border = borderStyles;
          if (isHeader) {
            cell.fill = headerFill;
            cell.font = headerFont;
          }
        });
      };
  
      const jdSheet = workbook.addWorksheet('Job Description');
      jdSheet.columns = [
        { header: 'Skill Level Name', key: 'name', width: 25 },
        { header: 'Skill Level Version', key: 'version', width: 10 },
        { header: 'Version Created At', key: 'createdAt', width: 20 },
        { header: 'Difficulty', key: 'difficulty', width: 15 },
        { header: 'Skill List', key: 'skills', width: 50 },
        { header: 'Responsibilities', key: 'responsibilities', width: 50 },
        { header: 'Interview style & Industry benchmark', key: 'interviewStyle', width: 50 },
      ];
  
      applyStylesToRow(jdSheet.getRow(1), true);
  
      const jdRowData = {
        name: data.name || 'N/A',
        version: data.skill_level_version || 'N/A',
        createdAt: data.createdAt || 'N/A',
        difficulty: data.difficulty || 'N/A',
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || 'N/A'),
        responsibilities: data.sections || 'N/A',
        interviewStyle: data.question_pattern || 'N/A'
      };
  
      const row = jdSheet.addRow(jdRowData);
      applyStylesToRow(row);
  
      const buffer = await workbook.xlsx.writeBuffer();
      triggerDownload(buffer, `${user.candidate_id}_Assigned_Interview_Skill_${info.uuid}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      swal({
        title: "Error",
        text: "Unable to generate the Excel file. Please try again.",
        icon: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  }; 

  
  const downloadInterviewProfile = async (interview, uuid) => {  
    // Display initial SweetAlert
    swal({
      title: "Preparing Interview Profile",
      text: `Candidate ID: ${user.candidate_id}\nInterview ID: ${uuid}`,
      icon: "info",
      buttons: false,
      closeOnClickOutside: false,
    });
  
    const workbook = new ExcelJS.Workbook();  
    const applyStylesToRow = (row, isHeader = false) => {  
      row.eachCell({ includeEmpty: true }, (cell) => {  
        cell.alignment = alignmentWrapText;  
        cell.border = borderStyles;  
        if (isHeader) {  
          cell.fill = headerFill;  
          cell.font = headerFont;  
        }  
      });  
    };  

    const getStatusStyles = (status) => {
      switch(status) {
        case "COMPLETED":
          return {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF154E16' } },
            font: { color: { argb: 'FFFFFFFF' } }
          };
        case "SCHEDULED":
          return {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5F8EDF' } },
            font: { color: { argb: 'FF000000' } }
          };
        case "INCOMPLETE":
          return {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4A11C' } },
            font: { color: { argb: 'FF000000' } }
          };
        case "NOT ATTENDED":
          return {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7D1212' } },
            font: { color: { argb: 'FFFFFFFF' } }
          };
        default:
          return {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } },
            font: { color: { argb: 'FF000000' } }
          };
      }
    };

    const basicInfoSheet = workbook.addWorksheet('Basic Information');  
    basicInfoSheet.columns = [  
      { header: 'Information Fields', key: 'info', width: 25 },  
      { header: 'Details', key: 'details', width: 50 }  
    ];  
    applyStylesToRow(basicInfoSheet.getRow(1), true);  
  
    const interviewStatus = getInterviewStatus(interview);
    const basicInfoData = [  
      { info: "Interview Status", details: interviewStatus },
      { info: "Candidate Name", details: user.name },  
      { info: "ID", details: user.candidate_id },  
      { info: "Interview Skill Name", details: `${interview.interview_drive} - ${interview.interview_drive_version}` }, 
      { info: "Assigned Interview Date", details: interview.interview_date },  
      { info: "Assigned Interview Time Slot", details: `${standardizeTime(interview.assigned_interview_start_time)} IST - ${standardizeTime(interview.assigned_interview_end_time)} IST` },   
      { info: "Assessment Category", details: interview.assessment_category },  
      { info: "Assessment Pipeline", details: interview.assessment_pipeline }, 
      { info: "Image Uploaded", details: user.isImg ? 'Uploaded' : 'Not uploaded' },
      { info: "Coverletter Uploaded", details: interview.isCoverletter ? 'Uploaded' : 'Not uploaded' }, 
      { info: "Interview Started At", details: interview.interview_start_time === '00:00:00 AM' ? 'Interview not started' : convertTo12HourFormat(interview.interview_start_time) },  
      { info: "Interview Ended At", details: interview.interview_end_time === '00:00:00 AM' ? 'Interview not ended' : convertTo12HourFormat(interview.interview_end_time) },       
      { info: "Interview Duration", details: interview.interview_end_time === '00:00:00 AM' || interview.interview_start_time === '00:00:00 AM' ? 'Interview duration unavailable' : calculateDuration(interview.interview_start_time, interview.interview_end_time) },  
      { info: "Interview ID", details: uuid },
    ];  
  
    if (typeof interview.confidence_score === 'number') {  
      basicInfoData.push({ info: "Confidence of Acceptance (out of 100)", details: interview.confidence_score });  
    }  
  
    basicInfoData.forEach((dataRow, index) => {  
      const row = basicInfoSheet.addRow(dataRow);  
      applyStylesToRow(row);  
      if (index === 0) { // This is the Interview Status row
        const statusCell = row.getCell(2); // The 'Details' cell
        const styles = getStatusStyles(interviewStatus);
        statusCell.fill = styles.fill;
        statusCell.font = { ...statusCell.font, ...styles.font };
      }
    });  
    
    const coverletterSheet = workbook.addWorksheet('Coverletter');  
coverletterSheet.columns = [  
    { header: 'Coverletter content', key: 'cov', width: 50 }
];  
applyStylesToRow(coverletterSheet.getRow(1), true);  

// Always create transcript sheet
const transcriptSheet = workbook.addWorksheet('Transcript');    
transcriptSheet.columns = [    
    { header: 'Interviewer', key: 'interviewer', width: 50 },    
    { header: 'Candidate', key: 'candidate', width: 50 }    
];    
applyStylesToRow(transcriptSheet.getRow(1), true);    

if (interviewStatus === "COMPLETED" || interviewStatus === "INCOMPLETE") {
    // Add actual coverletter content
    const coverletterData = [{cov: interview.covertext || 'No cover letter available'}];  
    coverletterData.forEach((dataRow) => {  
        const row = coverletterSheet.addRow(dataRow);  
        applyStylesToRow(row);  
    }); 

    // Add actual transcript content
    let interviewer_msgs = [];    
    let candidate_msgs = [];   

    const transcript = formatChatlog(interview.chatlog, interview.chatlog_timestamps)[0].content;
    transcript.forEach((entry) => {    
        const timestampPattern = /\[(.*?)\]/;    
        const timestampMatch = entry.match(timestampPattern);    
        const timestamp = timestampMatch ? timestampMatch[0] : "[No timestamp available]";              
        if (entry.includes('Interviewer:')) {    
            const message = entry.split('Interviewer:')[1].trim();    
            interviewer_msgs.push(`${timestamp} ${message}`);    
            candidate_msgs.push('');    
        } else if (entry.includes('Candidate:')) {    
            const message = entry.split('Candidate:')[1].trim();    
            candidate_msgs.push(`${timestamp} ${message}`);    
            interviewer_msgs.push('');    
        }    
    });          

    interviewer_msgs.forEach((interviewerText, i) => {    
        const row = transcriptSheet.addRow({ interviewer: interviewerText, candidate: candidate_msgs[i] });    
        applyStylesToRow(row);    
    });  
} else {
    // Add "Interview not attended" message for both sheets
    coverletterSheet.addRow(['Interview not attended']);
    transcriptSheet.addRow({
        interviewer: 'Interview not attended',
        candidate: ''
    });
}
    
    const buffer = await workbook.xlsx.writeBuffer();
    // Display download starting SweetAlert
    swal({
      title: "Downloading Interview Profile",
      text: `Candidate ID: ${user.candidate_id}\nInterview ID: ${uuid}`,
      icon: "success",
      buttons: false,
      timer: 2000,
    });

    triggerDownload(buffer, `Candidate_${user.candidate_id}_interview_profile_${uuid}.xlsx`);  
  };


  if (!user) {
    return <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>;
  }

  const currentInterview = uuids[activeKey] && user.interviews[uuids[activeKey]];
  const currentUuid= uuids[activeKey]


  return (
    <div className="minheight white">
      <Container>
        <Link
          className='btn btn-outline-light my-3 py-2'
          to='/leaderboard'
          onClick={handleGoBack}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> Go Back
        </Link>
        
        <Row>
          <Col lg={4} className='d-flex flex-column text-center align-items-center my-5'>
            <Card className='align-items-center profileCard'>        
              <Card.Body className='card-body-custom'>
                <Image
                  className='profilePhoto m-2'
                  src={imageUrl}
                  roundedCircle
                  fluid
                />
                <Card.Title className='profileText'>
                  {user.name}
                </Card.Title>
                <div className='profileText2 mb-1'>ID: {user.candidate_id}</div>
                <Card.Footer className='text-muted w-100'>
                  <div className='profileCollege mt-1'>
                    <div><FontAwesomeIcon icon={faEnvelope} className="px-2" />{user.email}</div>
                  </div>
                </Card.Footer>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={8} className='scoreCard mt-2 mb-4' style={{color:"#08084e"}}>
            <div className="sticky-header">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <FontAwesomeIcon icon={faChevronLeft} onClick={handlePrev} className="nav-icon" />
                <div className="flex-grow-1 mx-3">
                  <Tabs
                    activeKey={activeKey}
                    onSelect={(k) => setActiveKey(Number(k))}
                    id="interview-tabs"
                    className="session-tabs"
                  >
                    {uuids.map((uuid, index) => (
                      <Tab eventKey={index} title={`Session ${index + 1}`} key={uuid}>
                        {/* Tab content is rendered separately below */}
                      </Tab>
                    ))}
                  </Tabs>
                </div>
                <FontAwesomeIcon icon={faChevronRight} onClick={handleNext} className="nav-icon" />
              </div>
            </div>

            <div className="scrollable-content">
              {currentInterview && currentUuid ? (
                <div 
                  key={contentKey}
                  className={`tab-content-wrapper ${slideDirection}`}
                  onAnimationEnd={() => setSlideDirection('')}
                >
                  <br></br>
                  <p><span className={`p-2 ${getStatusColorClass(getInterviewStatus(currentInterview))}`}>
                      {getInterviewStatus(currentInterview)}
                  </span></p>
                  <p>
                    <b>Cover Letter:</b> 
                    {currentInterview.isCoverletter ? (
                      <CoverLetterDisplay 
                        id={user.candidate_id} 
                        uuid={currentUuid} 
                        userInfo={userInfo}
                      />
                    ) : 'Not Uploaded'}
                  </p>
                  <p><b>Interview ID:</b> {currentUuid}</p>
                  <p><b>Interview Skill:</b> {currentInterview.interview_drive} - {currentInterview.interview_drive_version}</p>
                  <p><b>Assigned Date:</b> {currentInterview.interview_date || 'N/A'}</p>
                  <p><b>Assigned Time Slot:</b> {standardizeTime(currentInterview.assigned_interview_start_time)} IST - {standardizeTime(currentInterview.assigned_interview_end_time)} IST</p>   
                  <p><b>Assessment Category:</b> {currentInterview.assessment_category || 'N/A'}</p>
                  <p><b>Assessment Pipeline:</b> {currentInterview.assessment_pipeline || 'N/A'}</p>         
                  <p><b>Interview Started At:</b> {currentInterview.interview_start_time === '00:00:00 AM' ? ('Interview not started'):(convertTo12HourFormat(currentInterview.interview_start_time))}</p>
                  <p><b>Interview Ended At:</b> {currentInterview.interview_end_time === '00:00:00 AM' ? ('Interview not started'):(convertTo12HourFormat(currentInterview.interview_end_time))}</p>
                  <p><b>Interview Duration:</b> {currentInterview.interview_end_time === '00:00:00 AM' || currentInterview.interview_start_time === '00:00:00 AM' ? ('Interview duration unavailable'):(calculateDuration(currentInterview.interview_start_time, currentInterview.interview_end_time))}</p>
                  <p>
                  <b>Interview Transcript: </b>
                    {currentInterview.interview_start_time === "00:00:00 AM" ? (
                      'Transcript will be available once interview starts'
                    ) : (
                      <><br></br><ResultAccordion accordionData={formatChatlog(currentInterview.chatlog, currentInterview.chatlog_timestamps)}/></>
                    )}                  
                  </p>

                  <Button 
                    className='btn btn-outline-light my-3 py-2' 
                    onClick={() => downloadInterviewProfile(currentInterview, currentUuid)}
                  >
                    DOWNLOAD PROFILE
                  </Button>

                  <Button 
                    className='btn btn-outline-light my-3 py-2 m-2' 
                    onClick={() => downloadInterviewJD(currentInterview, currentUuid)}
                  >
                    DOWNLOAD Interview Skill
                  </Button>
                  
              </div>
            ) : (
              <div>No interview data available</div>
            )}
          </div>
          </Col>

          
        </Row>
      </Container>
    </div>
  )
}

export default UserDetailsScreen;