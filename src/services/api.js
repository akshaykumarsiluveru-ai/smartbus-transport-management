import { getToken } from './tokenStorage.js';

// Base API URL from environment configuration with fallback to default port 5000
export const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Centralized HTTP request helper
 * @param {string} endpoint - Relative endpoint path (e.g. '/auth/login')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed JSON response payload
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Automatically attach JWT authorization token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Parse response body if JSON present
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage = responseData?.message || `HTTP ${response.status} Request failed.`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network or connection errors
    throw new ApiError(
      error.message || 'Unable to connect to SmartBus backend server.',
      0,
      null
    );
  }
};

export const get = (endpoint, headers = {}) => apiRequest(endpoint, { method: 'GET', headers });
export const post = (endpoint, body, headers = {}) => apiRequest(endpoint, { method: 'POST', body, headers });
export const put = (endpoint, body, headers = {}) => apiRequest(endpoint, { method: 'PUT', body, headers });
export const patch = (endpoint, body, headers = {}) => apiRequest(endpoint, { method: 'PATCH', body, headers });
export const del = (endpoint, headers = {}) => apiRequest(endpoint, { method: 'DELETE', headers });

export default {
  API_BASE_URL,
  apiRequest,
  get,
  post,
  put,
  patch,
  del,
};
