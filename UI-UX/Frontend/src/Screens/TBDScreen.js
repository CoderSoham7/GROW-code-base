import React from "react"
import { Row, Col, Container, Card} from "react-bootstrap"
import { Link } from "react-router-dom"
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 

const TBDScreen = () => {
  return (
    <div className="minheight grad">
      <Container>
      <Link
        className='btn btn-outline-light my-3 py-2'
        to='/'
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> Go Home
      </Link>
      <Row className='d-flex justify-content-center align-items-center'>
        <Col
          md={5}
          className='d-flex justify-content-center align-items-center m-5'
        >
          <h1 style={{color: "white", margin:"3rem"}}>Development In Progress</h1>          
          <Card style={{ width: "45vh" }} className='card-rounded'>
            <Card.Img src='/tbd.gif' alt="TBD gif" className='card-rounded'/>
          </Card>          
        </Col>
      </Row>
      </Container>
    </div>
  )
}

export default TBDScreen