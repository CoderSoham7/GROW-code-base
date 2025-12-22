import {
MULTI_REGISTER_REQUEST,
MULTI_REGISTER_SUCCESS,
MULTI_REGISTER_FAIL,
MULTI_JD_UPLOAD_REQUEST,
MULTI_JD_UPLOAD_SUCCESS,
MULTI_JD_UPLOAD_FAIL,
USER_DETAILS_REQUEST,
USER_DETAILS_SUCCESS,
USER_DETAILS_FAIL,
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

 
const multiRegisterReducer = (state = { uploadStatus: null }, action) => {  
  switch (action.type) {  
    case MULTI_REGISTER_REQUEST:  
      return { loading: true, uploadStatus: null };  
    case MULTI_REGISTER_SUCCESS:  
      return { loading: false, uploadStatus: 'success', admin_id: action.payload.admin_id, excelData: action.payload.excelData };  
    case MULTI_REGISTER_FAIL:  
      return { loading: false, uploadStatus: 'fail', error: action.payload };  
    default:  
      return state;  
  }  
};  


const multiJDUploadReducer = (state = {uploadStatus: null }, action) => {
  switch (action.type) {
    case MULTI_JD_UPLOAD_REQUEST:
      return { loading: true, uploadStatus: null };  
    case MULTI_JD_UPLOAD_SUCCESS:
      return { loading: false, uploadStatus: 'success', admin_id: action.payload.admin_id, excelData: action.payload.excelData };  
    case MULTI_JD_UPLOAD_FAIL:
      return { loading: false, uploadStatus: 'fail', error: action.payload };  
    default:
      return state
  }
}

const userDetailsReducer = (state = { user: {} }, action) => {
  switch (action.type) {
    case USER_DETAILS_REQUEST:
      return { ...state, loading: true }
    case USER_DETAILS_SUCCESS:
      return { loading: false, user: action.payload }
    case USER_DETAILS_FAIL:
      return { loading: false, error: action.payload }
    case USER_DETAILS_RESET:
      return { user: {} }
    default:
      return state
  }
}


/*
const userListReducer = (state = { userList: [], status: null }, action) => {    
  switch (action.type) {    
    case USER_LIST_REQUEST:    
      return { ...state, loading: true, error: null, status: null };    
    case USER_LIST_SUCCESS:    
      return {   
        ...state,  
        loading: false,   
        userList: action.payload.data,
        status: action.payload.status,
        error: null
      };    
    case USER_LIST_FAIL:    
      return {   
        ...state,  
        loading: false,   
        userList: [],
        error: action.payload.message,
        status: action.payload.status 
      };    
    case SET_USER_LIST:    
      return {   
        ...state,  
        userList: Array.isArray(action.payload) ? action.payload : [],   
        status: null 
      };    
    default:    
      return state;    
  }    
};  
*/
const userListReducer = (state = { userList: [], hasMore: false, nextLastTimestamp: null, nextLastId: null, loading: false, error: null }, action) => {
  switch (action.type) {
    case USER_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case USER_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        userList: action.payload.users,
        hasMore: action.payload.hasMore,
        nextLastTimestamp: action.payload.nextLastTimestamp,
        nextLastId: action.payload.nextLastId,
        error: null
      };

    case USER_LIST_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        userList: [],
        hasMore: false,
        nextLastTimestamp: null,
        nextLastId: null
      };

    case USER_LIST_RESET:
      return { userList: [], hasMore: false, nextLastTimestamp: null, nextLastId: null, loading: false, error: null };

    default:
      return state;
  }
};


const singleUserListReducer = (state = { singleUserList: [] }, action) => {
  switch (action.type) {
    case SINGLE_USER_LIST_REQUEST:
      return { loading: true, singleUserList: [] }
    case SINGLE_USER_LIST_SUCCESS:
      return { loading: false, singleUserList: action.payload }
    case SINGLE_USER_LIST_FAIL:
      return { loading: false, singleUserList: [], error: action.payload }
    case SINGLE_SET_USER_LIST:
      return { ...state, singleUserList: action.payload }
    default:
      return state
  }
}


