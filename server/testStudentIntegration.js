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

async function runStudentIntegrationTests() {
  console.log('\n====================================================');
  console.log('🧪 SMARTBUS PHASE 5C-3: STUDENT MODULE INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  let studentToken = '';
  let student2Token = '';
  let driverToken = '';
  let adminToken = '';

  let createdComplaintId = null;

  try {
    // ----------------------------------------------------
    // Step 0: Tokens via Login
    // ----------------------------------------------------
    const studentLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'student123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    studentToken = studentLoginData.token || studentLoginData.data?.token || '';

    // Register temporary Student 2 for ownership isolation check
    const student2Email = `student2_${Date.now()}@smartbus.edu`;
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student Two',
        email: student2Email,
        password: 'student123',
        role: 'student',
        department: 'Information Technology',
        year: '2nd Year',
      }),
    });

    const student2LoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: student2Email, password: 'student123' }),
    });
    const student2LoginData = await student2LoginRes.json();
    student2Token = student2LoginData.token || student2LoginData.data?.token || '';

    const driverLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@smartbus.edu', password: 'driver123' }),
    });
    const driverLoginData = await driverLoginRes.json();
    driverToken = driverLoginData.token || driverLoginData.data?.token || '';

    const adminLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token || adminLoginData.data?.token || '';

    // ----------------------------------------------------
    // Test 1: Student Authentication
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && data.user?.role === 'student';
      logResult('Test 1: Student can authenticate and fetch profile', pass, `Status: ${res.status}, Role: ${data.user?.role}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 1: Student can authenticate and fetch profile', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 2: Student Bus Access
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && Array.isArray(data.data);
      logResult('Test 2: Student can access bus listing', pass, `Status: ${res.status}, Buses returned: ${data.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 2: Student can access bus listing', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 3: Student Route Access
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/routes`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && Array.isArray(data.data);
      logResult('Test 3: Student can access route listing', pass, `Status: ${res.status}, Routes returned: ${data.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 3: Student can access route listing', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 4: Student Route Stop Access
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/routes/1/stops`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && Array.isArray(data.data);
      logResult('Test 4: Student can access route stop sequence', pass, `Status: ${res.status}, Stops for Route 1: ${data.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 4: Student can access route stop sequence', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 5: Student Live Tracking Access
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/live`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && Array.isArray(data.data);
      logResult('Test 5: Student can fetch live bus tracking positions', pass, `Status: ${res.status}, Live telemetry entries: ${data.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 5: Student can fetch live bus tracking positions', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 6: Student Bus-Specific Tracking Access
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/bus/1`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && Array.isArray(data.data);
      logResult('Test 6: Student can fetch telemetry history for specific bus', pass, `Status: ${res.status}, Tracking records: ${data.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 6: Student can fetch telemetry history for specific bus', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 7: Student Notice Access
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/notices`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const pass = res.status === 200 && Array.isArray(data.data);
      logResult('Test 7: Student can access published notices', pass, `Status: ${res.status}, Notices count: ${data.data?.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 7: Student can access published notices', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 8: Student Complaint Creation
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          bus_id: 1,
          route_id: 1,
          subject: 'AC cooling inadequate on BUS-101',
          category: 'Bus Condition',
          description: 'The air conditioning was blowing warm air during afternoon transit.',
          priority: 'Medium',
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data?.id) {
        createdComplaintId = data.data.id;
      }
      const pass = res.status === 201 && Boolean(createdComplaintId);
      logResult('Test 8: Student can submit transport complaint', pass, `Status: ${res.status}, Complaint ID: ${createdComplaintId}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 8: Student can submit transport complaint', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 9: Student Complaint Retrieval
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const userComplaints = data.data || [];
      const pass = res.status === 200 && userComplaints.some((c) => c.id === createdComplaintId);
      logResult('Test 9: Student can retrieve own complaint history', pass, `Status: ${res.status}, Total student complaints: ${userComplaints.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 9: Student can retrieve own complaint history', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 10: Complaint Ownership Isolation
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      const data = await res.json();
      const student2Complaints = data.data || [];
      const containsOtherStudentComplaint = student2Complaints.some((c) => c.id === createdComplaintId);
      const pass = res.status === 200 && !containsOtherStudentComplaint;
      logResult('Test 10: Student 2 cannot view Student 1 complaint (Ownership Isolation)', pass, `Student 2 complaints count: ${student2Complaints.length}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 10: Student 2 cannot view Student 1 complaint (Ownership Isolation)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 11: Student Cannot Create Bus (403 Forbidden)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ bus_number: 'BUS-HACK-101', model: 'Illegal', capacity: 50 }),
      });
      const pass = res.status === 403;
      logResult('Test 11: Student bus creation attempt is rejected (403 Forbidden)', pass, `Received ${res.status} Forbidden as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 11: Student bus creation attempt is rejected (403 Forbidden)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 12: Student Cannot Create Route (403 Forbidden)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ route_code: 'R-HACK', name: 'Illegal Route', start_point: 'A', end_point: 'B' }),
      });
      const pass = res.status === 403;
      logResult('Test 12: Student route creation attempt is rejected (403 Forbidden)', pass, `Received ${res.status} Forbidden as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 12: Student route creation attempt is rejected (403 Forbidden)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 13: Student Cannot Create Notice (403 Forbidden)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ title: 'Fake Notice', message: 'Unauthorized announcement' }),
      });
      const pass = res.status === 403;
      logResult('Test 13: Student notice creation attempt is rejected (403 Forbidden)', pass, `Received ${res.status} Forbidden as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 13: Student notice creation attempt is rejected (403 Forbidden)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 14: Student Cannot Start Driver Trip (403 Forbidden)
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
      logResult('Test 14: Student trip start attempt is rejected (403 Forbidden)', pass, `Received ${res.status} Forbidden as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 14: Student trip start attempt is rejected (403 Forbidden)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 15: Student Cannot End Driver Trip (403 Forbidden)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/trips/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ trip_id: 1 }),
      });
      const pass = res.status === 403;
      logResult('Test 15: Student trip end attempt is rejected (403 Forbidden)', pass, `Received ${res.status} Forbidden as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 15: Student trip end attempt is rejected (403 Forbidden)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 16: Missing JWT Rejected (401 Unauthorized)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'No Token', description: 'Test' }),
      });
      const pass = res.status === 401;
      logResult('Test 16: Missing JWT is rejected (401 Unauthorized)', pass, `Received ${res.status} Unauthorized as expected`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 16: Missing JWT is rejected (401 Unauthorized)', false, err.message);
      failedCount++;
    }

    // ----------------------------------------------------
    // Test 17: End-to-End Tracking Visibility
    // ----------------------------------------------------
    try {
      // 1. Driver starts trip
      const startRes = await fetch(`${API_BASE_URL}/trips/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ bus_id: 1, route_id: 1 }),
      });
      const startData = await startRes.json();
      const activeTripId = startData.data?.id;

      // 2. Driver submits telemetry
      await fetch(`${API_BASE_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          bus_id: 1,
          latitude: 24.5900,
          longitude: 73.7000,
          speed: 40.0,
          current_stop: 'Surajpole',
          next_stop: 'Court Circle',
        }),
      });

      // 3. Student fetches live tracking
      const liveRes = await fetch(`${API_BASE_URL}/tracking/live`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const liveData = await liveRes.json();
      const liveList = liveData.data || [];
      const liveBus1 = liveList.find((tr) => tr.bus_id === 1 && tr.is_live);

      // 4. Clean up driver trip
      if (activeTripId) {
        await fetch(`${API_BASE_URL}/trips/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${driverToken}`,
          },
          body: JSON.stringify({ trip_id: activeTripId }),
        });
      }

      const pass = Boolean(liveBus1) && parseFloat(liveBus1.latitude) === 24.5900;
      logResult('Test 17: End-to-End Telemetry (Driver telemetry visible to Student)', pass, `Driver submitted lat 24.5900 -> Student live tracking returned lat ${liveBus1?.latitude}`);
      if (pass) passedCount++; else failedCount++;
    } catch (err) {
      logResult('Test 17: End-to-End Telemetry (Driver telemetry visible to Student)', false, err.message);
      failedCount++;
    }

  } catch (err) {
    console.error('Fatal error in Student integration test suite:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 STUDENT MODULE TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runStudentIntegrationTests();
