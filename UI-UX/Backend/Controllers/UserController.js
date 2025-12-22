import asyncHandler from "express-async-handler"
import { User } from "../Models/UserModel.js"
import { JDModel } from "../Models/JDModel.js"
import { EvalModel } from "../Models/EvalModel.js"
import GenerateToken from "../GenerateToken.js"
import { Storage } from '@google-cloud/storage';
import mongoose from "mongoose";
import moment from "moment";
import dotenv from "dotenv";
import * as msal from '@azure/msal-node';
import axios from "axios";
import https from 'https';

// CHANGE IN IMPORTS
import { Interview } from "../Models/InterviewModel.js"
import { v4 as uuidv5} from 'uuid';

import { GoogleAuth } from 'google-auth-library';
const auth = new GoogleAuth();


// START --> NO CHANGE
dotenv.config();

const REDIRECT_URI=process.env.REDIRECT_URI;

const NAMESPACE_DNS = uuidv5.DNS;

const msalConfig = {  
  auth: {  
    clientId: process.env.CLIENT_ID,  
    authority: process.env.SSO_AUTH,  
    clientSecret: process.env.CLIENT_SECRET,  
  },  
};   

const cca = new msal.ConfidentialClientApplication(msalConfig);  
const gcpstorage = new Storage();
const bucketName = process.env.GCP_BUCKET_NAME;


/**
 * Security utility functions for SAST compliance
 * These functions sanitize data to prevent XSS attacks
 */

/**
 * Sanitizes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text with HTML entities
 */
const sanitizeHtml = (text) => {
  if (typeof text !== 'string') {
    return text;
  }
  return text.replace(/[<>&'"]/g, function(c) {
    return {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&#39;',
      '"': '&quot;'
    }[c];
  });
};

/**
 * Recursively sanitizes all string values in a JSON object or array
 * Preserves the structure while making the content safe from XSS
 * 
 * @param {any} data - The data to sanitize (object, array, or primitive)
 * @returns {any} - The sanitized data with the same structure
 */
const sanitizeJsonRecursively = (data) => {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle primitives
  if (typeof data === 'string') {
    return sanitizeHtml(data);
  }
  if (typeof data !== 'object') {
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJsonRecursively(item));
  }
  
  // Handle objects
  const sanitizedObj = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      sanitizedObj[key] = sanitizeJsonRecursively(data[key]);
    }
  }
  return sanitizedObj;
};
const isValidFile = (anyfile) => {
  const nonTypeValues = ["NA", "Na", "none", "None", null, undefined, ""];
  return !(nonTypeValues.includes(anyfile) || (typeof anyfile === 'string' && anyfile.trim() === ''));
};

const SSOAuthUser = asyncHandler(async (req, res) => { 
  const authCodeUrlParameters = {  
    scopes: ['User.Read'],  
    redirectUri: REDIRECT_URI,  
  };  
  
  try {  
    const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);  
    res.redirect(authUrl);  
  } catch (error) {  
    res.status(500).send(error.message);  
  }  
});  
  
const SSOAuthRedirect = asyncHandler(async (req, res) => {  
  const tokenRequest = {  
    code: req.query.code,  
    scopes: ['User.Read'],  
    redirectUri: REDIRECT_URI,  
  };  
  
  try {  
    const response = await cca.acquireTokenByCode(tokenRequest);  
    const userInfo = await axios.get(process.env.GRAPH_URL, {  
      headers: {  
        Authorization: `Bearer ${response.accessToken}`,  
      },  
    });  
    res.status(200).json(userInfo.data.mail);    
  } catch (error) {  
    res.status(500).send(error.message);  
  }  
});  
 

// START --> CHANGE SSOGETPROFILE
const SSOGetProfile = asyncHandler(async (req, res) => {  
  const email_regex = /^[a-zA-Z0-9._-]+@(?:cognizant\.com|gmail\.com|outlook\.com)$/;  
  let email = req.body.email; 
  email = email.trim().toLowerCase();  
  
  if (!email_regex.test(email)) {  
    res.status(400).send({ message: 'Error Code B101: Invalid Email' });  
  } else {  
    // Using exact match instead of regex to prevent NoSQL injection
    const user = await User.findOne({ email: email });
      
    if (user) {  
      const token = GenerateToken(user._id, user.name);  
      res.cookie('token', token, {  
        httpOnly: true,  
        secure: process.env.NODE_ENV === 'PROD',  
        sameSite: 'strict',  
        maxAge: 24 * 60 * 60 * 1000
      });  

      if(!user.isAdmin){
        // Fetch all interviews for the candidate
        const interviews = await Interview.find(
          { uuid: { $in: user.interviews } },
          { uuid: 1, interview_drive: 1, interview_date: 1, 
            assigned_interview_start_time: 1, assigned_interview_end_time: 1,
            interview_completed: 1, interview_start_time: 1, interview_end_time: 1 }
        ).lean();

        // Structure interview data
        const interviewData = {};
        interviews.forEach(interview => {
          interviewData[interview.uuid] = {
            interview_drive: interview.interview_drive,
            interview_date: interview.interview_date,
            assigned_interview_start_time: interview.assigned_interview_start_time,
            assigned_interview_end_time: interview.assigned_interview_end_time,
            interview_completed: interview.interview_completed,
            interview_start_time: interview.interview_start_time,
            interview_end_time: interview.interview_end_time
          };
        });

        const isImg = isValidFile(user.image);

        res.status(200).json({  
          _id: user._id,  
          candidate_id: user.candidate_id,  
          name: user.name,  
          email: user.email,  
          isAdmin: user.isAdmin,  
          CSRF_token: user.CSRF_token,
          interviews: interviewData,
          isImg
        }); 
      }

      else
      {
        res.status(200).json({  
          _id: user._id,  
          candidate_id: user.candidate_id,  
          name: user.name,  
          email: user.email,  
          isAdmin: user.isAdmin,  
          CSRF_token: user.CSRF_token,
        });
      } 
    } else {  
      res.status(401).send({ message: "Error Code B101: Invalid Email or Password" });  
    }  
  }  
});
// END --> CHANGE SSOGETPROFILE


// START --> CHANGE AUTHUSER
const AuthUser = asyncHandler(async (req, res) => {      
  const password_regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_\s]{8,20}$/;    
  const email_regex = /^[a-zA-Z0-9._-]+@(?:cognizant\.com|gmail\.com|outlook\.com)$/;    
    
  let { email, password } = req.body;    
  email = email.trim().toLowerCase();    
    
  if (!email_regex.test(email)) {    
    res.status(400).send({message: 'Error Code B101: Invalid Email or Password'});    
  } else if (!password_regex.test(password)) {    
    res.status(400).send({message: 'Error Code B101: Invalid Email or Password'});    
  } else {     
    // Using exact match instead of regex to prevent NoSQL injection
    const user = await User.findOne({ email: email });  
    if (user && (await user.matchPassword(password))) {  
      const token = GenerateToken(user._id, user.name);  
      res.cookie('token', token, {  
        httpOnly: true,  
        secure: process.env.NODE_ENV === 'PROD',
        sameSite: 'strict',  
        maxAge: 24 * 60 * 60 * 1000
      });  

      if(!user.isAdmin){

        // Fetch all interviews for the user
        const interviews = await Interview.find(
          { uuid: { $in: user.interviews } },
          { uuid: 1, interview_drive: 1, interview_date: 1, 
            assigned_interview_start_time: 1, assigned_interview_end_time: 1,
            interview_completed: 1, interview_start_time: 1, interview_end_time: 1 }
        ).lean();

        // Structure interview data
        const interviewData = {};
        interviews.forEach(interview => {
          interviewData[interview.uuid] = {
            interview_drive: interview.interview_drive,
            interview_date: interview.interview_date,
            assigned_interview_start_time: interview.assigned_interview_start_time,
            assigned_interview_end_time: interview.assigned_interview_end_time,
            interview_completed: interview.interview_completed,
            interview_start_time: interview.interview_start_time,
            interview_end_time: interview.interview_end_time
          };
        });


        const isImg = isValidFile(user.image);

        res.status(200).json({      
          _id: user._id, 
          candidate_id: user.candidate_id,     
          name: user.name,      
          email: user.email,      
          isAdmin: user.isAdmin,      
          CSRF_token: user.CSRF_token,
          interviews: interviewData,
          isImg
        }); 
      }
      else
      {
        res.status(200).json({      
          _id: user._id, 
          candidate_id: user.candidate_id,     
          name: user.name,      
          email: user.email,      
          isAdmin: user.isAdmin,      
          CSRF_token: user.CSRF_token
        }); 
      }     
    } else {      
      res.status(401).send({message: "Error Code B101: Invalid Email or Password"});      
    }     
  }     
});
// END --> CHANGE AUTHUSER