const getCoverLetterReducer = (state = { coverLetterUrl: "" }, action) => {  
  switch (action.type) {  
    case GET_COVER_LETTER_REQUEST:  
      return { loading: true, coverLetterUrl: "" }  
    case GET_COVER_LETTER_SUCCESS:  
      return { loading: false, coverLetterUrl: action.payload }  
    case GET_COVER_LETTER_FAIL:  
      return { loading: false, coverLetterUrl: "", error: action.payload }  
    default:  
      return state  
  }  
}  

const getImageReducer = (state = { imageUrl: "" }, action) => {  
  switch (action.type) {  
    case GET_IMAGE_REQUEST:  
      return { loading: true, imageUrl: "" }  
    case GET_IMAGE_SUCCESS:  
      return { loading: false, imageUrl: action.payload }  
    case GET_IMAGE_FAIL:  
      return { loading: false, imageUrl: "", error: action.payload }  
    default:  
      return state  
  }  
}

/*
const updateInterviewCompletedReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_INTERVIEW_COMPLETED_REQUEST:
      return { ...state, loading: true };
    case USER_INTERVIEW_COMPLETED_SUCCESS:
      return { 
        ...state,
        success: true, 
        [action.payload.uuid]: action.payload.data
      };
    case SET_INTERVIEW_COMPLETED:
      return { 
        ...state,
        success: true, 
        [action.payload.uuid]: {
          ...state[action.payload.uuid],
          interview_completed: action.payload.interview_completed
        }
      };
    case USER_INTERVIEW_COMPLETED_FAIL:
      return { ...state, success: false, error: action.payload };
    default:
      return state;
  }
};
*/

const updateInterviewCompletedReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_INTERVIEW_COMPLETED_REQUEST:
      return { ...state, loading: true };
    case USER_INTERVIEW_COMPLETED_SUCCESS:
      return { 
        ...state,
        loading: false,
        success: true, 
        interview_completed: action.payload.interview_completed,
        CSRF_token: action.payload.CSRF_token
      };
    case SET_INTERVIEW_COMPLETED:
      return { 
        ...state,
        loading: false,
        success: true, 
        users: action.payload.users
      };
    case USER_INTERVIEW_COMPLETED_FAIL:
      return { 
        ...state, 
        loading: false,
        success: false, 
        error: action.payload 
      };
    default:
      return state;
  }
};


const updateInterviewStartEndTimeReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_INTERVIEW_STARTENDTIME_REQUEST:
      return { ...state, loading: true };
    case USER_INTERVIEW_STARTENDTIME_SUCCESS:
      return { 
        ...state,
        success: true, 
        [action.payload.uuid]: action.payload.data
      };
    case SET_INTERVIEW_STARTENDTIME:
      return { 
        ...state,
        success: true, 
        [action.payload.uuid]: {
          ...state[action.payload.uuid],
          interview_start_time: action.payload.interview_start_time,
          interview_end_time: action.payload.interview_end_time
        }
      };
    case USER_INTERVIEW_STARTENDTIME_FAIL:
      return { ...state, success: false, error: action.payload };
    default:
      return state;
  }
};

