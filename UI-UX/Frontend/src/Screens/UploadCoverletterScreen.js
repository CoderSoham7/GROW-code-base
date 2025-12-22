import React, { useState, useEffect, useContext } from "react"
import { Row, Col, Card, Container } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { useParams, useNavigate } from "react-router-dom"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import swal from 'sweetalert';
import Message from "../Components/Message.js"
import { faArrowLeft, faCircleNotch, faArrowRight } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { uploadCoverletter } from "../Actions/UserActions.js"
import { AuthContext } from "./AuthContext.js"
  
// Create a wrapper for swal to safely check if it's visible
const isSwalVisible = () => {
  return document.querySelector('.swal-overlay--show-modal') !== null;
};

const UploadCoverletterScreen = () => {
  const { uuid } = useParams();
  const coverletterUpload = useSelector((state) => state.coverletterUpload);        
  const { loading: coverletterLoading, error: coverletterError, coverletterStatus } = coverletterUpload;        
  const [coverletterFile, setCoverletterFile] = useState("")      
  const navigate = useNavigate()      
  const dispatch = useDispatch()       
  const { userInfo, loading, error } = useContext(AuthContext); 

  useEffect(() => { 
    if (!userInfo) {  
      navigate("/")  
    }  
  }, [userInfo, navigate])
  
  useEffect(() => {
    if (coverletterStatus) {
      // Clear any existing timeouts when we get a status response
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
        setUploadTimeout(null);
      }
      
      if (coverletterStatus === 200 || coverletterStatus === 203) {
        // Close any existing alert first
        if (isSwalVisible()) {
          swal.close();
        }
        
        swal({
          title: "Cover letter upload successful!",
          text: "Your cover letter has been uploaded and processed!",
          icon: "success",
          closeOnClickOutside: false,
        });
      }
    }
  }, [coverletterStatus, uploadTimeout]);
  
  // Clear the error modal and any timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Close any visible sweet alerts
      if (isSwalVisible()) {
        swal.close();
      }
      
      // Clear any pending timeouts
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
        setUploadTimeout(null);
      }
    };
  }, [uploadTimeout]);

  // Set up state for tracking timeouts
  const [uploadTimeout, setUploadTimeout] = useState(null);
  
  // Reset timeout if loading state changes to false (upload completed or failed)
  useEffect(() => {
    if (!coverletterLoading && uploadTimeout) {
      clearTimeout(uploadTimeout);
      setUploadTimeout(null);
    }
  }, [coverletterLoading, uploadTimeout]);
  
  // Handle errors with detailed information
  useEffect(() => {
    if (coverletterError) {
      // Close any existing alerts first
      if (isSwalVisible()) {
        swal.close();
      }
      
      let errorTitle = "Upload Failed";
      let errorText = coverletterError.message || "An unexpected error occurred";
      let errorIcon = "error";

      switch (coverletterError.type) {
        case "NETWORK_ERROR":
          errorTitle = "Connection Error";
          errorText = "Please try switching to a different network connection (mobile hotspot/different WiFi) and try again.";
          break;
        case "FILE_ERROR":
          errorTitle = "Invalid File";
          errorText = "Please ensure your cover letter is in PDF format and under 3MB.";
          break;
        case "VALIDATION_ERROR":
          errorTitle = "Validation Error";
          break;
        case "SERVICE_ERROR":
          errorTitle = "Service Unavailable";
          errorText = "Our services are temporarily unavailable. Please try again in a few minutes.";
          break;
        case "AUTH_ERROR":
          errorTitle = "Authentication Error";
          errorText = "Please try logging out and logging back in.";
          break;
        case "CONNECTION_ERROR":
          errorTitle = "Connection Timeout";
          errorText = "The request timed out. Please check your internet connection and try again.";
          break;
        case "REQUEST_ERROR":
          errorTitle = "Request Error";
          errorText = "There was a problem sending your request. Please try again.";
          break;
      }

      // Clear any existing timeouts
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
        setUploadTimeout(null);
      }

      swal({
        title: errorTitle,
        text: errorText,
        icon: errorIcon,
        button: "Try Again",
      });
    }
  }, [coverletterError, uploadTimeout]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (coverletterFile) {
      // Show upload in progress alert
      // Custom content with spinner for the swal alert
      const spinnerContent = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div class="spinner-border text-info" role="status" style="width: 3rem; height: 3rem; margin-bottom: 1rem;">
            <span class="sr-only">Loading...</span>
          </div>
          <div style="font-size: 16px; font-weight: 500;">
            Please wait while we upload your cover letter...
          </div>
        </div>
      `;
      
      swal({
        title: "Uploading...",
        content: {
          element: "div",
          attributes: {
            innerHTML: spinnerContent
          }
        },
        buttons: false,
        closeOnClickOutside: false,
      });

      const formData = new FormData();
      formData.append('coverletter', coverletterFile);
      formData.append('userId', userInfo._id);
      formData.append('uuid', uuid);
      
      // Set up UI feedback first before dispatching the upload action
      // We already have the file in state from handleCoverletterFileSelection
      
      try {
        // Set a timeout to detect if the request takes too long
        const timeoutId = setTimeout(() => {
          // Only show timeout warning if we're still loading
          if (coverletterLoading) {
            // Custom content with spinner for the timeout warning
            const timeoutSpinnerContent = `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="spinner-border text-warning" role="status" style="width: 3rem; height: 3rem; margin-bottom: 1rem;">
                  <span class="sr-only">Loading...</span>
                </div>
                <div style="font-size: 16px; font-weight: 500; margin-bottom: 0.5rem;">
                  Your upload is still being processed.
                </div>
                <div style="font-size: 14px;">
                  This is taking longer than expected. Please wait...
                </div>
              </div>
            `;
            
            swal({
              title: "Upload Taking Longer Than Expected",
              content: {
                element: "div",
                attributes: {
                  innerHTML: timeoutSpinnerContent
                }
              },
              buttons: false,
              closeOnClickOutside: false,
            });
          }
        }, 15000); // Show warning after 15 seconds
        
        // Store the timeout ID so we can clear it if needed
        setUploadTimeout(timeoutId);
        
        // Dispatch the upload action
        dispatch(uploadCoverletter(formData, userInfo));
      } catch (error) {
        console.error("Error during upload:", error);
        
        // Clear any existing timeouts
        if (uploadTimeout) {
          clearTimeout(uploadTimeout);
          setUploadTimeout(null);
        }
        
        swal({
          title: "Upload Failed",
          text: "There was an error uploading your cover letter. Please try again.",
          icon: "error",
        });
      }
    }
  };

  const handleCoverletterFileSelection = (e) => {
    const file = e.target.files[0];
    const allowedTypes = ['application/pdf'];
    const maxSize = 3 * 1024 * 1024;

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      swal({
        title: "Invalid File Type",
        text: "Please upload only PDF files",
        icon: "error",
      });
      e.target.value = null;
      return;
    }

    if (file.size > maxSize) {
      swal({
        title: "File Too Large",
        text: "Please upload a file smaller than 3MB",
        icon: "error",
      });
      e.target.value = null;
      return;
    }

    setCoverletterFile(file);
  };

  const downloadWordTemplate = () => {
    // Instead of creating a complex XML structure, we'll use a simpler approach
    // with the xlsx package that already exists in the project dependencies
    
    // Create text content with line breaks that Word can understand
    const text = `Your Associate ID
Interview Skill Name Assigned to you

Dear Hiring Manager,

Introduction Paragraph: Start with a brief introduction stating your interest in the position and how you learned about it. Mention your current role or status (e.g., recent graduate, experienced professional) and express enthusiasm for the opportunity.

Skills Paragraph: Highlight 3-4 key skills that are directly relevant to the interview role. Provide brief examples of how you've applied these skills in past experiences or projects.

Experience Paragraph: Discuss your most relevant work experience related to the interview role. Include your job title, company name, and 2-3 key achievements or responsibilities that demonstrate your capabilities in this field. If you're a recent graduate or changing careers, focus on relevant internships, projects, or transferable skills.

Education Paragraph: Briefly mention your highest level of education, including the degree, major, and institution. If you have multiple degrees or certifications relevant to the role, list them here. For recent graduates, you may want to include relevant coursework or academic projects.

Optional Publications/Awards Paragraph: If applicable to your field and you have space, briefly mention any relevant publications, presentations, or awards that showcase your expertise in the interview skill area.

Closing Paragraph: Summarize why you believe you're a strong candidate for the role, expressing your enthusiasm for the opportunity to contribute to the company. Thank the hiring manager for their time and consideration, and express your interest in discussing your qualifications further in an interview.`;

    // Create a Blob with RTF content which is more reliable
    const rtfHeader = "{\\rtf1\\ansi\\ansicpg1252\\cocoartf1561\\cocoasubrtf610\n\\cocoascreenfonts1{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}\n{\\colortbl;\\red255\\green255\\blue255;}\n\\margl1440\\margr1440\\vieww10800\\viewh8400\\viewkind0\n\\pard\\tx720\\tx1440\\tx2160\\tx2880\\tx3600\\tx4320\\tx5040\\tx5760\\tx6480\\tx7200\\tx7920\\tx8640\\pardirnatural\\partightenfactor0\n\n\\f0\\fs24 \\cf0 ";

    // Convert newlines to RTF line breaks
    const rtfContent = text.replace(/\n/g, "\\par\n");
    const rtfFooter = "}";
    const rtfDocument = rtfHeader + rtfContent + rtfFooter;

    const blob = new Blob([rtfDocument], { type: 'application/rtf' });
    saveAs(blob, 'Coverletter_Template.rtf');
  };

  if (!userInfo || loading) {    
    return (
      <div className="minheight grad d-flex justify-content-center align-items-center">
        <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>
      </div>
    );
  }   

  return (  
    <div className="minheight grad"> 
      <Container>  

        <Button className='btn btn-outline-light mt-3 py-2 mb-1'>    
            <a href={`/interview-sessions/${uuid}/interview/instructions`} className='home-link'>
              <FontAwesomeIcon icon={faArrowLeft} className="mx-2" /> BACK
            </a>
        </Button> 

        <Row className='d-flex justify-content-center align-items-center'>  
          <Col  
            md={5}  
            className='d-flex justify-content-center align-items-center m-5'  
          >  
            <Card className='card-rounded-login-signup text-center p-2'>  
              {coverletterError && <Message variant='danger'>{coverletterError}</Message>}  
              <Card.Header style={{ color: "#08084e" }} as='h4'>  
                Upload Cover Letter  
              </Card.Header>  
              <Card.Body>  
                <Form onSubmit={submitHandler}>
                <h6 className="d-flex m-3" style={{color:"#213e99"}}>NOTE: Cover letter cannot be uploaded if interview attempt is over</h6>
                  <div className="guidelines">  
                    <h4>Cover Letter Template</h4>  
                    <Button className='m-2' variant='outline-secondary' size="sm" onClick={downloadWordTemplate}>  
                      Download Cover Letter Template (.rtf)  
                    </Button>  
                  </div>  
                  <Form.Group  
                    className='mb-4'  
                    controlId='formGridResUpload'  
                    aria-describedby='fileHelpBlock'  
                  >                       
                    <Form.Label>Cover Letter</Form.Label>  
                    <Form.Control  
                      className='mb-4'  
                      type='file'  
                      accept='.pdf'  
                      maxSize={3 * 1024 * 1024}  
                      placeholder='Cover Letter'  
                      onChange={handleCoverletterFileSelection}  
                      required  
                    />  
                    {coverletterLoading && 
                      <div className="text-center">
                        <Message variant='info'>
                          <div className="d-flex align-items-center justify-content-center">
                            <FontAwesomeIcon icon={faCircleNotch} spin className="mr-2" />
                            <span className="ml-2">Uploading cover letter...</span>
                          </div>
                        </Message>
                      </div>
                    }   
                    <small id='fileHelpBlock' className='form-text text-muted'>
                      <ul>
                        <li>Use only the prescribed template</li>
                        <li>Include only your ID - no other personal information (PII)</li>
                        <li>Content must fit on 1 page</li>
                        <li>Submit as PDF file, less than 3 MB</li>
                        <li>Focus on skills, experience, and qualifications relevant to the assigned role</li>
                        <li>
  Create cover letter using the provided Word template, then save as PDF: 
  <a 
    href="https://support.microsoft.com/en-us/office/save-or-convert-to-pdf-or-xps-in-office-desktop-apps-d85416c5-7d77-4fd6-a216-6f4bf7c7c110" 
    target="_blank" 
    rel="noopener noreferrer"
    style={{
      textDecoration: 'none',
      color: '#08084E',
      marginLeft: '5px',
    }}
    className="no-hover-effect"
  >
    <FontAwesomeIcon icon={faArrowRight} />
  </a>
</li>
                      </ul>
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

export default UploadCoverletterScreen