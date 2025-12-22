import axios from "axios"
import {
MULTI_REGISTER_REQUEST,
MULTI_REGISTER_FAIL,
MULTI_REGISTER_SUCCESS,
MULTI_JD_UPLOAD_REQUEST,
MULTI_JD_UPLOAD_SUCCESS,
MULTI_JD_UPLOAD_FAIL,
USER_DETAILS_REQUEST,
USER_DETAILS_FAIL,
USER_DETAILS_SUCCESS,
USER_DETAILS_RESET,
USER_LIST_REQUEST,
USER_LIST_SUCCESS,
USER_LIST_FAIL,
USER_LIST_RESET,
SET_USER_LIST,
SINGLE_USER_LIST_REQUEST,
SINGLE_USER_LIST_SUCCESS,
SINGLE_USER_LIST_FAIL,
SINGLE_SET_USER_LIST,
GET_COVER_LETTER_REQUEST,
GET_COVER_LETTER_SUCCESS,
GET_COVER_LETTER_FAIL,
GET_IMAGE_REQUEST,
GET_IMAGE_SUCCESS,
GET_IMAGE_FAIL,
USER_DRIVE_NAME_REQUEST,
USER_DRIVE_NAME_SUCCESS,
USER_DRIVE_NAME_FAIL,
SET_DRIVE_NAME,
USER_INTERVIEW_COMPLETED_REQUEST,
USER_INTERVIEW_COMPLETED_SUCCESS,
USER_INTERVIEW_COMPLETED_FAIL,
SET_INTERVIEW_COMPLETED, 
USER_INTERVIEW_STARTENDTIME_REQUEST,
USER_INTERVIEW_STARTENDTIME_SUCCESS,
USER_INTERVIEW_STARTENDTIME_FAIL,
SET_INTERVIEW_STARTENDTIME, 
REQDFIELDS_REQUEST,
REQDFIELDS_SUCCESS,
REQDFIELDS_FAIL,
SET_REQDFIELDS,
GET_ALL_JD_REQUEST,
GET_ALL_JD_SUCCESS,
GET_ALL_JD_FAIL,
USER_JD_LIST_REQUEST,
USER_JD_LIST_SUCCESS,
USER_JD_LIST_FAIL,
ASSIGN_INTERVIEW_START_TIME_REQUEST,
ASSIGN_INTERVIEW_START_TIME_SUCCESS,
ASSIGN_INTERVIEW_START_TIME_FAIL,
SET_ASSIGN_INTERVIEW_START_TIME,
ASSIGN_INTERVIEW_END_TIME_REQUEST,
ASSIGN_INTERVIEW_END_TIME_SUCCESS,
ASSIGN_INTERVIEW_END_TIME_FAIL,
SET_ASSIGN_INTERVIEW_END_TIME,
ASSIGN_INTERVIEW_DATE_REQUEST,
ASSIGN_INTERVIEW_DATE_SUCCESS,
ASSIGN_INTERVIEW_DATE_FAIL,
SET_ASSIGN_INTERVIEW_DATE,
COVERLETTER_UPLOAD_REQUEST,  
COVERLETTER_UPLOAD_SUCCESS,  
COVERLETTER_UPLOAD_FAIL,  
IMAGE_UPLOAD_REQUEST,  
IMAGE_UPLOAD_SUCCESS,  
IMAGE_UPLOAD_FAIL,
FILTERED_USER_LIST_REQUEST,
FILTERED_USER_LIST_SUCCESS,
FILTERED_USER_LIST_FAIL,
SET_FILTERED_USER_LIST,
GET_CHATLOG_REQUEST,
GET_CHATLOG_SUCCESS,
GET_CHATLOG_FAIL,
SET_CHATLOG,
INTERVIEWRECORDING_UPLOAD_REQUEST,  
INTERVIEWRECORDING_UPLOAD_SUCCESS,  
INTERVIEWRECORDING_UPLOAD_FAIL,
GET_INTERVIEWRECORDING_REQUEST,
GET_INTERVIEWRECORDING_SUCCESS,
GET_INTERVIEWRECORDING_FAIL,
ATTENDANCE_REQUEST,
ATTENDANCE_SUCCESS,
ATTENDANCE_FAIL,
SET_ATTENDANCE,
GET_CONFSCORE_REQUEST,
GET_CONFSCORE_SUCCESS,
GET_CONFSCORE_FAIL,
SET_CONFSCORE,
GET_CHECK_IMG_EXISTS_SUCCESS,
GET_CHECK_IMG_EXISTS_REQUEST,
GET_CHECK_IMG_EXISTS_FAIL,
SET_CHECK_IMG_EXISTS,
GET_DRIVE_AND_SLOT_FAIL,
GET_DRIVE_AND_SLOT_REQUEST,
GET_DRIVE_AND_SLOT_SUCCESS,
SET_DRIVE_AND_SLOT,
GET_ALL_PIPELINES_REQUEST,
GET_ALL_PIPELINES_SUCCESS,
GET_ALL_PIPELINES_FAIL,
} from "../Constants/UserConstants.js"

