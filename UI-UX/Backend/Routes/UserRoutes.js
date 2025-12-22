import express from "express" 
import {
    SSOAuthUser,
    SSOAuthRedirect,
    SSOGetProfile,
    AuthUser,
    LogoutUser,
    Profile,
    MultiRegister,
    MultiJDUpload,
    GetAllJD,
    GetSingleUser,
    GetCoverletter,
    GetImage,
    ChangeDriveName,
    ChangeInterviewCompleted,
    AssignInterviewStartTime,
    AssignInterviewEndTime,
    AssignInterviewDate,
    ChangeInterviewStartEndTime,
    GetReqdFields,
    UserJDList,
    GetChatLog,
    GetInterviewRecording,
    checkImgExists,
    GetFilteredUsers,
    GetAttendance,
    GetDriveAndSlot,
    GetAllUsers
} from "../Controllers/UserController.js"
import { Protect, Admin } from "../Middlewares/Auth.js"
const router = express.Router()

router.get("/signin", SSOAuthUser); // no change
router.get("/auth/callback", SSOAuthRedirect) // no change
router.get("/profile", Protect, Profile);  // Change in controller

router.post("/ssogetprofile", SSOGetProfile) // Change in controller
router.post("/login",  AuthUser);  // Change in controller
router.post("/logout", LogoutUser);  // no change



router.get("/getalljd", Protect, Admin, GetAllJD) // Admin route actually, so added Admin check
router.get("/:id", Protect, Admin, GetSingleUser) // Changed in controller
router.get("/getcoverletter/:id/:uuid", Protect, Admin, GetCoverletter) // Changed in controller and routes
router.get("/getimage/:id", Protect, Admin, GetImage)  // No change
router.get("/getreqdfields/:id/:uuid",  Protect, GetReqdFields) // Changed in controller and routes
router.get("/getjd/:id/:uuid", Protect, Admin, UserJDList) // Changed in controller and routes 
router.get("/getchatlog/:id/:uuid", Protect, GetChatLog) // Changed in controller and routes 
router.get("/getinterviewrecording/:id/:uuid", Protect, Admin, GetInterviewRecording) // Changed in controller and routes  
router.get("/check-img/:id", Protect, checkImgExists) // New

router.post("/multiregister", Protect, Admin, MultiRegister) // Changed in controller
router.post("/multi-jd-upload", Protect, Admin, MultiJDUpload); // No change
router.post("/interviewdrive/:id/:uuid", Protect, Admin, ChangeDriveName) // Changed in controller and routes
router.post("/interviewcompleted/:id/:uuid", Protect, ChangeInterviewCompleted) //Changed in controller and routes
router.post("/assigninterviewstarttime/:id/:uuid",Protect, Admin, AssignInterviewStartTime) // Changed in controller and routes
router.post("/assigninterviewendtime/:id/:uuid", Protect, Admin, AssignInterviewEndTime) // Changed in controller and routes
router.post("/assigninterviewdate/:id/:uuid", Protect, Admin, AssignInterviewDate) // Changed in controller and routes
router.post("/interviewstartendtime/:id/:uuid", Protect, ChangeInterviewStartEndTime) // Changed in controller and routes
router.post("/filtered-users", Protect, Admin, GetFilteredUsers) // Changed in controller
router.post("/attendance", Protect, Admin, GetAttendance) // Changed in controller
router.post("/get-drive-and-slot", Protect, Admin, GetDriveAndSlot) // New
router.post("/allusers", Protect, Admin, GetAllUsers) // Changed in controller


export default router