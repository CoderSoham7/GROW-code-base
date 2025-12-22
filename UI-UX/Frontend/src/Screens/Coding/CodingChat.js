import React, { useState, useReducer, useEffect, useContext, useRef, useLayoutEffect, useMemo, useCallback} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {Button} from "react-bootstrap";
import GenerateCodingQues, { initializeCodingSession } from '../../Actions/GenerateCodingQues';
import "./coding.css";
import { faCircleNotch, faUpRightAndDownLeftFromCenter, faPaperPlane } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from '../AuthContext';
import { getChatLog, updateInterviewCompleted, updateInterviewStartEndTime } from '../../Actions/UserActions';
import moment from 'moment';
import swal from 'sweetalert'; 
import EnhancedCodingInput from './EnhancedCodingInput';

const initialState = {
  messages: [],
  sender: '',
  typing: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'candidate-message':
      // Validate candidate messages
      if (!action.payload || action.payload.trim() === '') {
        console.warn("Empty candidate message received");
        return state;
      }
      
      const message = {
        message: action.payload,
        sender: 'candidate',
        timestamp: new Date(),
      };
      return {
        ...state,
        messages: [...state.messages, message],
        typing: false,
      };
      
    case 'bot-reply':
      // Enhanced validation for bot replies
      if (!action.payload) {
        console.warn("Empty bot reply received");
        return {
          ...state,
          typing: false, // Clear typing status even if message is invalid
        };
      }
      
      // Strictly filter out "No question available" responses
      if (typeof action.payload === 'string' && 
          (action.payload.includes("No question available") || 
           action.payload.trim() === '')) {
        console.warn("Invalid bot reply filtered:", action.payload);
        return {
          ...state,
          typing: false, // Clear typing status even if message is invalid
        };
      }
      
      const reply = {
        sender: 'bot',
        message: action.payload,
        timestamp: new Date(),
      };
      return {
        ...state,
        messages: [...state.messages, reply],
        typing: false,
      };
      
    case 'typing':
      return {
        ...state,
        typing: true,
      };
      
    case 'clear-typing':
      return {
        ...state,
        typing: false,
      };
    
    case 'replace-last-bot-message':
      if (!state.messages.length) return state;
      
      // Find the last bot message index
      let lastBotIndex = -1;
      // Add safety limit to prevent potential DoS from very large message array
      const MAX_ITERATIONS = 60;
      for (let i = state.messages.length - 1; i >= 0 && i >= state.messages.length - MAX_ITERATIONS; i--) {
        if (state.messages[i].sender === 'bot') {
          lastBotIndex = i;
          break;
        }
      }
      
      // If no bot message found, just add a new one
      if (lastBotIndex === -1) {
        const newMessage = {
          sender: 'bot',
          message: action.payload,
          timestamp: new Date(),
        };
        return {
          ...state,
          messages: [...state.messages, newMessage],
          typing: false,
        };
      }
      
      // Replace the last bot message
      const updatedMessages = [...state.messages];
      updatedMessages[lastBotIndex] = {
        ...updatedMessages[lastBotIndex],
        message: action.payload,
        timestamp: new Date(), // Update timestamp
      };
      
      return {
        ...state,
        messages: updatedMessages,
        typing: false,
      };
      
    default:
      return state;
  }
}

