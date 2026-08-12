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
   * 5. BUS CRUD & UPDATE (Shared Context)
   */
  const addBus = useCallback((newBus) => {
    const normalizedBus = {
      BusID: newBus.id || newBus.BusID || `bus_${Date.now()}`,
      id: newBus.id || newBus.BusID || `bus_${Date.now()}`,
      BusNo: newBus.busNumber || newBus.BusNo || 'BUS-999',
      busNumber: newBus.busNumber || newBus.BusNo || 'BUS-999',
      Capacity: parseInt(newBus.capacity || newBus.Capacity) || 50,
      capacity: parseInt(newBus.capacity || newBus.Capacity) || 50,
      registrationNumber: newBus.registrationNumber || 'RJ-27-PA-0000',
      model: newBus.model || 'Standard Transit Bus',
      fuelType: newBus.fuelType || 'Diesel',
      driverId: newBus.driverId || '',
      driverName: newBus.driverName || 'Unassigned',
      routeId: newBus.routeId || '',
      routeName: newBus.routeName || 'Unassigned',
      status: newBus.status || 'At Depot',
      isLive: newBus.status === 'In Transit',
      currentOccupancy: 0,
      speed: 0,
      currentLat: 24.5714,
      Latitude: 24.5714,
      currentLng: 73.6974,
      Longitude: 73.6974,
      currentStop: 'Depot Yard',
      nextStop: 'None',
      etaMinutes: 0,
      eta: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    setBuses((prev) => {
      const next = [...prev, normalizedBus];
      broadcastEvent('BUS_STATE_SYNC', { buses: next });
      return next;
    });

    logActivity('Bus Added', `Added ${normalizedBus.BusNo} to fleet`, 'Bus');
  }, [logActivity, broadcastEvent]);

  const updateBus = useCallback((busId, updatedFields) => {
    setBuses((prev) => {
      const next = prev.map((b) => {
        if (b.id === busId || b.BusID === busId) {
          const joined = { ...b, ...updatedFields };
          // Keep uppercase and lowercase aliases in sync
          if (updatedFields.currentLat !== undefined) joined.Latitude = updatedFields.currentLat;
          if (updatedFields.currentLng !== undefined) joined.Longitude = updatedFields.currentLng;
          if (updatedFields.Latitude !== undefined) joined.currentLat = updatedFields.Latitude;
          if (updatedFields.Longitude !== undefined) joined.currentLng = updatedFields.Longitude;
          if (updatedFields.busNumber !== undefined) joined.BusNo = updatedFields.busNumber;
          if (updatedFields.BusNo !== undefined) joined.busNumber = updatedFields.BusNo;
          if (updatedFields.capacity !== undefined) joined.Capacity = updatedFields.capacity;
          if (updatedFields.Capacity !== undefined) joined.capacity = updatedFields.Capacity;
          return joined;
        }
        return b;
      });
      broadcastEvent('BUS_STATE_SYNC', { buses: next });
      return next;
    });

    // Also update Tracking entity
    setTracking((prev) => {
      const existing = prev[busId] || {};
      const updatedTrack = {
        ...existing,
        BusID: busId,
        busId: busId,
        ...updatedFields,
        lastUpdated: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
      return { ...prev, [busId]: updatedTrack };
    });
  }, [broadcastEvent]);

  const deleteBus = useCallback((busId) => {
    setBuses((prev) => {
      const next = prev.filter((b) => b.id !== busId && b.BusID !== busId);
      broadcastEvent('BUS_STATE_SYNC', { buses: next });
      return next;
    });

    setDrivers((prev) =>
      prev.map((d) => (d.assignedBusId === busId ? { ...d, assignedBusId: '', assignedBusNumber: 'Unassigned', status: 'Available' } : d))
    );

    setTracking((prev) => {
      const next = { ...prev };
      delete next[busId];
      return next;
    });

    logActivity('Bus Deleted', `Deleted bus ID ${busId}`, 'Bus');
  }, [logActivity, broadcastEvent]);

  /**
   * 6. DRIVER CRUD & ASSIGNMENT (Shared Context)
   */
  const addDriver = useCallback((newDriver) => {
    const normalized = {
      DriverID: newDriver.driverId || newDriver.DriverID || `drv_${Date.now()}`,
      id: newDriver.id || newDriver.DriverID || `drv_${Date.now()}`,
      Name: newDriver.name || newDriver.Name || 'Unnamed Driver',
      name: newDriver.name || newDriver.Name || 'Unnamed Driver',
      Contact: newDriver.phone || newDriver.Contact || '+91 90000 00000',
      phone: newDriver.phone || newDriver.Contact || '+91 90000 00000',
      Role: 'driver',
      role: 'driver',
      assignedBusId: '',
      assignedBusNumber: 'Unassigned',
      assignedRouteId: '',
      assignedRouteName: 'None',
      shift: newDriver.shift || 'Morning',
      status: 'Available',
      tripsToday: 0,
      rating: '5.0 ⭐',
      licenseNumber: newDriver.licenseNumber || 'RJ-27-2026-0000',
    };

    setDrivers((prev) => {
      const next = [...prev, normalized];
      broadcastEvent('BUS_STATE_SYNC', { drivers: next });
      return next;
    });

    logActivity('Driver Added', `Registered driver ${normalized.Name}`, 'Driver');
  }, [logActivity, broadcastEvent]);

  const updateDriver = useCallback((driverId, updatedFields) => {
    setDrivers((prev) => {
      const next = prev.map((d) => (d.id === driverId || d.DriverID === driverId ? { ...d, ...updatedFields } : d));
      broadcastEvent('BUS_STATE_SYNC', { drivers: next });
      return next;
    });

    // If driver's name or status changed, sync to assigned bus
    if (updatedFields.name || updatedFields.Name || updatedFields.status) {
      setBuses((prev) =>
        prev.map((b) => {
          if (b.driverId === driverId) {
            const updated = { ...b };
            if (updatedFields.name || updatedFields.Name) {
              updated.driverName = updatedFields.name || updatedFields.Name;
            }
            if (updatedFields.status === 'Off Duty' || updatedFields.status === 'On Leave') {
              if (b.status === 'In Transit') {
                updated.status = 'At Depot';
                updated.isLive = false;
                updated.speed = 0;
              }
            }
            return updated;
          }
          return b;
        })
      );
    }
  }, [broadcastEvent]);

  const deleteDriver = useCallback((driverId) => {
    setDrivers((prev) => {
      const next = prev.filter((d) => d.id !== driverId && d.DriverID !== driverId);
      broadcastEvent('BUS_STATE_SYNC', { drivers: next });
      return next;
    });

    // Unassign any bus linked to this driver
    setBuses((prev) =>
      prev.map((b) =>
        b.driverId === driverId
          ? { ...b, driverId: '', driverName: 'Unassigned', status: b.status === 'In Transit' ? 'At Depot' : b.status, isLive: false, speed: 0 }
          : b
      )
    );

    logActivity('Driver Deleted', `Removed driver ID ${driverId}`, 'Driver');
  }, [logActivity, broadcastEvent]);

  /**
   * 6. CENTRAL ASSIGNMENT SYSTEM (BUS + DRIVER + ROUTE)
   */
  const assignDriverToBus = useCallback((busId, driverId, routeId, shift = 'Morning') => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const driver = drivers.find((d) => d.id === driverId || d.DriverID === driverId);
    const route = routes.find((r) => r.id === routeId || r.RouteID === routeId);

    if (!bus) return { success: false, error: 'Target bus was not found in fleet catalog.' };
    if (!driver) return { success: false, error: 'Target driver was not found in staff records.' };
    if (!route) return { success: false, error: 'Target route corridor was not found.' };

    const busCleanId = bus.id || bus.BusID;
    const busCleanNumber = bus.busNumber || bus.BusNo;
    const driverCleanId = driver.id || driver.DriverID;
    const driverCleanName = driver.name || driver.Name;
    const routeCleanId = route.id || route.RouteID;
    const routeCleanName = route.routeName;

    // VALIDATION RULE 3: Maintenance buses cannot be assigned
    if (bus.status === 'Maintenance' || bus.status === 'Out of Service') {
      return {
        success: false,
        error: `Bus ${busCleanNumber} is currently under Maintenance (${bus.maintenanceReason || 'Work in Progress'}) and cannot be assigned.`
      };
    }

    // VALIDATION RULE 4: Driver must be Available before assignment
    // (Allowed if driver is already assigned to this exact bus and we are updating shift/route)
    if (driver.status !== 'Available' && driver.assignedBusId !== busCleanId) {
      return {
        success: false,
        error: `Driver ${driverCleanName} is currently "${driver.status}". Driver must be "Available" before assignment.`
      };
    }

    // VALIDATION RULE 1: Driver cannot be assigned to multiple active buses
    if (driver.assignedBusId && driver.assignedBusId !== busCleanId && (driver.status === 'On Trip' || driver.status === 'Assigned')) {
      return {
        success: false,
        error: `Driver ${driverCleanName} is already assigned to active bus ${driver.assignedBusNumber}. A driver cannot be assigned to multiple active buses.`
      };
    }

    // VALIDATION RULE 2: Bus cannot have multiple active drivers
    if (bus.driverId && bus.driverId !== driverCleanId && bus.driverName !== 'Unassigned' && (bus.status === 'In Transit' || bus.status === 'Delayed')) {
      return {
        success: false,
        error: `Bus ${busCleanNumber} is already in transit with driver ${bus.driverName}. Unassign or complete the trip before reassigning.`
      };
    }

    // If bus had a different previous driver, free that driver to Available
    if (bus.driverId && bus.driverId !== driverCleanId) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === bus.driverId || d.DriverID === bus.driverId
            ? { ...d, assignedBusId: '', assignedBusNumber: 'Unassigned', assignedRouteId: '', assignedRouteName: 'None', status: 'Available' }
            : d
        )
      );
    }

    // 1. Update Bus
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busCleanId || b.BusID === busCleanId
          ? {
              ...b,
              driverId: driverCleanId,
              driverName: driverCleanName,
              routeId: routeCleanId,
              routeName: routeCleanName,
              shift,
              status: 'In Transit',
              isLive: true,
              speed: 30.0,
            }
          : b
      )
    );

    // 2. Update Driver
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverCleanId || d.DriverID === driverCleanId
          ? {
              ...d,
              assignedBusId: busCleanId,
              assignedBusNumber: busCleanNumber,
              assignedRouteId: routeCleanId,
              assignedRouteName: routeCleanName,
              shift,
              status: 'On Trip',
              tripsToday: (d.tripsToday || 0) + 1,
            }
          : d
      )
    );

    // 3. Update Tracking
    setTracking((prev) => ({
      ...prev,
      [busCleanId]: {
        ...(prev[busCleanId] || {}),
        BusID: busCleanId,
        busId: busCleanId,
        Latitude: route.stops?.[0]?.lat || route.stops?.[0]?.Latitude || 24.5714,
        currentLat: route.stops?.[0]?.lat || route.stops?.[0]?.Latitude || 24.5714,
        Longitude: route.stops?.[0]?.lng || route.stops?.[0]?.Longitude || 73.6974,
        currentLng: route.stops?.[0]?.lng || route.stops?.[0]?.Longitude || 73.6974,
        speed: 30.0,
        isLive: true,
        status: 'In Transit',
        currentStop: route.stops?.[0]?.name || route.stops?.[0]?.StopName || 'Start Terminal',
        nextStop: route.stops?.[1]?.name || route.stops?.[1]?.StopName || 'Next Stop',
        eta: 6,
        etaMinutes: 6,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }
    }));

    // 4. Create Active Trip
    const newTripId = `TRP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrip = {
      id: newTripId,
      tripId: newTripId,
      busId: busCleanId,
      BusID: busCleanId,
      busNumber: busCleanNumber,
      driverId: driverCleanId,
      DriverID: driverCleanId,
      driverName: driverCleanName,
      routeId: routeCleanId,
      RouteID: routeCleanId,
      routeName: routeCleanName,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: null,
      status: 'In Transit',
      passengers: Math.floor(15 + Math.random() * 20),
      currentStop: route.stops?.[0]?.name || route.stops?.[0]?.StopName || 'Start Terminal',
      nextStop: route.stops?.[1]?.name || route.stops?.[1]?.StopName || 'Next Stop',
      eta: '6 mins',
      date: new Date().toISOString().split('T')[0],
    };

    setTrips((prev) => [newTrip, ...prev]);
    logActivity('Assignment Created', `Assigned ${busCleanNumber} ➔ ${driverCleanName} ➔ ${routeCleanName} (${shift})`, 'Assignment');
    broadcastEvent('BUS_STATE_SYNC', { busId: busCleanId, driverId: driverCleanId, routeId: routeCleanId });
    return { success: true };
  }, [buses, drivers, routes, logActivity, broadcastEvent]);

  const changeAssignedDriver = useCallback((busId, newDriverId) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const newDriver = drivers.find((d) => d.id === newDriverId || d.DriverID === newDriverId);

    if (!bus || !newDriver) return { success: false, error: 'Bus or Driver not found.' };

    const busCleanId = bus.id || bus.BusID;
    const newDriverCleanId = newDriver.id || newDriver.DriverID;
    const newDriverName = newDriver.name || newDriver.Name;

    // Check new driver availability
    if (newDriver.status !== 'Available' && newDriver.assignedBusId !== busCleanId) {
      return { success: false, error: `Driver ${newDriverName} is currently ${newDriver.status}. Only "Available" drivers can be assigned.` };
    }

    const oldDriverId = bus.driverId;

    // 1. Free old driver
    if (oldDriverId && oldDriverId !== newDriverCleanId) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === oldDriverId || d.DriverID === oldDriverId
            ? { ...d, assignedBusId: '', assignedBusNumber: 'Unassigned', assignedRouteId: '', assignedRouteName: 'None', status: 'Available' }
            : d
        )
      );
    }

    // 2. Assign new driver
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === newDriverCleanId || d.DriverID === newDriverCleanId
          ? {
              ...d,
              assignedBusId: busCleanId,
              assignedBusNumber: bus.busNumber || bus.BusNo,
              assignedRouteId: bus.routeId,
              assignedRouteName: bus.routeName,
              status: bus.status === 'In Transit' ? 'On Trip' : 'Available',
            }
          : d
      )
    );

    // 3. Update Bus
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busCleanId || b.BusID === busCleanId
          ? { ...b, driverId: newDriverCleanId, driverName: newDriverName }
          : b
      )
    );

    logActivity('Driver Changed', `Changed driver on ${bus.busNumber || bus.BusNo} to ${newDriverName}`, 'Assignment');
    broadcastEvent('BUS_STATE_SYNC', { busId: busCleanId, driverId: newDriverCleanId });
    return { success: true };
  }, [buses, drivers, logActivity, broadcastEvent]);

  const changeAssignedRoute = useCallback((busId, newRouteId) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const route = routes.find((r) => r.id === newRouteId || r.RouteID === newRouteId);

    if (!bus || !route) return { success: false, error: 'Bus or Route not found.' };

    const busCleanId = bus.id || bus.BusID;
    const routeCleanId = route.id || route.RouteID;
    const routeCleanName = route.routeName;

    // 1. Update Bus
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busCleanId || b.BusID === busCleanId
          ? { ...b, routeId: routeCleanId, routeName: routeCleanName }
          : b
      )
    );

    // 2. Update Driver if assigned
    if (bus.driverId) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === bus.driverId || d.DriverID === bus.driverId
            ? { ...d, assignedRouteId: routeCleanId, assignedRouteName: routeCleanName }
            : d
        )
      );
    }

    // 3. Update Tracking Beacon
    setTracking((prev) => ({
      ...prev,
      [busCleanId]: {
        ...(prev[busCleanId] || {}),
        Latitude: route.stops?.[0]?.lat || route.stops?.[0]?.Latitude || 24.5714,
        currentLat: route.stops?.[0]?.lat || route.stops?.[0]?.Latitude || 24.5714,
        Longitude: route.stops?.[0]?.lng || route.stops?.[0]?.Longitude || 73.6974,
        currentLng: route.stops?.[0]?.lng || route.stops?.[0]?.Longitude || 73.6974,
        currentStop: route.stops?.[0]?.name || route.stops?.[0]?.StopName || 'Start Terminal',
        nextStop: route.stops?.[1]?.name || route.stops?.[1]?.StopName || 'Next Stop',
        timestamp: new Date().toISOString(),
      }
    }));

    logActivity('Route Changed', `Changed route on ${bus.busNumber || bus.BusNo} to ${routeCleanName}`, 'Assignment');
    broadcastEvent('BUS_STATE_SYNC', { busId: busCleanId, routeId: routeCleanId });
    return { success: true };
  }, [buses, routes, logActivity, broadcastEvent]);

  const unassignDriver = useCallback((driverId) => {
    const driver = drivers.find((d) => d.id === driverId || d.DriverID === driverId);
    if (!driver) return;

    const assignedBusId = driver.assignedBusId;

    // Reset Driver
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId || d.DriverID === driverId
          ? {
              ...d,
              assignedBusId: '',
              assignedBusNumber: 'Unassigned',
              assignedRouteId: '',
              assignedRouteName: 'None',
              status: 'Available',
            }
          : d
      )
    );

    // Reset Bus if linked
    if (assignedBusId) {
      setBuses((prev) =>
        prev.map((b) =>
          b.id === assignedBusId || b.BusID === assignedBusId
            ? {
                ...b,
                driverId: '',
                driverName: 'Unassigned',
                status: 'At Depot',
                isLive: false,
                speed: 0,
              }
            : b
        )
      );

      // Stop tracking live flag
      setTracking((prev) => ({
        ...prev,
        [assignedBusId]: {
          ...(prev[assignedBusId] || {}),
          isLive: false,
          speed: 0,
          status: 'At Depot',
        }
      }));

      // Complete active trips
      setTrips((prev) =>
        prev.map((t) =>
          (t.busId === assignedBusId || t.driverId === driverId) && t.status === 'In Transit'
            ? { ...t, status: 'Completed', endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            : t
        )
      );
    }

    logActivity('Driver Unassigned', `Unassigned driver ${driver.name || driver.Name}`, 'Assignment');
    broadcastEvent('BUS_STATE_SYNC', { driverId, unassigned: true });
  }, [drivers, logActivity, broadcastEvent]);

  const assignRouteToDriver = useCallback((driverId, routeId) => {
    const driver = drivers.find((d) => d.id === driverId || d.DriverID === driverId);
    const route = routes.find((r) => r.id === routeId || r.RouteID === routeId);

    if (!driver || !route) return { success: false, error: 'Driver or Route not found.' };

    const routeCleanId = route.id || route.RouteID;
    const routeCleanName = route.routeName;

    // Update Driver
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId || d.DriverID === driverId
          ? {
              ...d,
              assignedRouteId: routeCleanId,
              assignedRouteName: routeCleanName,
            }
          : d
      )
    );

    // If driver is assigned to a bus, update that bus's route
    if (driver.assignedBusId) {
      setBuses((prev) =>
        prev.map((b) =>
          b.id === driver.assignedBusId || b.BusID === driver.assignedBusId
            ? {
                ...b,
                routeId: routeCleanId,
                routeName: routeCleanName,
              }
            : b
        )
      );
    }

    logActivity('Route Assigned to Driver', `Assigned ${driver.name || driver.Name} to ${routeCleanName}`, 'Assignment');
    broadcastEvent('BUS_STATE_SYNC', { driverId, routeId });
    return { success: true };
  }, [drivers, routes, logActivity, broadcastEvent]);

  const unassignBus = useCallback((busId) => {
    const bus = buses.find((b) => b.id === busId || b.BusID === busId);
    const targetBusId = bus ? (bus.id || bus.BusID) : busId;

    setBuses((prev) =>
      prev.map((b) =>
        b.id === targetBusId || b.BusID === targetBusId
          ? { ...b, driverId: '', driverName: 'Unassigned', routeId: '', routeName: 'Unassigned', status: 'At Depot', isLive: false, speed: 0 }
          : b
      )
    );

    setDrivers((prev) =>
      prev.map((d) =>
        d.assignedBusId === targetBusId
          ? { ...d, assignedBusId: '', assignedBusNumber: 'Unassigned', assignedRouteId: '', assignedRouteName: 'None', status: 'Available' }
          : d
      )
    );

    setTracking((prev) => ({
      ...prev,
      [targetBusId]: {
        ...(prev[targetBusId] || {}),
        isLive: false,
        speed: 0,
        status: 'At Depot',
      }
    }));

    setTrips((prev) =>
      prev.map((t) =>
        t.busId === targetBusId && t.status === 'In Transit'
          ? { ...t, status: 'Completed', endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : t
      )
    );

    logActivity('Bus Unassigned', `Unassigned bus ${bus ? (bus.busNumber || bus.BusNo) : targetBusId}`, 'Assignment');
    broadcastEvent('BUS_STATE_SYNC', { busId: targetBusId, unassigned: true });
  }, [buses, logActivity, broadcastEvent]);

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

  const addRoute = useCallback((newRoute) => {
    const rId = newRoute.RouteID || newRoute.routeId || newRoute.id || `route_${Date.now()}`;
    const rName = newRoute.routeName || newRoute.RouteName || newRoute.name || 'Custom Transit Route';
    const dist = newRoute.distance || newRoute.Distance || newRoute.totalDistance || '10 km';
    const dur = newRoute.estimatedDuration || newRoute.EstimatedDuration || newRoute.duration || '25 mins';
    const rawStops = Array.isArray(newRoute.stops || newRoute.Stops) ? (newRoute.stops || newRoute.Stops) : [];
    const normalizedStops = rawStops.map((s, idx) => normalizeStop(s, idx));

    const startPt = newRoute.StartPoint || newRoute.startPoint || (normalizedStops.length > 0 ? normalizedStops[0].name : 'Start Station');
    const endPt = newRoute.EndPoint || newRoute.endPoint || newRoute.destination || (normalizedStops.length > 0 ? normalizedStops[normalizedStops.length - 1].name : 'Terminal Station');

    const normalized = {
      RouteID: rId,
      id: rId,
      routeId: rId,
      routeName: rName,
      RouteName: rName,
      StartPoint: startPt,
      startPoint: startPt,
      EndPoint: endPt,
      endPoint: endPt,
      destination: endPt,
      distance: dist,
      Distance: dist,
      totalDistance: dist,
      estimatedDuration: dur,
      EstimatedDuration: dur,
      status: newRoute.status || 'Active',
      schedules: newRoute.schedules || ['08:00 AM', '01:00 PM', '05:00 PM'],
      stops: normalizedStops,
      Stops: normalizedStops,
    };

    setRoutes((prev) => {
      const next = [...prev, normalized];
      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    logActivity('Route Created', `Created route ${rName} with ${normalizedStops.length} stops`, 'Route');
    return normalized;
  }, [logActivity, broadcastEvent]);

  const updateRoute = useCallback((routeId, updatedFields) => {
    setRoutes((prev) => {
      const next = prev.map((r) => {
        if (r.id !== routeId && r.RouteID !== routeId) return r;

        let stops = r.stops;
        if (updatedFields.stops || updatedFields.Stops) {
          stops = (updatedFields.stops || updatedFields.Stops).map((s, idx) => normalizeStop(s, idx));
        }

        const rName = updatedFields.routeName || updatedFields.RouteName || r.routeName;
        const startPt = updatedFields.StartPoint || updatedFields.startPoint || (stops.length > 0 ? stops[0].name : r.startPoint);
        const endPt = updatedFields.EndPoint || updatedFields.endPoint || updatedFields.destination || (stops.length > 0 ? stops[stops.length - 1].name : r.endPoint);
        const dist = updatedFields.distance || updatedFields.Distance || updatedFields.totalDistance || r.totalDistance;
        const dur = updatedFields.estimatedDuration || updatedFields.EstimatedDuration || r.estimatedDuration;

        return {
          ...r,
          ...updatedFields,
          routeName: rName,
          RouteName: rName,
          StartPoint: startPt,
          startPoint: startPt,
          EndPoint: endPt,
          endPoint: endPt,
          destination: endPt,
          distance: dist,
          Distance: dist,
          totalDistance: dist,
          estimatedDuration: dur,
          EstimatedDuration: dur,
          stops,
          Stops: stops
        };
      });

      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    // Cascade route name update to assigned buses
    if (updatedFields.routeName) {
      setBuses((prevBuses) => {
        const nextBuses = prevBuses.map((b) => (b.routeId === routeId || b.RouteID === routeId ? { ...b, routeName: updatedFields.routeName } : b));
        broadcastEvent('BUSES_SYNC', { buses: nextBuses });
        return nextBuses;
      });

      setDrivers((prevDrivers) => {
        const nextDrivers = prevDrivers.map((d) => (d.assignedRouteId === routeId ? { ...d, assignedRouteName: updatedFields.routeName } : d));
        broadcastEvent('DRIVERS_SYNC', { drivers: nextDrivers });
        return nextDrivers;
      });
    }

    logActivity('Route Updated', `Updated route ${routeId}`, 'Route');
  }, [logActivity, broadcastEvent]);

  const deleteRoute = useCallback((routeId) => {
    setRoutes((prev) => {
      const next = prev.filter((r) => r.id !== routeId && r.RouteID !== routeId);
      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    // Cascade unlinking on assigned buses
    setBuses((prevBuses) => {
      const nextBuses = prevBuses.map((b) => {
        if (b.routeId === routeId || b.RouteID === routeId) {
          return { ...b, routeId: '', routeName: 'Unassigned', isLive: false, status: 'At Depot' };
        }
        return b;
      });
      broadcastEvent('BUSES_SYNC', { buses: nextBuses });
      return nextBuses;
    });

    // Cascade unlinking on assigned drivers
    setDrivers((prevDrivers) => {
      const nextDrivers = prevDrivers.map((d) => {
        if (d.assignedRouteId === routeId) {
          return { ...d, assignedRouteId: '', assignedRouteName: 'None' };
        }
        return d;
      });
      broadcastEvent('DRIVERS_SYNC', { drivers: nextDrivers });
      return nextDrivers;
    });

    logActivity('Route Deleted', `Deleted route ${routeId} and unassigned linked assets`, 'Route');
  }, [logActivity, broadcastEvent]);

  /**
   * STOPS OPERATIONS: Add, Edit, Delete, Reorder
   */
  const addStopToRoute = useCallback((routeId, stopData) => {
    setRoutes((prev) => {
      const next = prev.map((r) => {
        if (r.id !== routeId && r.RouteID !== routeId) return r;

        const currentStops = [...(r.stops || [])];
        const newStop = normalizeStop(stopData, currentStops.length);
        
        // Insert at designated sequence or append to end
        let updatedStops;
        if (stopData.sequence && stopData.sequence <= currentStops.length) {
          const insertIdx = Math.max(0, stopData.sequence - 1);
          currentStops.splice(insertIdx, 0, newStop);
          updatedStops = currentStops.map((s, idx) => normalizeStop(s, idx));
        } else {
          updatedStops = [...currentStops, newStop].map((s, idx) => normalizeStop(s, idx));
        }

        const startPt = updatedStops.length > 0 ? updatedStops[0].name : r.startPoint;
        const endPt = updatedStops.length > 0 ? updatedStops[updatedStops.length - 1].name : r.endPoint;

        return {
          ...r,
          StartPoint: startPt,
          startPoint: startPt,
          EndPoint: endPt,
          endPoint: endPt,
          destination: endPt,
          stops: updatedStops,
          Stops: updatedStops
        };
      });

      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    logActivity('Stop Added', `Added stop ${stopData.name || stopData.StopName} to route ${routeId}`, 'Route');
  }, [logActivity, broadcastEvent]);

  const updateStopInRoute = useCallback((routeId, stopId, updatedStopFields) => {
    setRoutes((prev) => {
      const next = prev.map((r) => {
        if (r.id !== routeId && r.RouteID !== routeId) return r;

        const updatedStops = (r.stops || []).map((s, idx) => {
          if (s.id === stopId || s.StopID === stopId) {
            return normalizeStop({ ...s, ...updatedStopFields }, idx);
          }
          return s;
        });

        const startPt = updatedStops.length > 0 ? updatedStops[0].name : r.startPoint;
        const endPt = updatedStops.length > 0 ? updatedStops[updatedStops.length - 1].name : r.endPoint;

        return {
          ...r,
          StartPoint: startPt,
          startPoint: startPt,
          EndPoint: endPt,
          endPoint: endPt,
          destination: endPt,
          stops: updatedStops,
          Stops: updatedStops
        };
      });

      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    logActivity('Stop Updated', `Updated stop ${stopId} on route ${routeId}`, 'Route');
  }, [logActivity, broadcastEvent]);

  const deleteStopFromRoute = useCallback((routeId, stopId) => {
    setRoutes((prev) => {
      const next = prev.map((r) => {
        if (r.id !== routeId && r.RouteID !== routeId) return r;

        const filteredStops = (r.stops || []).filter((s) => s.id !== stopId && s.StopID !== stopId);
        const resequencedStops = filteredStops.map((s, idx) => normalizeStop(s, idx));

        const startPt = resequencedStops.length > 0 ? resequencedStops[0].name : 'Start Station';
        const endPt = resequencedStops.length > 0 ? resequencedStops[resequencedStops.length - 1].name : 'Terminal Station';

        return {
          ...r,
          StartPoint: startPt,
          startPoint: startPt,
          EndPoint: endPt,
          endPoint: endPt,
          destination: endPt,
          stops: resequencedStops,
          Stops: resequencedStops
        };
      });

      broadcastEvent('ROUTES_SYNC', { routes: next });
      return next;
    });

    logActivity('Stop Deleted', `Deleted stop ${stopId} from route ${routeId}`, 'Route');
  }, [logActivity, broadcastEvent]);

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
   * 8. COMPLAINTS (Student -> Admin Shared Context)
   */
  const addComplaint = useCallback((complaintData) => {
    const newId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    const formattedTime = `${formattedDate}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const normalizedComplaint = {
      id: newId,
      complaintId: newId,
      title: complaintData.title || complaintData.subject || `${complaintData.category || 'Transit'} Issue`,
      subject: complaintData.title || complaintData.subject || `${complaintData.category || 'Transit'} Issue`,
      category: complaintData.category || 'Bus Delay',
      busNo: complaintData.busNo || complaintData.busNumber || complaintData.BusNo || 'BUS-101',
      busNumber: complaintData.busNo || complaintData.busNumber || complaintData.BusNo || 'BUS-101',
      description: complaintData.description || 'Grievance submitted by student',
      userId: complaintData.userId || complaintData.UserID || 'user_student_1',
      studentId: complaintData.studentId || complaintData.studentID || 'STU-2026-001',
      studentName: complaintData.studentName || 'Student',
      studentEmail: complaintData.studentEmail || 'student@smartbus.edu',
      routeName: complaintData.routeName || 'Assigned Transit Route',
      date: formattedDate,
      createdAt: formattedTime,
      timestamp: formattedTime,
      status: complaintData.status || 'Pending',
      priority: complaintData.priority || 'Medium',
      adminRemark: '',
      adminResponse: '',
      resolvedAt: null,
    };

    setComplaints((prev) => {
      const next = [normalizedComplaint, ...prev];
      broadcastEvent('COMPLAINTS_SYNC', { complaints: next });
      return next;
    });

    logActivity('Complaint Lodged', `Complaint ${newId} logged by ${normalizedComplaint.studentName} for ${normalizedComplaint.busNo}`, 'Notice');
    return normalizedComplaint;
  }, [logActivity, broadcastEvent]);

  const updateComplaintStatus = useCallback((complaintId, status, remark = '') => {
    const now = new Date();
    const resolvedTime = status === 'Resolved' ? `${now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : null;

    setComplaints((prev) => {
      const next = prev.map((c) => {
        if (c.id === complaintId || c.complaintId === complaintId) {
          const responseText = remark !== undefined && remark !== '' ? remark : (c.adminResponse || c.adminRemark || '');
          return {
            ...c,
            status,
            adminRemark: responseText,
            adminResponse: responseText,
            resolvedAt: resolvedTime || c.resolvedAt,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      broadcastEvent('COMPLAINTS_SYNC', { complaints: next });
      return next;
    });

    logActivity('Complaint Updated', `Complaint ${complaintId} status changed to ${status}${remark ? ` with response: "${remark}"` : ''}`, 'Notice');
  }, [logActivity, broadcastEvent]);

  /**
   * 9. NOTICES & MAINTENANCE
   */
  const publishNotice = useCallback((newNotice) => {
    const noticeObj = {
      id: newNotice.id || `notif_${Date.now()}`,
      title: newNotice.title || 'General Notice',
      message: newNotice.message || '',
      type: newNotice.type || 'General Announcement',
      target: newNotice.target || 'All Students',
      timestamp: newNotice.timestamp || 'Just Now',
      author: newNotice.author || 'Transport Control',
    };

    setNotices((prev) => {
      const next = [noticeObj, ...prev];
      broadcastEvent('NOTICES_SYNC', { notices: next });
      return next;
    });

    logActivity('Notice Published', `Broadcasted notice: ${noticeObj.title}`, 'Notice');
  }, [logActivity, broadcastEvent]);

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

        // Supporting States
        notices,
        activityLogs,
        maintenanceLogs,
        selectedBus,
        setSelectedBus,
        searchQuery,
        setSearchQuery,
        isDriverBroadcasting,
        setIsDriverBroadcasting,

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
