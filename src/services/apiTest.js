import { login, getMe } from './authApi.js';
import { getBuses } from './busApi.js';
import { setToken, getToken, removeToken } from './tokenStorage.js';
import { API_BASE_URL, ApiError } from './api.js';

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

export async function runFrontendApiLayerTests() {
  console.log('====================================================');
  console.log('🧪 SMARTBUS PHASE 5A: FRONTEND API LAYER VERIFICATION');
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
    // Verification 1: API Base URL Resolves Correctly
    // ----------------------------------------------------
    assert(
      typeof API_BASE_URL === 'string' && API_BASE_URL.includes('/api'),
      'Verification 1: API Base URL Resolves Correctly',
      `Base URL: "${API_BASE_URL}"`
    );

    // ----------------------------------------------------
    // Verification 2: Login request reaches POST /api/auth/login
    // ----------------------------------------------------
    const loginResponse = await login('admin@smartbus.edu', 'admin123');
    assert(
      loginResponse.success === true && !!loginResponse.token && loginResponse.user?.role === 'admin',
      'Verification 2: Login Request Reaches POST /api/auth/login',
      `Status: Success, Issued Role: "${loginResponse.user?.role}"`
    );

    // ----------------------------------------------------
    // Verification 3: JWT token storage & attachment
    // ----------------------------------------------------
    setToken(loginResponse.token);
    const storedToken = getToken();
    assert(
      storedToken === loginResponse.token,
      'Verification 3: JWT Token Storage & Attachment',
      `Token saved and retrieved from storage: ${!!storedToken}`
    );

    // ----------------------------------------------------
    // Verification 4: GET /api/auth/me called with token
    // ----------------------------------------------------
    const meResponse = await getMe();
    assert(
      meResponse.success === true && meResponse.user?.email === 'admin@smartbus.edu',
      'Verification 4: GET /api/auth/me Executed with Bearer Token',
      `Authenticated User Email: "${meResponse.user?.email}"`
    );

    // ----------------------------------------------------
    // Verification 5: GET /api/buses called with token
    // ----------------------------------------------------
    const busesResponse = await getBuses();
    assert(
      busesResponse.success === true && Array.isArray(busesResponse.data),
      'Verification 5: GET /api/buses Executed with Bearer Token',
      `Total Buses Returned: ${busesResponse.data?.length}`
    );

    // ----------------------------------------------------
    // Verification 6: Structured API Error Handling
    // ----------------------------------------------------
    let caughtApiError = null;
    try {
      await login('invalid.user@smartbus.edu', 'wrongpassword');
    } catch (err) {
      caughtApiError = err;
    }

    assert(
      caughtApiError instanceof ApiError && caughtApiError.status === 401,
      'Verification 6: API Errors Correctly Surfaced as ApiError Instances',
      `Status: ${caughtApiError?.status}, Error Message: "${caughtApiError?.message}"`
    );

    // Clean up test token
    removeToken();

  } catch (err) {
    console.error('\n❌ Error executing API layer verification:', err);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`📊 FRONTEND API LAYER SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');
}

runFrontendApiLayerTests();
