import React, { useEffect, useState, useContext } from 'react';  
import { Table, Row, Col, Button } from 'react-bootstrap';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useDispatch, useSelector } from 'react-redux';  
import { AuthContext } from './AuthContext';  
import { listSingleUser } from '../Actions/UserActions';  
import ExcelJS from 'exceljs'
//import swal from "sweetalert"
  
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const DisplayResultAnalysisPage = () => {  
  const navigate = useNavigate();  
  const dispatch = useDispatch();  
  const { userInfo } = useContext(AuthContext);  
  const { id } = useParams();  
  
  const user = useSelector((state) => state.singleUserList.singleUserList);  
  const [resJson, setResJson] = useState([]);  
  const [yes, setYes] = useState();  
  const [no, setNo] = useState();  
  const [unknown, setUnknown] = useState();  
  const [yespercentage, setyesPercentage] = useState();  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {  
    if (!userInfo) {  
      navigate('/login');  
    } else {  
      dispatch(listSingleUser(id, userInfo));  
    }  
  }, [navigate, userInfo, dispatch, id]);  
  
  useEffect(() => {  
    if (user && user.result_json) {  
      const transformedResultJson = Object.entries(user.result_json).map(  
        ([question, details]) => ({  
          question,  
          ...details,  
        })  
      );  
      setResJson(transformedResultJson);  
    }  
  }, [user]);  
  
  useEffect(() => {  
    if (resJson.length > 0) {  
      let yesCount = 0;  
      let noCount = 0;  
      let unknownCount = 0;  
      let yesper = 0;  
      resJson.forEach((item) => {  
        const answer = item.Answer.toLowerCase();  
        if (answer === 'yes') {  
          yesCount++;  
        } else if (answer === 'no') {  
          noCount++;  
        } else if (answer === 'unknown') {  
          unknownCount++;  
        }  
      });  
      setYes(yesCount);  
      setNo(noCount);  
      setUnknown(unknownCount);  
      yesper = (yesCount / (yesCount + noCount)) * 100;  
      setyesPercentage(yesper.toFixed(2));  
      setLoading(false);
    }  
  }, [resJson]);  
  
  if (loading) {  
    return <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>;  
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
      { info: "Interview Label", details: user.interview_label}
    ];  
    basicInfoData.forEach((dataRow) => {  
      const row = basicInfoSheet.addRow(dataRow);  
      applyStylesToRow(row);  
    }); 
    
    const evalInfoSheet = workbook.addWorksheet('Evaluation Criteria Summary');  
    evalInfoSheet.columns = [  
      { header: 'Evaluation Criteria', key: 'info', width: 25 },  
      { header: 'Value', key: 'details', width: 50 }  
    ];  
    applyStylesToRow(evalInfoSheet.getRow(1), true);  
    const evalInfoData = [  
      { info: "Yes", details: `${yes}/20` },  
      { info: "No", details: `${no}/20` }, 
      { info: "Unknown", details: `${unknown}/20`},
    ];  
    evalInfoData.forEach((dataRow) => {  
      const row = evalInfoSheet.addRow(dataRow);  
      applyStylesToRow(row);  
    }); 
    

    const resultAnalysisSheet = workbook.addWorksheet('Evaluation Summary');   
    resultAnalysisSheet.columns = [  
      { header: 'Checklist', key: 'question', width: 25 },  
      { header: 'Evaluation', key: 'answer', width: 25 },  
      { header: 'Justification', key: 'justification', width: 25 },  
      { header: 'Reference from Transcript', key: 'reference', width: 50 },  
    ];      
    applyStylesToRow(resultAnalysisSheet.getRow(1), true);  
 
    const qaData = resJson;  
    if (qaData && qaData.length > 0) {  
      qaData.forEach((item) => {  
       const row = resultAnalysisSheet.addRow({  
            question: item.question,  
            answer: item.Answer,  
            justification: item.Justification,  
            reference: formatReference(item.Reference, true),  
          });  
          applyStylesToRow(row);  
        });  
      }  
      
      const buffer = await workbook.xlsx.writeBuffer();  
      triggerDownload(buffer, `Candidate_${user.candidate_id}_interview_evaluation_summary.xlsx`);  
    };  



    const formatReference = (reference, isExcel) => {  
      if (!reference) return reference;  
    
      const separator = isExcel ? "\n\n" : '<br></br>'

      const formattedReference = reference  
      .replace(/\*\*/g, '')
      .replace(/^:\s?/, "")  
      .replace(/Interviewer:\s?/g, "\nInterviewer: ")  
      .replace(/Candidate:\s?/g, "\nCandidate: ")  
      .replace(/\n+/g, '\n')  
      .trim()  
      .replace(/\n/g, separator);     

      return formattedReference;  
    };      

  
  if (!user || !user.result_json) {  
    return <div>No Data Available</div>;  
  }

  return (  
    <div className="container mt-5">  
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
            <div style={{ marginBottom: "10px" }}><strong>Interview Label:</strong> {user.interview_label}</div>  
            <div><strong>Evaluation Criteria Summary</strong></div> 
            <div><strong>Yes:</strong> {yes}/20</div>  
            <div><strong>No:</strong> {no}/20</div> 
            <div><strong>Unknown:</strong> {unknown}/20</div>
          </Col>   
        </Row>  
      </div>  
      <Table striped bordered hover className='eval-container eval-table'>  
        <thead>  
          <tr>  
            <th>Checklist</th>  
            <th>Evaluation</th>  
            <th>Justification</th>  
            <th>Reference from Transcript</th>  
          </tr>  
        </thead>  
        <tbody>  
          {user && user.result_json && resJson.length > 0 ? (  
            resJson.map((item, index) => (  
            <tr key={index}>  
              <td>{item.question}</td>  
              <td>{item.Answer}</td>  
              <td>{item.Justification}</td>  
              <td dangerouslySetInnerHTML={{ __html: formatReference(item.Reference, false) }} /> 
            </tr>  
            ))  
          ) : (  
            <tr>  
              <td colSpan="4" className="text-center">No Data Available</td>  
            </tr>  
          )}  
        </tbody>  
      </Table>  
    </div>  
  );  
};  
  
export default DisplayResultAnalysisPage;  
