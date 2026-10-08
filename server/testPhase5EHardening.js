import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

let passedCount = 0;
let failedCount = 0;

function logResult(testName, pass, details = '') {
  if (pass) {
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`   └─ ${details}`);
    passedCount++;
  } else {
    console.log(`❌ [FAIL] ${testName}`);
    if (details) console.log(`   └─ Error: ${details}`);
    failedCount++;
  }
}

async function runPhase5EHardeningTests() {
  console.log('====================================================');
  console.log('🧪 SMARTBUS PHASE 5E: PRODUCTION HARDENING TEST SUITE');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // Category 1: Health Check & System Baseline
    // ----------------------------------------------------
    const healthRes = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthRes.json();
    logResult(
      'Test 1: Backend Health Check & MySQL connectivity',
      healthRes.status === 200 && healthData.success === true,
      `Status: ${healthRes.status}, Message: "${healthData.message}"`
    );

    // ----------------------------------------------------
    // Category 2: Auth Edge-Cases & Input Hardening
    // ----------------------------------------------------
    // Registration missing email
    const regNoEmail = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', password: 'password123' }),
    });
    logResult(
      'Test 2: Registration missing email is rejected (400 Bad Request)',
      regNoEmail.status === 400,
      `Status: ${regNoEmail.status}`
    );

    // Registration invalid email format
    const regBadEmail = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'not-an-email', password: 'password123' }),
    });
    logResult(
      'Test 3: Registration invalid email format is rejected (400 Bad Request)',
      regBadEmail.status === 400,
      `Status: ${regBadEmail.status}`
    );

    // Registration short password
    const regShortPw = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'shortpw@test.com', password: '123' }),
    });
    logResult(
      'Test 4: Registration short password (<6 chars) is rejected (400 Bad Request)',
      regShortPw.status === 400,
      `Status: ${regShortPw.status}`
    );

    // Login missing credentials
    const loginNoCreds = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    logResult(
      'Test 5: Login missing credentials is rejected (400 Bad Request)',
      loginNoCreds.status === 400,
      `Status: ${loginNoCreds.status}`
    );

    // Login wrong password
    const loginWrongPw = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'wrongpassword' }),
    });
    logResult(
      'Test 6: Login wrong password is rejected (401 Unauthorized)',
      loginWrongPw.status === 401,
      `Status: ${loginWrongPw.status}`
    );

    // Malformed JWT token
    const malformedJwtRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer malformed.jwt.token.here' },
    });
    logResult(
      'Test 7: Malformed JWT token is rejected (401 Unauthorized)',
      malformedJwtRes.status === 401,
      `Status: ${malformedJwtRes.status}`
    );

    // ----------------------------------------------------
    // Category 3: Session Flow & Authentication Lifecycle
    // ----------------------------------------------------
    // 1. Authenticate admin, driver, student
    const adminLogin = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.token;

    const driverLogin = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@smartbus.edu', password: 'driver123' }),
    });
    const driverData = await driverLogin.json();
    const driverToken = driverData.token;

    const studentLogin = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'student123' }),
    });
    const studentData = await studentLogin.json();
    const studentToken = studentData.token;

    logResult(
      'Test 8: Session tokens obtained for Admin, Driver, and Student roles',
      Boolean(adminToken && driverToken && studentToken),
      `Admin ID: ${adminData.user?.id}, Driver ID: ${driverData.user?.id}, Student ID: ${studentData.user?.id}`
    );

    // GET /api/auth/me session verification
    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();
    logResult(
      'Test 9: GET /api/auth/me succeeds with valid token and excludes password_hash',
      meRes.status === 200 && meData.user?.email === 'student@smartbus.edu' && meData.user?.password_hash === undefined,
      `User Email: ${meData.user?.email}`
    );

    // ----------------------------------------------------
    // Category 4: Role Authorization & RBAC Enforcement
    // ----------------------------------------------------
    // Student bus creation blocked
    const studentCreateBus = await fetch(`${API_BASE_URL}/buses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ bus_number: 'HACK-01', model: 'Model X', capacity: 30 }),
    });
    logResult(
      'Test 10: Student bus creation attempt is blocked (403 Forbidden)',
      studentCreateBus.status === 403,
      `Status: ${studentCreateBus.status}`
    );

    // Student route creation blocked
    const studentCreateRoute = await fetch(`${API_BASE_URL}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ route_code: 'R-HACK', name: 'Illegal Route' }),
    });
    logResult(
      'Test 11: Student route creation attempt is blocked (403 Forbidden)',
      studentCreateRoute.status === 403,
      `Status: ${studentCreateRoute.status}`
    );

    // Student trip start blocked
    const studentStartTrip = await fetch(`${API_BASE_URL}/trips/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ bus_id: 1, route_id: 1 }),
    });
    logResult(
      'Test 12: Student trip start attempt is blocked (403 Forbidden)',
      studentStartTrip.status === 403,
      `Status: ${studentStartTrip.status}`
    );

    // Student telemetry update blocked
    const studentTelemetry = await fetch(`${API_BASE_URL}/tracking/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ bus_id: 1, latitude: 24.5800, longitude: 73.7000 }),
    });
    logResult(
      'Test 13: Student telemetry update attempt is blocked (403 Forbidden)',
      studentTelemetry.status === 403,
      `Status: ${studentTelemetry.status}`
    );

    // ----------------------------------------------------
    // Category 5: Database Edge-Cases & Entity Validation
    // ----------------------------------------------------
    // Non-existent bus query
    const nonExistentBus = await fetch(`${API_BASE_URL}/buses/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logResult(
      'Test 14: Querying non-existent bus ID returns 404 Not Found',
      nonExistentBus.status === 404,
      `Status: ${nonExistentBus.status}`
    );

    // Bus creation missing bus_number
    const busNoNum = await fetch(`${API_BASE_URL}/buses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ model: 'Express Bus', capacity: 40 }),
    });
    logResult(
      'Test 15: Bus creation missing bus_number returns 400 Bad Request',
      busNoNum.status === 400,
      `Status: ${busNoNum.status}`
    );

    // Duplicate bus number
    const dupBus = await fetch(`${API_BASE_URL}/buses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ bus_number: 'BUS-101', model: 'Duplicate Bus', capacity: 50 }),
    });
    logResult(
      'Test 16: Duplicate bus_number creation returns 409 Conflict',
      dupBus.status === 409,
      `Status: ${dupBus.status}`
    );

    // ----------------------------------------------------
    // Category 6: Telemetry Input Hardening
    // ----------------------------------------------------
    // Invalid latitude (>90)
    const badLat = await fetch(`${API_BASE_URL}/tracking/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ bus_id: 1, latitude: 120.0, longitude: 73.7000, speed: 25.0 }),
    });
    logResult(
      'Test 17: Telemetry update with latitude out of range (>90) returns 400 Bad Request',
      badLat.status === 400,
      `Status: ${badLat.status}`
    );

    // Invalid longitude (<-180)
    const badLng = await fetch(`${API_BASE_URL}/tracking/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ bus_id: 1, latitude: 24.5800, longitude: -200.0, speed: 25.0 }),
    });
    logResult(
      'Test 18: Telemetry update with longitude out of range (<-180) returns 400 Bad Request',
      badLng.status === 400,
      `Status: ${badLng.status}`
    );

    // Invalid negative speed
    const badSpeed = await fetch(`${API_BASE_URL}/tracking/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ bus_id: 1, latitude: 24.5800, longitude: 73.7000, speed: -50.0 }),
    });
    logResult(
      'Test 19: Telemetry update with negative speed returns 400 Bad Request',
      badSpeed.status === 400,
      `Status: ${badSpeed.status}`
    );

    // ----------------------------------------------------
    // Category 7: Socket.IO Authentication & Isolation
    // ----------------------------------------------------
    let socket1 = null;
    let socket2 = null;

    try {
      socket1 = io(SOCKET_URL, {
        auth: { token: `Bearer ${studentToken}` },
        transports: ['websocket'],
      });

      socket2 = io(SOCKET_URL, {
        auth: { token: `Bearer ${driverToken}` },
        transports: ['websocket'],
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const s1Connected = socket1.connected;
      const s2Connected = socket2.connected;

      logResult(
        'Test 20: Socket.IO connections established with valid Student and Driver JWTs',
        s1Connected && s2Connected,
        `Student socket connected: ${s1Connected}, Driver socket connected: ${s2Connected}`
      );
    } finally {
      if (socket1) socket1.disconnect();
      if (socket2) socket2.disconnect();
    }

  } catch (err) {
    console.error('Fatal error in Phase 5E Hardening suite:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 PHASE 5E HARDENING SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase5EHardeningTests();
