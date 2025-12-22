import React,{useEffect, useState, useContext} from "react";
import { Row, Col, Container, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import {  useDispatch, useSelector  } from "react-redux";
import swal from 'sweetalert';  
import { checkImgExists } from "../Actions/UserActions";
import { AuthContext } from "./AuthContext";

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { userInfo } = useContext(AuthContext);
  const userId = userInfo?._id ?? '';
  const imgExists = useSelector((state) => state.checkImgExists.isImg);

  useEffect(() => {
    if (userId) {
      dispatch(checkImgExists(userId, userInfo));
    }
  }, [dispatch, userId, imgExists, userInfo]);    

  const handleDisabledClick = (feature) => {
    swal({
      title: "Feature under maintenance",
      text: `${feature} is currently being refactored.`,
      icon: "info",
    });
  };  
  
  return (
    <div className='minheight grad'>
      <Container fluid className='d-flex justify-content-center align-items-center'>
        <Row className='d-flex justify-content-center align-items-center' style={{height:"100vh"}}>
          {userInfo ?
            (userInfo.isAdmin ? (
              <>    
              <Row className='my-3'>  
                  <Col md={4} className='d-flex justify-content-center my-4'>    
                      <Link to='/upload-associates'>    
                          <Card style={{ width: "40vh" }} className='card-rounded'>    
                              <Card.Img src='uploadAssociateData.png' className='card-rounded' />    
                          </Card>    
                      </Link>    
                  </Col>   
                  <Col md={4} className='d-flex justify-content-center my-4'>      
                      <a href='/leaderboard'>{/*DO NOT replace "a" tag with Link*/}
                          <Card style={{ width: "40vh" }} className='card-rounded'>      
                              <Card.Img src='./Leaderboard.png' className='card-rounded' />      
                          </Card>      
                      </a>      
                  </Col>  
                  <Col md={4} className='d-flex justify-content-center my-4'>    
                      <Link to='/assign-interview-slot'>    
                          <Card style={{ width: "40vh" }} className='card-rounded'>    
                              <Card.Img src='AssignInterviewDateTime.png' className='card-rounded' />    
                          </Card>    
                      </Link>    
                  </Col>   
              </Row>    
              <Row className='my-3'>    
                  <Col md={4} className='d-flex justify-content-center my-4'>    
                      <Link to='/upload-jd'>    
                          <Card style={{ width: "40vh" }} className='card-rounded'>    
                              <Card.Img src='uploadjdscreenimage.png' className='card-rounded' />    
                          </Card>    
                      </Link>    
                  </Col>   
                  <Col md={4} className='d-flex justify-content-center my-4'>    
                    <Link to='/download-results'>    
                        <Card style={{ width: "40vh" }} className='card-rounded'>    
                            <Card.Img src='DownloadTranscripts.png' className='card-rounded' />    
                        </Card>    
                    </Link>    
                  </Col>                     
                  <Col md={4} className='d-flex justify-content-center my-4'>    
                      <Link to='/assigndrive'>    
                          <Card style={{ width: "40vh" }} className='card-rounded'>    
                              <Card.Img src='./AssignDrive.png' className='card-rounded'/>    
                          </Card>    
                      </Link>    
                  </Col>                       
              </Row>    
            </>
            ):(
              <>
              <Row className='justify-content-center'>
              <Col md={4} className='d-flex justify-content-center m-4' style={{marginTop:"5rem"}}>
                <Link to='/nethack/tbd'>
                  <Card style={{ width: "45vh" }} className='card-rounded'>
                    <Card.Img src='./Nethack.png' className='card-rounded' />
                  </Card>
                </Link>
              </Col>
              <Col md={4} className='d-flex justify-content-center m-4' style={{marginTop:"5rem"}}>
                <Link to='/csquiz/tbd'>
                  <Card style={{ width: "45vh" }} className='card-rounded'>
                    <Card.Img src='./csquiz.png' className='card-rounded'/>
                  </Card>
                </Link>
              </Col>
              {/*IMPLEMENT imgExists check here itself. DO NOT Replace a tag with Link */}
              <Col md={4} className='d-flex justify-content-center m-4' style={{marginBottom:"5rem"}}>
                <a href="/interview-sessions" onClick={(e) => {
                  if (!imgExists.isImg) {
                    e.preventDefault();
                    swal({
                      title: "Pre-requisite: Image",
                      text: "Please upload image to proceed with interview.",
                      icon: "warning",
                    });
                  }
                }}>
                  <Card style={{ width: "45vh" }} className='card-rounded'>
                    <Card.Img src='./Interview.png' className='card-rounded'/>
                  </Card>
                </a>   
              </Col>

              <Col md={4} className='d-flex justify-content-center m-4' style={{marginBottom:"5rem"}}>  
                <a href="/coding-sessions" onClick={(e) => {
                  if (!imgExists.isImg) {
                    e.preventDefault();
                    swal({
                      title: "Pre-requisite: Image",
                      text: "Please upload image to proceed with coding test.",
                      icon: "warning",
                    });
                  }
                }}>
                  <Card style={{ width: "45vh" }} className='card-rounded'>  
                    <Card.Img src='./Coding.png' className='card-rounded' />  
                  </Card>  
                </a>
              </Col>  
              
              </Row>
            </>
            )):(
            <Row className='justify-content-center'>
            <Col md={12} className='d-flex justify-content-center'>
            <Card style={{ width: "80vh"}} className='card-rounded-for-homescreen'>
                    <Card.Img src='./homescreenimage.png' className='card-rounded-for-homescreen' style={{imageRendering:"highQuality"}} />
            </Card>
            </Col>
          </Row>
            )}
        </Row>
      </Container>
    </div>
  );
};

export default HomeScreen;
