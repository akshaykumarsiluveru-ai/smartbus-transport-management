import { get, post } from './api.js';

/**
 * Telemetry & Tracking API Service Module
 */

export const updateTracking = async (data) => {
  return await post('/tracking/update', data);
};

export const getLiveTracking = async () => {
  return await get('/tracking/live');
};

export const getBusTracking = async (busId) => {
  return await get(`/tracking/bus/${busId}`);
};

export const getTripTracking = async (tripId) => {
  return await get(`/tracking/trip/${tripId}`);
};

export default {
  updateTracking,
  getLiveTracking,
  getBusTracking,
  getTripTracking,
};
