import React, { createContext, useState, useEffect } from 'react';  
import axios from 'axios';  
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { decodeHtmlEntitiesDeep } from '../utils/htmlEntityDecoder';
  
export const AuthContext = createContext();  

// Secure in-memory session data store (not persisted to browser storage)
const sessionDataStore = new Map();
  
export const AuthProvider = ({ children }) => {  
  const [userInfo, setUserInfo] = useState(null);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  

  const loadUser = async () => {  
    try {  
      const { data } = await axios.get('/api/users/profile', { withCredentials: true });  
      // Decode any HTML entities in the response data
      const decodedData = decodeHtmlEntitiesDeep(data);
      setUserInfo(decodedData);  
      setError(null);
    } catch (err) {  
      if (err.response && err.response.status === 401) {  
        setUserInfo(null);  
      } else {   
        setError(getErrorMessage(err));  
      }  
    } finally {  
      setLoading(false);  
    }  
  };  

  useEffect(() => {  
    loadUser();  
  }, []);  

  const login = async (email, password) => {  
    try {  
      setLoading(true);  
      const { data } = await axios.post(  
        "/api/users/login",  
        { email, password },  
        { withCredentials: true }  
      );  
      // Decode any HTML entities in the response data
      const decodedData = decodeHtmlEntitiesDeep(data);
      setUserInfo(decodedData);  
      setError(null); 
    } catch (err) {  
      setError(getErrorMessage(err));  
    } finally {  
      setLoading(false);  
    }  
  };  
    
  const logout = async () => {  
    try {  
      await axios.post('/api/users/logout', {}, { withCredentials: true });  
      // Clear all session data when logging out
      clearAllSessionData();
      setUserInfo(null);  
      setError(null); 
    } catch (err) {  
      setError(getErrorMessage(err));  
    }  
  };  

  // Secure session management functions
  const setSessionData = (key, value) => {
    if (!userInfo || !userInfo._id) return false;
    const userId = userInfo._id;
    const sessionKey = `${userId}:${key}`;
    sessionDataStore.set(sessionKey, value);
    return true;
  };

  const getSessionData = (key) => {
    if (!userInfo || !userInfo._id) return null;
    const userId = userInfo._id;
    const sessionKey = `${userId}:${key}`;
    return sessionDataStore.get(sessionKey);
  };

  const removeSessionData = (key) => {
    if (!userInfo || !userInfo._id) return false;
    const userId = userInfo._id;
    const sessionKey = `${userId}:${key}`;
    return sessionDataStore.delete(sessionKey);
  };

  // Clear all session data on logout
  const clearAllSessionData = () => {
    if (userInfo && userInfo._id) {
      const userId = userInfo._id;
      // Remove all keys associated with this user
      [...sessionDataStore.keys()]
        .filter(key => key.startsWith(`${userId}:`))
        .forEach(key => sessionDataStore.delete(key));
    }
  };

  return (  
    <AuthContext.Provider value={{ 
      userInfo, 
      setUserInfo, 
      login, 
      logout, 
      loading, 
      error, 
      loadUser,
      setSessionData,
      getSessionData,
      removeSessionData
    }}>  
      {!loading ? children : <div>Loading <FontAwesomeIcon icon={faCircleNotch} spin /></div>}
    </AuthContext.Provider>  
  );  
};  
  
const getErrorMessage = (error) => {  
  return error.response && error.response.data.message  
    ? error.response.data.message  
    : "An error occurred";  
}; 
  