import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  INITIAL_USERS,
  INITIAL_BUSES,
  INITIAL_DRIVERS,
  INITIAL_ROUTES,
  INITIAL_TRACKING,
  INITIAL_COMPLAINTS,
  INITIAL_TRIPS,
  INITIAL_NOTICES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_MAINTENANCE_LOGS,
} from '../services/mockData';
import {
  calculateRealEta,
  calculateDistanceKm,
  formatDistance,
} from '../services/geoEtaService';
import busApi from '../services/busApi';
import driverApi from '../services/driverApi';
import routeApi from '../services/routeApi';
import noticeApi from '../services/noticeApi';
import tripApi from '../services/tripApi';
import trackingApi from '../services/trackingApi';
import complaintApi from '../services/complaintApi';
import { getToken } from '../services/tokenStorage';

const AppContext = createContext();

// Local Storage Keys for Persistence
const STORAGE_KEYS = {
  BUSES: 'smartbus_core_buses_v2',
  DRIVERS: 'smartbus_core_drivers_v2',
  ROUTES: 'smartbus_core_routes_v2',
  TRACKING: 'smartbus_core_tracking_v2',
  COMPLAINTS: 'smartbus_core_complaints_v2',
  TRIPS: 'smartbus_core_trips_v2',
  USERS: 'smartbus_core_users_v2',
  NOTICES: 'smartbus_core_notices_v2',
};

const loadInitial = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

// Data model mappers for Express/MySQL backend APIs
const mapBusFromDb = (b) => ({
  id: b.id,
  BusID: b.id,
  busNumber: b.bus_number,
  BusNo: b.bus_number,
  registrationNumber: b.registration_number,
  model: b.model || 'Standard Transit Bus',
  capacity: b.capacity || 50,
  Capacity: b.capacity || 50,
  currentOccupancy: b.current_occupancy || 0,
  fuelType: b.fuel_type || 'Diesel',
  status: b.status || 'At Depot',
  currentLat: b.current_lat !== undefined && b.current_lat !== null ? parseFloat(b.current_lat) : 24.5714,
  Latitude: b.current_lat !== undefined && b.current_lat !== null ? parseFloat(b.current_lat) : 24.5714,
  currentLng: b.current_lng !== undefined && b.current_lng !== null ? parseFloat(b.current_lng) : 73.6974,
  Longitude: b.current_lng !== undefined && b.current_lng !== null ? parseFloat(b.current_lng) : 73.6974,
  speed: b.speed !== undefined && b.speed !== null ? parseFloat(b.speed) : 0,
  isLive: Boolean(b.is_live),
  driverId: b.assigned_driver_id || '',
  driverName: b.driver_name || 'Unassigned',
  routeId: b.assigned_route_id || '',
  routeName: b.route_name || 'Unassigned',
  currentStop: b.current_stop || 'Depot Yard',
  nextStop: b.next_stop || 'None',
  etaMinutes: b.eta_minutes || 0,
  eta: b.eta_minutes || 0,
  lastUpdated: b.updated_at || new Date().toISOString(),
  timestamp: b.updated_at || new Date().toISOString(),
});

const mapDriverFromDb = (d) => ({
  id: d.id,
  DriverID: d.id,
  driverId: d.id,
  userId: d.user_id,
  name: d.driver_name || d.name || 'Unnamed Driver',
  Name: d.driver_name || d.name || 'Unnamed Driver',
  email: d.driver_email || d.email || '',
  phone: d.phone || '',
  Contact: d.phone || '',
  employeeId: d.employee_id,
  licenseNumber: d.license_number,
  status: d.status || 'Available',
  assignedBusId: d.assigned_bus_id || '',
  assignedBusNumber: d.bus_number || 'Unassigned',
  assignedRouteId: d.assigned_route_id || '',
  assignedRouteName: d.route_name || 'None',
  shift: d.shift || 'Morning',
  rating: d.rating ? `${d.rating} ⭐` : '5.0 ⭐',
  tripsToday: d.trips_today || 0,
});

const mapStopFromDb = (s) => ({
  id: s.id,
  StopID: s.id,
  stopId: s.id,
  name: s.stop_name || s.name,
  StopName: s.stop_name || s.name,
  stopName: s.stop_name || s.name,
  sequenceOrder: s.stop_order || s.sequence_order || 1,
  Sequence: s.stop_order || s.sequence_order || 1,
  sequence: s.stop_order || s.sequence_order || 1,
  lat: parseFloat(s.latitude || s.lat || 24.5850),
  Latitude: parseFloat(s.latitude || s.lat || 24.5850),
  latitude: parseFloat(s.latitude || s.lat || 24.5850),
  lng: parseFloat(s.longitude || s.lng || 73.6900),
  Longitude: parseFloat(s.longitude || s.lng || 73.6900),
  longitude: parseFloat(s.longitude || s.lng || 73.6900),
  estimatedTime: s.scheduled_arrival || s.estimatedTime || '08:30 AM',
  ExpectedArrivalTime: s.scheduled_arrival || s.estimatedTime || '08:30 AM',
  expectedArrivalTime: s.scheduled_arrival || s.estimatedTime || '08:30 AM',
});

const mapRouteFromDb = (r, stops = []) => {
  const mappedStops = stops.map(mapStopFromDb);
  const startPt = r.start_point || (mappedStops.length > 0 ? mappedStops[0].name : 'Start Station');
  const endPt = r.end_point || (mappedStops.length > 0 ? mappedStops[mappedStops.length - 1].name : 'Terminal Station');
  return {
    id: r.id,
    RouteID: r.id,
    routeId: r.id,
    routeCode: r.route_code,
    routeName: r.name || r.route_name,
    RouteName: r.name || r.route_name,
    startPoint: startPt,
    StartPoint: startPt,
    endPoint: endPt,
    EndPoint: endPt,
    destination: endPt,
    totalDistance: r.distance_km ? `${r.distance_km} km` : '10 km',
    distance: r.distance_km ? `${r.distance_km} km` : '10 km',
    Distance: r.distance_km ? `${r.distance_km} km` : '10 km',
    estimatedDuration: r.estimated_duration ? `${r.estimated_duration}` : '25 mins',
    EstimatedDuration: r.estimated_duration ? `${r.estimated_duration}` : '25 mins',
    status: r.status || 'Active',
    schedules: r.schedules || ['08:00 AM', '01:00 PM', '05:00 PM'],
    stops: mappedStops,
    Stops: mappedStops,
  };
};

const mapNoticeFromDb = (n) => ({
  id: n.id,
  title: n.title,
  message: n.message,
  type: n.type || 'General Announcement',
  target: n.target || 'All Students',
  author: n.creator_name || 'Transport Control',
  authorRole: 'Transit Dispatch',
  timestamp: n.created_at ? new Date(n.created_at).toLocaleString() : 'Just Now',
  createdAt: n.created_at,
});

const mapTripFromDb = (t) => ({
  id: t.id,
  tripId: t.id,
  tripCode: t.trip_code,
  busId: t.bus_id,
  BusID: t.bus_id,
  busNumber: t.bus_number || `BUS-${t.bus_id}`,
  driverId: t.driver_id,
  DriverID: t.driver_id,
  driverName: t.driver_name || 'Driver',
  routeId: t.route_id,
  RouteID: t.route_id,
  routeCode: t.route_code,
  routeName: t.route_name || 'Assigned Route',
  startTime: t.start_time,
  departureTime: t.start_time,
  endTime: t.end_time,
  status: t.status || 'In Transit',
  passengerCount: t.passenger_count || 0,
  passengers: t.passenger_count || 0,
  currentStop: t.current_stop || 'Depot',
  nextStop: t.next_stop || 'None',
  createdAt: t.created_at,
});

const mapComplaintFromDb = (c) => ({
  id: c.id,
  complaintId: `CMP-${c.id}`,
  userId: c.user_id,
  busId: c.bus_id,
  busNo: c.bus_number || (c.bus_id ? `BUS-${c.bus_id}` : 'General'),
  busNumber: c.bus_number || (c.bus_id ? `BUS-${c.bus_id}` : 'General'),
  routeId: c.route_id,
  routeName: c.route_name || (c.route_code ? `Route ${c.route_code}` : 'Campus Corridor'),
  title: c.subject,
  subject: c.subject,
  category: c.category || 'General',
  description: c.description,
  status: c.status || 'Pending',
  priority: c.priority || 'Medium',
  adminResponse: c.admin_response,
  adminRemark: c.admin_response,
  studentId: c.student_id || `STU-${c.user_id}`,
  studentName: c.student_name || 'Student User',
  studentEmail: c.student_email || '',
  date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Today',
  createdAt: c.created_at,
});

