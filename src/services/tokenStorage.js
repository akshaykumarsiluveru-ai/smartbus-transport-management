/**
 * SmartBus Token Storage Service
 * Centralized utility for managing backend JWT authorization tokens in browser storage
 */

const TOKEN_KEY = 'smartbus_jwt_token';

/**
 * Retrieve the current JWT token from storage
 * @returns {string|null} JWT token string or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to read token from localStorage:', error.message);
    return null;
  }
};

/**
 * Persist JWT token to storage
 * @param {string} token - Valid JWT token
 */
export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Failed to save token to localStorage:', error.message);
  }
};

/**
 * Remove JWT token from storage
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove token from localStorage:', error.message);
  }
};

export default {
  getToken,
  setToken,
  removeToken,
};
