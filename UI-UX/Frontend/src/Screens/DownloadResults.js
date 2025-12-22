import React, { useEffect, useState, useContext } from "react"
import { Container, Alert, Row, Col, Button } from "react-bootstrap"
import swal from 'sweetalert';  
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom"
import { faArrowLeft, faCircleNotch, faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { listUsers } from "../Actions/UserActions";
import { MultiSelect } from "react-multi-select-component";
import DatePicker from "react-datepicker"
import moment from"moment";
import { filteredUserList, attendanceList, getconfscoreList, getAllJD } from "../Actions/UserActions.js"
import JSZip from 'jszip';
import ExcelJS from 'exceljs'
import { AuthContext } from "./AuthContext";

const DownloadResults = () => {
  const { userInfo } = useContext(AuthContext);  
  const dispatch = useDispatch();

  useEffect(() => {  
    dispatch(getAllJD(userInfo)).then(() => setLoadingDrives(false));  
  }, [dispatch, userInfo]);  

  const allJDList = useSelector(state => state.getAllJD.jdlist);

  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState();
  const [assessmentCategory, setAssessmentCategory] = useState();
  const [assessmentPipeline, setAssessmentPipeline] = useState("");

  const [date, setDate] = useState(new Date());
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  const [loadingDrives, setLoadingDrives] = useState(true);  

  const file_timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '')

  const convertGMTToLocalTime = (gmtTimeString) => {  
    const gmtMoment = moment.tz(gmtTimeString, 'hh:mm A', 'GMT');  
    return gmtMoment.tz(moment.tz.guess()).format('hh:mm A');  
  };


  const getInterviewDriveOptions = () => {
    const interviewDrives = [...new Set(allJDList.map(jd => jd.name))];
    return interviewDrives.map(driveName => ({
      value: driveName,
      label: driveName
    }));
  };

  const interviewDriveOptions = getInterviewDriveOptions();

  const handleSkillSelect = (e) => {
    setSelected(e)
  }

  const handleInterviewStatusChange = (e) => {
    const selectedValue = e.target.value;
    setStatus(selectedValue);
  };

  const handleAssessmentCategoryChange = (e) => {
    const selectedValue = e.target.value;
    setAssessmentCategory(selectedValue);
  };

  const handleAssessmentPipelineChange = (e) => {
    const selectedValue = e.target.value;
    setAssessmentPipeline(selectedValue);
  };

  const handleSubmit1 = async () => {  
    if (selected.length === 0) {  
        alert('Please select at least one skill.');  
        return;  
    }  
    if (!assessmentCategory) {  
        alert('Please select values for interview assessment category.');  
        return;  
    }  
    if (!assessmentPipeline) {  
      alert('Please select an assessment pipeline.');  
      return;  
    }  
    if (!startDate || !endDate) {  
        alert('Please select both start date and end date.');  
        return;  
    }  
  
    const formattedStartDate = moment(startDate).format('DD/MM/YYYY');  
    const formattedEndDate = moment(endDate).format('DD/MM/YYYY');  
    const filteredData = {  
        skills: selected.map(skill => skill.value),  
        assessmentCategory, 
        assessmentPipeline, 
        formattedStartDate,  
        formattedEndDate,  
    };  
  
    try {  
        swal({  
            title: "Data submitted. Please wait.",  
            text: "Fetching data...",  
            icon: "info",  
        });  

            const usersToProcess = await dispatch(filteredUserList(filteredData, userInfo)); 
            if (usersToProcess && usersToProcess.length > 0) {  
                await downloadUserResultsAsZip(usersToProcess);  
            } else {  
                swal({  
                    title: "Error",  
                    text: "No user data to process",  
                    icon: "error"  
                });  
            }  
    } catch (error) {  
        swal({  
            title: "Error",  
            icon: "error"  
        });  
    }  
};  


const handleSubmit2 = async () => {  
  if (selected.length === 0) {  
      alert('Please select at least one skill.');  
      return;  
  }  
  if (!assessmentCategory) {  
      alert('Please select values for interview assessment category.');  
      return;  
  }  
  if (!assessmentPipeline) {  
    alert('Please select an assessment pipeline.');  
    return;  
  }  
  if (!startDate || !endDate) {  
      alert('Please select both start date and end date.');  
      return;  
  }  

  const formattedStartDate = moment(startDate).format('DD/MM/YYYY');  
  const formattedEndDate = moment(endDate).format('DD/MM/YYYY');  
  const attendanceData = {  
      skills: selected.map(skill => skill.value),  
      assessmentCategory, 
      assessmentPipeline, 
      formattedStartDate,  
      formattedEndDate,  
  };  

  try {  
      // Show initial loading message
      swal({  
          title: "Data submitted. Please wait.",  
          text: "Fetching attendance data...",  
          icon: "info",
          buttons: false,
          closeOnClickOutside: false,
          closeOnEsc: false
      });  

      const attendanceUsers = await dispatch(attendanceList(attendanceData, userInfo));
      
      // Close the loading message
      swal.close();
      
      if (attendanceUsers && attendanceUsers.length > 0) {  
          await downloadAttendance(attendanceUsers);  
      } else {  
          swal({  
              title: "Error",  
              text: "No attendance data to process",  
              icon: "error"  
          });  
      }   
  } catch (error) { 
      swal({  
          title: "Error",  
          icon: "error"  
      });  
  }  
};  


const handleSubmit3 = async () => {  
  if (selected.length === 0) {  
      alert('Please select at least one skill.');  
      return;  
  }  
  if (!assessmentCategory) {  
      alert('Please select values for interview assessment category.');  
      return;  
  }  
  if (!startDate || !endDate) {  
      alert('Please select both start date and end date.');  
      return;  
  }  

  const formattedStartDate = moment(startDate).format('DD/MM/YYYY');  
  const formattedEndDate = moment(endDate).format('DD/MM/YYYY');  
  const confscoreData = {  
      skills: selected.map(skill => skill.value),  
      assessmentCategory,  
      formattedStartDate,  
      formattedEndDate,  
  };  

  try {  
      swal({  
          title: "Data submitted. Please wait.",  
          text: "Fetching data...",  
          icon: "info",  
      });  

          const confscoreUsers = await dispatch(getconfscoreList(confscoreData, userInfo));
          if (confscoreUsers && confscoreUsers.length > 0) {  
              await downloadConfScores(confscoreUsers);  
          } else {  
              swal({  
                  title: "Error",  
                  text: "No user data to process",  
                  icon: "error"  
              });  
          }   
  } catch (error) { 
      swal({  
          title: "Error",  
          icon: "error"  
      });  
      console.log(error)
  }  
};

const handleSubmit = async() =>{
  handleSubmit1();
  handleSubmit2();
}


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

  function convertTo12HourFormat(timeStr) {  
    if (!timeStr || timeStr.includes('AM') || timeStr.includes('am') || timeStr.includes('pm') || timeStr.includes('PM')) {  
        timeStr = timeStr.replace(/am/g, 'AM').replace(/pm/g, 'PM');
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

  function interviewCompletionStatus(start_time, end_time, interview_flag) {
    if (interview_flag) 
    { return "Completed"}
    else
    {
      if (start_time !== '00:00:00 AM' && end_time === '00:00:00 AM')
      { return "Incomplete"}
      else if ( start_time === '00:00:00 AM' && end_time === '00:00:00 AM')
      { return "Not Started"}
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

  const formatChatlog = (user) => {  
    let fixedChatlog = [];  
    if(user && user.chatlog) {  
        const isTimestampsEmpty = !user.chatLogTimestamps || !(user.chatLogTimestamps.length > 0);  
        const localTimeChatLogTimestamps = !isTimestampsEmpty ? user.chatLogTimestamps.map(tsEntry => ({  
            ...tsEntry,  
            [Object.keys(tsEntry)[0]]: convertGMTToLocalTime(Object.values(tsEntry)[0]),  
        })) : [];  

        const chatlogEntry = { ...user.chatlog[1] };  
        delete chatlogEntry._id;  
        const chatlogString = Object.values(chatlogEntry).join('');   
        if (chatlogString.match(/^Candidate's Cover letter:/)) {  
            fixedChatlog.push(chatlogString);  
            fixedChatlog = fixedChatlog.concat(user.chatlog.slice(2).map((entry, index) => {  
                const stringWithId = Object.values(entry).join('');  
                const stringWithoutId = stringWithId.replace(/([a-f\d]{24})$/, '');  
                return isTimestampsEmpty ? `${stringWithoutId}` :  
                      `[${localTimeChatLogTimestamps[index + 1] ? Object.values(localTimeChatLogTimestamps[index + 1])[0] : ""}] ${stringWithoutId}`;  
            }));  
        } else {   
          fixedChatlog = user.chatlog.map((entry, index) => {  
            const stringWithId = Object.values(entry).join('');  
            const stringWithoutId = stringWithId.replace(/([a-f\d]{24})$/, '');  
            return isTimestampsEmpty ? `${stringWithoutId}` :  
                  `[${localTimeChatLogTimestamps[index] ? Object.values(localTimeChatLogTimestamps[index])[0] : ""}] ${stringWithoutId}`;  
          });  
        }   
    }  
    return fixedChatlog;  
  }  

  const getInterviewStatus = (interview) => {
    if (!interview) return 'UNKNOWN';
    
    const userTimezone = moment.tz.guess();
    const interviewDate = interview.interview_date ? moment.tz(interview.interview_date.replace(/\s/g, ''), 'DD-MM-YYYY', 'Asia/Kolkata') : null;
    const startTime = interview.interview_date && interview.assigned_interview_start_time ? 
        moment.tz(`${interview.interview_date.replace(/\s/g, '')} ${interview.assigned_interview_start_time}`, 'DD-MM-YYYY hh:mm A', 'Asia/Kolkata') : null;
    const endTime = interview.interview_date && interview.assigned_interview_end_time ? 
        moment.tz(`${interview.interview_date.replace(/\s/g, '')} ${interview.assigned_interview_end_time}`, 'DD-MM-YYYY hh:mm A', 'Asia/Kolkata') : null;
    const currentTime = moment().tz(userTimezone);

    if (interview.interview_completed) {
        return 'COMPLETED';
    } else if (interview.interview_start_time && interview.interview_start_time !== "00:00:00 AM" && 
               (!interview.interview_end_time || interview.interview_end_time === "00:00:00 AM")) {
        return 'INCOMPLETE';
    } else if (!interview.interview_start_time || interview.interview_start_time === "00:00:00 AM") {
        if (endTime && currentTime.isSameOrBefore(endTime)) {
            return 'SCHEDULED';
        } else {
            return 'NOT ATTENDED';
        }
    }
    return 'UNKNOWN';
};

  const getStatusStyles = (status) => {
    switch(status) {
      case "COMPLETED":
        return {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF154E16' } }, // Green background
          font: { color: { argb: 'FFFFFFFF' } } // White text
        };
      case "SCHEDULED":
        return {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5F8EDF' } }, // Blue background
          font: { color: { argb: 'FF000000' } } // White text
        };
      case "INCOMPLETE":
        return {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4A11C' } }, // Yellow background
          font: { color: { argb: 'FF000000' } } // Black text
        };
      default: // "Not Attended" or any other status
        return {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7D1212' } }, // Red background
          font: { color: { argb: 'FFFFFFFF' } } // White text
        };
    }
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

  // Modify createInterviewProfileExcel to remove transcript parameter
  const createInterviewProfileExcel = async (user) => {    
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
    const basicInfoSheet = workbook.addWorksheet('Basic Information');  
    basicInfoSheet.columns = [  
      { header: 'Information Fields', key: 'info', width: 25 },  
      { header: 'Details', key: 'details', width: 50 }  
    ];  
    applyStylesToRow(basicInfoSheet.getRow(1), true);  
    
    const interviewStatus = user.interview_status; // Get the actual status
    const statusStyles = getStatusStyles(interviewStatus); // Get the styles for this status
    
    const basicInfoData = [
      { info: "Interview Status", details: interviewStatus }, // Use the actual status here
      { info: "Candidate Name", details: user.name },  
      { info: "ID", details: user.candidate_id },  
      { info: "Interview Skill Name", details: `${user.interview_drive} - ${user.interview_drive_version}` },  
      { info: "Assigned Interview Date", details: user.interview_date },  
      { info: "Assigned Interview Time Slot", details: `${standardizeTime(user.assigned_interview_start_time)} IST - ${standardizeTime(user.assigned_interview_end_time)} IST` },  
      { info: "Assessment Category", details: user.assessment_category },  
      { info: "Assessment Pipeline", details: user.assessment_pipeline }, 
      { info: "Image Uploaded", details: user.isImg ? 'Uploaded' : 'Not uploaded' },
      { info: "Coverletter Uploaded", details: user.isCoverletter ? 'Uploaded' : 'Not uploaded' },   
      { info: "Interview Started At", details: user.interview_start_time === '00:00:00 AM' ? 'Interview not started' : convertTo12HourFormat(user.interview_start_time) },  
      { info: "Interview Ended At", details: user.interview_end_time === '00:00:00 AM' ? 'Interview not ended' : convertTo12HourFormat(user.interview_end_time) },  
      { info: "Interview Duration", details: user.interview_end_time === '00:00:00 AM' || user.interview_start_time === '00:00:00 AM' ? 'Interview duration unavailable' : calculateDuration(user.interview_start_time, user.interview_end_time) },  
      { info: "Interview ID", details: user.uuid},
    ];  

    basicInfoData.forEach((dataRow, index) => {
      const row = basicInfoSheet.addRow(dataRow);
      applyStylesToRow(row);
      if (index === 0) { // This is the Interview Status row
        const statusCell = row.getCell(2); // The 'Details' cell
        statusCell.fill = statusStyles.fill;
        statusCell.font = { ...statusCell.font, ...statusStyles.font };
      }
    });

    // Create Coverletter and Transcript sheets with appropriate content based on status
    const coverletterSheet = workbook.addWorksheet('Coverletter');  
    coverletterSheet.columns = [  
        { header: 'Coverletter content', key: 'cov', width: 50 }
    ];  
    applyStylesToRow(coverletterSheet.getRow(1), true);  

    const transcriptSheet = workbook.addWorksheet('Transcript');    
    transcriptSheet.columns = [    
        { header: 'Interviewer', key: 'interviewer', width: 50 },    
        { header: 'Candidate', key: 'candidate', width: 50 }    
    ];    
    applyStylesToRow(transcriptSheet.getRow(1), true);    

    if (user.interview_status === 'COMPLETED' || user.interview_status === 'INCOMPLETE') {    
        // Add actual coverletter content
        const coverletterData = [{cov: user.covertext}];  
        coverletterData.forEach((dataRow) => {  
            const row = coverletterSheet.addRow(dataRow);  
            applyStylesToRow(row);  
        }); 

        // Process and add transcript content
        const transcript = formatChatlog(user);
        let interviewer_msgs = [];    
        let candidate_msgs = [];   
        const coverLetterErrorMessage = "Cover Letter PDF Invalid/Corrupted. Continue with the Interview.";  

        transcript.forEach((entry, index) => {    
            if (index === 0 && entry === coverLetterErrorMessage) {      
                return; 
            } 
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
            const row = transcriptSheet.addRow({ 
                interviewer: interviewerText, 
                candidate: candidate_msgs[i] 
            });    
            applyStylesToRow(row);     
        });  
    } else {
        // Add "INTERVIEW NOT ATTENDED" message for both sheets
        coverletterSheet.addRow([`Interview not attended`]);
        transcriptSheet.addRow({
            interviewer: 'Interview not attended',
            candidate: ''
        });
    }

    return await workbook.xlsx.writeBuffer();
  };  

  const createAttendanceExcel = async (attendanceList) => {   
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
    const attendanceSheet = workbook.addWorksheet('Attendance');  
    attendanceSheet.columns = [   
        { header: 'ID', key: 'id', width: 10 },  
        { header: 'Interview Status', key: 'stat', width: 15 },
        { header: 'Name', key: 'name', width: 20 },  
        { header: 'Interview Skill', key: 'skill', width: 15 },  
        { header: 'Skill Version', key: 'skill_ver', width: 15 }, 
        { header: 'Interview Date', key: 'idate', width: 15 }, 
        { header: 'Assign Start Time', key: 'ast', width: 20 },  
        { header: 'Assign End Time', key: 'aet', width: 20 },  
        { header: 'Assessment Category', key: 'cat', width: 20 },  
        { header: 'Assessment Pipeline', key: 'pipe', width: 20 }, 
        { header: 'Interview ID', key: 'iid', width: 20 },  
    ];  
  
    applyStylesToRow(attendanceSheet.getRow(1), true);  
  
    attendanceList.forEach((user) => {  
        const interviewStatus = getInterviewStatus(user);
        const dataRow = {  
            id: user.candidate_id || '',
            stat: user.interview_status || '',
            name: user.name || '',
            skill: user.interview_drive || '',
            skill_ver: user.interview_drive_version || '',
            idate: user.interview_date ? user.interview_date.replace(/\s/g, '') : '',
            ast: user.assigned_interview_start_time || '',
            aet: user.assigned_interview_end_time || '',
            cat: user.assessment_category || '',
            pipe: user.assessment_pipeline || '',
            iid: user.uuid || '',
        };  
        const row = attendanceSheet.addRow(dataRow);  
        applyStylesToRow(row);  

        // Apply status styles
        const statusCell = row.getCell(2); // The 'Interview Status' cell
        const styles = getStatusStyles(user.interview_status);
        statusCell.fill = styles.fill;
        statusCell.font = { ...statusCell.font, ...styles.font };
    });  
  
    return await workbook.xlsx.writeBuffer();  
}; 

  const createConfScoreExcel = async (getconfscoreList) => {    
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
    const confscoreSheet = workbook.addWorksheet('CoA Scores');  
    confscoreSheet.columns = [  
        { header: 'ID', key: 'id', width: 10 },  
        { header: 'Name', key: 'name', width: 10 },  
        { header: 'Interview Skill', key: 'skill', width: 10 },  
        { header: 'Skill Version', key: 'skill_ver', width: 10 },  
        { header: 'Interview Date', key: 'idate', width: 10 },
        { header: 'Assign Start Time', key: 'ast', width: 10 },  
        { header: 'Assign End Time', key: 'aet', width: 10 },  
        { header: 'Assessment Category', key: 'cat', width: 10 },  
        { header: 'Assessment Pipeline', key: 'pipe', width: 10 },
        { header: 'Interview Status', key: 'stat', width: 10 },
        { header: 'CoA (Confidence of Acceptance) Score, out of 100', key: 'coa', width: 10}  
    ];  
  
    applyStylesToRow(confscoreSheet.getRow(1), true);  
  
    getconfscoreList.forEach((user) => {  
        const dataRow = {  
            id: user.candidate_id,  
            name: user.name,  
            skill: user.interview_drive,  
            skill_ver: user.interview_drive_version,  
            idate: user.interview_date,
            ast: user.assigned_interview_start_time,  
            aet: user.assigned_interview_end_time,  
            cat: user.assessment_category,  
            pipe: user.assessment_pipeline,
            stat: user.interview_status,
            coa: user.confidence_score  
        };  
        const row = confscoreSheet.addRow(dataRow);  
        applyStylesToRow(row);  
    });  
  
    return await workbook.xlsx.writeBuffer();  
  }; 

  const downloadUserResultsAsZip = async (usersToProcess) => {

    if (!Array.isArray(usersToProcess) || usersToProcess.length === 0) {
    
    swal({ title: "Error", text: "No user data to process", icon: "error" });
    
    return;
    
    }
    
    
    const zip = new
     JSZip();  
    
    for (const user of usersToProcess) {  
        const interviewProfileBuffer = await createInterviewProfileExcel(user);  
        if (user.interview_date && user.interview_drive && user.assessment_category) {  
            // New folder hierarchy: status/date/category/drive
            const folder = zip.folder(`${user.interview_status}/${user.interview_date}/${user.assessment_category}/${user.interview_drive}`);  
            folder.file(`Candidate_${user.candidate_id}_interview_profile_${user.uuid}.xlsx`, interviewProfileBuffer);  
        } else {  
            // If missing required fields, store in root with status prefix
            zip.file(`${user.interview_status}_Candidate_${user.candidate_id}_interview_profile_${user.uuid}.xlsx`, interviewProfileBuffer);  
        }  
    }  
    
    const content = await zip.generateAsync({ type: "blob" });  
    swal({ title: "Success", text: "Interview profiles ready. Zip file downloading now.", icon: "success" });  
    const url = URL.createObjectURL(content);  
    const link = document.createElement('a');  
    link.href = url;  
    link.download = `interview_profiles_${file_timestamp}.zip`;  
    document.body.appendChild(link);  
    link.click();  
    document.body.removeChild(link);  
    setTimeout(() => URL.revokeObjectURL(url), 100);  
    
  };
        
  
const downloadAttendance = async (attendanceUsers) => {  
  if (!Array.isArray(attendanceUsers) || attendanceUsers.length === 0) {  
      swal({ title: "Error", text: "No user data to process", icon: "error" });  
      return;  
  }  

  try {
      const buffer = await createAttendanceExcel(attendanceUsers);  

      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });  
      const url = window.URL.createObjectURL(blob);  
      const a = document.createElement('a');  
      a.href = url;  
      a.download = `attendance_${file_timestamp}.xlsx`;  
      document.body.appendChild(a);  
      a.click();  
      document.body.removeChild(a);  
      window.URL.revokeObjectURL(url);  
      swal({ title: "Success", text: "Attendance ready. Downloading now.", icon: "success" });  
  } catch (error) {
      console.error('Error in downloadAttendance:', error);
      swal({ title: "Error", text: "An error occurred while processing the attendance data", icon: "error" });
  }
};  

const downloadConfScores = async (confscoreUsers) => {  
  if (!Array.isArray(confscoreUsers) || confscoreUsers.length === 0) {  
      swal({ title: "Error", text: "No user data to process", icon: "error" });  
      return;  
  }  

  const buffer = await createConfScoreExcel(confscoreUsers);  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });  
  const url = window.URL.createObjectURL(blob);  
  const a = document.createElement('a');  
  a.href = url;  
  a.download = `conf_of_acceptance_scores_${file_timestamp}.xlsx`;  
  document.body.appendChild(a);  
  a.click();  
  document.body.removeChild(a);  
  window.URL.revokeObjectURL(url);  
};  


  return (
    
    <Container>
      <Link
          className='btn btn-outline-light my-3 py-2'
          to='/'
        >
          <FontAwesomeIcon icon={faArrowLeft}/>&nbsp;&nbsp;Go Home
      </Link>
      <Col className='d-flex justify-content-center align-items-center'>
      </Col>
      <Row>
        <Alert className='grad'>
          <h4 className='white text-center text-capitalize mb-0'>
            DOWNLOAD INTERVIEW PROFILES
          </h4>
        </Alert>
        <h6 className="d-flex my-3 mr-3 ml-0" style={{ color: "#213e99" }}><span style={{color:"black"}}>NOTE:&nbsp;</span>To bulk download associate profiles, please select atleast one skill, interview status, assessment category, start and end date.</h6>
        <h6 className="mt-3">Interview Assessment Category</h6>
        <select value={assessmentCategory} defaultValue={"Select"} onChange={handleAssessmentCategoryChange} className="dropdown-btn" required>
          <option disabled value="Select" >Select...</option>
          <option value="Not Assigned">Not Assigned</option>
          <option value="Practice">Practice</option>
          <option value="Actual">Actual</option>
          <option value="Testing">Testing</option>
        </select>

        <h6 className="mt-3">Assessment Pipeline</h6>
        <select 
          value={assessmentPipeline} 
          onChange={handleAssessmentPipelineChange} 
          className="dropdown-btn" 
          required
        >
          <option value="" disabled>Select...</option>
          <option value="GROW">GROW</option>
          <option value="Skill 2 Deploy">Skill 2 Deploy</option>
          <option value="Project Release">Project Release</option>
          <option value="CDIT">CDIT</option>
          <option value="CIS">CIS</option>
          <option value="Genc">Genc</option>
          <option value="Ascend_L0">Ascend_L0</option>
        </select>

  
        <h6 className="mt-3">Interview Start Date</h6>
        <DatePicker
          selectsStart
          selected={startDate}
          onChange={date => setStartDate(date)}
          startDate={startDate}
          dateFormat="MMMM d, yyyy"
          className="dropdown-btn"
          placeholderText="Select Start Date"
        />

        <h6 className="mt-3">Interview End Date</h6>
        <DatePicker
          selectsEnd
          selected={endDate}
          onChange={date => setEndDate(date)}
          endDate={endDate}
          startDate={startDate}
          minDate={startDate}
          dateFormat="MMMM d, yyyy"
          className="dropdown-btn"
          placeholderText="Select End Date"
        />     
        <h6 className="mt-3">Select Interview Skill(s)</h6>
        {loadingDrives ? (  
          <p>Loading available interview skills <FontAwesomeIcon icon={faCircleNotch} spin /></p>  
        ) : (
          
            <MultiSelect
              options={interviewDriveOptions}
              value={selected}
              onChange={handleSkillSelect}
              labelledBy="Select"
              className="d-flex w-100 dropdown-btn"
            />
        )}  
        <div className="selected-skills-container">
          {selected.map(skill => (
            <div key={skill.value} className="selected-skill">
              {skill.label}
            </div>
          ))}
        </div>
      </Row>
      <Button onClick={() => { handleSubmit(); }} className='my-3' variant='btn btn-outline-light'>
        Download Profiles & Attendance
      </Button>

      {/*
      <Button onClick={() => { handleSubmit3(); }} className='my-3 mx-2' variant='btn btn-outline-light'>
        Download CoA Scores
      </Button>
      */}

    </Container>
  )
}

export default DownloadResults
