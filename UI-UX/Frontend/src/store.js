import { legacy_createStore as createStore, applyMiddleware, combineReducers } from "redux";  
import thunk from "redux-thunk";  
import { composeWithDevTools } from "redux-devtools-extension";   
  
import {    
  multiRegisterReducer,  
  multiJDUploadReducer,  
  userDetailsReducer,  
  userListReducer,  
  singleUserListReducer,  
  updateDriveNameReducer,  
  updateInterviewCompletedReducer,  
  updateInterviewStartEndTimeReducer,  
  getReqdFieldsReducer,  
  getAllJDReducer,  
  uploadImageCoverletterReducer,  
  userJDListReducer,  
  getCoverLetterReducer,  
  getImageReducer,  
  assignInterviewStartTimeReducer,  
  assignInterviewEndTimeReducer,  
  assignInterviewDateReducer,  
  coverletterUploadReducer,    
  imageUploadReducer,  
  filteredUserListReducer,
  getChatLogReducer,
  interviewrecordingUploadReducer,
  getInterviewRecordingReducer,
  attendanceListReducer,
  getconfscoreListReducer,
  checkImgExistsReducer,
  getDriveAndSlotReducer
} from "./Reducers/UserReducers.js";  
   
const reducers = combineReducers({   
  multiRegister: multiRegisterReducer,  
  multiJDUpload: multiJDUploadReducer,  
  userDetails: userDetailsReducer,  
  userList: userListReducer,  
  singleUserList: singleUserListReducer,  
  updateDriveName: updateDriveNameReducer,  
  updateInterviewCompleted: updateInterviewCompletedReducer,  
  updateInterviewStartEndTime: updateInterviewStartEndTimeReducer,  
  getReqdFields: getReqdFieldsReducer,  
  getAllJD: getAllJDReducer,  
  userJDList: userJDListReducer,  
  getCoverLetter: getCoverLetterReducer,  
  getImage: getImageReducer,  
  assignInterviewStartTime: assignInterviewStartTimeReducer,  
  assignInterviewEndTime: assignInterviewEndTimeReducer,  
  assignInterviewDate: assignInterviewDateReducer,  
  coverletterUpload: coverletterUploadReducer,  
  imageUpload: imageUploadReducer,
  filteredUserList: filteredUserListReducer,  
  getChatLog: getChatLogReducer,
  interviewrecordingUpload: interviewrecordingUploadReducer,
  getInterviewRecording: getInterviewRecordingReducer,
  attendanceList: attendanceListReducer,
  getconfscoreList: getconfscoreListReducer,
  checkImgExists: checkImgExistsReducer,
  getDriveAndSlot: getDriveAndSlotReducer
});  

window.addEventListener('load', () => {  
  localStorage.clear();  
});
  
const initialState = {};  
const middleware = [thunk];  
const store = createStore(  
  reducers,  
  initialState,  
  composeWithDevTools(applyMiddleware(...middleware))  
);  
  
export default store;  


