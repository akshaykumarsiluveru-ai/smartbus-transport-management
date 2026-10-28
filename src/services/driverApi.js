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
  const resolvedId = typeof id === 'object' && id !== null ? (id.id || id.DriverID || id.driverId) : id;
  if (resolvedId === undefined || resolvedId === null || resolvedId === '') {
    throw new Error('Driver ID is required for assignment.');
  }
  return await put(`/drivers/${encodeURIComponent(resolvedId)}/assignment`, data);
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
