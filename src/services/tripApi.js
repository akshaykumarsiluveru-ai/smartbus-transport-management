import { get, post } from './api.js';

/**
 * Trip Operations API Service Module
 */

export const startTrip = async (data) => {
  return await post('/trips/start', data);
};

export const endTrip = async (data) => {
  return await post('/trips/end', data);
};

export const getTrips = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.bus_id) query.append('bus_id', params.bus_id);
  if (params.driver_id) query.append('driver_id', params.driver_id);
  if (params.route_id) query.append('route_id', params.route_id);

  const queryString = query.toString();
  const endpoint = `/trips${queryString ? `?${queryString}` : ''}`;
  return await get(endpoint);
};

export const getTrip = async (id) => {
  return await get(`/trips/${id}`);
};

export default {
  startTrip,
  endTrip,
  getTrips,
  getTrip,
};
