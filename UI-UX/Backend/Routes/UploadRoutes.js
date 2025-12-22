import express from "express";
import multer from "multer";
import { Storage } from '@google-cloud/storage';
import { User } from "../Models/UserModel.js";
import { Protect } from "../Middlewares/Auth.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from 'path';
import https from 'https';
import { Interview } from "../Models/InterviewModel.js";

import { GoogleAuth } from 'google-auth-library';
const auth = new GoogleAuth();

dotenv.config();

const router = express.Router();

const gcpstorage = new Storage();

const allowedPdfExtensions = ['.pdf'];
const allowedImageExtensions = ['.jpeg', '.jpg'];
const allowedVideoExtensions = ['.webm']

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

const multerPdfFilter = function(req, file, cb) {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (allowedPdfExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const multerImageFilter = function(req, file, cb) {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (allowedImageExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG files are allowed'), false);
  }
};

const multerVideoFilter = function(req, file, cb) {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (allowedVideoExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only WEBM files are allowed'), false);
  }
};


const uploadCoverletter = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerPdfFilter,
}).fields([
  { name: 'coverletter', maxCount: 1 },
  { name: 'userId', maxCount: 1 },
  { name: 'uuid', maxCount: 1 },
]);


router.post("/coverletter", Protect, uploadCoverletter, async (req, res, next) => {
  try {
    const coverletter = req.files.coverletter[0];
    if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
      return res.status(400).send('Error Code B107');
    }
    const userId = sanitizeHTML(req.body.userId); // Sanitize userId
    const uuid = sanitizeHTML(req.body.uuid); // Sanitize uuid

    if (!uuid) {
      return res.status(400).send('Error Code B108: UUID is required');
    }

    const timestamp = Date.now();
    const bucketName = process.env.GCP_BUCKET_NAME;

    if (coverletter) {
      const folderName = "coverletter";
      const bucket = gcpstorage.bucket(bucketName);
      const file = bucket.file(`${folderName}/${timestamp}-${encodeURIComponent(coverletter.originalname)}`);
      await file.save(coverletter.buffer, {
        metadata: {
          contentType: coverletter.mimetype,
        }
      });

      const coverletterUrl = `${timestamp}-${encodeURIComponent(coverletter.originalname)}`;

      // Find the specific interview and update its coverletter field
      const interview = await Interview.findOne({ user_id: userId, uuid: uuid });
      if (!interview) {
        return res.status(404).send({ message: "Error Code B113: Interview not found", status: 404 });
      }
      interview.coverletter = coverletterUrl;
      await interview.save();

      // Make the external API call with proper error handling
      try {
        const postData = JSON.stringify({ ID: userId, uuid: uuid });
        const targetUrl = `https://${process.env.CL_PROCESS_FUNC_URL}`;
        const client = await auth.getIdTokenClient(targetUrl);

        const apiResponse = await client.request({
          url: `${targetUrl}`,
          method: 'POST',
          data: sanitizeJSONRecursively(JSON.parse(postData)), // Sanitize postData before stringifying again (or ensure it's sanitized before stringify)
          headers: { 'Content-Type': 'application/json' }
        });

        // Handle different API response status codes
        if (apiResponse.status >= 400) {
          let errorMessage;
          switch (apiResponse.status) {
            case 400:
              errorMessage = "Error Code B130: Bad request to processing service";
              break;
            case 401:
              errorMessage = "Error Code B131: Unauthorized access to processing service";
              break;
            case 403:
              errorMessage = "Error Code B132: Forbidden access to processing service";
              break;
            case 404:
              errorMessage = "Error Code B133: Processing service endpoint not found";
              break;
            case 500:
              errorMessage = "Error Code B134: Internal server error in processing service";
              break;
            default:
              errorMessage = `Error Code B135: Processing service error (${apiResponse.statusCode})`;
          }
          console.error(errorMessage, apiResponse.data);
          return res.status(apiResponse.status).send({
            message: errorMessage,
            status: apiResponse.status
          });
        }

        // Send success response to client
        res.status(200).send({ status: 200 });

      } catch (apiError) {
        console.error("Error in external API call:", apiError);
        return res.status(502).send({
          message: "Error Code B136: Failed to communicate with processing service",
          status: 502
        });
      }
    } else {
      return res.status(400).send({ message: "Error Code B121: Cover letter not found or wrong format.", status: 400 });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error Code B124", status: 500 });
  }
});

const uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerImageFilter,
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'userId', maxCount: 1 },
]);

router.post("/image", Protect, uploadImage, async (req, res, next) => {
  try {
    const image = req.files.image[0];
    if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
      return res.status(400).send('Error Code B107');
    }
    const userId = sanitizeHTML(req.body.userId); // Sanitize userId
    const timestamp = Date.now();
    const bucketName = process.env.GCP_BUCKET_NAME;

    if (image) {
      const folderName = "images";
      const bucket = gcpstorage.bucket(bucketName);
      const file = bucket.file(`${folderName}/${timestamp}-${encodeURIComponent(image.originalname)}`);
      await file.save(image.buffer, {
        metadata: {
          contentType: image.mimetype,
        }
      });

      const imageUrl = `${timestamp}-${encodeURIComponent(image.originalname)}`;
      const user = await User.findById(userId);
      if (user) { // Add check if user exists
        user.image = imageUrl;
        await user.save();
      } else {
        return res.status(404).send({ message: "Error Code B140: User not found", status: 404 });
      }


      res.status(200).send({ status: 200 });
    } else {
      return res.status(400).send({ message: "Error Code B122: Image not found or wrong format.", status: 400 });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error Code B124", status: 500 });
  }
});


/////* UPDATE THIS TO HANDLE MULTIPLE SESSIONS WHEN THIS IS BEING INTEGRATED IN PROD; IGNORE FOR NOW *////////
const uploadInterviewRecording = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerVideoFilter,
}).fields([
  { name: 'interviewrecording', maxCount: 1 },
  { name: 'userId', maxCount: 1 },
]);

router.post("/interviewrecording", Protect, uploadInterviewRecording, async (req, res, next) => {
  try {
    const video = req.files.interviewrecording[0];
    if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
      return res.status(400).send('Error Code B107');
    }
    const userId = sanitizeHTML(req.body.userId); // Sanitize userId
    const timestamp = Date.now();
    const bucketName = process.env.GCP_BUCKET_NAME;

    if (video) {
      const folderName = "interview-recordings";
      const bucket = gcpstorage.bucket(bucketName);
      const interviewrecordingUrl = `${timestamp}-${encodeURIComponent(video.originalname)}`
      const file = bucket.file(`${folderName}/${interviewrecordingUrl}`);
      await file.save(video.buffer, {
        metadata: {
          contentType: video.mimetype,
        }
      });

      const user = await User.findById(userId);
      if (user) { // Add check if user exists
        user.interviewrecording = interviewrecordingUrl;
        await user.save();
      } else {
        return res.status(404).send({ message: "Error Code B140: User not found", status: 404 });
      }


      res.status(200).send({ status: 200 });
    } else {
      return res.status(400).send({ message: "Error Code B123: Interview recording not found or wrong format.", status: 400 });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error Code B124", status: 500 });
  }
});

export default router;