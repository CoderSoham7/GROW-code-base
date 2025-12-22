import React, { useEffect, useContext, useState } from "react";  
import { Container, Row, Col, InputGroup, Badge, Button, Alert } from "react-bootstrap";  
import { useDispatch, useSelector } from "react-redux";  
import { useNavigate } from "react-router-dom";  
import { Link } from "react-router-dom";  
import { faArrowLeft, faTimes, faCircleNotch } from '@fortawesome/free-solid-svg-icons';  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";  
import { AuthContext } from "./AuthContext.js";  
import { getDriveAndSlot } from "../Actions/UserActions.js"; // Update this import
import DriveTable from "../Components/DriveTable.js"
import swal from 'sweetalert';  

const AssignDriveScreen = () => {  
  const { userInfo } = useContext(AuthContext);  
  const Navigate = useNavigate();  
  const dispatch = useDispatch();  
  
  const [inputValue, setInputValue] = useState('');  
  const [candidateIds, setCandidateIds] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const candidate_id_regex = /^[1-9]\d*$/;
  
  const { driveAndSlotList, loading, error } = useSelector(state => state.getDriveAndSlot);

  useEffect(() => {  
    if (!userInfo) {  
      Navigate("/login");  
    }  
  }, [userInfo, Navigate]); 
  
  const handleInputChange = (e) => {  
    setInputValue(e.target.value);  
  };  
  
  const handleInputKeyDown = (e) => {       
    if (e.key === 'Backspace' && inputValue === '') {    
      setCandidateIds(candidateIds.slice(0, -1));    
    } else if (e.key === ',' || e.key === 'Enter') {    
      const valueToAdd = inputValue.trim();    
      if (valueToAdd && candidate_id_regex.test(valueToAdd)) {  
        if (!candidateIds.includes(valueToAdd)) {  
          setCandidateIds([...candidateIds, valueToAdd]);    
          setInputValue('');    
        } else {  
          swal({    
            title: "Duplicate ID",    
            text: "ID already exists in text area.",    
            icon: "warning",    
          }).then(() => {    
            setInputValue('');  
          });    
        }  
      } else if (valueToAdd) {    
        swal({    
          title: "Invalid ID",    
          text: "Please enter a valid candidate ID. Candidate IDs should only contain numbers and must not start with zero.",    
          icon: "error",    
        }).then(() => {    
          setInputValue('');  
        });    
      }    
      e.preventDefault();    
    }    
  };  
  
  const handleInputPaste = (e) => {  
    e.preventDefault(); 
    const pasteContent = e.clipboardData.getData('text');  
    const newIds = pasteContent.split(',').map(id => id.trim()).filter(id => candidate_id_regex.test(id) && !candidateIds.includes(id));  
    setCandidateIds([...candidateIds, ...newIds]);  
  };    
  
  const removeId = (indexToRemove) => {  
    setCandidateIds(candidateIds.filter((_, index) => index !== indexToRemove));  
  };  
  
  const handleSubmit = () => {  
    const trimmedInputValue = inputValue.trim();  
    if (trimmedInputValue) {  
      swal({  
        title: "Stray ID Detected",  
        text: "Please ensure all IDs are comma-separated before submitting.",  
        icon: "warning",  
      });  
    }
    else {  
      if (candidateIds.length > 0) {
        dispatch(getDriveAndSlot(candidateIds, userInfo));
        setShowTable(true);
      }
    }
  };  

  useEffect(() => {  
  if (!loading && !error && driveAndSlotList.length > 0 && showTable) {
    const receivedCandidateIds = new Set(driveAndSlotList.map(item => item.candidate_id.toString())); 
    const missingIds = candidateIds.filter(id => !receivedCandidateIds.has(id.toString()));
    if (missingIds.length > 0){
      swal({  
        title: "Missing Candidate IDs",  
        text:  `The following IDs are NOT in database: ${missingIds.join(', ')}`,  
        icon: "warning",    
      }); 
    } else {
      swal({  
        title: "IDs found successfully",
        icon: "success",    
      }); 
    }
  }  
  else if (!loading && error) {  
    setShowTable(false);  
    swal({  
      title: "Error",  
      text: error,
      icon: "error",    
    });
  }  
}, [loading, error, driveAndSlotList, showTable, candidateIds]);

  return (  
  <div className="minheight white">
    <Container>  
    <Link
          className='btn btn-outline-light my-3 py-2'
          to='/'
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-2"/> Go Home
      </Link>
      <Alert className='grad'>
          <h4 className='white text-center text-capitalize mb-0'>
          Interview Skill Assignment
          </h4>
      </Alert>   
      <Col className='d-flex justify-content-center align-items-center mb-4'>     
        <InputGroup className="mb-3">  
          <div className="flex-grow-1 d-flex flex-wrap align-items-center filter-div">  
            {candidateIds.map((id, index) => (  
              <Badge pill key={index} bg="secondary" className="me-2 d-flex align-items-center">  
                {id} <FontAwesomeIcon icon={faTimes} onClick={() => removeId(index)} style={{ cursor: 'pointer', marginLeft: '0.5rem' }} />  
              </Badge>  
            ))}  
            <input  
              type="text"  
              placeholder="Enter IDs separated by commas"  
              className="border-0 p-0 filter-text-area"  
              value={inputValue}  
              onChange={handleInputChange}  
              onKeyDown={handleInputKeyDown}  
              onPaste={handleInputPaste} 
            />  
          </div>  
        </InputGroup>    
      </Col>  
      <Row className="mb-3 justify-content-center">  
        <Col xs="auto"> 
          <Button className="btn btn-outline-light" onClick={handleSubmit} disabled={loading || candidateIds.length === 0}>  
            Submit IDs  
          </Button> 
        </Col>
      </Row>
      {showTable && !loading && !error && (  
        <Row className="mb-5">
            <DriveTable driveAndSlotList={driveAndSlotList} />  
        </Row>  
      )}  
      {loading && <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>}  
      {error && <div>Error: {error}</div>}  
    </Container> 
  </div>   
  );  
};  
  
export default AssignDriveScreen;  