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

async function runSocketInfrastructureTests() {
  console.log('\n====================================================');
  console.log('🧪 SMARTBUS PHASE 5D-1: SOCKET.IO INFRASTRUCTURE TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  let adminToken = '';
  let driverToken = '';
  let studentToken = '';

  try {
    // ----------------------------------------------------
    // Step 0: Setup Tokens via REST Login
    // ----------------------------------------------------
    const adminLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token || adminLoginData.data?.token || '';

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

    // ----------------------------------------------------
    // Test 1: Socket.IO Server Starts & Listens
    // ----------------------------------------------------
    try {
      const conn = await connectSocketWithToken(adminToken);
      const pass = conn.success === true && Boolean(conn.socket?.id);
      logResult('Test 1: Socket.IO server is running and accepting connections', pass, `Socket ID: ${conn.socket?.id}`);
      if (pass) passedCount++; else failedCount++;
      if (conn.socket) conn.socket.disconnect();
    } catch (err) {
      logResult('Test 1: Socket.IO server is running and accepting connections', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 2: Valid Admin JWT Can Connect
    // ----------------------------------------------------
    let adminSocket = null;
    try {
      const conn = await connectSocketWithToken(adminToken);
      adminSocket = conn.socket;
      const pass = conn.success === true;
      logResult('Test 2: Valid Admin JWT can establish Socket.IO connection', pass, `Connected: ${conn.success}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 2: Valid Admin JWT can establish Socket.IO connection', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 3: Valid Driver JWT Can Connect
    // ----------------------------------------------------
    let driverSocket = null;
    try {
      const conn = await connectSocketWithToken(driverToken);
      driverSocket = conn.socket;
      const pass = conn.success === true;
      logResult('Test 3: Valid Driver JWT can establish Socket.IO connection', pass, `Connected: ${conn.success}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 3: Valid Driver JWT can establish Socket.IO connection', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 4: Valid Student JWT Can Connect
    // ----------------------------------------------------
    let studentSocket = null;
    try {
      const conn = await connectSocketWithToken(studentToken);
      studentSocket = conn.socket;
      const pass = conn.success === true;
      logResult('Test 4: Valid Student JWT can establish Socket.IO connection', pass, `Connected: ${conn.success}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 4: Valid Student JWT can establish Socket.IO connection', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 5: Missing JWT Is Rejected
    // ----------------------------------------------------
    try {
      const conn = await connectSocketWithToken('');
      const pass = conn.success === false && conn.error?.message?.includes('SOCKET_AUTH_REQUIRED');
      logResult('Test 5: Missing JWT connection attempt is rejected', pass, `Error message: "${conn.error?.message}"`);
      if (pass) passedCount++; else failedCount++;
      if (conn.socket) conn.socket.disconnect();
    } catch (err) {
      logResult('Test 5: Missing JWT connection attempt is rejected', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 6: Invalid JWT Is Rejected
    // ----------------------------------------------------
    try {
      const conn = await connectSocketWithToken('invalid_malformed_token_123');
      const pass = conn.success === false && conn.error?.message?.includes('SOCKET_AUTH_INVALID');
      logResult('Test 6: Invalid/malformed JWT connection attempt is rejected', pass, `Error message: "${conn.error?.message}"`);
      if (pass) passedCount++; else failedCount++;
      if (conn.socket) conn.socket.disconnect();
    } catch (err) {
      logResult('Test 6: Invalid/malformed JWT connection attempt is rejected', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 7: Student Can Join Valid Bus Room
    // ----------------------------------------------------
    try {
      const res = await new Promise((resolve) => {
        studentSocket.emit('join_bus_room', { bus_id: 1 }, (ack) => {
          resolve(ack);
        });
      });
      const pass = res?.success === true && res?.room === 'bus:1';
      logResult('Test 7: Student can join valid bus room (bus:1)', pass, `Room joined: "${res?.room}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 7: Student can join valid bus room (bus:1)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 8: Admin Can Join Valid Bus Room
    // ----------------------------------------------------
    try {
      const res = await new Promise((resolve) => {
        adminSocket.emit('join_bus_room', { bus_id: 1 }, (ack) => {
          resolve(ack);
        });
      });
      const pass = res?.success === true && res?.room === 'bus:1';
      logResult('Test 8: Admin can join valid bus room (bus:1)', pass, `Room joined: "${res?.room}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 8: Admin can join valid bus room (bus:1)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 9: Driver Can Join Assigned Bus Room
    // ----------------------------------------------------
    try {
      const res = await new Promise((resolve) => {
        driverSocket.emit('join_bus_room', { bus_id: 1 }, (ack) => {
          resolve(ack);
        });
      });
      const pass = res?.success === true && res?.room === 'bus:1';
      logResult('Test 9: Driver can join assigned bus room (bus:1)', pass, `Room joined: "${res?.room}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 9: Driver can join assigned bus room (bus:1)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 10: Driver Cannot Join Unassigned Bus Room
    // ----------------------------------------------------
    try {
      const res = await new Promise((resolve) => {
        driverSocket.emit('join_bus_room', { bus_id: 2 }, (ack) => {
          resolve(ack);
        });
      });
      const pass = res?.success === false && res?.code === 'BUS_ROOM_FORBIDDEN';
      logResult('Test 10: Driver joining unassigned bus room (bus:2) is rejected (BUS_ROOM_FORBIDDEN)', pass, `Message: "${res?.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 10: Driver joining unassigned bus room (bus:2) is rejected (BUS_ROOM_FORBIDDEN)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 11: Invalid Bus ID Is Rejected
    // ----------------------------------------------------
    try {
      const res = await new Promise((resolve) => {
        studentSocket.emit('join_bus_room', { bus_id: 999999 }, (ack) => {
          resolve(ack);
        });
      });
      const pass = res?.success === false && res?.code === 'BUS_NOT_FOUND';
      logResult('Test 11: Non-existent bus ID room join is rejected (BUS_NOT_FOUND)', pass, `Message: "${res?.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 11: Non-existent bus ID room join is rejected (BUS_NOT_FOUND)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 12: Missing Bus ID Payload Is Rejected
    // ----------------------------------------------------
    try {
      const res = await new Promise((resolve) => {
        studentSocket.emit('join_bus_room', {}, (ack) => {
          resolve(ack);
        });
      });
      const pass = res?.success === false && res?.code === 'INVALID_PAYLOAD';
      logResult('Test 12: Missing bus_id payload is rejected (INVALID_PAYLOAD)', pass, `Message: "${res?.message}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 12: Missing bus_id payload is rejected (INVALID_PAYLOAD)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 13: Leave Bus Room Works
    // ----------------------------------------------------
    try {
      const res = await new Promise((resolve) => {
        studentSocket.emit('leave_bus_room', { bus_id: 1 }, (ack) => {
          resolve(ack);
        });
      });
      const pass = res?.success === true && res?.room === 'bus:1';
      logResult('Test 13: Leave bus room works cleanly', pass, `Left room: "${res?.room}"`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 13: Leave bus room works cleanly', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 14: Socket Disconnect Works Cleanly
    // ----------------------------------------------------
    try {
      adminSocket.disconnect();
      driverSocket.disconnect();
      studentSocket.disconnect();
      const pass = !adminSocket.connected && !driverSocket.connected && !studentSocket.connected;
      logResult('Test 14: Sockets disconnect cleanly without server errors', pass, 'All sockets disconnected');
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 14: Sockets disconnect cleanly without server errors', false, err.message);
      failedCount++;
    }

  } catch (err) {
    console.error('Fatal error running Socket.IO infrastructure suite:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 SOCKET.IO INFRASTRUCTURE SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSocketInfrastructureTests();
