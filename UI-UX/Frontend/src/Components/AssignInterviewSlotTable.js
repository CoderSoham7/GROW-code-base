import React, { useEffect, useState, useContext, useMemo } from "react"
import { Container, Table } from "react-bootstrap"
import 'react-datepicker/dist/react-datepicker.css';
import { useDispatch } from "react-redux";
import { assignInterviewStartTime, assignInterviewEndTime, assignInterviewDate } from "../Actions/UserActions";
import { AuthContext } from "../Screens/AuthContext";

const AssignInterviewSlotTable = ({ driveAndSlotList }) => {
  const { userInfo } = useContext(AuthContext);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('candidate_id');
  const [localDriveAndSlotList, setLocalDriveAndSlotList] = useState([]);

  useEffect(() => {
    setLocalDriveAndSlotList(driveAndSlotList);
  }, [driveAndSlotList]);

  // Helper functions for date and time handling
  const formatDate = (dateString) => {
    if (!dateString || dateString === "NA") return "";
    const [day, month, year] = dateString.split(' - ');
    return `${year}-${month}-${day}`;
  };

  const convertDate = (inputFormat) => {
    if (!inputFormat || inputFormat === "NA") return "";
    const [year, month, day] = inputFormat.split('-');
    return `${day} - ${month} - ${year}`;
  };

  const standardizeTime = (timeString) => {
    if (!timeString || timeString === "NA") {
      return "Not Assigned";
    }
    // More permissive regex that allows both h:mm and hh:mm formats
    const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
    if (timeRegex.test(timeString)) {
      // If it's a valid time, return it as is for display
      return timeString;
    }
    return "Not Assigned";
  };

  const formatTimeForAPI = (timeString) => {
    if (timeString === "Not Assigned") {
      return "";
    }
    // Extract hours, minutes, and AM/PM
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    
    // Convert hours to single digit if it's not 10, 11, or 12
    hours = (hours.length === 2 && hours !== "10" && hours !== "11" && hours !== "12") 
      ? hours.replace(/^0/, '')
      : hours;
  
    return `${hours}:${minutes} ${period}`;
  };

  const handleDateChange = (event, candidateId, uuid) => {
    const newDate = convertDate(event.target.value);
    const updatedList = localDriveAndSlotList.map(item =>
      item.uuid === uuid
        ? { ...item, interview_date: newDate }
        : item
    );
    setLocalDriveAndSlotList(updatedList);
    dispatch(assignInterviewDate(candidateId, uuid, newDate, userInfo));
  };

  const handleTimeChange = (event, candidateId, uuid, timeType) => {
    const newTime = event.target.value === "Not Assigned" ? "" : formatTimeForAPI(event.target.value);
    const updatedList = localDriveAndSlotList.map(item =>
      item.uuid === uuid
        ? { ...item, [timeType]: newTime }
        : item
    );
    setLocalDriveAndSlotList(updatedList);
    if (timeType === 'assigned_interview_start_time') {
      dispatch(assignInterviewStartTime(candidateId, uuid, newTime, userInfo));
    } else {
      dispatch(assignInterviewEndTime(candidateId, uuid, newTime, userInfo));
    }
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

  const getTimeOptions = () => {
    const options = ["Not Assigned"];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hourFormatted = (hour % 12 || 12).toString();
        const minuteFormatted = minute.toString().padStart(2, '0');
        const time = `${hourFormatted}:${minuteFormatted} ${ampm}`;
        options.push(time);
      }
    }
    return options;
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
              <td>{item.interview_drive}</td>
              <td>
                <input
                  type="date"
                  value={formatDate(item.interview_date)}
                  onChange={(e) => handleDateChange(e, item.candidate_id, item.uuid)}
                  disabled={item.status === "In Progress"}
                  className="dropdown-btn"
                />
              </td>
              <td>
                <select
                  value={standardizeTime(item.assigned_interview_start_time)}
                  onChange={(e) => handleTimeChange(e, item.candidate_id, item.uuid, 'assigned_interview_start_time')}
                  disabled={item.status === "In Progress"}
                  className="dropdown-btn"
                >
                  {getTimeOptions().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={standardizeTime(item.assigned_interview_end_time)}
                  onChange={(e) => handleTimeChange(e, item.candidate_id, item.uuid, 'assigned_interview_end_time')}
                  className="dropdown-btn"
                >
                  {getTimeOptions().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </td>
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

export default AssignInterviewSlotTable;