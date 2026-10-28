import {
  resolveDriverRecord,
  resolveBusId,
  resolveRouteId,
  updateDriverAssignment,
  getDriverById,
} from './controllers/driverController.js';
import { getAllBuses, getBusById } from './controllers/busController.js';
import { inMemoryBuses, inMemoryDrivers, inMemoryRoutes } from './config/inMemoryStore.js';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    if (details) console.log(`   └─ ${details}`);
    passed++;
  } else {
    console.log(`❌ [FAIL] ${message}`);
    if (details) console.log(`   └─ Error: ${details}`);
    failed++;
  }
}

// Mock Express response generator
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function runAssignmentTests() {
  console.log('====================================================');
  console.log('🧪 SMARTBUS: ASSIGNMENT & JOIN RESOLUTION TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Resolve Driver by numeric ID
  const d1 = await resolveDriverRecord(1);
  assert(d1 !== null && d1.id === 1, 'Test 1: Resolve Driver by Numeric ID (1)', `Resolved ID: ${d1?.id}`);

  // Test 2: Resolve Driver by Employee ID string ('DRV-101')
  const d2 = await resolveDriverRecord('DRV-101');
  assert(d2 !== null && d2.id === 1, "Test 2: Resolve Driver by Employee ID ('DRV-101')", `Resolved ID: ${d2?.id}`);

  // Test 3: Resolve Driver by prefixed string ('drv_1')
  const d3 = await resolveDriverRecord('drv_1');
  assert(d3 !== null && d3.id === 1, "Test 3: Resolve Driver by Prefixed String ('drv_1')", `Resolved ID: ${d3?.id}`);

  // Test 4: Reject completely invalid driver identifier
  const dInvalid = await resolveDriverRecord('non_existent_driver_xyz');
  assert(dInvalid === null, 'Test 4: Reject Non-Existent Driver Identifier', `Result: ${dInvalid}`);

  // Test 5: Resolve Bus ID by number, bus_number, or prefix
  const b1 = await resolveBusId(1);
  const b2 = await resolveBusId('BUS-101');
  const b3 = await resolveBusId('bus_101');
  const bNull = await resolveBusId(null);
  assert(
    b1 === 1 && b2 === 1 && b3 === 1 && bNull === null,
    'Test 5: Resolve Bus ID (Numeric, BUS-101, bus_101, null)',
    `b1=${b1}, b2=${b2}, b3=${b3}, bNull=${bNull}`
  );

  // Test 6: Resolve Route ID by number, route_code, or prefix
  const r1 = await resolveRouteId(1);
  const r2 = await resolveRouteId('R-01');
  const r3 = await resolveRouteId('route_1');
  const rNull = await resolveRouteId(null);
  assert(
    r1 === 1 && r2 === 1 && r3 === 1 && rNull === null,
    'Test 6: Resolve Route ID (Numeric, R-01, route_1, null)',
    `r1=${r1}, r2=${r2}, r3=${r3}, rNull=${rNull}`
  );

  // Test 7: updateDriverAssignment with numeric driver ID and payload
  const req7 = {
    params: { id: '1' },
    body: { assigned_bus_id: 1, assigned_route_id: 1, shift: 'Morning' },
  };
  const res7 = createMockRes();
  await updateDriverAssignment(req7, res7, (err) => console.error(err));
  assert(
    res7.statusCode === 200 && res7.body?.success === true,
    'Test 7: updateDriverAssignment with Numeric ID (1)',
    `Status: ${res7.statusCode}, Bus: ${res7.body?.data?.assigned_bus_id}, Route: ${res7.body?.data?.assigned_route_id}`
  );

  // Test 8: updateDriverAssignment with employee ID ('DRV-101')
  const req8 = {
    params: { id: 'DRV-101' },
    body: { assigned_bus_id: 'BUS-102', assigned_route_id: 'R-02', shift: 'Evening' },
  };
  const res8 = createMockRes();
  await updateDriverAssignment(req8, res8, (err) => console.error(err));
  assert(
    res8.statusCode === 200 && res8.body?.success === true,
    "Test 8: updateDriverAssignment with Employee ID ('DRV-101')",
    `Status: ${res8.statusCode}, Assigned Bus: ${res8.body?.data?.assigned_bus_id}, Shift: ${res8.body?.data?.shift}`
  );

  // Test 9: updateDriverAssignment with prefixed ID ('drv_1')
  const req9 = {
    params: { id: 'drv_1' },
    body: { assigned_bus_id: 1, assigned_route_id: 1, shift: 'Morning' },
  };
  const res9 = createMockRes();
  await updateDriverAssignment(req9, res9, (err) => console.error(err));
  assert(
    res9.statusCode === 200 && res9.body?.success === true,
    "Test 9: updateDriverAssignment with Prefixed ID ('drv_1')",
    `Status: ${res9.statusCode}, Bus: ${res9.body?.data?.assigned_bus_id}`
  );

  // Test 10: Unassign Driver via updateDriverAssignment
  const req10 = {
    params: { id: '1' },
    body: { assigned_bus_id: null, assigned_route_id: null },
  };
  const res10 = createMockRes();
  await updateDriverAssignment(req10, res10, (err) => console.error(err));
  assert(
    res10.statusCode === 200 && res10.body?.data?.assigned_bus_id === null,
    'Test 10: Unassign Driver (assigned_bus_id = null)',
    `Status: ${res10.statusCode}, Bus: ${res10.body?.data?.assigned_bus_id}`
  );

  // Test 11: Reject updateDriverAssignment when driver ID is invalid
  const req11 = {
    params: { id: 'unknown_driver_999' },
    body: { assigned_bus_id: 1, assigned_route_id: 1 },
  };
  const res11 = createMockRes();
  await updateDriverAssignment(req11, res11, (err) => console.error(err));
  assert(
    res11.statusCode === 400 && res11.body?.success === false,
    'Test 11: Reject Invalid Driver with HTTP 400 and Clear Message',
    `Status: ${res11.statusCode}, Message: "${res11.body?.message}"`
  );

  // Test 12: Reassign Driver 1 to Bus 1, Route 1 for bus query verification
  const req12 = {
    params: { id: '1' },
    body: { assigned_bus_id: 1, assigned_route_id: 1, shift: 'Morning' },
  };
  const res12 = createMockRes();
  await updateDriverAssignment(req12, res12, (err) => console.error(err));
  assert(
    res12.statusCode === 200 && res12.body?.data?.assigned_bus_id === 1,
    'Test 12: Reassign Driver 1 to Bus 1 and Route 1',
    `Status: ${res12.statusCode}, Bus: ${res12.body?.data?.assigned_bus_id}`
  );

  // Test 13: getAllBuses returns assigned_driver_id and driver_name
  const req13 = {};
  const res13 = createMockRes();
  await getAllBuses(req13, res13, (err) => console.error(err));
  const bus1 = res13.body?.data?.find((b) => b.id === 1);
  assert(
    res13.statusCode === 200 && bus1 && bus1.assigned_driver_id === 1 && bus1.driver_name !== 'Unassigned',
    'Test 13: getAllBuses includes assigned driver and route details',
    `Bus 1: driver_id=${bus1?.assigned_driver_id}, driver_name="${bus1?.driver_name}", route_name="${bus1?.route_name}"`
  );

  // Test 14: getBusById returns assigned driver and route details
  const req14 = { params: { id: '1' } };
  const res14 = createMockRes();
  await getBusById(req14, res14, (err) => console.error(err));
  assert(
    res14.statusCode === 200 && res14.body?.data?.assigned_driver_id === 1,
    'Test 14: getBusById includes assigned driver details',
    `Driver ID: ${res14.body?.data?.assigned_driver_id}, Driver Name: "${res14.body?.data?.driver_name}"`
  );

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAssignmentTests();
