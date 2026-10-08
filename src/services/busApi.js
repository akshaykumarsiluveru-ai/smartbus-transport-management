import { get, post, put, del } from './api.js';

/**
 * Bus Fleet Management API Service Module
 */

export const getBuses = async () => {
  return await get('/buses');
};

export const getBus = async (id) => {
  return await get(`/buses/${id}`);
};

export const createBus = async (data) => {
  return await post('/buses', data);
};

export const updateBus = async (id, data) => {
  return await put(`/buses/${id}`, data);
};

export const deleteBus = async (id) => {
  return await del(`/buses/${id}`);
};

export default {
  getBuses,
  getBus,
  createBus,
  updateBus,
  deleteBus,
};
