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

async function runAdminIntegrationTests() {
  console.log('\n====================================================');
  console.log('🧪 SMARTBUS PHASE 5C-1: ADMIN MODULE INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  let adminToken = '';
  let studentToken = '';
  let driverToken = '';

  let createdBusId = null;
  let createdDriverId = null;
  let createdRouteId = null;
  let createdStopId = null;
  let createdNoticeId = null;

  try {
    // Setup Tokens via Login
    const adminLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token || adminLoginData.data?.token || '';

    const studentLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'student123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    studentToken = studentLoginData.token || studentLoginData.data?.token || '';

    const driverLoginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@smartbus.edu', password: 'driver123' }),
    });
    const driverLoginData = await driverLoginRes.json();
    driverToken = driverLoginData.token || driverLoginData.data?.token || '';

    // 1. Admin can fetch buses
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data)) {
        logResult('Test 1: Admin can fetch buses', true, `Buses count: ${data.data.length}`);
        passedCount++;
      } else {
        logResult('Test 1: Admin can fetch buses', false, `Status ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 1: Admin can fetch buses', false, e.message);
      failedCount++;
    }

    // 2. Admin can create a bus
    const testBusNo = `BUS-INTEG-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          bus_number: testBusNo,
          registration_number: 'RJ-27-IN-9999',
          model: 'Integration Express Bus',
          capacity: 55,
          fuel_type: 'Electric',
          status: 'At Depot',
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data?.id) {
        createdBusId = data.data.id;
        logResult('Test 2: Admin can create a bus', true, `Created Bus ID: ${createdBusId}, Number: ${testBusNo}`);
        passedCount++;
      } else {
        logResult('Test 2: Admin can create a bus', false, `Status ${res.status}: ${data.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 2: Admin can create a bus', false, e.message);
      failedCount++;
    }

    // 3. Admin can update a bus
    try {
      const res = await fetch(`${API_BASE_URL}/buses/${createdBusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          model: 'Integration Express Bus v2',
          capacity: 60,
          status: 'At Depot',
        }),
      });
      const data = await res.json();
      if (res.status === 200 && data.data?.capacity === 60) {
        logResult('Test 3: Admin can update a bus', true, `Updated capacity to ${data.data.capacity}`);
        passedCount++;
      } else {
        logResult('Test 3: Admin can update a bus', false, `Status ${res.status}: ${data.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 3: Admin can update a bus', false, e.message);
      failedCount++;
    }

    // 5. Duplicate bus is rejected appropriately (409 Conflict)
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          bus_number: testBusNo,
          registration_number: 'RJ-27-IN-8888',
          capacity: 40,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        logResult('Test 5: Duplicate bus is rejected appropriately (409 Conflict)', true, `Conflict message: "${data.message}"`);
        passedCount++;
      } else {
        logResult('Test 5: Duplicate bus is rejected appropriately (409 Conflict)', false, `Expected 409, got ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 5: Duplicate bus is rejected appropriately (409 Conflict)', false, e.message);
      failedCount++;
    }

    // 4. Admin can delete a bus
    try {
      const res = await fetch(`${API_BASE_URL}/buses/${createdBusId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200) {
        logResult('Test 4: Admin can delete a bus', true, `Deleted Bus ID: ${createdBusId}`);
        passedCount++;
      } else {
        logResult('Test 4: Admin can delete a bus', false, `Status ${res.status}: ${data.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 4: Admin can delete a bus', false, e.message);
      failedCount++;
    }

    // 6. Admin can fetch drivers
    try {
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data)) {
        logResult('Test 6: Admin can fetch drivers', true, `Drivers count: ${data.data.length}`);
        passedCount++;
      } else {
        logResult('Test 6: Admin can fetch drivers', false, `Status ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 6: Admin can fetch drivers', false, e.message);
      failedCount++;
    }

    // 7. Admin can create/update a driver
    const testEmpId = `EMP-IN-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const createRes = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Integration Test Driver',
          email: `driver.integ.${Date.now()}@smartbus.edu`,
          phone: '+91 99887 76655',
          employee_id: testEmpId,
          license_number: `LIC-${Date.now()}`,
          status: 'Available',
          shift: 'Morning',
        }),
      });
      const createData = await createRes.json();
      if (createRes.status === 201 && createData.data?.id) {
        createdDriverId = createData.data.id;

        // Update driver
        const updateRes = await fetch(`${API_BASE_URL}/drivers/${createdDriverId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            shift: 'Evening',
            phone: '+91 99887 11111',
          }),
        });
        const updateData = await updateRes.json();

        if (updateRes.status === 200 && updateData.data?.shift === 'Evening') {
          logResult('Test 7: Admin can create and update a driver', true, `Created Driver ID: ${createdDriverId}, Shift updated to Evening`);
          passedCount++;
        } else {
          logResult('Test 7: Admin can create and update a driver', false, `Update status ${updateRes.status}`);
          failedCount++;
        }
      } else {
        logResult('Test 7: Admin can create and update a driver', false, `Create status ${createRes.status}: ${createData.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 7: Admin can create and update a driver', false, e.message);
      failedCount++;
    }

    // 8. Admin can assign a driver
    try {
      const res = await fetch(`${API_BASE_URL}/drivers/${createdDriverId}/assignment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assigned_bus_id: 1,
          assigned_route_id: 1,
          shift: 'Morning',
        }),
      });
      const data = await res.json();
      if (res.status === 200 && data.data?.assigned_bus_id === 1) {
        logResult('Test 8: Admin can assign a driver', true, `Assigned Driver ${createdDriverId} to Bus 1 & Route 1`);
        passedCount++;
      } else {
        logResult('Test 8: Admin can assign a driver', false, `Status ${res.status}: ${data.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 8: Admin can assign a driver', false, e.message);
      failedCount++;
    }

    // 9. Admin can delete a driver where rules permit
    try {
      // First unassign driver
      await fetch(`${API_BASE_URL}/drivers/${createdDriverId}/assignment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assigned_bus_id: null,
          assigned_route_id: null,
        }),
      });

      const res = await fetch(`${API_BASE_URL}/drivers/${createdDriverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200) {
        logResult('Test 9: Admin can delete a driver', true, `Deleted Driver ID: ${createdDriverId}`);
        passedCount++;
      } else {
        logResult('Test 9: Admin can delete a driver', false, `Status ${res.status}: ${data.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 9: Admin can delete a driver', false, e.message);
      failedCount++;
    }

    // 10. Admin can fetch routes
    try {
      const res = await fetch(`${API_BASE_URL}/routes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data)) {
        logResult('Test 10: Admin can fetch routes', true, `Routes count: ${data.data.length}`);
        passedCount++;
      } else {
        logResult('Test 10: Admin can fetch routes', false, `Status ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 10: Admin can fetch routes', false, e.message);
      failedCount++;
    }

    // 11. Admin can create/update a route
    const testRouteCode = `R-IN-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const createRes = await fetch(`${API_BASE_URL}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          route_code: testRouteCode,
          name: 'Integration Test Corridor',
          start_point: 'Integration Station A',
          end_point: 'Integration Station B',
          distance_km: 12.5,
          estimated_duration: '30 mins',
          status: 'Active',
        }),
      });
      const createData = await createRes.json();
      if (createRes.status === 201 && createData.data?.id) {
        createdRouteId = createData.data.id;

        const updateRes = await fetch(`${API_BASE_URL}/routes/${createdRouteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            estimated_duration: '35 mins',
            distance_km: 14.0,
          }),
        });
        const updateData = await updateRes.json();

        if (updateRes.status === 200 && parseFloat(updateData.data?.distance_km) === 14.0) {
          logResult('Test 11: Admin can create and update a route', true, `Created Route ID: ${createdRouteId}, Updated distance to 14.0 km`);
          passedCount++;
        } else {
          logResult('Test 11: Admin can create and update a route', false, `Update status ${updateRes.status}`);
          failedCount++;
        }
      } else {
        logResult('Test 11: Admin can create and update a route', false, `Create status ${createRes.status}: ${createData.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 11: Admin can create and update a route', false, e.message);
      failedCount++;
    }

    // 13. Admin can fetch route stops
    try {
      const res = await fetch(`${API_BASE_URL}/routes/${createdRouteId}/stops`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data)) {
        logResult('Test 13: Admin can fetch route stops', true, `Initial stops count: ${data.data.length}`);
        passedCount++;
      } else {
        logResult('Test 13: Admin can fetch route stops', false, `Status ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 13: Admin can fetch route stops', false, e.message);
      failedCount++;
    }

    // 14. Admin can create, update, and delete a route stop
    try {
      const createStopRes = await fetch(`${API_BASE_URL}/routes/${createdRouteId}/stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          stop_name: 'Test Intermediate Stop',
          latitude: 24.5800,
          longitude: 73.6950,
          stop_order: 1,
          scheduled_arrival: '08:15 AM',
        }),
      });
      const createStopData = await createStopRes.json();

      if (createStopRes.status === 201 && createStopData.data?.id) {
        createdStopId = createStopData.data.id;

        // Update stop
        const updateStopRes = await fetch(`${API_BASE_URL}/routes/${createdRouteId}/stops/${createdStopId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            stop_name: 'Updated Intermediate Stop',
            scheduled_arrival: '08:20 AM',
          }),
        });
        const updateStopData = await updateStopRes.json();

        // Delete stop
        const deleteStopRes = await fetch(`${API_BASE_URL}/routes/${createdRouteId}/stops/${createdStopId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (createStopRes.status === 201 && updateStopRes.status === 200 && deleteStopRes.status === 200) {
          logResult('Test 14: Admin can create, update, and delete a route stop', true, `Created Stop ${createdStopId}, updated, and deleted`);
          passedCount++;
        } else {
          logResult('Test 14: Admin can create, update, and delete a route stop', false, `Create ${createStopRes.status}, Update ${updateStopRes.status}, Delete ${deleteStopRes.status}`);
          failedCount++;
        }
      } else {
        logResult('Test 14: Admin can create, update, and delete a route stop', false, `Create stop status ${createStopRes.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 14: Admin can create, update, and delete a route stop', false, e.message);
      failedCount++;
    }

    // 12. Admin can delete a route
    try {
      const res = await fetch(`${API_BASE_URL}/routes/${createdRouteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200) {
        logResult('Test 12: Admin can delete a route', true, `Deleted Route ID: ${createdRouteId}`);
        passedCount++;
      } else {
        logResult('Test 12: Admin can delete a route', false, `Status ${res.status}: ${data.message}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 12: Admin can delete a route', false, e.message);
      failedCount++;
    }

    // 15. Admin can fetch notices
    try {
      const res = await fetch(`${API_BASE_URL}/notices`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data)) {
        logResult('Test 15: Admin can fetch notices', true, `Notices count: ${data.data.length}`);
        passedCount++;
      } else {
        logResult('Test 15: Admin can fetch notices', false, `Status ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 15: Admin can fetch notices', false, e.message);
      failedCount++;
    }

    // 16. Admin can create, update, and delete notices
    try {
      const createRes = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Integration Test Advisory',
          message: 'Campus route maintenance scheduled for upcoming weekend.',
          type: 'Schedule Advisory',
          target: 'All Students',
        }),
      });
      const createData = await createRes.json();

      if (createRes.status === 201 && createData.data?.id) {
        createdNoticeId = createData.data.id;

        const updateRes = await fetch(`${API_BASE_URL}/notices/${createdNoticeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            title: 'Updated Integration Test Advisory',
            type: 'Route Change',
          }),
        });

        const deleteRes = await fetch(`${API_BASE_URL}/notices/${createdNoticeId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (createRes.status === 201 && updateRes.status === 200 && deleteRes.status === 200) {
          logResult('Test 16: Admin can create, update, and delete notices', true, `Notice ${createdNoticeId} created, updated, and deleted`);
          passedCount++;
        } else {
          logResult('Test 16: Admin can create, update, and delete notices', false, `Create ${createRes.status}, Update ${updateRes.status}, Delete ${deleteRes.status}`);
          failedCount++;
        }
      } else {
        logResult('Test 16: Admin can create, update, and delete notices', false, `Create status ${createRes.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 16: Admin can create, update, and delete notices', false, e.message);
      failedCount++;
    }

    // 17. Student cannot perform Admin mutations (403 Forbidden)
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          bus_number: 'BUS-FORBIDDEN-01',
          registration_number: 'RJ-27-PA-0001',
          capacity: 40,
        }),
      });
      if (res.status === 403) {
        logResult('Test 17: Student cannot perform Admin mutations (403 Forbidden)', true, 'Received 403 Forbidden as expected');
        passedCount++;
      } else {
        logResult('Test 17: Student cannot perform Admin mutations (403 Forbidden)', false, `Expected 403, got ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 17: Student cannot perform Admin mutations (403 Forbidden)', false, e.message);
      failedCount++;
    }

    // 18. Driver cannot perform Admin mutations (403 Forbidden)
    try {
      const res = await fetch(`${API_BASE_URL}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          route_code: 'R-FORBIDDEN-01',
          name: 'Forbidden Route',
          start_point: 'A',
          end_point: 'B',
        }),
      });
      if (res.status === 403) {
        logResult('Test 18: Driver cannot perform Admin mutations (403 Forbidden)', true, 'Received 403 Forbidden as expected');
        passedCount++;
      } else {
        logResult('Test 18: Driver cannot perform Admin mutations (403 Forbidden)', false, `Expected 403, got ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 18: Driver cannot perform Admin mutations (403 Forbidden)', false, e.message);
      failedCount++;
    }

    // 19. Missing JWT is rejected (401 Unauthorized)
    try {
      const res = await fetch(`${API_BASE_URL}/buses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_number: 'BUS-NOJWT-01',
          registration_number: 'RJ-27-PA-0000',
        }),
      });
      if (res.status === 401) {
        logResult('Test 19: Missing JWT is rejected (401 Unauthorized)', true, 'Received 401 Unauthorized as expected');
        passedCount++;
      } else {
        logResult('Test 19: Missing JWT is rejected (401 Unauthorized)', false, `Expected 401, got ${res.status}`);
        failedCount++;
      }
    } catch (e) {
      logResult('Test 19: Missing JWT is rejected (401 Unauthorized)', false, e.message);
      failedCount++;
    }

  } catch (err) {
    console.error('Fatal error in integration test suite:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 ADMIN MODULE TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAdminIntegrationTests();
