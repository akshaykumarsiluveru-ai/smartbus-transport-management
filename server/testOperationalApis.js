import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';

async function runOperationalApiTests() {
  console.log('====================================================');
  console.log('🧪 SMARTBUS PHASE 4: OPERATIONAL APIs TEST SUITE');
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
    // Step 0: Acquire Auth Tokens (Admin, Driver 1, Student 1, Student 2)
    // ----------------------------------------------------
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartbus.edu', password: 'admin123' }),
    });
    const adminToken = (await adminLoginRes.json()).token;

    const driverLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@smartbus.edu', password: 'driver123' }),
    });
    const driverToken = (await driverLoginRes.json()).token;

    const student1LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@smartbus.edu', password: 'student123' }),
    });
    const student1Token = (await student1LoginRes.json()).token;

    const student2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@smartbus.edu', password: 'student123' }),
    });
    const student2Token = (await student2LoginRes.json()).token;

    // Ensure driver is assigned to Bus 1 and Route 1
    await fetch(`${BASE_URL}/api/drivers/1/assignment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ assigned_bus_id: 1, assigned_route_id: 1 }),
    });

    // Make sure Bus 1 status is At Depot and Driver 1 status is Available before test start
    await fetch(`${BASE_URL}/api/buses/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'At Depot' }),
    });

    await fetch(`${BASE_URL}/api/drivers/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Available' }),
    });

    // ----------------------------------------------------
    // Test A: Admin can view trip history
    // ----------------------------------------------------
    const tripsRes = await fetch(`${BASE_URL}/api/trips`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const tripsData = await tripsRes.json();
    assert(
      tripsRes.status === 200 && Array.isArray(tripsData.data),
      'Test A: Admin can view trip history',
      `Status: ${tripsRes.status}, Total trips returned: ${tripsData.data?.length}`
    );

    // ----------------------------------------------------
    // Test B & C: Driver can start assigned trip
    // ----------------------------------------------------
    const startTripRes = await fetch(`${BASE_URL}/api/trips/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ bus_id: 1, route_id: 1, passenger_count: 5 }),
    });
    const startTripData = await startTripRes.json();
    const createdTripId = startTripData.data?.id;

    assert(
      startTripRes.status === 201 && startTripData.data?.bus_id == 1 && startTripData.data?.status === 'In Transit',
      'Test B & C: Driver can start assigned trip (Trip created correctly)',
      `Status: ${startTripRes.status}, Trip ID: ${createdTripId}, Trip Code: "${startTripData.data?.trip_code}"`
    );

    // ----------------------------------------------------
    // Test D & E: Bus changes to In Transit & Driver changes to On Trip
    // ----------------------------------------------------
    const getBusRes = await fetch(`${BASE_URL}/api/buses/1`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const busObj = (await getBusRes.json()).data;

    const getDriverRes = await fetch(`${BASE_URL}/api/drivers/1`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const driverObj = (await getDriverRes.json()).data;

    assert(
      busObj.status === 'In Transit' && driverObj.status === 'On Trip',
      'Test D & E: Bus changes to "In Transit" & Driver changes to "On Trip"',
      `Bus Status: "${busObj.status}", Driver Status: "${driverObj.status}"`
    );

    // ----------------------------------------------------
    // Test F: Driver cannot start another trip while already on trip
    // ----------------------------------------------------
    const dupStartRes = await fetch(`${BASE_URL}/api/trips/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ bus_id: 1, route_id: 1 }),
    });
    const dupStartData = await dupStartRes.json();
    assert(
      dupStartRes.status === 400 && dupStartData.success === false,
      'Test F: Driver cannot start another trip while already on trip',
      `Status: ${dupStartRes.status}, Message: "${dupStartData.message}"`
    );

    // ----------------------------------------------------
    // Test G & H: Driver cannot start trip using unassigned bus/route
    // ----------------------------------------------------
    const unassignedBusRes = await fetch(`${BASE_URL}/api/trips/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ bus_id: 99, route_id: 1 }),
    });
    const unassignedBusData = await unassignedBusRes.json();
    assert(
      unassignedBusRes.status === 400 && unassignedBusData.success === false,
      'Test G & H: Driver cannot start trip using unassigned bus or route',
      `Status: ${unassignedBusRes.status}, Message: "${unassignedBusData.message}"`
    );

    // ----------------------------------------------------
    // Test I & J: Driver can submit tracking update
    // ----------------------------------------------------
    const trackingRes = await fetch(`${BASE_URL}/api/tracking/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        bus_id: 1,
        latitude: 24.5854,
        longitude: 73.7125,
        speed: 32.5,
        current_stop: 'Surajpole Circle',
        next_stop: 'Delhi Gate Junction',
        eta_minutes: 6,
      }),
    });
    const trackingData = await trackingRes.json();
    assert(
      trackingRes.status === 201 && trackingData.data?.latitude == 24.5854 && trackingData.data?.is_live == 1,
      'Test I & J: Driver can submit tracking update (Tracking record created)',
      `Status: ${trackingRes.status}, Lat: ${trackingData.data?.latitude}, Speed: ${trackingData.data?.speed} km/h`
    );

    // ----------------------------------------------------
    // Test K: Live tracking returns active bus
    // ----------------------------------------------------
    const liveRes = await fetch(`${BASE_URL}/api/tracking/live`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const liveData = await liveRes.json();
    const liveBus1 = Array.isArray(liveData.data) ? liveData.data.find((t) => t.bus_id == 1) : null;
    assert(
      liveRes.status === 200 && !!liveBus1 && (liveBus1.is_live == 1 || liveBus1.is_live === true),
      'Test K: Live tracking returns active bus',
      `Status: ${liveRes.status}, Live Bus ID 1 found: ${!!liveBus1}, Current Stop: "${liveBus1?.current_stop}"`
    );

    // ----------------------------------------------------
    // Test L & M & N & O & P: Driver can end active trip
    // ----------------------------------------------------
    const endTripRes = await fetch(`${BASE_URL}/api/trips/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ trip_id: createdTripId }),
    });
    const endTripData = await endTripRes.json();

    const checkEndedBusRes = await fetch(`${BASE_URL}/api/buses/1`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const endedBusObj = (await checkEndedBusRes.json()).data;

    const checkEndedDriverRes = await fetch(`${BASE_URL}/api/drivers/1`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const endedDriverObj = (await checkEndedDriverRes.json()).data;

    assert(
      endTripRes.status === 200 &&
      endTripData.data?.status === 'Completed' &&
      endedBusObj.status === 'At Depot' &&
      endedDriverObj.status === 'Available',
      'Test L–P: Driver ends active trip (Trip=Completed, Bus=At Depot, Driver=Available)',
      `Trip Status: "${endTripData.data?.status}", Bus Status: "${endedBusObj.status}", Driver Status: "${endedDriverObj.status}"`
    );

    // ----------------------------------------------------
    // Test Q & R: Student can create complaint (Belongs to student)
    // ----------------------------------------------------
    const createComplaintRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        bus_id: 1,
        route_id: 1,
        subject: 'AC cooling inadequate during afternoon route',
        category: 'Comfort & Maintenance',
        description: 'The cabin temperature was high during the 2 PM journey.',
        priority: 'Medium',
      }),
    });
    const createComplaintData = await createComplaintRes.json();
    const createdComplaintId = createComplaintData.data?.id;

    assert(
      createComplaintRes.status === 201 && createComplaintData.data?.subject.includes('AC cooling'),
      'Test Q & R: Student creates complaint belonging to authenticated student',
      `Status: ${createComplaintRes.status}, Complaint ID: ${createdComplaintId}, Subject: "${createComplaintData.data?.subject}"`
    );

    // ----------------------------------------------------
    // Test S & T: Student can see own complaints, but NOT another student's complaints
    // ----------------------------------------------------
    const student1ComplaintsRes = await fetch(`${BASE_URL}/api/complaints`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const student1ComplaintsData = await student1ComplaintsRes.json();

    const student2AccessRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`, {
      headers: { Authorization: `Bearer ${student2Token}` },
    });
    const student2AccessData = await student2AccessRes.json();

    const student1SeesOwn = student1ComplaintsData.data?.some((c) => c.id == createdComplaintId);
    const student2Blocked = student2AccessRes.status === 403;

    assert(
      student1SeesOwn && student2Blocked,
      'Test S & T: Student sees own complaints, blocked (403) from viewing another student\'s complaint',
      `Student 1 sees own: ${student1SeesOwn}, Student 2 blocked on private complaint: ${student2Blocked}`
    );

    // ----------------------------------------------------
    // Test U & V & W: Admin can see all complaints & update complaint, non-admin cannot update
    // ----------------------------------------------------
    const adminComplaintsRes = await fetch(`${BASE_URL}/api/complaints`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminComplaintsData = await adminComplaintsRes.json();

    const updateComplaintRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'In Progress',
        admin_response: 'Technician assigned to inspect cabin AC unit.',
      }),
    });
    const updateComplaintData = await updateComplaintRes.json();

    const studentUpdateRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({ status: 'Resolved' }),
    });

    assert(
      adminComplaintsRes.status === 200 &&
      updateComplaintRes.status === 200 &&
      updateComplaintData.data?.status === 'In Progress' &&
      studentUpdateRes.status === 403,
      'Test U–W: Admin sees all complaints & updates complaint; Student update blocked (403)',
      `Admin update status: ${updateComplaintRes.status}, Student update blocked: ${studentUpdateRes.status === 403}`
    );

    // ----------------------------------------------------
    // Test X & Y & Z: Admin creates notice, Student retrieves notice, Non-admin create blocked
    // ----------------------------------------------------
    const createNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Exam Special Transit Services',
        message: 'Additional shuttle buses will run every 10 minutes during final examination week.',
        type: 'Schedule Notice',
        target: 'All Students',
      }),
    });
    const createNoticeData = await createNoticeRes.json();
    const createdNoticeId = createNoticeData.data?.id;

    const studentNoticesRes = await fetch(`${BASE_URL}/api/notices`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const studentNoticesData = await studentNoticesRes.json();

    const studentCreateNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Student Notice',
        message: 'This should fail.',
      }),
    });

    const noticeRetrieved = studentNoticesData.data?.some((n) => n.id == createdNoticeId);
    assert(
      createNoticeRes.status === 201 && noticeRetrieved && studentCreateNoticeRes.status === 403,
      'Test X–Z: Admin creates notice, Student retrieves notice, Non-admin creation blocked (403)',
      `Admin create status: ${createNoticeRes.status}, Notice retrieved: ${noticeRetrieved}, Student create status: ${studentCreateNoticeRes.status}`
    );

    // Cleanup notice
    await fetch(`${BASE_URL}/api/notices/${createdNoticeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // ----------------------------------------------------
    // Test AA: Unauthenticated requests receive 401
    // ----------------------------------------------------
    const unauthRes = await fetch(`${BASE_URL}/api/trips`);
    assert(
      unauthRes.status === 401,
      'Test AA: Unauthenticated request receives 401 Unauthorized',
      `Status: ${unauthRes.status}`
    );

    // ----------------------------------------------------
    // Test AB: Unauthorized role requests receive 403
    // ----------------------------------------------------
    const unauthRoleRes = await fetch(`${BASE_URL}/api/notices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ title: 'Driver Notice', message: 'Fail' }),
    });
    assert(
      unauthRoleRes.status === 403,
      'Test AB: Unauthorized role request receives 403 Forbidden',
      `Status: ${unauthRoleRes.status}`
    );

    // ----------------------------------------------------
    // Test AC: Invalid IDs return 404
    // ----------------------------------------------------
    const invalidIdRes = await fetch(`${BASE_URL}/api/trips/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      invalidIdRes.status === 404,
      'Test AC: Invalid resource ID returns 404 Not Found',
      `Status: ${invalidIdRes.status}`
    );

  } catch (err) {
    console.error('\n❌ Error executing operational API test suite:', err);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`📊 OPERATIONAL API TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');
}

runOperationalApiTests();