const multiregister = (admin_id, excelData,userInfo) =>
async (dispatch) => {
  try {
    dispatch({
      type: MULTI_REGISTER_REQUEST,
    })
    const config = {
      withCredentials: true,
    }
    if (userInfo.isAdmin) {  
      const { status } = await axios.post("/api/users/multiregister", { admin_id: admin_id, excelData: excelData}, config);  
  
      if (status === 200 || status === 201) {  
        dispatch({  
          type: MULTI_REGISTER_SUCCESS,
          payload: 'success'
        });  
      } else {  
        dispatch({ type: MULTI_REGISTER_FAIL, payload: "fail" });  
        throw new Error("Upload not successful");  
      }  
    } else {  
      dispatch({ type: USER_LIST_FAIL, payload: "fail" });  
      throw new Error("Unauthorized access");  
    }  
  } catch (error) {  
    dispatch({  
      type: MULTI_REGISTER_FAIL,  
      payload: error.response && error.response.data.message  
        ? error.response.data.message  
        : "An error occurred",  
    });  
    throw error;
}}




const multiJDUpload = (admin_id, excelData,userInfo) => async (dispatch) => {
  try {
    dispatch({
      type: MULTI_JD_UPLOAD_REQUEST,
    })
    const config = {
      withCredentials: true,
    }
    if (userInfo.isAdmin) {
      const { status } = await axios.post("/api/users/multi-jd-upload",{ admin_id: admin_id, excelData: excelData},config)
      if (status === 201) {  
        dispatch({  
          type: MULTI_JD_UPLOAD_SUCCESS,
          payload: 'success'
        });  
      } else {  
        dispatch({ type: MULTI_JD_UPLOAD_FAIL, payload: "fail" });  
        throw new Error("Upload not successful");  
      }  
    } else {  
      dispatch({ type: USER_LIST_FAIL, payload: "fail" });  
      throw new Error("Unauthorized access");  
    }  
  } catch (error) {  
    dispatch({  
      type: MULTI_JD_UPLOAD_FAIL,  
      payload: error.response && error.response.data.message  
        ? error.response.data.message  
        : "An error occurred",  
    });  
    throw error;
}}



const getAllJD = (userInfo) => async (dispatch) => {
  try {
    dispatch({
      type: GET_ALL_JD_REQUEST,
    });

    const config = {
      withCredentials: true,
    };

    if (userInfo.isAdmin) {
      const { data } = await axios.get(`/api/users/getalljd/`, config);

      dispatch({
        type: GET_ALL_JD_SUCCESS,
        payload: data,
      });
    } else {
      dispatch({
        type: GET_ALL_JD_FAIL,
        payload: "Unauthorized access",
      });
      throw new Error("Unauthorized access");
    }
  } catch (error) {
    dispatch({
      type: GET_ALL_JD_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : "An error occurred",
    });
  }
};


