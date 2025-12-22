import React, { useState, useEffect, useContext } from "react"
import { Row, Col, Card, Container } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import swal from 'sweetalert';  
import { useNavigate } from "react-router-dom"
import Message from "../Components/Message.js"
import { faArrowLeft, faCircleNotch } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 
import { uploadImage } from "../Actions/UserActions.js"
import { AuthContext } from "./AuthContext.js"
  
const UploadImageScreen = () => {
  const imageUpload = useSelector((state) => state.imageUpload);        
  const { loading: imageLoading, error: imageError, imageStatus } = imageUpload;    
  const [imageFile, setImageFile] = useState("")      
  const Navigate = useNavigate()      
  const dispatch = useDispatch()       
  const { userInfo, loading, error } = useContext(AuthContext); 

  useEffect(() => { 
    if (!userInfo) {  
      Navigate("/")  
    }  
  }, [userInfo, Navigate])
  
  useEffect(() => {
    if (imageStatus) {
      if (imageStatus === 200 || imageStatus === 203) {
        swal({
          title: "Image uploaded!",
          icon: "success",
        }).then(() => {
          let timer = 0;
          const processingAlert = swal({
            title: "Processing image...",
            content: {
              element: "div",
              attributes: {
                innerHTML: `
                  <div style="width: 100%; background-color: #f0f0f0; border-radius: 20px; margin-top: 20px; overflow: hidden;">
                    <div id="progressBar" style="width: 0%; height: 10px; background-color: #4CAF50; transition: width 0.1s ease;"></div>
                  </div>
                `
              }
            },
            buttons: false,
            closeOnClickOutside: false,
            closeOnEsc: false,
          });
  
          const interval = setInterval(() => {
            timer++;
            if (timer <= 10) {
              const progressBar = document.getElementById('progressBar');
              if (progressBar) {
                progressBar.style.width = `${timer * 10}%`;
              }
            } else {
              clearInterval(interval);
              swal.close();
              swal({
                title: "Image processed!",
                icon: "success",
              });
            }
          }, 1000);
        });
      } else {
        swal({
          title: "Image upload failed",
          icon: "error",
        });
      }
    }
  }, [imageStatus]);
  
  const userId = userInfo?._id;  
  
  const submitHandler = async (e) => {        
    e.preventDefault();        
    if (imageFile) {        
      const formData = new FormData();        
      formData.append('image', imageFile);        
      formData.append('userId', userId);        
      dispatch(uploadImage(formData, userInfo));    
    }        
  } 

  const handleButtonClick = () => {  
    Navigate('/');
    window.location.reload();   
  } 

  const handleImageFileSelection = (e) => {  
    const file = e.target.files[0];  
    const allowedTypes = ['image/jpeg'];  
    const maxSize = 1 * 1024 * 1024;   
    if (allowedTypes.includes(file.type) && file.size <= maxSize) {  
      setImageFile(file);  
    } else {  
      swal({    
        title: "Wrong image format",    
        text: "Please upload your Professional Image as JPG/JPEG smaller than 1 MB.",    
        icon: "info",    
      });   
      e.target.value = null;  
    }   
  }  

  if (!userInfo || loading) {    
    return <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>;
  }   

  return (  
    <div className="minheight grad"> 
      <Container>  
        <Button className='btn btn-outline-light mt-3 py-2 mb-1'>    
            <a href='/' className='home-link'>
              <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> BACK
            </a>
        </Button>   
        <Row className='d-flex justify-content-center align-items-center'>  
          <Col  
            md={5}  
            className='d-flex justify-content-center align-items-center m-5'  
          >  
            <Card className='card-rounded-login-signup text-center p-2'>  
              {imageError && <Message variant='danger'>{imageError}</Message>}  
              <Card.Header style={{ color: "#08084e" }} as='h4'>  
                Upload Image  
              </Card.Header>  
              <Card.Body>  
                <Form onSubmit={submitHandler}>
                  <h6 className="d-flex m-3" style={{color:"#213e99"}}>NOTE: Image cannot be uploaded if interview attempt is over</h6>
                  <Form.Group  
                    className='mb-4'  
                    controlId='formGridImgUpload'  
                    aria-describedby='imgHelpBlock'  
                  >  
                    <Form.Label>Professional Image</Form.Label>  
                    <Form.Control  
                      className='mb-4'  
                      type='file'  
                      accept='.jpeg'  
                      placeholder='Image'  
                      onChange={handleImageFileSelection}  
                      required  
                    />  
                    {imageLoading && <Message variant='info'>Uploading image...</Message>}   
                    <small id='imgHelpBlock' className='form-text text-muted'>  
                      Candidate should be attired business appropriate. Background  
                      should be plain color. Image size must be JPEG, less than 1 MB  
                    </small>  
                  </Form.Group>  
                  <Button className='my-2' variant='btn btn-outline-light' type='submit'>  
                    SUBMIT  
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

export default UploadImageScreen