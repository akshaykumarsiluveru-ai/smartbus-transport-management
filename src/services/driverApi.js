import { get, post, put, del } from './api.js';

/**
 * Driver Operations API Service Module
 */

export const getDrivers = async () => {
  return await get('/drivers');
};

export const getDriver = async (id) => {
  return await get(`/drivers/${id}`);
};

export const createDriver = async (data) => {
  return await post('/drivers', data);
};

export const updateDriver = async (id, data) => {
  return await put(`/drivers/${id}`, data);
};

export const assignDriver = async (id, data) => {
  return await put(`/drivers/${id}/assignment`, data);
};

export const deleteDriver = async (id) => {
  return await del(`/drivers/${id}`);
};

export default {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  assignDriver,
  deleteDriver,
};
