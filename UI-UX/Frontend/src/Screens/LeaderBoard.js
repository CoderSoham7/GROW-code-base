import React, { useEffect, useContext } from "react"
import { Container, Row, Col } from "react-bootstrap"
import TableComp from "../Components/Table.js"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from "./AuthContext.js"

const LeaderBoard = () => {
  const { userInfo } = useContext(AuthContext);  
  const Navigate = useNavigate()

  useEffect(() => {  
    if (!userInfo || !userInfo.isAdmin) {  
      Navigate("/login");  
    }  
  }, [userInfo, Navigate]);  
  

  return (
    <Container>
      <Link
          className='btn btn-outline-light my-3 py-2'
          to='/'
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> Go Home
      </Link>
      <Col className='d-flex justify-content-center align-items-center'>
      </Col>
      <Row className="mb-5">
        <TableComp/>
      </Row>
    </Container>
  )
}

export default LeaderBoard
