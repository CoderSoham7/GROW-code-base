import axios from "axios";
import swal from 'sweetalert';

/**
 * Generates coding questions for Python Programmer assessments
 * This is separate from GenerateInterviewQues to handle coding-specific logic
 * 
 * @param {string} t - Auth token
 * @param {string} userid - User ID
 * @param {string} uuid - Interview UUID
 * @param {string} CandidateResponse - The code solution from candidate
 * @param {string} ctok - CSRF token
 * @returns {Promise<string>} Next question text
 */
const GenerateCodingQues = async(t, userid, uuid, CandidateResponse, ctok) => {
  try {
    const config = {
      headers: {
        // Send only the CSRF token in headers instead of full auth token
        // Authorization header is moved to the request body for better security
        "Content-Type": "application/json",
      },
      // withCredentials is used internally by axios and not stored in client-side storage
      withCredentials: true,
    };
    
    const data = { 
      ID: userid, 
      uuid: uuid, 
      candidate_response: CandidateResponse, 
      CSRF_token: ctok,
      // Move auth token to request body rather than Authorization header
      auth_token: t
    };
    
    const result = await axios.post(
      "/api/coding/response",
      data,
      config
    );
    
    return result.data.Question;
  } catch (error) {
    console.log('Error code C002');
    await swal({
      title: "Coding Question Generation Failed",
      text: "Network Connectivity Issue Detected",
      content: {
        element: "div",
        attributes: {
          innerHTML: `
            <p><strong>Step 1:</strong> Check and Change Network Connection</p>
            <ul>
              <li>Switch to a different WiFi network (or) mobile hotspot</li>
              <li>Refresh page (CTRL+SHIFT+R)</li>
            </ul>
            <br/>
            <p><strong>Step 2:</strong> If network change doesn't work</p>
            <ul>
              <li>Logout</li>
              <li>Re-Login</li>
              <li>Continue ongoing session</li>
            </ul>
          `
        }
      },
      icon: "error",
    });
    return null;
  }
};

/**
 * Initialize a coding assessment with the first question
 * @param {string} t - Auth token
 * @param {string} userid - User ID
 * @param {string} uuid - Interview UUID 
 * @param {string} ctok - CSRF token
 * @returns {Promise<string>} First question text
 */
export const initializeCodingSession = async(t, userid, uuid, ctok) => {
  try {
    const config = {
      headers: {
        // Send only the CSRF token in headers instead of full auth token
        // Authorization header is moved to the request body for better security
        "Content-Type": "application/json",
      },
      // withCredentials is used internally by axios and not stored in client-side storage
      withCredentials: true,
    };
    
    const data = { 
      ID: userid, 
      uuid: uuid,
      CSRF_token: ctok,
      // Move auth token to request body rather than Authorization header
      auth_token: t
    };
    
    const result = await axios.post(
      "/api/coding/initialize",
      data,
      config
    );
    
    return result.data.Question;
  } catch (error) {
    console.log('Error code C001');
    await swal({
      title: "Coding Session Initialization Failed",
      text: "Could not start the coding assessment. Please try again.",
      icon: "error",
    });
    return null;
  }
};

export default GenerateCodingQues;