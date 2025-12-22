import React, { useEffect, useState, useContext, useMemo } from "react";
import { Container, Alert, Table, Button, Spinner, Modal, Form } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { listUsers } from "../Actions/UserActions";
import { faLongArrowAltRight, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "../Screens/AuthContext";

const TableComp = () => {
  const { userInfo } = useContext(AuthContext);
  const dispatch = useDispatch();
  const { userList, loading, error, hasMore, nextLastTimestamp, nextLastId } = useSelector((state) => state.userList);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState([{ timestamp: null, id: null }]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [candidateIds, setCandidateIds] = useState([]);

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listUsers(userInfo));
      setCurrentPage(1);
      setPageHistory([{ timestamp: null, id: null }]);
      setCandidateIds([]);
    }
  }, [dispatch, userInfo]);

  const handleNextPage = () => {
    if (hasMore) {
      dispatch(listUsers(userInfo, nextLastTimestamp, nextLastId));
      setPageHistory([...pageHistory, { timestamp: nextLastTimestamp, id: nextLastId }]);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = pageHistory[currentPage - 2];
      dispatch(listUsers(userInfo, prevPage.timestamp, prevPage.id));
      setPageHistory(pageHistory.slice(0, -1));
      setCurrentPage(currentPage - 1);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmitFilter = () => {
    const ids = inputValue.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    setCandidateIds(ids);
    dispatch(listUsers(userInfo, null, null, ids));
    setShowFilterModal(false);
    setInputValue('');
  };

  const handleLoadAllRecords = () => {
    setCandidateIds([]);
    dispatch(listUsers(userInfo));
    setCurrentPage(1);
    setPageHistory([{ timestamp: null, id: null }]);
  };

  if (error) {
    return <Alert variant="danger">Error: {error}</Alert>;
  }

  return (
    <Container>
      <Alert className="grad">
        <h4 className="white text-center text-capitalize mb-0">
          Interview Leaderboard
        </h4>
      </Alert>

      <div className="mb-3">
        <Button onClick={() => setShowFilterModal(true)} variant="primary" className="me-2">
          Filter IDs
        </Button>
        <Button onClick={handleLoadAllRecords} variant="secondary">
          Load All Records
        </Button>
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <div className="table-container">
            <div className="table-header-bg"></div>
            <Table className="table-card text-center">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Candidate Name</th>
                  <th>Profile</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user) => (
                  <tr key={user._id}>
                    <td>{user.candidate_id}</td>
                    <td>{user.name}</td>
                    <td>
                      <a
                        href={`/user/${user.candidate_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="profileButton m-0 p-1" size="sm">
                          <FontAwesomeIcon
                            icon={faLongArrowAltRight}
                            className="mx-3 my-2"
                          />
                        </Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {userList.length === 0 && <h6 className="text-center">No matching profiles found.</h6>}
          </div>

          {candidateIds.length === 0 && (
            <div className="pagination-controls d-flex justify-content-between align-items-center mt-3">
              <Button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                variant="outline-primary"
              >
                Previous
              </Button>
              <span>Page {currentPage}</span>
              <Button 
                onClick={handleNextPage} 
                disabled={!hasMore}
                variant="outline-primary"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Filter by Candidate IDs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Enter Candidate IDs (comma-separated)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="e.g., 123, 456, 789"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFilterModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmitFilter}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TableComp;