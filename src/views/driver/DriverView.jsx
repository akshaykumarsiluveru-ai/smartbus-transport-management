import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import InteractiveMap from '../../components/InteractiveMap';
import {
  Play,
  Square,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Bus,
  Gauge,
  MapPin,
  Sparkles,
  Clock,
  Navigation,
  Users,
  Route as RouteIcon,
  Timer,
  AlertOctagon,
  CheckCheck,
  Compass,
  Radio,
  ArrowRight,
  ShieldCheck,
  Flag,
  Map,
  LogOut
} from 'lucide-react';

const DriverView = () => {
  const {
    allBuses,
    drivers,
    routes,
    trips,
    tracking,
    updateBus,
    publishNotice,
    reportDelay,
    logActivity,
    startTrip,
    endTrip,
    advanceStop,
    updatePassengerCount
  } = useApp();
  const { currentUser, logout } = useAuth();

  // 1. Resolve logged-in Driver Profile
  const currentDriverProfile = useMemo(() => {
    return (
      drivers.find(
        (d) =>
          d.id === currentUser?.id ||
          d.DriverID === currentUser?.id ||
          d.DriverID === currentUser?.DriverID ||
          d.driverId === currentUser?.driverId ||
          d.name?.toLowerCase() === currentUser?.name?.toLowerCase() ||
          d.email?.toLowerCase() === currentUser?.email?.toLowerCase()
      ) ||
      drivers.find((d) => d.Role === 'driver' || d.role === 'driver') ||
      drivers[0]
    );
  }, [drivers, currentUser]);

  // 2. Resolve Assigned Bus for this driver ONLY (Synced with live tracking telemetry)
  const assignedBus = useMemo(() => {
    if (!currentDriverProfile) return null;
    const dId = currentDriverProfile.id || currentDriverProfile.DriverID;
    const dName = currentDriverProfile.name || currentDriverProfile.Name;
    const assignedBusId = currentDriverProfile.assignedBusId;

    return allBuses.find(
      (b) =>
        b.driverId === dId ||
        b.driverId === currentDriverProfile.DriverID ||
        b.id === assignedBusId ||
        b.BusID === assignedBusId ||
        (b.driverName && b.driverName !== 'Unassigned' && b.driverName === dName) ||
        (b.busNumber && b.busNumber === currentDriverProfile.assignedBusNumber)
    );
  }, [allBuses, currentDriverProfile]);

  // 3. Resolve Assigned Route for this driver & bus ONLY
  const assignedRoute = useMemo(() => {
    if (!assignedBus && !currentDriverProfile) return null;
    const rId = assignedBus?.routeId || currentDriverProfile?.assignedRouteId;
    return routes.find((r) => r.id === rId || r.RouteID === rId) || (assignedBus ? routes[0] : null);
  }, [routes, assignedBus, currentDriverProfile]);

  // 4. Dynamic sequential stops on assigned route
  const stops = useMemo(() => {
    if (!assignedRoute) return [];
    return (assignedRoute.stops || assignedRoute.Stops || []).map((s, i) => ({
      id: s.id || s.StopID || `stp_${i}`,
      name: s.name || s.StopName || `Stop #${i + 1}`,
      time: s.estimatedTime || s.ExpectedArrivalTime || '08:30 AM',
      lat: parseFloat(s.lat || s.Latitude || 24.5850),
      lng: parseFloat(s.lng || s.Longitude || 73.6900),
      sequence: s.sequenceOrder || s.Sequence || i + 1,
    }));
  }, [assignedRoute]);

  // Operational States derived directly from Single Source of Truth
  const isTripActive = Boolean(assignedBus?.isLive && (assignedBus?.status === 'In Transit' || assignedBus?.status === 'Delayed'));
  const currentStopIdx = assignedBus?.currentStopIdx !== undefined ? assignedBus.currentStopIdx : 0;
  const completedStopIds = assignedBus?.completedStopIds || [];
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info'); // 'info' | 'success' | 'warning' | 'error'

  // Timer & Timestamps
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tripStartTime, setTripStartTime] = useState(() => {
    const activeTrip = trips.find((t) => t.busId === assignedBus?.id && t.status === 'In Transit');
    return activeTrip?.startTime || '08:00 AM';
  });
  const [endTripModalOpen, setEndTripModalOpen] = useState(false);
  const [tripSummaryModalOpen, setTripSummaryModalOpen] = useState(false);
  const [lastTripRecord, setLastTripRecord] = useState(null);

  // Live Timer Effect while in Transit
  useEffect(() => {
    let interval = null;
    if (isTripActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTripActive]);

  // Helper: Format elapsed seconds to HH:MM:SS
  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const showToast = (msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // EXPLICIT ACTION 1: START TRIP
  const handleStartTrip = () => {
    if (!assignedBus || !assignedRoute) {
      showToast('Cannot start trip: No vehicle or route assigned by dispatch.', 'error');
      return;
    }

    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTripStartTime(nowTimeStr);
    setElapsedSeconds(0);

    const busIdClean = assignedBus.id || assignedBus.BusID;
    const driverIdClean = currentDriverProfile?.id || currentDriverProfile?.DriverID || currentUser?.id;
    const routeIdClean = assignedRoute.id || assignedRoute.RouteID;

    const newTrip = startTrip(busIdClean, driverIdClean, routeIdClean);
    setLastTripRecord(newTrip);

    showToast(`🚀 TRIP STARTED! Live GPS Telemetry Broadcasting on ${assignedBus.busNumber || assignedBus.BusNo}`, 'success');
  };

  // EXPLICIT ACTION 2: OPEN END TRIP CONFIRMATION
  const handleOpenEndTrip = () => {
    setEndTripModalOpen(true);
  };

  // EXPLICIT ACTION 3: CONFIRM & COMPLETE TRIP
  const handleConfirmEndTrip = () => {
    if (!assignedBus) return;
    const busIdClean = assignedBus.id || assignedBus.BusID;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDuration = formatTimer(elapsedSeconds);

    endTrip(busIdClean);

    const completedRecord = {
      busNumber: assignedBus.busNumber || assignedBus.BusNo,
      driverName: currentDriverProfile?.name || currentUser?.name,
      routeName: assignedRoute?.routeName || 'Assigned Route',
      startTime: tripStartTime,
      endTime: nowTimeStr,
      duration: formattedDuration,
      passengersServed: assignedBus.currentOccupancy || 25,
      totalStops: stops.length,
      stopsVisited: currentStopIdx + 1,
    };

    setLastTripRecord(completedRecord);
    setEndTripModalOpen(false);
    setTripSummaryModalOpen(true);

    showToast(`🏁 TRIP COMPLETED! Vehicle status set to At Depot and Driver is Available.`, 'success');
  };

  // Advance Stop Progression
  const handleMarkStopArrived = (idx) => {
    if (!assignedBus || !stops[idx]) return;
    advanceStop(assignedBus.id || assignedBus.BusID, idx);
    const targetStop = stops[idx];
    showToast(`📍 Bus arrived at Stop #${idx + 1}: ${targetStop.name}!`, 'success');
  };

  // Passenger Count Delta
  const handlePassengerDelta = (delta) => {
    if (!assignedBus) return;
    updatePassengerCount(assignedBus.id || assignedBus.BusID, delta, true);
  };

  // Emergency SOS
  const handleEmergencySOS = () => {
    if (!assignedBus) return;
    publishNotice({
      id: `notif_${Date.now()}`,
      title: `🚨 EMERGENCY SOS: ${assignedBus.busNumber}`,
      message: `Driver ${currentDriverProfile?.name || currentUser?.name} transmitted an urgent emergency distress signal on route ${assignedBus.routeName}. Transport Control dispatch notified!`,
      type: 'SOS Emergency',
      target: 'All Students & Admin',
      timestamp: 'Just Now',
      author: `Driver ${currentDriverProfile?.name || currentUser?.name}`
    });
    logActivity('EMERGENCY SOS', `Emergency distress signal triggered from ${assignedBus.busNumber}`, 'Emergency');
    showToast('🚨 SOS EMERGENCY DISTRESS SIGNAL TRANSMITTED TO DISPATCH!', 'error');
  };

  // Quick Route Delay / Incident
  const handleQuickIncident = (reason, delayMin = 10) => {
    if (!assignedBus) return;
    reportDelay(assignedBus.id || assignedBus.BusID, delayMin, reason);
    showToast(`Advisory published: ${reason} (+${delayMin}m delay)`, 'warning');
  };

  const occupancyPct = assignedBus ? Math.round(((assignedBus.currentOccupancy || 0) / (assignedBus.capacity || 50)) * 100) : 0;

  // Render Standby Screen if Driver has No Assigned Bus
  if (!assignedBus) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-amber-200">
            👨‍✈️
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Driver Standby Roster
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">{currentDriverProfile?.name || currentUser?.name || 'Driver'}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Driver ID: <strong className="font-mono text-slate-700">{currentDriverProfile?.DriverID || currentDriverProfile?.driverId || 'DRV-101'}</strong> • Shift: <strong className="text-slate-700">{currentDriverProfile?.shift || 'Morning'}</strong>
            </p>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 max-w-md mx-auto text-xs text-amber-900 space-y-1">
            <strong className="block text-amber-900 font-bold">No Vehicle Assigned to Your Roster</strong>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Transport Control has not linked a bus or transit route to your profile yet. Once an assignment is created in Admin Dispatch, your live operations console and trip controllers will activate here immediately.
            </p>
          </div>

          <div className="flex justify-center items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Staff Status: Available</span>
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out (Logout)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-8">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-bold border animate-bounce ${
            toastType === 'error'
              ? 'bg-rose-900 text-white border-rose-500'
              : toastType === 'success'
              ? 'bg-emerald-900 text-white border-emerald-500'
              : toastType === 'warning'
              ? 'bg-amber-900 text-white border-amber-500'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. DRIVER CONSOLE HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-indigo-900/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                Driver Operations Console
              </span>
              <span className="text-[10px] font-mono font-bold bg-white/10 text-slate-200 px-2 py-0.5 rounded-full">
                ID: {currentDriverProfile?.DriverID || currentDriverProfile?.driverId || 'DRV-101'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Shift: {assignedBus?.shift || currentDriverProfile?.shift || 'Morning'}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{currentDriverProfile?.name || currentUser?.name}</h2>
            <p className="text-xs text-indigo-200/90 mt-1">
              Assigned Vehicle: <strong className="text-white font-bold">{assignedBus.busNumber}</strong> ({assignedBus.model}) • Route:{' '}
              <strong className="text-white font-bold">{assignedRoute?.routeName || assignedBus.routeName}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Operational State</span>
            <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-sm">
                <StatusBadge status={isTripActive ? 'In Transit' : 'At Depot'} />
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/40 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Sign Out of Driver Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle & Route Quick Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-xs">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Bus Asset</span>
            <strong className="text-white text-xs block truncate">{assignedBus.busNumber}</strong>
            <span className="text-[10px] text-indigo-300 font-mono">{assignedBus.registrationNumber || 'RJ-27-PA-4081'}</span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Transit Corridor</span>
            <strong className="text-white text-xs block truncate">{assignedRoute?.routeName || 'Assigned Route'}</strong>
            <span className="text-[10px] text-indigo-300">{assignedRoute?.startPoint} ➔ {assignedRoute?.endPoint}</span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Capacity</span>
            <strong className="text-white text-xs block">{assignedBus.capacity || 52} Passenger Seats</strong>
            <span className="text-[10px] text-indigo-300">{assignedBus.fuelType || 'Diesel'} Engine</span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Trip Schedule</span>
            <strong className="text-white text-xs block">{assignedRoute?.schedules?.[0] || '08:00 AM Departure'}</strong>
            <span className="text-[10px] text-emerald-300 font-bold">{stops.length} Sequence Stops</span>
          </div>
        </div>
      </div>

      {/* 2. EXPLICIT TRIP CONTROLLERS & TELEMETRY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* EXPLICIT TRIP LIFECYCLE CONTROLLER (5 cols) */}
        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trip Execution Console</span>
              {isTripActive && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                  <span>LIVE BROADCASTING</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {isTripActive ? 'Trip in Progress' : 'Vehicle Standby at Depot'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTripActive
                ? 'Real-time GPS telemetry is streaming to student tracking maps & dispatch.'
                : 'Click START TRIP when departure checklist is completed.'}
            </p>
          </div>

          {/* EXPLICIT BUTTON STATE 1: START TRIP */}
          {!isTripActive ? (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">Pre-Trip Checklist Verified:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                  <span className="flex items-center gap-1 font-medium">✓ Bus: {assignedBus.busNumber}</span>
                  <span className="flex items-center gap-1 font-medium">✓ Driver: Ready</span>
                  <span className="flex items-center gap-1 font-medium">✓ Stops: {stops.length} Loaded</span>
                  <span className="flex items-center gap-1 font-medium">✓ GPS: Online</span>
                </div>
              </div>

              <button
                onClick={handleStartTrip}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>START TRIP</span>
              </button>
              <span className="text-[10px] text-slate-400 text-center block">
                Will mark status as "In Transit", lock departure time, and start GPS telemetry.
              </span>
            </div>
          ) : (
            /* EXPLICIT BUTTON STATE 2: END TRIP */
            <div className="space-y-4 py-2">
              {/* Active Timer Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-center shadow-inner">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Active Elapsed Run Time</span>
                <span className="text-3xl font-black font-mono tracking-wider text-emerald-400 block">
                  {formatTimer(elapsedSeconds)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Started at <strong className="text-white">{tripStartTime}</strong>
                </span>
              </div>

              <button
                onClick={handleOpenEndTrip}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-base shadow-xl shadow-rose-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 cursor-pointer animate-pulse"
              >
                <Square className="w-6 h-6 fill-current" />
                <span>END TRIP</span>
              </button>
              <span className="text-[10px] text-slate-400 text-center block">
                Will halt GPS broadcast, lock arrival time, and set vehicle status to "At Depot".
              </span>
            </div>
          )}

          {/* Quick Footer Stats */}
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Staff Status: <strong className="text-slate-800">{isTripActive ? 'On Trip' : 'Available'}</strong></span>
            <span>Trips Completed: <strong className="text-indigo-700">{currentDriverProfile?.tripsToday || 0} Runs</strong></span>
          </div>
        </div>

        {/* TELEMETRY & OCCUPANCY DASHBOARD (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Telemetry Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Live Speed */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Speed</span>
              <div className="mt-1 flex items-baseline space-x-1">
                <span className="text-2xl font-black text-slate-900">{isTripActive ? (assignedBus.speed || 34) : '0.0'}</span>
                <span className="text-xs text-slate-500">km/h</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                {isTripActive ? '⚡ Sensor Active' : '● Engine Idle'}
              </span>
            </div>

            {/* Current Stop */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Stop</span>
              <div className="mt-1 font-black text-slate-900 text-xs truncate" title={stops[currentStopIdx]?.name || 'Depot'}>
                {stops[currentStopIdx]?.name || 'Depot'}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold block mt-1">
                Stop #{currentStopIdx + 1} of {stops.length}
              </span>
            </div>

            {/* Next Stop ETA */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Stop ETA</span>
              <div className="mt-1 flex items-baseline space-x-1">
                <span className="text-2xl font-black text-amber-600">~{isTripActive ? (assignedBus.etaMinutes || 4) : '0'}</span>
                <span className="text-xs text-slate-500">mins</span>
              </div>
              <span className="text-[10px] text-slate-500 truncate block mt-1" title={stops[currentStopIdx + 1]?.name || 'Terminal'}>
                {stops[currentStopIdx + 1]?.name || 'Terminal'}
              </span>
            </div>

            {/* GPS Beacon */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GPS Beacon</span>
              <div className="mt-1 font-mono text-[11px] font-bold text-slate-800 truncate">
                {parseFloat(assignedBus.currentLat || assignedBus.Latitude || 24.5850).toFixed(4)},{' '}
                {parseFloat(assignedBus.currentLng || assignedBus.Longitude || 73.6900).toFixed(4)}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                {isTripActive ? '● High Accuracy' : 'Standby'}
              </span>
            </div>
          </div>

          {/* PASSENGER HEADCOUNT COUNTER */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Passenger Boarding & Occupancy</h3>
                <p className="text-[11px] text-slate-500">Log passenger boarding & deboarding in real time</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">
                  {assignedBus.currentOccupancy || 0} / {assignedBus.capacity || 52} Max
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    occupancyPct > 90
                      ? 'bg-rose-100 text-rose-700'
                      : occupancyPct > 70
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {occupancyPct}% Full
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  occupancyPct > 90 ? 'bg-rose-600' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, occupancyPct)}%` }}
              />
            </div>

            <div className="flex items-center justify-center space-x-4 py-1">
              <button
                onClick={() => handlePassengerDelta(-1)}
                disabled={!isTripActive || (assignedBus.currentOccupancy || 0) <= 0}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center font-black text-xl transition-all active:scale-95"
                title="Deboard 1 Passenger"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center px-4">
                <span className="text-4xl font-black text-slate-900">{assignedBus.currentOccupancy || 0}</span>
                <span className="block text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">ONBOARD</span>
              </div>

              <button
                onClick={() => handlePassengerDelta(1)}
                disabled={!isTripActive || (assignedBus.currentOccupancy || 0) >= (assignedBus.capacity || 52)}
                className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95"
                title="Board 1 Passenger"
              >
                <Plus className="w-5 h-5" />
              </button>

              <div className="flex gap-1.5 pl-3 border-l border-slate-100">
                <button
                  onClick={() => handlePassengerDelta(5)}
                  disabled={!isTripActive || (assignedBus.currentOccupancy || 0) + 5 > (assignedBus.capacity || 52)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-30 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200"
                >
                  +5
                </button>
                <button
                  onClick={() => handlePassengerDelta(-5)}
                  disabled={!isTripActive || (assignedBus.currentOccupancy || 0) <= 0}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 font-semibold text-xs rounded-lg"
                >
                  -5
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIVE TRANSIT NAVIGATION MAP & PROGRESS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Map className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-slate-900 text-sm">Live GPS Transit Route Map</h3>
            </div>
            <p className="text-xs text-slate-500">
              Assigned Route: <strong className="text-slate-800">{assignedRoute?.routeName}</strong> ({assignedRoute?.startPoint} ➔ {assignedRoute?.endPoint})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              Telemetry: <span className="font-mono text-blue-600">{parseFloat(assignedBus.currentLat || 24.5850).toFixed(4)}, {parseFloat(assignedBus.currentLng || 73.6900).toFixed(4)}</span>
            </span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
              {assignedBus.routeProgress || 0}% Completed
            </span>
          </div>
        </div>

        {/* Live Route Progress Bar */}
        {isTripActive && (
          <div className="space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, assignedBus.routeProgress || 0))}%` }}
              />
            </div>
          </div>
        )}

        <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
          <InteractiveMap
            buses={allBuses.filter((b) => (b.id === assignedBus.id || b.BusID === assignedBus.id) || b.isLive)}
            routes={assignedRoute ? [assignedRoute] : routes}
            selectedBus={assignedBus}
            selectedRoute={assignedRoute}
          />
        </div>
      </div>

      {/* 4. SEQUENTIAL STOP NAVIGATION & ADVISORIES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SEQUENTIAL STOP PROGRESSION TIMELINE (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <RouteIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-slate-900 text-sm">Sequential Stops Timeline</h3>
              </div>
              <p className="text-xs text-slate-500">
                Route: <strong className="text-slate-800">{assignedRoute?.routeName}</strong> ({stops.length} Sequence Stops)
              </p>
            </div>

            {/* Advance Next Stop Button */}
            {isTripActive && currentStopIdx < stops.length - 1 && (
              <button
                onClick={() => handleMarkStopArrived(currentStopIdx + 1)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Mark Arrived: {stops[currentStopIdx + 1]?.name}</span>
              </button>
            )}
          </div>

          {/* Stops List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {stops.map((stop, idx) => {
              const isCurrent = idx === currentStopIdx;
              const isPassed = idx < currentStopIdx || completedStopIds.includes(stop.id);
              const isNext = idx === currentStopIdx + 1;

              return (
                <div
                  key={stop.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                    isCurrent
                      ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                      : isPassed
                      ? 'bg-emerald-50/50 border-emerald-200 opacity-85'
                      : isNext
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Sequence Badge */}
                    <span
                      className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow animate-pulse ring-4 ring-blue-100'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : isNext
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isPassed ? '✓' : stop.sequence}
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className={`block text-xs ${isCurrent ? 'text-blue-900 font-black' : isPassed ? 'text-emerald-950 font-bold' : 'text-slate-900'}`}>
                          {stop.name}
                        </strong>
                        {isCurrent && (
                          <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                            Now At
                          </span>
                        )}
                        {isNext && isTripActive && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                            Next Up
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        GPS: {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      ⏱️ {stop.time}
                    </span>

                    {isCurrent ? (
                      <span className="bg-blue-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">
                        ● Current Location
                      </span>
                    ) : isPassed ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Completed
                      </span>
                    ) : isNext && isTripActive ? (
                      <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-200">
                        ETA: ~{assignedBus.etaMinutes || 4}m
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkStopArrived(idx)}
                        disabled={!isTripActive}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 disabled:opacity-30 font-bold text-[10px] rounded-lg border border-slate-200 transition-colors"
                      >
                        Set Current
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* QUICK ADVISORIES & SOS DISTRESS (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Route Delay Broadcast */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Broadcast Route Advisory</h3>
            <p className="text-[11px] text-slate-500">Alert students & dispatch of delay reasons</p>

            <div className="space-y-1.5">
              <button
                onClick={() => handleQuickIncident('Traffic Jam / Congestion', 10)}
                disabled={!isTripActive}
                className="w-full p-2.5 bg-amber-50/70 hover:bg-amber-100 disabled:opacity-40 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 transition-colors flex items-center justify-between"
              >
                <span>🚦 Heavy Traffic Congestion</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-extrabold">+10m</span>
              </button>

              <button
                onClick={() => handleQuickIncident('Severe Weather / Heavy Rain', 5)}
                disabled={!isTripActive}
                className="w-full p-2.5 bg-blue-50/70 hover:bg-blue-100 disabled:opacity-40 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center justify-between"
              >
                <span>🌧️ Severe Rain / Weather</span>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-extrabold">+5m</span>
              </button>

              <button
                onClick={() => handleQuickIncident('Mechanical Check / Inspection', 15)}
                disabled={!isTripActive}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-between"
              >
                <span>🔧 Mechanical Check</span>
                <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-extrabold">+15m</span>
              </button>
            </div>
          </div>

          {/* EMERGENCY SOS DISTRESS BUTTON */}
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-rose-700">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <strong className="text-xs font-black uppercase tracking-wider">Urgent Emergency Signal</strong>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Broadcasts immediate emergency alert to Transport Control, Campus Security, and Student View.
            </p>

            <button
              onClick={handleEmergencySOS}
              disabled={!isTripActive}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>TRANSMIT SOS DISTRESS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODAL: END TRIP CONFIRMATION */}
      <Modal
        isOpen={endTripModalOpen}
        onClose={() => setEndTripModalOpen(false)}
        title="Confirm End of Transit Run"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-rose-900">
            <strong className="text-sm font-bold block">Conclude Run on {assignedBus.busNumber}?</strong>
            <p className="text-[11px] leading-relaxed text-rose-800">
              You are about to conclude this transit run. This action will execute the following:
            </p>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-800 pl-1">
              <li>Halt live GPS simulation and telemetry stream.</li>
              <li>Set vehicle status back to <strong>At Depot</strong>.</li>
              <li>Set driver profile status back to <strong>Available</strong>.</li>
              <li>Record arrival timestamp and archive trip statistics.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-slate-700">
              <span>Elapsed Duration:</span>
              <strong className="font-mono text-slate-900">{formatTimer(elapsedSeconds)}</strong>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Departure Time:</span>
              <strong className="text-slate-900">{tripStartTime}</strong>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Passengers Onboard:</span>
              <strong className="text-slate-900">{assignedBus.currentOccupancy || 0} passengers</strong>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setEndTripModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Resume Run
            </button>
            <button
              onClick={handleConfirmEndTrip}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Confirm & End Trip</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* 5. MODAL: TRIP COMPLETION SUMMARY */}
      <Modal
        isOpen={tripSummaryModalOpen}
        onClose={() => setTripSummaryModalOpen(false)}
        title="Trip Completed Successfully"
      >
        {lastTripRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-lg">
                ✓
              </div>
              <h3 className="text-base font-black text-emerald-900">Run Successfully Completed</h3>
              <p className="text-xs text-emerald-700 font-medium">Vehicle returned to Depot • Driver is Available</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Bus Asset</span>
                <strong className="text-slate-900">{lastTripRecord.busNumber}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Driver</span>
                <strong className="text-slate-900">{lastTripRecord.driverName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Transit Corridor</span>
                <strong className="text-slate-900">{lastTripRecord.routeName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Departure Time</span>
                <strong className="text-slate-900">{lastTripRecord.startTime}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Arrival Time</span>
                <strong className="text-slate-900">{lastTripRecord.endTime}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Run Duration</span>
                <strong className="text-indigo-700 font-mono font-bold">{lastTripRecord.duration || formatTimer(elapsedSeconds)}</strong>
              </div>
            </div>

            <button
              onClick={() => setTripSummaryModalOpen(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow"
            >
              Acknowledge & Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DriverView;