export const AppProvider = ({ children }) => {
  // 1. USERS Entity State
  const [users, setUsers] = useState(() => loadInitial(STORAGE_KEYS.USERS, INITIAL_USERS));

  // 2. BUSES Entity State
  const [buses, setBuses] = useState(() => loadInitial(STORAGE_KEYS.BUSES, INITIAL_BUSES));

  // 3. DRIVERS Entity State
  const [drivers, setDrivers] = useState(() => loadInitial(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS));

  // 4. ROUTES Entity State
  const [routes, setRoutes] = useState(() => loadInitial(STORAGE_KEYS.ROUTES, INITIAL_ROUTES));

  // 5. TRACKING Entity State (Centralized live telemetry keyed by BusID)
  const [tracking, setTracking] = useState(() => loadInitial(STORAGE_KEYS.TRACKING, INITIAL_TRACKING));

  // 6. COMPLAINTS Entity State
  const [complaints, setComplaints] = useState(() => loadInitial(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS));

  // 7. TRIPS Entity State
  const [trips, setTrips] = useState(() => loadInitial(STORAGE_KEYS.TRIPS, INITIAL_TRIPS));

  // Supporting States
  const [notices, setNotices] = useState(() => loadInitial(STORAGE_KEYS.NOTICES, INITIAL_NOTICES));
  const [activityLogs, setActivityLogs] = useState(INITIAL_ACTIVITY_LOGS);
  const [maintenanceLogs, setMaintenanceLogs] = useState(INITIAL_MAINTENANCE_LOGS);

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataLoadError, setDataLoadError] = useState(null);

  // Synchronize backend data from MySQL REST APIs
  const refreshAdminData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsDataLoading(true);
    setDataLoadError(null);
    try {
      const [busesRes, driversRes, routesRes, noticesRes, tripsRes, complaintsRes, trackingRes] = await Promise.all([
        busApi.getBuses().catch((e) => ({ success: false, error: e })),
        driverApi.getDrivers().catch((e) => ({ success: false, error: e })),
        routeApi.getRoutes().catch((e) => ({ success: false, error: e })),
        noticeApi.getNotices().catch((e) => ({ success: false, error: e })),
        tripApi.getTrips().catch((e) => ({ success: false, error: e })),
        complaintApi.getComplaints().catch((e) => ({ success: false, error: e })),
        trackingApi.getLiveTracking().catch((e) => ({ success: false, error: e })),
      ]);

      if (busesRes.success && Array.isArray(busesRes.data)) {
        setBuses(busesRes.data.map(mapBusFromDb));
      }
      if (driversRes.success && Array.isArray(driversRes.data)) {
        setDrivers(driversRes.data.map(mapDriverFromDb));
      }
      if (noticesRes.success && Array.isArray(noticesRes.data)) {
        setNotices(noticesRes.data.map(mapNoticeFromDb));
      }
      if (tripsRes.success && Array.isArray(tripsRes.data)) {
        setTrips(tripsRes.data.map(mapTripFromDb));
      }
      if (complaintsRes.success && Array.isArray(complaintsRes.data)) {
        setComplaints(complaintsRes.data.map(mapComplaintFromDb));
      }
      if (trackingRes.success && Array.isArray(trackingRes.data)) {
        setTracking((prev) => {
          const nextTrack = { ...prev };
          trackingRes.data.forEach((tr) => {
            const busKey = tr.bus_id;
            nextTrack[busKey] = {
              BusID: busKey,
              busId: busKey,
              busNumber: tr.bus_number,
              driverId: tr.driver_id,
              driverName: tr.driver_name,
              routeId: tr.route_id,
              routeName: tr.route_name,
              Latitude: parseFloat(tr.latitude),
              currentLat: parseFloat(tr.latitude),
              Longitude: parseFloat(tr.longitude),
              currentLng: parseFloat(tr.longitude),
              speed: parseFloat(tr.speed || 0),
              currentStop: tr.current_stop || 'In Transit',
              nextStop: tr.next_stop || 'Next Stop',
              etaMinutes: tr.eta_minutes || 0,
              isLive: Boolean(tr.is_live),
              timestamp: tr.timestamp,
            };
          });
          return nextTrack;
        });
      }

      if (routesRes.success && Array.isArray(routesRes.data)) {
        const routesWithStops = await Promise.all(
          routesRes.data.map(async (r) => {
            try {
              const stopsRes = await routeApi.getRouteStops(r.id);
              const stops = stopsRes.success && Array.isArray(stopsRes.data) ? stopsRes.data : [];
              return mapRouteFromDb(r, stops);
            } catch (e) {
              return mapRouteFromDb(r, []);
            }
          })
        );
        setRoutes(routesWithStops);
      }
    } catch (err) {
      console.error('Error loading admin data from backend API:', err);
      setDataLoadError(err.message || 'Failed to load fleet data from server.');
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  const [selectedBusId, setSelectedBusId] = useState('bus_101');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDriverBroadcasting, setIsDriverBroadcasting] = useState(false);

  // BroadcastChannel for instant cross-tab real-time sync
  const broadcastChannel = useMemo(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      return new BroadcastChannel('smartbus_core_sync_channel');
    }
    return null;
  }, []);

  const broadcastEvent = useCallback((type, payload) => {
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
      }
    } catch (err) {
      console.warn('Broadcast failed', err);
    }
  }, [broadcastChannel]);

  // Persist states to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.BUSES, JSON.stringify(buses)); } catch (e) {}
  }, [buses]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers)); } catch (e) {}
  }, [drivers]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes)); } catch (e) {}
  }, [routes]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(tracking)); } catch (e) {}
  }, [tracking]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints)); } catch (e) {}
  }, [complaints]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips)); } catch (e) {}
  }, [trips]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); } catch (e) {}
  }, [users]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices)); } catch (e) {}
  }, [notices]);

  // Listen for Cross-Tab broadcast synchronization
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event) => {
      const { type, payload } = event.data || {};
      if (!type) return;

      switch (type) {
        case 'BUS_STATE_SYNC':
          if (payload.buses) setBuses(payload.buses);
          if (payload.tracking) setTracking(payload.tracking);
          if (payload.trips) setTrips(payload.trips);
          if (payload.drivers) setDrivers(payload.drivers);
          break;
        case 'COMPLAINTS_SYNC':
          if (payload.complaints) setComplaints(payload.complaints);
          break;
        case 'NOTICES_SYNC':
          if (payload.notices) setNotices(payload.notices);
          break;
        case 'ROUTES_SYNC':
          if (payload.routes) setRoutes(payload.routes);
          break;
        default:
          break;
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => broadcastChannel.removeEventListener('message', handleMessage);
  }, [broadcastChannel]);

  // Activity Logger
  const logActivity = useCallback((action, details, category = 'General') => {
    const newLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 35)]);
  }, []);

  // Per-Bus Simulation Progression State Reference (Maintains stop index, segment interpolation, and dwelling)
  // Per-Bus Simulation Progression State Reference (Maintains stop index, segment interpolation, and dwelling)
  const simulationProgressRef = useRef({});

  // Centralized Route-Aware GPS Tracking Simulation Loop (Runs every 2 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses((prevBuses) => {
        let hasChanges = false;
        const now = new Date().toISOString();

        const updatedBuses = prevBuses.map((bus) => {
          if (bus.isLive && (bus.status === 'In Transit' || bus.status === 'Delayed')) {
            hasChanges = true;

            // 1. Locate Assigned Route for this Bus
            const route = routes.find(
              (r) => r.id === bus.routeId || r.RouteID === bus.routeId || r.routeName === bus.routeName
            ) || routes[0];

            // 2. Extract ordered sequence of stops with valid coordinates
            const rawStops = route?.stops || route?.Stops || [];
            const stops = rawStops.map((s, idx) => ({
              id: s.id || s.StopID || `stop_${idx}`,
              name: s.name || s.StopName || `Stop #${idx + 1}`,
              lat: parseFloat(s.lat || s.Latitude || s.latitude || 24.5850),
              lng: parseFloat(s.lng || s.Longitude || s.longitude || 73.6900),
              time: s.estimatedTime || s.ExpectedArrivalTime || '08:30 AM',
              sequenceOrder: s.sequenceOrder || idx + 1,
            }));

            if (stops.length >= 2) {
              const busKey = bus.id || bus.BusID;
              if (!simulationProgressRef.current[busKey]) {
                simulationProgressRef.current[busKey] = {
                  stopIndex: bus.currentStopIdx || 0,
                  segmentProgress: 0.0,
                  holdTicks: 0,
                };
              }

              const p = simulationProgressRef.current[busKey];
              const totalStops = stops.length;
              let nextLat = bus.currentLat || stops[0].lat;
              let nextLng = bus.currentLng || stops[0].lng;
              let currentStop = stops[p.stopIndex]?.name || stops[0].name;
              let nextStop = stops[p.stopIndex + 1]?.name || 'Terminal Destination Reached';
              let routeProgress = Math.round((p.stopIndex / (totalStops - 1)) * 100);
              let dynamicSpeed = 34;

              // 3. Move along the route coordinates
              if (p.stopIndex >= totalStops - 1) {
                // Bus reached terminal stop
                nextLat = stops[totalStops - 1].lat;
                nextLng = stops[totalStops - 1].lng;
                currentStop = stops[totalStops - 1].name;
                nextStop = 'Terminal Destination Reached';
                routeProgress = 100;
                dynamicSpeed = 0;

                // Dwell at terminal for 4 ticks, then loop back for continuous campus transit demo
                p.holdTicks = (p.holdTicks || 0) + 1;
                if (p.holdTicks > 4) {
                  p.stopIndex = 0;
                  p.segmentProgress = 0.0;
                  p.holdTicks = 0;
                }
              } else {
                // Step gradually between stopIndex and stopIndex + 1
                const curStop = stops[p.stopIndex];
                const nxtStop = stops[p.stopIndex + 1];

                // 10 ticks = 20s per segment interpolation along actual stop coordinates
                p.segmentProgress += 0.10;

                if (p.segmentProgress < 1.0) {
                  // Gradual linear interpolation along actual coordinates
                  nextLat = curStop.lat + (nxtStop.lat - curStop.lat) * p.segmentProgress;
                  nextLng = curStop.lng + (nxtStop.lng - curStop.lng) * p.segmentProgress;
                  currentStop = curStop.name;
                  nextStop = nxtStop.name;
                  
                  // Dynamic realistic speed based on segment progression (accelerates then decelerates near stop)
                  if (p.segmentProgress < 0.2) {
                    dynamicSpeed = Math.floor(22 + p.segmentProgress * 50);
                  } else if (p.segmentProgress > 0.8) {
                    dynamicSpeed = Math.floor(18 + (1.0 - p.segmentProgress) * 70);
                  } else {
                    dynamicSpeed = Math.floor(32 + Math.random() * 10);
                  }

                  routeProgress = Math.min(
                    99,
                    Math.round(((p.stopIndex + p.segmentProgress) / (totalStops - 1)) * 100)
                  );
                } else {
                  // Stop reached!
                  p.stopIndex += 1;
                  p.segmentProgress = 0.0;
                  const reachedStop = stops[p.stopIndex];
                  nextLat = reachedStop.lat;
                  nextLng = reachedStop.lng;
                  currentStop = reachedStop.name;
                  nextStop = stops[p.stopIndex + 1]?.name || 'Terminal Destination Reached';
                  dynamicSpeed = p.stopIndex >= totalStops - 1 ? 0 : 12; // Brief deceleration at stop
                  routeProgress = Math.min(
                    100,
                    Math.round((p.stopIndex / (totalStops - 1)) * 100)
                  );
                }
              }

              // Save progress
              simulationProgressRef.current[busKey] = p;

              // Calculate Real Dynamic Geodesic Distance & ETA to upcoming stop
              const targetStop = stops[Math.min(totalStops - 1, p.stopIndex + 1)] || stops[totalStops - 1];
              const targetStopLat = targetStop?.lat || targetStop?.Latitude || 24.5850;
              const targetStopLng = targetStop?.lng || targetStop?.Longitude || 73.6900;

              const etaCalc = calculateRealEta({
                currentLat: nextLat,
                currentLng: nextLng,
                nextStopLat: targetStopLat,
                nextStopLng: targetStopLng,
                speed: dynamicSpeed,
                delayMinutes: bus.delayMinutes || 0,
                isLive: true,
                status: bus.status,
                currentStopIdx: p.stopIndex,
                totalStops,
              });

              const completedStopIds = stops.slice(0, p.stopIndex + 1).map((s) => s.id);

              return {
                ...bus,
                currentLat: nextLat,
                Latitude: nextLat,
                currentLng: nextLng,
                Longitude: nextLng,
                speed: dynamicSpeed,
                currentStop,
                currentStopIdx: p.stopIndex,
                nextStop,
                nextStopIdx: Math.min(totalStops - 1, p.stopIndex + 1),
                completedStopIds,
                distanceToNextKm: etaCalc.distanceKm,
                distanceToNextMeters: etaCalc.distanceMeters,
                distanceToNextText: etaCalc.distanceText,
                distanceText: etaCalc.distanceText,
                etaMinutes: etaCalc.etaMinutes,
                eta: etaCalc.etaMinutes,
                etaText: etaCalc.etaText,
                etaClockTime: etaCalc.etaClockTime,
                routeProgress,
                lastUpdated: now,
                timestamp: now,
              };
            }
          }
          return bus;
        });

        if (hasChanges) {
          // Keep Tracking table state strictly in sync with Buses (Single Source of Truth)
          setTracking((prevTracking) => {
            const nextTrack = { ...prevTracking };
            updatedBuses.forEach((b) => {
              const busKey = b.id || b.BusID;
              if (b.isLive && (b.status === 'In Transit' || b.status === 'Delayed')) {
                const busIdInt = parseInt(b.id || b.BusID, 10);
                if (!isNaN(busIdInt)) {
                  trackingApi.updateTracking({
                    bus_id: busIdInt,
                    latitude: b.currentLat,
                    longitude: b.currentLng,
                    speed: b.speed || 0,
                    current_stop: b.currentStop || null,
                    next_stop: b.nextStop || null,
                    eta_minutes: b.etaMinutes || 0,
                  }).catch(() => {});
                }

                nextTrack[busKey] = {
                  BusID: busKey,
                  busId: busKey,
                  busNumber: b.busNumber || b.BusNo,
                  driverId: b.driverId,
                  driverName: b.driverName,
                  routeId: b.routeId,
                  routeName: b.routeName,
                  Latitude: b.currentLat,
                  currentLat: b.currentLat,
                  Longitude: b.currentLng,
                  currentLng: b.currentLng,
                  speed: b.speed,
                  timestamp: b.lastUpdated,
                  lastUpdated: b.lastUpdated,
                  currentStop: b.currentStop,
                  currentStopIdx: b.currentStopIdx || 0,
                  nextStop: b.nextStop,
                  nextStopIdx: b.nextStopIdx || 1,
                  completedStopIds: b.completedStopIds || [],
                  routeProgress: b.routeProgress || 0,
                  distanceToNextKm: b.distanceToNextKm,
                  distanceToNextMeters: b.distanceToNextMeters,
                  distanceToNextText: b.distanceToNextText,
                  distanceText: b.distanceText,
                  eta: b.etaMinutes,
                  etaMinutes: b.etaMinutes,
                  etaText: b.etaText,
                  etaClockTime: b.etaClockTime,
                  isLive: true,
                  status: b.status,
                };
              }
            });
            return nextTrack;
          });

          // Also update Trips table currentStop / nextStop in real-time
          setTrips((prevTrips) => {
            let tripChanged = false;
            const updatedTrips = prevTrips.map((t) => {
              if (t.status === 'In Transit') {
                const liveBus = updatedBuses.find((b) => b.id === t.busId || b.BusID === t.busId);
                if (liveBus && (t.currentStop !== liveBus.currentStop || t.nextStop !== liveBus.nextStop)) {
                  tripChanged = true;
                  return {
                    ...t,
                    currentStop: liveBus.currentStop,
                    nextStop: liveBus.nextStop,
                    eta: `~${liveBus.etaMinutes || 4} mins`,
                  };
                }
              }
              return t;
            });
            return tripChanged ? updatedTrips : prevTrips;
          });
        }

        return hasChanges ? updatedBuses : prevBuses;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [routes]);

  // Selected Bus Object Joined with Live Tracking
  const selectedBus = useMemo(() => {
    const bus = buses.find((b) => b.id === selectedBusId || b.BusID === selectedBusId) || buses[0];
    const liveTrack = bus ? tracking[bus.id] || tracking[bus.BusID] : null;
    return bus ? { ...bus, ...liveTrack } : null;
  }, [buses, tracking, selectedBusId]);

  const setSelectedBus = useCallback((busOrId) => {
    if (typeof busOrId === 'string') {
      setSelectedBusId(busOrId);
    } else if (busOrId && (busOrId.id || busOrId.BusID)) {
      setSelectedBusId(busOrId.id || busOrId.BusID);
    }
  }, []);

  // Filtered Buses for Student & Admin UI
  const filteredBuses = useMemo(() => {
    return buses.map((b) => {
      const track = tracking[b.id] || tracking[b.BusID] || {};
      return { ...b, ...track };
    }).filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (b.busNumber || b.BusNo || '').toLowerCase().includes(q) ||
        (b.routeName || '').toLowerCase().includes(q) ||
        (b.driverName || '').toLowerCase().includes(q) ||
        (b.registrationNumber || '').toLowerCase().includes(q)
      );
    });
  }, [buses, tracking, searchQuery]);

  // Joined Buses with Tracking for all screens
  const allJoinedBuses = useMemo(() => {
    return buses.map((b) => {
      const track = tracking[b.id] || tracking[b.BusID] || {};
      return { ...b, ...track };
    });
  }, [buses, tracking]);

  // ==========================================
  // CORE ENTITY ACTIONS (Single Source of Truth)
  // ==========================================

  /**
   * 1. START TRIP (Driver -> Shared Context)
   */
  /**
   * Helper to format expected arrival time
   */
  const calculateExpectedArrival = (durationMins = 30, delayMins = 0) => {
    const arrivalDate = new Date(Date.now() + (durationMins + delayMins) * 60 * 1000);
    return arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * 1. START TRIP (Driver -> Shared Context)
   */
  const startTrip = useCallback((busId, driverId, routeId) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const driver = drivers.find((d) => d.id === driverId || d.DriverID === driverId);
    const route = routes.find((r) => r.id === routeId || r.RouteID === routeId);

    const targetBusId = bus?.id || busId;
    const rawStops = route?.stops || route?.Stops || [];
    const stops = rawStops.map((s, idx) => ({
      id: s.id || s.StopID || `stop_${idx}`,
      name: s.name || s.StopName || `Stop #${idx + 1}`,
      lat: parseFloat(s.lat || s.Latitude || s.latitude || 24.5850),
      lng: parseFloat(s.lng || s.Longitude || s.longitude || 73.6900),
      time: s.estimatedTime || s.ExpectedArrivalTime || '08:30 AM',
    }));

    const firstStop = stops[0] || { id: 's1', name: 'Depot Terminal', lat: 24.5714, lng: 73.6974 };
    const secondStop = stops[1] || { id: 's2', name: 'Next Scheduled Stop', lat: 24.5780, lng: 73.6990 };
    const now = new Date().toISOString();
    const depTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Parse duration (e.g. "26 mins" -> 26)
    const durationMatch = (route?.estimatedDuration || route?.duration || '30 mins').match(/\d+/);
    const durationMins = durationMatch ? parseInt(durationMatch[0]) : 30;
    const expArrival = calculateExpectedArrival(durationMins, 0);

    const newTripId = `TRP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrip = {
      id: newTripId,
      tripId: newTripId,
      busId: targetBusId,
      BusID: targetBusId,
      busNumber: bus?.busNumber || bus?.BusNo || 'BUS-101',
      driverId: driver?.id || driver?.DriverID || driverId || 'drv_1',
      DriverID: driver?.id || driver?.DriverID || driverId || 'drv_1',
      driverName: driver?.name || driver?.Name || 'Ramesh Sharma',
      routeId: route?.id || route?.RouteID || routeId || 'route_1',
      RouteID: route?.id || route?.RouteID || routeId || 'route_1',
      routeName: route?.routeName || 'Assigned Route',
      startTime: depTime,
      departureTime: depTime,
      expectedArrival: expArrival,
      endTime: null,
      status: 'In Transit',
      timingStatus: 'In Transit',
      delayMinutes: 0,
      passengers: bus?.currentOccupancy || 25,
      currentStop: firstStop.name,
      nextStop: secondStop.name,
      eta: '4 mins',
      date: now.split('T')[0],
    };

    // Initialize route progress tracking
    simulationProgressRef.current[targetBusId] = {
      stopIndex: 0,
      segmentProgress: 0.0,
      holdTicks: 0,
    };

    // Calculate initial dynamic geodesic distance and ETA
    const initialEta = calculateRealEta({
      currentLat: firstStop.lat,
      currentLng: firstStop.lng,
      nextStopLat: secondStop.lat,
      nextStopLng: secondStop.lng,
      speed: 30.0,
      delayMinutes: 0,
      isLive: true,
      status: 'In Transit',
      currentStopIdx: 0,
      totalStops: stops.length,
    });

    // Update Buses
    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? {
              ...b,
              status: 'In Transit',
              timingStatus: 'In Transit',
              departureTime: depTime,
              expectedArrival: expArrival,
              delayMinutes: 0,
              isLive: true,
              speed: 30.0,
              currentLat: firstStop.lat,
              Latitude: firstStop.lat,
              currentLng: firstStop.lng,
              Longitude: firstStop.lng,
              currentStop: firstStop.name,
              currentStopIdx: 0,
              nextStop: secondStop.name,
              nextStopIdx: 1,
              completedStopIds: [firstStop.id],
              distanceToNextKm: initialEta.distanceKm,
              distanceToNextMeters: initialEta.distanceMeters,
              distanceToNextText: initialEta.distanceText,
              distanceText: initialEta.distanceText,
              etaMinutes: initialEta.etaMinutes,
              eta: initialEta.etaMinutes,
              etaText: initialEta.etaText,
              etaClockTime: initialEta.etaClockTime,
              routeProgress: 0,
              lastUpdated: now,
              timestamp: now,
            }
          : b
      )
    );

    // Update Tracking (Unified Single Source of Truth)
    setTracking((prev) => ({
      ...prev,
      [targetBusId]: {
        BusID: targetBusId,
        busId: targetBusId,
        busNumber: bus?.busNumber || bus?.BusNo || 'BUS-101',
        driverId: driver?.id || driver?.DriverID || driverId || 'drv_1',
        driverName: driver?.name || driver?.Name || 'Ramesh Sharma',
        routeId: route?.id || route?.RouteID || routeId || 'route_1',
        routeName: route?.routeName || 'Assigned Route',
        departureTime: depTime,
        expectedArrival: expArrival,
        timingStatus: 'In Transit',
        delayMinutes: 0,
        Latitude: firstStop.lat,
        currentLat: firstStop.lat,
        Longitude: firstStop.lng,
        currentLng: firstStop.lng,
        speed: 30.0,
        timestamp: now,
        lastUpdated: now,
        currentStop: firstStop.name,
        currentStopIdx: 0,
        nextStop: secondStop.name,
        nextStopIdx: 1,
        completedStopIds: [firstStop.id],
        routeProgress: 0,
        distanceToNextKm: initialEta.distanceKm,
        distanceToNextMeters: initialEta.distanceMeters,
        distanceToNextText: initialEta.distanceText,
        distanceText: initialEta.distanceText,
        eta: initialEta.etaMinutes,
        etaMinutes: initialEta.etaMinutes,
        etaText: initialEta.etaText,
        etaClockTime: initialEta.etaClockTime,
        isLive: true,
        status: 'In Transit',
      }
    }));

    // Update Drivers
    if (driver) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id || d.DriverID === driver.DriverID
            ? { ...d, status: 'On Trip', tripsToday: (d.tripsToday || 0) + 1 }
            : d
        )
      );
    }

    // Add Trip Record
    setTrips((prev) => [newTrip, ...prev]);

    logActivity('Trip Started', `${newTrip.busNumber} departed at ${depTime} on ${newTrip.routeName}`, 'Trip');
    broadcastEvent('BUS_STATE_SYNC', { busId: targetBusId, status: 'In Transit', departureTime: depTime, expectedArrival: expArrival });
    return newTrip;
  }, [buses, drivers, routes, logActivity, broadcastEvent]);

  /**
   * 2. END TRIP (Driver -> Shared Context)
   */
  const endTrip = useCallback((busId) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const targetBusId = bus?.id || busId;
    const now = new Date().toISOString();
    const endFormattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Clean up simulation progression state
    delete simulationProgressRef.current[targetBusId];

    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? {
              ...b,
              status: 'At Depot',
              timingStatus: 'Completed',
              actualArrival: endFormattedTime,
              isLive: false,
              speed: 0,
              currentStop: 'Depot Yard (Trip Completed)',
              currentStopIdx: 0,
              nextStop: 'None',
              nextStopIdx: 0,
              completedStopIds: [],
              routeProgress: 100,
              etaMinutes: 0,
              eta: 0,
              lastUpdated: now,
              timestamp: now,
            }
          : b
      )
    );

    setTracking((prev) => ({
      ...prev,
      [targetBusId]: {
        ...(prev[targetBusId] || {}),
        BusID: targetBusId,
        busId: targetBusId,
        speed: 0,
        isLive: false,
        status: 'At Depot',
        timingStatus: 'Completed',
        actualArrival: endFormattedTime,
        currentStop: 'Depot Yard (Trip Completed)',
        currentStopIdx: 0,
        nextStop: 'None',
        nextStopIdx: 0,
        completedStopIds: [],
        routeProgress: 100,
        eta: 0,
        etaMinutes: 0,
        lastUpdated: now,
        timestamp: now,
      }
    }));

    // Update active trip
    setTrips((prev) =>
      prev.map((t) =>
        (t.busId === targetBusId || t.BusID === targetBusId) && t.status === 'In Transit'
          ? { ...t, status: 'Completed', timingStatus: 'Completed', endTime: endFormattedTime }
          : t
      )
    );

    // Free driver
    if (bus?.driverId) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === bus.driverId || d.DriverID === bus.driverId
            ? { ...d, status: 'Available' }
            : d
        )
      );
    }

    logActivity('Trip Completed', `Bus ${bus?.busNumber || targetBusId} completed trip at ${endFormattedTime}`, 'Trip');
    broadcastEvent('BUS_STATE_SYNC', { busId: targetBusId, status: 'Completed', timingStatus: 'Completed' });
  }, [buses, logActivity, broadcastEvent]);

  /**
   * 3. REPORT DELAY (Driver/Admin -> Shared Context)
   * Updates delay minutes, calculates new expected arrival time, sets status to 'Delayed', timingStatus to 'Delayed', and updates ETA
   */
  const reportDelay = useCallback((busId, delayMin = 10, reason = 'Traffic Congestion') => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    if (!bus) return;
    const targetBusId = bus.id || busId;
    const now = new Date().toISOString();

    const currentDelay = (bus.delayMinutes || 0) + delayMin;
    const route = routes.find((r) => r.id === bus.routeId || r.RouteID === bus.routeId) || routes[0];
    const nxtStop = route?.stops?.find((s) => s.name === bus.nextStop) || route?.stops?.[1] || { lat: bus.currentLat, lng: bus.currentLng };

    const revisedEta = calculateRealEta({
      currentLat: bus.currentLat,
      currentLng: bus.currentLng,
      nextStopLat: nxtStop.lat || nxtStop.Latitude || 24.5850,
      nextStopLng: nxtStop.lng || nxtStop.Longitude || 73.6900,
      speed: bus.speed || 0,
      delayMinutes: currentDelay,
      isLive: true,
      status: 'Delayed',
      currentStopIdx: bus.currentStopIdx || 0,
      totalStops: route?.stops?.length || 5,
    });

    const newExpectedArrival = revisedEta.etaClockTime;

    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? {
              ...b,
              status: 'Delayed',
              timingStatus: 'Delayed',
              delayMinutes: currentDelay,
              delayReason: reason,
              distanceToNextKm: revisedEta.distanceKm,
              distanceToNextMeters: revisedEta.distanceMeters,
              distanceToNextText: revisedEta.distanceText,
              distanceText: revisedEta.distanceText,
              etaMinutes: revisedEta.etaMinutes,
              eta: revisedEta.etaMinutes,
              etaText: revisedEta.etaText,
              etaClockTime: revisedEta.etaClockTime,
              expectedArrival: newExpectedArrival,
              lastUpdated: now,
            }
          : b
      )
    );

    setTracking((prev) => ({
      ...prev,
      [targetBusId]: {
        ...(prev[targetBusId] || {}),
        status: 'Delayed',
        timingStatus: 'Delayed',
        delayMinutes: currentDelay,
        delayReason: reason,
        distanceToNextKm: revisedEta.distanceKm,
        distanceToNextMeters: revisedEta.distanceMeters,
        distanceToNextText: revisedEta.distanceText,
        distanceText: revisedEta.distanceText,
        etaMinutes: revisedEta.etaMinutes,
        eta: revisedEta.etaMinutes,
        etaText: revisedEta.etaText,
        etaClockTime: revisedEta.etaClockTime,
        expectedArrival: newExpectedArrival,
        lastUpdated: now,
      }
    }));

    // Broadcast advisory notice
    const noticeId = `notif_${Date.now()}`;
    const notice = {
      id: noticeId,
      title: `Route Delay Advisory: ${bus.busNumber} (${reason})`,
      message: `Bus ${bus.busNumber} on ${bus.routeName} is experiencing delays due to ${reason}. Expected arrival revised to ${newExpectedArrival} (+${delayMin}m delay).`,
      type: 'Delay',
      target: 'All Students',
      timestamp: new Date().toISOString(),
      authorRole: 'Transit Dispatch'
    };

    setNotices((prev) => [notice, ...prev]);
    logActivity('Bus Delayed', `${bus.busNumber} reported ${reason} (+${delayMin} mins, expected: ${newExpectedArrival})`, 'Warning');
    broadcastEvent('BUS_DELAY_SYNC', { busId: targetBusId, delayMinutes: currentDelay, expectedArrival: newExpectedArrival });
  }, [buses, logActivity, broadcastEvent]);

  /**
   * 4. SET BUS TIMING STATUS (Admin / Dispatcher Control)
   * Supports: 'On Time' | 'Delayed' | 'In Transit' | 'Completed' | 'Cancelled'
   */
  const setBusTimingStatus = useCallback((busId, timingStatus, customFields = {}) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    if (!bus) return;
    const targetBusId = bus.id || busId;
    const now = new Date().toISOString();

    let newStatus = bus.status;
    if (timingStatus === 'In Transit') newStatus = 'In Transit';
    else if (timingStatus === 'Delayed') newStatus = 'Delayed';
    else if (timingStatus === 'On Time') newStatus = bus.isLive ? 'In Transit' : 'At Depot';
    else if (timingStatus === 'Completed') newStatus = 'At Depot';
    else if (timingStatus === 'Cancelled') newStatus = 'Maintenance';

    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? {
              ...b,
              status: newStatus,
              timingStatus,
              ...customFields,
              lastUpdated: now,
            }
          : b
      )
    );

    setTracking((prev) => ({
      ...prev,
      [targetBusId]: {
        ...(prev[targetBusId] || {}),
        status: newStatus,
        timingStatus,
        ...customFields,
        lastUpdated: now,
      }
    }));

    logActivity('Timing Status Updated', `${bus.busNumber} status updated to ${timingStatus}`, 'Admin');
    broadcastEvent('BUS_STATE_SYNC', { busId: targetBusId, timingStatus, status: newStatus });
  }, [buses, logActivity, broadcastEvent]);

  /**
   * 3. ADVANCE STOP (Driver -> Shared Context)
   */
  const advanceStop = useCallback((busId, stopIndex) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const route = routes.find((r) => r.id === bus?.routeId || r.RouteID === bus?.routeId) || routes[0];
    const targetBusId = bus?.id || busId;

    if (!route?.stops?.[stopIndex]) return;

    const totalStops = route.stops.length;
    const currentStop = route.stops[stopIndex];
    const nextStop = route.stops[stopIndex + 1] || { name: 'Terminal Destination Reached', lat: currentStop.lat, lng: currentStop.lng };
    const now = new Date().toISOString();
    const routeProgress = Math.min(100, Math.round((stopIndex / (totalStops - 1)) * 100));
    const completedStopIds = route.stops.slice(0, stopIndex + 1).map((s) => s.id || `stop_${s.sequenceOrder}`);

    // Synchronize simulation progress ref directly
    simulationProgressRef.current[targetBusId] = {
      stopIndex,
      segmentProgress: 0.0,
      holdTicks: 0,
    };

    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? {
              ...b,
              currentStop: currentStop.name,
              currentStopIdx: stopIndex,
              nextStop: nextStop.name,
              nextStopIdx: Math.min(totalStops - 1, stopIndex + 1),
              completedStopIds,
              currentLat: currentStop.lat,
              Latitude: currentStop.lat,
              currentLng: currentStop.lng,
              Longitude: currentStop.lng,
              routeProgress,
              etaMinutes: route.stops[stopIndex + 1] ? 4 : 0,
              eta: route.stops[stopIndex + 1] ? 4 : 0,
              lastUpdated: now,
              timestamp: now,
            }
          : b
      )
    );

    setTracking((prev) => ({
      ...prev,
      [targetBusId]: {
        ...(prev[targetBusId] || {}),
        BusID: targetBusId,
        busId: targetBusId,
        Latitude: currentStop.lat,
        currentLat: currentStop.lat,
        Longitude: currentStop.lng,
        currentLng: currentStop.lng,
        currentStop: currentStop.name,
        currentStopIdx: stopIndex,
        nextStop: nextStop.name,
        nextStopIdx: Math.min(totalStops - 1, stopIndex + 1),
        completedStopIds,
        routeProgress,
        eta: route.stops[stopIndex + 1] ? 4 : 0,
        etaMinutes: route.stops[stopIndex + 1] ? 4 : 0,
        timestamp: now,
        lastUpdated: now,
      }
    }));

    setTrips((prev) =>
      prev.map((t) =>
        (t.busId === targetBusId || t.BusID === targetBusId) && t.status === 'In Transit'
          ? { ...t, currentStop: currentStop.name, nextStop: nextStop.name }
          : t
      )
    );

    logActivity('Stop Arrival', `${bus?.busNumber || targetBusId} reached ${currentStop.name}`, 'Trip');
    broadcastEvent('BUS_STATE_SYNC', { busId: targetBusId, currentStop: currentStop.name });
  }, [buses, routes, logActivity, broadcastEvent]);

  /**
   * 4. UPDATE PASSENGER COUNT (Driver -> Shared Context)
   */
  const updatePassengerCount = useCallback((busId, newCountOrDelta, isDelta = false) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const targetBusId = bus?.id || busId;
    const capacity = bus?.capacity || bus?.Capacity || 50;

    let updatedCount = newCountOrDelta;
    if (isDelta) {
      updatedCount = Math.max(0, Math.min(capacity, (bus?.currentOccupancy || 0) + newCountOrDelta));
    } else {
      updatedCount = Math.max(0, Math.min(capacity, newCountOrDelta));
    }

    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? { ...b, currentOccupancy: updatedCount }
          : b
      )
    );

    setTrips((prev) =>
      prev.map((t) =>
        (t.busId === targetBusId || t.BusID === targetBusId) && t.status === 'In Transit'
          ? { ...t, passengers: updatedCount }
          : t
      )
    );

    broadcastEvent('BUS_STATE_SYNC', { busId: targetBusId, currentOccupancy: updatedCount });
  }, [buses, broadcastEvent]);

  /**
   * 5. BUS CRUD & UPDATE (Shared Context with REST API Integration)
   */
  const addBus = useCallback(async (newBus) => {
    try {
      const payload = {
        bus_number: newBus.busNumber || newBus.BusNo,
        registration_number: newBus.registrationNumber,
        model: newBus.model || 'Standard Transit Bus',
        capacity: parseInt(newBus.capacity || newBus.Capacity) || 50,
        current_occupancy: 0,
        fuel_type: newBus.fuelType || 'Diesel',
        status: newBus.status || 'At Depot',
      };
      const res = await busApi.createBus(payload);
      await refreshAdminData();
      logActivity('Bus Added', `Added ${payload.bus_number} to fleet`, 'Bus');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error creating bus:', err);
      return { success: false, error: err.message || 'Failed to create bus.' };
    }
  }, [refreshAdminData, logActivity]);

  const updateBus = useCallback(async (busId, updatedFields) => {
    try {
      const payload = {};
      if (updatedFields.busNumber || updatedFields.BusNo) payload.bus_number = updatedFields.busNumber || updatedFields.BusNo;
      if (updatedFields.registrationNumber) payload.registration_number = updatedFields.registrationNumber;
      if (updatedFields.model) payload.model = updatedFields.model;
      if (updatedFields.capacity || updatedFields.Capacity) payload.capacity = parseInt(updatedFields.capacity || updatedFields.Capacity);
      if (updatedFields.fuelType) payload.fuel_type = updatedFields.fuelType;
      if (updatedFields.status) payload.status = updatedFields.status;

      const res = await busApi.updateBus(busId, payload);
      await refreshAdminData();
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error updating bus:', err);
      return { success: false, error: err.message || 'Failed to update bus.' };
    }
  }, [refreshAdminData]);

  const deleteBus = useCallback(async (busId) => {
    try {
      const res = await busApi.deleteBus(busId);
      await refreshAdminData();
      logActivity('Bus Deleted', `Deleted bus ID ${busId}`, 'Bus');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error deleting bus:', err);
      return { success: false, error: err.message || 'Failed to delete bus.' };
    }
  }, [refreshAdminData, logActivity]);

  /**
   * 6. DRIVER CRUD & ASSIGNMENT (Shared Context with REST API Integration)
   */
  const addDriver = useCallback(async (newDriver) => {
    try {
      const payload = {
        name: newDriver.name || newDriver.Name,
        email: newDriver.email || `${(newDriver.name || 'driver').toLowerCase().replace(/\s+/g, '')}@smartbus.edu`,
        phone: newDriver.phone || newDriver.Contact,
        employee_id: newDriver.employeeId || newDriver.driverId || newDriver.DriverID || `EMP-${Date.now()}`,
        license_number: newDriver.licenseNumber || `LIC-${Date.now()}`,
        status: newDriver.status || 'Available',
        shift: newDriver.shift || 'Morning',
        assigned_bus_id: newDriver.assignedBusId ? parseInt(newDriver.assignedBusId) : null,
        assigned_route_id: newDriver.assignedRouteId ? parseInt(newDriver.assignedRouteId) : null,
      };
      const res = await driverApi.createDriver(payload);
      await refreshAdminData();
      logActivity('Driver Added', `Registered driver ${payload.name}`, 'Driver');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error creating driver:', err);
      return { success: false, error: err.message || 'Failed to create driver.' };
    }
  }, [refreshAdminData, logActivity]);

  const updateDriver = useCallback(async (driverId, updatedFields) => {
    try {
      const payload = {};
      if (updatedFields.name || updatedFields.Name) payload.name = updatedFields.name || updatedFields.Name;
      if (updatedFields.email) payload.email = updatedFields.email;
      if (updatedFields.phone || updatedFields.Contact) payload.phone = updatedFields.phone || updatedFields.Contact;
      if (updatedFields.licenseNumber) payload.license_number = updatedFields.licenseNumber;
      if (updatedFields.status) payload.status = updatedFields.status;
      if (updatedFields.shift) payload.shift = updatedFields.shift;
      if (updatedFields.assignedBusId !== undefined) payload.assigned_bus_id = updatedFields.assignedBusId ? parseInt(updatedFields.assignedBusId) : null;
      if (updatedFields.assignedRouteId !== undefined) payload.assigned_route_id = updatedFields.assignedRouteId ? parseInt(updatedFields.assignedRouteId) : null;

      const res = await driverApi.updateDriver(driverId, payload);
      await refreshAdminData();
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error updating driver:', err);
      return { success: false, error: err.message || 'Failed to update driver.' };
    }
  }, [refreshAdminData]);

  const deleteDriver = useCallback(async (driverId) => {
    try {
      const res = await driverApi.deleteDriver(driverId);
      await refreshAdminData();
      logActivity('Driver Deleted', `Removed driver ID ${driverId}`, 'Driver');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error deleting driver:', err);
      return { success: false, error: err.message || 'Failed to delete driver.' };
    }
  }, [refreshAdminData, logActivity]);

  /**
   * CENTRAL ASSIGNMENT SYSTEM (BUS + DRIVER + ROUTE)
   */
  const assignDriverToBus = useCallback(async (busId, driverId, routeId, shift = 'Morning') => {
    try {
      const payload = {
        assigned_bus_id: busId ? parseInt(busId) : null,
        assigned_route_id: routeId ? parseInt(routeId) : null,
        shift: shift || 'Morning',
      };
      const res = await driverApi.assignDriver(driverId, payload);
      await refreshAdminData();
      logActivity('Assignment Created', `Assigned bus ${busId} ➔ driver ${driverId}`, 'Assignment');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error assigning driver:', err);
      return { success: false, error: err.message || 'Failed to assign driver.' };
    }
  }, [refreshAdminData, logActivity]);

  const changeAssignedDriver = useCallback(async (busId, newDriverId) => {
    try {
      const bus = buses.find((b) => b.id === busId || b.BusID === busId || b.id === parseInt(busId));
      const newDriver = drivers.find((d) => d.id === newDriverId || d.DriverID === newDriverId || d.id === parseInt(newDriverId));

      if (!bus || !newDriver) return { success: false, error: 'Bus or Driver not found.' };

      const oldDriverId = bus.driverId;
      if (oldDriverId && oldDriverId !== newDriver.id) {
        await driverApi.assignDriver(oldDriverId, { assigned_bus_id: null, assigned_route_id: null });
      }

      const res = await driverApi.assignDriver(newDriver.id, {
        assigned_bus_id: parseInt(bus.id),
        assigned_route_id: bus.routeId ? parseInt(bus.routeId) : null,
        shift: bus.shift || 'Morning',
      });
      await refreshAdminData();
      logActivity('Driver Changed', `Changed driver on ${bus.busNumber || bus.BusNo} to ${newDriver.name || newDriver.Name}`, 'Assignment');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error changing assigned driver:', err);
      return { success: false, error: err.message || 'Failed to change assigned driver.' };
    }
  }, [buses, drivers, refreshAdminData, logActivity]);

  const changeAssignedRoute = useCallback(async (busId, newRouteId) => {
    try {
      const bus = buses.find((b) => b.id === busId || b.BusID === busId || b.id === parseInt(busId));
      const route = routes.find((r) => r.id === newRouteId || r.RouteID === newRouteId || r.id === parseInt(newRouteId));

      if (!bus || !route) return { success: false, error: 'Bus or Route not found.' };

      if (bus.driverId) {
        await driverApi.assignDriver(bus.driverId, {
          assigned_bus_id: parseInt(bus.id),
          assigned_route_id: parseInt(route.id),
          shift: bus.shift || 'Morning',
        });
      }
      await refreshAdminData();
      logActivity('Route Changed', `Changed route on ${bus.busNumber || bus.BusNo} to ${route.routeName}`, 'Assignment');
      return { success: true };
    } catch (err) {
      console.error('Error changing assigned route:', err);
      return { success: false, error: err.message || 'Failed to change assigned route.' };
    }
  }, [buses, routes, refreshAdminData, logActivity]);

  const unassignDriver = useCallback(async (driverId) => {
    try {
      const driver = drivers.find((d) => d.id === driverId || d.DriverID === driverId || d.id === parseInt(driverId));
      if (!driver) return { success: false, error: 'Driver not found.' };

      const res = await driverApi.assignDriver(driver.id, {
        assigned_bus_id: null,
        assigned_route_id: null,
      });
      await refreshAdminData();
      logActivity('Driver Unassigned', `Unassigned driver ${driver.name || driver.Name}`, 'Assignment');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error unassigning driver:', err);
      return { success: false, error: err.message || 'Failed to unassign driver.' };
    }
  }, [drivers, refreshAdminData, logActivity]);

  const assignRouteToDriver = useCallback(async (driverId, routeId) => {
    try {
      const driver = drivers.find((d) => d.id === driverId || d.DriverID === driverId || d.id === parseInt(driverId));
      const route = routes.find((r) => r.id === routeId || r.RouteID === routeId || r.id === parseInt(routeId));

      if (!driver || !route) return { success: false, error: 'Driver or Route not found.' };

      const res = await driverApi.assignDriver(driver.id, {
        assigned_bus_id: driver.assignedBusId ? parseInt(driver.assignedBusId) : null,
        assigned_route_id: parseInt(route.id),
        shift: driver.shift || 'Morning',
      });
      await refreshAdminData();
      logActivity('Route Assigned to Driver', `Assigned ${driver.name || driver.Name} to ${route.routeName}`, 'Assignment');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error assigning route to driver:', err);
      return { success: false, error: err.message || 'Failed to assign route to driver.' };
    }
  }, [drivers, routes, refreshAdminData, logActivity]);

  const unassignBus = useCallback(async (busId) => {
    try {
      const bus = buses.find((b) => b.id === busId || b.BusID === busId || b.id === parseInt(busId));
      if (bus && bus.driverId) {
        await driverApi.assignDriver(bus.driverId, {
          assigned_bus_id: null,
          assigned_route_id: null,
        });
      }
      await refreshAdminData();
      logActivity('Bus Unassigned', `Unassigned bus ${bus ? (bus.busNumber || bus.BusNo) : busId}`, 'Assignment');
      return { success: true };
    } catch (err) {
      console.error('Error unassigning bus:', err);
      return { success: false, error: err.message || 'Failed to unassign bus.' };
    }
  }, [buses, refreshAdminData, logActivity]);

  /**
   * 7. ROUTE CRUD (Shared Context)
   */
  /**
   * 7. ROUTE & STOP MANAGEMENT (Admin -> Student/Driver Shared Context)
   */
  const normalizeStop = (stop, index = 0) => {
    const sId = stop.StopID || stop.stopId || stop.id || `stp_${Date.now()}_${index}`;
    const sName = stop.StopName || stop.stopName || stop.name || `Stop #${index + 1}`;
    const seq = parseInt(stop.Sequence || stop.sequence || stop.sequenceOrder) || (index + 1);
    const lat = parseFloat(stop.Latitude || stop.lat || stop.latitude) || 24.5850;
    const lng = parseFloat(stop.Longitude || stop.lng || stop.longitude) || 73.6900;
    const time = stop.ExpectedArrivalTime || stop.expectedArrivalTime || stop.estimatedTime || '08:30 AM';

    return {
      id: sId,
      StopID: sId,
      stopId: sId,
      name: sName,
      StopName: sName,
      stopName: sName,
      sequenceOrder: seq,
      Sequence: seq,
      sequence: seq,
      lat,
      Latitude: lat,
      latitude: lat,
      lng,
      Longitude: lng,
      longitude: lng,
      estimatedTime: time,
      ExpectedArrivalTime: time,
      expectedArrivalTime: time
    };
  };

  /**
   * 7. ROUTE & STOP MANAGEMENT (Shared Context with REST API Integration)
   */
  const addRoute = useCallback(async (newRoute) => {
    try {
      const routePayload = {
        route_code: newRoute.routeCode || newRoute.id || `R-${Math.floor(10 + Math.random() * 90)}`,
        name: newRoute.routeName || newRoute.RouteName,
        start_point: newRoute.startPoint || newRoute.StartPoint,
        end_point: newRoute.endPoint || newRoute.EndPoint || newRoute.destination,
        distance_km: parseFloat(newRoute.totalDistance || newRoute.distance || 10),
        estimated_duration: newRoute.estimatedDuration || '25 mins',
        status: newRoute.status || 'Active',
      };
      const res = await routeApi.createRoute(routePayload);
      const createdRoute = res.data;
      const createdRouteId = createdRoute.id;

      if (Array.isArray(newRoute.stops) && newRoute.stops.length > 0) {
        for (let idx = 0; idx < newRoute.stops.length; idx++) {
          const s = newRoute.stops[idx];
          await routeApi.createRouteStop(createdRouteId, {
            stop_name: s.name || s.StopName,
            latitude: parseFloat(s.lat || s.Latitude || 24.5850),
            longitude: parseFloat(s.lng || s.Longitude || 73.6900),
            stop_order: s.sequenceOrder || s.sequence || idx + 1,
            scheduled_arrival: s.estimatedTime || s.ExpectedArrivalTime || '08:30 AM',
          });
        }
      }

      await refreshAdminData();
      logActivity('Route Created', `Created route ${routePayload.name}`, 'Route');
      return { success: true, data: createdRoute };
    } catch (err) {
      console.error('Error creating route:', err);
      return { success: false, error: err.message || 'Failed to create route.' };
    }
  }, [refreshAdminData, logActivity]);

  const updateRoute = useCallback(async (routeId, updatedFields) => {
    try {
      const payload = {};
      if (updatedFields.routeName || updatedFields.RouteName) payload.name = updatedFields.routeName || updatedFields.RouteName;
      if (updatedFields.startPoint || updatedFields.StartPoint) payload.start_point = updatedFields.startPoint || updatedFields.StartPoint;
      if (updatedFields.endPoint || updatedFields.EndPoint || updatedFields.destination) payload.end_point = updatedFields.endPoint || updatedFields.EndPoint || updatedFields.destination;
      if (updatedFields.totalDistance || updatedFields.distance) payload.distance_km = parseFloat(updatedFields.totalDistance || updatedFields.distance);
      if (updatedFields.estimatedDuration) payload.estimated_duration = updatedFields.estimatedDuration;
      if (updatedFields.status) payload.status = updatedFields.status;

      const res = await routeApi.updateRoute(routeId, payload);
      await refreshAdminData();
      logActivity('Route Updated', `Updated route ${routeId}`, 'Route');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error updating route:', err);
      return { success: false, error: err.message || 'Failed to update route.' };
    }
  }, [refreshAdminData, logActivity]);

  const deleteRoute = useCallback(async (routeId) => {
    try {
      const res = await routeApi.deleteRoute(routeId);
      await refreshAdminData();
      logActivity('Route Deleted', `Deleted route ${routeId}`, 'Route');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error deleting route:', err);
      return { success: false, error: err.message || 'Failed to delete route.' };
    }
  }, [refreshAdminData, logActivity]);

  const addStopToRoute = useCallback(async (routeId, stopData) => {
    try {
      const payload = {
        stop_name: stopData.name || stopData.StopName,
        latitude: parseFloat(stopData.lat || stopData.Latitude || 24.5850),
        longitude: parseFloat(stopData.lng || stopData.Longitude || 73.6900),
        stop_order: parseInt(stopData.sequence || stopData.sequenceOrder || 1),
        scheduled_arrival: stopData.estimatedTime || stopData.ExpectedArrivalTime || '08:30 AM',
      };
      const res = await routeApi.createRouteStop(routeId, payload);
      await refreshAdminData();
      logActivity('Stop Added', `Added stop ${payload.stop_name} to route ${routeId}`, 'Route');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error adding stop:', err);
      return { success: false, error: err.message || 'Failed to add route stop.' };
    }
  }, [refreshAdminData, logActivity]);

  const updateStopInRoute = useCallback(async (routeId, stopId, updatedStopFields) => {
    try {
      const payload = {};
      if (updatedStopFields.name || updatedStopFields.StopName) payload.stop_name = updatedStopFields.name || updatedStopFields.StopName;
      if (updatedStopFields.lat !== undefined) payload.latitude = parseFloat(updatedStopFields.lat);
      if (updatedStopFields.lng !== undefined) payload.longitude = parseFloat(updatedStopFields.lng);
      if (updatedStopFields.sequence !== undefined) payload.stop_order = parseInt(updatedStopFields.sequence);
      if (updatedStopFields.estimatedTime || updatedStopFields.ExpectedArrivalTime) payload.scheduled_arrival = updatedStopFields.estimatedTime || updatedStopFields.ExpectedArrivalTime;

      const res = await routeApi.updateRouteStop(routeId, stopId, payload);
      await refreshAdminData();
      logActivity('Stop Updated', `Updated stop ${stopId} on route ${routeId}`, 'Route');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error updating stop:', err);
      return { success: false, error: err.message || 'Failed to update route stop.' };
    }
  }, [refreshAdminData, logActivity]);

  const deleteStopFromRoute = useCallback(async (routeId, stopId) => {
    try {
      const res = await routeApi.deleteRouteStop(routeId, stopId);
      await refreshAdminData();
      logActivity('Stop Deleted', `Deleted stop ${stopId} from route ${routeId}`, 'Route');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error deleting stop:', err);
      return { success: false, error: err.message || 'Failed to delete route stop.' };
    }
  }, [refreshAdminData, logActivity]);

  const moveStopOrder = useCallback((routeId, stopId, direction) => {
    setRoutes((prev) => {
      const next = prev.map((r) => {
        if (r.id !== routeId && r.RouteID !== routeId) return r;

        const currentStops = [...(r.stops || [])];
        const idx = currentStops.findIndex((s) => s.id === stopId || s.StopID === stopId);
        if (idx === -1) return r;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= currentStops.length) return r;

        // Swap stops
        const temp = currentStops[idx];
        currentStops[idx] = currentStops[targetIdx];
        currentStops[targetIdx] = temp;

        const reorderedStops = currentStops.map((s, i) => normalizeStop(s, i));
        const startPt = reorderedStops.length > 0 ? reorderedStops[0].name : r.startPoint;
        const endPt = reorderedStops.length > 0 ? reorderedStops[reorderedStops.length - 1].name : r.endPoint;

        return {
          ...r,
          StartPoint: startPt,
          startPoint: startPt,
          EndPoint: endPt,
          endPoint: endPt,
          destination: endPt,
          stops: reorderedStops,
          Stops: reorderedStops
        };
      });

      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    logActivity('Stop Reordered', `Moved stop ${stopId} ${direction} on route ${routeId}`, 'Route');
  }, [logActivity, broadcastEvent]);

  const reorderRouteStops = useCallback((routeId, newStopsList) => {
    setRoutes((prev) => {
      const next = prev.map((r) => {
        if (r.id !== routeId && r.RouteID !== routeId) return r;

        const reorderedStops = newStopsList.map((s, idx) => normalizeStop(s, idx));
        const startPt = reorderedStops.length > 0 ? reorderedStops[0].name : r.startPoint;
        const endPt = reorderedStops.length > 0 ? reorderedStops[reorderedStops.length - 1].name : r.endPoint;

        return {
          ...r,
          StartPoint: startPt,
          startPoint: startPt,
          EndPoint: endPt,
          endPoint: endPt,
          destination: endPt,
          stops: reorderedStops,
          Stops: reorderedStops
        };
      });

      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    logActivity('Stops Reordered', `Reordered stops on route ${routeId}`, 'Route');
  }, [logActivity, broadcastEvent]);

  /**
   * 8. COMPLAINTS (Student -> Admin Shared Context with REST API Integration)
   */
  const addComplaint = useCallback(async (complaintData) => {
    try {
      const busObj = buses.find((b) => b.busNumber === complaintData.busNo || b.busNumber === complaintData.busNumber || b.id === complaintData.busId);
      const routeObj = routes.find((r) => r.routeName === complaintData.routeName || r.id === complaintData.routeId);

      const payload = {
        bus_id: busObj ? parseInt(busObj.id || busObj.BusID, 10) : null,
        route_id: routeObj ? parseInt(routeObj.id || routeObj.RouteID, 10) : null,
        subject: complaintData.title || complaintData.subject || `${complaintData.category || 'Transit'} Issue`,
        category: complaintData.category || 'Bus Delay',
        description: complaintData.description || 'Grievance submitted by student',
        priority: complaintData.priority || 'Medium',
      };

      const res = await complaintApi.createComplaint(payload);
      await refreshAdminData();
      logActivity('Complaint Lodged', `Complaint logged for ${complaintData.busNo || 'Transit'}`, 'Notice');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error creating complaint:', err);
      return { success: false, error: err.message || 'Failed to submit complaint.' };
    }
  }, [buses, routes, refreshAdminData, logActivity]);

  const updateComplaintStatus = useCallback(async (complaintId, status, remark = '') => {
    try {
      const numericId = parseInt(String(complaintId).replace(/\D/g, ''), 10) || complaintId;
      const payload = {
        status,
        admin_response: remark
      };
      await complaintApi.updateComplaint(numericId, payload);
      await refreshAdminData();
      logActivity('Complaint Updated', `Complaint ${complaintId} status changed to ${status}`, 'Notice');
      return { success: true };
    } catch (err) {
      console.error('Error updating complaint:', err);
      return { success: false, error: err.message || 'Failed to update complaint.' };
    }
  }, [refreshAdminData, logActivity]);

  /**
   * 9. NOTICES & MAINTENANCE (REST API Integrated)
   */
  const publishNotice = useCallback(async (newNotice) => {
    try {
      const payload = {
        title: newNotice.title || 'General Notice',
        message: newNotice.message || '',
        type: newNotice.type || 'General Announcement',
        target: newNotice.target || 'All Students',
      };
      const res = await noticeApi.createNotice(payload);
      await refreshAdminData();
      logActivity('Notice Published', `Broadcasted notice: ${payload.title}`, 'Notice');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error publishing notice:', err);
      return { success: false, error: err.message || 'Failed to publish notice.' };
    }
  }, [refreshAdminData, logActivity]);

  const updateNotice = useCallback(async (noticeId, updatedNotice) => {
    try {
      const payload = {};
      if (updatedNotice.title) payload.title = updatedNotice.title;
      if (updatedNotice.message) payload.message = updatedNotice.message;
      if (updatedNotice.type) payload.type = updatedNotice.type;
      if (updatedNotice.target) payload.target = updatedNotice.target;

      const res = await noticeApi.updateNotice(noticeId, payload);
      await refreshAdminData();
      logActivity('Notice Updated', `Updated notice ${noticeId}`, 'Notice');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error updating notice:', err);
      return { success: false, error: err.message || 'Failed to update notice.' };
    }
  }, [refreshAdminData, logActivity]);

  const deleteNotice = useCallback(async (noticeId) => {
    try {
      const res = await noticeApi.deleteNotice(noticeId);
      await refreshAdminData();
      logActivity('Notice Deleted', `Deleted notice ${noticeId}`, 'Notice');
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error deleting notice:', err);
      return { success: false, error: err.message || 'Failed to delete notice.' };
    }
  }, [refreshAdminData, logActivity]);

  const setBusMaintenance = useCallback((busId, issue, mechanic, expectedReturn, cost) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    if (!bus) return;

    const targetBusId = bus.id || bus.BusID;

    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? { ...b, status: 'Maintenance', isLive: false, speed: 0, maintenanceReason: issue, driverId: '', driverName: 'Unassigned' }
          : b
      )
    );

    setDrivers((prev) =>
      prev.map((d) =>
        d.assignedBusId === targetBusId
          ? { ...d, assignedBusId: '', assignedBusNumber: 'Unassigned', status: 'Available' }
          : d
      )
    );

    setTracking((prev) => ({
      ...prev,
      [targetBusId]: {
        ...(prev[targetBusId] || {}),
        BusID: targetBusId,
        isLive: false,
        status: 'Maintenance',
        speed: 0,
      }
    }));

    const log = {
      id: `maint_${Date.now()}`,
      busNumber: bus.busNumber || bus.BusNo,
      issue,
      mechanic: mechanic || 'Senior Technician',
      status: 'In Maintenance',
      startDate: new Date().toISOString().split('T')[0],
      expectedReturn: expectedReturn || '2026-08-15',
      cost: cost || '₹10,000',
    };

    setMaintenanceLogs((prev) => [log, ...prev]);
    logActivity('Maintenance Logged', `Marked ${bus.busNumber || bus.BusNo} for Maintenance`, 'Maintenance');
    broadcastEvent('BUS_STATE_SYNC', { busId: targetBusId, status: 'Maintenance' });
  }, [buses, logActivity, broadcastEvent]);

  const releaseBusMaintenance = useCallback((busNumber) => {
    setBuses((prev) =>
      prev.map((b) => (b.busNumber === busNumber || b.BusNo === busNumber ? { ...b, status: 'At Depot', maintenanceReason: null } : b))
    );
    setMaintenanceLogs((prev) =>
      prev.map((m) => (m.busNumber === busNumber ? { ...m, status: 'Resolved' } : m))
    );
    logActivity('Maintenance Resolved', `${busNumber} released from workshop to Depot`, 'Maintenance');
    broadcastEvent('BUS_STATE_SYNC', { busNumber, status: 'At Depot' });
  }, [logActivity, broadcastEvent]);

  /**
   * Atomic Real-Time Socket.IO Telemetry Updater
   */
  const updateLiveTelemetry = useCallback((telemetryData) => {
    if (!telemetryData || !telemetryData.bus_id) return;
    const busIdInt = parseInt(telemetryData.bus_id, 10);
    const lat = parseFloat(telemetryData.latitude);
    const lng = parseFloat(telemetryData.longitude);
    const spd = parseFloat(telemetryData.speed || 0);
    const currStop = telemetryData.current_stop || 'In Transit';
    const nxtStop = telemetryData.next_stop || 'Next Stop';
    const eta = parseInt(telemetryData.eta_minutes, 10) || 0;
    const timestamp = telemetryData.timestamp || new Date().toISOString();

    setTracking((prev) => {
      return {
        ...prev,
        [busIdInt]: {
          ...(prev[busIdInt] || {}),
          BusID: busIdInt,
          busId: busIdInt,
          busNumber: telemetryData.bus_number || prev[busIdInt]?.busNumber || `BUS-${busIdInt}`,
          driverId: telemetryData.driver_id || prev[busIdInt]?.driverId,
          driverName: telemetryData.driver_name || prev[busIdInt]?.driverName || 'Driver',
          routeId: telemetryData.route_id || prev[busIdInt]?.routeId,
          routeName: telemetryData.route_name || prev[busIdInt]?.routeName || 'Assigned Route',
          Latitude: lat,
          currentLat: lat,
          Longitude: lng,
          currentLng: lng,
          speed: spd,
          currentStop: currStop,
          nextStop: nxtStop,
          etaMinutes: eta,
          etaText: `~${eta} mins`,
          isLive: true,
          timestamp: timestamp,
          lastUpdated: timestamp,
        }
      };
    });

    setBuses((prevBuses) => {
      let changed = false;
      const updated = prevBuses.map((b) => {
        const bId = parseInt(b.id || b.BusID, 10);
        if (bId === busIdInt) {
          changed = true;
          return {
            ...b,
            currentLat: lat,
            Latitude: lat,
            currentLng: lng,
            Longitude: lng,
            speed: spd,
            currentStop: currStop,
            nextStop: nxtStop,
            etaMinutes: eta,
            etaText: `~${eta} mins`,
            isLive: true,
            status: b.status === 'At Depot' ? 'In Transit' : b.status,
            lastUpdated: timestamp,
            timestamp: timestamp,
          };
        }
        return b;
      });
      return changed ? updated : prevBuses;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        // 7 Core Entities
        users,
        buses: filteredBuses,
        allBuses: allJoinedBuses,
        drivers,
        routes,
        tracking,
        complaints,
        trips,

        // Supporting States & Data Loading
        notices,
        activityLogs,
        maintenanceLogs,
        selectedBus,
        setSelectedBus,
        searchQuery,
        setSearchQuery,
        isDriverBroadcasting,
        setIsDriverBroadcasting,
        isDataLoading,
        dataLoadError,
        refreshAdminData,
        updateLiveTelemetry,

        // Atomic Core Actions
        startTrip,
        endTrip,
        advanceStop,
        updatePassengerCount,
        addBus,
        updateBus,
        deleteBus,
        addDriver,
        updateDriver,
        deleteDriver,
        assignDriverToBus,
        changeAssignedDriver,
        changeAssignedRoute,
        unassignDriver,
        assignRouteToDriver,
        unassignBus,
        addRoute,
        updateRoute,
        deleteRoute,
        addStopToRoute,
        updateStopInRoute,
        deleteStopFromRoute,
        moveStopOrder,
        reorderRouteStops,
        addComplaint,
        updateComplaintStatus,
        publishNotice,
        updateNotice,
        deleteNotice,
        reportDelay,
        setBusTimingStatus,
        setBusMaintenance,
        releaseBusMaintenance,
        logActivity,
        calculateRealEta,
        calculateDistanceKm,
        formatDistance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