const getReqdFieldsReducer = (state = { reqFields: {} }, action) => {
  switch (action.type) {
    case REQDFIELDS_REQUEST:
      return { ...state, loading: true }
    case REQDFIELDS_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        reqFields: action.payload
      }
    case REQDFIELDS_FAIL:
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

const checkImgExistsReducer = (state = { isImg: {} }, action) => {
  switch (action.type) {
    case GET_CHECK_IMG_EXISTS_REQUEST:
      return { ...state, loading: true }
    case GET_CHECK_IMG_EXISTS_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        isImg: action.payload
      }
    case GET_CHECK_IMG_EXISTS_FAIL:
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}


const getAllJDReducer = (state = { jdlist: [] }, action) => {
  switch (action.type) {
    case GET_ALL_JD_REQUEST:
      return { loading: true, jdlist: [] }
    case GET_ALL_JD_SUCCESS:
      return { loading: false, jdlist: action.payload }
    case GET_ALL_JD_FAIL:
      return { loading: false, jdlist: [], error: action.payload }
    default:
      return state
  }
}


const updateDriveNameReducer = (state = { userList: [] }, action) => {  
  switch (action.type) {  
    case USER_DRIVE_NAME_REQUEST:  
      return { ...state, loading: true };  
    case USER_DRIVE_NAME_SUCCESS:  
      return { ...state, success: true };  
    case SET_DRIVE_NAME:  
      return {   
        ...state,   
        loading: false,   
        success: true,   
      };  
    case USER_DRIVE_NAME_FAIL:  
      return { ...state, loading: false, error: action.payload };  
    default:  
      return state;  
  }  
};  


const userJDListReducer = (state = { jdData: {} }, action) => {
  switch (action.type) {
    case USER_JD_LIST_REQUEST:
      return { loading: true, jdData: {} }
    case USER_JD_LIST_SUCCESS:
      return { loading: false, jdData: action.payload }
    case USER_JD_LIST_FAIL:
      return { loading: false, jdData: {}, error: action.payload }
    default:
      return state
  }
}

const assignInterviewStartTimeReducer = (state = {}, action) => {
  switch (action.type) {
    case ASSIGN_INTERVIEW_START_TIME_REQUEST:
      return { loading: true };
    case ASSIGN_INTERVIEW_START_TIME_SUCCESS:
      return { success: true, user: action.payload };
    case SET_ASSIGN_INTERVIEW_START_TIME:  
      return {  
        ...state,  
        loading: false,  
        success: true,  
      };  
    case ASSIGN_INTERVIEW_START_TIME_FAIL:
      return { success: false, error: action.payload };
    default:
      return state;
  }
};

const assignInterviewEndTimeReducer = (state = {}, action) => {
  switch (action.type) {
    case ASSIGN_INTERVIEW_END_TIME_REQUEST:
      return { loading: true };
    case ASSIGN_INTERVIEW_END_TIME_SUCCESS:
      return { success: true, user: action.payload };
    case SET_ASSIGN_INTERVIEW_END_TIME:  
      return {  
        ...state,  
        loading: false,  
        success: true,  
      };
    case ASSIGN_INTERVIEW_END_TIME_FAIL:
      return { success: false, error: action.payload };
    default:
      return state;
  }
};

const assignInterviewDateReducer = (state = {}, action) => {
  switch (action.type) {
    case ASSIGN_INTERVIEW_DATE_REQUEST:
      return { loading: true };
    case ASSIGN_INTERVIEW_DATE_SUCCESS:
      return { success: true, user: action.payload };
    case SET_ASSIGN_INTERVIEW_DATE:  
      return {  
        ...state,  
        loading: false,  
        success: true,  
      };
    case ASSIGN_INTERVIEW_DATE_FAIL:
      return { success: false, error: action.payload };
    default:
      return state;
  }
};

const coverletterUploadReducer = (state = {}, action) => {      
  switch (action.type) {      
    case COVERLETTER_UPLOAD_REQUEST:      
      return { loading: true };      
    case COVERLETTER_UPLOAD_SUCCESS:      
      return { 
        loading: false, 
        coverletterStatus: action.payload,
        error: null  // Clear any previous errors
      };      
    case COVERLETTER_UPLOAD_FAIL:      
      return { 
        loading: false, 
        error: {
          message: action.payload.message,
          type: action.payload.type,
          status: action.payload.status
        }
      };      
    default:      
      return state;      
  }      
};
      
const imageUploadReducer = (state = {}, action) => {      
  switch (action.type) {      
    case IMAGE_UPLOAD_REQUEST:      
      return { loading: true };      
    case IMAGE_UPLOAD_SUCCESS:      
      return { loading: false, imageStatus: action.payload };      
    case IMAGE_UPLOAD_FAIL:      
      return { loading: false, error: action.payload };      
    default:      
      return state;      
  }      
};      

 
const filteredUserListReducer = (state = { filteredUserList: [] }, action) => {
  switch (action.type) {
    case FILTERED_USER_LIST_REQUEST:
      return { loading: true, filteredUserList: [] }
    case FILTERED_USER_LIST_SUCCESS:  
      return { loading: false, filteredUserList: action.payload };
    case FILTERED_USER_LIST_FAIL:
      return { loading: false, filteredUserList: [], error: action.payload }
    case SET_FILTERED_USER_LIST:
      return { ...state, filteredUserList: action.payload }
    default:
      return state
  }
}

const getChatLogReducer = (state = { loading: true, chatLog: [], chatLogTimestamps: [] }, action) => {    
  switch (action.type) {    
    case GET_CHATLOG_REQUEST:    
      return { ...state, loading: true };    
    case GET_CHATLOG_SUCCESS:       
      return {    
        loading: false,    
        chatLog: action.payload.chatLog,    
        chatLogTimestamps: action.payload.chatLogTimestamps,    
        error: null,    
      };      
    case GET_CHATLOG_FAIL:    
      return {   
        loading: false,   
        chatLog: [],   
        chatLogTimestamps: [],   
        error: action.payload   
      };    
    default:    
      return state;    
  }    
};    


const interviewrecordingUploadReducer = (state = {}, action) => {      
  switch (action.type) {      
    case INTERVIEWRECORDING_UPLOAD_REQUEST:      
      return { loading: true };      
    case INTERVIEWRECORDING_UPLOAD_SUCCESS:      
      return { loading: false, interviewrecordingStatus: action.payload };      
    case INTERVIEWRECORDING_UPLOAD_FAIL:      
      return { loading: false, error: action.payload };      
    default:      
      return state;      
  }      
};  


const getInterviewRecordingReducer = (state = { interviewrecordingUrl: "" }, action) => {  
  switch (action.type) {  
    case GET_INTERVIEWRECORDING_REQUEST:  
      return { loading: true, interviewrecordingUrl: "" }  
    case GET_INTERVIEWRECORDING_SUCCESS:  
      return { loading: false, interviewrecordingUrl: action.payload }  
    case GET_INTERVIEWRECORDING_FAIL:  
      return { loading: false, interviewrecordingUrl: "", error: action.payload }  
    default:  
      return state  
  }  
}

const attendanceListReducer = (state = { attendanceList: [] }, action) => {
  switch (action.type) {
    case ATTENDANCE_REQUEST:
      return { loading: true, attendanceList: [] }
    case ATTENDANCE_SUCCESS:  
      return { loading: false, attendanceList: action.payload };
    case ATTENDANCE_FAIL:
      return { loading: false, attendanceList: [], error: action.payload }
    case SET_ATTENDANCE:
      return { ...state, attendanceList: action.payload }
    default:
      return state
  }
}

const getconfscoreListReducer = (state = { getconfscoreList: [] }, action) => {
  switch (action.type) {
    case GET_CONFSCORE_REQUEST:
      return { loading: true, getconfscoreList: [] }
    case GET_CONFSCORE_SUCCESS:  
      return { loading: false, getconfscoreist: action.payload };
    case GET_CONFSCORE_FAIL:
      return { loading: false, getconfscoreList: [], error: action.payload }
    case SET_CONFSCORE:
      return { ...state, getconfscoreList: action.payload }
    default:
      return state
  }
}

const getDriveAndSlotReducer = (state = { driveAndSlotList: [] }, action) => {
  switch (action.type) {
    case GET_DRIVE_AND_SLOT_REQUEST:
      return { loading: true, driveAndSlotList: [] }
    case GET_DRIVE_AND_SLOT_SUCCESS:
      return { loading: false, driveAndSlotList: action.payload };
    case GET_DRIVE_AND_SLOT_FAIL:
      return { loading: false, driveAndSlotList: [], error: action.payload }
    case SET_DRIVE_AND_SLOT:
      return { ...state, driveAndSlotList: action.payload }
    default:
      return state
  }
}

export { multiRegisterReducer, multiJDUploadReducer, userDetailsReducer, 
  userListReducer, singleUserListReducer, updateDriveNameReducer, 
  updateInterviewCompletedReducer, updateInterviewStartEndTimeReducer, getReqdFieldsReducer, 
  getAllJDReducer, userJDListReducer,
  getCoverLetterReducer, getImageReducer, assignInterviewStartTimeReducer, 
  assignInterviewEndTimeReducer, assignInterviewDateReducer, coverletterUploadReducer,  
  imageUploadReducer, filteredUserListReducer, getChatLogReducer, interviewrecordingUploadReducer, 
  getInterviewRecordingReducer, attendanceListReducer, getconfscoreListReducer, checkImgExistsReducer, 
  getDriveAndSlotReducer}
