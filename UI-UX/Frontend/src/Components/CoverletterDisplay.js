import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { getCoverLetter } from '../Actions/UserActions';

const CoverLetterDisplay = ({ id, uuid, userInfo }) => {
  const dispatch = useDispatch();
  const coverLetterUrl = useSelector(state => state.getCoverLetter.coverLetterUrl);

  const handleDownload = () => {
    dispatch(getCoverLetter(id, uuid, userInfo));
    
    // We need to wait for the coverLetterUrl to be updated in the state
    setTimeout(() => {
      if (coverLetterUrl) {
        const link = document.createElement('a');
        link.href = coverLetterUrl;
        link.download = `Candidate_${id}_CoverLetter_${uuid}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 1000);
  };

  return (
    <>
      <span> Uploaded </span>
      <FontAwesomeIcon 
        icon={faDownload} 
        onClick={handleDownload} 
        style={{ cursor: 'pointer', marginLeft: '5px' }}
      />
    </>
  );
};

export default CoverLetterDisplay;