const getUserDetails = (id, userInfo) => async (dispatch) => {
try {
  dispatch({
    type: USER_DETAILS_REQUEST,
  })
  const config = {
    withCredentials: true,
  }
  const { data } = await axios.get(`/api/users/${id}`, config)

  dispatch({
    type: USER_DETAILS_SUCCESS,
    payload: data,
  })
} catch (error) {
  dispatch({
    type: USER_DETAILS_FAIL,
    payload:
      error.response && error.response.data.message
        ? error.response.data.message
        : "An error occurred",
  })
}
}

/*
const listUsers = (userInfo) => async (dispatch) => {    
  try {    
    dispatch({ type: USER_LIST_REQUEST });    
  
    const config = {    
      headers: {    
        'Content-Type': 'application/json'    
      },    
      withCredentials: true,    
    };    
  
    let response;    
    if (userInfo.isAdmin) {      
        response = await axios.post('/api/users/allusers', { userInfo }, config);    
    } else {
        throw new Error("Unauthorized access");
    }
    dispatch({ type: USER_LIST_SUCCESS, payload: { data: Array.isArray(response.data) ? response.data : [], status: response.status } });       
  } catch (error) {    
    dispatch({    
      type: USER_LIST_FAIL,    
      payload: {    
        message: error.response && error.response.data.message ? error.response.data.message : error.message || "An error occurred",  
        status: error.response ? error.response.status : 500,  
      },    
    });    
  }    
};
*/

const listUsers = (userInfo, lastTimestamp, lastId, candidateIds = []) => async (dispatch) => {
  try {
    dispatch({ type: USER_LIST_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      params: { lastTimestamp, lastId }
    };

    const { data } = await axios.post('/api/users/allusers', { userInfo, candidateIds }, config);

    dispatch({
      type: USER_LIST_SUCCESS,
      payload: data
    });
  } catch (error) {
    dispatch({
      type: USER_LIST_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
  }
};

const resetUserList = () => ({
  type: USER_LIST_RESET
});


const listSingleUser = (userId, userInfo) => async (dispatch) => {
try {
  dispatch({ type: SINGLE_USER_LIST_REQUEST });
  const config = {
    withCredentials: true,
  };
  if (userInfo.isAdmin) {
    const { data } = await axios.get(`/api/users/${userId}`, config);
    dispatch({ type: SINGLE_USER_LIST_SUCCESS, payload: data });
    dispatch({ type: SINGLE_SET_USER_LIST, payload: data });
  } else {
    dispatch({ type: SINGLE_USER_LIST_FAIL, payload: "Unauthorized access." });
  }
} catch (error) {
  console.log(error)
  dispatch({    
    type: SINGLE_USER_LIST_FAIL,
    payload:
      error.response && error.response.data.message
        ? error.response.data.message
        : "An error occurred",
  });
}
};



const getCoverLetter = (userId, uuid, userInfo) => async (dispatch) => {      
try {      
  dispatch({      
    type: GET_COVER_LETTER_REQUEST,      
  })      
  const config = {      
    withCredentials: true, 
    responseType: 'arraybuffer' 
  }      
  const { data } = await axios.get(`/api/users/getcoverletter/${userId}/${uuid}`, config)
  const blob = new Blob([data], { type: 'application/pdf' });  
  const url = URL.createObjectURL(blob);  

  dispatch({      
    type: GET_COVER_LETTER_SUCCESS,      
    payload: url,      
  })     
  
} catch (error) {      
  dispatch({      
    type: GET_COVER_LETTER_FAIL,      
    payload:      
      error.response && error.response.data.message      
        ? error.response.data.message      
        : "An error occurred",      
  })      
}      
}  



const getImage = (userId, userInfo) => async (dispatch) => {      
try {      
  dispatch({      
    type: GET_IMAGE_REQUEST,      
  })      
  const config = {      
    withCredentials: true,    
    responseType: 'arraybuffer' 
  }      
  const { data } = await axios.get(`/api/users/getimage/${userId}`, config) 
  const blob = new Blob([data], { type: 'image/jpeg' });  
  const url = URL.createObjectURL(blob);    
  dispatch({      
    type: GET_IMAGE_SUCCESS,      
    payload: url,      
  })     
  
} catch (error) {      
  dispatch({      
    type: GET_IMAGE_FAIL,      
    payload:      
      error.response && error.response.data.message      
        ? error.response.data.message      
        : "An error occurred",      
  })      
}      
}  


const updateDriveName = (userId, uuid, newDriveName, userInfo) => async (dispatch, getState) => {  
  try {  
    dispatch({ type: USER_DRIVE_NAME_REQUEST });    
    const config = {  
      withCredentials: true,  
    };    
    if (userInfo.isAdmin) {  
      const { data } = await axios.post(`/api/users/interviewdrive/${userId}/${uuid}`, { interview_drive: newDriveName}, config);  
      dispatch({ type: USER_DRIVE_NAME_SUCCESS });  
      dispatch({ type: SET_DRIVE_NAME, payload: data }); 
    } else {  
      dispatch({ type: USER_DRIVE_NAME_FAIL, payload: "Unauthorized access." });  
    }  
  } catch (error) {  
    dispatch({  
      type: USER_DRIVE_NAME_FAIL,  
      payload:  
        error.response && error.response.data.message  
          ? error.response.data.message  
          : error.message,  
    });  
  }  
};  


/*
const updateInterviewCompleted = (userId, uuid, newInterviewCompleted, ctok, setUserInfo) => async (dispatch, getState) => {    
  try {    
    dispatch({ type: USER_INTERVIEW_COMPLETED_REQUEST });      
    if (setUserInfo) {  
      setUserInfo((prevUserInfo) => ({    
        ...prevUserInfo,    
        CSRF_token: ctok,    
      }));    
    }      
    const config = {    
      withCredentials: true,    
    };     
    const { data } = await axios.post(`/api/users/interviewcompleted/${userId}/${uuid}`, { interview_completed: newInterviewCompleted, CSRF_token: ctok }, config);    
    dispatch({ type: USER_INTERVIEW_COMPLETED_SUCCESS, payload: data });    
    const userList = getState().userList;    
    if (userList && userList.users) {    
      const updatedUserList = userList.users.map(user => user._id === userId ? { ...user, interview_completed: newInterviewCompleted } : user);    
      dispatch({ type: SET_INTERVIEW_COMPLETED, payload: { users: updatedUserList } });    
    }        
  } catch (error) {    
    dispatch({    
      type: USER_INTERVIEW_COMPLETED_FAIL,    
      payload:    
        error.response && error.response.data.message    
          ? error.response.data.message    
          : "An error occurred",    
    });    
  }    
};
*/
const updateInterviewCompleted = (userId, uuid, interview_completed, ctok, setUserInfo) => async (dispatch, getState) => {    
  try {    
    dispatch({ type: USER_INTERVIEW_COMPLETED_REQUEST });      
    if (setUserInfo) {  
      setUserInfo((prevUserInfo) => ({    
        ...prevUserInfo,    
        CSRF_token: ctok,    
      }));    
    }      
    const config = {    
      withCredentials: true,    
    };     
    const { data } = await axios.post(`/api/users/interviewcompleted/${userId}/${uuid}`, { interview_completed, CSRF_token: ctok }, config);    
    dispatch({ type: USER_INTERVIEW_COMPLETED_SUCCESS, payload: data });    
    const userList = getState().userList;    
    if (userList && userList.users) {    
      const updatedUserList = userList.users.map(user => 
        user._id === userId ? { ...user, interview_completed: data.interview_completed } : user
      );    
      dispatch({ type: SET_INTERVIEW_COMPLETED, payload: { users: updatedUserList } });    
    }        
  } catch (error) {    
    dispatch({    
      type: USER_INTERVIEW_COMPLETED_FAIL,    
      payload:    
        error.response && error.response.data.message    
          ? error.response.data.message    
          : "An error occurred",    
    });    
  }    
};


const updateInterviewStartEndTime = (userId, uuid, newInterviewStartTime, newInterviewEndTime, userInfo) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_INTERVIEW_STARTENDTIME_REQUEST });
    const config = {
      withCredentials: true,
    };    
    const { data } = await axios.post(`/api/users/interviewstartendtime/${userId}/${uuid}`, {interview_start_time: newInterviewStartTime, interview_end_time: newInterviewEndTime}, config)
    dispatch({ type: USER_INTERVIEW_STARTENDTIME_SUCCESS, payload: data });
    const userList = getState().userList;
    if (userList && userList.users) {
      const updatedUserList = userList.users.map(user => user._id === userId ? {...user, interview_start_time: newInterviewStartTime, interview_end_time: newInterviewEndTime} : user);
      dispatch({ type: SET_INTERVIEW_STARTENDTIME, payload: { users: updatedUserList } });
    }      
  } catch (error) {
    dispatch({
      type: USER_INTERVIEW_STARTENDTIME_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : "An error occurred",
    });
  }
};



