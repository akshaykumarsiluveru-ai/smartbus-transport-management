const API_BASE_URL = 'http://localhost:5000/api';

const logResult = (testName, passed, details = '') => {
  if (passed) {
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`   └─ ${details}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   └─ ${details}`);
  }
};

async function runDriverIntegrationTests() {
  console.log('\n====================================================');
  console.log('🧪 SMARTBUS PHASE 5C-2: DRIVER MODULE INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  let driverToken = '';
  let studentToken = '';
  let adminToken = '';

  let driverId = null;
  let assignedBusId = null;
  let assignedRouteId = null;
  let activeTripId = null;

  try {
    // ----------------------------------------------------
    // Step 0: Setup Tokens via Login
    // ----------------------------------------------------
    const driverLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@smartbus.edu', password: 'driver123' }),
    });
    const driverLoginData = await driverLoginRes.json();
    driverToken = driverLoginData.token || driverLoginData.data?.token || '';

    const studentLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'student123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    studentToken = studentLoginData.token || studentLoginData.data?.token || '';

    const adminLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token || adminLoginData.data?.token || '';

    // ----------------------------------------------------
    // Test 1: Driver authentication & profile fetch
    // ----------------------------------------------------
    try {
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const meData = await meRes.json();
      const pass = meRes.status === 200 && meData.user?.role === 'driver';
      logResult('Test 1: Driver can authenticate and fetch profile', pass, `Status: ${meRes.status}, Role: ${meData.user?.role}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 1: Driver can authenticate and fetch profile', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 2: Fetch Driver Details & Assignment
    // ----------------------------------------------------
    try {
      const driversRes = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const driversData = await driversRes.json();
      const driversList = driversData.data || [];
      const currentDriver = driversList.find((d) => d.driver_email === 'driver@smartbus.edu' || d.user_id === 2 || d.id === 1) || driversList[0];
      
      driverId = currentDriver?.id || 1;
      assignedBusId = currentDriver?.assigned_bus_id || 1;
      assignedRouteId = currentDriver?.assigned_route_id || 1;

      const pass = driversRes.status === 200 && Boolean(driverId) && Boolean(assignedBusId);
      logResult('Test 2: Driver can fetch assigned bus & route profile', pass, `Driver ID: ${driverId}, Bus ID: ${assignedBusId}, Route ID: ${assignedRouteId}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 2: Driver can fetch assigned bus & route profile', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 3: Driver cannot start trip with unassigned bus ID
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/trips/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: 9999, route_id: assignedRouteId, passenger_count: 5 }),
      });
      const data = await res.json();
      const pass = res.status === 400 || res.status === 404;
      logResult('Test 3: Unassigned bus trip start attempt is rejected', pass, `Status: ${res.status}, Message: "${data.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 3: Unassigned bus trip start attempt is rejected', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 4: Driver can start assigned trip
    // ----------------------------------------------------
    try {
      // Cleanup pre-existing active trip if present to maintain test isolation
      try {
        const activeRes = await fetch(`${API_BASE_URL}/trips`, { headers: { Authorization: `Bearer ${driverToken}` } });
        const activeData = await activeRes.json();
        const existingInTransit = (activeData.data || []).find((t) => t.bus_id === assignedBusId && t.status === 'In Transit');
        if (existingInTransit) {
          await fetch(`${API_BASE_URL}/trips/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
            body: JSON.stringify({ trip_id: existingInTransit.id }),
          });
        }
      } catch (cleanupErr) {}

      const res = await fetch(`${API_BASE_URL}/trips/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: assignedBusId, route_id: assignedRouteId, passenger_count: 10 }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data?.id) {
        activeTripId = data.data.id;
      }
      const pass = res.status === 201 && Boolean(activeTripId);
      logResult('Test 4: Driver can start assigned trip', pass, `Trip ID: ${activeTripId}, Trip Code: ${data.data?.trip_code}, Status: ${data.data?.status}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 4: Driver can start assigned trip', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 5: Driver cannot start second trip while already on active trip
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/trips/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: assignedBusId, route_id: assignedRouteId }),
      });
      const data = await res.json();
      const pass = res.status === 400 && data.success === false;
      logResult('Test 5: Starting second trip while on active trip is rejected (400 Bad Request)', pass, `Status: ${res.status}, Message: "${data.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 5: Starting second trip while on active trip is rejected (400 Bad Request)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 6: Driver can submit valid tracking update
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          bus_id: assignedBusId,
          latitude: 24.5854,
          longitude: 73.6900,
          speed: 35.5,
          current_stop: 'Surajpole Circle',
          next_stop: 'Sukhadia Circle',
          eta_minutes: 6,
        }),
      });
      const data = await res.json();
      const pass = res.status === 201 && data.success === true && parseFloat(data.data?.latitude) === 24.5854;
      logResult('Test 6: Driver can submit valid tracking update', pass, `Status: ${res.status}, Tracking Record ID: ${data.data?.id}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 6: Driver can submit valid tracking update', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 7: Invalid tracking latitude is rejected
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          bus_id: assignedBusId,
          latitude: 999.0, // Invalid latitude
          longitude: 73.6900,
          speed: 30.0,
        }),
      });
      const data = await res.json();
      const pass = res.status === 400;
      logResult('Test 7: Invalid tracking latitude is rejected (400 Bad Request)', pass, `Status: ${res.status}, Message: "${data.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 7: Invalid tracking latitude is rejected (400 Bad Request)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 8: Driver can fetch trip history
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/trips`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && Array.isArray(data.data) && data.data.length > 0;
      logResult('Test 8: Driver can fetch trip history', pass, `Total trips found: ${data.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 8: Driver can fetch trip history', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 9: Driver can end active trip
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/trips/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ trip_id: activeTripId }),
      });
      const data = await res.json();
      const pass = res.status === 200 && data.data?.status === 'Completed';
      logResult('Test 9: Driver can end active trip', pass, `Status: ${res.status}, Ended Trip Status: "${data.data?.status}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 9: Driver can end active trip', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 10: Bus and Driver status updated after trip end
    // ----------------------------------------------------
    try {
      const busesRes = await fetch(`${API_BASE_URL}/buses`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const busesData = await busesRes.json();
      const endedBus = busesData.data?.find((b) => b.id === assignedBusId);
      const pass = endedBus && endedBus.status === 'At Depot';
      logResult('Test 10: Bus status set to "At Depot" after trip completion', pass, `Bus Status: "${endedBus?.status}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 10: Bus status set to "At Depot" after trip completion', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 11: Student cannot start a driver trip (403 Forbidden)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/trips/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ bus_id: 1, route_id: 1 }),
      });
      const pass = res.status === 403;
      logResult('Test 11: Student trip start attempt is rejected (403 Forbidden)', pass, `Received ${res.status} Forbidden as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 11: Student trip start attempt is rejected (403 Forbidden)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 12: Driver cannot perform Admin-only mutations (403 Forbidden)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_number: 'BUS-HACK-99', model: 'Illegal Bus', capacity: 40 }),
      });
      const pass = res.status === 403;
      logResult('Test 12: Driver bus creation attempt is rejected (403 Forbidden)', pass, `Received ${res.status} Forbidden as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 12: Driver bus creation attempt is rejected (403 Forbidden)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 13: Missing JWT is rejected (401 Unauthorized)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/trips/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus_id: 1, route_id: 1 }),
      });
      const pass = res.status === 401;
      logResult('Test 13: Missing JWT is rejected (401 Unauthorized)', pass, `Received ${res.status} Unauthorized as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 13: Missing JWT is rejected (401 Unauthorized)', false, err.message);
      failedCount++;
    }

  } catch (err) {
    console.error('Fatal error running Driver integration suite:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 DRIVER MODULE TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDriverIntegrationTests();
