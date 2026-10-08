import { get, post, put, del } from './api.js';

/**
 * Announcements & Notices API Service Module
 */

export const getNotices = async () => {
  return await get('/notices');
};

export const getNotice = async (id) => {
  return await get(`/notices/${id}`);
};

export const createNotice = async (data) => {
  return await post('/notices', data);
};

export const updateNotice = async (id, data) => {
  return await put(`/notices/${id}`, data);
};

export const deleteNotice = async (id) => {
  return await del(`/notices/${id}`);
};

export default {
  getNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
};
