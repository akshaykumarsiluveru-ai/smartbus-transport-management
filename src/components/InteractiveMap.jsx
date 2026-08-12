import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StatusBadge from './StatusBadge';
import { Bus, Clock, MapPin, Gauge, Users } from 'lucide-react';

// Dynamic Map View Panning Controller
const MapViewController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.panTo(center, { animate: true, duration: 1.0 });
    }
  }, [center, map]);
  return null;
};

// Custom SVG Bus Icon Generator for Leaflet Map
const createBusIcon = (isLive, busNumber = 'BUS') => {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group">
        ${isLive ? '<div class="absolute -inset-2.5 rounded-full bg-blue-500/40 animate-ping"></div>' : ''}
        <div class="relative w-11 h-11 rounded-2xl ${isLive ? 'bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 shadow-xl ring-2 ring-white' : 'bg-slate-600 ring-2 ring-slate-300'} text-white flex flex-col items-center justify-center transition-transform transform group-hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.2 6 18.2 6H5.8C4.8 6 3.9 6.8 3.6 7.8L2.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          <span class="text-[8px] font-black leading-none mt-0.5 tracking-tighter opacity-90">${busNumber.replace('BUS-', '')}</span>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const createStopIcon = (number, isCompleted = false) => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div class="w-7 h-7 rounded-full ${isCompleted ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-blue-600 ring-2 ring-blue-300'} text-white font-black text-xs flex items-center justify-center shadow-lg transition-transform hover:scale-110">
        ${isCompleted ? '✓' : number}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const InteractiveMap = ({ buses = [], routes = [], selectedBus, selectedRoute, onSelectBus }) => {
  // Determine active route
  const activeRoute = selectedRoute || routes.find((r) => r.id === selectedBus?.routeId || r.RouteID === selectedBus?.routeId) || routes[0];
  
  // Extract polyline points safely supporting lat/Latitude and lng/Longitude
  const polylinePoints = (activeRoute?.stops || activeRoute?.Stops || []).map((s) => [
    parseFloat(s.lat || s.Latitude || s.latitude || 24.5850),
    parseFloat(s.lng || s.Longitude || s.longitude || 73.6900)
  ]);

  const defaultCenter = polylinePoints.length > 0 ? polylinePoints[0] : [24.5880, 73.6870];
  const centerLat = parseFloat(selectedBus?.currentLat || selectedBus?.Latitude || (selectedRoute && polylinePoints.length > 0 ? polylinePoints[0][0] : defaultCenter[0]));
  const centerLng = parseFloat(selectedBus?.currentLng || selectedBus?.Longitude || (selectedRoute && polylinePoints.length > 0 ? polylinePoints[0][1] : defaultCenter[1]));

  const completedStopIds = selectedBus?.completedStopIds || [];

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapViewController center={[centerLat, centerLng]} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Polyline Line */}
        {polylinePoints.length > 1 && (
          <Polyline
            positions={polylinePoints}
            color="#2563EB"
            weight={5}
            opacity={0.85}
            dashArray="6, 8"
          />
        )}

        {/* Route Stop Markers */}
        {(activeRoute?.stops || activeRoute?.Stops || []).map((stop, idx) => {
          const lat = parseFloat(stop.lat || stop.Latitude || stop.latitude || 24.5850);
          const lng = parseFloat(stop.lng || stop.Longitude || stop.longitude || 73.6900);
          const seq = stop.sequenceOrder || stop.Sequence || stop.sequence || (idx + 1);
          const stopName = stop.name || stop.StopName || stop.stopName;
          const stopId = stop.id || stop.StopID || stop.stopId || `STP-${seq}`;
          const arrTime = stop.estimatedTime || stop.ExpectedArrivalTime || stop.expectedArrivalTime || '08:30 AM';
          const isStopCompleted = completedStopIds.includes(stop.id) || (selectedBus?.currentStopIdx !== undefined && idx < selectedBus.currentStopIdx);

          return (
            <Marker key={stopId || idx} position={[lat, lng]} icon={createStopIcon(seq, isStopCompleted)}>
              <Popup>
                <div className="p-1.5 min-w-[190px] space-y-1.5">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      isStopCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'
                    }`}>
                      Stop #{seq} {isStopCompleted ? '• Visited' : ''}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{stopId}</span>
                  </div>
                  <p className="font-extrabold text-xs text-slate-900 leading-snug">{stopName}</p>
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                    <div className="flex justify-between">
                      <span>Expected:</span>
                      <strong className="text-slate-700">{arrTime}</strong>
                    </div>
                    <div className="flex justify-between font-mono text-[10px] text-slate-400">
                      <span>GPS:</span>
                      <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Bus Markers */}
        {buses.map((bus) => {
          const lat = parseFloat(bus.currentLat || bus.Latitude || 24.5714);
          const lng = parseFloat(bus.currentLng || bus.Longitude || 73.6974);
          const busNo = bus.busNumber || bus.BusNo || 'BUS';
          const totalCap = bus.capacity || 52;
          const passengers = bus.currentOccupancy || 0;
          const freeSeats = Math.max(0, totalCap - passengers);
          const status = bus.timingStatus || bus.status;
          const isLive = Boolean(bus.isLive && (status === 'In Transit' || status === 'Delayed'));

          return (
            <Marker
              key={bus.id || bus.BusID}
              position={[lat, lng]}
              icon={createBusIcon(isLive, busNo)}
              eventHandlers={{
                click: () => onSelectBus && onSelectBus(bus),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[240px] space-y-2 text-xs">
                  {/* 1. Bus Number & 10. Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                    <div>
                      <h4 className="font-black text-base text-slate-900 leading-tight flex items-center gap-1.5">
                        <Bus className="w-4 h-4 text-blue-600 inline" />
                        <span>{busNo}</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">{bus.registrationNumber || 'RJ-27-PA'}</span>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  {/* 3. Route */}
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Route Corridor</span>
                    <p className="text-xs font-black text-slate-800 leading-snug truncate" title={bus.routeName}>
                      {bus.routeName}
                    </p>
                  </div>

                  {/* Telemetry Details Grid */}
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
                    {/* 2. Driver */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Driver:</span>
                      <strong className="text-slate-900 font-bold truncate max-w-[130px]" title={bus.driverName}>
                        {bus.driverName || 'Assigned Driver'}
                      </strong>
                    </div>

                    {/* 4. Current Stop */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Current Stop:</span>
                      <strong className="text-slate-900 truncate max-w-[130px]" title={bus.currentStop}>
                        {bus.currentStop || 'Depot Terminal'}
                      </strong>
                    </div>

                    {/* 5. Next Stop & Distance */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Next Stop:</span>
                      <div className="text-right">
                        <strong className="text-blue-700 block truncate max-w-[130px]" title={bus.nextStop}>
                          {bus.nextStop || 'Terminal Destination'}
                        </strong>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          Dist: {bus.distanceToNextText || bus.distanceText || '1.2 km'}
                        </span>
                      </div>
                    </div>

                    {/* 6. Speed & 9. Dynamic ETA */}
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-slate-500">Speed:</span>
                        <strong className="text-slate-900 font-black text-xs">{isLive ? bus.speed : 0} km/h</strong>
                      </div>
                      <div className="flex items-baseline gap-1 text-right">
                        <span className="text-slate-500">ETA:</span>
                        <div>
                          <strong className="text-amber-600 font-bold block">{isLive ? (bus.etaText || `~${bus.etaMinutes || 4}m`) : '--'}</strong>
                          {isLive && bus.etaClockTime && (
                            <span className="text-[9px] text-slate-400 font-mono block">({bus.etaClockTime})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 7. Passengers & 8. Available Seats */}
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1">
                      <span className="text-slate-500">Occupancy:</span>
                      <span className="font-bold text-slate-800">
                        {passengers} / {totalCap} <strong className="text-emerald-700 font-black">({freeSeats} Free)</strong>
                      </span>
                    </div>

                    {/* Coordinates */}
                    <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 pt-0.5">
                      <span>GPS:</span>
                      <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
