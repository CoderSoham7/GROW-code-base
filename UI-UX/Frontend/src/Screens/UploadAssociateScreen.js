import React, { useState, useEffect, useContext } from "react"
import { Row, Col, Card, Container, Table } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import swal from 'sweetalert';  
import { multiregister, getAllJD } from "../Actions/UserActions.js"
import { useNavigate, Link } from "react-router-dom"
import Message from "../Components/Message.js"
import Loader from "../Components/Loader.js"
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 
import { AuthContext } from "./AuthContext.js"
import ExcelJS from 'exceljs'
import moment from "moment"

const UploadAssociateScreen = () => {
  const [excelFile, setExcelFile] = useState(false)
  const [excelData, setExcelData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const Navigate = useNavigate()
  const dispatch = useDispatch()
  const { userInfo, loading, error } = useContext(AuthContext); 

  useEffect(() => {  
    if (!userInfo) {  
      Navigate("/")  
    }  
    dispatch(getAllJD(userInfo));  
  }, [Navigate, userInfo, dispatch]);

  const allJD = useSelector(state => state.getAllJD.jdlist);

  const submitHandler = async (e) => {
    e.preventDefault()   
    try {  
      dispatch(multiregister(userInfo._id, excelData, userInfo))  
      .then(() => {  
      swal({  
        title: "Associate data uploaded",  
        icon: "success",  
      });  
    })  
    .catch(() => {  
      swal({  
        title: "Upload failed",  
        icon: "error",  
      });  
    }); 
    } 
    
    catch (error) {  
      swal({  
        title: "Upload failed",  
        icon: "error",  
      });
    }  
    
    if (excelFile !== null) {  
      setExcelData(null);  
      document.getElementById("fileInput").value = "";  
    }

  }


  function formatDateToFullYear(dateStr) {    
    const parts = dateStr.split(/[-/.]/);    
    if (parts.length === 3) {    
      let day = parts[0].padStart(2, '0');    
      let month = parts[1].padStart(2, '0');    
      let year = parts[2];    
      if (year.length === 2) {    
        year = '20' + year;    
      }    
      return `${day}-${month}-${year}`;    
    }    
    return dateStr;    
  }  

  
  function formatDateToConsistentFormat(dateStr) {
    // Handle multiple input formats
    const possibleFormats = [
      'MM/DD/YYYY',   // Excel default
      'DD-MM-YYYY',   // Desired format
      'YYYY-MM-DD',   // ISO format
      'MM-DD-YYYY'    // Alternative format
    ];
  
    for (let format of possibleFormats) {
      const momentDate = moment(dateStr, format, true);
      if (momentDate.isValid()) {
        // Always return in DD-MM-YYYY
        return momentDate.format('DD-MM-YYYY');
      }
    }
  
    throw new Error(`Invalid date format: \${dateStr}`);
  }


  const AssociateDataUploadHandler = async (e) => {  
    const file = e.target.files[0];  
    const allowedTypes = [  
      'application/vnd.ms-excel',  
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  
      'text/csv'  
    ];  
    
    if (file && allowedTypes.includes(file.type)) {  
      const workbook = new ExcelJS.Workbook();  
      const reader = new FileReader();  
      
      reader.onload = async (e) => {  
        const arrayBuffer = e.target.result;  
        await workbook.xlsx.load(arrayBuffer);  
        const worksheet = workbook.getWorksheet(1);  
        let data = [];  
        
        worksheet.eachRow((row, rowNumber) => {  
          if (rowNumber > 1) {  
            const rowData = {};  
            row.eachCell((cell, colNumber) => {  
              const key = worksheet.getRow(1).getCell(colNumber).value;  
              let cellValue = cell.value;  
              
              // Special handling for date
              if (key === 'interview_date') {
                if (cellValue instanceof Date) {
                  // Convert Excel date to DD-MM-YYYY
                  const formattedDate = 
                    ('0' + cellValue.getDate()).slice(-2) + '-' +
                    ('0' + (cellValue.getMonth() + 1)).slice(-2) + '-' +
                    cellValue.getFullYear();
                  rowData[key] = formattedDate;
                } else if (typeof cellValue === 'string') {
                  // Handle various string date formats
                  try {
                    const parsedDate = moment(cellValue, [
                      'MM/DD/YYYY', 
                      'DD-MM-YYYY', 
                      'YYYY-MM-DD', 
                      'MM-DD-YYYY'
                    ]);
                    
                    if (parsedDate.isValid()) {
                      rowData[key] = parsedDate.format('DD-MM-YYYY');
                    } else {
                      // If no valid format found, keep original
                      rowData[key] = cellValue;
                    }
                  } catch (error) {
                    rowData[key] = cellValue;
                  }
                } else {
                  rowData[key] = cellValue;
                }
              } else {
                // Handle other fields as before
                if (['interview_start_time', 'interview_end_time'].includes(key) && cellValue instanceof Date) {  
                  const timeInIST = new Date(cellValue.getTime());  
                  const hours = timeInIST.getUTCHours();  
                  const minutes = ('0' + timeInIST.getUTCMinutes()).slice(-2);  
                  const amPm = hours >= 12 ? 'PM' : 'AM';  
                  const formattedTime = ((hours % 12) || 12) + ':' + minutes + ' ' + amPm;  
                  rowData[key] = formattedTime;  
                } else if (typeof cellValue === 'object' && cellValue) {   
                  if (cellValue.text) {  
                    rowData[key] = cellValue.text;  
                  } else if (cellValue.hyperlink) {  
                    rowData[key] = cellValue.hyperlink;  
                  } else {  
                    rowData[key] = JSON.stringify(cellValue);  
                  }  
                } else {  
                  rowData[key] = cellValue;  
                }
              }
            });  
            data.push(rowData);  
          }  
        });  
    
        setExcelData(data);  
      };  
      reader.readAsArrayBuffer(file);  
    } else {  
      alert('Please upload a csv/xls/xlsx file only.');  
      e.target.value = null;  
    }  
  };
  

  const guidelinesList = [
    'In the excel template for uploading associate data, you will find 8 fields: candidate_id, name, email, interview_skill, interview_date, interview_start_time, interview_end_time, assessment_category',
    'To fill field candidate_id: Enter the associate\'s employee ID here.',
    'To fill field name: Enter the associate\'s full name here (first name, middle name, last name, initials)',
    'To fill field email: Enter the associate\'s work email id (which ends with @cognizant.com)',
    'To fill field interview_drive: Enter the skill name you want to assign to the associate',
    'To fill field interview_date: Assign interview date to associate; dd-mm-yy format only',
    'To fill field interview_start_time and interview_end_time: Enter interview time slot to associate; hh/h:mm AM/PM format only',
    'To fill field assessment_category: Enter assessment category for associate; categories are Testing/Practice/Actual',
    'To fill field assessment_pipeline: Enter assessment pipeline for associate; categories are GROW/Skill 2 Deploy/Project Release/Lateral Hiring',
    'Please download excel template provide on the page.',
    'Click on the \'Download Interview Skills List\' button to view the existing interview skills available ',
    'Enter the candidate\'s information in the appropriate columns, following the format and guidelines provided in the template.',
    'Failure to follow these guidelines may result in improper account details reflection or issues with the interview application. Please ensure that you adhere to the guidelines to ensure a smooth experience.',
    'Maximum no. of records in a file: 500 only.'
  ];

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
  
  const headerFont = {  
    bold: true 
  };    
  const alignmentWrapText = {  
    vertical: 'top',  
    horizontal: 'left',  
    wrapText: true  
  };      

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        "candidate_id": 2000001,
        "name": "firstNameOne lastNameOne",
        "email": "firstName1.lastName1@cognizant.com",
        "interview_drive": "Jr. ML Engineer (PL1)",
        "interview_date": "22-01-24",
        "interview_start_time": "10:30 AM",
        "interview_end_time": "12:30 PM",
        "assessment_category": "Testing",
        "assessment_pipeline": "GROW"
      },
      {
        "candidate_id": 2000002,
        "name": "firstNameTwo lastNameTwo",
        "email": "firstName2.lastName2@cognizant.com",
        "interview_drive": "Informatica MDM Developer (PL2)",
        "interview_date": "15-01-24",
        "interview_start_time": "11:30 AM",
        "interview_end_time": "1:30 PM",
        "assessment_category": "Practice",
        "assessment_pipeline": "Skill 2 Deploy"
      },
      {
        "candidate_id": 2000003,
        "name": "firstNameThree lastNameThree",
        "email": "firstName3.lastName3@cognizant.com",
        "interview_drive": "AWS Data Engineer (PL3)",
        "interview_date": "22-01-24",
        "interview_start_time": "10:00 AM",
        "interview_end_time": "1:00 PM",
        "assessment_category": "Actual",
        "assessment_pipeline": "Project Release"
      },
      {
        "candidate_id": 2000004,
        "name": "firstNameFour lastNameFour",
        "email": "firstName4.lastName4@cognizant.com",
        "interview_drive": "Jr. Pyspark Data Engineer (PL1)",
        "interview_date": "22-01-24",
        "interview_start_time": "10:30 AM",
        "interview_end_time": "12:30 PM",
        "assessment_category": "Testing",
        "assessment_pipeline": "GROW"
      },

    ];
    const workbook = new ExcelJS.Workbook();  
    const applyStylesToRow = (row, isHeader = false) => {  
      row.eachCell({ includeEmpty: true }, (cell) => {  
        cell.alignment = alignmentWrapText; 
        if (isHeader) {   
          cell.font = headerFont;  
        }  
      });  
    };  
    const worksheet = workbook.addWorksheet('Template');  
    worksheet.columns = Object.keys(templateData[0]).map(key => ({  
      header: key,  
      key: key,  
      width: 20,  
    }));   
    templateData.forEach(item => {  
      const row = worksheet.addRow(item);  
      applyStylesToRow(row)
    });  
    
    workbook.xlsx.writeBuffer().then((buffer) => {  
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });  
      triggerDownload(blob, `Associate_Data_Upload_Template.xlsx`);
    });  
  };  

  const downloadJDFile = () => {
    const JDnames = allJD.map(item => item.name);
    const textToWrite = JDnames.join('\n');
    const element = document.createElement('a');
    const file = new Blob([textToWrite], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'Existing_Interview_Skills.txt';
    document.body.appendChild(element);
    element.click();
  };
  return (
    <div className="minheight grad">
      <Container>
      <Link
          className='btn btn-outline-light my-3 py-2'
          to='/'
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-2"/> Go Home
      </Link>
        <Row className='d-flex justify-content-center align-items-center bulkupload-custom-row'>
          <Col className='d-flex justify-content-center align-items-center m-1'>
            <Card className='bulkupload-card-rounded  p-2'>
              {error && <Message variant='danger'>error</Message>}
              <Card.Header style={{ color: "#08084e" }} as='h4' className="mb-3">
                Upload Associate Data
              </Card.Header>

              <Card.Body  >

                <div>
                  {loading && <Loader />}
                  <Form onSubmit={submitHandler}>

                    <div className="guidelines">
                      <h4>Guidelines</h4>
                      <ol>
                        {guidelinesList.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ol>

                      <div className="guidelines">
                        <h4>Associate Data Upload Template</h4>
                        <Button className='m-2' variant='outline-secondary' size="sm" onClick={downloadExcelTemplate}>
                          Download Associate Data Upload Template
                        </Button>
                      </div>

                      <div className="guidelines">
                        <h4>Interview Skills List</h4>
                        <Button className='m-2' variant='outline-secondary' size="sm" onClick={downloadJDFile}>
                          Download Interview Skills List
                        </Button>
                      </div>
                      
                    </div> 

                    <Form.Group
                      className='mb-4'
                      controlId='formGridResUpload'
                      aria-describedby='fileHelpBlock'
                    >
                      <Form.Label>Upload Associate Data file here.</Form.Label>
                      <Form.Control
                        type='file'
                        id="fileInput"
                        accept='.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        maxSize={5 * 1024 * 1024}
                        
                        placeholder='Upload CSV or Excel File.'
                        onChange={AssociateDataUploadHandler}
                        required
                      />

                    </Form.Group>                  

                    <Button className='my-2' variant='btn btn-outline-light' type='submit'>
                      SUBMIT
                    </Button>
                  </Form>      
                  {excelData ? (
                    <div className="table-container" style={{ maxHeight: "500px", overflow: "auto" }}>
                      <Table responsive className="table-card text-center borderless">
                        <thead className="custom-col white">
                          <tr>
                            {Object.keys(excelData[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelData.map((individualExcelData, index) => (
                            <tr key={index}>
                              {Object.keys(individualExcelData).map((key) => (
                                <td key={key}>{individualExcelData[key]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>           

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default UploadAssociateScreen