const LogoutUser = asyncHandler(async (req, res) => {  
  res.cookie('token', '', {  
    httpOnly: true,  
    secure: process.env.NODE_ENV === 'PROD',  
    expires: new Date(0),  
    sameSite: 'strict',  
  });  
  res.status(200).send({ message: 'Successfully logged out' }); 
});  

// START --> CHANGE PROFILE
const Profile = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.user._id)) {  
    return res.status(400).send('Invalid User Id');  
  }
  const user = await User.findById(req.user._id);  
  if (user) {  
    if(!user.isAdmin){
      // Fetch all interviews for the user
      const interviews = await Interview.find(
        { uuid: { $in: user.interviews } },
        { uuid: 1, interview_drive: 1, interview_date: 1, 
          assigned_interview_start_time: 1, assigned_interview_end_time: 1,
          interview_completed: 1, interview_start_time: 1, interview_end_time: 1 }
      ).lean();

      // Structure interview data
      const interviewData = {};
      interviews.forEach(interview => {
        interviewData[interview.uuid] = {
          interview_drive: interview.interview_drive,
          interview_date: interview.interview_date,
          assigned_interview_start_time: interview.assigned_interview_start_time,
          assigned_interview_end_time: interview.assigned_interview_end_time,
          interview_completed: interview.interview_completed,
          interview_start_time: interview.interview_start_time,
          interview_end_time: interview.interview_end_time
        };
      });

      const isImg = isValidFile(user.image);

      res.status(200).json({      
        _id: user._id, 
        candidate_id: user.candidate_id,     
        name: user.name,      
        email: user.email,      
        isAdmin: user.isAdmin,      
        CSRF_token: user.CSRF_token,
        interviews: interviewData,
        isImg
      }); 
    }
    else
    {
      res.status(200).json({      
        _id: user._id, 
        candidate_id: user.candidate_id,     
        name: user.name,      
        email: user.email,      
        isAdmin: user.isAdmin,      
        CSRF_token: user.CSRF_token
      }); 
    }      
  } else {  
    res.status(404).json({ message: 'User not found' });  
  }  
});  

// END --> CHANGE PROFILE

// START MULTREGISTER
// START --> NO CHANGE
const normalizeString = str => str.replace(/[\.,\s]/g, '').toLowerCase();
const findClosestMatch = (input, list, normalizedList) => {
  const normalizedInput = normalizeString(input);
  const matchingIndex = normalizedList.findIndex(name => name === normalizedInput);
  if (matchingIndex !== -1) {
    return list[matchingIndex];
  } else {
    return "No skill assigned";
  }
};

const getUBaseValue = (interview_drive) => {  
  const nobase_drives = ["QlikView Jr.Developer (PL1)",
                          "QlikView Developer (PL2)",
                          "QlikView Sr. Developer (PL3)",
                          "MSBI Developer (PL2)",
                          "MSBI Jr.Developer (PL1)",
                          "MSBI Sr. Developer (PL3)",
                          "MSBI Testing (PL2)",
                          "Reltio Developer (PL2)", 
                          "Reltio Sr. Developer (PL3)", 
                          "Informatica MDM Developer (PL2)", 
                          "Jr Reltio Dev (PL1)", 
                          "Informatica MDM Junior Dev (PL1)", 
                          "Informatica MDM Senior Developer (PL3)",
                          "Informatica Powercenter Junior Dev(PL1)",
                          "Informatica Powercenter Developer (PL2)",
                          "Informatica Powercenter Senior Developer (PL3)",
                          "Jr Informatica DG(Axon/EDC/CDGC)Developer (PL1)",
                          "Informatica DG(Axon/EDC/CDGC)Developer(PL2)",
                          "Sr Informatica DG(Axon/EDC/CDGC)Developer(PL3)",
                          "CDIT Jr Power BI Developer (PL1)",
                          "Abinitio Jr Developer (PL1)",
                          "Abinitio Developer (PL2)",
                          "Abinitio Sr. Developer (PL3)",
                          "Jr IDQ Developer (PL1)",
                          "IDQ Developer(PL2)",
                          "Sr IDQ Developer(PL3)"
                          ];  

  const secbase_drives = ["Skill Cluster 1 (Java, SQL/ANSI SQL, HTML, CSS, Javascript)", 
                          "Databricks Senior Data Engineer (PL2)", 
                          "Databricks Data Architect (PL3)", 
                          "Databricks Junior Data Engineer (PL1)", 
                          "Jr. Pyspark Data Engineer (PL1)", 
                          "Pyspark Data Engineer (PL2)", 
                          "Sr. Pyspark Data Engineer (PL3)",
                          "AWS Data Engineer  (PL1)",
                          "AWS Data Engineer (PL2)",
                          "AWS Data Engineer (PL3)"
                          ];  

  const non_tech_drives = ["Store Clerk (PL1)", 
                          "Front End Lead (PL2)", 
                          "Store Leader (PL3)",
                          "Relationship Manager - Direct Sales (PL2)",
                          "Business Development Manager - APAC (PL2)",
                          "Relationship Manager - Agents Sales (PL2)",
                          "Agent Sales (PL2)",
                          "BDM APAC Sales (PL3)",
                          "Brand Ambassador (PL1)",
                          "Direct Sales (PL3)"
                          ];

    const normalizedInterviewDrive = normalizeString(interview_drive);
  
    for (let drive of nobase_drives) {
      if (normalizeString(drive) === normalizedInterviewDrive) {
        return "ClaudeNoBase";
      }
    }
  
    for (let drive of secbase_drives) {
      if (normalizeString(drive) === normalizedInterviewDrive) {
        return "ClaudeSecBase";
      }
    }
  
    for (let drive of non_tech_drives) {
      if (normalizeString(drive) === normalizedInterviewDrive) {
        return "ClaudeNonTechBase";
      }
    }

    return "ClaudeExpBase";
  }

const MAX_RECORDS = 500; 

// END --> NO CHANGE
// START --> CHANGE MULTIREGISTER
const generateInterviewUUID = (interview_date, interview_time, interview_drive, candidate_id) => {
    const combinedString = `${interview_date}_${interview_time}_${interview_drive}_${candidate_id}`;
    const generatedUUID = uuidv5(combinedString, NAMESPACE_DNS);
    return generatedUUID;
};

function validateAndParseDate(dateStr, date_regex) {
  // Check if date matches DD-MM-YYYY format
  if (!date_regex.test(dateStr)) {
    // Try to convert from other formats
    const parsedDate = moment(dateStr, [
      'MM/DD/YYYY', 
      'YYYY-MM-DD', 
      'DD-MM-YYYY'
    ], true);

    if (!parsedDate.isValid()) {
      throw new Error(`Invalid date format: \${dateStr}`);
    }

    // Convert to DD-MM-YYYY
    return parsedDate.format('DD-MM-YYYY');
  }
  return dateStr;
}

