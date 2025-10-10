/**
 * Security-conscious error logging utility
 * Prevents sensitive data exposure in console logs
 */

// List of sensitive keys that should never be logged
const SENSITIVE_KEYS = [
  'token',
  'password',
  'apikey',
  'api_key',
  'secret',
  'credential',
  'session',
  'jwt',
  'authorization',
  'bearer',
];

/**
 * Check if a string contains sensitive information
 */
const containsSensitiveData = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  
  const lowerValue = value.toLowerCase();
  return SENSITIVE_KEYS.some(key => lowerValue.includes(key));
};

/**
 * Sanitize an error object to remove sensitive data
 */
const sanitizeError = (error: any): any => {
  if (!error) return error;
  
  // If it's a string, check for sensitive data
  if (typeof error === 'string') {
    return containsSensitiveData(error) ? '[REDACTED]' : error;
  }
  
  // If it's an object, sanitize it
  if (typeof error === 'object') {
    const sanitized: any = {};
    
    for (const key in error) {
      const lowerKey = key.toLowerCase();
      
      // Skip sensitive keys entirely
      if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Recursively sanitize nested objects
      if (typeof error[key] === 'object' && error[key] !== null) {
        sanitized[key] = sanitizeError(error[key]);
      } else {
        sanitized[key] = containsSensitiveData(error[key]) ? '[REDACTED]' : error[key];
      }
    }
    
    return sanitized;
  }
  
  return error;
};

/**
 * Safe error logger - only logs in development, sanitizes in production
 */
export const logError = (message: string, error?: any): void => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // In development, log full error for debugging
    console.error(message, error);
  } else {
    // In production, only log sanitized message
    console.error(message);
    
    // If error provided, log sanitized version
    if (error) {
      const sanitized = sanitizeError(error);
      console.error('Error details:', sanitized);
    }
  }
};

/**
 * Safe info logger - reduces noise in production
 */
export const logInfo = (message: string, data?: any): void => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    console.log(message, data);
  }
  // In production, don't log info messages to reduce console noise
};

/**
 * Safe warning logger
 */
export const logWarning = (message: string, data?: any): void => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
};
