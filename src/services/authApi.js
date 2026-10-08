import { post, get } from './api.js';

/**
 * Authentication API Service Module
 */

export const login = async (email, password) => {
  return await post('/auth/login', { email, password });
};

export const register = async (userData) => {
  return await post('/auth/register', userData);
};

export const getMe = async () => {
  return await get('/auth/me');
};

export default {
  login,
  register,
  getMe,
};
