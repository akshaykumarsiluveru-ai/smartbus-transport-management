import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { joinBusRoom, leaveBusRoom, onBusLocationUpdate, offBusLocationUpdate } from '../../services/socket';
import InteractiveMap from '../../components/InteractiveMap';
import StatusBadge from '../../components/StatusBadge';
import RoleBadge from '../../components/RoleBadge';
import Modal from '../../components/Modal';
import {
  Map,
  Route as RouteIcon,
  Bell,
  User,
  Search,
  Bus,
  Clock,
  ChevronRight,
  Gauge,
  Users,
  ShieldCheck,
  MapPin,
  QrCode,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  Hash,
  CheckCircle2,
  Sparkles,
  Calendar,
  AlertCircle,
  FileText,
  PlusCircle,
  Radio,
  Armchair,
  Navigation,
  LogOut,
} from 'lucide-react';

const StudentView = () => {
  const { buses, routes, notices, complaints = [], addComplaint, selectedBus, setSelectedBus, searchQuery, setSearchQuery, updateLiveTelemetry } = useApp();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'routes' | 'complaints' | 'notices' | 'profile'
  const [timingFilter, setTimingFilter] = useState('all'); // 'all' | 'on_time' | 'in_transit' | 'delayed' | 'completed' | 'cancelled'
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Real-time Socket.IO room subscription & telemetry update effect
  useEffect(() => {
    const activeBusId = selectedBus?.id || selectedBus?.BusID || buses[0]?.id || buses[0]?.BusID || 1;
    const busIdInt = parseInt(activeBusId, 10);
    
    if (!isNaN(busIdInt)) {
      joinBusRoom(busIdInt);
    }

    const handleTelemetryUpdate = (eventData) => {
      if (eventData && parseInt(eventData.bus_id, 10) === busIdInt) {
        if (typeof updateLiveTelemetry === 'function') {
          updateLiveTelemetry(eventData);
        }
      }
    };

    onBusLocationUpdate(handleTelemetryUpdate);

    return () => {
      offBusLocationUpdate(handleTelemetryUpdate);
      if (!isNaN(busIdInt)) {
        leaveBusRoom(busIdInt);
      }
    };
  }, [selectedBus, buses, updateLiveTelemetry]);
  const [raiseComplaintModalOpen, setRaiseComplaintModalOpen] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState('all'); // 'all' | 'Pending' | 'In Progress' | 'Resolved'
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    category: 'Bus Delay',
    busNo: 'BUS-101',
    routeName: 'Udaipur City Station Express (R-01)',
    description: ''
  });

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) return;

    const res = await addComplaint({
      title: complaintForm.title.trim(),
      category: complaintForm.category,
      busNo: complaintForm.busNo,
      routeName: complaintForm.routeName,
      description: complaintForm.description.trim(),
      status: 'Pending'
    });

    if (res && res.success !== false) {
      setRaiseComplaintModalOpen(false);
      setComplaintForm({
        title: '',
        category: 'Bus Delay',
        busNo: buses[0]?.busNumber || 'BUS-101',
        routeName: buses[0]?.routeName || 'Campus Express Route',
        description: ''
      });
    } else {
      alert(res?.error || 'Failed to submit grievance ticket.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-8">
      
      {/* Student Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Transport Portal</h2>
          <p className="text-xs text-slate-500 font-medium">Track your campus bus in real-time, view stop times & schedules</p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'map' ? 'bg-white text-brand-600 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-4 h-4" /> Live Map
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'routes' ? 'bg-white text-brand-600 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RouteIcon className="w-4 h-4" /> Routes & Timings
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'complaints' ? 'bg-white text-brand-600 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Complaints ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'notices' ? 'bg-white text-brand-600 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" /> Notices ({notices.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'profile' ? 'bg-white text-brand-600 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Pass ID
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-rose-600 hover:bg-rose-50 transition-colors ml-1"
            title="Sign Out of Session"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE MAP & BUS SEARCH */}
      {activeTab === 'map' && (() => {
        const activeBus = selectedBus || buses[0];
        const activeRoute = routes.find(
          (r) => r.id === activeBus?.routeId || r.RouteID === activeBus?.routeId || r.routeName === activeBus?.routeName
        ) || routes[0];

        const totalSeats = activeBus?.capacity || 52;
        const currentOccupancy = activeBus?.currentOccupancy || 0;
        const availableSeats = Math.max(0, totalSeats - currentOccupancy);
        const occupancyPct = Math.round((currentOccupancy / totalSeats) * 100);
        const isLive = Boolean(activeBus?.isLive && (activeBus?.status === 'In Transit' || activeBus?.status === 'Delayed'));

        return (
          <div className="space-y-6">
            
            {/* 1. SELECTED BUS REAL-TIME TELEMETRY HUD BANNER */}
            {activeBus && (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl border border-white/20 shadow-inner">
                      🚌
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                          Selected Transit Asset
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-white/10 text-slate-200 px-2 py-0.5 rounded-full">
                          {activeBus.registrationNumber || 'RJ-27-PA-4081'}
                        </span>
                        {isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>GPS STREAMING</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black tracking-tight mt-1">{activeBus.busNumber}</h3>
                      <p className="text-xs text-indigo-200/90 mt-0.5">
                        Route: <strong className="text-white font-bold">{activeRoute?.routeName || activeBus.routeName}</strong> ({activeRoute?.startPoint} ➔ {activeRoute?.endPoint || activeRoute?.destination})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setDetailModalOpen(true)}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1.5"
                    >
                      <span>Inspect Telemetry</span>
                      <span>➔</span>
                    </button>
                    <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
                      <StatusBadge status={activeBus.timingStatus || activeBus.status} />
                    </div>
                  </div>
                </div>

                {/* 4 Telemetry & Timings HUD Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
                  {/* Card 1: Current Stop & GPS */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Current Location</span>
                    <strong className="text-white text-xs block truncate" title={activeBus.currentStop}>
                      {activeBus.currentStop || 'Depot Terminal'}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      GPS: {parseFloat(activeBus.currentLat || 24.5850).toFixed(4)}, {parseFloat(activeBus.currentLng || 73.6900).toFixed(4)}
                    </span>
                  </div>

                  {/* Card 2: Next Stop, Distance & Dynamic ETA */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Upcoming Stop</span>
                      <span className="text-[10px] font-bold text-amber-300 font-mono">
                        {activeBus.distanceToNextText || activeBus.distanceText || '1.2 km'}
                      </span>
                    </div>
                    <strong className="text-amber-300 text-xs block truncate" title={activeBus.nextStop}>
                      {activeBus.nextStop || 'Terminal Destination'}
                    </strong>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-emerald-300 font-bold">
                        ETA: {isLive ? (activeBus.etaText || `~${activeBus.etaMinutes || 4} mins`) : 'Depot'}
                      </span>
                      {isLive && activeBus.etaClockTime && (
                        <span className="text-slate-300 font-mono font-bold">
                          ({activeBus.etaClockTime})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Bus Timings & Schedule */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Departure & Expected Arrival</span>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">Dep: <strong className="text-white font-mono">{activeBus.departureTime || activeBus.scheduledDeparture || '08:15 AM'}</strong></span>
                      <span className="text-amber-300">Arr: <strong className="text-white font-mono">{activeBus.expectedArrival || '08:45 AM'}</strong></span>
                    </div>
                    {activeBus.delayMinutes > 0 ? (
                      <span className="text-[10px] text-rose-300 font-bold block truncate">
                        ⚠️ +{activeBus.delayMinutes}m delay ({activeBus.delayReason || 'Traffic'})
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-300 font-bold block">
                        ● Schedule: {activeBus.timingStatus || 'On Time'}
                      </span>
                    )}
                  </div>

                  {/* Card 4: Available Seats & Speed */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Seats & Speed</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        occupancyPct > 90 ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
                      }`}>
                        {availableSeats} Free
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <strong className="text-white text-xs block">
                        {currentOccupancy} / {totalSeats} Seats
                      </strong>
                      <span className="text-xs font-black text-amber-300">
                        {isLive ? activeBus.speed : 0} km/h
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Corridor Progress Bar */}
                {isLive && (
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-[11px] text-indigo-200">
                      <span>Corridor Progress: <strong className="text-white">{activeRoute?.startPoint}</strong> ➔ <strong className="text-white">{activeRoute?.endPoint || activeRoute?.destination}</strong></span>
                      <span className="font-bold text-amber-300">{activeBus.routeProgress || 0}% Completed</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${Math.min(100, Math.max(5, activeBus.routeProgress || 0))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. MAIN MAP & FLEET SELECTOR GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Map Column */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search Input Bar */}
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by bus number, driver, or route corridor..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                  />
                </div>

                {/* Interactive Leaflet Map */}
                <div className="h-[480px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm relative">
                  <InteractiveMap
                    buses={buses}
                    routes={routes}
                    selectedBus={activeBus}
                    onSelectBus={(bus) => {
                      setSelectedBus(bus);
                    }}
                  />
                </div>
              </div>

              {/* Active Fleet List Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-900 text-sm">Available Campus Buses</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {buses.filter((b) => b.isLive).length} Live GPS Active
                  </span>
                </div>

                <div className="space-y-3 max-h-[530px] overflow-y-auto pr-1">
                  {buses.map((bus) => {
                    const isSelected = (selectedBus?.id || selectedBus?.BusID || buses[0]?.id) === (bus.id || bus.BusID);
                    const free = Math.max(0, (bus.capacity || 52) - (bus.currentOccupancy || 0));
                    const isBusLive = Boolean(bus.isLive && (bus.status === 'In Transit' || bus.status === 'Delayed'));

                    return (
                      <div
                        key={bus.id}
                        onClick={() => setSelectedBus(bus)}
                        className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
                            : 'border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2.5">
                            <div className={`p-2 rounded-xl text-xs font-black ${
                              isBusLive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Bus className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-black text-slate-900 text-sm">{bus.busNumber}</h4>
                                {isBusLive && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Streaming"></span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-semibold block truncate max-w-[160px]">
                                {bus.routeName}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={bus.status} />
                        </div>

                        {/* Next Stop, Distance & Dynamic ETA */}
                        {isBusLive && (
                          <div className="my-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-600 font-semibold truncate max-w-[130px]">
                                Next: <strong className="text-blue-700 font-bold">{bus.nextStop || 'Next Stop'}</strong>
                              </span>
                              <span className="font-mono font-bold text-slate-700">
                                {bus.distanceToNextText || bus.distanceText || '1.2 km'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-amber-700 font-black">
                                ETA: {bus.etaText || `~${bus.etaMinutes || 4}m`}
                              </span>
                              {bus.etaClockTime && (
                                <span className="text-slate-400 font-mono text-[9px]">
                                  ({bus.etaClockTime})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1">
                            <Armchair className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-700">{free} Seats Free</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <Gauge className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-black text-slate-900">{isBusLive ? bus.speed : 0} km/h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 2: BUS TIMINGS & FLEET SCHEDULES */}
      {activeTab === 'routes' && (() => {
        const filteredTimingBuses = buses.filter((bus) => {
          const status = bus.timingStatus || bus.status;
          if (timingFilter === 'all') return true;
          if (timingFilter === 'on_time') return status === 'On Time';
          if (timingFilter === 'in_transit') return status === 'In Transit';
          if (timingFilter === 'delayed') return status === 'Delayed';
          if (timingFilter === 'completed') return status === 'Completed';
          if (timingFilter === 'cancelled') return status === 'Cancelled';
          return true;
        });

        const onTimeCount = buses.filter((b) => (b.timingStatus || b.status) === 'On Time').length;
        const inTransitCount = buses.filter((b) => (b.timingStatus || b.status) === 'In Transit').length;
        const delayedCount = buses.filter((b) => (b.timingStatus || b.status) === 'Delayed').length;
        const completedCount = buses.filter((b) => (b.timingStatus || b.status) === 'Completed').length;
        const cancelledCount = buses.filter((b) => (b.timingStatus || b.status) === 'Cancelled').length;

        return (
          <div className="space-y-6">
            {/* 1. BUS TIMINGS & SCHEDULES BOARD */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-black text-slate-900">Campus Bus Timings & Schedule Board</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real-time departure times, expected terminal arrivals, delay notices & trip statuses
                  </p>
                </div>

                {/* Status KPI Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {inTransitCount} In Transit
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-200">
                    {onTimeCount} On Time
                  </span>
                  {delayedCount > 0 && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl font-bold border border-amber-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      {delayedCount} Delayed
                    </span>
                  )}
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl">
                {[
                  { id: 'all', label: 'All Fleet Buses', count: buses.length },
                  { id: 'in_transit', label: 'In Transit', count: inTransitCount },
                  { id: 'on_time', label: 'On Time', count: onTimeCount },
                  { id: 'delayed', label: 'Delayed', count: delayedCount },
                  { id: 'completed', label: 'Completed', count: completedCount },
                  { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTimingFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      timingFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      timingFilter === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Timings Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/90 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Bus Number</th>
                      <th className="p-3.5">Route Corridor</th>
                      <th className="p-3.5">Departure Time</th>
                      <th className="p-3.5">Expected Arrival</th>
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5">Seats & Telemetry</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTimingBuses.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                          No buses matching status filter "{timingFilter}".
                        </td>
                      </tr>
                    ) : (
                      filteredTimingBuses.map((bus) => {
                        const freeSeats = Math.max(0, (bus.capacity || 52) - (bus.currentOccupancy || 0));
                        const isBusLive = Boolean(bus.isLive && (bus.status === 'In Transit' || bus.status === 'Delayed'));
                        const currentStatus = bus.timingStatus || bus.status;

                        return (
                          <tr key={bus.id || bus.BusID} className="hover:bg-slate-50/80 transition-colors">
                            {/* Bus Number */}
                            <td className="p-3.5">
                              <div className="flex items-center space-x-2.5">
                                <div className={`p-2 rounded-xl text-xs font-black shrink-0 ${
                                  isBusLive ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <Bus className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 text-sm">{bus.busNumber}</div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {bus.registrationNumber || 'RJ-27-PA'} • {bus.fuelType || 'Diesel'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Route */}
                            <td className="p-3.5">
                              <div className="font-bold text-slate-800 text-xs truncate max-w-[200px]" title={bus.routeName}>
                                {bus.routeName}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[190px]">
                                Driver: {bus.driverName || 'Assigned Driver'}
                              </span>
                            </td>

                            {/* Departure Time */}
                            <td className="p-3.5">
                              <div className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-800 font-mono font-bold text-xs">
                                ⏱️ {bus.departureTime || bus.scheduledDeparture || '08:15 AM'}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {isBusLive ? '● Departed' : 'Scheduled'}
                              </span>
                            </td>

                            {/* Expected Arrival */}
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 font-mono text-xs">
                                {bus.expectedArrival || '08:45 AM'}
                              </div>
                              {bus.delayMinutes > 0 ? (
                                <span className="text-[10px] text-rose-600 font-bold block">
                                  +{bus.delayMinutes}m delay ({bus.delayReason || 'Traffic'})
                                </span>
                              ) : isBusLive ? (
                                <span className="text-[10px] text-emerald-600 font-bold block">
                                  ETA: ~{bus.etaMinutes || 4}m to next stop
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">
                                  Estimated Terminal Arrival
                                </span>
                              )}
                            </td>

                            {/* Current Status */}
                            <td className="p-3.5">
                              <StatusBadge status={currentStatus} />
                            </td>

                            {/* Seats & Speed */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  {freeSeats} Free
                                </span>
                                {isBusLive && (
                                  <span className="font-black text-slate-900 text-xs">
                                    {bus.speed || 0} km/h
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Action */}
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setSelectedBus(bus);
                                  setActiveTab('map');
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Track Live</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. TRANSIT CORRIDORS & SEQUENCE TIMINGS */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Transit Routes & Stop Sequences</h3>
                  <p className="text-xs text-slate-500 font-medium">Scheduled timetable departures and intermediate stop timings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route) => (
                  <div key={route.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-800">{route.routeName}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {route.startPoint} ➔ {route.endPoint}
                        </p>
                      </div>
                      <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                        <RouteIcon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <span>Distance: <strong>{route.totalDistance}</strong></span>
                      <span>Est: <strong>{route.estimatedDuration}</strong></span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Departure Schedules</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {route.schedules.map((time, i) => (
                          <span key={i} className="px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-lg border border-brand-100">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      {(() => {
                        const activeBusOnRoute = buses.find(
                          (b) => (b.routeId === route.id || b.RouteID === route.id || b.routeName === route.routeName) && b.isLive
                        );

                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stop Sequence</h4>
                              {activeBusOnRoute && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                  <span>{activeBusOnRoute.busNumber} Active</span>
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {route.stops.map((stop, sIdx) => {
                                const curIdx = activeBusOnRoute?.currentStopIdx ?? -1;
                                const isPassed = activeBusOnRoute && sIdx < curIdx;
                                const isCurrent = activeBusOnRoute && sIdx === curIdx;
                                const isNext = activeBusOnRoute && sIdx === curIdx + 1;

                                return (
                                  <div
                                    key={stop.id || sIdx}
                                    className={`flex items-center justify-between text-xs p-2 rounded-xl border transition-all ${
                                      isCurrent
                                        ? 'bg-blue-50/80 border-blue-300 font-bold text-blue-900 shadow-xs'
                                        : isPassed
                                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                                        : isNext
                                        ? 'bg-amber-50/60 border-amber-200 text-slate-800 font-medium'
                                        : 'bg-white border-slate-100 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <span
                                        className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${
                                          isCurrent
                                            ? 'bg-blue-600 text-white animate-pulse'
                                            : isPassed
                                            ? 'bg-emerald-600 text-white'
                                            : isNext
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-200 text-slate-600'
                                        }`}
                                      >
                                        {isPassed ? '✓' : (stop.sequenceOrder || sIdx + 1)}
                                      </span>
                                      <span className="truncate">{stop.name}</span>
                                    </div>

                                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                                      {isCurrent ? (
                                        <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                                          At Stop
                                        </span>
                                      ) : isNext ? (
                                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                                          ~{activeBusOnRoute.etaMinutes || 4}m
                                        </span>
                                      ) : isPassed ? (
                                        <span className="text-[9px] text-emerald-600 font-bold">
                                          Passed
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-medium">{stop.estimatedTime}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: TRANSPORT COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Transport Grievance Desk</h3>
              <p className="text-xs text-slate-500 font-medium">Raise and track issues regarding bus delays, overcrowding, driver behavior or route issues</p>
            </div>
            <button
              onClick={() => setRaiseComplaintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Raise Transport Complaint
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'All History', count: complaints.length },
                { id: 'Pending', label: 'Pending', count: complaints.filter(c => c.status === 'Pending').length },
                { id: 'In Progress', label: 'In Progress', count: complaints.filter(c => c.status === 'In Progress' || c.status === 'In Review').length },
                { id: 'Resolved', label: 'Resolved', count: complaints.filter(c => c.status === 'Resolved').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setComplaintFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    complaintFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    complaintFilter === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                placeholder="Search complaints, bus, topic..."
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Complaints Grid */}
          {(() => {
            const filteredComplaints = complaints.filter((c) => {
              const matchesStatus = complaintFilter === 'all'
                ? true
                : complaintFilter === 'In Progress'
                ? c.status === 'In Progress' || c.status === 'In Review'
                : c.status === complaintFilter;

              const q = complaintSearch.toLowerCase();
              const matchesQuery = !complaintSearch ||
                (c.complaintId || c.id || '').toLowerCase().includes(q) ||
                (c.title || c.subject || '').toLowerCase().includes(q) ||
                (c.category || '').toLowerCase().includes(q) ||
                (c.busNo || '').toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q);

              return matchesStatus && matchesQuery;
            });

            if (filteredComplaints.length === 0) {
              return (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No complaints found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {complaintSearch || complaintFilter !== 'all'
                      ? 'No grievances matching your current search or filter criteria.'
                      : 'You have no transport grievances logged. If you encounter any issue, use the button above to lodge a ticket.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredComplaints.map((c) => {
                  const categoryBadgeColor =
                    c.category === 'Bus Delay' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    c.category === 'Driver Behaviour' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                    c.category === 'Bus Condition' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    c.category === 'Route Issue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-200';

                  const response = c.adminResponse || c.adminRemark;

                  return (
                    <div key={c.id || c.complaintId} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5 hover:shadow-md transition-shadow">
                      {/* Top Bar: ID, Category & Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {c.complaintId || c.id}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${categoryBadgeColor}`}>
                            {c.category}
                          </span>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>

                      {/* Title & Route */}
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                          {c.title || c.subject || `${c.category} Incident`}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Bus: <strong className="text-slate-800">{c.busNo || c.busNumber}</strong> • Corridor: <strong className="text-slate-800">{c.routeName}</strong>
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
                        "{c.description}"
                      </p>

                      {/* Official Admin Response Banner */}
                      {response ? (
                        <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : 'bg-blue-50/80 border-blue-200 text-blue-950'
                        }`}>
                          <div className="flex justify-between items-center">
                            <strong className={`text-[10px] uppercase font-black flex items-center gap-1 ${
                              c.status === 'Resolved' ? 'text-emerald-700' : 'text-blue-700'
                            }`}>
                              {c.status === 'Resolved' ? '✓ Official Resolution Remark' : '● Investigation In Progress'}
                            </strong>
                            {c.resolvedAt && (
                              <span className="text-[10px] text-emerald-700 font-medium">
                                Resolved: {c.resolvedAt}
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed font-medium">
                            {response}
                          </p>
                        </div>
                      ) : (
                        c.status === 'Pending' && (
                          <div className="p-2.5 bg-amber-50/60 border border-amber-200/70 rounded-xl text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            <span>Ticket logged in transport dispatch queue. Awaiting admin review.</span>
                          </div>
                        )
                      )}

                      {/* Footer Metadata */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                        <span>Student ID: <strong className="font-mono text-slate-600">{c.studentId || c.userId}</strong></span>
                        <span>Logged: <strong>{c.date || c.createdAt || c.timestamp}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: NOTICES */}
      {activeTab === 'notices' && (
        <div className="max-w-3xl mx-auto space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-base">{notice.title}</h4>
                  <span className="text-xs text-slate-400 font-medium">{new Date(notice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{notice.message}</p>
                <span className="inline-block mt-2 text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
                  Published by {notice.authorRole}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: STUDENT PASS PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
          
          {/* Commercial Digital Pass Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white shadow-2xl border border-brand-600/40 p-6 sm:p-8 space-y-6">
            
            {/* Card Background Glow Accents */}
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-brand-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-accent-500/10 blur-2xl pointer-events-none" />

            {/* Pass Header */}
            <div className="flex items-center justify-between border-b border-brand-700/60 pb-4 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white tracking-tight leading-none">SmartBus Transit</h3>
                  <p className="text-[11px] text-brand-200 font-semibold tracking-wider uppercase mt-0.5">
                    Official Student Campus Pass
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active</span>
              </div>
            </div>

            {/* Student Photo & Core Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/30 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-inner">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-brand-200" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 p-1 bg-emerald-500 text-white rounded-full border-2 border-brand-900 shadow">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentUser?.name || 'Alex Johnson'}
                </h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/15 text-brand-100 text-xs font-mono font-bold tracking-wider border border-white/10">
                    ID: {currentUser?.studentId || 'STU-2026-001'}
                  </span>
                  <RoleBadge role={currentUser?.role || 'student'} />
                </div>
                <p className="text-xs text-brand-200 font-medium pt-1">
                  {currentUser?.department || 'Computer Science & Engineering'}
                </p>
                <p className="text-[11px] text-brand-300 font-medium">
                  Academic Year: <span className="text-white font-bold">{currentUser?.year || '3rd Year (Junior)'}</span>
                </p>
              </div>
            </div>

            {/* Pass Metadata & QR Code Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 relative z-10">
              <div className="sm:col-span-2 bg-black/20 rounded-2xl p-4 border border-white/10 backdrop-blur-sm space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-brand-300 font-semibold">Digital Pass ID:</span>
                  <span className="font-mono font-black text-white text-sm tracking-wider">
                    {currentUser?.digitalPassId || 'SB-STU-2026-001'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-brand-300 font-semibold">Registered Email:</span>
                  <span className="font-medium text-white truncate max-w-[180px]">
                    {currentUser?.email || 'student@smartbus.edu'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-300 font-semibold">Emergency Contact:</span>
                  <span className="font-medium text-white">
                    {currentUser?.phone || '+91 98290 12345'}
                  </span>
                </div>
              </div>

              {/* Simulated QR Code / RFID Verification Badge */}
              <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg border border-slate-200 text-slate-800 space-y-1">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Scan on Boarding
                </span>
              </div>
            </div>

            {/* Pass Footer Validity */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-brand-300 border-t border-brand-700/60 pt-3 relative z-10 gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Transit Access • RFID Enabled</span>
              </span>
              <span className="text-brand-200 font-medium">Session: 2026 - 2027</span>
            </div>

          </div>

          {/* Student Profile Quick Details List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-400">
              Complete Profile Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-brand-500" /> Full Name
                </span>
                <span className="font-bold text-slate-800 text-sm block">{currentUser?.name || 'Alex Johnson'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-brand-500" /> Student ID
                </span>
                <span className="font-bold text-slate-800 text-sm block font-mono">
                  {currentUser?.studentId || 'STU-2026-001'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-brand-500" /> Department
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  {currentUser?.department || 'Computer Science & Engineering'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-500" /> Academic Year
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  {currentUser?.year || '3rd Year (Junior)'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-brand-500" /> Email Address
                </span>
                <span className="font-bold text-slate-800 text-sm block truncate">
                  {currentUser?.email || 'student@smartbus.edu'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-brand-500" /> Phone Number
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  {currentUser?.phone || '+91 98290 12345'}
                </span>
              </div>
            </div>

            {/* Account Sign Out Action */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">Currently logged in as student</span>
              <button
                type="button"
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Student Account</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* BUS DETAILS MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedBus ? `${selectedBus.busNumber} Real-Time Telemetry & Details` : 'Bus Overview'}
      >
        {selectedBus && (() => {
          const route = routes.find(
            (r) => r.id === selectedBus.routeId || r.RouteID === selectedBus.routeId || r.routeName === selectedBus.routeName
          ) || routes[0];

          const totalCap = selectedBus.capacity || 52;
          const currentOcc = selectedBus.currentOccupancy || 0;
          const freeSeats = Math.max(0, totalCap - currentOcc);
          const occPct = Math.round((currentOcc / totalCap) * 100);
          const isBusLive = Boolean(selectedBus.isLive && (selectedBus.status === 'In Transit' || selectedBus.status === 'Delayed'));
          const stops = route?.stops || [];
          const curStopIdx = selectedBus.currentStopIdx !== undefined ? selectedBus.currentStopIdx : stops.findIndex((s) => s.name === selectedBus.currentStop);
          const completedStopIds = selectedBus.completedStopIds || [];

          return (
            <div className="space-y-4 text-xs">
              {/* Header Hero Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl space-y-2 border border-indigo-900/50 shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
                        {selectedBus.model || 'Tata Starbus Ultra'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-300">
                        {selectedBus.registrationNumber || 'RJ-27-PA-4081'}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black">{selectedBus.busNumber}</h4>
                  </div>
                  <div className="text-right space-y-1">
                    <StatusBadge status={selectedBus.timingStatus || selectedBus.status} />
                    {isBusLive && (
                      <span className="text-[10px] font-bold text-emerald-300 block">● Live GPS Active</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-indigo-200 font-medium">
                  Transit Corridor: <strong className="text-white">{route?.routeName || selectedBus.routeName}</strong> ({route?.startPoint} ➔ {route?.endPoint || route?.destination})
                </p>
              </div>

              {/* 4 Core Real-Time Telemetry & Timing Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Current Stop</span>
                  <strong className="text-slate-900 block truncate" title={selectedBus.currentStop}>
                    {selectedBus.currentStop || 'Depot'}
                  </strong>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    GPS: {parseFloat(selectedBus.currentLat || 24.5850).toFixed(4)}, {parseFloat(selectedBus.currentLng || 73.6900).toFixed(4)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Departure Time</span>
                  <strong className="text-slate-900 font-mono block">
                    {selectedBus.departureTime || selectedBus.scheduledDeparture || '08:15 AM'}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {isBusLive ? '● Departed' : 'Scheduled'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Expected Arrival</span>
                  <strong className="text-amber-700 font-mono block">
                    {selectedBus.expectedArrival || '08:45 AM'}
                  </strong>
                  {selectedBus.delayMinutes > 0 ? (
                    <span className="text-[10px] text-rose-600 font-bold block truncate">
                      +{selectedBus.delayMinutes}m delay
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      On Schedule
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Speed & Driver</span>
                  <strong className="text-slate-900 text-sm block">{isBusLive ? selectedBus.speed : 0} km/h</strong>
                  <span className="text-[10px] text-slate-500 block truncate">{selectedBus.driverName || 'Ramesh Sharma'}</span>
                </div>
              </div>

              {/* Available Seats & Occupancy Bar */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Seat Occupancy & Availability</span>
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      {currentOcc} seats filled • <strong className="text-emerald-700">{freeSeats} seats available</strong>
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-black rounded-full ${
                    occPct > 90 ? 'bg-rose-100 text-rose-700' : occPct > 70 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {occPct}% Full
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      occPct > 90 ? 'bg-rose-600' : occPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, occPct)}%` }}
                  />
                </div>
              </div>

              {/* Sequential Stops Timeline */}
              {stops.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    Route Stop Sequence ({stops.length} Stops Total)
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {stops.map((stop, idx) => {
                      const isCurrent = idx === curStopIdx;
                      const isPassed = (curStopIdx >= 0 && idx < curStopIdx) || completedStopIds.includes(stop.id);

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            isCurrent
                              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/10 font-bold'
                              : isPassed
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isPassed ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {isPassed ? '✓' : idx + 1}
                            </span>
                            <span className={isPassed ? 'line-through text-slate-500' : 'text-slate-900'}>
                              {stop.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 font-mono text-[10px]">{stop.estimatedTime || '08:30 AM'}</span>
                            {isCurrent && <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-bold">● At Stop</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* RAISE TRANSPORT COMPLAINT MODAL */}
      <Modal
        isOpen={raiseComplaintModalOpen}
        onClose={() => setRaiseComplaintModalOpen(false)}
        title="Submit Transport Grievance Ticket"
      >
        <form onSubmit={handleRaiseComplaint} className="space-y-4 text-xs">
          {/* Complaint Title */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Complaint Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Morning BUS-101 arrived 20 mins late at Surajpole"
              value={complaintForm.title}
              onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category Dropdown with exactly requested categories */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={complaintForm.category}
                onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="Bus Delay">Bus Delay</option>
                <option value="Driver Behaviour">Driver Behaviour</option>
                <option value="Bus Condition">Bus Condition</option>
                <option value="Route Issue">Route Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Bus Number Dropdown */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bus Number *</label>
              <select
                value={complaintForm.busNo}
                onChange={(e) => {
                  const bus = buses.find((b) => b.busNumber === e.target.value);
                  setComplaintForm({
                    ...complaintForm,
                    busNo: e.target.value,
                    routeName: bus?.routeName || complaintForm.routeName
                  });
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                {buses.map((b) => (
                  <option key={b.id || b.BusID} value={b.busNumber}>
                    {b.busNumber} ({b.routeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Assigned Route Corridor</label>
            <input
              type="text"
              readOnly
              value={complaintForm.routeName}
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description & Incident Details *</label>
            <textarea
              required
              rows={4}
              placeholder="Provide a detailed description of what happened, stop location, timestamp, and impacts..."
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            ></textarea>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Automatic Record Metadata:</span>
            <div className="flex justify-between text-slate-600 font-mono">
              <span>Student ID: {currentUser?.studentId || currentUser?.id || 'STU-2026-001'}</span>
              <span>Initial Status: Pending</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Submit Grievance Ticket
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default StudentView;
