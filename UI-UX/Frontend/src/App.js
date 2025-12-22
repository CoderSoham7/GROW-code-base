import React, { useContext } from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import { AuthContext } from "./Screens/AuthContext.js"
import Footer from "./Components/Footer"
import Header from "./Components/Header"
import InterviewSessionScreen from "./Screens/InterviewSessionScreen.js"
import UserLoginScreen from "./Screens/UserLoginScreen"
import LeaderBoard from "./Screens/LeaderBoard"
import UserDetailsScreen from "./Screens/UserDetailsScreen"
import InterviewScreen from "./Screens/Interview/InterviewScreen"
import InterviewInstructionScreen from "./Screens/Interview/InterviewInstructionScreen"
import UploadAssociateScreen from "./Screens/UploadAssociateScreen"
import UploadJDScreen from "./Screens/UploadJDScreen"
import TBDScreen from "./Screens/TBDScreen"
import AssignDriveScreen from "./Screens/AssignDriveScreen"
import AssignInterviewSlotScreen from "./Screens/AssignInterviewSlotScreen"
import DownloadResults from "./Screens/DownloadResults"
import SSOLandingPage from "./Screens/SSOLandingPage"
import DisplayResultAnalysisPage from "./Screens/DisplayResultAnalysisPage.js"
import DisplayEvalSummaryPage from "./Screens/DisplayEvalSummaryPage.js"
import UploadImageScreen from "./Screens/UploadImageScreen.js"
import UploadCoverletterScreen from "./Screens/UploadCoverletterScreen.js"
import HomeScreen from "./Screens/HomeScreen.js"
import CodingSessionScreen from "./Screens/Coding/CodingSessionScreen.js"
import CodingInstructionScreen from "./Screens/Coding/CodingInstructionScreen.js"
import CodingScreen from "./Screens/Coding/CodingScreen.js"

const App = () => {
  const { userInfo } = useContext(AuthContext);

  return (
    <Router>
      <Header />
      <main className='minheight'>
        <Routes>
        <Route exact path='/' element={<HomeScreen />} />  
          <Route exact path='/login' element={<UserLoginScreen />} />  
          <Route exact path='/auth/callback' element={<SSOLandingPage />} />
          <Route exact path='/upload-image' element={<UploadImageScreen />} />
          
          <Route exact path='/nethack/tbd' element={<TBDScreen />} />
          <Route exact path='/csquiz/tbd' element={<TBDScreen />} />
          <Route exact path='/coding-sessions' element={<CodingSessionScreen />} />
          <Route exact path='/coding-sessions/:uuid/coding/instructions' element={<CodingInstructionScreen />} />
          <Route exact path='/coding-sessions/:uuid/coding/test' element={<CodingScreen />} />
          <Route exact path='/interview-sessions' element={<InterviewSessionScreen />} />
          <Route exact path='/interview-sessions/:uuid/interview/instructions/upload-coverletter' element={<UploadCoverletterScreen />} />
          <Route exact path='/interview-sessions/:uuid/interview/instructions' element={<InterviewInstructionScreen />} />
          <Route exact path='/interview-sessions/:uuid/interview/test' element={<InterviewScreen />} />

          <Route exact path='/upload-associates' element={<UploadAssociateScreen />} />
          <Route exact path='/upload-jd' element={<UploadJDScreen />} />
          <Route exact path='/download-results' element={<DownloadResults />} />
          <Route exact path='/assigndrive' element={<AssignDriveScreen />} />
          <Route exact path='/assign-interview-slot' element={<AssignInterviewSlotScreen />} />  
          <Route exact path='/leaderboard' element={<LeaderBoard />} />
          <Route exact path='/user/:id' element={<UserDetailsScreen />} />   
          {/*<Route exact path='/user/:id/results' element={<DisplayResultAnalysisPage />} />*/}
          {/*<Route exact path='/user/:id/download-eval-summary' element={<DisplayEvalSummaryPage />} />*/}
        </Routes>
      </main>
      <Footer />
    </Router>
  )
}

export default App