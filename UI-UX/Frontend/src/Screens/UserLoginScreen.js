import React, { useState, useEffect, useContext } from "react";  
import { Row, Col, Card, Form, Button, Container } from "react-bootstrap";  
import { useNavigate, Link } from "react-router-dom";  
import Message from "../Components/Message.js";  
import Loader from "../Components/Loader.js";  
import swal from 'sweetalert';  
import { faArrowLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";  
import { AuthContext } from "./AuthContext.js";   
  
const UserLoginScreen = () => {  
  const Navigate = useNavigate();  
  const [email, setEmail] = useState("");  
  const [password, setPassword] = useState("");  
  const [passwordShown, setPasswordShown] = useState(false);  
  const [emailError, setEmailError] = useState(false);  
  const [passwordError, setPasswordError] = useState(false);  
  const { login, userInfo, loading, error } = useContext(AuthContext);  
  
  useEffect(() => {  
    if (userInfo) {  
      Navigate("/");  
    }  
  }, [Navigate, userInfo]);  
  
  const isCognizantDomain = email.toLowerCase().endsWith("@cognizant.com");  
  
  const validatePassword = (password) => {  
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_\s]{8,20}$/;  
    return re.test(password);  
  };  
  
  const handlePasswordChange = (e) => {  
    setPassword(e.target.value);  
    setPasswordError(!validatePassword(e.target.value));  
  };  
  
  const validateEmail = (email) => {  
    const re = /^[a-zA-Z0-9._-]+@(cognizant\.com|gmail\.com|outlook\.com)$/;  
    return re.test(String(email).toLowerCase());  
  };  
  
  const handleEmailChange = (e) => {  
    setEmail(e.target.value.trim());  
    setEmailError(!validateEmail(e.target.value));  
  };  
  
  const togglePasswordVisibility = () => {  
    setPasswordShown(!passwordShown);  
  };  
  
  const submitHandler = (e) => {  
    e.preventDefault();  
    if (emailError || passwordError) {  
      swal({  
        title: "Bad Input",  
        text: "Please enter proper credentials to Log In",  
        icon: "error",  
      });  
    } else {  
      login(email, password);  
    }  
  };  
  
  const handleSignIn = async () => {  
    try {  
      window.location.href = '/api/users/signin';  
    } catch (error) {  
      console.error('Error during SSO Log In');  
    }  
  };  
  
  return (  
    <div className="minheight grad">  
      <Container>  
        <Link  
          className='btn btn-outline-light my-3 py-2'  
          to='/'  
        >  
          <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> Go Home  
        </Link>  
        <Row className='d-flex justify-content-center align-items-center' style={{height:"80vh"}}>  
          <Col md={3} className='d-flex justify-content-center m-3'>  
            <Card className='card-rounded-login-signup text-center p-2'>  
              {error && <Message variant='danger'>{error}</Message>}  
              {loading && <Loader />}  
              <Card.Header as='h4' className="login-header">  
                Log In  
              </Card.Header>  
              <Card.Body>  
                <Form onSubmit={submitHandler}>  
                  <Form.Group className='mb-3' controlId='email' required>  
                    <Form.Label>Email address</Form.Label>  
                    <Form.Control  
                      type='email'  
                      placeholder='Enter email'  
                      value={email}  
                      onChange={handleEmailChange}  
                      isInvalid={emailError}  
                    />  
                    <Form.Control.Feedback type='invalid' style={{fontSize:"13px"}}>  
                      Please enter a valid email address
                      <br></br>
                      Domains: cognizant | gmail | outlook  
                    </Form.Control.Feedback>  
                  </Form.Group>  

                  {!isCognizantDomain && (  
                    <>  
                      <Form.Group className='mb-3' controlId='password' required>  
                        <Form.Label>Password</Form.Label>  
                        <Form.Control  
                          placeholder='Password'  
                          type={passwordShown ? "text" : "password"}  
                          value={password}  
                          onChange={handlePasswordChange}  
                          isInvalid={passwordError}  
                        />  
                        <Form.Control.Feedback type='invalid'>  
                          Please enter a valid password.  
                        </Form.Control.Feedback>  
                        <span>  
                          <FontAwesomeIcon    
                            icon={passwordShown ? faEye : faEyeSlash}    
                            onClick={togglePasswordVisibility}    
                          />    
                        </span> 
                      </Form.Group>  
                      <Button className='btn-transition m-1 btn-outline-light' type='submit' style={{fontSize:"14px"}}>    
                        Login  
                      </Button>
                      <br></br>
                      <hr></hr>
                      <Button className='btn-transition m-1 cognizant-sso btn-outline-light' style={{fontSize:"13px"}} type='button' onClick={handleSignIn}>  
                        Login with Cognizant ID
                      </Button> 
                    </>  
                  )}  
  
                  {isCognizantDomain && (  
                    <Button className='btn-transition m-1 cognizant-sso btn-outline-light' style={{fontSize:"13px"}} type='button' onClick={handleSignIn}>  
                      Login with Cognizant ID 
                    </Button>  
                  )}  
                </Form>  
              </Card.Body>  
            </Card>  
          </Col>  
        </Row>  
      </Container>  
    </div>  
  );  
};  
  
export default UserLoginScreen;  