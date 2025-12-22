import React from "react"
import { Container, Row, Col } from "react-bootstrap"

const Footer = () => {
  return (
    <footer className='custom-col' style={{zIndex:"999"}}>
      <Container>
        <Row>
        <Col className='d-flex justify-content-center align-items-center py-5 white footersize'>
            <span>&copy;2024 Cognizant. All rights reserved. | Cognizant&reg; Role Accreditation Bot</span>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
