import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const logResult = (testName, passed, details = '') => {
  if (passed) {
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`   └─ ${details}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   └─ ${details}`);
  }
};

const connectSocketWithToken = (token, timeoutMs = 3000) => {
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token: token ? `Bearer ${token}` : '' },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: timeoutMs,
    });

    let settled = false;

    socket.on('connect', () => {
      if (!settled) {
        settled = true;
        resolve({ success: true, socket, error: null });
      }
    });

    socket.on('connect_error', (err) => {
      if (!settled) {
        settled = true;
        resolve({ success: false, socket, error: err });
      }
    });
  });
};

async function runTelemetryBroadcastTests() {
  console.log('\n====================================================');
  console.log('🧪 SMARTBUS PHASE 5D-2: REAL-TIME TELEMETRY BROADCAST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  let driverToken = '';
  let studentToken = '';
  let adminToken = '';

  try {
    // ----------------------------------------------------
    // Step 0: Setup Tokens & Active Driver Trip
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

    // Ensure Bus 1 is on active trip
    await fetch(`${API_BASE_URL}/trips/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ bus_id: 1, route_id: 1 }),
    });

    // ----------------------------------------------------
    // Test 1: Socket.IO Server Available
    // ----------------------------------------------------
    let testSocket = null;
    try {
      const conn = await connectSocketWithToken(studentToken);
      testSocket = conn.socket;
      const pass = conn.success === true && Boolean(testSocket?.id);
      logResult('Test 1: Socket.IO server is available and accepting connections', pass, `Socket ID: ${testSocket?.id}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 1: Socket.IO server is available and accepting connections', false, err.message);
      failedCount++;
    }

    // Join Bus 1 Room with testSocket
    if (testSocket) {
      await new Promise((resolve) => {
        testSocket.emit('join_bus_room', { bus_id: 1 }, resolve);
      });
    }

    // ----------------------------------------------------
    // Test 2 & 3: Driver Posts Telemetry via REST & Persists to MySQL
    // ----------------------------------------------------
    let telemetryResData = null;
    try {
      const payload = {
        bus_id: 1,
        latitude: 24.5854,
        longitude: 73.7125,
        speed: 42.5,
        current_stop: 'Delgate Circle',
        next_stop: 'Court Circle',
        eta_minutes: 5,
      };

      const res = await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      telemetryResData = data.data;

      const pass = res.status === 201 && data.success === true && data.data?.bus_id === 1;
      logResult('Test 2: Authenticated driver can post telemetry via REST endpoint', pass, `Status: ${res.status}, Message: "${data.message}"`);
      if (pass) passedCount++; else failedCount++;

      // Verify persistence via GET /api/tracking/bus/1
      const histRes = await fetch(`${API_BASE_URL}/tracking/bus/1`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const histData = await histRes.json();
      const persistedPass = histRes.status === 200 && Array.isArray(histData.data) && histData.data.length > 0;
      logResult('Test 3: Telemetry is persisted in database source of truth', persistedPass, `Latest entries count: ${histData.data?.length}`);
      if (persistedPass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 2: Authenticated driver can post telemetry via REST endpoint', false, err.message);
      logResult('Test 3: Telemetry is persisted in database source of truth', false, err.message);
      failedCount += 2;
    }

    // ----------------------------------------------------
    // Test 4 & 5: bus_location_update Event Emitted & Received with Payload
    // ----------------------------------------------------
    try {
      const updatePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve({ received: false }), 3000);
        testSocket.once('bus_location_update', (eventData) => {
          clearTimeout(timeout);
          resolve({ received: true, eventData });
        });
      });

      const testPayload = {
        bus_id: 1,
        latitude: 24.5910,
        longitude: 73.7180,
        speed: 38.0,
        current_stop: 'Court Circle',
        next_stop: 'Udaipur City Station',
        eta_minutes: 3,
      };

      await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify(testPayload),
      });

      const eventResult = await updatePromise;
      const passEvent = eventResult.received === true;
      logResult('Test 4: bus_location_update Socket.IO event is emitted upon REST update', passEvent, `Received event: ${passEvent}`);
      if (passEvent) passedCount++; else failedCount++;

      const ed = eventResult.eventData || {};
      const payloadValid = ed.bus_id === 1 && Number(ed.latitude) === 24.5910 && ed.current_stop === 'Court Circle';
      logResult('Test 5: Emitted payload contains expected persisted telemetry values', payloadValid, `Lat: ${ed.latitude}, Lng: ${ed.longitude}, Current Stop: "${ed.current_stop}"`);
      if (payloadValid) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 4: bus_location_update Socket.IO event is emitted upon REST update', false, err.message);
      logResult('Test 5: Emitted payload contains expected persisted telemetry values', false, err.message);
      failedCount += 2;
    }

    // ----------------------------------------------------
    // Test 6: Driver Cannot Update Unassigned Bus (No Broadcast)
    // ----------------------------------------------------
    try {
      let eventReceived = false;
      const failListener = () => { eventReceived = true; };
      testSocket.on('bus_location_update', failListener);

      const unassignedRes = await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: 999, latitude: 24.5, longitude: 73.7 }),
      });
      const unassignedData = await unassignedRes.json();

      await new Promise((r) => setTimeout(r, 500));
      testSocket.off('bus_location_update', failListener);

      const pass = unassignedRes.status === 400 && eventReceived === false;
      logResult('Test 6: Driver updating unassigned bus is rejected and NOT broadcast', pass, `Status: ${unassignedRes.status}, Message: "${unassignedData.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 6: Driver updating unassigned bus is rejected and NOT broadcast', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 7: Unauthorized Telemetry Update (Student Token) Rejected
    // ----------------------------------------------------
    try {
      const studentUpdateRes = await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ bus_id: 1, latitude: 24.5, longitude: 73.7 }),
      });
      const pass = studentUpdateRes.status === 403;
      logResult('Test 7: Student attempt to post telemetry is rejected with 403 Forbidden', pass, `Status: ${studentUpdateRes.status}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 7: Student attempt to post telemetry is rejected with 403 Forbidden', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 8: Invalid Coordinates Payload Rejected & NOT Broadcast
    // ----------------------------------------------------
    try {
      const invalidRes = await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: 1, latitude: 999.0, longitude: 73.7 }),
      });
      const invalidData = await invalidRes.json();
      const pass = invalidRes.status === 400 && invalidData.message.includes('latitude');
      logResult('Test 8: Invalid latitude coordinate payload is rejected (400 Bad Request)', pass, `Message: "${invalidData.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 8: Invalid latitude coordinate payload is rejected (400 Bad Request)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 9: Missing JWT Request Rejected (401 Unauthorized)
    // ----------------------------------------------------
    try {
      const noAuthRes = await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus_id: 1, latitude: 24.5, longitude: 73.7 }),
      });
      const pass = noAuthRes.status === 401;
      logResult('Test 9: Missing JWT telemetry update request is rejected (401 Unauthorized)', pass, `Status: ${noAuthRes.status}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 9: Missing JWT telemetry update request is rejected (401 Unauthorized)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 10: Room Isolation Test (Bus 1 vs Bus 2)
    // ----------------------------------------------------
    let clientBus1 = null;
    let clientBus2 = null;
    try {
      const conn1 = await connectSocketWithToken(studentToken);
      clientBus1 = conn1.socket;
      await new Promise((r) => clientBus1.emit('join_bus_room', { bus_id: 1 }, r));

      const conn2 = await connectSocketWithToken(adminToken);
      clientBus2 = conn2.socket;
      await new Promise((r) => clientBus2.emit('join_bus_room', { bus_id: 2 }, r));

      let bus1Received = false;
      let bus2Received = false;

      clientBus1.on('bus_location_update', () => { bus1Received = true; });
      clientBus2.on('bus_location_update', () => { bus2Received = true; });

      // Trigger telemetry update ONLY for Bus 1
      await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          bus_id: 1,
          latitude: 24.5950,
          longitude: 73.7220,
          speed: 40.0,
          current_stop: 'City Station',
          next_stop: 'Terminal Depot',
        }),
      });

      await new Promise((r) => setTimeout(r, 1000));

      const passIsolation = bus1Received === true && bus2Received === false;
      logResult('Test 10: Room Isolation — Client in bus:1 receives update, Client in bus:2 receives NOTHING', passIsolation, `bus:1 received: ${bus1Received}, bus:2 received: ${bus2Received}`);
      if (passIsolation) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 10: Room Isolation — Client in bus:1 receives update, Client in bus:2 receives NOTHING', false, err.message);
      failedCount++;
    } finally {
      if (clientBus1) clientBus1.disconnect();
      if (clientBus2) clientBus2.disconnect();
    }

    // ----------------------------------------------------
    // Test 11: Clean Socket Disconnections
    // ----------------------------------------------------
    try {
      if (testSocket) testSocket.disconnect();
      const pass = !testSocket || !testSocket.connected;
      logResult('Test 11: Test sockets disconnect cleanly', pass, 'All test sockets disconnected');
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 11: Test sockets disconnect cleanly', false, err.message);
      failedCount++;
    }

  } catch (err) {
    console.error('Fatal error running Telemetry Broadcast suite:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 TELEMETRY BROADCAST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTelemetryBroadcastTests();
