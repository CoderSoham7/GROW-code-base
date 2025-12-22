import axios from "axios";
import swal from 'sweetalert';

const GenerateInterviewQues = async(t, userid, uuid, CandidateResponse, ctok) =>{
  try {
    const config = {
      withCredentials: true,
    }   
    const data = { ID: userid, uuid: uuid, candidate_response: CandidateResponse, CSRF_token: ctok }
    const result = await axios.post(
      "/api/ext/giq",
      data,
      config
    )
    return result.data.Question;
  } catch (error) {
    console.log('Error code F002')
    await swal({
      title: "Question Generation Failed",
      //text: "Unable to generate the next interview question. 
      //Please check your internet connection or try using a personal hotspot/different WiFi network.",

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
}

export default GenerateInterviewQues;