const CodingChat = ({ uuid, startTime }) => { 
  const Dispatch = useDispatch();  
  const { userInfo, setUserInfo, setSessionData, getSessionData } = useContext(AuthContext);  
  const { loading, chatLogTimestamps, chatLog: historicalChatLog, error } = useSelector((state) => state.getChatLog); 
  const [state, dispatch] = useReducer(reducer, initialState);  
  const candidateInputRef = useRef(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const chatListWrapperRef = useRef(null);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const [networkError, setNetworkError] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [responseText, setResponseText] = useState('');

  // Function to fetch chat log with retry mechanism
  const fetchChatLog = useCallback(async () => {
    if (userInfo && userInfo._id && uuid) {
      try {
        await Dispatch(getChatLog(userInfo._id, uuid));
        setNetworkError(false);
      } catch (error) {
        console.error("Error fetching chat log:", error);
        setNetworkError(true);

        // Auto-retry mechanism (max 3 attempts with exponential backoff)
        if (loadRetryCount < 3) {
          const retryDelay = Math.pow(2, loadRetryCount) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${retryDelay/1000} seconds...`);
          
          setTimeout(() => {
            setLoadRetryCount(prev => prev + 1);
            fetchChatLog();
          }, retryDelay);
        }
      }
    }
  }, [userInfo, Dispatch, uuid, loadRetryCount]);

  // Fetch chat log on component mount or when dependencies change
  useEffect(() => {
    fetchChatLog();
  }, [fetchChatLog]);
  
  // Retry button handler
  const handleRetry = () => {
    setLoadRetryCount(0);
    setNetworkError(false);
    fetchChatLog();
  };
  
  // Define combined messages first to avoid the ESLint warning and prevent duplicates
  const combinedMessages = useMemo(() => {    
    try {
      if (!Array.isArray(historicalChatLog) || historicalChatLog.length === 0) {
        return [...state.messages];
      }
      
      // Determine if we need to deduplicate messages by checking if the last history item
      // matches the first state message
      let localMessages = [...state.messages];
      
      // If we have both historical and local messages, check for duplicates
      if (historicalChatLog.length > 0 && localMessages.length > 0) {
        const lastHistoryItem = historicalChatLog[historicalChatLog.length - 1];
        const firstStateItem = localMessages[0];
        
        // Check if we have potential duplicates by comparing message content
        let potentialDuplicate = false;
        
        // Compare Interviewer/bot messages
        if (lastHistoryItem.Interviewer && firstStateItem.sender === 'bot') {
          potentialDuplicate = lastHistoryItem.Interviewer === firstStateItem.message;
        }
        // Compare Candidate/candidate messages
        else if (lastHistoryItem.Candidate && firstStateItem.sender === 'candidate') {
          potentialDuplicate = lastHistoryItem.Candidate === firstStateItem.message;
        }
        
        // If we found a duplicate, skip the first local message
        if (potentialDuplicate) {
          localMessages = localMessages.slice(1);
          console.log("Removed duplicate message between history and local state");
        }
      }
      
      return [
        ...historicalChatLog,
        ...localMessages
      ];
    } catch (error) {
      console.error("Error combining messages:", error);
      return [...state.messages]; // Fallback to just using state.messages
    }    
  }, [historicalChatLog, state.messages]);
  
  // Create a simplified timestamp function that always returns a string
  const getTimestamp = useCallback((timestamp) => {
    try {
      if (!timestamp) return "Unknown time";
      return moment(new Date(timestamp)).format('hh:mm A');
    } catch (error) {
      return "Unknown time";
    }
  }, []);
  
  // Create a simple array of timestamps that matches the length of combinedMessages
  const combinedTimestamps = useMemo(() => {
    try {
      // Generate a timestamp for each message
      return combinedMessages.map((msg, index) => {
        // For historical messages
        if (msg.Candidate || msg.Interviewer) {
          // Try to use the historical timestamp if available
          if (Array.isArray(chatLogTimestamps) && 
              chatLogTimestamps[index] && 
              Object.values(chatLogTimestamps[index])[0]) {
            return ""; // Just return empty string instead of trying to convert
          }
          return ""; // If no timestamp, return empty
        }
        
        // For live messages
        if (msg.timestamp) {
          return getTimestamp(msg.timestamp);
        }
        
        return "";
      });
    } catch (error) {
      console.error("Error generating timestamps:", error);
      // Return an array of empty strings matching the length of combinedMessages
      return Array(combinedMessages.length).fill("");
    }
  }, [combinedMessages, chatLogTimestamps, getTimestamp]);

  // State to track if we've shown a welcome message or received an initial question
  const [hasInitialQuestion, setHasInitialQuestion] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  
  // Ref to track if we've already initialized the session to prevent duplicate initialization
  const hasInitializedRef = useRef(false);
  
  // Initialize coding session with retry mechanism
  useEffect(() => {
    // Only attempt initialization if we don't have an initial question yet and we're not already loading something
    // and we haven't already tried to initialize
    if (userInfo && userInfo._id && uuid && !hasInitialQuestion && 
        !loading && !isWaitingForResponse && !hasInitializedRef.current) {
      
      // Mark that we've attempted initialization to prevent duplicate attempts
      hasInitializedRef.current = true;
      
      let retryCount = 0;
      let isInitializing = false;
      
      // Default welcome message if we can't get a real question
      const defaultWelcomeQuestion = "Welcome to your Python programming assessment! Please type 'Hello' to begin.";
      
      const initializeSession = async () => {
        if (isInitializing) return;
        isInitializing = true;
        
        try {
          setIsWaitingForResponse(true);
          dispatch({ type: 'typing' });
          
          let initialQuestion = await initializeCodingSession(
            userInfo.token, 
            userInfo._id, 
            uuid,
            userInfo.CSRF_token
          );
          
          // Filter out invalid responses with stronger validation
          if (!initialQuestion || initialQuestion === "No question available" || initialQuestion.trim() === "") {
            console.warn("Received invalid initial question:", initialQuestion);
            
            // Check if we have cached data first
            try {
              const cachedHistory = getSessionData(`codingChatHistory_${uuid}`);
              if (cachedHistory) {
                if (cachedHistory.initialQuestion && 
                    cachedHistory.initialQuestion !== "No question available" &&
                    cachedHistory.initialQuestion.trim() !== "") {
                  initialQuestion = cachedHistory.initialQuestion;
                  console.log("Using cached initial question instead of invalid response");
                } else {
                  // If cached data is invalid too, use our default welcome message
                  initialQuestion = defaultWelcomeQuestion;
                  console.log("Using default welcome message since both API and cache returned invalid responses");
                }
              } else {
                // No cache, use default welcome message
                initialQuestion = defaultWelcomeQuestion;
                console.log("Using default welcome message as no valid response or cache exists");
              }
            } catch (err) {
              console.warn("Failed to check cache for valid question:", err);
              initialQuestion = defaultWelcomeQuestion;
            }
          }
          
          // At this point initialQuestion should always have something valid
          dispatch({ type: 'bot-reply', payload: initialQuestion });
          setHasInitialQuestion(true);
          setShowWelcomeMessage(false);
          
          // Save first message to secure session data for recovery
          try {
            const sessionHistory = {
              initialQuestion,
              timestamp: new Date().toISOString()
            };
            setSessionData(`codingChatHistory_${uuid}`, sessionHistory);
          } catch (err) {
            console.warn('Failed to save chat history to session data:', err);
          }
          
          setNetworkError(false);
        } catch (error) {
          console.error("Failed to initialize coding session:", error);
          setNetworkError(true);
          
          // Auto-retry with exponential backoff
          if (retryCount < 3) {
            const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            retryCount++;
            
            console.log(`Retrying initialization in ${retryDelay/1000} seconds...`);
            setTimeout(() => {
              isInitializing = false;
              initializeSession();
            }, retryDelay);
          } else {
            // Try to recover from session data
            try {
              const cachedHistory = getSessionData(`codingChatHistory_${uuid}`);
              if (cachedHistory) {
                const { initialQuestion } = cachedHistory;
                if (initialQuestion && initialQuestion !== "No question available") {
                  dispatch({ type: 'bot-reply', payload: initialQuestion });
                  setHasInitialQuestion(true);
                  setShowWelcomeMessage(false);
                  console.log("Restored initial question from cache after retry failure");
                  setNetworkError(false);
                } else {
                  // If we can't get anything from cache, use default message
                  dispatch({ type: 'bot-reply', payload: defaultWelcomeQuestion });
                  setHasInitialQuestion(true);
                  setShowWelcomeMessage(false);
                }
              } else {
                // No cache available, use default message
                dispatch({ type: 'bot-reply', payload: defaultWelcomeQuestion });
                setHasInitialQuestion(true);
                setShowWelcomeMessage(false);
              }
            } catch (err) {
              console.warn("Failed to restore from cache:", err);
              // Use default message as last resort
              dispatch({ type: 'bot-reply', payload: defaultWelcomeQuestion });
              setHasInitialQuestion(true);
              setShowWelcomeMessage(false);
            }
          }
        } finally {
          setIsWaitingForResponse(false);
        }
      };
      
      initializeSession();
    }
  }, [userInfo, uuid, loading, isWaitingForResponse, dispatch, hasInitialQuestion]);

  // Define convertGMTToLocalTime above usage to avoid dependency error
  const convertGMTToLocalTime = useCallback((gmtTimeString) => {
    try {  
      const gmtMoment = moment.tz(gmtTimeString, 'hh:mm A', 'GMT');  
      return gmtMoment.tz(moment.tz.guess()).format('hh:mm A');
    } catch (error) {
      console.warn('Error converting time:', error);
      return 'Unknown time';
    }
  }, []);
  
  useLayoutEffect(() => {  
    const chatListElement = chatListWrapperRef.current;  
    if (chatListElement) {  
      chatListElement.scrollTop = chatListElement.scrollHeight;  
    }  
  }, [combinedMessages]);  

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = target.value.substring(0, start) + '\t' + target.value.substring(end);
      
      // For modal textarea
      if (showModal) {
        setResponseText(newValue);
        candidateInputRef.current.value = newValue;
      } 
      // For original textarea
      else {
        candidateInputRef.current.value = newValue;
      }
      
      // Set cursor position after tab
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      });
    }
  };

  // Format message to properly display code blocks - protected against null values
// Check message for conclusion message pattern
const checkConclusionMessage = useCallback((message) => {
  if (!message || typeof message !== 'string') return false;
  
  // The specific conclusion message we're looking for
  const conclusionMessage = "That concludes the coding assessment. Thank you for your time. Please close this session properly by clicking the END TEST button.";
  
  return message.includes(conclusionMessage);
}, []);

// Handle session completion when conclusion message is detected
const handleCodingSessionEnd = useCallback(() => {
  if (userInfo && userInfo._id && uuid) {
    const timestamp = new Date();
    var end_time = timestamp.toLocaleTimeString();
    
    // Mark interview as completed
    Dispatch(updateInterviewCompleted(userInfo._id, uuid, true, userInfo.CSRF_token, setUserInfo));
    Dispatch(updateInterviewStartEndTime(userInfo._id, uuid, '00:00:00 AM', end_time, userInfo));
    
    // Update session state
    setSessionEnded(true);
  }
}, [Dispatch, userInfo, uuid, setUserInfo]);

const formatMessageWithCodeBlocks = useCallback((message) => {
  if (!message) return '';
  
  try {
    // Helper function to preserve whitespace in text (convert \n to <br> and preserve spaces/tabs)
    const preserveWhitespace = (text) => {
      if (!text) return '';
      
      // First replace all literal "\n" and "\t" strings with actual newlines and tabs
      const replacedLiterals = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r');
      
      // Then handle actual newlines and tabs for display
      return replacedLiterals
        .split('\n')
        .map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line.replace(/\t/g, '    ')} {/* Replace tabs with 4 spaces */}
          </React.Fragment>
        ));
    };

    // New enhanced code block handling
    const processMessageWithCodeBlocks = (msg) => {
      if (typeof msg !== 'string') return preserveWhitespace(msg);
      
      // If the message doesn't contain triple backticks, process normally
      if (!msg.includes('```')) return preserveWhitespace(msg);
      
      // The pattern to match code blocks (``` ... ```) including the language identifier
      const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
      let lastIndex = 0;
      let match;
      const result = [];
      let counter = 0;
      
      // Process the message to extract code blocks and regular text
      while ((match = codeBlockRegex.exec(msg)) !== null) {
        // Add the text before the code block
        if (match.index > lastIndex) {
          const textBeforeBlock = msg.substring(lastIndex, match.index);
          result.push(
            <span key={`text-${counter}`}>
              {preserveWhitespace(textBeforeBlock)}
            </span>
          );
          counter++;
        }
        
        // Get the language (if specified) and the code content
        const language = match[1] || '';
        let codeContent = match[2] || '';
        
        // Process escape sequences in code blocks
        codeContent = codeContent
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r');
        
        // Add the code block with appropriate styling
        result.push(
          <div key={`code-${counter}`} className="code-block-container">
            {language && 
              <div className="code-language-indicator">
                {language}
              </div>
            }
            <pre className={`code-block ${language ? `language-${language}` : ''}`}>
              {codeContent}
            </pre>
          </div>
        );
        counter++;
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add any remaining text after the last code block
      if (lastIndex < msg.length) {
        result.push(
          <span key={`text-${counter}`}>
            {preserveWhitespace(msg.substring(lastIndex))}
          </span>
        );
      }
      
      return result;
    };
    
    // Process the message with our enhanced code block handler
    return processMessageWithCodeBlocks(message);
  } catch (error) {
    console.warn('Error formatting message with code blocks:', error);
    // Return message as plain text as fallback
    return String(message);
  }
}, []);

async function sendChatWithMessage(message) {
  setIsWaitingForResponse(true);
  
  // Mark that we have interaction to prevent "No question available" flashes
  setHasInitialQuestion(true);
  
  // When the user sends a message, we no longer need the welcome message
  setShowWelcomeMessage(false);
  
  // Save the user message to session data immediately
  try {
    const userMessage = {
      message, 
      timestamp: new Date().toISOString(),
      sender: 'candidate'
    };
    
    // Get existing messages first
    const savedMessages = getSessionData(`codingChatMessages_${uuid}`) || [];
    savedMessages.push(userMessage);
    
    setSessionData(`codingChatMessages_${uuid}`, savedMessages);
  } catch (err) {
    console.warn('Failed to save message to session data:', err);
  }

  // Process message
  let retryCount = 0;
  const maxRetries = 2;
  let success = false;
  
  // Default fallback response in case of failures
  const fallbackResponse = "I'm sorry, we're having trouble processing your response. Please try again or contact support if the problem persists.";
  
  // Display candidate message immediately
  dispatch({ type: 'candidate-message', payload: message });
  
  while (retryCount <= maxRetries && !success) {
    try {
      dispatch({ type: 'typing' });
      
      const botResponse = await GenerateCodingQues(userInfo.token, userInfo._id, uuid, message, userInfo.CSRF_token);
      
      // Handle invalid responses with stronger validation
      if (!botResponse || botResponse === "No question available" || botResponse.trim() === "") {
        console.warn("Invalid response received:", botResponse);
        retryCount++;
        
        // Don't clear typing status until we've tried all retries
        if (retryCount <= maxRetries) {
          console.log(`Retrying message send, attempt ${retryCount} of ${maxRetries}`);
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, retryCount-1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // All retries failed, check if we have previous messages to understand context
        try {
          const savedMessages = getSessionData(`codingChatMessages_${uuid}`) || [];
          
          // If this isn't the first message (i.e., there are at least 2 previous messages)
          if (savedMessages.length >= 2) {
            // Look for the last valid bot response
            let lastBotMessage = null;
            for (let i = savedMessages.length - 1; i >= 0; i--) {
              if (savedMessages[i].sender === 'bot' && 
                  savedMessages[i].message && 
                  savedMessages[i].message !== "No question available") {
                lastBotMessage = savedMessages[i].message;
                break;
              }
            }
            
            // If we found a valid previous bot message, use it as context for a generic response
            if (lastBotMessage) {
              dispatch({ type: 'bot-reply', payload: `Thank you for your submission. Please provide any additional details or ask another question to continue.` });
              success = true;
              break;
            }
          }
        } catch (err) {
          console.warn("Error checking message history for context:", err);
        }
        
        // If we can't find a good contextual response, use the fallback
        dispatch({ type: 'bot-reply', payload: fallbackResponse });
        break;
      }

      // Clean up any numbering prefixes and ensure response is valid
      const bot_response = botResponse.replace(/^(\d+\.\s*)/g, '').trim();
      
      if (bot_response && bot_response !== "No question available") {
        // Send valid response to chat
        dispatch({ type: 'bot-reply', payload: bot_response });
        
        // Check if this is the conclusion message and automatically end the session if it is
        if (checkConclusionMessage(bot_response)) {
          handleCodingSessionEnd();
        }
        
        // Save bot response to session data
        try {
          const botMessage = {
            message: bot_response,
            timestamp: new Date().toISOString(),
            sender: 'bot'
          };
          
          // Get existing messages first
          const savedMessages = getSessionData(`codingChatMessages_${uuid}`) || [];
          savedMessages.push(botMessage);
          
          setSessionData(`codingChatMessages_${uuid}`, savedMessages);
        } catch (err) {
          console.warn('Failed to save bot response to session data:', err);
        }
      } else {
        // This case shouldn't happen due to earlier validation, but just in case
        dispatch({ type: 'bot-reply', payload: fallbackResponse });
      }
      
      success = true;
      setNetworkError(false);
    } catch (error) {
      console.error("Error in sending message:", error);
      retryCount++;
      
      if (retryCount > maxRetries) {
        setNetworkError(true);
        dispatch({ type: 'clear-typing' });
        swal({
          title: "Communication Error",
          text: "An error occurred while processing your response. Your message has been saved and will be submitted when the connection is restored.",
          icon: "error",
          buttons: {
            retry: {
              text: "Retry Now",
              value: "retry",
            },
            ok: {
              text: "OK",
              value: "ok",
            },
          },
        }).then((value) => {
          if (value === "retry") {
            sendChatWithMessage(message);
          }
        });
      } else {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } 
  }
  
  setIsWaitingForResponse(false);
}

// Keep this for backward compatibility
async function sendChat() {
  if (isWaitingForResponse) {
    swal({
      title: "Please wait",
      text: "Please wait for a response before sending another message",
      icon: "warning",
    });
    return;
  }
  let a = candidateInputRef.current.value;
  if (a === '') {
    swal({
      title: "Empty Response", 
      text: "Your response should not be empty.",
      icon: "error",
    });
    return;
  }    
  
  sendChatWithMessage(a);
  candidateInputRef.current.value = '';
}

  // Track whether we've already attempted to recover messages
  const hasAttemptedRecovery = useRef(false);
  
  // Load cached messages on error or recovery mode
  useEffect(() => {
    // Only recover messages if we haven't already AND there was an error OR no messages are available
    const shouldRecoverMessages = !hasAttemptedRecovery.current && 
      (error || (combinedMessages.length === 0 && !loading));
    
    if (shouldRecoverMessages) {
      // Mark that we've attempted recovery to prevent duplicate loading
      hasAttemptedRecovery.current = true;
      
      try {
        console.log("Attempting to recover messages from cache");
        
        // Try to load messages from session data
        const savedMessages = getSessionData(`codingChatMessages_${uuid}`);
        if (savedMessages) {
          
          if (Array.isArray(savedMessages) && savedMessages.length > 0) {
            console.log(`Found ${savedMessages.length} messages in cache`);
            
            // Check if any messages are already in the combined messages array
            // This helps avoid adding duplicates
            const existingMessages = new Set();
            
            combinedMessages.forEach(msg => {
              if (msg.Interviewer) existingMessages.add(msg.Interviewer);
              if (msg.Candidate) existingMessages.add(msg.Candidate);
              if (msg.message) existingMessages.add(msg.message);
            });
            
            // Add each cached message to the state, skipping duplicates
            let addedCount = 0;
            savedMessages.forEach(msg => {
              if (msg && msg.message && !existingMessages.has(msg.message)) {
                if (msg.sender === 'candidate') {
                  dispatch({ type: 'candidate-message', payload: msg.message });
                  addedCount++;
                } else if (msg.sender === 'bot') {
                  dispatch({ type: 'bot-reply', payload: msg.message });
                  addedCount++;
                }
                // Add the message to the set to avoid adding it again
                existingMessages.add(msg.message);
              }
            });
            
            console.log(`Added ${addedCount} unique messages from cache`);
            
            // If we have messages, we don't need the welcome message anymore
            if (addedCount > 0) {
              setShowWelcomeMessage(false);
              setHasInitialQuestion(true);
            }
          }
        } else if (!loading) {
          // If no saved messages and not loading, check for initial question
          const cachedHistory = getSessionData(`codingChatHistory_${uuid}`);
          if (cachedHistory) {
            try {
              const { initialQuestion } = cachedHistory;
              // Only add the initial question if there are no messages yet
              if (initialQuestion && combinedMessages.length === 0) {
                dispatch({ type: 'bot-reply', payload: initialQuestion });
                setHasInitialQuestion(true);
                console.log("Restored initial question from cache");
              }
            } catch (err) {
              console.warn("Failed to restore initial question from cache:", err);
            }
          }
        }
      } catch (err) {
        console.warn("Error restoring cached messages:", err);
      }
    }
  }, [error, combinedMessages.length, uuid, dispatch, loading, combinedMessages]);

  // Effect to update welcome message state when messages are added
  useEffect(() => {
    if (combinedMessages.length > 0) {
      setShowWelcomeMessage(false);
    }
  }, [combinedMessages]);

  // Determine whether to show welcome message based on various conditions
  const displayWelcomeMessage = useMemo(() => {
    // Don't show welcome message if we have any messages
    if (combinedMessages.length > 0) return false;
    
    // Don't show welcome message if user explicitly hid it or has initial question
    if (!showWelcomeMessage || hasInitialQuestion) return false;
    
    // Don't show welcome message if we're loading or there's a network error
    if (loading || networkError || error) return false;
    
    // Otherwise, show the welcome message
    return true;
  }, [combinedMessages.length, showWelcomeMessage, hasInitialQuestion, loading, networkError, error]);
  
  return (
    <div className="chat-container">  
      <div className="chat-list-wrapper" ref={chatListWrapperRef}>  
        <div className="chat-list">  
          {loading && !networkError ? (      
            <div className="coding-welcome-message" style={{ whiteSpace: 'pre-line' }}>
              <h4>Loading Your Session</h4>
              <p><FontAwesomeIcon icon={faCircleNotch} spin /> Please wait while we prepare your coding assessment...</p>
            </div>      
          ) : networkError && combinedMessages.length === 0 ? (
            <div className="network-error-message" style={{ padding: '20px' }}>
              <h3>Connection Error</h3>
              <p>Having trouble connecting to the server. Your responses are saved locally and will be submitted when connection is restored.</p>
              <Button 
                variant="primary" 
                onClick={handleRetry}
                style={{ marginTop: '10px' }}
              >
                Retry Connection
              </Button>
            </div>
          ) : error && combinedMessages.length === 0 ? (      
            <div className="coding-welcome-message" style={{ whiteSpace: 'pre-line' }}>
              <h4>Oops! Something went wrong</h4>
              <p>We encountered an error loading your coding session.</p>
              <Button 
                variant="link" 
                onClick={handleRetry}
                style={{ marginTop: '10px' }}
              >
                Try Again
              </Button>
            </div>      
          ) : displayWelcomeMessage ? (<></>
          ) : (  
            // Deduplicate messages before rendering to avoid duplicates
            combinedMessages
            .reduce((acc, entry, idx, arr) => {
              // If this is a duplicate of a previous message, don't include it
              if (idx > 0) {
                const prevEntry = arr[idx-1];
                // Check for duplicates between Candidate/candidate
                if (entry.Candidate && prevEntry) {
                  if ((prevEntry.Candidate && entry.Candidate === prevEntry.Candidate) ||
                      (prevEntry.sender === 'candidate' && prevEntry.message === entry.Candidate)) {
                    return acc;
                  }
                }
                // Check for duplicates between Interviewer/bot
                if (entry.Interviewer && prevEntry) {
                  if ((prevEntry.Interviewer && entry.Interviewer === prevEntry.Interviewer) ||
                      (prevEntry.sender === 'bot' && prevEntry.message === entry.Interviewer)) {
                    return acc;
                  }
                }
                // Check for duplicates between message objects
                if (entry.message && prevEntry) {
                  if ((prevEntry.message && entry.message === prevEntry.message && entry.sender === prevEntry.sender) ||
                      (prevEntry.Candidate && entry.sender === 'candidate' && entry.message === prevEntry.Candidate) ||
                      (prevEntry.Interviewer && entry.sender === 'bot' && entry.message === prevEntry.Interviewer)) {
                    return acc;
                  }
                }
              }
              // If not a duplicate, include it
              return [...acc, entry];
            }, [])
            .map((entry, index) => {
              try {
                let sender = '';      
                let message = '';      
                let timestamp = ''; // Will look up the timestamp based on content later
                  
                if (entry && entry.Candidate) {      
                  sender = 'candidate';      
                  message = entry.Candidate;      
                } else if (entry && entry.Interviewer) {      
                  sender = 'bot';      
                  message = entry.Interviewer;   
                } else if (entry && entry.sender && entry.message) { 
                  sender = entry.sender;    
                  message = entry.message;    
                }
                
                // Find the appropriate timestamp for this message
                // We need to search based on content since our index may have changed due to deduplication
                for (let i = 0; i < combinedMessages.length; i++) {
                  const msg = combinedMessages[i];
                  if ((msg.Candidate && sender === 'candidate' && msg.Candidate === message) ||
                      (msg.Interviewer && sender === 'bot' && msg.Interviewer === message) ||
                      (msg.sender === sender && msg.message === message)) {
                    timestamp = combinedTimestamps[i] || '';
                    break;
                  }
                }
                
                // Skip rendering if we don't have a valid message or message contains "No question available"
                if (!message || (typeof message === 'string' && message.includes("No question available"))) {
                  return null;
                }
                
                // Pre-process message to handle escaped characters in all messages
                // This ensures that any escaped sequences like \n or \t are correctly interpreted
                try {
                  if (typeof message === 'string') {
                    // Don't apply this preprocessing for messages that already have actual newlines
                    // This avoids double-processing messages that have already been properly formatted
                    if (!message.includes('\n') && message.includes('\\n')) {
                      message = JSON.parse(`"${message.replace(/"/g, '\\"')}"`);
                    }
                  }
                } catch (err) {
                  console.warn('Error pre-processing message:', err);
                  // Continue with the original message if pre-processing fails
                }
                
                // Format message to properly display code blocks - with error handling
                let formattedMessage;
                try {
                  formattedMessage = formatMessageWithCodeBlocks(message);
                } catch (err) {
                  console.warn('Error formatting message:', err);
                  formattedMessage = String(message);
                }
              
                return (      
                  <div key={index} className={`chat-message ${sender}`}>      
                    <div className="message-text">{formattedMessage}</div>       
                    {timestamp && <div className="timestamp">{timestamp}</div>}     
                  </div>      
                ); 
              } catch (error) {
                console.warn(`Error rendering message at index ${index}:`, error);
                return null;
              }
            }).filter(Boolean) // Remove any null entries  
          )}  

          {state.typing && <code className="code">Loading <FontAwesomeIcon icon={faCircleNotch} spin /></code>}
          {networkError && combinedMessages.length > 0 && (
            <div className="network-status-indicator">
              <span>Network issue detected - messages saved locally</span>
              <Button 
                variant="link" 
                size="sm"
                onClick={handleRetry}
              >
                Retry
              </Button>
            </div>
          )}
          
          {/* Show empty state if no messages and welcome message is hidden */}
          {combinedMessages.length === 0 && !displayWelcomeMessage && !loading && !networkError && !error && !state.typing && (
            <div className="no-messages-placeholder">
              <p>Type "Hello" below to begin your coding assessment</p>
            </div>
          )}
        </div>  
      </div>
      
      <EnhancedCodingInput 
        onSendMessage={(message) => {
          if (isWaitingForResponse) {
            swal({
              title: "Please wait",
              text: "Please wait for a response before sending another message",
              icon: "warning",
            });
            return;
          }
          
          if (!message.trim()) {
            swal({
              title: "Empty Response", 
              text: "Your response should not be empty.",
              icon: "error",
            });
            return;
          }
          
          // Even if welcome message is showing, hide it when sending a message
          setShowWelcomeMessage(false);
          
          sendChatWithMessage(message);
        }}
        isWaitingForResponse={isWaitingForResponse}
        sessionEnded={sessionEnded}
      />
    </div>   
  );
};

export default CodingChat;