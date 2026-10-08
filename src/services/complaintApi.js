import { get, post, patch } from './api.js';

/**
 * Grievance Desk / Complaints API Service Module
 */

export const createComplaint = async (data) => {
  return await post('/complaints', data);
};

export const getComplaints = async () => {
  return await get('/complaints');
};

export const getComplaint = async (id) => {
  return await get(`/complaints/${id}`);
};

export const updateComplaint = async (id, data) => {
  return await patch(`/complaints/${id}`, data);
};

export default {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
};
