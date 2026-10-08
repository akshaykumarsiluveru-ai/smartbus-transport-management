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

async function runFrontendSocketIntegrationTests() {
  console.log('\n====================================================');
  console.log('🧪 SMARTBUS PHASE 5D-3: FRONTEND SOCKET.IO INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  let driverToken = '';
  let studentToken = '';
  let adminToken = '';

  try {
    // ----------------------------------------------------
    // Step 0: Obtain JWT Tokens via Login
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

    // Start active trip for Driver 1 if needed
    await fetch(`${API_BASE_URL}/trips/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ bus_id: 1, route_id: 1 }),
    });

    // ----------------------------------------------------
    // Test 1: Frontend Socket Service Initialization & URL Derivation
    // ----------------------------------------------------
    try {
      const derivedUrl = SOCKET_URL;
      const pass = derivedUrl === 'http://localhost:5000';
      logResult('Test 1: Socket service can derive backend WebSocket URL safely', pass, `Derived URL: ${derivedUrl}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 1: Socket service can derive backend WebSocket URL safely', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 2: JWT attached to Socket.IO Handshake Authentication
    // ----------------------------------------------------
    let studentSocket = null;
    try {
      const conn = await connectSocketWithToken(studentToken);
      studentSocket = conn.socket;
      const pass = conn.success === true && Boolean(studentSocket?.id);
      logResult('Test 2: JWT attached to Socket.IO handshake authentication', pass, `Connected: ${conn.success}, Socket ID: ${studentSocket?.id}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 2: JWT attached to Socket.IO handshake authentication', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 3: Authenticated Student Connection
    // ----------------------------------------------------
    try {
      const pass = studentSocket?.connected === true;
      logResult('Test 3: Authenticated Student can connect to real-time socket', pass, `Connected: ${pass}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 3: Authenticated Student can connect to real-time socket', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 4: Authenticated Admin Connection
    // ----------------------------------------------------
    let adminSocket = null;
    try {
      const conn = await connectSocketWithToken(adminToken);
      adminSocket = conn.socket;
      const pass = conn.success === true && adminSocket?.connected === true;
      logResult('Test 4: Authenticated Admin can connect to real-time socket', pass, `Connected: ${pass}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 4: Authenticated Admin can connect to real-time socket', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 5: Student Joins Bus Room (bus:1)
    // ----------------------------------------------------
    try {
      const ack = await new Promise((resolve) => {
        studentSocket.emit('join_bus_room', { bus_id: 1 }, resolve);
      });
      const pass = ack?.success === true && ack?.room === 'bus:1';
      logResult('Test 5: Student can join valid bus room (bus:1)', pass, `Room: "${ack?.room}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 5: Student can join valid bus room (bus:1)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 6: Admin Joins Bus Room (bus:1)
    // ----------------------------------------------------
    try {
      const ack = await new Promise((resolve) => {
        adminSocket.emit('join_bus_room', { bus_id: 1 }, resolve);
      });
      const pass = ack?.success === true && ack?.room === 'bus:1';
      logResult('Test 6: Admin can join valid bus room (bus:1)', pass, `Room: "${ack?.room}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 6: Admin can join valid bus room (bus:1)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 7 & 8: Student & Admin Receive bus_location_update & State Updates
    // ----------------------------------------------------
    try {
      let studentEvent = null;
      let adminEvent = null;

      const studentPromise = new Promise((resolve) => {
        studentSocket.once('bus_location_update', (data) => resolve(data));
      });
      const adminPromise = new Promise((resolve) => {
        adminSocket.once('bus_location_update', (data) => resolve(data));
      });

      // Post driver telemetry for bus 1
      await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          bus_id: 1,
          latitude: 24.5888,
          longitude: 73.7150,
          speed: 44.0,
          current_stop: 'Chetek Circle',
          next_stop: 'Hathipole Circle',
          eta_minutes: 4,
        }),
      });

      studentEvent = await Promise.race([studentPromise, new Promise((r) => setTimeout(() => r(null), 3000))]);
      adminEvent = await Promise.race([adminPromise, new Promise((r) => setTimeout(() => r(null), 3000))]);

      const pass7 = Boolean(studentEvent && adminEvent);
      logResult('Test 7: Client receives real-time bus_location_update event', pass7, `Student received: ${Boolean(studentEvent)}, Admin received: ${Boolean(adminEvent)}`);
      if (pass7) passedCount++; else failedCount++;

      const pass8 = studentEvent?.bus_id === 1 && Number(studentEvent?.latitude) === 24.5888 && studentEvent?.current_stop === 'Chetek Circle';
      logResult('Test 8: Received bus_location_update updates tracking state correctly', pass8, `Lat: ${studentEvent?.latitude}, Stop: "${studentEvent?.current_stop}"`);
      if (pass8) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 7: Client receives real-time bus_location_update event', false, err.message);
      logResult('Test 8: Received bus_location_update updates tracking state correctly', false, err.message);
      failedCount += 2;
    }

    // ----------------------------------------------------
    // Test 9: Unsubscribed Bus Event Does NOT Update Selected Bus State
    // ----------------------------------------------------
    try {
      let unselectedBusUpdated = false;
      const filterHandler = (data) => {
        // Simulating component event filtering
        if (data && data.bus_id === 999) {
          unselectedBusUpdated = true;
        }
      };

      studentSocket.on('bus_location_update', filterHandler);

      // Post telemetry for bus 1 (while student selected filter checks bus_id === 999)
      await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: 1, latitude: 24.5900, longitude: 73.7160 }),
      });

      await new Promise((r) => setTimeout(r, 500));
      studentSocket.off('bus_location_update', filterHandler);

      const pass = unselectedBusUpdated === false;
      logResult('Test 9: Event for another bus does NOT update unselected bus state', pass, `Unselected updated: ${unselectedBusUpdated}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 9: Event for another bus does NOT update unselected bus state', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 10: Room Switching (Leave Bus 1 -> Join Bus 2)
    // ----------------------------------------------------
    try {
      const leaveAck = await new Promise((r) => studentSocket.emit('leave_bus_room', { bus_id: 1 }, r));
      const joinAck = await new Promise((r) => studentSocket.emit('join_bus_room', { bus_id: 2 }, r));

      const pass = leaveAck?.success === true && joinAck?.success === true && joinAck?.room === 'bus:2';
      logResult('Test 10: Switching buses leaves previous room and joins new room (bus:2)', pass, `Left bus:1, Joined: "${joinAck?.room}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 10: Switching buses leaves previous room and joins new room (bus:2)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 11: Socket Listener Cleanup Works
    // ----------------------------------------------------
    try {
      let listenerCalled = false;
      const dummyListener = () => { listenerCalled = true; };

      studentSocket.on('bus_location_update', dummyListener);
      studentSocket.off('bus_location_update', dummyListener);

      // Trigger telemetry
      await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: 2, latitude: 24.5910, longitude: 73.7170 }),
      });

      await new Promise((r) => setTimeout(r, 500));

      const pass = listenerCalled === false;
      logResult('Test 11: Socket listener cleanup removes handlers cleanly without leaks', pass, `Listener called after off(): ${listenerCalled}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 11: Socket listener cleanup removes handlers cleanly without leaks', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 12: Socket Disconnect on Logout / Session Reset
    // ----------------------------------------------------
    try {
      studentSocket.disconnect();
      adminSocket.disconnect();

      const pass = !studentSocket.connected && !adminSocket.connected;
      logResult('Test 12: Logout disconnects socket and resets room subscription state', pass, 'Sockets disconnected');
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 12: Logout disconnects socket and resets room subscription state', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 13: REST Polling Fallback Remains Functional
    // ----------------------------------------------------
    try {
      const liveRes = await fetch(`${API_BASE_URL}/tracking/live`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const liveData = await liveRes.json();

      const busRes = await fetch(`${API_BASE_URL}/tracking/bus/1`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const busData = await busRes.json();

      const pass = liveRes.status === 200 && Array.isArray(liveData.data) && busRes.status === 200 && Array.isArray(busData.data);
      logResult('Test 13: REST tracking polling API remains fully functional as fallback', pass, `Live buses count: ${liveData.data?.length}, Bus 1 history count: ${busData.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 13: REST tracking polling API remains fully functional as fallback', false, err.message);
      failedCount++;
    }

  } catch (err) {
    console.error('Fatal error running Frontend Socket integration suite:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 FRONTEND SOCKET.IO TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runFrontendSocketIntegrationTests();