const MultiRegister = asyncHandler(async (req, res) => {  
  if (!mongoose.Types.ObjectId.isValid(String(req.body.admin_id).trim())) {  
      return res.status(400).send('Invalid User Id');  
  }  

  const name_regex = /^[a-zA-Z .-]{2,}$/;  
  const candidate_id_regex = /^[1-9]\d*$/;  
  const email_regex = /^[a-zA-Z0-9._-]+@(?:cognizant\.com|gmail\.com|outlook\.com)$/;   
  const date_regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-((19|20)\d\d)$/;  
  const time_regex = /^(1[0-2]|[1-9]):(00|30) (AM|PM)$/;  
  const assessment_category_regex = /^(practice|actual|testing)$/;  
  const assessment_pipeline_regex = /^(grow|skill 2 deploy|project release|cis|cdit|genc|ascend_l0)$/;   

  const admin_id = String(req.body.admin_id).trim();  
  const excelData = req.body.excelData;  

  if (excelData.length > MAX_RECORDS) {  
      res.status(400).send({ message: 'Record limit exceeded' });  
      return;  
  }  

  const headers = Object.keys(excelData[0]);  
  if (headers[0] !== 'candidate_id' || headers[1] !== 'name' || headers[2] !== 'email' || headers[3] !== 'interview_drive' || headers[4] !== 'interview_date' || headers[5] !== 'interview_start_time' || headers[6] !== 'interview_end_time' || headers[7] !== 'assessment_category' || headers[8] !== 'assessment_pipeline') {  
      res.status(400).send({ message: 'Invalid headers' });  
      return;  
  }  

  for (let i = 0; i < excelData.length; i++) {  
      let { candidate_id, name, email, interview_date, interview_start_time, interview_end_time, assessment_category, assessment_pipeline } = excelData[i];  

      try {
        // Validate and standardize date
        const trimmedDate = String(interview_date).trim();
        interview_date = validateAndParseDate(trimmedDate, date_regex); 
        excelData[i].interview_date = interview_date;
      } catch (error) {
        res.status(400).send({ 
          message: `Date validation error at record ${i + 1}: ${error.message}` 
        });
        return;
      }

      email = String(email).trim().toLowerCase();  
      name = name.replace(/[\s\u00A0]+/g, ' ');  
      candidate_id = parseInt(candidate_id, 10);

      if (!candidate_id_regex.test(candidate_id)) {  
        res.status(400).send({ message: 'Error Code B104A' + (i + 1) });  
        return;  
      } else if (!name_regex.test(name)) {  
        res.status(400).send({ message: 'Error Code B104B' + (i + 1) });  
        return;  
      } else if (!email_regex.test(email)) {  
        res.status(400).send({ message: 'Error Code B104C' + (i + 1) });  
        return;  
      } else if (!time_regex.test(interview_start_time)) {  
        res.status(400).send({ message: 'Error Code B104E' + (i + 1) });  
        return;  
      } else if (!time_regex.test(interview_end_time)) {  
        res.status(400).send({ message: 'Error Code B104F' + (i + 1) });  
        return;  
      } else if (!assessment_category_regex.test(assessment_category.toLowerCase())) {  
        res.status(400).send({ message: 'Error Code B104G' + (i + 1) });  
        return;  
      } else if(!assessment_pipeline_regex.test(assessment_pipeline.toLowerCase())){
        res.status(400).send({message: 'Error Code B104H' + (i+1)});
        return;
      }
  }  

  const jds = await JDModel.find({}, 'name');  
  const filteredJds = jds.filter(jd => !/base|result/i.test(jd.name.toLowerCase()));  
  const jdNames = [...new Set(filteredJds.map(jd => jd.name))];  
  const normalizedJdNames = jdNames.map(normalizeString);  

  const registrationPromises = excelData.map(async (userData) => {
    const normalizedEmail = String(userData.email).trim().toLowerCase();
    const nameInitials = userData.name.slice(0, 4);
    const password = `${nameInitials.replace(/\s/g, '_')}@${userData.candidate_id}`;
    const interview_drive_trimmed = userData.interview_drive.trim();
    const closestJDName = findClosestMatch(interview_drive_trimmed, jdNames, normalizedJdNames);
    let interview_drive_version = 'v0';
    
    if (typeof closestJDName !== 'string') {
        throw new Error('Error Code B105');
    }

    if (closestJDName !== "No skill assigned") {
        const matchingJDs = await JDModel.find({ name: closestJDName }).sort({ createdAt: -1 });
        const mostRecentJD = matchingJDs[0];
        interview_drive_version = mostRecentJD ? mostRecentJD.skill_level_version : 'v0';
    }

    const ubase = getUBaseValue(interview_drive_trimmed);
    const formatted_interview_date = moment(userData.interview_date, 'DD-MM-YYYY').format('DD - MM - YYYY');

    // Check if user already exists with the candidate_id
    let user = await User.findOne({ candidate_id: userData.candidate_id });

    if (user) {
        // If user exists, update the email if it's different
        if (user.email !== normalizedEmail) {
            user.email = normalizedEmail;
            await user.save();
            console.log(`Updated email for candidate_id ${userData.candidate_id} to ${normalizedEmail}`);
        }
    } else {
        // Create new user if doesn't exist
        user = await User.create({
            name: userData.name,
            candidate_id: userData.candidate_id,
            email: normalizedEmail,
            password: password,
            image: '',
            CSRF_token: null,
            isAdmin: false,
            interviews: []
        });
    }

    // Check for existing interview with same details
    const existingInterview = await Interview.findOne({
      user_id: user._id,
      interview_date: formatted_interview_date,
      interview_drive: closestJDName,  // Add this field
      assigned_interview_start_time: userData.interview_start_time,
      assigned_interview_end_time: userData.interview_end_time,
      assessment_category: userData.assessment_category,
      assessment_pipeline: userData.assessment_pipeline
    });

    if (existingInterview) {
        // Skip creation if the interview already exists for this user
        return null;
    }

    // Generate interview UUID
    const interviewUUID = generateInterviewUUID(userData.interview_date, userData.interview_start_time, interview_drive_trimmed, userData.candidate_id);

     // Add the new interview UUID to the user's interviews array
     if (!user.interviews) {
      user.interviews = [];
  }
  user.interviews.push(interviewUUID);
  await user.save();
  
  const interviewDoc = {
      uuid: interviewUUID,
      user_id: user._id,
      interview_drive: closestJDName,
      interview_drive_version: interview_drive_version,
      interview_date: formatted_interview_date,
      assigned_interview_start_time: userData.interview_start_time,
      assigned_interview_end_time: userData.interview_end_time,
      assessment_category: userData.assessment_category,
      assessment_pipeline: userData.assessment_pipeline,
      interview_completed: false,
      interview_start_time: "00:00:00 AM",
      interview_end_time: "00:00:00 AM",
      ubase: ubase,
      created_by: admin_id,
      updated_by: admin_id,
      candidate_id: userData.candidate_id,
      coverletter: '',
      covertext: '',
      interview_result: "Interview result unavailable",
      interview_label: "NA",
      chatlog: [],
      chatlog_timestamps: [],
      messages: [],
      interviewrecording: 'NA'
  };

  // Create new interview document
  const newInterview = new Interview(interviewDoc);
  await newInterview.save();

  return user;
});

try {
  const updatedUsers = await Promise.all(registrationPromises);
  const newInterviewsCreated = updatedUsers.filter(user => user !== null).length;
  if (newInterviewsCreated > 0) {
      res.status(201).json({ message: `Successfully created ${newInterviewsCreated} new interviews` });
  } else {
      res.status(201).json({ message: "No new interviews created, as all records already exist" });
  }
} catch (error) {
  console.error(error);
  res.status(400).send({ message: `Error code B108: ${error.message}` });
} 
});


// END --> CHANGE MULTIREGISTER

// NO CHANGE --> MULTIJDUPLOAD
const findClosestMatchJDUpload = (input, list, normalizedList) => {
  const normalizedInput = normalizeString(input);
  const matchingIndex = normalizedList.findIndex(name => name === normalizedInput);
  if (matchingIndex !== -1) {
    return list[matchingIndex];
  } else {
    return input;
  }
};

