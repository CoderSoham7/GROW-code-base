import dotenv from 'dotenv';
import express from 'express';
import https from 'https';
import FormData from 'form-data';
import { Protect } from "../Middlewares/Auth.js";
import multer from 'multer';
import mongoose from 'mongoose';
import {body, validationResult} from "express-validator"
import { User } from "../Models/UserModel.js"
import { Interview } from '../Models/InterviewModel.js';

import { GoogleAuth } from 'google-auth-library';

dotenv.config();
const auth = new GoogleAuth();
const router = express.Router()
const upload = multer();

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
router.post('/wus', Protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Create the form data object for the file upload
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Get a client authenticated for the specific Cloud Run service
    const targetUrl = `https://${process.env.STT_FUNC_URL}`
    const client = await auth.getIdTokenClient(targetUrl);

    // Pre-buffer the form and set headers explicitly.
    const requestBody = await form.getBuffer();
    const requestHeaders = {
        ...form.getHeaders(),
        'Content-Length': requestBody.length,
    };

    // Make the authenticated request
    const apiResponse = await client.request({
      url: targetUrl, 
      method: 'POST',
      data: requestBody,     
      headers: requestHeaders, 
    });

    // Send the response from the Cloud Run service back to the original client
    res.status(apiResponse.status).json(apiResponse.data);

  } catch (error) {
    console.error("Error calling STT function:", error.response?.data || error.message);
    res.status(502).json({ message: "Failed to communicate with the speech-to-text service." });
  }
});


router.post('/giq', Protect, express.json(), [
    body('ID').not().isEmpty().withMessage('ID is required'),
    body('uuid').not().isEmpty().withMessage('UUID is required'),
    body('candidate_response').not().isEmpty().withMessage('candidate_response is required'),
    body('CSRF_token').not().isEmpty().withMessage('CSRF_token is required'),
    body('ID').custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID');
      }
      return true;
    }),
    body('uuid').isUUID().withMessage('Invalid UUID format'),
    body('candidate_response').trim().customSanitizer((value) => {
      return value.replace("$", "").replace("&", "");
    }).isLength({ max: 20000 }).withMessage('candidate_response can be a maximum of 20000 characters long'),
    body('CSRF_token').trim().escape().custom(value => {
      if (/^[a-zA-Z0-9\-]+$/.test(value)) {
        return true;
      } else {
        throw new Error('CSRF_token should be alphanumeric and can contain dashes');
      }
    })
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    try {
      const { ID: userId, uuid } = req.body;
  
      // Database validation remains unchanged
      const userDocument = await User.findById(userId);
      if (!userDocument) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const interview = await Interview.findOne({ user_id: userId, uuid: uuid });
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      
      // Get an authenticated client for the Chat service
      const targetUrl = `https://${process.env.CHAT_FUNC_URL}`
      const client = await auth.getIdTokenClient(targetUrl);
  
      // Make the authenticated request, ensuring the response is treated as a string
      const apiResponse = await client.request({
        url: targetUrl,
        method: 'POST',
        data: req.body,
        headers: { 'Content-Type': 'application/json' },
        responseType: 'text' // Ensures apiResponse.data is a string for consistent sanitization
      });
      
      // Sanitize the response from the external service before forwarding
      const responseBodyAsString = apiResponse.data;
      try {
          // Parse data first to ensure it's valid JSON
          const parsedData = JSON.parse(responseBodyAsString);
          
          // Process the parsed data recursively to sanitize any HTML in strings
          const sanitizedParsedData = sanitizeJsonRecursively(parsedData);
          
          // Send sanitized JSON data with the original status code
          res.status(apiResponse.status).json(sanitizedParsedData);
      } catch (parseError) {
          // If JSON parsing fails, sanitize the raw string data and send as text
          const sanitizedData = sanitizeHtml(responseBodyAsString);
          res.status(apiResponse.status).send(sanitizedData);
      }
  
    } catch (error) {
      console.error("Error calling Chat function:", error.response?.data || error.message);
      res.status(502).json({ message: "Failed to communicate with the chat service." });
    }
  });


  router.post('/rbt', Protect, express.json(), [
      body('data').not().isEmpty().withMessage('Data is required'),
      body('data').trim().escape()
    ], async (req, res) => { 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    
      try {
        // Get an authenticated client for the TTS service
        const targetUrl = `https://${process.env.TTS_FUNC_URL}`
        const client = await auth.getIdTokenClient(targetUrl);
    
        // Make the authenticated request. The response is handled as a string
        // to allow for conditional parsing and sanitization, mirroring the old logic.
        const apiResponse = await client.request({
          url: targetUrl,
          method: 'POST',
          data: req.body,
          responseType: 'string', 
        });
    
        const contentType = apiResponse.headers['content-type'];
        const responseData = apiResponse.data;
    
        // Sanitize the response based on its content type before sending to the client
        if (contentType && contentType.includes('application/json')) {
            try {
                // Response claims to be JSON, so parse and sanitize recursively
                const parsedData = JSON.parse(responseData);
                const sanitizedParsedData = sanitizeJsonRecursively(parsedData);
                
                // Send sanitized JSON data
                res.status(apiResponse.status).json(sanitizedParsedData);
            } catch (err) {
                // If JSON parsing fails, sanitize the raw string as HTML and send
                const sanitizedData = sanitizeHtml(responseData);
                res.status(apiResponse.status).send(sanitizedData);
            }
        } else {
            // For non-JSON responses, apply HTML sanitization
            const sanitizedData = sanitizeHtml(responseData);
    
            if (contentType) {
                res.set('Content-Type', contentType);
            }
            res.status(apiResponse.status).send(sanitizedData);
        }
    
      } catch (error) {
        // Handle errors from the API call
        console.error("Error calling TTS function:", error.response?.data || error.message);
        res.status(502).json({ message: "Failed to communicate with the text-to-speech service." });
      }
    });
export default router 