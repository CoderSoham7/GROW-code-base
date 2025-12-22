import React, { useState, useReducer, useEffect, useContext, useRef, useLayoutEffect, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReadBotText from '../../Actions/ReadBotText';
import {Button} from "react-bootstrap";
import VoiceRecorder from './VoiceRecorder';
import GenerateInterviewQues from '../../Actions/GenerateInterviewQues';
import { faCircleNotch, faExpand, faPaperPlane, faUpRightAndDownLeftFromCenter } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { AuthContext } from '../AuthContext';
import ChatContext from './ChatContext';
import { getChatLog } from '../../Actions/UserActions';
import moment from 'moment';
import swal from 'sweetalert'; 

const initialState = {
  messages: [],
  sender: '',
  typing: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'candidate-message':
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
    default:
      return state;
  }
}

const Chat = ({ setchatComponentAllowsEnd, uuid, startTime }) => { 
  const Dispatch = useDispatch();  
  const { userInfo } = useContext(AuthContext);  
  const { loading, chatLogTimestamps, chatLog: historicalChatLog, error } = useSelector((state) => state.getChatLog); 
  const [state, dispatch] = useReducer(reducer, initialState);  
  const candidateTxt = React.createRef();  
  const [wasCopyButtonClicked, setWasCopyButtonClicked] = useState(false);  
  const [copiedTranscriptText, setCopiedTranscriptText] = useState('');
  const [audiourl, setaudiourl] = useState("");  
  const audioRef = useRef(null);  
  const chatListWrapperRef = useRef(null);    
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const [showModal, setShowModal] = useState(false);
const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (userInfo && userInfo._id && uuid) {
      Dispatch(getChatLog(userInfo._id, uuid));
    }
  }, [userInfo, Dispatch, uuid]);
  
  useEffect(() => {
    const startMoment = moment(startTime, "hh:mm:ss A");
    const now = moment();
    const diffInMilliseconds = now.diff(startMoment);
    const endTimerMinuteInMilliseconds = 30 * 60 * 1000;

    if (diffInMilliseconds >= endTimerMinuteInMilliseconds) {
      setchatComponentAllowsEnd(true);
    } else {
      const timeoutId = setTimeout(() => {
        setchatComponentAllowsEnd(true);
      }, endTimerMinuteInMilliseconds - diffInMilliseconds);

      return () => clearTimeout(timeoutId);
    }
  }, [startTime]);

  const convertGMTToLocalTime = (gmtTimeString) => {  
    const gmtMoment = moment.tz(gmtTimeString, 'hh:mm A', 'GMT');  
    return gmtMoment.tz(moment.tz.guess()).format('hh:mm A');  
  };  
  
  const combinedMessages = useMemo(() => {    
    return [    
      ...(historicalChatLog || []),    
      ...state.messages,    
    ];    
  }, [historicalChatLog, state.messages]);   
  
  const combinedTimestamps = useMemo(() => {  
    const historicalTimestamps = (chatLogTimestamps || []).map((timestampEntry) => {  
      const timestampTime = Object.values(timestampEntry)[0];
      return convertGMTToLocalTime(timestampTime);  
    });  
    
    const liveTimestamps = state.messages.map((message) => {  
      return moment(message.timestamp).format('hh:mm A');  
    });  
    
    return [...historicalTimestamps, ...liveTimestamps];  
  }, [chatLogTimestamps, state.messages]);
    
  useEffect(() => {  
    if (audiourl && audioRef.current) {  
      audioRef.current.play();  
    }  
  }, [audiourl]);  
  
  useLayoutEffect(() => {  
    const chatListElement = chatListWrapperRef.current;  
    if (chatListElement) {  
      chatListElement.scrollTop = chatListElement.scrollHeight;  
    }  
  }, [combinedMessages]);  

  /*
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = candidateTxt.current;
      candidateTxt.current.value =
      candidateTxt.current.value.substring(0, selectionStart) +
        '\t' +
        candidateTxt.current.value.substring(selectionEnd);
    }
  };
  */

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
        candidateTxt.current.value = newValue;
      } 
      // For original textarea
      else {
        candidateTxt.current.value = newValue;
      }
      
      // Set cursor position after tab
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      });
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const currentTextAreaValue = candidateTxt.current.value;
    
    // Check if the pasted content is from within the textarea
    if (currentTextAreaValue.includes(pastedText) || 
        pastedText.trim() === copiedTranscriptText.trim()) {
      // Get cursor position
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // Insert pasted text at cursor position
      const newValue = 
        currentTextAreaValue.substring(0, start) + 
        pastedText + 
        currentTextAreaValue.substring(end);
      
      candidateTxt.current.value = newValue;
    } else {
      swal({
        title: "Integrity Violation Detected", 
        text: "You are attempting to paste text from an external source. This interview platform is designed to evaluate your authentic communication skills. Please only paste the transcript generated from your voice recording. Attempting to circumvent the interview process may impact your evaluation.",
        icon: "error",
        buttons: {
          confirm: {
            text: "I Understand",
            visible: true,
            className: "btn-danger"
          }
        },
        dangerMode: true
      });
    }
  };

  async function sendChat() {
    if (isWaitingForResponse) {
      swal({
        title: "Multiple responses not allowed",
        text: "Please respond after the question arrives. If unable to see question, refresh page and ensure question exists before answering it.",
        icon: "warning",
      });
      return;
    }
    let a = candidateTxt.current.value;
    if (a === '') {
      swal({
        title: "Empty Response", 
        text: "Your response should not be empty.",
        icon: "error",
      });
      return;
    }    
    setIsWaitingForResponse(true);
  
    try {
      dispatch({ type: 'candidate-message', payload: a }); 
      candidateTxt.current.value = '';
      candidateTxt.current.focus();
      dispatch({ type: 'typing' });
      
      const botques = await GenerateInterviewQues(userInfo.token, userInfo._id, uuid, a, userInfo.CSRF_token);
      if (!botques) return;
  
      const bot_ques = botques.replace(/^(\d+\.\s*)/g, '');
      
      dispatch({ type: 'typing' });
      const newAudiourl = await ReadBotText(userInfo.token, bot_ques);    
      if (newAudiourl) {
        setaudiourl(newAudiourl);
      }
      setWasCopyButtonClicked(false);
      dispatch({ type: 'bot-reply', payload: bot_ques });   
    } catch (error) {
      console.error("Error in sending chat");
      swal({
        title: "Communication Error",
        text: "An error occurred while processing your response. Please check your internet connection and try again.",
        icon: "error",
      });
    } finally {
      setIsWaitingForResponse(false);
    }
  }

  return (
    <ChatContext.Provider value={candidateTxt}>    
      <div className="chat-container">  
        <div className="chat-list-wrapper" ref={chatListWrapperRef}>  
          <div className="chat-list">  
            {loading ? (      
              <div className="interview-welcome-message" style={{ whiteSpace: 'pre-line' }}>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>      
                ) : error ? (      
                  <div className="interview-welcome-message" style={{ whiteSpace: 'pre-line' }}>Oops! Something went wrong.</div>      
                ) : combinedMessages.length === 0 ? ( 
                  <div className="interview-welcome-message" style={{ whiteSpace: 'pre-line' }}>  
                    Welcome to your interview! Say "Hello" into the microphone to initiate the interview.  
                  </div>  
                ) :  (  
                  combinedMessages.map((entry, index) => {  
                    let sender = '';      
                    let message = '';      
                    let timestamp = combinedTimestamps[index]; 
                      
                    if (entry.Candidate) {      
                      sender = 'candidate';      
                      message = entry.Candidate;      
                    } else if (entry.Interviewer) {      
                      sender = 'bot';      
                      message = entry.Interviewer;   
                    } else if (entry.sender && entry.message) { 
                      sender = entry.sender;    
                      message = entry.message;    
                    }  
                  
                    return (      
                      <div key={index} className={`chat-message ${sender}`} style={{ whiteSpace: sender === 'candidate' ? "pre-wrap" : "pre-line" }}>      
                        <div className="message-text">{message}</div>       
                        <div className="timestamp">{timestamp}</div>  
                        <audio ref={audioRef} src={audiourl} style={{ display: 'none' }} controls />     
                      </div>      
                    );      
                  })  
                )}  
 
            {state.typing && <code className="code">Responding <FontAwesomeIcon icon={faCircleNotch} spin /></code>}  
          </div>  
        </div>  
        <VoiceRecorder 
          onCopy={(wasClicked, copiedText) => {
            setWasCopyButtonClicked(wasClicked);
            setCopiedTranscriptText(copiedText);
          }}
        />
        <div id="tts-aria" className="form-text mx-3" style={{marginTop: "-0.30rem"}}>  
          <b>STEP 2:</b> Edit transcript in below text-area. Click send when ready. <br/>
          <b>STEP 3:</b> Send a response. Wait for the question to arrive. Then give next response.
        </div>    
        <form className="chat-controls" onSubmit={(e) => e.preventDefault()}>  
          <div className="tts-card" aria-describedby="tts-aria">  
              <div className="paste-button-div">
              <Button 
                className="expand-response-btn"
                onClick={() => {
                  setResponseText(candidateTxt.current.value);
                  setShowModal(true);
                }}
                disabled={!wasCopyButtonClicked}
              >
                <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />&nbsp;&nbsp;See Full Response
              </Button>

              {showModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-instruction">
                      Edit your response here - changes will be saved automatically
                    </div>
                    <textarea
                      value={responseText}
                      onChange={(e) => {
                        setResponseText(e.target.value);
                        candidateTxt.current.value = e.target.value;
                      }}
                      className="modal-textarea"
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                    />
                    <button 
                      className="close-response-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Save Response
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="textarea-container">  
              <div className="pull-tab"></div>  
                <textarea   
                  id="chatbot-input"   
                  className="chatbot-input"   
                  ref={candidateTxt}   
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}  
                  placeholder="Your response..."  
                  disabled={!wasCopyButtonClicked}  
                ></textarea> 
              </div>  
            </div>   
          <Button   
              id="send-chat-button"  
              variant='outline-light'  
              className='chat-send-btn mb-4 mt-2'  
              size='md'  
              disabled={isWaitingForResponse}  
              onClick={() => sendChat()}>  
                  <FontAwesomeIcon icon={faPaperPlane} />   
          </Button>  
        </form>   
      </div>   
    </ChatContext.Provider>
  );
};

export default Chat;