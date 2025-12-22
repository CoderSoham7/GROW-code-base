import React, { useState, useRef, useEffect } from 'react';
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faUpRightAndDownLeftFromCenter, faPaperPlane, faExpand } from '@fortawesome/free-solid-svg-icons';
import swal from 'sweetalert';

const EnhancedCodingInput = ({ onSendMessage, isWaitingForResponse, sessionEnded }) => {
  const [subjectiveText, setSubjectiveText] = useState('');
  const [codeSnippets, setCodeSnippets] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [currentCodeSnippet, setCurrentCodeSnippet] = useState('');
  const [editingSnippetIndex, setEditingSnippetIndex] = useState(null);
  const [showFullView, setShowFullView] = useState(false);
  const [allowedContent, setAllowedContent] = useState([]);
  
  const subjectiveInputRef = useRef(null);
  const codeEditorRef = useRef(null);
  const fullViewInputRef = useRef(null);
  
  // Handle code editor tab key
  const handleCodeEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = target.value.substring(0, start) + '  ' + target.value.substring(end);
      setCurrentCodeSnippet(newValue);
      
      // Set cursor position after tab
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };
  
  // Handle subjective input tab key
  const handleSubjectiveInputKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = target.value.substring(0, start) + '  ' + target.value.substring(end);
      setSubjectiveText(newValue);
      
      // Set cursor position after tab
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };
  
  // Add a code snippet
  const addCodeSnippet = () => {
    setShowCodeModal(true);
    setCurrentCodeSnippet('');
    setEditingSnippetIndex(null);
  };
  
  // Edit an existing code snippet
  const editCodeSnippet = (index) => {
    setShowCodeModal(true);
    setCurrentCodeSnippet(codeSnippets[index]);
    setEditingSnippetIndex(index);
  };
  
  // Save code snippet from modal
  const saveCodeSnippet = () => {
    if (editingSnippetIndex !== null) {
      // Update existing snippet
      const updatedSnippets = [...codeSnippets];
      updatedSnippets[editingSnippetIndex] = currentCodeSnippet;
      setCodeSnippets(updatedSnippets);
    } else {
      // Add new snippet
      setCodeSnippets([...codeSnippets, currentCodeSnippet]);
    }
    
    setShowCodeModal(false);
    setCurrentCodeSnippet('');
    setEditingSnippetIndex(null);
  };
  
  // Remove a code snippet
  const removeCodeSnippet = (index) => {
    const updatedSnippets = codeSnippets.filter((_, i) => i !== index);
    setCodeSnippets(updatedSnippets);
  };
  
  // Compile final message with subjective text and code snippets
  const compileFinalMessage = () => {
    let finalMessage = subjectiveText;
    
    if (codeSnippets.length > 0) {
      codeSnippets.forEach((snippet, index) => {
        finalMessage += `\n\n\`\`\`\n${snippet}\n\`\`\`\n`;
      });
    }
    
    return finalMessage;
  };
  
  // Send the message
  const handleSendMessage = () => {
    const message = compileFinalMessage();
    
    if (!message.trim()) {
      alert("Your response should not be empty.");
      return;
    }
    
    onSendMessage(message);
    setSubjectiveText('');
    setCodeSnippets([]);
  };

  // Open full view modal
  const openFullView = () => {
    setShowFullView(true);
  };

  // Close full view modal and save changes
  const closeFullView = () => {
    setShowFullView(false);
  };
  
  // Focus on subjective input when component mounts
  useEffect(() => {
    if (subjectiveInputRef.current) {
      subjectiveInputRef.current.focus();
    }
  }, []);

  // Focus on code editor when modal opens
  useEffect(() => {
    if (showCodeModal && codeEditorRef.current) {
      codeEditorRef.current.focus();
    }
  }, [showCodeModal]);

  // Focus on full view textarea when modal opens
  useEffect(() => {
    if (showFullView && fullViewInputRef.current) {
      fullViewInputRef.current.focus();
    }
  }, [showFullView]);
  
  // Handle paste event to prevent external content
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    
    // Check if the pasted content is from within our allowed content
    const isInternalContent = allowedContent.some(content => {
      // Use loose comparison to allow for minor whitespace differences
      return content.trim() === pastedText.trim() || 
             subjectiveText.includes(pastedText) ||
             codeSnippets.some(snippet => snippet.includes(pastedText));
    });
    
    if (isInternalContent) {
      // Handle for different target areas
      if (e.target === subjectiveInputRef.current || e.target === fullViewInputRef.current) {
        const target = e.target;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        
        // For subjective input
        const newValue = target.value.substring(0, start) + pastedText + target.value.substring(end);
        setSubjectiveText(newValue);
        
        // Set cursor position after pasted text
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + pastedText.length;
        });
      } else if (showCodeModal) {
        // For code editor
        const start = codeEditorRef.current.selectionStart;
        const end = codeEditorRef.current.selectionEnd;
        
        const newValue = currentCodeSnippet.substring(0, start) + 
                         pastedText + 
                         currentCodeSnippet.substring(end);
                         
        setCurrentCodeSnippet(newValue);
        
        // Set cursor position after pasted text
        requestAnimationFrame(() => {
          codeEditorRef.current.selectionStart = 
          codeEditorRef.current.selectionEnd = start + pastedText.length;
        });
      }
    } else {
      swal({
        title: "Integrity Violation Detected", 
        text: "External pasting is not allowed in the coding assessment. Please type your solution directly into the editor to maintain assessment integrity.",
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
  
  // Track content changes to update allowed content for paste functionality
  useEffect(() => {
    // Add current content to allowed content
    if (subjectiveText.trim()) {
      setAllowedContent(prev => [...prev, subjectiveText]);
    }
  }, [subjectiveText]);
  
  // Track code snippet changes for paste protection
  useEffect(() => {
    // Add code snippets to allowed content
    const newAllowedContent = [];
    codeSnippets.forEach(snippet => {
      if (snippet.trim()) {
        newAllowedContent.push(snippet);
      }
    });
    
    if (newAllowedContent.length > 0) {
      setAllowedContent(prev => [...prev, ...newAllowedContent]);
    }
  }, [codeSnippets]);
  
  return (
    <div className="enhanced-coding-input">
      <div className="coding-input-header">
        <span className="coding-input-label">Type your answer here</span>
        <Button 
          className="expand-response-btn"
          onClick={openFullView}
          disabled={isWaitingForResponse}
        >
          <FontAwesomeIcon icon={faExpand} />&nbsp;&nbsp;Full View
        </Button>
      </div>

      <div className="subjective-input-container">
        <textarea
          className="subjective-input"
          placeholder={sessionEnded ? "Session has ended. Please click END TEST." : "Type your answer here..."}
          value={subjectiveText}
          onChange={(e) => setSubjectiveText(e.target.value)}
          onKeyDown={handleSubjectiveInputKeyDown}
          onPaste={handlePaste}
          ref={subjectiveInputRef}
          disabled={sessionEnded}
        />
        {sessionEnded && (
          <div className="session-ended-message">
            Session completed. Please click the END TEST button to submit your solution.
          </div>
        )}
      </div>
      
      <div className="code-snippets-container">
        {codeSnippets.map((snippet, index) => (
          <div key={index} className="code-snippet-preview">
            <div className="code-snippet-header">
              <span>Code Snippet {index + 1}</span>
              <div>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => editCodeSnippet(index)}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => removeCodeSnippet(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
            <pre className="code-snippet-content">{snippet}</pre>
          </div>
        ))}
      </div>
      
      <div className="input-actions">
        <Button 
          variant="outline-secondary" 
          onClick={addCodeSnippet}
          disabled={isWaitingForResponse || sessionEnded}
        >
          <FontAwesomeIcon icon={faCode} />&nbsp;Add Code
        </Button>
        <Button 
          variant="outline-light" 
          className="chat-send-btn" 
          onClick={handleSendMessage}
          disabled={isWaitingForResponse || sessionEnded}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </Button>
      </div>
      
      {/* Code Editor Modal */}
      {showCodeModal && (
        <div className="code-modal-overlay">
          <div className="code-modal-content">
            <div className="code-modal-header">
              {editingSnippetIndex !== null ? 'Edit Code Snippet' : 'Add Code Snippet'}
            </div>
            <textarea
              ref={codeEditorRef}
              value={currentCodeSnippet}
              onChange={(e) => setCurrentCodeSnippet(e.target.value)}
              className="code-editor"
              onKeyDown={handleCodeEditorKeyDown}
              onPaste={handlePaste}
              placeholder="// Write your code here..."
              style={{ fontFamily: 'monospace' }}
            />
            <div className="code-modal-actions">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowCodeModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={saveCodeSnippet}
              >
                Save Code
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full View Modal */}
      {showFullView && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-instruction">
              Edit your response here - changes will be saved automatically
            </div>
            <textarea
              ref={fullViewInputRef}
              value={subjectiveText}
              onChange={(e) => setSubjectiveText(e.target.value)}
              className="modal-textarea"
              onKeyDown={handleSubjectiveInputKeyDown}
              onPaste={handlePaste}
              placeholder="Type your answer here..."
            />
            <button 
              className="close-response-btn"
              onClick={closeFullView}
            >
              Save Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCodingInput;