/**
 * HTML entity decoder utility
 * 
 * This module provides functions to decode HTML entities back to their original characters.
 * Used for decoding sanitized content from the backend to display properly in the frontend.
 */

/**
 * Decodes HTML entities to their corresponding characters
 * 
 * @param {string} input - String containing HTML entities to decode
 * @return {string} The decoded string
 */
export const decodeHtmlEntities = (input) => {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = input;
  const result = textarea.value;
  return result;
};

/**
 * Alternative implementation using a regular expression
 * 
 * @param {string} input - String containing HTML entities to decode
 * @return {string} The decoded string
 */
export const decodeHtmlEntitiesRegex = (input) => {
  if (!input || typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
};

/**
 * Recursively decodes HTML entities in an object or array
 * 
 * @param {any} data - The data to decode (object, array, or string)
 * @return {any} The decoded data with the same structure
 */
export const decodeHtmlEntitiesDeep = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return decodeHtmlEntities(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => decodeHtmlEntitiesDeep(item));
  }

  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = decodeHtmlEntitiesDeep(data[key]);
      }
    }
    return result;
  }

  return data;
};