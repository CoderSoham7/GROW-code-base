import React, { useEffect, useState, useContext, useMemo } from "react"
import { Container, Table } from "react-bootstrap"
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector, useDispatch } from "react-redux";
import { updateDriveName, getAllJD } from "../Actions/UserActions";
import { AuthContext } from "../Screens/AuthContext";

const DriveTable = ({ driveAndSlotList }) => {
  const { userInfo } = useContext(AuthContext);  
  const dispatch = useDispatch();  
  const allJDList = useSelector(state => state.getAllJD.jdlist);  
  const [searchQuery, setSearchQuery] = useState('');  
  const [filterOption, setFilterOption] = useState('candidate_id'); 
  const [localDriveAndSlotList, setLocalDriveAndSlotList] = useState([]);   
  
  useEffect(() => {    
    if (userInfo && userInfo.isAdmin) {  
      dispatch(getAllJD(userInfo));    
    }    
  }, [dispatch, userInfo]);

  useEffect(() => {  
    setLocalDriveAndSlotList(driveAndSlotList);
  }, [driveAndSlotList]);  

  const handleChange = (event, candidate_id, uuid) => {  
    const newDriveName = event.target.value;  
      
    const updatedList = localDriveAndSlotList.map(item =>   
      item.uuid === uuid  
        ? { ...item, interview_drive: newDriveName }  
        : item  
    );  
    setLocalDriveAndSlotList(updatedList);  
    dispatch(updateDriveName(candidate_id, uuid, newDriveName, userInfo));  
  };    


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
    setSearchQuery('');
  };

  const filteredList = useMemo(() => {      
    if (!Array.isArray(localDriveAndSlotList)) {      
      return [];      
    }    
        
    return localDriveAndSlotList.filter((item) => { 
      const fieldValue = item[filterOption]?.toString().toLowerCase();
      const query = searchQuery.toLowerCase();
      
      if (query === '') {
        return true;
      }
    
      return fieldValue?.includes(query);
    });    
  }, [localDriveAndSlotList, searchQuery, filterOption]);  
  
  const getInterviewDriveOptions = () => {
    const interviewDrives = [...new Set(allJDList.map(jd => jd.name))];
    return interviewDrives.map(driveName => ({
      value: driveName,
      label: driveName
    }));
  };


  if (driveAndSlotList && driveAndSlotList.length > 0) { 
    return (
      <Container>
        <hr></hr>
        <div className="search-bar-wrapper" style={{justifyContent: "space-between"}}>
          <input
            className="search-bar"
            type="text"
            placeholder="&#128269; Search..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          
          <select value={filterOption} onChange={handleFilterChange} className="search-bar-dropdown">
            <option value="candidate_id">ID</option>
            <option value="name">Candidate Name</option>
            <option value="interview_drive">Interview Skill</option>
          </select>
        </div>
        <div className="table-container">
          <div className="table-header-bg"></div>
          <Table className="table-card text-center">
            <thead>
              <tr>
                <th>ID</th>
                <th>Interview ID</th>
                <th>Interview Skill</th>
                <th>Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Category-Pipeline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredList && filteredList.map((item, index) => (
                  <tr key={item.uuid}>
                  <td>{item.candidate_id}</td>
                  <td>{item.uuid}</td>
                  <td>
                    <div className="dropdown-container">
                      <select  
                        value={item.interview_drive}  
                        onChange={(event) => handleChange(event, item.candidate_id, item.uuid)}  
                        className={`dropdown-btn ${item.status === "In Progress" ? 'dropdown-btn:disabled' : ''}`}  
                        disabled={item.status === "In Progress"}
                      >  
                        <option value={item.interview_drive}>
                          {item.interview_drive}
                        </option>
                        {getInterviewDriveOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} 
                          </option>
                        ))}
                      </select>
                    </div>
                  </td> 

                  <td>{item.interview_date}</td>
                  <td>{item.assigned_interview_start_time}</td>
                  <td>{item.assigned_interview_end_time}</td>
                  <td>{item.assessment_category_assessment_pipeline}</td>
                  <td className={`${item.status === 'In Progress' ? "interview-in-progress-cand" : "interview-not-completed-cand"}`}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Container>
    )
  }
  return null;
}

export default DriveTable;
