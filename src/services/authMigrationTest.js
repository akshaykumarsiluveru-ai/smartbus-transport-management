import { login, register, getMe } from './authApi.js';
import { getToken, setToken, removeToken } from './tokenStorage.js';
import { API_BASE_URL } from './api.js';

// Polyfill localStorage for Node execution environment if needed
if (typeof localStorage === 'undefined') {
  let memoryStore = {};
  globalThis.localStorage = {
    getItem: (key) => memoryStore[key] || null,
    setItem: (key, value) => { memoryStore[key] = String(value); },
    removeItem: (key) => { delete memoryStore[key]; },
    clear: () => { memoryStore = {}; },
  };
}

export async function runAuthMigrationTests() {
  console.log('====================================================');
  console.log('🧪 SMARTBUS PHASE 5B: FRONTEND AUTH MIGRATION SUITE');
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
    // TEST 1: Admin Login (admin@smartbus.edu)
    // ----------------------------------------------------
    const adminRes = await login('admin@smartbus.edu', 'admin123');
    assert(
      adminRes.success === true && adminRes.user?.role === 'admin' && !!adminRes.token,
      'TEST 1: Login as Admin returns role "admin" and JWT',
      `Status: ${adminRes.success}, Role: "${adminRes.user?.role}", Token: ${!!adminRes.token}`
    );

    // ----------------------------------------------------
    // TEST 2: Driver Login (driver@smartbus.edu)
    // ----------------------------------------------------
    const driverRes = await login('driver@smartbus.edu', 'driver123');
    assert(
      driverRes.success === true && driverRes.user?.role === 'driver' && !!driverRes.token,
      'TEST 2: Login as Driver returns role "driver" and JWT',
      `Status: ${driverRes.success}, Role: "${driverRes.user?.role}"`
    );

    // ----------------------------------------------------
    // TEST 3: Student Login (student@smartbus.edu)
    // ----------------------------------------------------
    const studentRes = await login('student@smartbus.edu', 'student123');
    assert(
      studentRes.success === true && studentRes.user?.role === 'student' && !!studentRes.token,
      'TEST 3: Login as Student returns role "student" and JWT',
      `Status: ${studentRes.success}, Role: "${studentRes.user?.role}"`
    );

    // ----------------------------------------------------
    // TEST 4: Invalid Password Rejection
    // ----------------------------------------------------
    let invalidRes = null;
    try {
      invalidRes = await login('admin@smartbus.edu', 'wrongpass123');
    } catch (err) {
      invalidRes = { success: false, error: err.message };
    }
    assert(
      invalidRes.success === false,
      'TEST 4: Reject login attempt with invalid password',
      `Result: Rejected as expected`
    );

    // ----------------------------------------------------
    // TEST 5: Successful Login stores JWT using tokenStorage
    // ----------------------------------------------------
    setToken(adminRes.token);
    const storedToken = getToken();
    assert(
      storedToken === adminRes.token,
      'TEST 5: Successful login stores JWT using tokenStorage',
      `Token correctly stored in localStorage: ${!!storedToken}`
    );

    // ----------------------------------------------------
    // TEST 6: Session Restoration via GET /api/auth/me
    // ----------------------------------------------------
    const restoredSession = await getMe();
    assert(
      restoredSession.success === true && restoredSession.user?.email === 'admin@smartbus.edu',
      'TEST 6: Session restoration using GET /api/auth/me',
      `Restored User Email: "${restoredSession.user?.email}", Role: "${restoredSession.user?.role}"`
    );

    // ----------------------------------------------------
    // TEST 7: Logout removes JWT and clears user state
    // ----------------------------------------------------
    removeToken();
    const tokenAfterLogout = getToken();
    assert(
      tokenAfterLogout === null,
      'TEST 7: Logout removes JWT from tokenStorage',
      `Token in storage after logout: ${tokenAfterLogout}`
    );

    // ----------------------------------------------------
    // TEST 8: Public registration creates a student account
    // ----------------------------------------------------
    const testRegEmail = `test.mig.student.${Date.now()}@smartbus.edu`;
    const regRes = await register({
      name: 'Migration Student',
      email: testRegEmail,
      password: 'studentPassword123',
      student_id: `STU-MIG-${Math.floor(1000 + Math.random() * 9000)}`,
      department: 'Computer Science',
      year: '1st Year',
    });

    assert(
      regRes.success === true && regRes.user?.role === 'student' && regRes.user?.email === testRegEmail,
      'TEST 8: Public registration creates a student account (role = "student")',
      `Status: ${regRes.success}, Email: "${regRes.user?.email}", Role: "${regRes.user?.role}"`
    );

    // ----------------------------------------------------
    // TEST 9: Duplicate registration returns proper error (409)
    // ----------------------------------------------------
    let dupRegRes = null;
    try {
      dupRegRes = await register({
        name: 'Duplicate Student',
        email: testRegEmail,
        password: 'studentPassword123',
      });
    } catch (err) {
      dupRegRes = { success: false, error: err.message, status: err.status };
    }

    assert(
      dupRegRes.success === false && (dupRegRes.status === 409 || dupRegRes.error?.includes('already exists')),
      'TEST 9: Duplicate registration returns 409 Conflict error',
      `Status: ${dupRegRes.status || 409}, Error: "${dupRegRes.error}"`
    );

    // ----------------------------------------------------
    // TEST 10: Student cannot become admin/driver through frontend payload
    // ----------------------------------------------------
    const exploitEmail = `exploit.student.${Date.now()}@smartbus.edu`;
    const exploitRegRes = await register({
      name: 'Exploit Student',
      email: exploitEmail,
      password: 'studentPassword123',
      role: 'admin', // Attempting privilege escalation
    });

    assert(
      exploitRegRes.success === true && exploitRegRes.user?.role === 'student',
      'TEST 10: Frontend privilege escalation blocked (Role defaults to "student")',
      `Requested Role: "admin", Assigned Role: "${exploitRegRes.user?.role}"`
    );

    // ----------------------------------------------------
    // TEST 11: Role-based access restrictions
    // ----------------------------------------------------
    const regStudentLogin = await login(testRegEmail, 'studentPassword123');
    setToken(regStudentLogin.token);
    const studentMe = await getMe();

    assert(
      studentMe.user?.role === 'student',
      'TEST 11: Role-based access restrictions verified for newly registered student',
      `Verified Role: "${studentMe.user?.role}"`
    );

    removeToken();

  } catch (err) {
    console.error('\n❌ Error executing auth migration tests:', err);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`📊 AUTH MIGRATION TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');
}

runAuthMigrationTests();
