import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';

async function runCoreApiTests() {
  console.log('====================================================');
  console.log('🧪 SMARTBUS PHASE 3: CORE REST APIs TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      if (details) console.log(`   └─ Error: ${details}`);
      failedCount++;
    }
  };

  try {
    // ----------------------------------------------------
    // Step 0: Acquire Auth Tokens (Admin, Student, Driver)
    // ----------------------------------------------------
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminToken = (await adminLoginRes.json()).token;

    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'student123' }),
    });
    const studentToken = (await studentLoginRes.json()).token;

    const driverLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@smartbus.edu', password: 'driver123' }),
    });
    const driverToken = (await driverLoginRes.json()).token;

    // ----------------------------------------------------
    // Test A: GET /api/buses with valid JWT
    // ----------------------------------------------------
    const busesRes = await fetch(`${BASE_URL}/api/buses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const busesData = await busesRes.json();
    assert(
      busesRes.status === 200 && Array.isArray(busesData.data) && busesData.data.length > 0,
      'Test A: GET /api/buses with valid JWT',
      `Status: ${busesRes.status}, Total buses returned: ${busesData.data?.length}`
    );

    // ----------------------------------------------------
    // Test B: GET /api/drivers with valid JWT
    // ----------------------------------------------------
    const driversRes = await fetch(`${BASE_URL}/api/drivers`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const driversData = await driversRes.json();
    assert(
      driversRes.status === 200 && Array.isArray(driversData.data) && driversData.data.length > 0,
      'Test B: GET /api/drivers with valid JWT',
      `Status: ${driversRes.status}, Total drivers returned: ${driversData.data?.length}`
    );

    // ----------------------------------------------------
    // Test C: GET /api/routes with valid JWT
    // ----------------------------------------------------
    const routesRes = await fetch(`${BASE_URL}/api/routes`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const routesData = await routesRes.json();
    assert(
      routesRes.status === 200 && Array.isArray(routesData.data) && routesData.data.length > 0,
      'Test C: GET /api/routes with valid JWT',
      `Status: ${routesRes.status}, Total routes returned: ${routesData.data?.length}`
    );

    // ----------------------------------------------------
    // Test D: GET /api/routes/1/stops with valid JWT
    // ----------------------------------------------------
    const stopsRes = await fetch(`${BASE_URL}/api/routes/1/stops`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const stopsData = await stopsRes.json();
    assert(
      stopsRes.status === 200 && Array.isArray(stopsData.data) && stopsData.data.length > 0,
      'Test D: GET /api/routes/1/stops with valid JWT',
      `Status: ${stopsRes.status}, Route 1 total stops returned: ${stopsData.data?.length}`
    );

    // ----------------------------------------------------
    // Test E: Admin creates a test bus
    // ----------------------------------------------------
    const testBusNumber = `BUS-TEST-${Date.now().toString().slice(-4)}`;
    const createBusRes = await fetch(`${BASE_URL}/api/buses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bus_number: testBusNumber,
        registration_number: `RJ-27-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        model: 'Volvo Test Shuttle',
        capacity: 40,
        fuel_type: 'Electric',
        status: 'At Depot',
      }),
    });
    const createBusData = await createBusRes.json();
    const createdBusId = createBusData.data?.id;
    assert(
      createBusRes.status === 201 && createBusData.data?.bus_number === testBusNumber,
      'Test E: Admin creates a test bus',
      `Status: ${createBusRes.status}, Bus ID: ${createdBusId}, Bus Number: "${createBusData.data?.bus_number}"`
    );

    // ----------------------------------------------------
    // Test F: Admin updates the test bus
    // ----------------------------------------------------
    const updateBusRes = await fetch(`${BASE_URL}/api/buses/${createdBusId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        capacity: 45,
        status: 'In Transit',
      }),
    });
    const updateBusData = await updateBusRes.json();
    assert(
      updateBusRes.status === 200 && updateBusData.data?.capacity === 45 && updateBusData.data?.status === 'In Transit',
      'Test F: Admin updates the test bus',
      `Status: ${updateBusRes.status}, Updated Capacity: ${updateBusData.data?.capacity}, Updated Status: "${updateBusData.data?.status}"`
    );

    // ----------------------------------------------------
    // Test G: Admin deletes the test bus
    // ----------------------------------------------------
    const deleteBusRes = await fetch(`${BASE_URL}/api/buses/${createdBusId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteBusData = await deleteBusRes.json();
    assert(
      deleteBusRes.status === 200 && deleteBusData.success === true,
      'Test G: Admin deletes the test bus',
      `Status: ${deleteBusRes.status}, Message: "${deleteBusData.message}"`
    );

    // ----------------------------------------------------
    // Test H: Admin creates a test route
    // ----------------------------------------------------
    const testRouteCode = `R-TEST-${Date.now().toString().slice(-4)}`;
    const createRouteRes = await fetch(`${BASE_URL}/api/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        route_code: testRouteCode,
        name: 'Test Corridor Express',
        start_point: 'East Gate',
        end_point: 'West Library',
        distance_km: 8.5,
        estimated_duration: '20 mins',
        status: 'Active',
      }),
    });
    const createRouteData = await createRouteRes.json();
    const createdRouteId = createRouteData.data?.id;
    assert(
      createRouteRes.status === 201 && createRouteData.data?.route_code === testRouteCode,
      'Test H: Admin creates a test route',
      `Status: ${createRouteRes.status}, Route ID: ${createdRouteId}, Code: "${createRouteData.data?.route_code}"`
    );

    // ----------------------------------------------------
    // Test I: Admin updates the test route
    // ----------------------------------------------------
    const updateRouteRes = await fetch(`${BASE_URL}/api/routes/${createdRouteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        distance_km: 9.2,
        estimated_duration: '22 mins',
      }),
    });
    const updateRouteData = await updateRouteRes.json();
    assert(
      updateRouteRes.status === 200 && updateRouteData.data?.distance_km == 9.2,
      'Test I: Admin updates the test route',
      `Status: ${updateRouteRes.status}, Updated distance: ${updateRouteData.data?.distance_km} km`
    );

    // ----------------------------------------------------
    // Test J: Admin creates and updates route stop
    // ----------------------------------------------------
    const createStopRes = await fetch(`${BASE_URL}/api/routes/${createdRouteId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        stop_name: 'Test Innovation Hub Stop',
        latitude: 24.6001,
        longitude: 73.6811,
        stop_order: 1,
        scheduled_arrival: '09:00 AM',
      }),
    });
    const createStopData = await createStopRes.json();
    const createdStopId = createStopData.data?.id;

    const updateStopRes = await fetch(`${BASE_URL}/api/routes/${createdRouteId}/stops/${createdStopId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        stop_name: 'Test Innovation Hub Stop (Updated)',
        scheduled_arrival: '09:05 AM',
      }),
    });
    const updateStopData = await updateStopRes.json();

    assert(
      createStopRes.status === 201 && updateStopRes.status === 200 && updateStopData.data?.stop_name.includes('Updated'),
      'Test J: Admin creates & updates route stop',
      `Create Status: ${createStopRes.status}, Update Status: ${updateStopRes.status}, Stop Name: "${updateStopData.data?.stop_name}"`
    );

    // ----------------------------------------------------
    // Test K: Admin deletes route stop
    // ----------------------------------------------------
    const deleteStopRes = await fetch(`${BASE_URL}/api/routes/${createdRouteId}/stops/${createdStopId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteStopData = await deleteStopRes.json();
    assert(
      deleteStopRes.status === 200 && deleteStopData.success === true,
      'Test K: Admin deletes route stop',
      `Status: ${deleteStopRes.status}, Message: "${deleteStopData.message}"`
    );

    // Cleanup created test route
    await fetch(`${BASE_URL}/api/routes/${createdRouteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // ----------------------------------------------------
    // Test L: Admin assignment endpoint works
    // ----------------------------------------------------
    const assignRes = await fetch(`${BASE_URL}/api/drivers/1/assignment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        assigned_bus_id: 1,
        assigned_route_id: 1,
      }),
    });
    const assignData = await assignRes.json();
    assert(
      assignRes.status === 200 && assignData.data?.assigned_bus_id == 1 && assignData.data?.assigned_route_id == 1,
      'Test L: Admin assignment endpoint works (PUT /api/drivers/1/assignment)',
      `Status: ${assignRes.status}, Driver ID: 1 assigned to Bus ${assignData.data?.assigned_bus_id} & Route ${assignData.data?.assigned_route_id}`
    );

    // ----------------------------------------------------
    // Test M: Student attempting admin-only bus creation receives 403
    // ----------------------------------------------------
    const studentBusRes = await fetch(`${BASE_URL}/api/buses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        bus_number: 'BUS-FORBIDDEN',
        capacity: 30,
      }),
    });
    const studentBusData = await studentBusRes.json();
    assert(
      studentBusRes.status === 403 && studentBusData.success === false,
      'Test M: Reject student bus creation attempt with 403 Forbidden',
      `Status: ${studentBusRes.status}, Response: "${studentBusData.message}"`
    );

    // ----------------------------------------------------
    // Test N: Driver attempting admin-only route creation receives 403
    // ----------------------------------------------------
    const driverRouteRes = await fetch(`${BASE_URL}/api/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        route_code: 'R-FORBIDDEN',
        name: 'Forbidden Route',
        start_point: 'A',
        end_point: 'B',
      }),
    });
    const driverRouteData = await driverRouteRes.json();
    assert(
      driverRouteRes.status === 403 && driverRouteData.success === false,
      'Test N: Reject driver route creation attempt with 403 Forbidden',
      `Status: ${driverRouteRes.status}, Response: "${driverRouteData.message}"`
    );

    // ----------------------------------------------------
    // Test O: Request without JWT receives 401
    // ----------------------------------------------------
    const noJwtRes = await fetch(`${BASE_URL}/api/buses`);
    const noJwtData = await noJwtRes.json();
    assert(
      noJwtRes.status === 401 && noJwtData.success === false,
      'Test O: Reject unauthenticated request without JWT with 401 Unauthorized',
      `Status: ${noJwtRes.status}, Message: "${noJwtData.message}"`
    );

    // ----------------------------------------------------
    // Test P: Invalid resource ID returns 404
    // ----------------------------------------------------
    const invalidIdRes = await fetch(`${BASE_URL}/api/buses/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const invalidIdData = await invalidIdRes.json();
    assert(
      invalidIdRes.status === 404 && invalidIdData.success === false,
      'Test P: Return 404 Not Found for non-existent resource ID',
      `Status: ${invalidIdRes.status}, Message: "${invalidIdData.message}"`
    );

    // ----------------------------------------------------
    // Test Q: Duplicate bus number returns 409
    // ----------------------------------------------------
    const dupBusRes = await fetch(`${BASE_URL}/api/buses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bus_number: 'BUS-101', // Seed bus number already exists
        capacity: 50,
      }),
    });
    const dupBusData = await dupBusRes.json();
    assert(
      dupBusRes.status === 409 && dupBusData.success === false,
      'Test Q: Reject duplicate bus_number registration with 409 Conflict',
      `Status: ${dupBusRes.status}, Message: "${dupBusData.message}"`
    );

    // ----------------------------------------------------
    // Test R: Duplicate route code returns 409
    // ----------------------------------------------------
    const dupRouteRes = await fetch(`${BASE_URL}/api/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        route_code: 'R-01', // Seed route code already exists
        name: 'Duplicate Corridor',
        start_point: 'Point A',
        end_point: 'Point B',
      }),
    });
    const dupRouteData = await dupRouteRes.json();
    assert(
      dupRouteRes.status === 409 && dupRouteData.success === false,
      'Test R: Reject duplicate route_code creation with 409 Conflict',
      `Status: ${dupRouteRes.status}, Message: "${dupRouteData.message}"`
    );

  } catch (err) {
    console.error('\n❌ Error executing core API test suite:', err);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`📊 CORE API TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');
}

runCoreApiTests();
