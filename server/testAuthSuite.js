import jwt from 'jsonwebtoken';
import { authorizeRoles } from './middleware/authMiddleware.js';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 SMARTBUS PHASE 2: AUTHENTICATION & JWT TEST SUITE');
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
    // Test A: Health Check GET /api/health
    // ----------------------------------------------------
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.success === true,
      'Test A: GET /api/health',
      `Status: ${healthRes.status}, Message: "${healthData.message}"`
    );

    // ----------------------------------------------------
    // Test B: Login with Valid Admin Credentials
    // ----------------------------------------------------
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(
      adminLoginRes.status === 200 && adminLoginData.user?.role === 'admin' && !!adminToken,
      'Test B: Login with Valid Admin Credentials',
      `Status: ${adminLoginRes.status}, Role: "${adminLoginData.user?.role}", Token issued: ${!!adminToken}`
    );

    // ----------------------------------------------------
    // Test C: Login with Valid Driver Credentials
    // ----------------------------------------------------
    const driverLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@smartbus.edu', password: 'driver123' }),
    });
    const driverLoginData = await driverLoginRes.json();
    const driverToken = driverLoginData.token;
    assert(
      driverLoginRes.status === 200 && driverLoginData.user?.role === 'driver' && !!driverToken,
      'Test C: Login with Valid Driver Credentials',
      `Status: ${driverLoginRes.status}, Role: "${driverLoginData.user?.role}"`
    );

    // ----------------------------------------------------
    // Test D: Login with Valid Student Credentials
    // ----------------------------------------------------
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'student123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.token;
    assert(
      studentLoginRes.status === 200 && studentLoginData.user?.role === 'student' && !!studentToken,
      'Test D: Login with Valid Student Credentials',
      `Status: ${studentLoginRes.status}, Role: "${studentLoginData.user?.role}"`
    );

    // ----------------------------------------------------
    // Test E: Login with Incorrect Password
    // ----------------------------------------------------
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'wrongpassword' }),
    });
    const badLoginData = await badLoginRes.json();
    assert(
      badLoginRes.status === 401 && badLoginData.success === false,
      'Test E: Reject Login with Incorrect Password',
      `Status: ${badLoginRes.status}, Response message: "${badLoginData.message}"`
    );

    // ----------------------------------------------------
    // Test F: Access GET /api/auth/me WITH Valid JWT
    // ----------------------------------------------------
    const meValidRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meValidData = await meValidRes.json();
    assert(
      meValidRes.status === 200 && meValidData.user?.email === 'admin@smartbus.edu' && !meValidData.user?.password_hash,
      'Test F: Access /api/auth/me with Valid JWT',
      `Status: ${meValidRes.status}, User name: "${meValidData.user?.name}", password_hash omitted: ${!meValidData.user?.password_hash}`
    );

    // ----------------------------------------------------
    // Test G: Access GET /api/auth/me WITHOUT JWT
    // ----------------------------------------------------
    const meNoTokenRes = await fetch(`${BASE_URL}/api/auth/me`);
    const meNoTokenData = await meNoTokenRes.json();
    assert(
      meNoTokenRes.status === 401 && meNoTokenData.success === false,
      'Test G: Reject /api/auth/me Request Without Token',
      `Status: ${meNoTokenRes.status}, Message: "${meNoTokenData.message}"`
    );

    // ----------------------------------------------------
    // Test H: Register New Student
    // ----------------------------------------------------
    const newStudentEmail = `test.student.${Date.now()}@smartbus.edu`;
    const newStudentId = `STU-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Karan Sharma',
        email: newStudentEmail,
        password: 'securePassword123',
        student_id: newStudentId,
        department: 'Mechanical Engineering',
        year: '1st Year',
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.user?.role === 'student' && regData.user?.email === newStudentEmail && !regData.user?.password_hash,
      'Test H: Register New Student Account',
      `Status: ${regRes.status}, Registered Role: "${regData.user?.role}", Pass ID: "${regData.user?.digital_pass_id}"`
    );

    // ----------------------------------------------------
    // Test I: Attempt Duplicate Email Registration
    // ----------------------------------------------------
    const dupRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Karan Copy',
        email: newStudentEmail,
        password: 'securePassword123',
      }),
    });
    const dupRegData = await dupRegRes.json();
    assert(
      dupRegRes.status === 409 && dupRegData.success === false,
      'Test I: Reject Duplicate Email Registration',
      `Status: ${dupRegRes.status}, Message: "${dupRegData.message}"`
    );

    // ----------------------------------------------------
    // Test J: Verify Registered Password Authentication
    // ----------------------------------------------------
    const newStudentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newStudentEmail, password: 'securePassword123' }),
    });
    const newStudentLoginData = await newStudentLoginRes.json();
    assert(
      newStudentLoginRes.status === 200 && !!newStudentLoginData.token,
      'Test J: Verify Registered User Password Verification via Bcrypt',
      `Status: ${newStudentLoginRes.status}, Token received for newly registered user`
    );

    // ----------------------------------------------------
    // Test K: Verify JWT Payload Contains Only Safe Claims
    // ----------------------------------------------------
    const decodedToken = jwt.decode(adminToken);
    const hasOnlySafeClaims =
      decodedToken.id &&
      decodedToken.email &&
      decodedToken.role &&
      decodedToken.name &&
      !decodedToken.password_hash &&
      !decodedToken.password;
    assert(
      hasOnlySafeClaims,
      'Test K: Verify JWT Payload Contains Only Safe Identity Claims',
      `Claims present: [id: ${decodedToken.id}, email: "${decodedToken.email}", role: "${decodedToken.role}"], password_hash present: false`
    );

    // ----------------------------------------------------
    // Test L: Verify Role Authorization Middleware
    // ----------------------------------------------------
    let adminRoleAllowed = false;
    let studentRoleBlocked = false;

    const mockAdminReq = { user: { role: 'admin' } };
    const mockStudentReq = { user: { role: 'student' } };
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.body = obj;
        return this;
      },
    };

    const adminGuard = authorizeRoles('admin');
    adminGuard(mockAdminReq, mockRes, () => {
      adminRoleAllowed = true;
    });

    adminGuard(mockStudentReq, mockRes, () => {});
    if (mockRes.statusCode === 403) {
      studentRoleBlocked = true;
    }

    assert(
      adminRoleAllowed && studentRoleBlocked,
      'Test L: Verify Role Authorization Middleware (authorizeRoles)',
      `Admin access: ${adminRoleAllowed ? 'Allowed (Next)' : 'Failed'}, Student access to Admin route: ${studentRoleBlocked ? 'Blocked (403 Forbidden)' : 'Failed'}`
    );

  } catch (err) {
    console.error('\n❌ Error executing test suite:', err);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');
}

runTests();
