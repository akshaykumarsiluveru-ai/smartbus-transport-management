import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import InteractiveMap from '../../components/InteractiveMap';
import {
  Bus,
  ShieldCheck,
  Users,
  Route as RouteIcon,
  Clock,
  AlertTriangle,
  Wrench,
  BarChart3,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Bell,
  Search,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  UserCheck,
  LogOut
} from 'lucide-react';

const AdminView = () => {
  const { logout } = useAuth();
  const {
    allBuses,
    drivers,
    routes,
    trips,
    notices,
    complaints = [],
    updateComplaintStatus,
    users = [],
    activityLogs,
    maintenanceLogs,
    selectedBus,
    setSelectedBus,
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
    publishNotice,
    setBusMaintenance,
    releaseBusMaintenance
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminActiveSchemaTable, setAdminActiveSchemaTable] = useState('buses');
  const [resolveComplaintModalItem, setResolveComplaintModalItem] = useState(null);
  const [adminRemarkInput, setAdminRemarkInput] = useState('');
  const [complaintSearchQuery, setComplaintSearchQuery] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState('All');
  const [selectedComplaintForDetail, setSelectedComplaintForDetail] = useState(null);
  const [complaintDetailModalOpen, setComplaintDetailModalOpen] = useState(false);
  const [complaintActionForm, setComplaintActionForm] = useState({ status: 'Pending', response: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const [liveStatusFilter, setLiveStatusFilter] = useState('All');

  // Driver Filtering & Modals
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('All');
  const [addDriverModalOpen, setAddDriverModalOpen] = useState(false);
  const [editDriverModalOpen, setEditDriverModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [driverDetailsModalOpen, setDriverDetailsModalOpen] = useState(false);
  const [selectedDriverForDetail, setSelectedDriverForDetail] = useState(null);
  const [deleteDriverModalOpen, setDeleteDriverModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [driverFormErrors, setDriverFormErrors] = useState('');
  const [assignmentError, setAssignmentError] = useState('');

  // Route & Stops Filtering & Modals
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [routeStatusFilter, setRouteStatusFilter] = useState('All');
  const [addRouteModalOpen, setAddRouteModalOpen] = useState(false);
  const [editRouteModalOpen, setEditRouteModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [routeDetailsModalOpen, setRouteDetailsModalOpen] = useState(false);
  const [selectedRouteForDetail, setSelectedRouteForDetail] = useState(null);
  const [manageStopsModalOpen, setManageStopsModalOpen] = useState(false);
  const [selectedRouteForStops, setSelectedRouteForStops] = useState(null);
  const [deleteRouteModalOpen, setDeleteRouteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [routeFormErrors, setRouteFormErrors] = useState('');
  const [stopFormErrors, setStopFormErrors] = useState('');
  const [editingStopId, setEditingStopId] = useState(null);
  const [addStopInlineOpen, setAddStopInlineOpen] = useState(false);

  // Central Assignments Filtering & Modals
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('All');
  const [assignmentShiftFilter, setAssignmentShiftFilter] = useState('All');
  const [editAssignModalOpen, setEditAssignModalOpen] = useState(false);
  const [changeDriverModalOpen, setChangeDriverModalOpen] = useState(false);
  const [changeRouteModalOpen, setChangeRouteModalOpen] = useState(false);
  const [unassignConfirmModalOpen, setUnassignConfirmModalOpen] = useState(false);
  const [selectedAssignmentBus, setSelectedAssignmentBus] = useState(null);
  const [changeDriverForm, setChangeDriverForm] = useState({ busId: '', newDriverId: '' });
  const [changeRouteForm, setChangeRouteForm] = useState({ busId: '', newRouteId: '' });

  // Bus Modals
  const [addBusModalOpen, setAddBusModalOpen] = useState(false);
  const [editBusModalOpen, setEditBusModalOpen] = useState(false);
  const [busDetailsModalOpen, setBusDetailsModalOpen] = useState(false);
  const [selectedBusForDetail, setSelectedBusForDetail] = useState(null);
  const [deleteBusModalOpen, setDeleteBusModalOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState('');

  // Common Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  // Forms
  const [busForm, setBusForm] = useState({
    busNumber: '',
    registrationNumber: '',
    model: 'Tata Starbus Ultra 52S',
    capacity: 52,
    fuelType: 'Diesel',
    routeId: '',
    driverId: '',
    status: 'At Depot'
  });
  const [editingBusId, setEditingBusId] = useState(null);
  const [driverForm, setDriverForm] = useState({
    driverId: '',
    name: '',
    phone: '',
    email: '',
    shift: 'Morning',
    licenseNumber: '',
    status: 'Available',
    assignedBusId: '',
    assignedRouteId: ''
  });
  const [routeForm, setRouteForm] = useState({
    routeId: '',
    routeName: '',
    startPoint: '',
    endPoint: '',
    totalDistance: '10.5 km',
    estimatedDuration: '28 mins',
    status: 'Active',
    schedules: '07:30 AM, 08:15 AM, 01:30 PM, 05:00 PM'
  });
  const [stopForm, setStopForm] = useState({
    stopId: '',
    name: '',
    sequence: 1,
    lat: 24.5850,
    lng: 73.6900,
    estimatedTime: '08:30 AM'
  });
  const [assignForm, setAssignForm] = useState({ busId: '', driverId: '', routeId: '', shift: 'Morning' });
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', type: 'General Announcement', target: 'All Students' });
  const [maintForm, setMaintForm] = useState({ busId: '', issue: '', mechanic: '', expectedReturn: '', cost: '₹5,000' });

  // Metrics
  const metrics = useMemo(() => {
    const totalBuses = allBuses.length;
    const activeBuses = allBuses.filter((b) => b.status === 'In Transit' || b.isLive).length;
    const busesAtDepot = allBuses.filter((b) => b.status === 'At Depot').length;
    const maintenanceBuses = allBuses.filter((b) => b.status === 'Maintenance' || b.status === 'Out of Service').length;
    const inactiveBuses = allBuses.filter((b) => b.status === 'Inactive').length;
    const delayedBuses = allBuses.filter((b) => b.status === 'Delayed').length;
    const totalCapacity = allBuses.reduce((acc, b) => acc + (b.capacity || b.Capacity || 50), 0);

    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter((d) => d.status === 'Available').length;
    const activeDrivers = drivers.filter((d) => d.status === 'On Trip').length;
    const offDutyDrivers = drivers.filter((d) => d.status === 'Off Duty').length;
    const onLeaveDrivers = drivers.filter((d) => d.status === 'On Leave').length;
    const totalDriverTrips = drivers.reduce((acc, d) => acc + (d.tripsToday || 0), 0);

    const totalRoutes = routes.length;
    const activeRoutes = routes.filter((r) => r.status === 'Active').length;
    const inactiveRoutes = routes.filter((r) => r.status === 'Inactive').length;
    const totalFleetStops = routes.reduce((acc, r) => acc + (r.stops?.length || 0), 0);
    const totalCoverageKm = routes.reduce((acc, r) => acc + (parseFloat(r.distance || r.totalDistance) || 0), 0).toFixed(1);

    const activeTrips = trips.filter((t) => t.status === 'In Transit').length;
    const delayedTrips = trips.filter((t) => t.status === 'Delayed').length;
    const totalPassengersToday = trips.reduce((acc, t) => acc + (t.passengers || 0), 0) + allBuses.reduce((acc, b) => acc + (b.currentOccupancy || 0), 0);

    return {
      totalBuses,
      activeBuses,
      busesAtDepot,
      maintenanceBuses,
      inactiveBuses,
      delayedBuses,
      totalCapacity,
      totalDrivers,
      availableDrivers,
      activeDrivers,
      offDutyDrivers,
      onLeaveDrivers,
      totalDriverTrips,
      totalRoutes,
      activeRoutes,
      inactiveRoutes,
      totalFleetStops,
      totalCoverageKm,
      activeTrips,
      delayedTrips,
      totalPassengersToday
    };
  }, [allBuses, drivers, routes, trips]);

  const assignmentMetrics = useMemo(() => {
    const totalBuses = allBuses.length;
    const assignedBuses = allBuses.filter((b) => b.driverId && b.driverName !== 'Unassigned' && b.routeId);
    const totalAssignedCount = assignedBuses.length;
    const activeDispatches = allBuses.filter((b) => b.status === 'In Transit').length;
    const availableDrivers = drivers.filter((d) => d.status === 'Available').length;
    const unassignedBusesAtDepot = allBuses.filter((b) => (!b.driverId || b.driverName === 'Unassigned') && b.status === 'At Depot').length;
    const uncoveredRoutes = routes.filter((r) => !allBuses.some((b) => b.routeId === (r.id || r.RouteID))).length;
    const coverageRate = totalBuses > 0 ? Math.round((totalAssignedCount / totalBuses) * 100) : 0;

    return {
      totalBuses,
      totalAssignedCount,
      activeDispatches,
      availableDrivers,
      unassignedBusesAtDepot,
      uncoveredRoutes,
      coverageRate,
    };
  }, [allBuses, drivers, routes]);

  const filteredBuses = useMemo(() => {
    return allBuses.filter((b) => {
      const q = searchQuery.toLowerCase();
      const busNo = (b.busNumber || b.BusNo || '').toLowerCase();
      const regNo = (b.registrationNumber || '').toLowerCase();
      const rName = (b.routeName || '').toLowerCase();
      const dName = (b.driverName || '').toLowerCase();
      const model = (b.model || '').toLowerCase();

      const matchesQuery = !searchQuery || busNo.includes(q) || regNo.includes(q) || rName.includes(q) || dName.includes(q) || model.includes(q);
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [allBuses, searchQuery, statusFilter]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = (driverSearchQuery || searchQuery).toLowerCase();
      const dName = (d.name || d.Name || '').toLowerCase();
      const dId = (d.driverId || d.DriverID || d.id || '').toLowerCase();
      const dPhone = (d.phone || d.Contact || '').toLowerCase();
      const dLicense = (d.licenseNumber || '').toLowerCase();
      const dBus = (d.assignedBusNumber || '').toLowerCase();
      const dRoute = (d.assignedRouteName || '').toLowerCase();

      const matchesQuery = !q || dName.includes(q) || dId.includes(q) || dPhone.includes(q) || dLicense.includes(q) || dBus.includes(q) || dRoute.includes(q);
      const matchesStatus = driverStatusFilter === 'All' || d.status === driverStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [drivers, driverSearchQuery, searchQuery, driverStatusFilter]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const q = (routeSearchQuery || searchQuery).toLowerCase();
      const rName = (r.routeName || r.RouteName || r.name || '').toLowerCase();
      const rId = (r.routeId || r.RouteID || r.id || '').toLowerCase();
      const sPoint = (r.startPoint || r.StartPoint || '').toLowerCase();
      const ePoint = (r.endPoint || r.EndPoint || r.destination || '').toLowerCase();
      const stopMatches = (r.stops || []).some((s) => (s.name || s.StopName || '').toLowerCase().includes(q));

      const matchesQuery = !q || rName.includes(q) || rId.includes(q) || sPoint.includes(q) || ePoint.includes(q) || stopMatches;
      const matchesStatus = routeStatusFilter === 'All' || r.status === routeStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [routes, routeSearchQuery, searchQuery, routeStatusFilter]);

  const filteredAssignments = useMemo(() => {
    return allBuses.filter((b) => {
      const q = (assignmentSearchQuery || searchQuery).toLowerCase();
      const busNo = (b.busNumber || b.BusNo || '').toLowerCase();
      const regNo = (b.registrationNumber || '').toLowerCase();
      const driverName = (b.driverName || '').toLowerCase();
      const routeName = (b.routeName || '').toLowerCase();

      const matchesQuery = !q || busNo.includes(q) || regNo.includes(q) || driverName.includes(q) || routeName.includes(q);

      const isAssigned = Boolean(b.driverId && b.driverName !== 'Unassigned' && b.routeId);
      let matchesStatus = true;
      if (assignmentStatusFilter === 'Assigned') matchesStatus = isAssigned;
      else if (assignmentStatusFilter === 'Unassigned') matchesStatus = !isAssigned;
      else if (assignmentStatusFilter === 'In Transit') matchesStatus = b.status === 'In Transit';
      else if (assignmentStatusFilter === 'At Depot') matchesStatus = b.status === 'At Depot';
      else if (assignmentStatusFilter === 'Maintenance') matchesStatus = b.status === 'Maintenance';

      const matchesShift = assignmentShiftFilter === 'All' || (b.shift || 'Morning') === assignmentShiftFilter;

      return matchesQuery && matchesStatus && matchesShift;
    });
  }, [allBuses, assignmentSearchQuery, searchQuery, assignmentStatusFilter, assignmentShiftFilter]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const q = (complaintSearchQuery || '').toLowerCase();
      const id = (c.complaintId || c.id || '').toLowerCase();
      const title = (c.title || c.subject || '').toLowerCase();
      const student = (c.studentName || '').toLowerCase();
      const studentId = (c.studentId || c.userId || '').toLowerCase();
      const bus = (c.busNo || c.busNumber || '').toLowerCase();
      const route = (c.routeName || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const category = (c.category || '').toLowerCase();

      const matchesQuery = !complaintSearchQuery ||
        id.includes(q) ||
        title.includes(q) ||
        student.includes(q) ||
        studentId.includes(q) ||
        bus.includes(q) ||
        route.includes(q) ||
        desc.includes(q) ||
        category.includes(q);

      let matchesStatus = true;
      if (complaintStatusFilter === 'Pending') matchesStatus = c.status === 'Pending';
      else if (complaintStatusFilter === 'In Progress') matchesStatus = c.status === 'In Progress' || c.status === 'In Review';
      else if (complaintStatusFilter === 'Resolved') matchesStatus = c.status === 'Resolved';

      const matchesCategory = complaintCategoryFilter === 'All' || c.category === complaintCategoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [complaints, complaintSearchQuery, complaintStatusFilter, complaintCategoryFilter]);

  const filteredLiveBuses = useMemo(() => {
    return allBuses.filter((b) => {
      const q = (liveSearchQuery || '').toLowerCase();
      const busNo = (b.busNumber || b.BusNo || '').toLowerCase();
      const regNo = (b.registrationNumber || '').toLowerCase();
      const driver = (b.driverName || '').toLowerCase();
      const route = (b.routeName || '').toLowerCase();
      const curStop = (b.currentStop || '').toLowerCase();
      const nxtStop = (b.nextStop || '').toLowerCase();

      const matchesQuery = !liveSearchQuery ||
        busNo.includes(q) ||
        regNo.includes(q) ||
        driver.includes(q) ||
        route.includes(q) ||
        curStop.includes(q) ||
        nxtStop.includes(q);

      let matchesStatus = true;
      if (liveStatusFilter === 'In Transit') matchesStatus = b.status === 'In Transit' || b.timingStatus === 'In Transit';
      else if (liveStatusFilter === 'Delayed') matchesStatus = b.status === 'Delayed' || b.timingStatus === 'Delayed';
      else if (liveStatusFilter === 'At Depot') matchesStatus = b.status === 'At Depot' || b.status === 'Completed' || b.timingStatus === 'Completed';

      return matchesQuery && matchesStatus;
    });
  }, [allBuses, liveSearchQuery, liveStatusFilter]);

  const handleCreateBus = (e) => {
    e.preventDefault();
    setFormErrors('');

    const busNumberClean = busForm.busNumber.toUpperCase().trim();
    const regNumberClean = busForm.registrationNumber.toUpperCase().trim();
    const capacityNum = parseInt(busForm.capacity) || 0;

    if (!busNumberClean) {
      setFormErrors('Bus Number is required (e.g. BUS-105).');
      return;
    }

    if (!regNumberClean) {
      setFormErrors('Registration Number is required (e.g. RJ-27-PA-5501).');
      return;
    }

    if (capacityNum <= 0) {
      setFormErrors('Capacity must be a positive integer greater than 0.');
      return;
    }

    // Check uniqueness
    const exists = allBuses.some((b) => (b.busNumber || b.BusNo || '').toUpperCase() === busNumberClean);
    if (exists) {
      setFormErrors(`A bus with number "${busNumberClean}" already exists in the fleet.`);
      return;
    }

    const selectedRoute = routes.find((r) => r.id === busForm.routeId || r.RouteID === busForm.routeId);
    const selectedDriver = drivers.find((d) => d.id === busForm.driverId || d.DriverID === busForm.driverId);
    const busId = `bus_${Date.now()}`;
    const isLive = busForm.status === 'In Transit';

    const newBus = {
      BusID: busId,
      id: busId,
      BusNo: busNumberClean,
      busNumber: busNumberClean,
      registrationNumber: regNumberClean,
      model: busForm.model || 'Tata Starbus Ultra 52S',
      Capacity: capacityNum,
      capacity: capacityNum,
      fuelType: busForm.fuelType || 'Diesel',
      driverId: selectedDriver ? (selectedDriver.id || selectedDriver.DriverID) : '',
      driverName: selectedDriver ? (selectedDriver.name || selectedDriver.Name) : 'Unassigned',
      routeId: selectedRoute ? (selectedRoute.id || selectedRoute.RouteID) : '',
      routeName: selectedRoute ? selectedRoute.routeName : 'Unassigned',
      shift: 'Morning',
      status: busForm.status,
      isLive,
      currentOccupancy: 0,
      speed: isLive ? 30.0 : 0,
      currentLat: selectedRoute?.stops?.[0]?.lat || 24.5714,
      Latitude: selectedRoute?.stops?.[0]?.lat || 24.5714,
      currentLng: selectedRoute?.stops?.[0]?.lng || 73.6974,
      Longitude: selectedRoute?.stops?.[0]?.lng || 73.6974,
      currentStop: selectedRoute?.stops?.[0]?.name || 'Depot Yard',
      nextStop: selectedRoute?.stops?.[1]?.name || selectedRoute?.stops?.[0]?.name || 'None',
      etaMinutes: isLive ? 5 : 0,
      eta: isLive ? 5 : 0,
      lastUpdated: new Date().toISOString()
    };

    addBus(newBus);

    // If driver was selected, update driver's assigned bus
    if (selectedDriver) {
      updateDriver(selectedDriver.id || selectedDriver.DriverID, {
        assignedBusId: busId,
        assignedBusNumber: busNumberClean,
        assignedRouteId: selectedRoute ? (selectedRoute.id || selectedRoute.RouteID) : '',
        assignedRouteName: selectedRoute ? selectedRoute.routeName : 'None',
        status: isLive ? 'On Trip' : 'Available',
      });
    }

    setAddBusModalOpen(false);
    setFormErrors('');
    setBusForm({ busNumber: '', registrationNumber: '', model: 'Tata Starbus Ultra 52S', capacity: 52, fuelType: 'Diesel', routeId: '', driverId: '', status: 'At Depot' });
  };

  const handleUpdateBus = (e) => {
    e.preventDefault();
    if (!editingBusId) return;
    setFormErrors('');

    const busNumberClean = busForm.busNumber.toUpperCase().trim();
    const regNumberClean = busForm.registrationNumber.toUpperCase().trim();
    const capacityNum = parseInt(busForm.capacity) || 0;

    if (!busNumberClean) {
      setFormErrors('Bus Number is required.');
      return;
    }

    if (!regNumberClean) {
      setFormErrors('Registration Number is required.');
      return;
    }

    if (capacityNum <= 0) {
      setFormErrors('Capacity must be a positive integer greater than 0.');
      return;
    }

    // Check duplicate among other buses
    const duplicate = allBuses.some((b) => (b.id !== editingBusId && b.BusID !== editingBusId) && (b.busNumber || b.BusNo || '').toUpperCase() === busNumberClean);
    if (duplicate) {
      setFormErrors(`Another bus already uses the number "${busNumberClean}".`);
      return;
    }

    const selectedRoute = routes.find((r) => r.id === busForm.routeId || r.RouteID === busForm.routeId);
    const selectedDriver = drivers.find((d) => d.id === busForm.driverId || d.DriverID === busForm.driverId);
    const isLive = busForm.status === 'In Transit';

    updateBus(editingBusId, {
      BusNo: busNumberClean,
      busNumber: busNumberClean,
      registrationNumber: regNumberClean,
      model: busForm.model,
      Capacity: capacityNum,
      capacity: capacityNum,
      fuelType: busForm.fuelType,
      routeId: selectedRoute ? (selectedRoute.id || selectedRoute.RouteID) : '',
      routeName: selectedRoute ? selectedRoute.routeName : 'Unassigned',
      driverId: selectedDriver ? (selectedDriver.id || selectedDriver.DriverID) : '',
      driverName: selectedDriver ? (selectedDriver.name || selectedDriver.Name) : 'Unassigned',
      status: busForm.status,
      isLive,
      speed: isLive ? 32.0 : 0
    });

    if (selectedDriver) {
      updateDriver(selectedDriver.id || selectedDriver.DriverID, {
        assignedBusId: editingBusId,
        assignedBusNumber: busNumberClean,
        assignedRouteId: selectedRoute ? (selectedRoute.id || selectedRoute.RouteID) : '',
        assignedRouteName: selectedRoute ? selectedRoute.routeName : 'None',
        status: isLive ? 'On Trip' : 'Available',
      });
    }

    setEditBusModalOpen(false);
    setEditingBusId(null);
    setFormErrors('');
  };

  const handleQuickStatusChange = (busId, newStatus) => {
    const isLive = newStatus === 'In Transit';
    updateBus(busId, {
      status: newStatus,
      isLive,
      speed: isLive ? 30.0 : 0
    });
  };

  const handleOpenBusDetail = (bus) => {
    setSelectedBusForDetail(bus);
    setBusDetailsModalOpen(true);
  };

  const handleOpenDeleteBus = (bus) => {
    setBusToDelete(bus);
    setDeleteBusModalOpen(true);
  };

  const handleConfirmDeleteBus = () => {
    if (!busToDelete) return;
    deleteBus(busToDelete.id || busToDelete.BusID);
    setDeleteBusModalOpen(false);
    if (selectedBusForDetail?.id === busToDelete.id) {
      setBusDetailsModalOpen(false);
    }
    setBusToDelete(null);
  };

  const handleCreateDriver = (e) => {
    e.preventDefault();
    setDriverFormErrors('');

    const nameClean = driverForm.name.trim();
    const phoneClean = driverForm.phone.trim();
    const licenseClean = (driverForm.licenseNumber || '').toUpperCase().trim();
    const customIdClean = (driverForm.driverId || '').toUpperCase().trim();

    if (!nameClean) {
      setDriverFormErrors('Driver full name is required.');
      return;
    }

    if (!phoneClean) {
      setDriverFormErrors('Contact phone number is required.');
      return;
    }

    if (!licenseClean) {
      setDriverFormErrors('Commercial License Number is required (e.g. RJ-27-2024-00100).');
      return;
    }

    const genId = customIdClean || `DRV-${Math.floor(100 + Math.random() * 900)}`;

    // Check duplicate ID
    if (drivers.some((d) => (d.driverId || d.DriverID || d.id) === genId)) {
      setDriverFormErrors(`A driver with ID "${genId}" already exists.`);
      return;
    }

    const selectedBus = allBuses.find((b) => b.id === driverForm.assignedBusId || b.BusID === driverForm.assignedBusId);
    const selectedRoute = routes.find((r) => r.id === driverForm.assignedRouteId || r.RouteID === driverForm.assignedRouteId);

    const newDriver = {
      id: genId.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      driverId: genId,
      DriverID: genId,
      name: nameClean,
      Name: nameClean,
      phone: phoneClean,
      Contact: phoneClean,
      email: driverForm.email.trim() || `${nameClean.toLowerCase().replace(/\s+/g, '')}@smartbus.edu`,
      assignedBusId: selectedBus ? (selectedBus.id || selectedBus.BusID) : '',
      assignedBusNumber: selectedBus ? (selectedBus.busNumber || selectedBus.BusNo) : 'Unassigned',
      assignedRouteId: selectedRoute ? (selectedRoute.id || selectedRoute.RouteID) : '',
      assignedRouteName: selectedRoute ? selectedRoute.routeName : 'None',
      status: driverForm.status || 'Available',
      shift: driverForm.shift || 'Morning',
      tripsToday: 0,
      rating: '5.0 ⭐',
      licenseNumber: licenseClean
    };

    addDriver(newDriver);

    // If a bus and route were assigned during creation, execute assignment rules
    if (selectedBus && selectedRoute) {
      const res = assignDriverToBus(selectedBus.id || selectedBus.BusID, newDriver.id, selectedRoute.id || selectedRoute.RouteID, driverForm.shift);
      if (res && res.error) {
        alert(`Driver added, but bus assignment notice: ${res.error}`);
      }
    }

    setAddDriverModalOpen(false);
    setDriverFormErrors('');
    setDriverForm({
      driverId: '',
      name: '',
      phone: '',
      email: '',
      shift: 'Morning',
      licenseNumber: '',
      status: 'Available',
      assignedBusId: '',
      assignedRouteId: ''
    });
  };

  const handleUpdateDriver = (e) => {
    e.preventDefault();
    if (!editingDriverId) return;
    setDriverFormErrors('');

    const nameClean = driverForm.name.trim();
    const phoneClean = driverForm.phone.trim();
    const licenseClean = (driverForm.licenseNumber || '').toUpperCase().trim();

    if (!nameClean || !phoneClean || !licenseClean) {
      setDriverFormErrors('Name, Phone, and Commercial License Number are required.');
      return;
    }

    const selectedBus = allBuses.find((b) => b.id === driverForm.assignedBusId || b.BusID === driverForm.assignedBusId);
    const selectedRoute = routes.find((r) => r.id === driverForm.assignedRouteId || r.RouteID === driverForm.assignedRouteId);

    updateDriver(editingDriverId, {
      name: nameClean,
      Name: nameClean,
      phone: phoneClean,
      Contact: phoneClean,
      email: driverForm.email.trim(),
      licenseNumber: licenseClean,
      shift: driverForm.shift,
      status: driverForm.status,
      assignedBusId: selectedBus ? (selectedBus.id || selectedBus.BusID) : '',
      assignedBusNumber: selectedBus ? (selectedBus.busNumber || selectedBus.BusNo) : 'Unassigned',
      assignedRouteId: selectedRoute ? (selectedRoute.id || selectedRoute.RouteID) : '',
      assignedRouteName: selectedRoute ? selectedRoute.routeName : 'None',
    });

    // If bus was selected, execute assignment
    if (selectedBus && selectedRoute) {
      assignDriverToBus(selectedBus.id || selectedBus.BusID, editingDriverId, selectedRoute.id || selectedRoute.RouteID, driverForm.shift);
    } else if (!selectedBus) {
      unassignDriver(editingDriverId);
    }

    setEditDriverModalOpen(false);
    setEditingDriverId(null);
    setDriverFormErrors('');
  };

  const handleQuickDriverStatusChange = (driverId, newStatus) => {
    updateDriver(driverId, { status: newStatus });
  };

  const handleOpenDriverDetail = (driver) => {
    setSelectedDriverForDetail(driver);
    setDriverDetailsModalOpen(true);
  };

  const handleOpenDeleteDriver = (driver) => {
    setDriverToDelete(driver);
    setDeleteDriverModalOpen(true);
  };

  const handleConfirmDeleteDriver = () => {
    if (!driverToDelete) return;
    deleteDriver(driverToDelete.id || driverToDelete.DriverID);
    setDeleteDriverModalOpen(false);
    if (selectedDriverForDetail?.id === driverToDelete.id) {
      setDriverDetailsModalOpen(false);
    }
    setDriverToDelete(null);
  };

  const handleUnassignDriverAction = (driverId) => {
    unassignDriver(driverId);
  };

  /**
   * CENTRAL ASSIGNMENT ACTION HANDLERS (BUS + DRIVER + ROUTE)
   */
  const handleExecuteAssignment = (e) => {
    e.preventDefault();
    setAssignmentError('');
    const { busId, driverId, routeId, shift } = assignForm;
    if (!busId || !driverId || !routeId) {
      setAssignmentError('Please select a Bus, a Driver, and a Route.');
      return;
    }

    const res = assignDriverToBus(busId, driverId, routeId, shift);
    if (res && res.error) {
      setAssignmentError(res.error);
      return;
    }
    setAssignModalOpen(false);
    setAssignmentError('');
    setAssignForm({ busId: '', driverId: '', routeId: '', shift: 'Morning' });
  };

  const handleOpenEditAssignment = (bus) => {
    setSelectedAssignmentBus(bus);
    setAssignmentError('');
    setAssignForm({
      busId: bus.id || bus.BusID,
      driverId: bus.driverId || '',
      routeId: bus.routeId || '',
      shift: bus.shift || 'Morning'
    });
    setEditAssignModalOpen(true);
  };

  const handleExecuteEditAssignment = (e) => {
    e.preventDefault();
    setAssignmentError('');
    const { busId, driverId, routeId, shift } = assignForm;
    if (!busId || !driverId || !routeId) {
      setAssignmentError('Please specify Bus, Driver, and Route.');
      return;
    }

    const res = assignDriverToBus(busId, driverId, routeId, shift);
    if (res && res.error) {
      setAssignmentError(res.error);
      return;
    }
    setEditAssignModalOpen(false);
    setSelectedAssignmentBus(null);
    setAssignmentError('');
  };

  const handleOpenChangeDriver = (bus) => {
    setSelectedAssignmentBus(bus);
    setAssignmentError('');
    setChangeDriverForm({
      busId: bus.id || bus.BusID,
      newDriverId: ''
    });
    setChangeDriverModalOpen(true);
  };

  const handleExecuteChangeDriver = (e) => {
    e.preventDefault();
    setAssignmentError('');
    const { busId, newDriverId } = changeDriverForm;
    if (!busId || !newDriverId) {
      setAssignmentError('Please select a new replacement driver.');
      return;
    }

    const res = changeAssignedDriver(busId, newDriverId);
    if (res && res.error) {
      setAssignmentError(res.error);
      return;
    }
    setChangeDriverModalOpen(false);
    setSelectedAssignmentBus(null);
    setAssignmentError('');
  };

  const handleOpenChangeRoute = (bus) => {
    setSelectedAssignmentBus(bus);
    setAssignmentError('');
    setChangeRouteForm({
      busId: bus.id || bus.BusID,
      newRouteId: ''
    });
    setChangeRouteModalOpen(true);
  };

  const handleExecuteChangeRoute = (e) => {
    e.preventDefault();
    setAssignmentError('');
    const { busId, newRouteId } = changeRouteForm;
    if (!busId || !newRouteId) {
      setAssignmentError('Please select a new transit corridor.');
      return;
    }

    const res = changeAssignedRoute(busId, newRouteId);
    if (res && res.error) {
      setAssignmentError(res.error);
      return;
    }
    setChangeRouteModalOpen(false);
    setSelectedAssignmentBus(null);
    setAssignmentError('');
  };

  const handleOpenUnassignBus = (bus) => {
    setSelectedAssignmentBus(bus);
    setUnassignConfirmModalOpen(true);
  };

  const handleConfirmUnassignBus = () => {
    if (!selectedAssignmentBus) return;
    unassignBus(selectedAssignmentBus.id || selectedAssignmentBus.BusID);
    setUnassignConfirmModalOpen(false);
    setSelectedAssignmentBus(null);
  };

  /**
   * ROUTE & STOPS ACTION HANDLERS
   */
  const handleCreateRoute = (e) => {
    e.preventDefault();
    setRouteFormErrors('');

    const nameClean = routeForm.routeName.trim();
    const startClean = routeForm.startPoint.trim();
    const endClean = routeForm.endPoint.trim();
    const customIdClean = (routeForm.routeId || '').trim();

    if (!nameClean) {
      setRouteFormErrors('Route name is required.');
      return;
    }
    if (!startClean || !endClean) {
      setRouteFormErrors('Start Point and End Point are required.');
      return;
    }

    const genId = customIdClean || `route_${Date.now()}`;

    // Duplicate check
    if (routes.some((r) => (r.routeId || r.RouteID || r.id) === genId)) {
      setRouteFormErrors(`A route with ID "${genId}" already exists.`);
      return;
    }

    const parsedSchedules = routeForm.schedules.split(',').map((s) => s.trim()).filter(Boolean);

    // Create 2 default baseline stops (Start & End)
    const initialStops = [
      { id: `stp_${Date.now()}_1`, StopID: `STP-${Math.floor(100 + Math.random() * 900)}`, name: startClean, sequenceOrder: 1, lat: 24.5714, lng: 73.6974, estimatedTime: '08:00 AM' },
      { id: `stp_${Date.now()}_2`, StopID: `STP-${Math.floor(100 + Math.random() * 900)}`, name: endClean, sequenceOrder: 2, lat: 24.6030, lng: 73.6910, estimatedTime: '08:35 AM' }
    ];

    addRoute({
      id: genId,
      RouteID: genId,
      routeName: nameClean,
      startPoint: startClean,
      endPoint: endClean,
      totalDistance: routeForm.totalDistance || '10 km',
      estimatedDuration: routeForm.estimatedDuration || '25 mins',
      status: routeForm.status || 'Active',
      schedules: parsedSchedules.length > 0 ? parsedSchedules : ['08:00 AM', '01:00 PM', '05:00 PM'],
      stops: initialStops
    });

    setAddRouteModalOpen(false);
    setRouteFormErrors('');
    setRouteForm({
      routeId: '',
      routeName: '',
      startPoint: '',
      endPoint: '',
      totalDistance: '10.5 km',
      estimatedDuration: '28 mins',
      status: 'Active',
      schedules: '07:30 AM, 08:15 AM, 01:30 PM, 05:00 PM'
    });
  };

  const handleUpdateRoute = (e) => {
    e.preventDefault();
    if (!editingRouteId) return;
    setRouteFormErrors('');

    const nameClean = routeForm.routeName.trim();
    const startClean = routeForm.startPoint.trim();
    const endClean = routeForm.endPoint.trim();

    if (!nameClean || !startClean || !endClean) {
      setRouteFormErrors('Route Name, Start Point, and End Point are required.');
      return;
    }

    const parsedSchedules = routeForm.schedules.split(',').map((s) => s.trim()).filter(Boolean);

    updateRoute(editingRouteId, {
      routeName: nameClean,
      startPoint: startClean,
      endPoint: endClean,
      totalDistance: routeForm.totalDistance,
      estimatedDuration: routeForm.estimatedDuration,
      status: routeForm.status,
      schedules: parsedSchedules.length > 0 ? parsedSchedules : ['08:00 AM', '01:00 PM', '05:00 PM']
    });

    setEditRouteModalOpen(false);
    setEditingRouteId(null);
    setRouteFormErrors('');
  };

  const handleQuickRouteStatusChange = (routeId, newStatus) => {
    updateRoute(routeId, { status: newStatus });
  };

  const handleOpenRouteDetail = (route) => {
    setSelectedRouteForDetail(route);
    setRouteDetailsModalOpen(true);
  };

  const handleOpenManageStops = (route) => {
    setSelectedRouteForStops(route);
    setStopFormErrors('');
    setEditingStopId(null);
    setAddStopInlineOpen(false);
    setManageStopsModalOpen(true);
  };

  const handleOpenDeleteRoute = (route) => {
    setRouteToDelete(route);
    setDeleteRouteModalOpen(true);
  };

  const handleConfirmDeleteRoute = () => {
    if (!routeToDelete) return;
    deleteRoute(routeToDelete.id || routeToDelete.RouteID);
    setDeleteRouteModalOpen(false);
    if (selectedRouteForDetail?.id === routeToDelete.id) setRouteDetailsModalOpen(false);
    if (selectedRouteForStops?.id === routeToDelete.id) setManageStopsModalOpen(false);
    setRouteToDelete(null);
  };

  const handleAddStopSubmit = (e) => {
    e.preventDefault();
    if (!selectedRouteForStops) return;
    setStopFormErrors('');

    const stopNameClean = stopForm.name.trim();
    if (!stopNameClean) {
      setStopFormErrors('Stop Name is required.');
      return;
    }

    const latNum = parseFloat(stopForm.lat);
    const lngNum = parseFloat(stopForm.lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setStopFormErrors('Valid GPS Latitude & Longitude are required.');
      return;
    }

    const targetRouteId = selectedRouteForStops.id || selectedRouteForStops.RouteID;
    const newStopPayload = {
      StopID: stopForm.stopId || `STP-${Math.floor(100 + Math.random() * 900)}`,
      name: stopNameClean,
      sequence: parseInt(stopForm.sequence) || ((selectedRouteForStops.stops?.length || 0) + 1),
      lat: latNum,
      lng: lngNum,
      estimatedTime: stopForm.estimatedTime || '08:30 AM'
    };

    addStopToRoute(targetRouteId, newStopPayload);

    // Refresh modal reference
    setTimeout(() => {
      const refreshed = routes.find((r) => r.id === targetRouteId || r.RouteID === targetRouteId);
      if (refreshed) setSelectedRouteForStops(refreshed);
    }, 50);

    setAddStopInlineOpen(false);
    setStopForm({
      stopId: '',
      name: '',
      sequence: (selectedRouteForStops.stops?.length || 0) + 2,
      lat: 24.5850,
      lng: 73.6900,
      estimatedTime: '08:30 AM'
    });
  };

  const handleUpdateStopSubmit = (e) => {
    e.preventDefault();
    if (!selectedRouteForStops || !editingStopId) return;
    setStopFormErrors('');

    const stopNameClean = stopForm.name.trim();
    if (!stopNameClean) {
      setStopFormErrors('Stop Name is required.');
      return;
    }

    const targetRouteId = selectedRouteForStops.id || selectedRouteForStops.RouteID;
    updateStopInRoute(targetRouteId, editingStopId, {
      name: stopNameClean,
      lat: parseFloat(stopForm.lat) || 24.5850,
      lng: parseFloat(stopForm.lng) || 73.6900,
      estimatedTime: stopForm.estimatedTime
    });

    setTimeout(() => {
      const refreshed = routes.find((r) => r.id === targetRouteId || r.RouteID === targetRouteId);
      if (refreshed) setSelectedRouteForStops(refreshed);
    }, 50);

    setEditingStopId(null);
  };

  const handleDeleteStopAction = (stopId) => {
    if (!selectedRouteForStops) return;
    const targetRouteId = selectedRouteForStops.id || selectedRouteForStops.RouteID;
    deleteStopFromRoute(targetRouteId, stopId);

    setTimeout(() => {
      const refreshed = routes.find((r) => r.id === targetRouteId || r.RouteID === targetRouteId);
      if (refreshed) setSelectedRouteForStops(refreshed);
    }, 50);
  };

  const handleMoveStopAction = (stopId, direction) => {
    if (!selectedRouteForStops) return;
    const targetRouteId = selectedRouteForStops.id || selectedRouteForStops.RouteID;
    moveStopOrder(targetRouteId, stopId, direction);

    setTimeout(() => {
      const refreshed = routes.find((r) => r.id === targetRouteId || r.RouteID === targetRouteId);
      if (refreshed) setSelectedRouteForStops(refreshed);
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 pb-24 md:pb-8">
      
      {/* SECTION 17: ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 shrink-0 space-y-1">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Control Station</span>
          <h3 className="font-black text-slate-900 text-sm mt-0.5">Fleet Ops Manager</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">● Control Center Online</p>
        </div>

        <nav className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs space-y-1 text-xs font-semibold">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'live', label: 'Live Monitoring', icon: ShieldCheck, badge: metrics.activeBuses },
            { id: 'buses', label: 'Buses', icon: Bus, badge: metrics.totalBuses },
            { id: 'drivers', label: 'Drivers', icon: Users, badge: metrics.totalDrivers },
            { id: 'routes', label: 'Routes', icon: RouteIcon, badge: metrics.totalRoutes },
            { id: 'assignments', label: 'Assignments', icon: UserCheck },
            { id: 'trips', label: 'Trips', icon: Clock, badge: metrics.activeTrips },
            { id: 'complaints', label: 'Complaints Desk', icon: AlertTriangle, badge: complaints.filter((c) => c.status !== 'Resolved').length },
            { id: 'notices', label: 'Alerts & Notices', icon: Bell, badge: notices.length },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench, badge: metrics.maintenanceBuses },
            { id: 'schema', label: 'Database Tables', icon: FileText, badge: '5 Core' },
            { id: 'reports', label: 'Reports & Analytics', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out (Logout)</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 space-y-6 overflow-hidden">
        
        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Transport Control Center</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Operations Dashboard</h2>
                <p className="text-xs text-slate-500 mt-1">Real-time status overview of vehicles, drivers, routes, passenger loads, and telemetry</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Driver</span>
                </button>
                <button
                  onClick={() => setBroadcastModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5"
                >
                  <Bell className="w-4 h-4" />
                  <span>Broadcast</span>
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Total Buses</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalBuses}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Active Buses</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.activeBuses}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Buses At Depot</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.busesAtDepot}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Maintenance</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">{metrics.maintenanceBuses}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Total Drivers</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalDrivers}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Available Drivers</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.availableDrivers}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Active Trips</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.activeTrips}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 text-xs font-semibold block">Passengers Today</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.totalPassengersToday}</span>
              </div>
            </div>

            {/* Live Transport Overview Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-black text-base text-slate-900">Live Transport & Bus Timings Overview</h3>
                  <p className="text-xs text-slate-500">Real-time schedule monitoring, departures, expected arrivals, and vehicle telematics</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Bus Number</th>
                      <th className="p-3">Route</th>
                      <th className="p-3">Departure Time</th>
                      <th className="p-3">Expected Arrival</th>
                      <th className="p-3">Current Stop</th>
                      <th className="p-3">Next Stop</th>
                      <th className="p-3">Speed</th>
                      <th className="p-3">Occupancy</th>
                      <th className="p-3">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBuses.map((b) => (
                      <tr key={b.id || b.BusID} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-black text-slate-900">{b.busNumber}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{b.registrationNumber || 'RJ-27'}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800 truncate max-w-[170px]" title={b.routeName}>{b.routeName}</div>
                          <span className="text-[10px] text-slate-400">Driver: {b.driverName}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                            ⏱️ {b.departureTime || b.scheduledDeparture || '08:15 AM'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-amber-700 font-mono text-[11px]">
                            {b.expectedArrival || '08:45 AM'}
                          </div>
                          {b.delayMinutes > 0 && (
                            <span className="text-[10px] text-rose-600 font-bold">+{b.delayMinutes}m delay</span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-700 truncate max-w-[120px]" title={b.currentStop}>{b.currentStop || 'Depot'}</td>
                        <td className="p-3 font-bold text-blue-600 truncate max-w-[120px]" title={b.nextStop}>{b.nextStop || 'Terminal'}</td>
                        <td className="p-3 font-black text-slate-900">{b.speed || 0} km/h</td>
                        <td className="p-3 font-bold text-slate-800">{b.currentOccupancy || 0} / {b.capacity || 52}</td>
                        <td className="p-3">
                          <StatusBadge status={b.timingStatus || b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LIVE MONITORING */}
        {activeTab === 'live' && (() => {
          const activeBusesList = allBuses.filter((b) => b.isLive || b.status === 'In Transit' || b.timingStatus === 'In Transit' || b.status === 'Delayed');
          const avgSpeed = activeBusesList.length > 0
            ? Math.round(activeBusesList.reduce((acc, b) => acc + (b.speed || 0), 0) / activeBusesList.length)
            : 0;
          const totalPassengers = allBuses.reduce((acc, b) => acc + (b.currentOccupancy || 0), 0);
          const depotCount = allBuses.filter((b) => b.status === 'At Depot' || b.timingStatus === 'Completed').length;
          const activeFocusedBus = selectedBus || activeBusesList[0] || allBuses[0];

          return (
            <div className="space-y-6">
              {/* Header Hero Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Live Fleet Telemetry Center</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Live Transport Monitoring</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real-time Leaflet GPS tracking, stop progression, dynamic speed, and instantaneous telemetry from the shared tracking engine
                  </p>
                </div>

                {/* Live Telemetry KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">In Transit</span>
                    <strong className="text-base font-black text-emerald-900">{activeBusesList.length} Buses</strong>
                  </div>
                  <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Avg Fleet Speed</span>
                    <strong className="text-base font-black text-blue-900">{avgSpeed} km/h</strong>
                  </div>
                  <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">Total Onboard</span>
                    <strong className="text-base font-black text-purple-900">{totalPassengers} Pax</strong>
                  </div>
                  <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">At Depot</span>
                    <strong className="text-base font-black text-slate-800">{depotCount} Ready</strong>
                  </div>
                </div>
              </div>

              {/* Interactive Leaflet Map Section */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                {/* Fleet Quick Switcher Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Fleet GPS Radar</span>
                    <span className="text-[10px] text-slate-400 font-medium">({allBuses.length} Fleet Markers)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {allBuses.map((b) => {
                      const isSelected = selectedBus && (selectedBus.id === b.id || selectedBus.busNumber === b.busNumber);
                      const isLive = b.isLive || b.status === 'In Transit' || b.timingStatus === 'In Transit';
                      return (
                        <button
                          key={b.id || b.BusID}
                          onClick={() => setSelectedBus(b)}
                          className={`px-3 py-1 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : isLive
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>{b.busNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Leaflet Map Frame */}
                <div className="h-[460px] rounded-2xl overflow-hidden border border-slate-200">
                  <InteractiveMap
                    buses={allBuses}
                    routes={routes}
                    selectedBus={selectedBus}
                    onSelectBus={setSelectedBus}
                  />
                </div>

                {/* Focused Bus Telemetry Strip */}
                {activeFocusedBus && (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm shrink-0">
                        {activeFocusedBus.busNumber?.replace('BUS-', '') || '101'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm font-black">{activeFocusedBus.busNumber}</strong>
                          <span className="text-[10px] text-slate-300 font-mono">({activeFocusedBus.registrationNumber || 'RJ-27'})</span>
                          <StatusBadge status={activeFocusedBus.timingStatus || activeFocusedBus.status} />
                        </div>
                        <span className="text-[11px] text-slate-300 block truncate max-w-md">
                          Route: <strong className="text-white">{activeFocusedBus.routeName}</strong> • Driver: <strong className="text-white">{activeFocusedBus.driverName}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
                      <div className="border-l border-slate-700 pl-3">
                        <span className="text-[10px] text-slate-400 uppercase block">Current Stop</span>
                        <strong className="text-white font-bold">{activeFocusedBus.currentStop || 'Depot'}</strong>
                      </div>
                      <div className="border-l border-slate-700 pl-3">
                        <span className="text-[10px] text-slate-400 uppercase block">Next Stop</span>
                        <strong className="text-blue-400 font-bold">{activeFocusedBus.nextStop || 'Terminal'}</strong>
                      </div>
                      <div className="border-l border-slate-700 pl-3">
                        <span className="text-[10px] text-slate-400 uppercase block">Distance to Stop</span>
                        <strong className="text-amber-300 font-mono font-bold">{activeFocusedBus.distanceToNextText || activeFocusedBus.distanceText || '0.85 km'}</strong>
                      </div>
                      <div className="border-l border-slate-700 pl-3">
                        <span className="text-[10px] text-slate-400 uppercase block">Live Speed</span>
                        <strong className="text-emerald-400 font-bold">{activeFocusedBus.isLive ? activeFocusedBus.speed : 0} km/h</strong>
                      </div>
                      <div className="border-l border-slate-700 pl-3">
                        <span className="text-[10px] text-slate-400 uppercase block">Dynamic ETA</span>
                        <div className="flex items-baseline gap-1">
                          <strong className="text-amber-400 font-bold">{activeFocusedBus.isLive ? (activeFocusedBus.etaText || `~${activeFocusedBus.etaMinutes || 4}m`) : '--'}</strong>
                          {activeFocusedBus.isLive && activeFocusedBus.etaClockTime && (
                            <span className="text-[10px] text-slate-300 font-mono">({activeFocusedBus.etaClockTime})</span>
                          )}
                        </div>
                      </div>
                      <div className="border-l border-slate-700 pl-3 font-mono text-[10px]">
                        <span className="text-[9px] text-slate-400 uppercase block">GPS Location</span>
                        <span className="text-slate-300">
                          {activeFocusedBus.currentLat?.toFixed(4)}, {activeFocusedBus.currentLng?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE MONITORING TABLE */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                {/* Table Title and Controls */}
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Live Fleet Monitoring Table</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Direct streaming telematics across all 10 operational parameters from shared tracking state
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    {/* Status Filter Buttons */}
                    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      {[
                        { id: 'All', label: 'All Fleet' },
                        { id: 'In Transit', label: 'In Transit' },
                        { id: 'Delayed', label: 'Delayed' },
                        { id: 'At Depot', label: 'At Depot' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setLiveStatusFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            liveStatusFilter === tab.id
                              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-56">
                      <input
                        type="text"
                        placeholder="Search bus, driver, stop..."
                        value={liveSearchQuery}
                        onChange={(e) => setLiveSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* 10-Column Live Monitoring Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="p-3.5">1. Bus</th>
                        <th className="p-3.5">2. Driver</th>
                        <th className="p-3.5">3. Route</th>
                        <th className="p-3.5">4. Current Location</th>
                        <th className="p-3.5">5. Current Stop</th>
                        <th className="p-3.5">6. Next Stop</th>
                        <th className="p-3.5">7. Speed</th>
                        <th className="p-3.5">8. Passengers</th>
                        <th className="p-3.5">9. ETA</th>
                        <th className="p-3.5">10. Status</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                      {filteredLiveBuses.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="p-8 text-center text-slate-400">
                            No buses found matching active filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredLiveBuses.map((b) => {
                          const isSelected = selectedBus && (selectedBus.id === b.id || selectedBus.busNumber === b.busNumber);
                          const totalCap = b.capacity || 52;
                          const passengers = b.currentOccupancy || 0;
                          const freeSeats = Math.max(0, totalCap - passengers);
                          const isLive = Boolean(b.isLive || b.status === 'In Transit' || b.timingStatus === 'In Transit');
                          const lat = parseFloat(b.currentLat || b.Latitude || 24.5714);
                          const lng = parseFloat(b.currentLng || b.Longitude || 73.6974);

                          return (
                            <tr
                              key={b.id || b.BusID}
                              onClick={() => setSelectedBus(b)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50/70 ring-1 ring-blue-500/30' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              {/* 1. Bus */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                  <div>
                                    <strong className="font-black text-slate-900 block">{b.busNumber}</strong>
                                    <span className="text-[10px] text-slate-400 font-mono block">{b.registrationNumber || 'RJ-27'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Driver */}
                              <td className="p-3.5">
                                <strong className="text-slate-900 block">{b.driverName || 'Assigned Driver'}</strong>
                                <span className="text-[10px] text-slate-400 block font-mono">{b.driverId || 'DRV-01'}</span>
                              </td>

                              {/* 3. Route */}
                              <td className="p-3.5 max-w-[160px]">
                                <strong className="text-slate-800 block truncate" title={b.routeName}>
                                  {b.routeName}
                                </strong>
                                <span className="text-[10px] text-blue-600 font-semibold block">Active Corridor</span>
                              </td>

                              {/* 4. Current Location (GPS) */}
                              <td className="p-3.5 font-mono text-[11px]">
                                <div className="flex items-center gap-1.5 text-slate-700">
                                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isLive ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                                  <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                                </div>
                              </td>

                              {/* 5. Current Stop */}
                              <td className="p-3.5 max-w-[130px]">
                                <span className="text-slate-800 font-bold block truncate" title={b.currentStop}>
                                  {b.currentStop || 'Depot Yard'}
                                </span>
                              </td>

                              {/* 6. Next Stop & Distance */}
                              <td className="p-3.5 max-w-[140px]">
                                <span className="text-blue-700 font-bold block truncate" title={b.nextStop}>
                                  {b.nextStop || 'Terminal'}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500 block">
                                  Dist: {b.distanceToNextText || b.distanceText || '0.85 km'}
                                </span>
                              </td>

                              {/* 7. Speed */}
                              <td className="p-3.5">
                                <span className={`font-black text-xs ${isLive ? 'text-slate-900' : 'text-slate-400'}`}>
                                  {isLive ? b.speed : 0} km/h
                                </span>
                              </td>

                              {/* 8. Passengers & Available Seats */}
                              <td className="p-3.5">
                                <div className="space-y-0.5">
                                  <strong className="text-slate-900 block">
                                    {passengers} / {totalCap}
                                  </strong>
                                  <span className="text-[10px] font-bold text-emerald-700 block">
                                    {freeSeats} Seats Free
                                  </span>
                                </div>
                              </td>

                              {/* 9. Dynamic ETA */}
                              <td className="p-3.5">
                                <span className={`font-bold block ${isLive ? 'text-amber-700' : 'text-slate-400'}`}>
                                  {isLive ? (b.etaText || `~${b.etaMinutes || 4} mins`) : '--'}
                                </span>
                                {isLive && b.etaClockTime && (
                                  <span className="text-[10px] font-mono text-slate-400 block">
                                    ({b.etaClockTime})
                                  </span>
                                )}
                              </td>

                              {/* 10. Status */}
                              <td className="p-3.5">
                                <StatusBadge status={b.timingStatus || b.status} />
                              </td>

                              {/* Action */}
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBus(b);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {isSelected ? 'Tracking' : 'Focus Map'}
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
            </div>
          );
        })()}

        {/* TAB: BUSES */}
        {activeTab === 'buses' && (
          <div className="space-y-6">
            {/* Header with Title & Add Bus Button */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Fleet Inventory & Asset Management</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Transit Buses</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control vehicle registrations, capacity, assigned drivers, routes, and live operational status</p>
              </div>
              <button
                onClick={() => {
                  setFormErrors('');
                  setBusForm({
                    busNumber: '',
                    registrationNumber: '',
                    model: 'Tata Starbus Ultra 52S',
                    capacity: 52,
                    fuelType: 'Diesel',
                    routeId: '',
                    driverId: '',
                    status: 'At Depot'
                  });
                  setAddBusModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Bus</span>
              </button>
            </div>

            {/* Fleet Metrics HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalBuses}</span>
                <span className="text-[10px] text-slate-500 font-medium">Buses registered</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">In Transit</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.activeBuses}</span>
                <span className="text-[10px] text-emerald-600 font-medium">● Live on route</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">At Depot</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.busesAtDepot}</span>
                <span className="text-[10px] text-blue-600 font-medium">Ready at yard</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Delayed</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{metrics.delayedBuses}</span>
                <span className="text-[10px] text-amber-600 font-medium">Schedule delay</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Maintenance</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">{metrics.maintenanceBuses}</span>
                <span className="text-[10px] text-rose-600 font-medium">In repair bay</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Seats</span>
                <span className="text-2xl font-black text-purple-700 mt-1 block">{metrics.totalCapacity}</span>
                <span className="text-[10px] text-purple-600 font-medium">Fleet capacity</span>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {[
                  { id: 'All', label: 'All Fleet', count: allBuses.length },
                  { id: 'In Transit', label: 'In Transit', count: metrics.activeBuses },
                  { id: 'At Depot', label: 'At Depot', count: metrics.busesAtDepot },
                  { id: 'Delayed', label: 'Delayed', count: metrics.delayedBuses },
                  { id: 'Maintenance', label: 'Maintenance', count: metrics.maintenanceBuses },
                  { id: 'Inactive', label: 'Inactive', count: metrics.inactiveBuses },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      statusFilter === tab.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Bus, Plate, Driver, Route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Buses Fleet Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-3.5">Bus & ID</th>
                    <th className="p-3.5">Registration & Model</th>
                    <th className="p-3.5">Capacity & Fuel</th>
                    <th className="p-3.5">Assigned Driver</th>
                    <th className="p-3.5">Assigned Route</th>
                    <th className="p-3.5">Status (Quick Switch)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredBuses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Bus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700">No buses matching filter</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search query or status filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBuses.map((bus) => {
                      const capacity = bus.capacity || bus.Capacity || 50;
                      const occupancy = bus.currentOccupancy || 0;
                      const occPercent = Math.round((occupancy / capacity) * 100);

                      return (
                        <tr key={bus.id || bus.BusID} className="hover:bg-slate-50/80 transition-colors">
                          {/* Bus ID & Number */}
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                <Bus className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-black text-slate-900 text-sm block">{bus.busNumber || bus.BusNo}</span>
                                <span className="font-mono text-[10px] text-slate-400 block">{bus.id || bus.BusID}</span>
                              </div>
                            </div>
                          </td>

                          {/* Registration Plate & Model */}
                          <td className="p-3.5">
                            <span className="font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block text-[11px]">
                              {bus.registrationNumber || 'RJ-27-PA-0000'}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">{bus.model || 'Standard Bus'}</span>
                          </td>

                          {/* Capacity & Fuel */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="font-bold text-slate-800">{occupancy} / {capacity} seats</span>
                                <span className="text-[10px] text-slate-400">({occPercent}%)</span>
                              </div>
                              <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${occPercent > 90 ? 'bg-rose-500' : occPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, occPercent)}%` }}
                                />
                              </div>
                              <span className="inline-block px-1.5 py-0.2 bg-slate-50 text-slate-600 text-[10px] font-bold rounded border border-slate-200">
                                ⛽ {bus.fuelType || 'Diesel'}
                              </span>
                            </div>
                          </td>

                          {/* Driver */}
                          <td className="p-3.5">
                            {bus.driverName && bus.driverName !== 'Unassigned' ? (
                              <div>
                                <strong className="text-slate-900 block">{bus.driverName}</strong>
                                <span className="text-[10px] text-emerald-600 font-bold">● Assigned</span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Route */}
                          <td className="p-3.5">
                            {bus.routeName && bus.routeName !== 'Unassigned' && bus.routeName !== 'None' ? (
                              <div className="max-w-xs">
                                <span className="font-bold text-slate-800 block truncate" title={bus.routeName}>{bus.routeName}</span>
                                {bus.currentStop && <span className="text-[10px] text-slate-400 block truncate">At: {bus.currentStop}</span>}
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                No Route
                              </span>
                            )}
                          </td>

                          {/* Status with Quick Inline Changer */}
                          <td className="p-3.5">
                            <select
                              value={bus.status}
                              onChange={(e) => handleQuickStatusChange(bus.id || bus.BusID, e.target.value)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition-all ${
                                bus.status === 'In Transit' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                bus.status === 'At Depot' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                bus.status === 'Delayed' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                bus.status === 'Maintenance' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                                'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <option value="At Depot">At Depot</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Delayed">Delayed</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => handleOpenBusDetail(bus)}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors"
                                title="View Bus Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Bus */}
                              <button
                                onClick={() => {
                                  setEditingBusId(bus.id || bus.BusID);
                                  setFormErrors('');
                                  setBusForm({
                                    busNumber: bus.busNumber || bus.BusNo || '',
                                    registrationNumber: bus.registrationNumber || '',
                                    model: bus.model || 'Tata Starbus Ultra 52S',
                                    capacity: bus.capacity || bus.Capacity || 52,
                                    fuelType: bus.fuelType || 'Diesel',
                                    routeId: bus.routeId || bus.RouteID || '',
                                    driverId: bus.driverId || bus.DriverID || '',
                                    status: bus.status || 'At Depot'
                                  });
                                  setEditBusModalOpen(true);
                                }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                title="Edit Bus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Bus with Confirmation Dialog */}
                              <button
                                onClick={() => handleOpenDeleteBus(bus)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                title="Delete Bus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DRIVERS */}
        {activeTab === 'drivers' && (
          <div className="space-y-6">
            {/* Header with Title & Action Buttons */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Fleet Crew & Personnel Management</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Fleet Drivers</h2>
                <p className="text-xs text-slate-500 mt-0.5">Commercial driving licenses, shift scheduling, assigned vehicle allocations, and real-time operational status</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAssignmentError('');
                    setAssignForm({ busId: '', driverId: '', routeId: '', shift: 'Morning' });
                    setAssignModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Assign Bus & Route</span>
                </button>
                <button
                  onClick={() => {
                    setDriverFormErrors('');
                    setDriverForm({
                      driverId: '',
                      name: '',
                      phone: '',
                      email: '',
                      shift: 'Morning',
                      licenseNumber: '',
                      status: 'Available',
                      assignedBusId: '',
                      assignedRouteId: ''
                    });
                    setAddDriverModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Driver</span>
                </button>
              </div>
            </div>

            {/* Driver Metrics HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Drivers</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalDrivers}</span>
                <span className="text-[10px] text-slate-500 font-medium">Registered staff</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Available</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.availableDrivers}</span>
                <span className="text-[10px] text-blue-600 font-medium">Ready for dispatch</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">On Trip</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.activeDrivers}</span>
                <span className="text-[10px] text-emerald-600 font-medium">● Active driving</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Off Duty</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{metrics.offDutyDrivers}</span>
                <span className="text-[10px] text-amber-600 font-medium">Shift completed</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">On Leave</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">{metrics.onLeaveDrivers}</span>
                <span className="text-[10px] text-rose-600 font-medium">Approved leave</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Trips Today</span>
                <span className="text-2xl font-black text-purple-700 mt-1 block">{metrics.totalDriverTrips}</span>
                <span className="text-[10px] text-purple-600 font-medium">Runs completed</span>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {[
                  { id: 'All', label: 'All Drivers', count: drivers.length },
                  { id: 'Available', label: 'Available', count: metrics.availableDrivers },
                  { id: 'On Trip', label: 'On Trip', count: metrics.activeDrivers },
                  { id: 'Off Duty', label: 'Off Duty', count: metrics.offDutyDrivers },
                  { id: 'On Leave', label: 'On Leave', count: metrics.onLeaveDrivers },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDriverStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      driverStatusFilter === tab.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      driverStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Name, Driver ID, Phone, Bus..."
                  value={driverSearchQuery}
                  onChange={(e) => setDriverSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Drivers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-3.5">Driver & ID</th>
                    <th className="p-3.5">Contact & License</th>
                    <th className="p-3.5">Shift & Rating</th>
                    <th className="p-3.5">Assigned Bus</th>
                    <th className="p-3.5">Assigned Route</th>
                    <th className="p-3.5">Status (Quick Switch)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700">No drivers matching filter</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search query or status filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((drv) => {
                      const isAssigned = drv.assignedBusId && drv.assignedBusNumber !== 'Unassigned';

                      return (
                        <tr key={drv.id || drv.DriverID} className="hover:bg-slate-50/80 transition-colors">
                          {/* Driver & ID */}
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-200">
                                👨‍✈️
                              </div>
                              <div>
                                <span className="font-black text-slate-900 text-sm block">{drv.name || drv.Name}</span>
                                <span className="font-mono text-[10px] text-blue-600 font-bold block">{drv.driverId || drv.DriverID || drv.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Contact & License */}
                          <td className="p-3.5">
                            <span className="font-bold font-mono text-slate-800 block text-[11px]">{drv.phone || drv.Contact}</span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 inline-block mt-0.5">
                              {drv.licenseNumber || 'RJ-27-2024-XXXX'}
                            </span>
                          </td>

                          {/* Shift & Rating */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 block">{drv.shift || 'Morning'}</span>
                              <span className="text-[10px] text-amber-600 font-bold block">{drv.rating || '4.9 ⭐'} • {drv.tripsToday || 0} trips</span>
                            </div>
                          </td>

                          {/* Assigned Bus */}
                          <td className="p-3.5">
                            {isAssigned ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 text-xs">
                                  🚌 {drv.assignedBusNumber}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Assigned Route */}
                          <td className="p-3.5">
                            {drv.assignedRouteName && drv.assignedRouteName !== 'None' && drv.assignedRouteName !== 'Unassigned' ? (
                              <span className="font-bold text-slate-800 block truncate max-w-xs" title={drv.assignedRouteName}>
                                {drv.assignedRouteName}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                None
                              </span>
                            )}
                          </td>

                          {/* Status with Quick Inline Changer */}
                          <td className="p-3.5">
                            <select
                              value={drv.status}
                              onChange={(e) => handleQuickDriverStatusChange(drv.id || drv.DriverID, e.target.value)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition-all ${
                                drv.status === 'On Trip' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                drv.status === 'Available' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                drv.status === 'Off Duty' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                'bg-rose-50 text-rose-700 border-rose-300'
                              }`}
                            >
                              <option value="Available">Available</option>
                              <option value="On Trip">On Trip</option>
                              <option value="Off Duty">Off Duty</option>
                              <option value="On Leave">On Leave</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => handleOpenDriverDetail(drv)}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors"
                                title="View Driver Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Driver */}
                              <button
                                onClick={() => {
                                  setEditingDriverId(drv.id || drv.DriverID);
                                  setDriverFormErrors('');
                                  setDriverForm({
                                    driverId: drv.driverId || drv.DriverID || drv.id,
                                    name: drv.name || drv.Name || '',
                                    phone: drv.phone || drv.Contact || '',
                                    email: drv.email || '',
                                    shift: drv.shift || 'Morning',
                                    licenseNumber: drv.licenseNumber || '',
                                    status: drv.status || 'Available',
                                    assignedBusId: drv.assignedBusId || '',
                                    assignedRouteId: drv.assignedRouteId || ''
                                  });
                                  setEditDriverModalOpen(true);
                                }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                title="Edit Driver"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Assign Bus & Route Quick Button */}
                              <button
                                onClick={() => {
                                  setAssignmentError('');
                                  setAssignForm({
                                    driverId: drv.id || drv.DriverID,
                                    busId: drv.assignedBusId || '',
                                    routeId: drv.assignedRouteId || '',
                                    shift: drv.shift || 'Morning'
                                  });
                                  setAssignModalOpen(true);
                                }}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                                title="Assign Bus & Route"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Driver */}
                              <button
                                onClick={() => handleOpenDeleteDriver(drv)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                title="Delete Driver"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* TAB: ROUTES */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            {/* Header with Title & Action Buttons */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Network Corridors & Stops Architecture</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Transit Routes</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure transit corridors, sequential stop timings, GPS coordinates, distance telemetry, and active vehicle allocations</p>
              </div>
              <button
                onClick={() => {
                  setRouteFormErrors('');
                  setRouteForm({
                    routeId: '',
                    routeName: '',
                    startPoint: '',
                    endPoint: '',
                    totalDistance: '10.5 km',
                    estimatedDuration: '28 mins',
                    status: 'Active',
                    schedules: '07:30 AM, 08:15 AM, 01:30 PM, 05:00 PM'
                  });
                  setAddRouteModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Route</span>
              </button>
            </div>

            {/* Route Metrics HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Routes</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalRoutes}</span>
                <span className="text-[10px] text-slate-500 font-medium">Network corridors</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Total Stops</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.totalFleetStops}</span>
                <span className="text-[10px] text-blue-600 font-medium">GPS transit points</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Routes</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.activeRoutes}</span>
                <span className="text-[10px] text-emerald-600 font-medium">● Operating live</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Inactive</span>
                <span className="text-2xl font-black text-slate-700 mt-1 block">{metrics.inactiveRoutes}</span>
                <span className="text-[10px] text-slate-500 font-medium">Suspended</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Network Span</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{metrics.totalCoverageKm} <span className="text-xs">km</span></span>
                <span className="text-[10px] text-amber-600 font-medium">Total route track</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Assigned Buses</span>
                <span className="text-2xl font-black text-purple-700 mt-1 block">{allBuses.filter((b) => b.routeId).length}</span>
                <span className="text-[10px] text-purple-600 font-medium">Active fleet units</span>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {[
                  { id: 'All', label: 'All Routes', count: routes.length },
                  { id: 'Active', label: 'Active Routes', count: metrics.activeRoutes },
                  { id: 'Inactive', label: 'Inactive', count: metrics.inactiveRoutes },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRouteStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      routeStatusFilter === tab.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      routeStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Route, ID, Start, End, Stops..."
                  value={routeSearchQuery}
                  onChange={(e) => setRouteSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Routes Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-3.5">Route & ID</th>
                    <th className="p-3.5">Start ➔ End Point</th>
                    <th className="p-3.5">Distance & Duration</th>
                    <th className="p-3.5">Stops Architecture</th>
                    <th className="p-3.5">Assigned Buses</th>
                    <th className="p-3.5">Status (Quick Switch)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <RouteIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700">No routes matching filter</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search query or status filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => {
                      const rId = route.id || route.RouteID;
                      const stopsList = route.stops || route.Stops || [];
                      const assignedBuses = allBuses.filter((b) => b.routeId === rId || b.RouteID === rId);

                      return (
                        <tr key={rId} className="hover:bg-slate-50/80 transition-colors">
                          {/* Route & ID */}
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                                🛣️
                              </div>
                              <div>
                                <span className="font-black text-slate-900 text-sm block">{route.routeName || route.RouteName}</span>
                                <span className="font-mono text-[10px] text-blue-600 font-bold block">{rId}</span>
                              </div>
                            </div>
                          </td>

                          {/* Start ➔ End Point */}
                          <td className="p-3.5">
                            <div className="space-y-0.5 max-w-xs">
                              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                <span className="text-emerald-600">🟢</span>
                                <span className="truncate">{route.startPoint || route.StartPoint}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                <span className="text-rose-600">🔴</span>
                                <span className="truncate">{route.endPoint || route.EndPoint || route.destination}</span>
                              </div>
                            </div>
                          </td>

                          {/* Distance & Duration */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 block">📏 {route.distance || route.totalDistance || '10 km'}</span>
                              <span className="text-[10px] text-slate-500 font-medium block">⏱️ {route.estimatedDuration || '25 mins'}</span>
                            </div>
                          </td>

                          {/* Stops Architecture */}
                          <td className="p-3.5">
                            <button
                              onClick={() => handleOpenManageStops(route)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors group"
                              title="Click to manage and reorder stops"
                            >
                              <span>🚏 {stopsList.length} Stops</span>
                              <span className="text-[10px] text-emerald-600 group-hover:translate-x-0.5 transition-transform">⚙️</span>
                            </button>
                          </td>

                          {/* Assigned Buses */}
                          <td className="p-3.5">
                            {assignedBuses.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedBuses.map((b) => (
                                  <span key={b.id || b.BusID} className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded border border-blue-200">
                                    🚌 {b.busNumber || b.BusNo}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                None
                              </span>
                            )}
                          </td>

                          {/* Status with Quick Inline Changer */}
                          <td className="p-3.5">
                            <select
                              value={route.status || 'Active'}
                              onChange={(e) => handleQuickRouteStatusChange(rId, e.target.value)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition-all ${
                                route.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* View Details & Map */}
                              <button
                                onClick={() => handleOpenRouteDetail(route)}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors"
                                title="View Route on Leaflet Map"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Manage Stops Button */}
                              <button
                                onClick={() => handleOpenManageStops(route)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                                title="Manage & Reorder Stops"
                              >
                                <RouteIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Route */}
                              <button
                                onClick={() => {
                                  setEditingRouteId(rId);
                                  setRouteFormErrors('');
                                  setRouteForm({
                                    routeId: rId,
                                    routeName: route.routeName || route.RouteName || '',
                                    startPoint: route.startPoint || route.StartPoint || '',
                                    endPoint: route.endPoint || route.EndPoint || route.destination || '',
                                    totalDistance: route.distance || route.totalDistance || '10 km',
                                    estimatedDuration: route.estimatedDuration || '25 mins',
                                    status: route.status || 'Active',
                                    schedules: Array.isArray(route.schedules) ? route.schedules.join(', ') : '08:00 AM, 01:00 PM, 05:00 PM'
                                  });
                                  setEditRouteModalOpen(true);
                                }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                title="Edit Route"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Route */}
                              <button
                                onClick={() => handleOpenDeleteRoute(route)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                title="Delete Route"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CENTRAL ASSIGNMENTS MATRIX (BUS + DRIVER + ROUTE) */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Header with Title & Primary Action */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Fleet Dispatch Control & Shift Roster</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bus + Driver + Route Assignments</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the core operational relationship: <strong className="text-slate-700">BUS ➔ DRIVER ➔ ROUTE</strong> with shift scheduling and live double-booking safeguards.
                </p>
              </div>
              <button
                onClick={() => {
                  setAssignmentError('');
                  setAssignForm({ busId: '', driverId: '', routeId: '', shift: 'Morning' });
                  setAssignModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Assignment</span>
              </button>
            </div>

            {/* Assignment Metrics HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{assignmentMetrics.totalBuses}</span>
                <span className="text-[10px] text-slate-500 font-medium">Catalogued assets</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Assigned Triads</span>
                <span className="text-2xl font-black text-indigo-600 mt-1 block">{assignmentMetrics.totalAssignedCount}</span>
                <span className="text-[10px] text-indigo-600 font-medium">Bus+Driver+Route</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Live Dispatches</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{assignmentMetrics.activeDispatches}</span>
                <span className="text-[10px] text-emerald-600 font-medium">● In transit now</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Ready Drivers</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{assignmentMetrics.availableDrivers}</span>
                <span className="text-[10px] text-blue-600 font-medium">Available for dispatch</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Idle at Depot</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{assignmentMetrics.unassignedBusesAtDepot}</span>
                <span className="text-[10px] text-amber-600 font-medium">Awaiting assignment</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Allocation Rate</span>
                <span className="text-2xl font-black text-purple-700 mt-1 block">{assignmentMetrics.coverageRate}%</span>
                <span className="text-[10px] text-purple-600 font-medium">Fleet utilized</span>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {[
                  { id: 'All', label: 'All Fleet', count: allBuses.length },
                  { id: 'Assigned', label: 'Assigned', count: assignmentMetrics.totalAssignedCount },
                  { id: 'Unassigned', label: 'Unassigned', count: allBuses.length - assignmentMetrics.totalAssignedCount },
                  { id: 'In Transit', label: 'In Transit', count: assignmentMetrics.activeDispatches },
                  { id: 'At Depot', label: 'At Depot', count: assignmentMetrics.unassignedBusesAtDepot },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAssignmentStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      assignmentStatusFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      assignmentStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Shift Filter & Search */}
              <div className="flex items-center gap-2">
                <select
                  value={assignmentShiftFilter}
                  onChange={(e) => setAssignmentShiftFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="All">All Shifts</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Full Day">Full Day Shift</option>
                </select>

                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search Bus, Driver, Route..."
                    value={assignmentSearchQuery}
                    onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Visual Relationship Cards (BUS ➔ DRIVER ➔ ROUTE) */}
            <div className="space-y-4">
              {filteredAssignments.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-xs">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-700">No vehicle assignments match your filter</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the status or shift filter above.</p>
                </div>
              ) : (
                filteredAssignments.map((bus) => {
                  const bId = bus.id || bus.BusID;
                  const linkedDriver = drivers.find((d) => d.id === bus.driverId || d.DriverID === bus.driverId);
                  const linkedRoute = routes.find((r) => r.id === bus.routeId || r.RouteID === bus.routeId);
                  const isAssigned = Boolean(bus.driverId && bus.driverName !== 'Unassigned' && bus.routeId);

                  return (
                    <div
                      key={bId}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
                        isAssigned ? 'border-slate-200' : 'border-dashed border-amber-300 bg-amber-50/20'
                      }`}
                    >
                      {/* Top Bar: Relationship Summary & Status Badges */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${isAssigned ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                          <span className="font-mono text-xs font-bold text-slate-500">ASSIGNMENT #{bId}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-700">Shift: <strong className="text-indigo-700">{bus.shift || 'Morning'}</strong></span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <StatusBadge status={bus.status} />
                          {isAssigned ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                              ✓ Triad Linked
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200">
                              ⚠️ Incomplete Link
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3-Pillar Relationship Row: BUS ➔ DRIVER ➔ ROUTE */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-4 items-center">
                        
                        {/* PILLAR 1: BUS ASSET (4 cols) */}
                        <div className="lg:col-span-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Bus className="w-3.5 h-3.5 text-blue-600" />
                              <span>Bus Asset</span>
                            </span>
                            <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {bus.registrationNumber || 'RJ-27-PA-4081'}
                            </span>
                          </div>
                          <div>
                            <strong className="text-slate-900 text-sm block">{bus.busNumber || bus.BusNo}</strong>
                            <p className="text-[11px] text-slate-500 truncate">{bus.model || 'Tata Starbus 52S'}</p>
                          </div>
                          <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-slate-600">
                            <span>👥 {bus.capacity || 52} Seats</span>
                            <span>•</span>
                            <span>⛽ {bus.fuelType || 'Diesel'}</span>
                          </div>
                        </div>

                        {/* CONNECTOR ARROW 1 (1 col) */}
                        <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-200 shadow-xs">
                            ➔
                          </div>
                        </div>

                        {/* PILLAR 2: DRIVER PERSONNEL (4 cols) */}
                        <div className={`lg:col-span-3 p-3.5 rounded-xl border space-y-1.5 ${
                          linkedDriver ? 'bg-indigo-50/40 border-indigo-200' : 'bg-amber-50/60 border-amber-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-indigo-700">
                              <Users className="w-3.5 h-3.5" />
                              <span>Driver Personnel</span>
                            </span>
                            {linkedDriver && (
                              <span className="font-mono text-[10px] text-indigo-700 font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                                {linkedDriver.driverId || linkedDriver.DriverID || linkedDriver.id}
                              </span>
                            )}
                          </div>

                          {linkedDriver ? (
                            <div>
                              <strong className="text-slate-900 text-sm block">{linkedDriver.name || linkedDriver.Name}</strong>
                              <p className="text-[11px] text-slate-500 font-mono">{linkedDriver.phone || linkedDriver.Contact || '+91 98290 12345'}</p>
                              <div className="flex items-center gap-2 pt-1 text-[10px] font-bold">
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">● {linkedDriver.status}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600">⭐ {linkedDriver.rating || '4.9'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center">
                              <p className="text-xs font-bold text-amber-800">No Driver Assigned</p>
                              <button
                                onClick={() => handleOpenChangeDriver(bus)}
                                className="mt-1 text-[11px] font-bold text-indigo-600 hover:underline"
                              >
                                + Assign Driver Now
                              </button>
                            </div>
                          )}
                        </div>

                        {/* CONNECTOR ARROW 2 (1 col) */}
                        <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-200 shadow-xs">
                            ➔
                          </div>
                        </div>

                        {/* PILLAR 3: TRANSIT ROUTE (4 cols) */}
                        <div className={`lg:col-span-4 p-3.5 rounded-xl border space-y-1.5 ${
                          linkedRoute ? 'bg-blue-50/40 border-blue-200' : 'bg-amber-50/60 border-amber-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-blue-700">
                              <RouteIcon className="w-3.5 h-3.5" />
                              <span>Transit Route</span>
                            </span>
                            {linkedRoute && (
                              <span className="font-mono text-[10px] text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                                {linkedRoute.routeId || linkedRoute.RouteID || linkedRoute.id}
                              </span>
                            )}
                          </div>

                          {linkedRoute ? (
                            <div>
                              <strong className="text-slate-900 text-sm block truncate">{linkedRoute.routeName || linkedRoute.RouteName}</strong>
                              <p className="text-[11px] text-slate-500 truncate">
                                {linkedRoute.startPoint} ➔ {linkedRoute.endPoint || linkedRoute.destination}
                              </p>
                              <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-slate-600">
                                <span>📏 {linkedRoute.distance || linkedRoute.totalDistance}</span>
                                <span>•</span>
                                <span>🚏 {(linkedRoute.stops || []).length} Stops</span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center">
                              <p className="text-xs font-bold text-amber-800">No Route Assigned</p>
                              <button
                                onClick={() => handleOpenChangeRoute(bus)}
                                className="mt-1 text-[11px] font-bold text-blue-600 hover:underline"
                              >
                                + Bind Route Now
                              </button>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Bottom Action Controls Bar */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                          <span>Live Telemetry:</span>
                          <strong className="text-slate-800">{bus.speed ? `${bus.speed} km/h` : '0 km/h (Stationary)'}</strong>
                          <span>•</span>
                          <span>Next Stop: <strong className="text-indigo-700">{bus.nextStop || 'Depot'}</strong></span>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center space-x-1.5">
                          {/* Edit Full Assignment */}
                          <button
                            onClick={() => handleOpenEditAssignment(bus)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                            title="Edit Bus, Driver, Route, and Shift"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Assignment</span>
                          </button>

                          {/* Quick Change Driver */}
                          <button
                            onClick={() => handleOpenChangeDriver(bus)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                            title="Switch Assigned Driver"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Change Driver</span>
                          </button>

                          {/* Quick Change Route */}
                          <button
                            onClick={() => handleOpenChangeRoute(bus)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                            title="Switch Transit Corridor"
                          >
                            <RouteIcon className="w-3.5 h-3.5" />
                            <span>Change Route</span>
                          </button>

                          {/* Unassign Bus */}
                          {isAssigned && (
                            <button
                              onClick={() => handleOpenUnassignBus(bus)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                              title="Safely Unassign Bus and Driver"
                            >
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>Unassign</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB: COMPLAINTS DESK */}
        {activeTab === 'complaints' && (() => {
          const totalCount = complaints.length;
          const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
          const inProgressCount = complaints.filter((c) => c.status === 'In Progress' || c.status === 'In Review').length;
          const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

          return (
            <div className="space-y-6">
              {/* Header Hero */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Grievance & Transport Complaints Desk</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Centralized grievance repository to review, investigate, change status, provide official responses, and resolve tickets
                  </p>
                </div>

                {/* Status KPI Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl font-bold border border-amber-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    {pendingCount} Pending
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {inProgressCount} In Progress
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-200">
                    {resolvedCount} Resolved
                  </span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'All', label: 'All Tickets', count: totalCount },
                    { id: 'Pending', label: 'Pending', count: pendingCount },
                    { id: 'In Progress', label: 'In Progress', count: inProgressCount },
                    { id: 'Resolved', label: 'Resolved', count: resolvedCount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setComplaintStatusFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        complaintStatusFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        complaintStatusFilter === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* Category Dropdown Filter */}
                  <select
                    value={complaintCategoryFilter}
                    onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="All">All Categories</option>
                    <option value="Bus Delay">Bus Delay</option>
                    <option value="Driver Behaviour">Driver Behaviour</option>
                    <option value="Bus Condition">Bus Condition</option>
                    <option value="Route Issue">Route Issue</option>
                    <option value="Other">Other</option>
                  </select>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search ID, student, bus, route..."
                      value={complaintSearchQuery}
                      onChange={(e) => setComplaintSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Complaints Table */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="p-3.5">Complaint ID & Date</th>
                        <th className="p-3.5">Student</th>
                        <th className="p-3.5">Bus & Route</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Title & Description</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                      {filteredComplaints.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-10 text-center text-slate-400 font-medium">
                            No complaints found matching current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredComplaints.map((c) => {
                          const categoryColor =
                            c.category === 'Bus Delay' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            c.category === 'Driver Behaviour' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            c.category === 'Bus Condition' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                            c.category === 'Route Issue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200';

                          const response = c.adminResponse || c.adminRemark;

                          return (
                            <tr key={c.id || c.complaintId} className="hover:bg-slate-50/80 transition-colors">
                              {/* ID & Date */}
                              <td className="p-3.5">
                                <span className="font-mono font-black text-slate-900 block">{c.complaintId || c.id}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{c.date || c.createdAt || c.timestamp}</span>
                              </td>

                              {/* Student Info */}
                              <td className="p-3.5">
                                <strong className="text-slate-900 block">{c.studentName}</strong>
                                <span className="text-[10px] text-slate-500 font-mono block">ID: {c.studentId || c.userId}</span>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{c.studentEmail}</span>
                              </td>

                              {/* Bus & Route */}
                              <td className="p-3.5">
                                <strong className="text-blue-600 block">{c.busNo || c.busNumber}</strong>
                                <span className="text-[10px] text-slate-600 block truncate max-w-[160px]" title={c.routeName}>
                                  {c.routeName}
                                </span>
                              </td>

                              {/* Category */}
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryColor}`}>
                                  {c.category}
                                </span>
                              </td>

                              {/* Title & Description */}
                              <td className="p-3.5 max-w-xs">
                                <strong className="text-slate-900 block text-xs truncate" title={c.title || c.subject}>
                                  {c.title || c.subject || `${c.category} Issue`}
                                </strong>
                                <p className="line-clamp-2 text-slate-600 text-[11px] mt-0.5">{c.description}</p>
                                {response && (
                                  <div className="mt-1.5 p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-900">
                                    <strong className="text-emerald-700 font-bold block">Admin Response:</strong>
                                    <span className="truncate block">{response}</span>
                                  </div>
                                )}
                              </td>

                              {/* Status */}
                              <td className="p-3.5">
                                <StatusBadge status={c.status} />
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Quick Status Select */}
                                  <select
                                    value={c.status}
                                    onChange={(e) => {
                                      const newSt = e.target.value;
                                      updateComplaintStatus(c.id || c.complaintId, newSt, c.adminResponse || c.adminRemark || '');
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] rounded-lg border border-slate-300 focus:outline-none"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                  </select>

                                  {/* Open / Inspect Modal */}
                                  <button
                                    onClick={() => {
                                      setSelectedComplaintForDetail(c);
                                      setComplaintActionForm({
                                        status: c.status,
                                        response: c.adminResponse || c.adminRemark || ''
                                      });
                                      setComplaintDetailModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                                  >
                                    Open
                                  </button>

                                  {/* Quick Resolve Action */}
                                  {c.status !== 'Resolved' && (
                                    <button
                                      onClick={() => {
                                        setResolveComplaintModalItem(c);
                                        setAdminRemarkInput(c.adminResponse || c.adminRemark || '');
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                                    >
                                      Resolve
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB: DATABASE TABLES EXPLORER */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Database Schema Explorer</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Core Database Tables & Live Records</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live view of the 5 requested core database tables: Users, Buses, Drivers, Routes, Tracking (+ Complaints)</p>
            </div>

            {/* Table Selection Pills */}
            <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-2xl">
              {[
                { id: 'buses', label: 'Buses Table', fields: 'BusID, BusNo, Capacity' },
                { id: 'users', label: 'Users Table', fields: 'UserID, Name, Email' },
                { id: 'drivers', label: 'Drivers Table', fields: 'DriverID, Name, Contact' },
                { id: 'routes', label: 'Routes Table', fields: 'RouteID, StartPoint, EndPoint' },
                { id: 'tracking', label: 'Tracking Table', fields: 'BusID, Latitude, Longitude' },
                { id: 'complaints', label: 'Complaints Table', fields: 'ComplaintID, UserID, BusNo' },
              ].map((tbl) => (
                <button
                  key={tbl.id}
                  onClick={() => setAdminActiveSchemaTable(tbl.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminActiveSchemaTable === tbl.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>{tbl.label}</div>
                  <div className={`text-[10px] ${adminActiveSchemaTable === tbl.id ? 'text-blue-100' : 'text-slate-400'}`}>{tbl.fields}</div>
                </button>
              ))}
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {adminActiveSchemaTable === 'buses' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3.5">BusID</th>
                      <th className="p-3.5">BusNo</th>
                      <th className="p-3.5">Capacity</th>
                      <th className="p-3.5">Model</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBuses.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 font-medium">
                        <td className="p-3.5 font-mono font-bold text-blue-600">{b.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">{b.busNumber}</td>
                        <td className="p-3.5 font-bold">{b.capacity} Seats</td>
                        <td className="p-3.5 text-slate-600">{b.model}</td>
                        <td className="p-3.5 font-semibold">{b.driverName}</td>
                        <td className="p-3.5"><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {adminActiveSchemaTable === 'users' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3.5">UserID</th>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono font-bold text-blue-600">{u.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                        <td className="p-3.5 font-mono text-slate-600">{u.email}</td>
                        <td className="p-3.5"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">{u.role}</span></td>
                        <td className="p-3.5 font-mono">{u.phone || '+91 98290 12345'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {adminActiveSchemaTable === 'drivers' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3.5">DriverID</th>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">LicenseNumber</th>
                      <th className="p-3.5">Assigned Bus</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {drivers.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono font-bold text-blue-600">{d.driverId || d.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">{d.name}</td>
                        <td className="p-3.5 font-mono">{d.phone}</td>
                        <td className="p-3.5 font-mono">{d.licenseNumber}</td>
                        <td className="p-3.5 font-bold text-blue-600">{d.assignedBusNumber || 'Unassigned'}</td>
                        <td className="p-3.5"><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {adminActiveSchemaTable === 'routes' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3.5">RouteID</th>
                      <th className="p-3.5">StartPoint</th>
                      <th className="p-3.5">EndPoint</th>
                      <th className="p-3.5">RouteName</th>
                      <th className="p-3.5">Distance</th>
                      <th className="p-3.5">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {routes.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono font-bold text-blue-600">{r.id}</td>
                        <td className="p-3.5 font-bold text-emerald-700">{r.startPoint}</td>
                        <td className="p-3.5 font-bold text-rose-700">{r.destination}</td>
                        <td className="p-3.5 font-bold text-slate-900">{r.routeName}</td>
                        <td className="p-3.5">{r.totalDistance}</td>
                        <td className="p-3.5">{r.estimatedDuration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {adminActiveSchemaTable === 'tracking' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3.5">BusID</th>
                      <th className="p-3.5">Latitude</th>
                      <th className="p-3.5">Longitude</th>
                      <th className="p-3.5">Speed (km/h)</th>
                      <th className="p-3.5">Next Stop</th>
                      <th className="p-3.5">ETA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allBuses.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono font-bold text-blue-600">{b.id} ({b.busNumber})</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{b.currentLat.toFixed(4)}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{b.currentLng.toFixed(4)}</td>
                        <td className="p-3.5 font-bold text-emerald-600">{b.speed} km/h</td>
                        <td className="p-3.5 font-bold text-blue-600">{b.nextStop}</td>
                        <td className="p-3.5 font-bold text-amber-600">~{b.etaMinutes || 5} mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {adminActiveSchemaTable === 'complaints' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3.5">ComplaintID</th>
                      <th className="p-3.5">StudentID</th>
                      <th className="p-3.5">BusNo</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Title</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {complaints.map((c) => (
                      <tr key={c.id || c.complaintId} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono font-bold text-blue-600">{c.complaintId || c.id}</td>
                        <td className="p-3.5 font-mono text-slate-700">{c.studentId || c.userId}</td>
                        <td className="p-3.5 font-bold text-slate-900">{c.busNo || c.busNumber}</td>
                        <td className="p-3.5"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{c.category}</span></td>
                        <td className="p-3.5 font-semibold text-slate-800 truncate max-w-[200px]">{c.title || c.subject}</td>
                        <td className="p-3.5 text-slate-500">{c.date || c.createdAt}</td>
                        <td className="p-3.5"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ADD BUS MODAL */}
      <Modal isOpen={addBusModalOpen} onClose={() => setAddBusModalOpen(false)} title="Add New Bus to Fleet">
        <form onSubmit={handleCreateBus} className="space-y-4 text-xs">
          {formErrors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formErrors}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bus Number *</label>
              <input
                type="text"
                required
                value={busForm.busNumber}
                onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                placeholder="e.g. BUS-105"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Registration Plate *</label>
              <input
                type="text"
                required
                value={busForm.registrationNumber}
                onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })}
                placeholder="e.g. RJ-27-PA-5501"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Capacity (Seats) *</label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={busForm.capacity}
                onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fuel Type *</label>
              <select
                value={busForm.fuelType}
                onChange={(e) => setBusForm({ ...busForm, fuelType: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Initial Status *</label>
              <select
                value={busForm.status}
                onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="At Depot">At Depot</option>
                <option value="In Transit">In Transit</option>
                <option value="Delayed">Delayed</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Vehicle Model</label>
            <input
              type="text"
              value={busForm.model}
              onChange={(e) => setBusForm({ ...busForm, model: e.target.value })}
              placeholder="e.g. Tata Starbus Ultra 52S"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assign Driver (Optional)</label>
              <select
                value={busForm.driverId}
                onChange={(e) => setBusForm({ ...busForm, driverId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- No Driver Assigned --</option>
                {drivers.map((d) => (
                  <option key={d.id || d.DriverID} value={d.id || d.DriverID}>
                    {d.name || d.Name} ({d.driverId || d.DriverID}) - {d.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assign Route (Optional)</label>
              <select
                value={busForm.routeId}
                onChange={(e) => setBusForm({ ...busForm, routeId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- No Route Assigned --</option>
                {routes.map((r) => (
                  <option key={r.id || r.RouteID} value={r.id || r.RouteID}>
                    {r.routeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Save & Register Bus to Fleet
          </button>
        </form>
      </Modal>

      {/* EDIT BUS MODAL */}
      <Modal isOpen={editBusModalOpen} onClose={() => setEditBusModalOpen(false)} title={`Edit Bus Specifications – ${busForm.busNumber}`}>
        <form onSubmit={handleUpdateBus} className="space-y-4 text-xs">
          {formErrors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formErrors}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bus Number *</label>
              <input
                type="text"
                required
                value={busForm.busNumber}
                onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Registration Plate *</label>
              <input
                type="text"
                required
                value={busForm.registrationNumber}
                onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Capacity (Seats) *</label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={busForm.capacity}
                onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fuel Type *</label>
              <select
                value={busForm.fuelType}
                onChange={(e) => setBusForm({ ...busForm, fuelType: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Operational Status *</label>
              <select
                value={busForm.status}
                onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="At Depot">At Depot</option>
                <option value="In Transit">In Transit</option>
                <option value="Delayed">Delayed</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Vehicle Model</label>
            <input
              type="text"
              value={busForm.model}
              onChange={(e) => setBusForm({ ...busForm, model: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Driver</label>
              <select
                value={busForm.driverId}
                onChange={(e) => setBusForm({ ...busForm, driverId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Unassigned --</option>
                {drivers.map((d) => (
                  <option key={d.id || d.DriverID} value={d.id || d.DriverID}>
                    {d.name || d.Name} ({d.driverId || d.DriverID}) - {d.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Route</label>
              <select
                value={busForm.routeId}
                onChange={(e) => setBusForm({ ...busForm, routeId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- No Route --</option>
                {routes.map((r) => (
                  <option key={r.id || r.RouteID} value={r.id || r.RouteID}>
                    {r.routeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Apply & Broadcast Changes
          </button>
        </form>
      </Modal>

      {/* VIEW BUS DETAILS MODAL */}
      <Modal
        isOpen={busDetailsModalOpen}
        onClose={() => setBusDetailsModalOpen(false)}
        title={selectedBusForDetail ? `Bus Overview – ${selectedBusForDetail.busNumber || selectedBusForDetail.BusNo}` : 'Bus Overview'}
      >
        {selectedBusForDetail && (
          <div className="space-y-4 text-xs">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-5 rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Fleet Asset</span>
                  <h3 className="text-2xl font-black text-white">{selectedBusForDetail.busNumber || selectedBusForDetail.BusNo}</h3>
                </div>
                <StatusBadge status={selectedBusForDetail.status} />
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Plate: <strong className="font-mono text-white">{selectedBusForDetail.registrationNumber}</strong> • Model: {selectedBusForDetail.model}
              </p>
            </div>

            {/* Quick Status Bar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-700">Quick Change Status:</span>
              <select
                value={selectedBusForDetail.status}
                onChange={(e) => {
                  handleQuickStatusChange(selectedBusForDetail.id || selectedBusForDetail.BusID, e.target.value);
                  setSelectedBusForDetail({ ...selectedBusForDetail, status: e.target.value });
                }}
                className="font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none"
              >
                <option value="At Depot">At Depot</option>
                <option value="In Transit">In Transit</option>
                <option value="Delayed">Delayed</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Bus ID</span>
                <span className="font-bold font-mono text-slate-800 truncate block mt-0.5">{selectedBusForDetail.id || selectedBusForDetail.BusID}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Capacity</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedBusForDetail.capacity || selectedBusForDetail.Capacity} Seats</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Fuel Type</span>
                <span className="font-bold text-slate-800 block mt-0.5">⛽ {selectedBusForDetail.fuelType || 'Diesel'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Speed</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedBusForDetail.speed || 0} km/h</span>
              </div>
            </div>

            {/* Passenger Occupancy Bar */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Passenger Headcount</span>
                <span className="text-blue-600">
                  {selectedBusForDetail.currentOccupancy || 0} / {selectedBusForDetail.capacity || selectedBusForDetail.Capacity} seats (
                  {Math.round(((selectedBusForDetail.currentOccupancy || 0) / (selectedBusForDetail.capacity || selectedBusForDetail.Capacity || 50)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((selectedBusForDetail.currentOccupancy || 0) / (selectedBusForDetail.capacity || selectedBusForDetail.Capacity || 50)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Driver & Route Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Driver</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedBusForDetail.driverName || 'Unassigned'}</h4>
                <p className="text-[11px] text-slate-500">ID: {selectedBusForDetail.driverId || 'None'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Route</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedBusForDetail.routeName || 'Unassigned'}</h4>
                <p className="text-[11px] text-slate-500">ID: {selectedBusForDetail.routeId || 'None'}</p>
              </div>
            </div>

            {/* Live GPS Telemetry */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Live Telemetry & GPS Coordinates</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Coordinates:</span>
                  <strong className="font-mono text-slate-800 font-bold">
                    {(selectedBusForDetail.currentLat || selectedBusForDetail.Latitude || 24.5714).toFixed(4)}, {(selectedBusForDetail.currentLng || selectedBusForDetail.Longitude || 73.6974).toFixed(4)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Next Stop / ETA:</span>
                  <strong className="text-blue-700 font-bold">
                    {selectedBusForDetail.nextStop || 'Depot'} (~{selectedBusForDetail.etaMinutes || selectedBusForDetail.eta || 0}m)
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setBusDetailsModalOpen(false);
                  handleOpenDeleteBus(selectedBusForDetail);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors"
              >
                Delete Bus
              </button>
              <button
                onClick={() => {
                  setBusDetailsModalOpen(false);
                  setEditingBusId(selectedBusForDetail.id || selectedBusForDetail.BusID);
                  setFormErrors('');
                  setBusForm({
                    busNumber: selectedBusForDetail.busNumber || selectedBusForDetail.BusNo || '',
                    registrationNumber: selectedBusForDetail.registrationNumber || '',
                    model: selectedBusForDetail.model || 'Tata Starbus Ultra 52S',
                    capacity: selectedBusForDetail.capacity || selectedBusForDetail.Capacity || 52,
                    fuelType: selectedBusForDetail.fuelType || 'Diesel',
                    routeId: selectedBusForDetail.routeId || selectedBusForDetail.RouteID || '',
                    driverId: selectedBusForDetail.driverId || selectedBusForDetail.DriverID || '',
                    status: selectedBusForDetail.status || 'At Depot'
                  });
                  setEditBusModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-colors"
              >
                Edit Specifications
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE BUS CONFIRMATION DIALOG MODAL */}
      <Modal
        isOpen={deleteBusModalOpen}
        onClose={() => setDeleteBusModalOpen(false)}
        title="Confirm Delete Bus"
      >
        {busToDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Delete {busToDelete.busNumber || busToDelete.BusNo} ({busToDelete.registrationNumber})?</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Are you sure you want to delete this vehicle from the fleet? This action will:
              </p>
              <ul className="list-disc list-inside text-slate-600 text-xs space-y-1 pl-1">
                <li>Remove the bus from the active fleet catalog.</li>
                <li>Unassign driver <strong>{busToDelete.driverName || 'Unassigned'}</strong>.</li>
                <li>Clear active GPS telemetry from student live map.</li>
                <li>Update dashboard statistics across all connected roles.</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteBusModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBus}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Bus</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ASSIGN DRIVER TO BUS MODAL */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Driver, Bus & Route">
        <form onSubmit={handleExecuteAssignment} className="space-y-4 text-xs">
          {assignmentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{assignmentError}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-slate-700">
            <span className="font-bold text-blue-700 text-xs block">📋 Assignment Compliance Rules:</span>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-600">
              <li>Drivers already on an active trip cannot be allocated to another bus.</li>
              <li>Buses actively in transit with a driver cannot be double-booked.</li>
              <li>Vehicles in Maintenance bay cannot be assigned to transit trips.</li>
            </ul>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">1. Select Fleet Driver *</label>
            <select
              required
              value={assignForm.driverId}
              onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose Driver --</option>
              {drivers.map((d) => (
                <option key={d.id || d.DriverID} value={d.id || d.DriverID}>
                  👨‍✈️ {d.name || d.Name} ({d.driverId || d.DriverID}) - {d.status} {d.assignedBusNumber && d.assignedBusNumber !== 'Unassigned' ? `[Assigned: ${d.assignedBusNumber}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">2. Select Fleet Bus *</label>
            <select
              required
              value={assignForm.busId}
              onChange={(e) => setAssignForm({ ...assignForm, busId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose Bus --</option>
              {allBuses.map((b) => (
                <option
                  key={b.id || b.BusID}
                  value={b.id || b.BusID}
                  disabled={b.status === 'Maintenance' || b.status === 'Out of Service'}
                >
                  🚌 {b.busNumber || b.BusNo} ({b.registrationNumber}) - {b.status} {b.status === 'Maintenance' ? '[⚠️ In Maintenance]' : ''} {b.driverName && b.driverName !== 'Unassigned' ? `(Current Driver: ${b.driverName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">3. Select Transit Route *</label>
            <select
              required
              value={assignForm.routeId}
              onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose Route --</option>
              {routes.map((r) => (
                <option key={r.id || r.RouteID} value={r.id || r.RouteID}>
                  🛣️ {r.routeName} ({r.distance || r.totalDistance || '8 km'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">4. Operating Shift</label>
            <select
              value={assignForm.shift}
              onChange={(e) => setAssignForm({ ...assignForm, shift: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Morning">Morning Shift (07:00 AM - 03:00 PM)</option>
              <option value="Evening">Evening Shift (03:00 PM - 11:00 PM)</option>
              <option value="Full Day">Full Day Transit</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Confirm & Dispatch Assignment
          </button>
        </form>
      </Modal>

      {/* ADD DRIVER MODAL */}
      <Modal isOpen={addDriverModalOpen} onClose={() => setAddDriverModalOpen(false)} title="Register New Fleet Driver">
        <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
          {driverFormErrors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{driverFormErrors}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Driver Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Sharma"
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Custom Driver ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. DRV-106 (Auto if blank)"
                value={driverForm.driverId}
                onChange={(e) => setDriverForm({ ...driverForm, driverId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+91 94140 XXXXX"
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Email Address</label>
              <input
                type="email"
                placeholder="driver@smartbus.edu"
                value={driverForm.email}
                onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">License Number *</label>
              <input
                type="text"
                required
                placeholder="RJ-27-2024-00100"
                value={driverForm.licenseNumber}
                onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Shift</label>
              <select
                value={driverForm.shift}
                onChange={(e) => setDriverForm({ ...driverForm, shift: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Initial Status</label>
              <select
                value={driverForm.status}
                onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assign Bus (Optional)</label>
              <select
                value={driverForm.assignedBusId}
                onChange={(e) => setDriverForm({ ...driverForm, assignedBusId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- No Bus Assigned --</option>
                {allBuses.map((b) => (
                  <option key={b.id || b.BusID} value={b.id || b.BusID} disabled={b.status === 'Maintenance'}>
                    {b.busNumber || b.BusNo} ({b.registrationNumber}) - {b.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assign Route (Optional)</label>
              <select
                value={driverForm.assignedRouteId}
                onChange={(e) => setDriverForm({ ...driverForm, assignedRouteId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- No Route Assigned --</option>
                {routes.map((r) => (
                  <option key={r.id || r.RouteID} value={r.id || r.RouteID}>
                    {r.routeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Register Driver Profile
          </button>
        </form>
      </Modal>

      {/* EDIT DRIVER MODAL */}
      <Modal isOpen={editDriverModalOpen} onClose={() => setEditDriverModalOpen(false)} title={`Edit Driver – ${driverForm.name}`}>
        <form onSubmit={handleUpdateDriver} className="space-y-4 text-xs">
          {driverFormErrors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{driverFormErrors}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Driver Name *</label>
              <input
                type="text"
                required
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">License Number *</label>
              <input
                type="text"
                required
                value={driverForm.licenseNumber}
                onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Shift</label>
              <select
                value={driverForm.shift}
                onChange={(e) => setDriverForm({ ...driverForm, shift: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Status</label>
              <select
                value={driverForm.status}
                onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              value={driverForm.email}
              onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Bus</label>
              <select
                value={driverForm.assignedBusId}
                onChange={(e) => setDriverForm({ ...driverForm, assignedBusId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- No Bus (Unassign) --</option>
                {allBuses.map((b) => (
                  <option key={b.id || b.BusID} value={b.id || b.BusID} disabled={b.status === 'Maintenance'}>
                    {b.busNumber || b.BusNo} ({b.registrationNumber}) - {b.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Route</label>
              <select
                value={driverForm.assignedRouteId}
                onChange={(e) => setDriverForm({ ...driverForm, assignedRouteId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- No Route --</option>
                {routes.map((r) => (
                  <option key={r.id || r.RouteID} value={r.id || r.RouteID}>
                    {r.routeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Apply & Broadcast Driver Changes
          </button>
        </form>
      </Modal>

      {/* VIEW DRIVER DETAILS MODAL */}
      <Modal
        isOpen={driverDetailsModalOpen}
        onClose={() => setDriverDetailsModalOpen(false)}
        title={selectedDriverForDetail ? `Driver Profile – ${selectedDriverForDetail.name || selectedDriverForDetail.Name}` : 'Driver Profile'}
      >
        {selectedDriverForDetail && (
          <div className="space-y-4 text-xs">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-5 rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold text-2xl border border-white/20">
                    👨‍✈️
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{selectedDriverForDetail.name || selectedDriverForDetail.Name}</h3>
                    <p className="text-xs text-amber-100 font-medium">
                      ID: <strong className="font-mono text-white">{selectedDriverForDetail.driverId || selectedDriverForDetail.DriverID || selectedDriverForDetail.id}</strong> • Rating: {selectedDriverForDetail.rating || '4.9 ⭐'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={selectedDriverForDetail.status} />
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-700">Quick Change Status:</span>
              <select
                value={selectedDriverForDetail.status}
                onChange={(e) => {
                  handleQuickDriverStatusChange(selectedDriverForDetail.id || selectedDriverForDetail.DriverID, e.target.value);
                  setSelectedDriverForDetail({ ...selectedDriverForDetail, status: e.target.value });
                }}
                className="font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Phone</span>
                <span className="font-bold font-mono text-slate-900 block mt-0.5">{selectedDriverForDetail.phone || selectedDriverForDetail.Contact}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">License Number</span>
                <span className="font-bold font-mono text-slate-900 block mt-0.5">{selectedDriverForDetail.licenseNumber || 'RJ-27-2024-00100'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Scheduled Shift</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedDriverForDetail.shift || 'Morning Shift'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Trips Completed Today</span>
                <span className="font-bold text-emerald-600 block mt-0.5">{selectedDriverForDetail.tripsToday || 0} Runs</span>
              </div>
            </div>

            {/* Assigned Vehicle & Route Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Assigned Fleet Bus</span>
                {selectedDriverForDetail.assignedBusNumber && selectedDriverForDetail.assignedBusNumber !== 'Unassigned' ? (
                  <div>
                    <h4 className="font-black text-blue-900 text-sm">🚌 {selectedDriverForDetail.assignedBusNumber}</h4>
                    <p className="text-[11px] text-blue-600 font-medium">Bus ID: {selectedDriverForDetail.assignedBusId}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-semibold">No bus assigned currently</p>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Transit Route</span>
                {selectedDriverForDetail.assignedRouteName && selectedDriverForDetail.assignedRouteName !== 'None' ? (
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedDriverForDetail.assignedRouteName}</h4>
                    <p className="text-[11px] text-slate-500">Route ID: {selectedDriverForDetail.assignedRouteId}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-semibold">No route assigned currently</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
              <div>
                {selectedDriverForDetail.assignedBusId && (
                  <button
                    onClick={() => {
                      handleUnassignDriverAction(selectedDriverForDetail.id || selectedDriverForDetail.DriverID);
                      setSelectedDriverForDetail({
                        ...selectedDriverForDetail,
                        assignedBusId: '',
                        assignedBusNumber: 'Unassigned',
                        assignedRouteId: '',
                        assignedRouteName: 'None',
                        status: 'Available'
                      });
                    }}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition-colors"
                  >
                    Unassign Driver
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDriverDetailsModalOpen(false);
                    handleOpenDeleteDriver(selectedDriverForDetail);
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors"
                >
                  Delete Driver
                </button>
                <button
                  onClick={() => {
                    setDriverDetailsModalOpen(false);
                    setEditingDriverId(selectedDriverForDetail.id || selectedDriverForDetail.DriverID);
                    setDriverFormErrors('');
                    setDriverForm({
                      driverId: selectedDriverForDetail.driverId || selectedDriverForDetail.DriverID || selectedDriverForDetail.id,
                      name: selectedDriverForDetail.name || selectedDriverForDetail.Name || '',
                      phone: selectedDriverForDetail.phone || selectedDriverForDetail.Contact || '',
                      email: selectedDriverForDetail.email || '',
                      shift: selectedDriverForDetail.shift || 'Morning',
                      licenseNumber: selectedDriverForDetail.licenseNumber || '',
                      status: selectedDriverForDetail.status || 'Available',
                      assignedBusId: selectedDriverForDetail.assignedBusId || '',
                      assignedRouteId: selectedDriverForDetail.assignedRouteId || ''
                    });
                    setEditDriverModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-colors"
                >
                  Edit Driver Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE DRIVER CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteDriverModalOpen}
        onClose={() => setDeleteDriverModalOpen(false)}
        title="Confirm Delete Driver"
      >
        {driverToDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Delete Driver {driverToDelete.name || driverToDelete.Name} ({driverToDelete.driverId || driverToDelete.DriverID})?</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Are you sure you want to remove this driver from the fleet roster? This action will:
              </p>
              <ul className="list-disc list-inside text-slate-600 text-xs space-y-1 pl-1">
                <li>Remove the driver profile from the database.</li>
                <li>Unassign bus <strong>{driverToDelete.assignedBusNumber || 'None'}</strong> and set it to At Depot.</li>
                <li>Complete and archive any ongoing trip records.</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDriverModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriver}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Driver</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD ROUTE MODAL */}
      <Modal isOpen={addRouteModalOpen} onClose={() => setAddRouteModalOpen(false)} title="Create New Transit Route">
        <form onSubmit={handleCreateRoute} className="space-y-4 text-xs">
          {routeFormErrors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{routeFormErrors}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Route Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. City Palace & Old City Circuit (R-04)"
                value={routeForm.routeName}
                onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Custom Route ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. route_4 (Auto if blank)"
                value={routeForm.routeId}
                onChange={(e) => setRouteForm({ ...routeForm, routeId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Point (Departure) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jagdish Temple Square"
                value={routeForm.startPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">End Point (Destination) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lake Palace Viewpoint Terminal"
                value={routeForm.endPoint}
                onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Distance</label>
              <input
                type="text"
                placeholder="e.g. 12.5 km"
                value={routeForm.totalDistance}
                onChange={(e) => setRouteForm({ ...routeForm, totalDistance: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Estimated Duration</label>
              <input
                type="text"
                placeholder="e.g. 30 mins"
                value={routeForm.estimatedDuration}
                onChange={(e) => setRouteForm({ ...routeForm, estimatedDuration: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Status</label>
              <select
                value={routeForm.status}
                onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Daily Departure Schedules (Comma Separated)</label>
            <input
              type="text"
              placeholder="07:30 AM, 08:15 AM, 01:30 PM, 05:00 PM"
              value={routeForm.schedules}
              onChange={(e) => setRouteForm({ ...routeForm, schedules: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Initial Start & End stops will be automatically initialized and can be customized via Manage Stops.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Create Route & Initialize Stops
          </button>
        </form>
      </Modal>

      {/* EDIT ROUTE MODAL */}
      <Modal isOpen={editRouteModalOpen} onClose={() => setEditRouteModalOpen(false)} title={`Edit Route – ${routeForm.routeName}`}>
        <form onSubmit={handleUpdateRoute} className="space-y-4 text-xs">
          {routeFormErrors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{routeFormErrors}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Route Name *</label>
              <input
                type="text"
                required
                value={routeForm.routeName}
                onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Status</label>
              <select
                value={routeForm.status}
                onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Point *</label>
              <input
                type="text"
                required
                value={routeForm.startPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">End Point *</label>
              <input
                type="text"
                required
                value={routeForm.endPoint}
                onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Distance</label>
              <input
                type="text"
                value={routeForm.totalDistance}
                onChange={(e) => setRouteForm({ ...routeForm, totalDistance: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Estimated Duration</label>
              <input
                type="text"
                value={routeForm.estimatedDuration}
                onChange={(e) => setRouteForm({ ...routeForm, estimatedDuration: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Daily Departure Schedules (Comma Separated)</label>
            <input
              type="text"
              value={routeForm.schedules}
              onChange={(e) => setRouteForm({ ...routeForm, schedules: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Apply & Broadcast Route Changes
          </button>
        </form>
      </Modal>

      {/* VIEW ROUTE DETAILS & LEAFLET MAP MODAL */}
      <Modal
        isOpen={routeDetailsModalOpen}
        onClose={() => setRouteDetailsModalOpen(false)}
        title={selectedRouteForDetail ? `Route Map – ${selectedRouteForDetail.routeName || selectedRouteForDetail.RouteName}` : 'Route Overview'}
      >
        {selectedRouteForDetail && (
          <div className="space-y-4 text-xs">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-5 rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Corridor Overview</span>
                  <h3 className="text-xl font-black text-white">{selectedRouteForDetail.routeName || selectedRouteForDetail.RouteName}</h3>
                </div>
                <StatusBadge status={selectedRouteForDetail.status || 'Active'} />
              </div>
              <p className="text-xs text-blue-100 font-medium">
                ID: <strong className="font-mono text-white">{selectedRouteForDetail.id || selectedRouteForDetail.RouteID}</strong> • Distance: {selectedRouteForDetail.distance || selectedRouteForDetail.totalDistance} • Duration: {selectedRouteForDetail.estimatedDuration}
              </p>
            </div>

            {/* Interactive Leaflet Map showing Complete Route & Stops */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <RouteIcon className="w-4 h-4 text-blue-600" />
                  <span>Interactive Route Path & Sequential Stops on Leaflet Map:</span>
                </span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                  {(selectedRouteForDetail.stops || selectedRouteForDetail.Stops || []).length} Sequential Stops
                </span>
              </div>
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                <InteractiveMap
                  selectedRoute={selectedRouteForDetail}
                  buses={allBuses.filter((b) => b.routeId === (selectedRouteForDetail.id || selectedRouteForDetail.RouteID))}
                />
              </div>
            </div>

            {/* Start and End Point Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">🟢 Origin / Start Point</span>
                <strong className="text-slate-900 block text-xs truncate">{selectedRouteForDetail.startPoint || selectedRouteForDetail.StartPoint}</strong>
              </div>
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 space-y-0.5">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">🔴 Terminal / End Point</span>
                <strong className="text-slate-900 block text-xs truncate">{selectedRouteForDetail.endPoint || selectedRouteForDetail.EndPoint || selectedRouteForDetail.destination}</strong>
              </div>
            </div>

            {/* Sequential Stop Timeline */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Stop Sequence Timeline</span>
                <button
                  onClick={() => {
                    setRouteDetailsModalOpen(false);
                    handleOpenManageStops(selectedRouteForDetail);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Manage / Reorder Stops</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedRouteForDetail.stops || selectedRouteForDetail.Stops || []).map((stop, idx) => (
                  <div key={stop.id || stop.StopID || idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/70 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                        {stop.sequenceOrder || stop.Sequence || idx + 1}
                      </span>
                      <div>
                        <strong className="text-slate-900 block text-[11px]">{stop.name || stop.StopName}</strong>
                        <span className="text-[10px] font-mono text-slate-400">{stop.id || stop.StopID} • GPS: {parseFloat(stop.lat || stop.Latitude || 0).toFixed(4)}, {parseFloat(stop.lng || stop.Longitude || 0).toFixed(4)}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      ⏱️ {stop.estimatedTime || stop.ExpectedArrivalTime || '08:30 AM'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setRouteDetailsModalOpen(false);
                  handleOpenManageStops(selectedRouteForDetail);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center gap-1.5"
              >
                <RouteIcon className="w-3.5 h-3.5" />
                <span>Manage Stops</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MANAGE STOPS MODAL (Add, Edit, Delete, Reorder) */}
      <Modal
        isOpen={manageStopsModalOpen}
        onClose={() => setManageStopsModalOpen(false)}
        title={selectedRouteForStops ? `Manage Stops Architecture – ${selectedRouteForStops.routeName || selectedRouteForStops.RouteName}` : 'Manage Stops'}
      >
        {selectedRouteForStops && (
          <div className="space-y-5 text-xs">
            {stopFormErrors && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{stopFormErrors}</span>
              </div>
            )}

            {/* Route Info Pill */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase">Route Corridor</span>
                <h4 className="font-black text-slate-900 text-sm">{selectedRouteForStops.routeName || selectedRouteForStops.RouteName}</h4>
                <p className="text-[11px] text-slate-500">
                  {selectedRouteForStops.startPoint} ➔ {selectedRouteForStops.endPoint}
                </p>
              </div>
              <button
                onClick={() => setAddStopInlineOpen(!addStopInlineOpen)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addStopInlineOpen ? 'Close Form' : 'Add Stop'}</span>
              </button>
            </div>

            {/* Inline Add/Edit Stop Form */}
            {addStopInlineOpen && (
              <form onSubmit={editingStopId ? handleUpdateStopSubmit : handleAddStopSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>{editingStopId ? '✏️ Edit Stop Details' : '➕ Add Stop to Route Sequence'}</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stop Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chetak Circle Flyover Stop"
                      value={stopForm.name}
                      onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Custom Stop ID</label>
                    <input
                      type="text"
                      placeholder="e.g. STP-105 (Auto if blank)"
                      value={stopForm.stopId}
                      onChange={(e) => setStopForm({ ...stopForm, stopId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GPS Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="24.5850"
                      value={stopForm.lat}
                      onChange={(e) => setStopForm({ ...stopForm, lat: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GPS Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="73.6900"
                      value={stopForm.lng}
                      onChange={(e) => setStopForm({ ...stopForm, lng: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Expected Arrival Time</label>
                    <input
                      type="text"
                      placeholder="08:35 AM"
                      value={stopForm.estimatedTime}
                      onChange={(e) => setStopForm({ ...stopForm, estimatedTime: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {editingStopId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStopId(null);
                        setAddStopInlineOpen(false);
                      }}
                      className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow"
                  >
                    {editingStopId ? 'Save Stop Changes' : 'Insert Stop'}
                  </button>
                </div>
              </form>
            )}

            {/* Stops Sequence Table with Reordering */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-xs">Sequential Stops Architecture ({(selectedRouteForStops.stops || []).length} Stops)</span>
                <span className="text-[11px] text-slate-500 font-medium">Use ⬆️ / ⬇️ to reorder stop sequence</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {(selectedRouteForStops.stops || []).length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No stops configured on this route yet. Click "+ Add Stop" above.
                  </div>
                ) : (
                  (selectedRouteForStops.stops || []).map((stop, idx) => {
                    const sId = stop.id || stop.StopID;
                    const isFirst = idx === 0;
                    const isLast = idx === (selectedRouteForStops.stops?.length || 0) - 1;

                    return (
                      <div key={sId || idx} className="p-3 hover:bg-slate-50/80 flex items-center justify-between transition-colors text-xs">
                        <div className="flex items-center space-x-3">
                          {/* Sequence Badge */}
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                            {stop.sequenceOrder || stop.Sequence || idx + 1}
                          </span>

                          <div>
                            <strong className="text-slate-900 block text-xs">{stop.name || stop.StopName}</strong>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                              <span>ID: {sId}</span>
                              <span>•</span>
                              <span>GPS: {parseFloat(stop.lat || stop.Latitude || 0).toFixed(4)}, {parseFloat(stop.lng || stop.Longitude || 0).toFixed(4)}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">⏱️ {stop.estimatedTime || stop.ExpectedArrivalTime || '08:30 AM'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reorder and Edit Actions */}
                        <div className="flex items-center space-x-1">
                          {/* Move Up Button */}
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveStopAction(sId, 'up')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isFirst ? 'text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-blue-50 text-blue-700'
                            }`}
                            title="Move Stop Up in Sequence"
                          >
                            ⬆️
                          </button>

                          {/* Move Down Button */}
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveStopAction(sId, 'down')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isLast ? 'text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-blue-50 text-blue-700'
                            }`}
                            title="Move Stop Down in Sequence"
                          >
                            ⬇️
                          </button>

                          {/* Edit Stop */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStopId(sId);
                              setStopForm({
                                stopId: sId,
                                name: stop.name || stop.StopName || '',
                                sequence: stop.sequenceOrder || stop.Sequence || idx + 1,
                                lat: stop.lat || stop.Latitude || 24.5850,
                                lng: stop.lng || stop.Longitude || 73.6900,
                                estimatedTime: stop.estimatedTime || stop.ExpectedArrivalTime || '08:30 AM'
                              });
                              setAddStopInlineOpen(true);
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs"
                            title="Edit Stop"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Stop */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStopAction(sId)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs"
                            title="Delete Stop"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE ROUTE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteRouteModalOpen}
        onClose={() => setDeleteRouteModalOpen(false)}
        title="Confirm Delete Transit Route"
      >
        {routeToDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Delete Route {routeToDelete.routeName || routeToDelete.RouteName} ({routeToDelete.id || routeToDelete.RouteID})?</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Are you sure you want to remove this transit route from the network? This action will:
              </p>
              <ul className="list-disc list-inside text-slate-600 text-xs space-y-1 pl-1">
                <li>Remove the corridor and all its sequential stops from the catalog.</li>
                <li>Unassign any linked fleet buses and return them to Depot status.</li>
                <li>Unassign any linked drivers and reset their assigned route.</li>
                <li>Remove the route path from student live tracking maps.</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteRouteModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoute}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Route</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE NEW ASSIGNMENT MODAL (BUS + DRIVER + ROUTE) */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignmentError('');
        }}
        title="Create Dispatch Assignment (BUS + DRIVER + ROUTE)"
      >
        <form onSubmit={handleExecuteAssignment} className="space-y-4 text-xs">
          {assignmentError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="block font-black">Assignment Rejected</span>
                <span className="font-medium text-[11px] block">{assignmentError}</span>
              </div>
            </div>
          )}

          {/* Step 1: Select Bus Asset */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">1. Select Fleet Bus Asset *</label>
            <select
              required
              value={assignForm.busId}
              onChange={(e) => setAssignForm({ ...assignForm, busId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Choose Fleet Vehicle --</option>
              {allBuses.map((b) => {
                const bId = b.id || b.BusID;
                const isMaint = b.status === 'Maintenance' || b.status === 'Out of Service';
                return (
                  <option key={bId} value={bId} disabled={isMaint}>
                    {b.busNumber || b.BusNo} ({b.registrationNumber || 'RJ-27-PA-4081'}) – {b.status} {isMaint ? '[LOCKED - MAINTENANCE]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Step 2: Select Driver Personnel */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">2. Select Driver Personnel (Must be Available) *</label>
            <select
              required
              value={assignForm.driverId}
              onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Choose Certified Driver --</option>
              {drivers.map((d) => {
                const dId = d.id || d.DriverID;
                const isAvail = d.status === 'Available';
                return (
                  <option key={dId} value={dId}>
                    {d.name || d.Name} ({d.driverId || d.DriverID || dId}) – Status: {d.status} {isAvail ? '✓ Ready' : '⚠️ Busy / Off'}
                  </option>
                );
              })}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Validation Engine Rule: Drivers with status "On Trip", "Off Duty", or "On Leave" will be rejected.
            </span>
          </div>

          {/* Step 3: Select Transit Corridor */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">3. Select Transit Route Corridor *</label>
            <select
              required
              value={assignForm.routeId}
              onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Choose Transit Route --</option>
              {routes.map((r) => {
                const rId = r.id || r.RouteID;
                return (
                  <option key={rId} value={rId}>
                    {r.routeName || r.RouteName} ({r.startPoint} ➔ {r.endPoint || r.destination}) – {(r.stops || []).length} Stops
                  </option>
                );
              })}
            </select>
          </div>

          {/* Step 4: Select Shift Timing */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">4. Operating Shift</label>
            <select
              value={assignForm.shift}
              onChange={(e) => setAssignForm({ ...assignForm, shift: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
              <option value="Evening">Evening Shift (02:00 PM - 10:00 PM)</option>
              <option value="Full Day">Full Day Shift (07:00 AM - 07:00 PM)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Dispatch & Establish Triad Link
          </button>
        </form>
      </Modal>

      {/* EDIT ASSIGNMENT MODAL */}
      <Modal
        isOpen={editAssignModalOpen}
        onClose={() => {
          setEditAssignModalOpen(false);
          setSelectedAssignmentBus(null);
          setAssignmentError('');
        }}
        title={`Edit Assignment – ${selectedAssignmentBus?.busNumber || selectedAssignmentBus?.BusNo || 'Vehicle'}`}
      >
        <form onSubmit={handleExecuteEditAssignment} className="space-y-4 text-xs">
          {assignmentError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="block font-black">Edit Failed</span>
                <span className="font-medium text-[11px] block">{assignmentError}</span>
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Bus Asset (Fixed)</label>
            <input
              type="text"
              readOnly
              disabled
              value={`${selectedAssignmentBus?.busNumber || ''} (${selectedAssignmentBus?.registrationNumber || ''})`}
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Assigned Driver</label>
            <select
              required
              value={assignForm.driverId}
              onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Select Driver --</option>
              {drivers.map((d) => {
                const dId = d.id || d.DriverID;
                const isCurrent = dId === selectedAssignmentBus?.driverId;
                const isAvail = d.status === 'Available' || isCurrent;
                return (
                  <option key={dId} value={dId}>
                    {d.name || d.Name} ({d.driverId || dId}) – {d.status} {isCurrent ? '(Current)' : isAvail ? '✓ Ready' : '⚠️ Busy'}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Transit Route</label>
            <select
              required
              value={assignForm.routeId}
              onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Select Route --</option>
              {routes.map((r) => {
                const rId = r.id || r.RouteID;
                return (
                  <option key={rId} value={rId}>
                    {r.routeName || r.RouteName} ({r.startPoint} ➔ {r.endPoint || r.destination})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Operating Shift</label>
            <select
              value={assignForm.shift}
              onChange={(e) => setAssignForm({ ...assignForm, shift: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
              <option value="Evening">Evening Shift (02:00 PM - 10:00 PM)</option>
              <option value="Full Day">Full Day Shift (07:00 AM - 07:00 PM)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Save & Broadcast Assignment Changes
          </button>
        </form>
      </Modal>

      {/* CHANGE DRIVER MODAL */}
      <Modal
        isOpen={changeDriverModalOpen}
        onClose={() => {
          setChangeDriverModalOpen(false);
          setSelectedAssignmentBus(null);
          setAssignmentError('');
        }}
        title={`Change Driver – ${selectedAssignmentBus?.busNumber || selectedAssignmentBus?.BusNo || 'Vehicle'}`}
      >
        <form onSubmit={handleExecuteChangeDriver} className="space-y-4 text-xs">
          {assignmentError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{assignmentError}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">Current Active Link</span>
            <div className="flex justify-between items-center text-xs">
              <strong className="text-slate-900">Bus: {selectedAssignmentBus?.busNumber}</strong>
              <span className="text-slate-600">Current Driver: <strong className="text-indigo-700">{selectedAssignmentBus?.driverName || 'None'}</strong></span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Select New Replacement Driver (Available only) *</label>
            <select
              required
              value={changeDriverForm.newDriverId}
              onChange={(e) => setChangeDriverForm({ ...changeDriverForm, newDriverId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Choose Replacement Driver --</option>
              {drivers
                .filter((d) => (d.id || d.DriverID) !== selectedAssignmentBus?.driverId)
                .map((d) => {
                  const dId = d.id || d.DriverID;
                  const isAvail = d.status === 'Available';
                  return (
                    <option key={dId} value={dId}>
                      {d.name || d.Name} ({d.driverId || dId}) – {d.status} {isAvail ? '✓ Ready' : '⚠️ Busy / Off Duty'}
                    </option>
                  );
                })}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              The previous driver ({selectedAssignmentBus?.driverName || 'Driver'}) will be cleanly decoupled and set back to "Available".
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Confirm & Swap Driver
          </button>
        </form>
      </Modal>

      {/* CHANGE ROUTE MODAL */}
      <Modal
        isOpen={changeRouteModalOpen}
        onClose={() => {
          setChangeRouteModalOpen(false);
          setSelectedAssignmentBus(null);
          setAssignmentError('');
        }}
        title={`Change Transit Corridor – ${selectedAssignmentBus?.busNumber || selectedAssignmentBus?.BusNo || 'Vehicle'}`}
      >
        <form onSubmit={handleExecuteChangeRoute} className="space-y-4 text-xs">
          {assignmentError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{assignmentError}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Current Active Corridor</span>
            <div className="flex justify-between items-center text-xs">
              <strong className="text-slate-900">{selectedAssignmentBus?.busNumber}</strong>
              <span className="text-slate-600">Current Route: <strong className="text-blue-700">{selectedAssignmentBus?.routeName || 'None'}</strong></span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Select New Transit Corridor *</label>
            <select
              required
              value={changeRouteForm.newRouteId}
              onChange={(e) => setChangeRouteForm({ ...changeRouteForm, newRouteId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose New Route Corridor --</option>
              {routes.map((r) => {
                const rId = r.id || r.RouteID;
                const isCurrent = rId === selectedAssignmentBus?.routeId;
                return (
                  <option key={rId} value={rId} disabled={isCurrent}>
                    {r.routeName || r.RouteName} ({r.startPoint} ➔ {r.endPoint || r.destination}) – {(r.stops || []).length} Stops {isCurrent ? '[CURRENT]' : ''}
                  </option>
                );
              })}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Vehicle tracking and driver schedules will instantly bind to the new route coordinates.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 mt-2"
          >
            Confirm & Bind Route Corridor
          </button>
        </form>
      </Modal>

      {/* UNASSIGN CONFIRMATION MODAL */}
      <Modal
        isOpen={unassignConfirmModalOpen}
        onClose={() => {
          setUnassignConfirmModalOpen(false);
          setSelectedAssignmentBus(null);
        }}
        title="Confirm Vehicle Decoupling & Unassignment"
      >
        {selectedAssignmentBus && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Decouple {selectedAssignmentBus.busNumber} and Unassign Driver {selectedAssignmentBus.driverName}?</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                This action will break the three-way operational triad:
              </p>
              <ul className="list-disc list-inside text-slate-600 text-xs space-y-1 pl-1">
                <li>Vehicle <strong>{selectedAssignmentBus.busNumber}</strong> status will return to <strong>At Depot</strong>.</li>
                <li>Driver <strong>{selectedAssignmentBus.driverName}</strong> will become <strong>Available</strong> for new dispatches.</li>
                <li>Live GPS broadcasting for this vehicle will be safely terminated.</li>
                <li>Active transit trip records will be archived and marked as completed.</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUnassignConfirmModalOpen(false);
                  setSelectedAssignmentBus(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnassignBus}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Yes, Unassign Asset</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* COMPLAINT INVESTIGATION & RESPONSE MODAL */}
      <Modal
        isOpen={complaintDetailModalOpen}
        onClose={() => {
          setComplaintDetailModalOpen(false);
          setSelectedComplaintForDetail(null);
        }}
        title={selectedComplaintForDetail ? `Complaint Review – ${selectedComplaintForDetail.complaintId || selectedComplaintForDetail.id}` : 'Complaint Investigation'}
      >
        {selectedComplaintForDetail && (
          <div className="space-y-4 text-xs">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl space-y-2 border border-indigo-900/50 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-black bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md">
                      {selectedComplaintForDetail.complaintId || selectedComplaintForDetail.id}
                    </span>
                    <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                      {selectedComplaintForDetail.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white">
                    {selectedComplaintForDetail.title || selectedComplaintForDetail.subject || `${selectedComplaintForDetail.category} Incident`}
                  </h4>
                </div>
                <StatusBadge status={selectedComplaintForDetail.status} />
              </div>
              <p className="text-xs text-indigo-200 font-medium">
                Logged on: <strong className="text-white">{selectedComplaintForDetail.date || selectedComplaintForDetail.createdAt || selectedComplaintForDetail.timestamp}</strong>
              </p>
            </div>

            {/* Student & Bus Dual Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Student Details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student Information</span>
                <strong className="text-slate-900 block text-xs">{selectedComplaintForDetail.studentName}</strong>
                <span className="text-[11px] font-mono text-slate-600 block">ID: {selectedComplaintForDetail.studentId || selectedComplaintForDetail.userId}</span>
                <span className="text-[11px] text-slate-500 block truncate">{selectedComplaintForDetail.studentEmail}</span>
              </div>

              {/* Target Bus & Route Details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Vehicle & Corridor</span>
                <strong className="text-blue-700 block text-xs">{selectedComplaintForDetail.busNo || selectedComplaintForDetail.busNumber}</strong>
                <span className="text-[11px] text-slate-600 block truncate" title={selectedComplaintForDetail.routeName}>
                  Route: {selectedComplaintForDetail.routeName}
                </span>
                <span className="text-[10px] text-slate-400 block">Assigned Fleet Asset</span>
              </div>
            </div>

            {/* Student Description Box */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Student Grievance Description</label>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 leading-relaxed">
                "{selectedComplaintForDetail.description}"
              </div>
            </div>

            {/* Status & Official Admin Response Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateComplaintStatus(
                  selectedComplaintForDetail.id || selectedComplaintForDetail.complaintId,
                  complaintActionForm.status,
                  complaintActionForm.response
                );
                setComplaintDetailModalOpen(false);
                setSelectedComplaintForDetail(null);
              }}
              className="space-y-3 pt-2 border-t border-slate-100"
            >
              {/* Status Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Change Ticket Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Pending', label: 'Pending', color: 'hover:border-amber-400 peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-800' },
                    { id: 'In Progress', label: 'In Progress', color: 'hover:border-blue-400 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-800' },
                    { id: 'Resolved', label: 'Resolved', color: 'hover:border-emerald-400 peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-800' },
                  ].map((st) => (
                    <label
                      key={st.id}
                      className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        complaintActionForm.status === st.id
                          ? st.id === 'Resolved'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : st.id === 'In Progress'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                            : 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="complaintStatus"
                        value={st.id}
                        checked={complaintActionForm.status === st.id}
                        onChange={() => setComplaintActionForm({ ...complaintActionForm, status: st.id })}
                        className="sr-only"
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Response Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700 block">Official Admin Response & Remarks</label>
                  <span className="text-[10px] text-slate-400">Visible to student</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter administrative investigation findings, corrective action taken, or resolution note..."
                  value={complaintActionForm.response}
                  onChange={(e) => setComplaintActionForm({ ...complaintActionForm, response: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>

              {/* Quick Template Remarks */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Response Templates</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Driver counselled on route timing & schedule adherence.',
                    'Vehicle inspected in fleet maintenance bay and issue resolved.',
                    'Traffic bottleneck reported to campus patrol cell for clearance.',
                    'Investigation completed. Grievance resolved satisfactorily.'
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setComplaintActionForm({ ...complaintActionForm, response: template })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded-lg transition-colors text-left truncate max-w-full"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setComplaintDetailModalOpen(false);
                    setSelectedComplaintForDetail(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                {complaintActionForm.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateComplaintStatus(
                        selectedComplaintForDetail.id || selectedComplaintForDetail.complaintId,
                        'Resolved',
                        complaintActionForm.response || 'Grievance investigated and resolved by transport administration.'
                      );
                      setComplaintDetailModalOpen(false);
                      setSelectedComplaintForDetail(null);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>One-Click Resolve</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md active:scale-98"
                >
                  Save Status & Response
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* QUICK RESOLVE COMPLAINT MODAL */}
      <Modal
        isOpen={!!resolveComplaintModalItem}
        onClose={() => setResolveComplaintModalItem(null)}
        title={`Resolve Grievance Ticket – ${resolveComplaintModalItem?.complaintId || resolveComplaintModalItem?.id}`}
      >
        {resolveComplaintModalItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateComplaintStatus(
                resolveComplaintModalItem.id || resolveComplaintModalItem.complaintId,
                'Resolved',
                adminRemarkInput || 'Ticket reviewed and resolved by transport supervisor.'
              );
              setResolveComplaintModalItem(null);
              setAdminRemarkInput('');
            }}
            className="space-y-4 text-xs"
          >
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900">{resolveComplaintModalItem.studentName}</span>
                <span className="text-blue-600 font-bold">{resolveComplaintModalItem.busNo}</span>
              </div>
              <p className="text-slate-600 text-[11px]">"{resolveComplaintModalItem.description}"</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Resolution Response *</label>
              <textarea
                required
                rows={3}
                placeholder="State how the grievance was addressed and resolved..."
                value={adminRemarkInput}
                onChange={(e) => setAdminRemarkInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98"
            >
              Mark as Resolved & Publish Response
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default AdminView;
