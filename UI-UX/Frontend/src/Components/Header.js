import React, { useContext } from "react"
import { Navbar, Nav, Container } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useNavigate, useLocation } from "react-router-dom"
import { faImagePortrait, faQuestion, faSignIn, faSignOut, faUser, faHome, faInfoCircle, faTableCellsLarge, faCode } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from "../Screens/AuthContext.js"
import swal from 'sweetalert';  

const Header = () => {
  const { userInfo, logout } = useContext(AuthContext); 
  const navigate = useNavigate()
  const location = useLocation()

  const logoutHandler = () => {
    logout(); 
    navigate('/login');
  }

  const uploadImageHandler = () => {
    navigate('/upload-image');
  }

  const goToInterviewSessions = () => {
    navigate('/interview-sessions');
    setTimeout(() => window.location.reload(), 100);
  }
  
  const goToCodingSessions = () => {
    navigate('/coding-sessions');
    setTimeout(() => window.location.reload(), 100);
  }
  
  const goToHome = () => {
    navigate('/');
  }

  const uploadImageCoverletterHandler = () => {
    const uuid = location.pathname.split('/')[2];
    navigate(`/home/${uuid}/upload-coverletter`);
  }

  // Check if we're in a coding session
  const isCodingSession = location.pathname.includes('coding');

  const handleInterviewInstructions = e => {    
    e.preventDefault();    
    swal({    
        title: "Interview Instructions",    
        content: {  
          element: "div",  
          attributes: {  
            innerHTML: `      
            Welcome to your interview! To get started, follow these simple steps:<br><br>    
            <div style="text-align: left; font-size: 13px">    
              
              1. Record your answer by clicking the <b style="color: #0961b0">microphone button</b>.<br>    
              2. Wait for your answer to appear in text form (transcript). The <b style="color: #0961b0">'CopyPaste' </b>button will be <b style="color: #5D5D8B">disabled</b> during this time.<br>    
              3. When transcript is ready, the <b style="color: #0961b0">'CopyPaste' </b>button will be <b style="color: #08084e">enabled</b>. Click it to move your answer to the text box.<br>    
              4. Edit your answer in the text box if needed.<br>    
              5. For long answers, click the <b style="color: #0961b0">"See Full Response"</b> button in the text box to view everything.<br>    
              6. For coding questions, paste your spoken answer first, then add code below it.<br>
              7. When finished with all questions, click the <b style="color: #0961b0">"End Interview"</b> button to complete your interview.<br><br>
              
              <div style="background-color: #C1E6EA; padding: 10px; border-left: 4px solid #08084E; margin-top: 10px;">
                <b>IMPORTANT:</b> You must click <b style="color: #0961b0">"End Interview"</b> when done to <b style="color: #0961b0">properly close the interview session</b>. Closing your browser will not properly complete your interview (invalid).
              </div>
            </div>
          `
          },  
        },  
        button: "Got it!",  
      }); 
  }
  
  const handleCodingInstructions = e => {    
    e.preventDefault();    
    swal({    
        title: "Coding Test Instructions",    
        content: {  
          element: "div",  
          attributes: {  
            innerHTML: `      
            <div style="text-align: left; font-size: 13px">    
              <h4>Welcome to your coding test!</h4>
              <p>Follow these steps to complete your assessment:</p>
              
              <h5>Getting Started</h5>
              <ol>    
                <li>Read each question carefully before responding.</li>
                <li>Use the text area to provide your explanation or solution approach.</li>
                <li>For code implementation, use the <b style="color: #0961b0">"Add Code"</b> button to create code snippets.</li>
              </ol>
              
              <h5>Using the Coding Interface</h5>
              <ol>
                <li>Type your explanation in the main text area.</li>
                <li>Click <b style="color: #0961b0">"Add Code"</b> to create a code snippet.</li>
                <li>In the code editor, write your implementation with proper indentation.</li>
                <li>You can add multiple code snippets if needed.</li>
                <li>Each snippet can be edited or removed as needed.</li>
                <li>For longer responses, use the <b style="color: #0961b0">"Full View"</b> button to see more content.</li>
                <li>Click <b style="color: #0961b0">"Send"</b> when your answer is ready.</li>
              </ol>
              
              <h5>Important Notes</h5>
              <ul>
                <li>External pasting is disabled to maintain assessment integrity.</li>
                <li>Use the <b style="color: #0961b0">"End Test"</b> button when you've completed all questions.</li>
                <li>Your camera must remain on throughout the assessment.</li>
                <li>The test has a time limit - manage your time appropriately.</li>
              </ul>
              
              <div style="background-color: #C1E6EA; padding: 10px; border-left: 4px solid #08084E; margin-top: 10px;">
                <b>IMPORTANT:</b> You must click <b style="color: #0961b0">"End Test"</b> when finished to <b style="color: #0961b0">properly submit your solutions</b>. Closing your browser will NOT properly complete your test.
              </div>
            </div>
          `
          },  
        },  
        button: "Got it!",  
      }); 
  }

  return (
    <header style={{zIndex:"999"}}>
      <Navbar collapseOnSelect expand='lg' variant='dark' className='custom-col'>
        <Container className='mt-2'>
          <Navbar.Brand className='mb-2'>
              <span style={{fontSize:"16px", fontWeight:"550"}}>Cognizant® Role Accreditation Bot</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            {userInfo ? (
              <Nav className='ms-auto'>
                <Nav.Link className='mx-4'>
                  <h6>
                    <FontAwesomeIcon icon={faUser} className="px-1" /> {userInfo.name}
                  </h6>
                </Nav.Link>
                
                {/* Home page options */}
                {!userInfo.isAdmin && location.pathname === '/' && (
                  <>
                    <Nav.Link className='mx-4' onClick={uploadImageHandler}>
                      <h6>
                        <FontAwesomeIcon icon={faImagePortrait} className="px-1" /> Upload Image
                      </h6>
                    </Nav.Link>
                    <Nav.Link className='mx-2' onClick={logoutHandler}>
                      <h6>
                        <FontAwesomeIcon icon={faSignOut} className="px-2" /> Log Out
                      </h6>
                    </Nav.Link>
                  </>
                )}
                
                {/* Interview test options */}
                {location.pathname.includes("interview/test") && !userInfo.isAdmin && (
                  <>
                    <Nav.Link onClick={handleInterviewInstructions} className='mx-2'>
                      <h6>
                        <FontAwesomeIcon icon={faInfoCircle} className="px-2" />Instructions
                      </h6>
                    </Nav.Link>
                    <Nav.Link onClick={goToInterviewSessions} className='mx-2'>
                      <h6>
                        <FontAwesomeIcon icon={faTableCellsLarge} className="px-2" />Interview Sessions
                      </h6>
                    </Nav.Link>
                    <Nav.Link onClick={goToHome} className='mx-2'>
                      <h6>
                        <FontAwesomeIcon icon={faHome} className="px-2" />Home
                      </h6>
                    </Nav.Link>
                  </>
                )}
                
                {/* Coding test options */}
                {location.pathname.includes("coding/test") && !userInfo.isAdmin && (
                  <>
                    <Nav.Link onClick={handleCodingInstructions} className='mx-2'>
                      <h6>
                        <FontAwesomeIcon icon={faInfoCircle} className="px-2" />Instructions
                      </h6>
                    </Nav.Link>
                    <Nav.Link onClick={goToCodingSessions} className='mx-2'>
                      <h6>
                        <FontAwesomeIcon icon={faTableCellsLarge} className="px-2" />Coding Sessions
                      </h6>
                    </Nav.Link>
                    <Nav.Link onClick={goToHome} className='mx-2'>
                      <h6>
                        <FontAwesomeIcon icon={faHome} className="px-2" />Home
                      </h6>
                    </Nav.Link>
                  </>
                )}
                
                {/* Admin logout */}
                {userInfo.isAdmin && !location.pathname.includes("interview/test") && !location.pathname.includes("coding/test") && (
                  <Nav.Link className='mx-2' onClick={logoutHandler}>
                    <h6>
                      <FontAwesomeIcon icon={faSignOut} className="px-2" /> Log Out
                    </h6>
                  </Nav.Link>
                )}
                
                {/* Standard logout for other pages */}
                {!userInfo.isAdmin && !location.pathname.includes("interview/test") && !location.pathname.includes("coding/test") && location.pathname !== '/' && (
                  <Nav.Link className='mx-2' onClick={logoutHandler}>
                    <h6>
                      <FontAwesomeIcon icon={faSignOut} className="px-2" /> Log Out
                    </h6>
                  </Nav.Link>
                )}
              </Nav>
            ) : (
              <Nav className='ms-auto'>
                <LinkContainer to='/login'>
                  <Nav.Link className='mx-4'>
                    <h6>
                      <FontAwesomeIcon icon={faSignIn} className="px-1" /> Log In
                    </h6>
                  </Nav.Link>
                </LinkContainer>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>            
    </header>
  )
}

export default Header