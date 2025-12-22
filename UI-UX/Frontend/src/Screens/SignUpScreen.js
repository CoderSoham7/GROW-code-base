import React, { useState, useEffect, useContext } from "react"
import { Row, Col, Card, Container } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import { register } from "../Actions/UserActions.js"
import { useNavigate, Link } from "react-router-dom"
import Message from "../Components/Message.js"
import Loader from "../Components/Loader.js"
import axios from "axios"
import swal from 'sweetalert';  
import { faArrowLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 
import { AuthContext } from "./AuthContext.js"

const SignUpScreen = () => {
  const [candidate_id, setCandidate_id] = useState();
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [image, setImage] = useState("")
  const [coverletter, setCoverletter] = useState("")
  const [uploading, setUploading] = useState(false)
  const [passwordShown, setPasswordShown] = useState(false)
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [candidateIdError, setCandidateIdError] = useState(false);
  const [nameError, setNameError] = useState(false);

  const Navigate = useNavigate()
  const dispatch = useDispatch()
  const { userInfo } = useContext(AuthContext);  

  useEffect(() => {
    if (userInfo) {
      Navigate("/")
    }
  }, [Navigate, userInfo ])

  const submitHandler = (e) => {
    e.preventDefault()
    if(nameError === true || candidateIdError === true || emailError === true || passwordError === true)
    {      
      swal({  
        title: "Bad Input",  
        text: "Please enter proper values while registering",  
        icon: "error",  
      }); 
    }
    else{
    dispatch(register(
      candidate_id, 
      name, 
      email, 
      coverletter, 
      image, 
      password)).then((response) => {
      if (response === "OK") {
        swal({  
          title: "Registration successful",  
          text: "You can Sign In now using registered credentials",  
          icon: "success",  
        }); 
        Navigate("/login");
      }
    })
    .catch((error) => {
      console.error('Error');
    });
  }

  }

  const validateName = (name) => {
    const re = /^[a-zA-Z .-]{2,}$/;
    return re.test(name);
  }

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (!validateName(e.target.value)) {
      setNameError(true);
    } else {
      setNameError(false);
    }
  }

  const validateCandidateId = (candidate_id) => {
    const re = /^[a-z0-9]+$/i;
    return re.test(candidate_id);
  }

  const handleCandidateIdChange = (e) => {
    setCandidate_id(e.target.value);
    if (!validateCandidateId(e.target.value)) {
      setCandidateIdError(true);
    } else {
      setCandidateIdError(false);
    }
  }

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@(?:cognizant\.com|gmail\.com|outlook\.com)$/;
    return re.test(String(email).toLowerCase());
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (!validateEmail(e.target.value)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  }

  const validatePassword = (password) => {
    const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&_])[A-Za-z\d@$!%*#?&_]{8,20}$/;
    return re.test(password);
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (!validatePassword(e.target.value)) {
      setPasswordError(true);
    } else {
      setPasswordError(false);
    }
  }

  const togglePasswordVisiblity = () => {
    setPasswordShown((prevShown) => !prevShown);
  }

  const imageUploadHandler = async (e) => {
    const file = e.target.files[0]
    const allowedTypes = ['image/jpeg'];
    const maxSize = 1 * 1024 * 1024;
    if (allowedTypes.includes(file.type) && file.size <= maxSize){
      const formData = new FormData()
      formData.append("image", file)
      setUploading(true)

      try {
        const config = {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
        const { data } = await axios.post("/api/upload", formData, config)
        setImage(data)
        setUploading(false)
      } catch (error) {
        console.error('Error')
        setUploading(false)
      }
    }else{
      swal({  
        title: "Wrong image format",  
        text: "Please upload your Professional Image as JPEG smaller than 1 MB.",  
        icon: "info",  
      }); 
      e.target.value = null;
    }  
  }

  const coverletterUploadHandler = async (e) => {
    const file = e.target.files[0]
    const allowedTypes = ['application/pdf'];
    const maxSize = 3 * 1024 * 1024;
    if (allowedTypes.includes(file.type) && file.size <= maxSize){
      const formData = new FormData()
      formData.append("coverletter", file)
      setUploading(true)
      try {
        const config = {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
        const { data } = await axios.post("/api/upload", formData, config)
        setCoverletter(data)
        setUploading(false)
      } catch (error) {
        console.error('Error')
        setUploading(false)
      }
    }else{
      swal({  
        title: "Wrong coverletter format",  
        text: "Please upload your Cover Letter as 1 page PDF file smaller than 3 MB.",  
        icon: "info",  
      });
      e.target.value = null;
    }
  }

  return (
    <div className="minheight grad">
      <Container>
      <Link
          className='btn btn-outline-light mt-3 py-2 mb-1'
          to='/'
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> Go Home
      </Link>
    <Row className='d-flex justify-content-center align-items-center'>
      <Col
        md={5}
        className='d-flex justify-content-center align-items-center m-5'
      >
        <Card className='card-rounded-login-signup text-center p-2'>
          {error && <Message variant='danger'>{error}</Message>}
          <Card.Header style={{ color: "#08084e" }} as='h4'>
            Sign Up
          </Card.Header>
          <Card.Body>
            {<Loader />}
            <Form onSubmit={submitHandler}>
            <Form.Group as={Col} controlId='formGridName' className='mb-4'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Full Name'
                required
                value={name}
                onChange={handleNameChange}
                isInvalid={nameError}
              />
              <Form.Control.Feedback type='invalid'>
                Bad input
              </Form.Control.Feedback>
            </Form.Group>
                <Form.Group as={Col} controlId='formGridName' className='mb-4'>
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Cognizant Employee ID'
                    required
                    value={candidate_id}
                    onChange={handleCandidateIdChange}
                    isInvalid={candidateIdError}
                  />
                  <Form.Control.Feedback type='invalid'>
                    Bad input
                  </Form.Control.Feedback>
                </Form.Group>
              <Form.Group
                className='mb-4'
                controlId='formGridResUpload'
                aria-describedby='fileHelpBlock'
              >
                <Form.Label>Cover Letter</Form.Label>
                <Form.Control
                  type='file'
                  accept='.pdf'
                  maxSize={3 * 1024 * 1024}
                  placeholder='Cover Letter'
                  onChange={coverletterUploadHandler}
                  required
                />
                <small id='fileHelpBlock' className='form-text text-muted'>
                  File size must be PDF, less than 3 MB
                </small>
              </Form.Group>

              
              <Form.Group
                className='mb-4'
                controlId='formGridImgUpload'
                aria-describedby='imgHelpBlock'
              >
                <Form.Label>Professional Image</Form.Label>
                <Form.Control
                  type='file'
                  accept='.jpeg'
                  placeholder='Image'
                  onChange={imageUploadHandler}
                  maxSize={1 * 1024 * 1024}
                  required
                />
                <small id='imgHelpBlock' className='form-text text-muted'>
                  Candidate should be attired business appropriate. Background
                  should be plain colour. Image size must be JPEG, less than 1 MB
                </small>
                {uploading && <Loader />}
              </Form.Group>      
              <Form.Group className='mb-4' controlId='email'>
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type='email'
                  placeholder='Enter valid email address'
                  value={email}
                  required
                  onChange={handleEmailChange}
                  isInvalid={emailError}
                />
                <Form.Control.Feedback type='invalid'>
                  Bad input
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className='mb-4' controlId='password' required>
                <Form.Label>Set password</Form.Label>
                <Form.Control
                  type={passwordShown ? "text" : "password"}
                  placeholder='New Password'
                  value={password}
                  required
                  onChange={handlePasswordChange}
                  isInvalid={passwordError}
                />
                <Form.Control.Feedback type='invalid'>
                  Bad input
                </Form.Control.Feedback>
                <span>
                  <FontAwesomeIcon  
                  icon={passwordShown ? faEye : faEyeSlash}  
                  onClick={togglePasswordVisiblity}  
                />  
                </span> 
                <br></br>
                <Form.Text id='passwordHelpBlock' muted>
                  Your password must be 8-20 characters long, contain letters,
                  numbers, and special characters. Must not contain spaces, or
                  emoji.
                </Form.Text>
              </Form.Group>
              <Button className='m-2' variant='outline-light' type='submit'>
                Submit
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container> 
  </div> 
  )
}

export default SignUpScreen