const assignInterviewStartTime = (userId, uuid, assignedInterviewStartTime, userInfo) => async (dispatch, getState) => {
  try {
    dispatch({ type: ASSIGN_INTERVIEW_START_TIME_REQUEST });
    const config = {
      withCredentials: true,
    };
    if (userInfo.isAdmin) {
      const { data } = await axios.post(`/api/users/assigninterviewstarttime/${userId}/${uuid}`, { assigned_interview_start_time: assignedInterviewStartTime }, config);
      dispatch({ type: ASSIGN_INTERVIEW_START_TIME_SUCCESS });
      dispatch({ type: SET_ASSIGN_INTERVIEW_START_TIME, payload: data });
    } else {
      dispatch({ type: ASSIGN_INTERVIEW_START_TIME_FAIL, payload: "Unauthorized access." });
    }
  } catch (error) {
    dispatch({
      type: ASSIGN_INTERVIEW_START_TIME_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};



const assignInterviewEndTime = (userId, uuid, assignedInterviewEndTime, userInfo) => async (dispatch, getState) => {
  try {
    dispatch({ type: ASSIGN_INTERVIEW_END_TIME_REQUEST });
    const config = {
      withCredentials: true,
    };
    if (userInfo.isAdmin) {
      const { data } = await axios.post(`/api/users/assigninterviewendtime/${userId}/${uuid}`, { assigned_interview_end_time: assignedInterviewEndTime }, config);
      dispatch({ type: ASSIGN_INTERVIEW_END_TIME_SUCCESS });
      dispatch({ type: SET_ASSIGN_INTERVIEW_END_TIME, payload: data });
    } else {
      dispatch({ type: ASSIGN_INTERVIEW_END_TIME_FAIL, payload: "Unauthorized access." });
    }
  } catch (error) {
    dispatch({
      type: ASSIGN_INTERVIEW_END_TIME_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};


const assignInterviewDate = (userId, uuid, interviewDate, userInfo) => async (dispatch, getState) => {
  try {
    dispatch({ type: ASSIGN_INTERVIEW_DATE_REQUEST });
    const config = {
      withCredentials: true,
    };
    if (userInfo.isAdmin) {
      const { data } = await axios.post(`/api/users/assigninterviewdate/${userId}/${uuid}`, { interview_date: interviewDate }, config);
      dispatch({ type: ASSIGN_INTERVIEW_DATE_SUCCESS });
      dispatch({ type: SET_ASSIGN_INTERVIEW_DATE, payload: data });
    } else {
      dispatch({ type: ASSIGN_INTERVIEW_DATE_FAIL, payload: "Unauthorized access." });
    }
  } catch (error) {
    dispatch({
      type: ASSIGN_INTERVIEW_DATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};


const getReqdFields = (userId, uuid) => async (dispatch) => {
  try {
    dispatch({ type: REQDFIELDS_REQUEST });
    const config = { withCredentials: true };
    const { data } = await axios.get(`/api/users/getreqdfields/${userId}/${uuid}`, config);
    dispatch({ 
      type: REQDFIELDS_SUCCESS, 
      payload: data
    });
  } catch (error) {
    dispatch({
      type: REQDFIELDS_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : "An error occurred",
    });
  }
};


const checkImgExists = (userId) => async (dispatch) => {
  try {
    dispatch({ type: GET_CHECK_IMG_EXISTS_REQUEST });
    const config = { withCredentials: true };
    const { data } = await axios.get(`/api/users/check-img/${userId}`, config);
    dispatch({ 
      type: GET_CHECK_IMG_EXISTS_SUCCESS, 
      payload: data
    });
  } catch (error) {
    dispatch({
      type: GET_CHECK_IMG_EXISTS_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : "An error occurred",
    });
  }
};

const userJDList = (userId, uuid, userInfo) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_JD_LIST_REQUEST });
    const config = { withCredentials: true };  
    if (userInfo.isAdmin) {
      const { data } = await axios.get(`/api/users/getjd/${userId}/${uuid}`, config);  
      dispatch({ type: USER_JD_LIST_SUCCESS, payload: data });
      return data; // Return the data
    } else {
      dispatch({ type: USER_JD_LIST_FAIL, payload: "Unauthorized access." });
      throw new Error("Unauthorized access.");
    }
  } catch (error) {
    dispatch({
      type: USER_JD_LIST_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : "An error occurred",
    });
    throw error; // Re-throw the error
  }
};


const uploadCoverletter = (formData, userInfo) => async (dispatch, getState) => {
  try {
    dispatch({
      type: COVERLETTER_UPLOAD_REQUEST,
    });
const config = {
  withCredentials: true,
  headers: {
    "Content-Type": "multipart/form-data"
  },
};

const response = await axios.post("/api/upload/coverletter", formData, config);

dispatch({
  type: COVERLETTER_UPLOAD_SUCCESS,
  payload: response.data.status,
});

} catch (error) {
let errorMessage = "An unexpected error occurred";
let errorType = "GENERAL_ERROR";


if (error.response) {
  // Server returned an error response
  const errorCode = error.response.data.message;
  
  switch (errorCode) {
    case 'Error Code B107':
      errorMessage = "Invalid user ID format";
      errorType = "VALIDATION_ERROR";
      break;
    case 'Error Code B108: UUID is required':
      errorMessage = "Interview ID is required";
      errorType = "VALIDATION_ERROR";
      break;
    case 'Error Code B113: Interview not found':
      errorMessage = "Interview session not found";
      errorType = "NOT_FOUND_ERROR";
      break;
    case 'Error Code B121: Cover letter not found or wrong format.':
      errorMessage = "Please upload a valid cover letter file";
      errorType = "FILE_ERROR";
      break;
    case 'Error Code B124':
      errorMessage = "Server encountered an error";
      errorType = "SERVER_ERROR";
      break;
    case 'Error Code B130':
      errorMessage = "Invalid request to processing service";
      errorType = "PROCESSING_ERROR";
      break;
    case 'Error Code B131':
      errorMessage = "Authentication failed for processing service";
      errorType = "AUTH_ERROR";
      break;
    case 'Error Code B132':
      errorMessage = "Access denied to processing service";
      errorType = "AUTH_ERROR";
      break;
    case 'Error Code B133':
      errorMessage = "Processing service unavailable";
      errorType = "SERVICE_ERROR";
      break;
    case 'Error Code B134':
      errorMessage = "Processing service encountered an error";
      errorType = "SERVICE_ERROR";
      break;
    case 'Error Code B135':
      errorMessage = "Unknown processing service error";
      errorType = "SERVICE_ERROR";
      break;
    case 'Error Code B136':
      errorMessage = "Failed to connect to processing service";
      errorType = "CONNECTION_ERROR";
      break;
    default:
      errorMessage = error.response.data.message || "An error occurred";
      errorType = "UNKNOWN_ERROR";
  }

  // Log error for debugging
  console.error(`Cover Letter Upload Error: ${errorType}`, {
    errorCode: error.response.data.message,
    statusCode: error.response.status,
    details: error.response.data
  });

} else if (error.request) {
  // Request was made but no response received
  errorMessage = "Unable to connect to server";
  errorType = "NETWORK_ERROR";
  console.error("Network Error:", error.request);
} else {
  // Something happened in setting up the request
  errorMessage = "Failed to send request";
  errorType = "REQUEST_ERROR";
  console.error("Request Setup Error:", error.message);
}

dispatch({
  type: COVERLETTER_UPLOAD_FAIL,
  payload: {
    message: errorMessage,
    type: errorType,
    status: error.response?.status || 500
  },
});     
  }        
};        
      


const uploadImage = (formData, userInfo) => async (dispatch, getState) => {        
  try {        
    dispatch({        
      type: IMAGE_UPLOAD_REQUEST,        
    });        
    const config = {       
      withCredentials: true, 
      headers: {        
        "Content-Type": "multipart/form-data",       
      },        
    };        
      
    const response = await axios.post("/api/upload/image", formData, config); 
      
    dispatch({        
      type: IMAGE_UPLOAD_SUCCESS,        
      payload: response.data.status,  
    });        
      
  } catch (error) {        
    dispatch({        
      type: IMAGE_UPLOAD_FAIL,        
      payload: error.response && error.response.data.message ? error.response.data.message : "An error occurred",        
    });        
  }        
};   



const filteredUserList = (filteredData, userInfo) => async (dispatch, getState) => {  
  try {  
    dispatch({ type: FILTERED_USER_LIST_REQUEST });  
    const config = { withCredentials: true };  
    if (userInfo.isAdmin) {  
      const { data } = await axios.post("/api/users/filtered-users", { filteredData }, config);  
      dispatch({ type: FILTERED_USER_LIST_SUCCESS, payload: data });  
      return data;
    } else {  
      dispatch({ type: FILTERED_USER_LIST_FAIL, payload: "Unauthorized access." });  
    }  
  } catch (error) {  
    const errorMessage = error.response && error.response.data.message  
      ? error.response.data.message  
      : error.message || "An error occurred";  
    dispatch({ type: FILTERED_USER_LIST_FAIL, payload: errorMessage });  
  }  
};  



const getChatLog = (userId, uuid) => async (dispatch, getState) => {
  try {
    dispatch({
      type: GET_CHATLOG_REQUEST,
    })
    const config = {
      withCredentials: true,
    };
    const { data } = await axios.get(`/api/users/getchatlog/${userId}/${uuid}`, config)
    dispatch({ type: GET_CHATLOG_SUCCESS, payload: data });
    dispatch({ type: SET_CHATLOG, payload: data });
  } catch (error) {
    dispatch({
      type: GET_CHATLOG_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : "An error occurred",
    })
  }
  }




  const uploadInterviewRecording = (formData, userInfo) => async (dispatch, getState) => {        
    try {        
      dispatch({        
        type: INTERVIEWRECORDING_UPLOAD_REQUEST,        
      });        
      const config = {       
        withCredentials: true, 
        headers: {        
          "Content-Type": "multipart/form-data",       
        },        
      };              
      const response = await axios.post("/api/upload/interviewrecording", formData, config);       
      dispatch({        
        type: INTERVIEWRECORDING_UPLOAD_SUCCESS,        
        payload: response.data.status,  
      });             
    } catch (error) {        
      dispatch({        
        type: INTERVIEWRECORDING_UPLOAD_FAIL,        
        payload: error.response && error.response.data.message ? error.response.data.message : "An error occurred",        
      });        
    }        
  };   
  
  
  const getInterviewRecording = (userId, userInfo) => async (dispatch) => {  
    try {  
      dispatch({ type: GET_INTERVIEWRECORDING_REQUEST });   
      const config = {  
        withCredentials: true,  
        responseType: 'blob',
      };    
      const { data } = await axios.get(`/api/users/getinterviewrecording/${userId}`, config);    
      const url = URL.createObjectURL(data);    
      dispatch({  
        type: GET_INTERVIEWRECORDING_SUCCESS,  
        payload: url,  
      });    
    } catch (error) {  
      dispatch({  
        type: GET_INTERVIEWRECORDING_FAIL,  
        payload:  
          error.response && error.response.data.message  
            ? error.response.data.message  
            : "An error occurred",  
      });  
    }  
  }  

  const attendanceList = (attendanceData, userInfo) => async (dispatch, getState) => {  
    try {  
      dispatch({ type: ATTENDANCE_REQUEST});  
      const config = { withCredentials: true };  
      if (userInfo.isAdmin) {  
        const { data } = await axios.post("/api/users/attendance", { attendanceData }, config);  
        dispatch({ type: ATTENDANCE_SUCCESS, payload: data });  
        return data;
      } else {  
        dispatch({ type: ATTENDANCE_FAIL, payload: "Unauthorized access." });  
      }  
    } catch (error) {  
      const errorMessage = error.response && error.response.data.message  
        ? error.response.data.message  
        : error.message || "An error occurred";  
      dispatch({ type: ATTENDANCE_FAIL, payload: errorMessage });  
    }  
  };  
  

  const getconfscoreList = (confscoreData, userInfo) => async (dispatch, getState) => {  
    try {  
      dispatch({ type: GET_CONFSCORE_REQUEST});  
      const config = { withCredentials: true };  
      if (userInfo.isAdmin) {  
        const { data } = await axios.post("/api/users/getconfscore", { confscoreData }, config);  
        dispatch({ type: GET_CONFSCORE_SUCCESS, payload: data });  
        return data;
      } else {  
        dispatch({ type: GET_CONFSCORE_FAIL, payload: "Unauthorized access." });  
      }  
    } catch (error) {  
      const errorMessage = error.response && error.response.data.message  
        ? error.response.data.message  
        : error.message || "An error occurred";  
      dispatch({ type: GET_CONFSCORE_FAIL, payload: errorMessage });  
    }  
  };  
  
  const getDriveAndSlot = (candidateIds, userInfo) => async (dispatch, getState) => {
    try {
      dispatch({ type: GET_DRIVE_AND_SLOT_REQUEST });
      const config = { withCredentials: true };
      if (userInfo.isAdmin) {
        const { data } = await axios.post("/api/users/get-drive-and-slot", { candidateIds }, config);
        dispatch({ type: GET_DRIVE_AND_SLOT_SUCCESS, payload: data });
        return data;
      } else {
        dispatch({ type: GET_DRIVE_AND_SLOT_FAIL, payload: "Unauthorized access." });
      }
    } catch (error) {  
      const errorMessage = error.response && error.response.data.message  
        ? error.response.data.message  
        : error.message || "An error occurred";  
      dispatch({ type: GET_DRIVE_AND_SLOT_FAIL, payload: errorMessage });  
    }  
  };  
  
export { multiregister, multiJDUpload, getUserDetails, 
listUsers, resetUserList, listSingleUser, updateDriveName, 
updateInterviewCompleted, updateInterviewStartEndTime, 
getReqdFields, getAllJD, userJDList,
getCoverLetter, getImage, 
assignInterviewStartTime, assignInterviewEndTime, assignInterviewDate, 
uploadCoverletter, uploadImage, filteredUserList, getChatLog, uploadInterviewRecording, getInterviewRecording, 
attendanceList, getconfscoreList, checkImgExists, getDriveAndSlot};  
