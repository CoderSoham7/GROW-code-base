import mongoose from "mongoose";
import { JDModel } from "../Models/JDModel.js";
import { Interview } from "../Models/InterviewModel.js";
import { User } from "../Models/UserModel.js";

/**
 * CodingController - Handles coding interview sessions
 * 
 * This controller manages the Python Programmer coding assessments
 * It selects questions from a question bank stored in the JDModel
 * and manages interview progress similar to the Python implementation
 * in coding_session_idea.md
 */
const CodingController = {
  /**
   * Process candidate's code response and return the next question
   * @param {object} req - Request object with userId, uuid, and candidate_response
   * @param {object} res - Response object
   */
  handleCodingResponse: async (req, res) => {
    try {
      const { ID, uuid, candidate_response, CSRF_token } = req.body;

      if (!ID || !uuid || !candidate_response) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          details: "ID, uuid, and candidate_response are required" 
        });
      }

      // Validate user using CSRF token (required)
      if (!CSRF_token) {
        return res.status(401).json({ error: "CSRF token is required" });
      }
      
      // Validate ID format to prevent NoSQL injection
      if (!mongoose.Types.ObjectId.isValid(ID)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      // Use findOne with _id for secure query
      const user = await User.findOne({ _id: new mongoose.Types.ObjectId(ID) });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.CSRF_token !== CSRF_token) {
        return res.status(401).json({ error: "Invalid CSRF token" });
      }
      
      // Update the user's CSRF token in the database for continued validation
      user.CSRF_token = CSRF_token;
      const options = { validateBeforeSave: false };
      await user.save(options);

      // Validate input (basic sanitization)
      const sanitizedResponse = candidate_response
        .replace(/\$/g, "")
        .replace(/&/g, "");

      // Validate UUID format (basic check)
      if (!uuid || typeof uuid !== 'string' || uuid.trim() === '') {
        return res.status(400).json({ error: "Invalid UUID format" });
      }
      
      // Get the interview document using sanitized uuid
      const sanitizedUuid = uuid.trim();
      const interview = await Interview.findOne({ uuid: sanitizedUuid });
      if (!interview) {
        return res.status(404).json({ error: "Interview session not found" });
      }

      // User has already been retrieved and validated with CSRF token earlier

      // Ensure user document includes this interview
      if (!user.interviews.includes(uuid)) {
        await User.findByIdAndUpdate(
          ID,
          { $addToSet: { interviews: uuid } }
        );
      }

      // Get the timestamp for the response
      const timestamp = new Date();
      const timestampFormat = timestamp.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      });

      // Initialize or get chatlog and timestamps
      const chatlog = interview.chatlog || [];
      const chatlog_timestamps = interview.chatlog_timestamps || [];

      // Get current question number from messages
      const messages = interview.messages || [];
      const questionsAsked = messages.length > 0 ? parseInt(messages[0]) || 0 : 0;

      // Add candidate response to chatlog as strings (format needed by model)
      chatlog.push(`Candidate: ${sanitizedResponse}`);
      chatlog_timestamps.push(`Candidate_timestamp: ${timestampFormat}`);

      // Get the question bank for Python Programmer
      const pythonJD = await JDModel.findOne({ name: "Python Programmer" });
      
      if (!pythonJD) {
        return res.status(500).json({ 
          error: "Question bank not found", 
          details: "Python Programmer question bank is missing" 
        });
      }

      // Get the question bank from the Question_bank field (could be various formats)
      let questionBank = [];
      try {
        // Check if Question_bank exists
        if (!pythonJD.Question_bank) {
          return res.status(500).json({ 
            error: "Question bank is empty", 
            details: "Python Programmer question bank is not set" 
          });
        }
        
        // Handle different possible formats
        if (typeof pythonJD.Question_bank === 'string') {
          // Handle string format
          const qbString = pythonJD.Question_bank.trim();
          
          // Try multiple parsing approaches to handle potential formats
          console.log("Question bank string format:", qbString.substring(0, 30) + "...");
          
          // First attempt: handle standard JSON format directly
          try {
            questionBank = JSON.parse(qbString);
            console.log("Successfully parsed as standard JSON");
          } catch (e) {
            // Second attempt: try to extract from triple quotes if present
            if ((qbString.startsWith('"""') && qbString.endsWith('"""')) || 
                (qbString.startsWith("'''") && qbString.endsWith("'''"))) {
              
              // Extract content inside triple quotes  
              const innerContent = qbString.substring(3, qbString.length - 3);
              console.log("Extracted from triple quotes:", innerContent.substring(0, 30) + "...");
              
              try {
                questionBank = JSON.parse(innerContent);
                console.log("Successfully parsed content inside triple quotes");
              } catch (innerErr) {
                console.error("Failed to parse content inside triple quotes:", innerErr);
                
                // Last resort: try to evaluate as a literal array if it looks like one
                if (innerContent.startsWith('[') && innerContent.endsWith(']')) {
                  try {
                    // Caution: only use this approach for trusted data
                    questionBank = eval(`(${innerContent})`);
                    console.log("Successfully evaluated as literal array");
                  } catch (evalErr) {
                    console.error("Failed all parsing attempts:", evalErr);
                    throw new Error("Could not parse question bank in any supported format");
                  }
                } else {
                  throw new Error("Content inside triple quotes is not a valid JSON array");
                }
              }
            } else {
              console.error("Not in triple quote format and not valid JSON:", e);
              throw new Error("Question bank is not in a recognized format");
            }
          }
        } 
        // Handle direct array format
        else if (Array.isArray(pythonJD.Question_bank)) {
          questionBank = pythonJD.Question_bank;
        } 
        // Unknown format
        else {
          console.error("Question bank is in unknown format:", typeof pythonJD.Question_bank);
          throw new Error(`Invalid question bank type: ${typeof pythonJD.Question_bank}`);
        }
        
        // Final validation
        if (!Array.isArray(questionBank) || questionBank.length === 0) {
          console.error("After parsing, question bank is not a valid array:", questionBank);
          throw new Error("Invalid question bank format - not a valid array after parsing");
        }
      } catch (error) {
        console.error("Error processing question bank:", error);
        return res.status(500).json({ 
          error: "Invalid question bank format",
          details: error.message
        });
      }

      let nextQuestion;
      
      // Check if interview is complete (20 questions)
      if (questionsAsked >= 20) {
        nextQuestion = "That concludes the coding assessment. Thank you for your time. Please close this session properly by clicking the END TEST button.";
      } else {
        // Get the next window of 5 questions using sliding window approach
        const startIdx = Math.min(questionsAsked, Math.floor(questionBank.length / 5)) * 5;
        const endIdx = Math.min(startIdx + 5, questionBank.length);
        
        if (startIdx >= questionBank.length) {
          // If we've run out of questions but haven't asked 20 yet
          nextQuestion = "That concludes the coding assessment. Thank you for your time. Please close this session properly by clicking the END TEST button.";
        } else {
          // Select a random question from this window
          const questionIdx = startIdx + Math.floor(Math.random() * (endIdx - startIdx));
          nextQuestion = questionBank[questionIdx];
          
          // If we get undefined (shouldn't happen but just in case)
          if (!nextQuestion) {
            nextQuestion = "That concludes the coding assessment. Thank you for your time. Please close this session properly by clicking the END TEST button.";
          }
        }
      }

      // Add interviewer response to chatlog
      const interviewerTimestamp = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      });
      
      // Add interviewer response as string
      chatlog.push(`Interviewer: ${nextQuestion}`);
      chatlog_timestamps.push(`Interviewer_timestamp: ${interviewerTimestamp}`);

      // Update the interview document with sanitized uuid
      const updatedQuestionsAsked = questionsAsked + 1;
      await Interview.findOneAndUpdate(
        { uuid: sanitizedUuid },  // Use the sanitized uuid from earlier
        {
          chatlog,
          chatlog_timestamps,
          messages: [updatedQuestionsAsked]  // Store question count
        }
      );

      // Return the response
      return res.json({
        _id: ID,
        uuid,
        Question: nextQuestion,
        question_number: updatedQuestionsAsked
      });
    } catch (error) {
      console.error("Error in handleCodingResponse:", error);
      return res.status(500).json({ 
        error: "Server error", 
        details: error.message 
      });
    }
  },

  /**
   * Initialize a new coding interview with first question
   * @param {object} req - Request object with userId and uuid
   * @param {object} res - Response object
   */
  initializeCodingInterview: async (req, res) => {
    try {
      const { ID, uuid, CSRF_token } = req.body;

      if (!ID || !uuid) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          details: "ID and uuid are required" 
        });
      }
      
      // Validate CSRF token
      if (!CSRF_token) {
        return res.status(401).json({ error: "CSRF token is required" });
      }
      
      // Validate ID format to prevent NoSQL injection
      if (!mongoose.Types.ObjectId.isValid(ID)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      // Use findOne with _id for secure query
      const user = await User.findOne({ _id: new mongoose.Types.ObjectId(ID) });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.CSRF_token !== CSRF_token) {
        return res.status(401).json({ error: "Invalid CSRF token" });
      }
      
      // Update the user's CSRF token in the database for continued validation
      user.CSRF_token = CSRF_token;
      const options = { validateBeforeSave: false };
      await user.save(options);

      // Validate UUID format (basic check)
      if (!uuid || typeof uuid !== 'string' || uuid.trim() === '') {
        return res.status(400).json({ error: "Invalid UUID format" });
      }
      
      // Check if interview already exists using sanitized uuid
      const sanitizedUuid = uuid.trim();
      const interview = await Interview.findOne({ uuid: sanitizedUuid });
      
      if (interview) {
        // Return the current state
        const questionsAsked = interview.messages && interview.messages.length > 0 ? interview.messages[0] : 0;
        const chatlog = interview.chatlog || [];
        
        // Find the last interviewer message from string format entries
        let lastQuestion = "No question available";
        // Add safety limit to prevent potential DoS from very large chatlog
        const MAX_ITERATIONS = 60; 
        for (let i = chatlog.length - 1; i >= 0 && i >= chatlog.length - MAX_ITERATIONS; i--) {
          if (chatlog[i].startsWith('Interviewer:')) {
            lastQuestion = chatlog[i].substring('Interviewer:'.length).trim();
            break;
          }
        }
        
        return res.json({
          _id: ID,
          uuid,
          Question: lastQuestion,
          question_number: questionsAsked
        });
      }

      // Get the question bank for Python Programmer
      const pythonJD = await JDModel.findOne({ name: "Python Programmer" });
      
      if (!pythonJD) {
        return res.status(500).json({ 
          error: "Question bank not found", 
          details: "Python Programmer question bank is missing" 
        });
      }

      // Get the question bank from the Question_bank field (could be various formats)
      let questionBank = [];
      try {
        // Check if Question_bank exists
        if (!pythonJD.Question_bank) {
          return res.status(500).json({ 
            error: "Question bank is empty", 
            details: "Python Programmer question bank is not set" 
          });
        }
        
        // Handle different possible formats
        if (typeof pythonJD.Question_bank === 'string') {
          // Handle string format
          const qbString = pythonJD.Question_bank.trim();
          
          // Try multiple parsing approaches to handle potential formats
          console.log("Question bank string format:", qbString.substring(0, 30) + "...");
          
          // First attempt: handle standard JSON format directly
          try {
            questionBank = JSON.parse(qbString);
            console.log("Successfully parsed as standard JSON");
          } catch (e) {
            // Second attempt: try to extract from triple quotes if present
            if ((qbString.startsWith('"""') && qbString.endsWith('"""')) || 
                (qbString.startsWith("'''") && qbString.endsWith("'''"))) {
              
              // Extract content inside triple quotes  
              const innerContent = qbString.substring(3, qbString.length - 3);
              console.log("Extracted from triple quotes:", innerContent.substring(0, 30) + "...");
              
              try {
                questionBank = JSON.parse(innerContent);
                console.log("Successfully parsed content inside triple quotes");
              } catch (innerErr) {
                console.error("Failed to parse content inside triple quotes:", innerErr);
                
                // Last resort: try to evaluate as a literal array if it looks like one
                if (innerContent.startsWith('[') && innerContent.endsWith(']')) {
                  try {
                    // Caution: only use this approach for trusted data
                    questionBank = eval(`(${innerContent})`);
                    console.log("Successfully evaluated as literal array");
                  } catch (evalErr) {
                    console.error("Failed all parsing attempts:", evalErr);
                    throw new Error("Could not parse question bank in any supported format");
                  }
                } else {
                  throw new Error("Content inside triple quotes is not a valid JSON array");
                }
              }
            } else {
              console.error("Not in triple quote format and not valid JSON:", e);
              throw new Error("Question bank is not in a recognized format");
            }
          }
        } 
        // Handle direct array format
        else if (Array.isArray(pythonJD.Question_bank)) {
          questionBank = pythonJD.Question_bank;
        } 
        // Unknown format
        else {
          console.error("Question bank is in unknown format:", typeof pythonJD.Question_bank);
          throw new Error(`Invalid question bank type: ${typeof pythonJD.Question_bank}`);
        }
        
        // Final validation
        if (!Array.isArray(questionBank) || questionBank.length === 0) {
          console.error("After parsing, question bank is not a valid array:", questionBank);
          throw new Error("Invalid question bank format - not a valid array after parsing");
        }
      } catch (error) {
        console.error("Error processing question bank:", error);
        return res.status(500).json({ 
          error: "Invalid question bank format",
          details: error.message
        });
      }

      // Select first question (random from first 5)
      const firstQuestionIdx = Math.floor(Math.random() * Math.min(5, questionBank.length));
      const firstQuestion = questionBank[firstQuestionIdx];
      
      // Get timestamp
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      });

      // Create a new interview with chatlog entries as strings
      const newInterview = new Interview({
        uuid,
        user_id: ID,
        chatlog: [`Interviewer: ${firstQuestion}`],
        chatlog_timestamps: [`Interviewer_timestamp: ${timestamp}`],
        messages: [1]  // Start with question 1
      });

      await newInterview.save();
      
      // Return the response
      return res.json({
        _id: ID,
        uuid,
        Question: firstQuestion,
        question_number: 1
      });
    } catch (error) {
      console.error("Error in initializeCodingInterview:", error);
      return res.status(500).json({ 
        error: "Server error", 
        details: error.message 
      });
    }
  }
};

export default CodingController;