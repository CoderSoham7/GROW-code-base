import React, { useEffect, useState, useContext } from 'react';  
import { Table, Row, Col, Container, Button } from 'react-bootstrap';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useDispatch, useSelector } from 'react-redux';  
import { AuthContext } from './AuthContext';  
import { listSingleUser } from '../Actions/UserActions';  
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";  
import ExcelJS from 'exceljs'
  
const DisplayEvalSummaryPage = () => {  
    const navigate = useNavigate();  
    const dispatch = useDispatch();  
    const { userInfo } = useContext(AuthContext);  
    const { id } = useParams();  
  
    const user = useSelector((state) => state.singleUserList.singleUserList);  
    const [resJson, setResJson] = useState([]);  
    const [loading, setLoading] = useState(true);  
  
    useEffect(() => {  
        if (!userInfo) {  
            navigate('/login');  
        } else {  
            dispatch(listSingleUser(id, userInfo));  
        }  
    }, [navigate, userInfo, dispatch, id]);  
     
    useEffect(() => {
        if (user && user.eval_summ_json) {            
            if (typeof user.eval_summ_json === 'string') {
                try {
                    user.eval_summ_json = JSON.parse(user.eval_summ_json);
                } catch (e) {
                    console.error("Failed to parse eval summary:", e);
                }
            }
            
            const resultAnalysis = user.eval_summ_json["Result Analysis and Summary"];
            if (!resultAnalysis) {
                return;
            } 
            else {
                const transformedResultJson = [];
                const processSection = (sectionName, categoryName) => {
                    const section = resultAnalysis[sectionName];
                    if (section && typeof section === 'object') {
                        const items = Object.entries(section).map(([key, value]) => ({
                            category: categoryName,
                            key,
                            value
                        }));
                        transformedResultJson.push(...items);
                    } else {
                        console.warn(`${sectionName} is not an object or is missing`);
                    }
                };
    
                processSection("Strengths of the candidate's profile", "Strengths");
                processSection("Weaknesses of the candidate's profile", "Weaknesses");
                processSection("Additional Comments about the candidate's profile and performance", "Additional Comments");
    
                if (resultAnalysis["Overall summary about the Candidate"]) {
                    transformedResultJson.push({
                        category: "Summary",
                        key: "Overall summary",
                        value: resultAnalysis["Overall summary about the Candidate"]
                    });
                } else {
                    console.warn("Overall summary is missing");
                }
    
                setResJson(transformedResultJson);
                setLoading(false);
            }
        } 
    }, [user]);
    
  
    if (loading) {  
        return <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>;  
    }  
  
    if (!user || !user.eval_summ_json) {
        return <div>No evaluation data available</div>;
    }
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
        fgColor: { argb: 'FFA7DDDE' },  
      };  
        
      const headerFont = {  
        color: { argb: 'FF08084E' },  
      };      
        
      const alignmentWrapText = {  
        vertical: 'middle',  
        horizontal: 'left',  
        wrapText: true,  
      };  
        
      const borderStyles = {  
        top: { style: 'thin' },  
        left: { style: 'thin' },  
        bottom: { style: 'thin' },  
        right: { style: 'thin' },  
      };  
        
    const downloadEval = async () => {  
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
        const basicInfoData = [  
            { info: "Candidate Name", details: user.name },  
            { info: "ID", details: user.candidate_id }, 
            { info: "Assessment Category", details: user.assessment_category }, 
            { info: "Assessment Pipeline", details: user.assessment_pipeline },  
            { info: "Coverletter & Image Uploaded", details: user.isImgCoverletter ? 'Uploaded' : 'Not uploaded' },  
            { info: "Interview Skill Name", details: `${user.interview_drive} - ${user.interview_drive_version}` },  
            { info: "Interview Date", details: user.interview_date },  
            { info: "Assigned Interview Time Slot", details: `${standardizeTime(user.assigned_interview_start_time)} IST - ${standardizeTime(user.assigned_interview_end_time)} IST` },  
            { info: "Interview Start Time", details: user.interview_start_time === '00:00:00 AM' ? 'Interview not started' : convertTo12HourFormat(user.interview_start_time) },  
            { info: "Interview End Time", details: user.interview_end_time === '00:00:00 AM' ? 'Interview not ended' : convertTo12HourFormat(user.interview_end_time) },  
            { info: "Interview Completion Status", details: interviewCompletionStatus(user.interview_start_time, user.interview_end_time, user.interview_completed)},
            { info: "Interview Duration", details: user.interview_end_time === '00:00:00 AM' || user.interview_start_time === '00:00:00 AM' ? 'Interview duration unavailable' : calculateDuration(user.interview_start_time, user.interview_end_time) },  
            { info: "Interview Label", details: user.interview_label },
        ];  

        if (typeof user.confidence_score === 'number') {  
            basicInfoData.push({ info: "Confidence of Acceptance (out of 100)", details: user.confidence_score });  
          }  
          
        basicInfoData.forEach((dataRow) => {  
        const row = basicInfoSheet.addRow(dataRow);  
        applyStylesToRow(row);  
        }); 
          
    
        const evalInfoSheet = workbook.addWorksheet('Evaluation Summary');  
        evalInfoSheet.columns = [  
        { header: 'Category', key: 'category', width: 25 },  
        { header: 'Details', key: 'details', width: 50 },  
        ];  
        applyStylesToRow(evalInfoSheet.getRow(1), true);  
    
        const addSectionHeader = (title) => {  
        const row = evalInfoSheet.addRow([title]); 
        evalInfoSheet.mergeCells(`A${row.number}:B${row.number}`);
        row.getCell(1).style = {  
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04D2D9' } },  
            font: { color: { argb: 'FF08084E'}},  
            alignment: { vertical: 'middle', horizontal: 'left' },  
        };  
        };  
    
        const edata = resJson;
        const addDataRows = (category) => {  
        edata.filter(item => item.category === category).forEach((item) => {  
            const row = evalInfoSheet.addRow({ category: item.key, details: item.value });  
            applyStylesToRow(row);  
        });  
        };  
    
        // Add data to the worksheet  
        addSectionHeader('STRENGTHS');  
        addDataRows('Strengths');  
    
        addSectionHeader('WEAKNESSES');  
        addDataRows('Weaknesses');  
    
        addSectionHeader('ADDITIONAL COMMENTS');  
        addDataRows('Additional Comments');  
    
        addSectionHeader('SUMMARY');  
        const summary = edata.find(item => item.category === 'Summary');  
        const summaryRow = evalInfoSheet.addRow({ category: 'Overall summary', details: summary ? summary.value : '' });  
        applyStylesToRow(summaryRow);  
    
        // Create the excel file  
        const buffer = await workbook.xlsx.writeBuffer();  
        triggerDownload(buffer, `Candidate_${user.candidate_id}_interview_evaluation_summary.xlsx`);  
        };  
  
    return (  
        <Container className="mt-5"> 
        <Button className='btn btn-outline-light my-3 py-2' onClick={downloadEval}>
      DOWNLOAD EVAL SUMMARY
      </Button> 
            <div className="info-box">  
                <Row>  
                    <Col xs={8}>  
                        <div style={{ marginBottom: "10px" }}><strong>Name:</strong> {user.name}</div>  
                        <div><strong>Candidate ID:</strong> {user.candidate_id}</div>  
                    </Col>  
                    <Col xs={4} className="text-right">  
                        <div style={{ marginBottom: "10px" }}><strong>Interview Skill:</strong> {user.interview_drive}</div>  
                        <div><strong>Confidence of Acceptance:</strong> {user.confidence_score}</div>  
                    </Col>  
                </Row>  
            </div>  

            {resJson.length > 0 ? (
            <Table striped bordered hover className='eval-container eval-table'>  
                <thead>  
                    <tr>  
                        <th style={{width:"10%"}}>Category</th>  
                        <th>Details</th>  
                    </tr>  
                </thead>  
                <tbody>  
                    <tr>  
                        <td colSpan="2" className="eval-table section-header">STRENGTHS</td>  
                    </tr>  
                    {resJson.filter(item => item.category === "Strengths").map((item, index) => (  
                        <tr key={index}>  
                            <td>{item.key}</td>  
                            <td>{item.value}</td>  
                        </tr>  
                    ))}  
                    <tr>  
                        <td colSpan="2" className="eval-table section-header">WEAKNESSES</td>  
                    </tr>  
                    {resJson.filter(item => item.category === "Weaknesses").map((item, index) => (  
                        <tr key={index}>  
                            <td>{item.key}</td>  
                            <td>{item.value}</td>  
                        </tr>  
                    ))}  
                    <tr>  
                        <td colSpan="2" className="eval-table section-header">ADDITIONAL COMMENTS</td>  
                    </tr>  
                    {resJson.filter(item => item.category === "Additional Comments").map((item, index) => (  
                        <tr key={index}>  
                            <td>{item.key}</td>  
                            <td>{item.value}</td>  
                        </tr>  
                    ))}  
                    <tr>  
                        <td colSpan="2" className="eval-table section-header">SUMMARY</td>  
                    </tr>  
                    <tr>  
                        <td>Overall summary</td>  
                        <td>{resJson.find(item => item.category === "Summary")?.value}</td>  
                    </tr>  
                </tbody>  
                </Table> 
            ) : (
                <div>No evaluation data to display</div>
            )}
        </Container>  
    );  
};  
  
export default DisplayEvalSummaryPage;  