const MultiJDUpload = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(String(req.body.admin_id).trim())) {    
    return res.status(400).send('Invalid User Id');    
  } 
  try {  
    const admin_id = String(req.body.admin_id).trim(); 
    const excelData = req.body.excelData;    
    const headers = Object.keys(excelData[0]);
    if (headers[0] !== 'skill_level' || headers[1] !== 'difficulty' || headers[2] !== 'skill_list' || headers[3] !== 'responsibilities' || headers[4] !== 'interview_style' || headers[5] !== 'industry_benchmark') {
        res.status(400).send({message: 'Invalid headers'});
        return;
    }
      
    const jds = await JDModel.find({}, 'name');    
    const filteredJds = jds.filter(jd => !/base|result|dummy/i.test(jd.name.toLowerCase()));
    const jdNames = [...new Set(filteredJds.map(jd => jd.name))];    
    const normalizedJdNames = jdNames.map(normalizeString);    
      
    const jdList = excelData.map((jd) => {    
      const updatedSections = jd.responsibilities.replace(/`/g, '');    
      
      return {    
        ...jd,    
        name: jd.skill_level,    
        skills: jd.skill_list,    
        sections: updatedSections,    
        question_pattern: jd.interview_style + ' ' + jd.industry_benchmark,
        created_by: admin_id, 
        updated_by: admin_id       
      };    
    }).map(({ skill_level, skill_list, responsibilities, interview_style, industry_benchmark, ...rest }) => rest);    
      
    const updatedJDList = await Promise.all(jdList.map(async (jd) => {      
      const closestJDName = findClosestMatchJDUpload(jd.name, jdNames, normalizedJdNames);      
      const existingJDs = await JDModel.find({ name: closestJDName }).sort({ skill_level_version: -1 });
      let occurrence = 0;  
        
      if (existingJDs.length > 0) {  
        const highestVersion = existingJDs[0].skill_level_version;  
        occurrence = parseInt(highestVersion.substring(1)) || 0;  
      }  
        
      const skill_level_version = `v${occurrence + 1}`;
    
      return {      
        ...jd,      
        name: closestJDName,      
        skill_level_version,    
        updated_by: admin_id     
      };      
    }));       
      
    const createdJDs = await Promise.all(updatedJDList.map((jd) => JDModel.create(jd)));       
      
    if (createdJDs) {    
      res.status(201).json('JD created');    
    } else {    
      res.status(400);    
      throw new Error("Error Code B107");    
    }    
  } catch (error) {    
    console.error(error);  
    res.status(500).json({message: "Server Error", error: error.message});  
  }    
});  

// NO CHANGE --> GETALLJD

const GetAllJD = asyncHandler(async(req, res) => {  
  try { 
    // Define the JD names to exclude - AIA AIML PERSONA JDS ARE NOT MEANT FOR GROW; THEY ARE INTERNAL EXP
    const excludeJDNames = [
      'Senior AI Engineer (PL3)',
      'IT Innovation Lead (PL4)',
      'AIML Technical Lead & Solutions Architect (PL4)',
      'Senior Agentic AI Solutions Architect (PL4)',
      'Head of AI Innovation & Emerging Technologies (PL5)',
      'Senior Business Analyst (PL3)',
      'Associate Data Scientist (PL2)',
      'Senior Cloud Enterprise Architect (PL4)',
      'Junior Programmer Analyst (PL1)',
      'Junior Full Stack Developer (PL1)',
      'Senior Enterprise Solution Architect (PL4)',
      'Full Stack Web Developer (PL2)',
      'Programmer Analyst - AIML (PL2)',
      'Senior Motion Graphic Designer (PL3)',
      'Development Lead (PL3)',
      'Senior UIUX Designer (PL4)',
      'Programmer Analyst (PL2)',
      'Senior Scrum Master - Lead Agilist (PL3)'
    ];

    // Convert exclude names to lowercase for case-insensitive comparison
    const excludeJDNamesLower = excludeJDNames.map(name => name.toLowerCase());
    
    const jds = await JDModel.find({}, 'name skill_level_version createdAt');
    
    // Filter out JDs with names containing "base", "result", or "dummy" AND the specific JD names to exclude
    const filteredJds = jds.filter(jd => {
      const nameLower = jd.name.toLowerCase();
      return !/base|result|dummy/i.test(nameLower) && 
             !excludeJDNamesLower.includes(nameLower);
    });

    const groupedJds = filteredJds.reduce((acc, current) => {
      acc[current.name] = acc[current.name] || [];
      acc[current.name].push(current);
      return acc;
    }, {});
    
    const latestJds = Object.values(groupedJds).map(jdsByName => {
      jdsByName.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return jdsByName[0];
    });
    
    res.json(latestJds); 
  } catch (error) {  
    res.status(500).json({ message: 'Server Error' }); 
  }
})  


// START --> CHANGE GETSINGLEUSER
function modifyCovtext(covtext) {  
  if (covtext) {  
    covtext = covtext.replace(/\n/g, ' ').replace(/\t/g, ' ');
    covtext = covtext.replace(/\\u[\dA-F]{4}/gi, match => {  
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));  
    });
    covtext = covtext.replace(/\s+/g, ' ').trim(); 
  }  
  return covtext;  
}  

const GetSingleUser = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
// Add time conversion function
function convertTimeStringToDate(timeStr) {
if (timeStr === "00:00:00 AM") return null;


const [time, period] = timeStr.split(' ');
const [hours, minutes, seconds] = time.split(':');

const date = new Date();
let hour = parseInt(hours);

if (period === 'PM' && hour !== 12) {
    hour += 12;
}
if (period === 'AM' && hour === 12) {
    hour = 0;
}

date.setHours(hour, parseInt(minutes), parseInt(seconds));
return date;

}


try {
if (req.user.isAdmin) {
// Fetch user data
const user = await User.findOne(
{ candidate_id: userId, isAdmin: false },
{ candidate_id: 1, name: 1, email: 1, image: 1, interviews: 1 }
);


  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Fetch all interviews for the user
  const interviews = await Interview.find(
    { uuid: { $in: user.interviews } },
    { covertext: 1, uuid: 1, interview_drive: 1, interview_drive_version: 1, 
      interview_date: 1, assigned_interview_start_time: 1, assigned_interview_end_time: 1,
      assessment_category: 1, assessment_pipeline: 1, interview_completed: 1,
      interview_start_time: 1, interview_end_time: 1, ubase: 1, coverletter: 1,
      interview_result: 1, interview_label: 1, chatlog: 1, chatlog_timestamps: 1,
      messages: 1, interviewrecording: 1 }
  ).lean();

  const isImg = isValidFile(user.image);

  const interviewData = {};
  const currentTime = new Date();

  // Process each interview
  for (const interview of interviews) {
    const {
      uuid,
      interview_drive,
      interview_drive_version,
      interview_date,
      assigned_interview_start_time,
      assigned_interview_end_time,
      assessment_category,
      assessment_pipeline,
      interview_completed,
      interview_start_time,
      interview_end_time,
      ubase,
      covertext: dbCovertext,
      coverletter,
      interview_result,
      interview_label,
      chatlog,
      chatlog_timestamps,
      messages,
      interviewrecording
    } = interview;

    // Determine interview status
    const interviewStartTime = convertTimeStringToDate(interview_start_time);
    const interviewEndTime = convertTimeStringToDate(interview_end_time);
    
    let interview_status;
    
    if (interview_completed) {
      interview_status = "COMPLETED";
    } else if (interview_start_time !== "00:00:00 AM" && !interview_completed) {
      interview_status = "INCOMPLETE";
    } else if (interview_start_time === "00:00:00 AM" && interview_end_time === "00:00:00 AM") {
      if (interviewEndTime && currentTime <= interviewEndTime) {
        interview_status = "SCHEDULED";
      } else {
        interview_status = "NOT ATTENDED";
      }
    } else {
      interview_status = "UNKNOWN";
    }

    const nonTypeValues = ["NA", "Na", "none", "None", null, undefined];

    const processedInterviewLabel = nonTypeValues.includes(interview_label) 
      ? 'SME Evaluation Pending' 
      : interview_label;

    const processedCovertext = (() => {
      if (dbCovertext === undefined || dbCovertext === null) {
        return 'Candidate did not start interview; Coverletter content is not displayed.';
      }
    
      const trimmedCovertext = dbCovertext.trim();
    
      if (trimmedCovertext === '' || nonTypeValues.includes(trimmedCovertext.toLowerCase())) {
        return 'Cover Letter PDF Invalid/Corrupted. Continue with the Interview.';
      }
    
      return modifyCovtext(trimmedCovertext);
    })();
    
    // Process chatlog_timestamps
    let processedChatlogTimestamps = [];
    if (chatlog_timestamps && chatlog_timestamps.length > 0) {
      chatlog_timestamps.forEach((entry) => {
        const message = Object.values(entry).join('');
        const colonIndex = message.indexOf(':');
        if (colonIndex !== -1) {
          const speaker = message.substring(0, colonIndex).trim();
          const text = message.substring(colonIndex + 1).trim();
          processedChatlogTimestamps.push({ [speaker]: text });
        }
      });
    }

    const isCoverletter = isValidFile(coverletter);

    // Structure interview data (now including interview_status)
    interviewData[uuid] = {
      interview_drive,
      interview_drive_version,
      interview_date,
      assigned_interview_start_time,
      assigned_interview_end_time,
      assessment_category,
      assessment_pipeline,
      interview_completed,
      interview_start_time,
      interview_end_time,
      ubase,
      covertext: processedCovertext,
      interview_result,
      interview_label: processedInterviewLabel,
      interview_status, // Added this field
      chatlog,
      chatlog_timestamps: processedChatlogTimestamps,
      messages,
      interviewrecording,
      isCoverletter
    };
  }

  // Prepare the response
  const response = {
    candidate_id: user.candidate_id,
    name: user.name,
    email: user.email,
    isImg: isImg,
    interviews: interviewData
  };

  res.status(200).json(response);
} else {
  return res.status(401).json({ message: "Error Code B110" });
}

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Server Error' });
}
});

// END --> CHANGE GETSINGLEUSER

// START --> CHANGE GETCOVERLETTER

const GetCoverletter = asyncHandler(async (req, res) => {
  // Parse and validate userId
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  // Validate UUID format (basic check for non-empty string)
  const uuid = req.params.uuid;
  if (!uuid || typeof uuid !== 'string' || uuid.trim() === '') {
    return res.status(400).json({ message: 'Invalid UUID format' });
  }
  try {
    if (req.user.isAdmin) {
      // Fetch the user
      const user = await User.findOne({candidate_id : userId});

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Fetch the specific interview data for the given UUID
      const interview = await Interview.findOne({ uuid: uuid.trim(), candidate_id: userId }, {coverletter: 1});

      if (!interview) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      if (!interview.coverletter) {
        return res.status(404).json({ message: 'Coverletter not found for this interview' });
      }

      const bucket = gcpstorage.bucket(bucketName);
      let file = bucket.file(`coverletter/${interview.coverletter}`);

      file.exists()
        .then(data => {
          const exists = data[0];
          if (!exists) {
            return res.status(404).json({ message: "Error Code B111" });
          } else {
            res.setHeader('Content-Disposition', 'attachment');
            file.createReadStream().pipe(res);
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ message: 'Server Error' });
        });

    } else {
      return res.status(401).json({ message: "Error Code B110" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE GETCOVERLETTER

// NO CHANGE --> GETIMAGE

const GetImage = asyncHandler(async (req, res) => {  
  const userId = parseInt(req.params.id, 10);  
  
  try {  
    if (req.user.isAdmin) {  
      const user = await User.findOne({candidate_id : userId});  
  
      if (!user) {  
        return res.status(404).json({ message: 'User not found' });  
      }  
  
      const bucket = gcpstorage.bucket(bucketName);  
      let file = bucket.file(`images/${user.image}`);  
  
      file.exists()  
        .then(data => {  
          const exists = data[0];  
          if (!exists) {  
            return res.status(404).json({ message: "Image File not found" });  
          } else {  
            res.setHeader('Content-Disposition', 'attachment');  
            file.createReadStream().pipe(res);  
          }  
        })  
        .catch(error => {  
          console.error(error);  
          res.status(500).json({ message: 'Server Error' });  
        });  
  
    } else {  
      return res.status(401).json({ message: "Error Code B110" });  
    }  
  } catch (error) {  
    console.error(error);  
    res.status(500).json({ message: 'Server Error' });  
  }  
});  


// START --> CHANGE CHANGEDRIVENAME

const ChangeDriveName = asyncHandler(async (req, res) => {
  // Parse and validate userId
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  // Validate UUID format
  const uuid = req.params.uuid;
  if (!uuid || typeof uuid !== 'string' || uuid.trim() === '') {
    return res.status(400).json({ message: 'Invalid UUID format' });
  }

  // Validate interview_drive
  const { interview_drive } = req.body;
  if (!interview_drive || typeof interview_drive !== 'string') {
    return res.status(400).json({ message: 'Invalid interview drive format' });
  }    
  try {
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: "Error Code B110" });
    }

    const user = await User.findOne({candidate_id: userId});
    
    if (!user) {
      return res.status(404).json({ message: 'Error Code B112' });
    }

    const interview = await Interview.findOne({ candidate_id: userId, uuid: uuid.trim() }, {interview_drive:1, interview_drive_version: 1, ubase: 1});

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const interview_drive_trimmed = interview_drive.trim();
    
    // Find the latest version of the interview drive
    const matchingJDs = await JDModel.find({ name: interview_drive_trimmed }).sort({ skill_level_version: -1 });

    let interview_drive_version = 'v0';
    if (matchingJDs.length > 0) {
      const versions = matchingJDs.map(jd => jd.skill_level_version)
        .filter(version => version)
        .sort((a, b) => {
          const aNum = parseInt(a.replace(/\D/g, ''));
          const bNum = parseInt(b.replace(/\D/g, ''));
          
          if (isNaN(aNum) && isNaN(bNum)) return a.localeCompare(b); 
          if (isNaN(aNum)) return 1;
          if (isNaN(bNum)) return -1;
          return bNum - aNum;
        });
      interview_drive_version = versions[0] || 'v0';
   }

    // Update the interview document
    interview.interview_drive = interview_drive_trimmed;
    interview.interview_drive_version = interview_drive_version;
    const ubase = getUBaseValue(interview_drive_trimmed);
    interview.ubase = ubase;

    const updatedInterview = await interview.save();
    
    res.json({
      interview_drive: updatedInterview.interview_drive
    });

    

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE CHANGEDRIVENAME


// START --> CHANGE INTERVIEWCOMPLETED
const ChangeInterviewCompleted = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send('Error Code B107');
  }
  const userId = req.params.id;
  const uuid = req.params.uuid;
  const { interview_completed, CSRF_token } = req.body;

  try {
    const user = await User.findOne({_id: userId}, {CSRF_token: 1, candidate_id: 1});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const interview = await Interview.findOne({ uuid: uuid, user_id: userId });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview_completed === true) {
      interview.interview_completed = true;
      await interview.save();
      
      user.CSRF_token = CSRF_token;
      const options = { validateBeforeSave: false };
      const updatedUser = await user.save(options);

      return res.json({ 
        interview_completed: true,
        CSRF_token: updatedUser.CSRF_token 
      });
    } 
    else {
      // Prepare the request data
      const postData = {
        candidate_id: user.candidate_id,
        uuid: uuid
      };
      // Get an authenticated client for the completion check service
      const targetUrl = `https://${process.env.CHECK_INTERVIEW_COMPLETION_FUNC_URL}`
      const client = await auth.getIdTokenClient(targetUrl);

      // Make the authenticated request
      const apiResponse = await client.request({
        url: `${targetUrl}`,
        method: 'POST',
        data: postData,
        headers: { 'Content-Type': 'application/json' },
      });

      // The response data is already parsed JSON
      const parsedData = JSON.parse(apiResponse.data);
      // SECURITY: Sanitize JSON data recursively to preserve structure
      // This ensures we meet SAST requirements without breaking functionality
      const sanitizedParsedData = sanitizeJsonRecursively(parsedData);
      
      // Update the user's CSRF token
      user.CSRF_token = CSRF_token;
      const options = { validateBeforeSave: false };
      const updatedUser = await user.save(options);

      // Send the combined response to the client
      res.json({ 
        interview_completed: sanitizedParsedData.interview_completed,
        CSRF_token: updatedUser.CSRF_token 
      });
    }
  } catch (error) {
    // Differentiate between API errors and other internal errors
    if (error.response) {
      console.error("Error calling completion check function:", error.response?.data || error.message);
      res.status(502).json({ message: "Failed to communicate with the completion check service." });
    } else {
      console.error("Server Error:", error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
});
// END --> CHANGE INTERVIEWCOMPLETED


// START --> CHANGE ASSIGNINTERVIEWSTARTTIME

const AssignInterviewStartTime = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const uuid = req.params.uuid;

  const { assigned_interview_start_time } = req.body;

  try {
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized as an admin" });
    }

    const user = await User.findOne({ candidate_id: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const interview = await Interview.findOne({ uuid: uuid, candidate_id: userId });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.assigned_interview_start_time = assigned_interview_start_time;

    const updatedInterview = await interview.save();

    res.json({
      assigned_interview_start_time: updatedInterview.assigned_interview_start_time
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE ASSIGNINTERVIEWSTARTTIME

// START --> CHANGE ASSIGNINTERVIEWENDTIME

const AssignInterviewEndTime = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const uuid = req.params.uuid;

  const { assigned_interview_end_time } = req.body;

  try {
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized as an admin" });
    }

    const user = await User.findOne({ candidate_id: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const interview = await Interview.findOne({ uuid: uuid, candidate_id: userId });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.assigned_interview_end_time = assigned_interview_end_time;

    const updatedInterview = await interview.save();

    res.json({
      assigned_interview_end_time: updatedInterview.assigned_interview_end_time
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE ASSIGNINTERVIEWENDTIME

// START --> CHANGE ASSIGNINTERVIEWDATE

const AssignInterviewDate = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const uuid = req.params.uuid;

  const { interview_date } = req.body;

  try {
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: "Error Code B110" });
    }

    const user = await User.findOne({ candidate_id: userId });

    if (!user) {
      return res.status(404).json({ message: 'Error Code B112' });
    }

    const interview = await Interview.findOne({ uuid: uuid, candidate_id: userId });

    if (!interview) {
      return res.status(404).json({ message: 'Error Code B113' }); // Assuming B113 for Interview not found
    }

    interview.interview_date = interview_date;

    const updatedInterview = await interview.save();

    res.json({ interview_date: updatedInterview.interview_date });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE ASSIGNINTERVIEWDATE

// START --> CHANGE CHANGEINTERVIEWSTARTENDTIME

const ChangeInterviewStartEndTime = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send('Error Code B107: Invalid User Id');
  }
  
  const userId = req.params.id;
  const uuid = req.params.uuid;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Error Code B112' });
    }

    const interview = await Interview.findOne({ uuid: uuid, user_id: userId });

    if (!interview) {
      return res.status(404).json({ message: 'Error Code B113: Interview not found' });
    }

    let isUpdated = false;

    if (interview.interview_start_time === '00:00:00 AM' && req.body.interview_start_time !== '00:00:00 AM') {
      interview.interview_start_time = req.body.interview_start_time;
      isUpdated = true;
    }
      
    if (interview.interview_end_time === '00:00:00 AM' && req.body.interview_end_time !== '00:00:00 AM') {
      interview.interview_end_time = req.body.interview_end_time;
      isUpdated = true;
    }

    if (isUpdated) {
      await interview.save();
    }

    // Always return 200 status code with current values
    return res.status(200).json({
      interview_start_time: interview.interview_start_time,
      interview_end_time: interview.interview_end_time,
      isUpdated: isUpdated
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE CHANGEINTERVIEWSTARTENDTIME


const checkImgExists = asyncHandler(async (req, res) => {
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send('Error Code B107');
  }

  const userId = req.params.id;

  try {
    const user = await User.findById(userId, {
      _id: 0,
      image: 1
    });

    if (!user) {
      return res.status(404).json({ message: 'Error Code B112' });
    }

    const isImg = isValidFile(user.image)
    res.status(200).json({isImg});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// START --> CHANGE GETREQDFIELDS

const GetReqdFields = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send('Error Code B107');
  }

  const userId = req.params.id;
  const uuid = req.params.uuid;

  try {
    const user = await User.findById(userId, {
      _id: 0,
      image: 1
    });

    if (!user) {
      return res.status(404).json({ message: 'Error Code B112' });
    }

    const isImg = isValidFile(user.image)

    const interview = await Interview.findOne(
      { user_id: userId, uuid: uuid },
      {
        _id: 0,
        interview_drive: 1,
        assigned_interview_start_time: 1,
        assigned_interview_end_time: 1,
        interview_completed: 1,
        interview_date: 1,
        coverletter: 1,
        interview_start_time: 1,
        interview_end_time: 1
      }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Error Code B113: Interview not found' });
    }

    const isCoverletter = isValidFile(interview.coverletter);

    const responseData = {
      interview_drive: interview.interview_drive,
      assigned_interview_start_time: interview.assigned_interview_start_time,
      assigned_interview_end_time: interview.assigned_interview_end_time,
      interview_completed: interview.interview_completed,
      interview_date: interview.interview_date,
      interview_start_time: interview.interview_start_time,
      interview_end_time: interview.interview_end_time,
      isImg,
      isCoverletter,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE GETREQDFIELDS

// START--> CHANGE USERJDLIST

const UserJDList = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const uuid = req.params.uuid;

  try {
    if (req.user.isAdmin) {
      // First, check if the user exists
      const user = await User.findOne(
        { candidate_id: userId},
        { _id: 0 }
      );

      if (!user) {
        return res.status(404).json({ message: 'Error Code B112' });
      }

      // Now, fetch the interview data
      const interview = await Interview.findOne(
        { candidate_id: userId, uuid: uuid },
        { _id: 0, interview_drive: 1, interview_drive_version: 1 }
      );

      if (!interview) {
        return res.status(404).json({ message: 'Error Code B114: Interview not found' });
      }

      const nameRegex = /^[^<>$]*$/;
      if (typeof interview.interview_drive !== 'string' || !interview.interview_drive.trim() || !nameRegex.test(interview.interview_drive)) {
        return res.status(400).send('Error Code B113');
      }

      const driveVersionRegex = /^v[0-9]+$/;
      if (!driveVersionRegex.test(interview.interview_drive_version)) {
        return res.status(400).send('Error Code B113');
      }

      const jd = await JDModel.findOne(
        { name: interview.interview_drive, skill_level_version: interview.interview_drive_version },
        { _id: 0, name: 1, skill_level_version: 1, createdAt: 1, difficulty: 1, skills: 1, sections: 1, question_pattern: 1 }
      );

      if (!jd) {
        return res.status(404).json({ message: 'Error Code B113' });
      }

      res.json(jd);
    } else {
      return res.status(401).json({ message: 'Error Code B110' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE USERJDLIST

// START --> CHANGE GETCHATLOG

const GetChatLog = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send('Error Code B107');
  }

  const userId = req.params.id;
  const uuid = req.params.uuid;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Error Code B112' });
    }

    const interview = await Interview.findOne({ user_id: userId, uuid: uuid });
    if (!interview) {
      return res.status(404).json({ message: 'Error Code B113: Interview not found' });
    }

let chatLogToSend = [];
let chatLogTimestampsToSend = [];

if (interview.chatlog && interview.chatlog.length > 0) {
  interview.chatlog.forEach((entry) => {
    const colonIndex = entry.indexOf(':');
    if (colonIndex !== -1) {
      const speaker = entry.substring(0, colonIndex).trim();
      const text = entry.substring(colonIndex + 1).trim();
      chatLogToSend.push({ [speaker]: text });
    }
  });
}

if (interview.chatlog_timestamps && interview.chatlog_timestamps.length > 0) {
  interview.chatlog_timestamps.forEach((entry) => {
    const colonIndex = entry.indexOf(':');
    if (colonIndex !== -1) {
      const speaker = entry.substring(0, colonIndex).trim();
      const text = entry.substring(colonIndex + 1).trim();
      chatLogTimestampsToSend.push({ [speaker]: text });
    }
  });
}

/*
if (chatLogToSend.length > 2) {
  chatLogToSend = chatLogToSend.slice(2);
}
*/
res.status(200).json({ chatLogTimestamps: chatLogTimestampsToSend, chatLog: chatLogToSend });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE GETCHATLOG

// START --> CHANGE GETINTERVIEWRECORDING

const GetInterviewRecording = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send('Invalid User Id');
  }

  const userId = req.params.id;
  const uuid = req.params.uuid;

  try {
    if (req.user.isAdmin) {
      const interview = await Interview.findOne({ user_id: userId, uuid: uuid });

      if (!interview || !interview.interviewrecording) {
        return res.status(404).json({ message: 'Interview or interview recording not found' });
      }

      const bucket = gcpstorage.bucket(bucketName);
      const file = bucket.file(`interview-recordings/${interview.interviewrecording}`);

      file.exists()
        .then(data => {
          const exists = data[0];
          if (!exists) {
            return res.status(404).json({ message: "Error Code B123: Interview recording not found or wrong format." });
          } else {
            res.setHeader('Content-Type', 'video/webm');
            res.setHeader('Content-Disposition', `attachment; filename="${interview.interviewrecording}.webm"`);
            const stream = file.createReadStream();
            stream.on('error', function(error) {
              console.error(error);
              res.status(500).json({ message: 'Error streaming the file' });
            });
            stream.on('end', () => {
              res.end();
            });
            stream.pipe(res);
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ message: 'Server Error' });
        });

    } else {
      return res.status(401).json({ message: "Error Code B110" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// END --> CHANGE GETINTERVIEWRECORDING

// START --> CHANGE GETFILTEREDUSERS
const GetFilteredUsers = asyncHandler(async (req, res) => {     
  const assessment_category_regex = /^(practice|actual|testing)$/i;    
  const date_regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/((19|20)\d\d)$/;    
  const { filteredData } = req.body;   
    
  // Validate filteredData exists
  if (!filteredData || typeof filteredData !== 'object') {
    return res.status(400).send('Error Code B113: Invalid filter data');
  }

  const {  
    skills, 
    assessmentCategory,  
    assessmentPipeline,
    formattedStartDate,  
    formattedEndDate  
  } = filteredData;  
    
  // Strict input validation
  if (!Array.isArray(skills) || skills.length === 0) { 
    return res.status(400).send('Error Code B113: Invalid skills array'); 
  } 
  // Validate each skill in the array is a string
  if (!skills.every(skill => typeof skill === 'string')) {
    return res.status(400).send('Error Code B113: Skills must be strings');
  }
  
  // Validate assessment category
  if (!assessment_category_regex.test(assessmentCategory)) { 
    return res.status(400).send('Error Code B113: Invalid assessment category'); 
  } 
  
  // Validate dates
  if (!date_regex.test(formattedStartDate)) { 
    return res.status(400).send('Error Code B113: Invalid start date'); 
  } 
  if (!date_regex.test(formattedEndDate)) { 
    return res.status(400).send('Error Code B113: Invalid end date');  
  } 
  
  // Validate assessmentPipeline
  if (typeof assessmentPipeline !== 'string') {
    return res.status(400).send('Error Code B113: Invalid assessment pipeline');
  }
  try {  
    if (req.user.isAdmin) {  
      // Extract day, month, and year from start and end dates
      const startMoment = moment(formattedStartDate, 'DD/MM/YYYY');
      const endMoment = moment(formattedEndDate, 'DD/MM/YYYY');

      const startDay = startMoment.date();
      const startMonth = startMoment.month() + 1; // moment months are 0-indexed
      const startYear = startMoment.year();

      const endDay = endMoment.date();
      const endMonth = endMoment.month() + 1;
      const endYear = endMoment.year();

      // Create a sanitized list of skills to prevent injection
      const sanitizedSkills = skills.map(skill => String(skill).trim());
      
      const interviews = await Interview.aggregate([
        {
          $match: {
            interview_drive: { $in: sanitizedSkills },
            assessment_category: { $regex: new RegExp('^' + assessmentCategory + '$', 'i') },
            assessment_pipeline: { $regex: new RegExp('^' + assessmentPipeline + '$', 'i') },
          }
        },
        {
          $addFields: {
            dateParts: {
              $map: {
                input: { $split: ["$interview_date", " - "] },
                as: "part",
                in: { $toInt: "$$part" }
              }
            }
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                { $gte: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                { $lte: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                {
                  $or: [
                    { $gt: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                      { $gte: [{ $arrayElemAt: ["$dateParts", 1] }, startMonth] }
                    ]}
                  ]
                },
                {
                  $or: [
                    { $lt: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                      { $lte: [{ $arrayElemAt: ["$dateParts", 1] }, endMonth] }
                    ]}
                  ]
                },
                {
                  $or: [
                    { $gt: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                    { $gt: [{ $arrayElemAt: ["$dateParts", 1] }, startMonth] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                      { $eq: [{ $arrayElemAt: ["$dateParts", 1] }, startMonth] },
                      { $gte: [{ $arrayElemAt: ["$dateParts", 0] }, startDay] }
                    ]}
                  ]
                },
                {
                  $or: [
                    { $lt: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                    { $lt: [{ $arrayElemAt: ["$dateParts", 1] }, endMonth] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                      { $eq: [{ $arrayElemAt: ["$dateParts", 1] }, endMonth] },
                      { $lte: [{ $arrayElemAt: ["$dateParts", 0] }, endDay] }
                    ]}
                  ]
                }
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 0,
            uuid: 1,
            candidate_id: '$user.candidate_id',
            name: '$user.name',
            image: '$user.image',
            interview_drive: 1,
            interview_drive_version: 1,
            assessment_category: 1,
            interview_completed: 1,
            interview_date: 1,
            interview_start_time: 1,
            interview_end_time: 1,
            assigned_interview_start_time: 1,
            assigned_interview_end_time: 1,
            chatlog: 1,
            chatlog_timestamps: 1,
            covertext: 1,
            interview_label: 1,
            assessment_pipeline: 1,
            coverletter: 1
          }
        }
      ]);


      const formattedInterviews = interviews.map(interview => {
        var interview_status;
        const isImg = isValidFile(interview.image);
        const isCoverletter = isValidFile(interview.coverletter);
        const nonTypeValues = ["NA", "Na", "none", "None", null, undefined];
        const formattedInterviewLabel = nonTypeValues.includes(interview.interview_label) ? 'SME Evaluation Pending' : interview.interview_label;
        const formattedCovertext = interview.covertext === undefined ? 'Candidate did not start interview; Coverletter content is not displayed.' : (nonTypeValues.includes(interview.covertext) || interview.covertext.trim() === '' ? 'Cover Letter PDF Invalid/Corrupted. Continue with the Interview.' : modifyCovtext(interview.covertext));
        
        let chatLogTimestampsToSend = [];  
        if (interview.chatlog_timestamps && interview.chatlog_timestamps.length > 0) {  
          interview.chatlog_timestamps.forEach((entry) => {      
            const message = Object.values(entry).join('');      
            const colonIndex = message.indexOf(':');      
            if (colonIndex !== -1) {      
              const speaker = message.substring(0, colonIndex).trim();      
              const text = message.substring(colonIndex + 1).trim();      
              chatLogTimestampsToSend.push({ [speaker]: text });      
            }      
          });    
        }   

        const currentTime = new Date();

        // Function to convert time string to Date object
        function convertTimeStringToDate(timeStr) {
            if (timeStr === "00:00:00 AM") return null; // Handle default case
            
            const [time, period] = timeStr.split(' ');
            const [hours, minutes, seconds] = time.split(':');
            
            const date = new Date();
            let hour = parseInt(hours);
            
            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) {
                hour += 12;
            }
            if (period === 'AM' && hour === 12) {
                hour = 0;
            }
            
            date.setHours(hour, parseInt(minutes), parseInt(seconds));
            return date;
        }

        // Convert interview times to Date objects
        const interviewStartTime = convertTimeStringToDate(interview.interview_start_time);
        const interviewEndTime = convertTimeStringToDate(interview.interview_end_time);

        if (interview.interview_completed) {
            interview_status = "COMPLETED";
        } else if (interview.interview_start_time !== "00:00:00 AM" && !interview.interview_completed) {
            interview_status = "INCOMPLETE";
        } else if (interview.interview_start_time === "00:00:00 AM" && interview.interview_end_time === "00:00:00 AM") {
            if (interviewEndTime && currentTime <= interviewEndTime) {
                interview_status = "SCHEDULED";
            } else {
                interview_status = "NOT ATTENDED";
            }
        } else {
            interview_status = "UNKNOWN";
        }

        return {
          uuid: interview.uuid,
          candidate_id: interview.candidate_id,       
          name: interview.name,     
          isImg: isImg,
          interview_drive: interview.interview_drive,
          interview_drive_version: interview.interview_drive_version,
          assessment_category: interview.assessment_category,
          interview_completed: interview.interview_completed,
          interview_date: interview.interview_date,
          interview_start_time: interview.interview_start_time,
          interview_end_time: interview.interview_end_time,
          assigned_interview_start_time: interview.assigned_interview_start_time,
          assigned_interview_end_time: interview.assigned_interview_end_time,
          ...(interview.interview_completed || interview.interview_start_time !== "00:00:00 AM" ? {
            chatlog: interview.chatlog,
            chatLogTimestamps: chatLogTimestampsToSend,
            covertext: formattedCovertext,
          } : {}),
          interview_label: formattedInterviewLabel,
          assessment_pipeline: interview.assessment_pipeline,
          isCoverletter: isCoverletter,
          interview_status: interview_status,
        };
      });    
        
      res.json(formattedInterviews);   
    } else {
      res.status(401);
      throw new Error("Not authorized as an admin");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE GETFILTEREDUSERS

// START --> CHANGE GETATTENDANCE

const GetAttendance = asyncHandler(async (req, res) => {    
  const assessment_category_regex = /^(practice|actual|testing)$/i;    
  const date_regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/((19|20)\d\d)$/;    
  const { attendanceData } = req.body;  

  // Validate attendanceData exists
  if (!attendanceData || typeof attendanceData !== 'object') {
    return res.status(400).send('Error Code B113: Invalid attendance data');
  }

  const {  
    skills,  
    assessmentCategory,  
    assessmentPipeline,
    formattedStartDate,  
    formattedEndDate  
  } = attendanceData;  
    
  // Strict input validation
  if (!Array.isArray(skills) || skills.length === 0) { 
    return res.status(400).send('Error Code B113: Invalid skills array'); 
  } 
  // Validate each skill in the array is a string
  if (!skills.every(skill => typeof skill === 'string')) {
    return res.status(400).send('Error Code B113: Skills must be strings');
  }
  
  // Validate assessment category
  if (!assessment_category_regex.test(assessmentCategory)) { 
    return res.status(400).send('Error Code B113: Invalid assessment category'); 
  } 
  
  // Validate dates
  if (!date_regex.test(formattedStartDate)) { 
    return res.status(400).send('Error Code B113: Invalid start date'); 
  } 
  if (!date_regex.test(formattedEndDate)) { 
    return res.status(400).send('Error Code B113: Invalid end date');  
  } 
  
  // Validate assessmentPipeline
  if (typeof assessmentPipeline !== 'string') {
    return res.status(400).send('Error Code B113: Invalid assessment pipeline');
  }
  try {  
    if (req.user.isAdmin) {  
      // Extract day, month, and year from start and end dates
      const startMoment = moment(formattedStartDate, 'DD/MM/YYYY');
      const endMoment = moment(formattedEndDate, 'DD/MM/YYYY');

      const startDay = startMoment.date();
      const startMonth = startMoment.month() + 1; // moment months are 0-indexed
      const startYear = startMoment.year();

      const endDay = endMoment.date();
      const endMonth = endMoment.month() + 1;
      const endYear = endMoment.year();

      // Create a sanitized list of skills to prevent injection
      const sanitizedSkills = skills.map(skill => String(skill).trim());
      
      const interviews = await Interview.aggregate([
        {
          $match: {
            interview_drive: { $in: sanitizedSkills },
            assessment_category: { $regex: new RegExp('^' + assessmentCategory + '$', 'i') },
            assessment_pipeline: { $regex: new RegExp('^' + assessmentPipeline + '$', 'i') },
          }
        },
        {
          $addFields: {
            dateParts: {
              $map: {
                input: { $split: ["$interview_date", " - "] },
                as: "part",
                in: { $toInt: "$$part" }
              }
            }
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                { $gte: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                { $lte: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                {
                  $or: [
                    { $gt: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                      { $gte: [{ $arrayElemAt: ["$dateParts", 1] }, startMonth] }
                    ]}
                  ]
                },
                {
                  $or: [
                    { $lt: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                      { $lte: [{ $arrayElemAt: ["$dateParts", 1] }, endMonth] }
                    ]}
                  ]
                },
                {
                  $or: [
                    { $gt: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                    { $gt: [{ $arrayElemAt: ["$dateParts", 1] }, startMonth] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, startYear] },
                      { $eq: [{ $arrayElemAt: ["$dateParts", 1] }, startMonth] },
                      { $gte: [{ $arrayElemAt: ["$dateParts", 0] }, startDay] }
                    ]}
                  ]
                },
                {
                  $or: [
                    { $lt: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                    { $lt: [{ $arrayElemAt: ["$dateParts", 1] }, endMonth] },
                    { $and: [
                      { $eq: [{ $arrayElemAt: ["$dateParts", 2] }, endYear] },
                      { $eq: [{ $arrayElemAt: ["$dateParts", 1] }, endMonth] },
                      { $lte: [{ $arrayElemAt: ["$dateParts", 0] }, endDay] }
                    ]}
                  ]
                }
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 0,
            uuid: 1,
            candidate_id: '$user.candidate_id',
            name: '$user.name',
            interview_drive: 1,
            interview_drive_version: 1,
            interview_completed: 1,
            interview_date: 1,
            assessment_category: 1,
            interview_start_time: 1,
            interview_end_time: 1,
            assigned_interview_start_time: 1,
            assigned_interview_end_time: 1,
            assessment_pipeline: 1
          }
        }
      ]);

      const formattedUserList = interviews.map(interview => {
        const currentTime = new Date();

        // Function to convert time string to Date object
        function convertTimeStringToDate(timeStr) {
            if (!timeStr || timeStr === "00:00:00 AM") return null;
            
            const [time, period] = timeStr.split(' ');
            const [hours, minutes, seconds] = time.split(':');
            
            const date = new Date();
            let hour = parseInt(hours);
            
            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) {
                hour += 12;
            }
            if (period === 'AM' && hour === 12) {
                hour = 0;
            }
            
            date.setHours(hour, parseInt(minutes), parseInt(seconds));
            return date;
        }

        // Convert interview times to Date objects
        const interviewStartTime = convertTimeStringToDate(interview.interview_start_time);
        const interviewEndTime = convertTimeStringToDate(interview.interview_end_time);
        const assignedEndTime = convertTimeStringToDate(interview.assigned_interview_end_time);

        let interview_status;

        if (interview.interview_completed) {
            interview_status = "COMPLETED";
        } else if (interview.interview_start_time !== "00:00:00 AM" && !interview.interview_completed) {
            interview_status = "INCOMPLETE";
        } else if (interview.interview_start_time === "00:00:00 AM" && interview.interview_end_time === "00:00:00 AM") {
            if (assignedEndTime && currentTime <= assignedEndTime) {
                interview_status = "SCHEDULED";
            } else {
                interview_status = "NOT ATTENDED";
            }
        } else {
            interview_status = "UNKNOWN";
        }

        return {    
            candidate_id: interview.candidate_id,       
            name: interview.name,     
            uuid: interview.uuid,
            interview_drive: interview.interview_drive,    
            interview_drive_version: interview.interview_drive_version,    
            interview_date: interview.interview_date,       
            assigned_interview_start_time: interview.assigned_interview_start_time,    
            assigned_interview_end_time: interview.assigned_interview_end_time,    
            assessment_category: interview.assessment_category,
            interview_status: interview_status,
            assessment_pipeline: interview.assessment_pipeline,
        };
      });    
        
      res.json(formattedUserList);   
    } else {
      res.status(401);
      throw new Error("Not authorized as an admin");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE GETATTENDANCE

// NEW START--> GETDRIVEANDSLOT

function getInterviewStatus(interview) {
  if (interview.interview_completed) {
    return false;
  } else if (interview.interview_start_time === "00:00:00 AM" && 
             interview.interview_end_time === "00:00:00 AM") {
    return "Not Started";
  } else if (interview.interview_start_time !== "00:00:00 AM" && 
             !interview.interview_completed) {
    return "In Progress";
  }
}

const GetDriveAndSlot = asyncHandler(async (req, res) => {
  let { candidateIds } = req.body;
  candidateIds = candidateIds.map(id => +id);

  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).send('Error Code B114: Invalid or empty candidate IDs');
  }


  // Validate and sanitize each candidate ID
  const sanitizedCandidateIds = [];
  for (const id of candidateIds) {
    // Convert to number and validate
    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).send(`Error Code B114: Invalid candidate ID format: ${id}`);
    }
    sanitizedCandidateIds.push(numId);
  }  
  try {
    if (req.user.isAdmin) {
      const interviews = await Interview.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            'user.candidate_id': { $in: sanitizedCandidateIds }
          }
        },
        {
          $project: {
            _id: 0,
            uuid: 1,
            candidate_id: '$user.candidate_id',
            interview_drive: 1,
            interview_date: 1,
            interview_start_time: 1,
            interview_end_time: 1,
            assigned_interview_start_time: 1,
            assigned_interview_end_time: 1,
            assessment_category: 1,
            assessment_pipeline: 1,
            interview_completed: 1
          }
        }
      ]);

      const formattedInterviews = interviews.map(interview => {
        const formattedInterview = {
          candidate_id: interview.candidate_id,
          interview_drive: interview.interview_drive,
          interview_date: interview.interview_date,
          assigned_interview_start_time: interview.assigned_interview_start_time,
          assigned_interview_end_time: interview.assigned_interview_end_time,
          assessment_category_assessment_pipeline: `${interview.assessment_category}-${interview.assessment_pipeline}`,
          uuid: interview.uuid,
          interview_start_time: interview.interview_start_time,
          interview_end_time: interview.interview_end_time,
          interview_completed: interview.interview_completed,
        };

        const status = getInterviewStatus(interview);
        if (status) {
          formattedInterview.status = status;
          return formattedInterview;
        }
        return undefined;
      })
      .filter(interview => interview !== undefined); 
    
    const finalFormattedInterviews = formattedInterviews.map(({ interview_start_time, interview_end_time, ...rest }) => rest);

    res.json(finalFormattedInterviews);
    } else {
      res.status(401);
      throw new Error("Not authorized as an admin");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// NEW END --> GETDRIVEANDSLOT

// START --> CHANGE GETALLUSERS

const GetAllUsers = asyncHandler(async (req, res) => {
  try {
    if (req.body.userInfo && req.body.userInfo.isAdmin) {
      const limit = 100;
      const candidateIds = req.body.candidateIds || [];

      let filter = { isAdmin: false };
      let userList;
      let hasMore = false;
      let nextLastTimestamp = null;
      let nextLastId = null;

      if (candidateIds.length > 0) {
        // If specific candidateIds are provided, fetch only those
        filter.candidate_id = { $in: candidateIds };
        userList = await User.find(filter, {
          candidate_id: 1,
          name: 1,
          createdAt: 1,
        }).sort({ createdAt: -1, _id: -1 });

        hasMore = false; // No pagination for specific candidateIds
      } else {
        // Use pagination if no specific candidateIds are provided
        const lastTimestamp = req.query.lastTimestamp ? new Date(req.query.lastTimestamp) : null;
        const lastId = req.query.lastId || null;

        if (lastTimestamp && lastId) {
          filter.$or = [
            { createdAt: { $lt: lastTimestamp } },
            { createdAt: lastTimestamp, _id: { $lt: lastId } }
          ];
        }

        userList = await User.find(filter, {
          candidate_id: 1,
          name: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1);  // Fetch one extra to check if there's more data

        hasMore = userList.length > limit;
        userList = userList.slice(0, limit);

        // Get the last record's timestamp and ID for the next page
        const lastRecord = userList[userList.length - 1];
        nextLastTimestamp = lastRecord ? lastRecord.createdAt.toISOString() : null;
        nextLastId = lastRecord ? lastRecord._id : null;
      }

      const users = userList.map(user => ({
        candidate_id: user.candidate_id,
        name: user.name,
        _id: user._id,
        createdAt: user.createdAt
      }));

      res.status(200).json({
        users,
        hasMore,
        nextLastTimestamp,
        nextLastId
      });
    } else {
      res.status(401).json({ message: 'Error Code B109' });
      throw new Error("Error Code B109");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// END --> CHANGE GETALLUSERS

export {
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
  }