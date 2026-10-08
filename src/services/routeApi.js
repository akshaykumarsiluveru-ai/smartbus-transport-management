import { get, post, put, del } from './api.js';

/**
 * Route & Stop Management API Service Module
 */

export const getRoutes = async () => {
  return await get('/routes');
};

export const getRoute = async (id) => {
  return await get(`/routes/${id}`);
};

export const createRoute = async (data) => {
  return await post('/routes', data);
};

export const updateRoute = async (id, data) => {
  return await put(`/routes/${id}`, data);
};

export const deleteRoute = async (id) => {
  return await del(`/routes/${id}`);
};

// Route Stops Nested APIs
export const getRouteStops = async (routeId) => {
  return await get(`/routes/${routeId}/stops`);
};

export const createRouteStop = async (routeId, data) => {
  return await post(`/routes/${routeId}/stops`, data);
};

export const updateRouteStop = async (routeId, stopId, data) => {
  return await put(`/routes/${routeId}/stops/${stopId}`, data);
};

export const deleteRouteStop = async (routeId, stopId) => {
  return await del(`/routes/${routeId}/stops/${stopId}`);
};

export default {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
  createRouteStop,
  updateRouteStop,
  deleteRouteStop,
};
