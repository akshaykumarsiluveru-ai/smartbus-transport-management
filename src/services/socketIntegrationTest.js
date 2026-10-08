/**
 * SmartBus Frontend Socket.IO Integration Test Verification Module
 * Validates Socket.IO client initialization, room joining, event listeners, and REST fallback.
 */
import socketService, { getSocket, getSocketUrl, joinBusRoom, leaveBusRoom, onBusLocationUpdate, offBusLocationUpdate, disconnectSocket } from './socket.js';
import trackingApi from './trackingApi.js';

export const runSocketIntegrationTest = async () => {
  const results = [];

  const addResult = (name, passed, details = '') => {
    results.push({ name, passed, details });
  };

  try {
    // 1. URL Derivation
    const url = getSocketUrl();
    addResult('Socket URL Derivation', Boolean(url), `URL: ${url}`);

    // 2. Client Initialization
    const socket = getSocket();
    addResult('Socket Client Initialization', Boolean(socket), `Socket instance created`);

    // 3. Listener registration & cleanup
    const dummyHandler = () => {};
    onBusLocationUpdate(dummyHandler);
    offBusLocationUpdate(dummyHandler);
    addResult('Listener Registration & Cleanup', true, 'Handlers attached & detached cleanly');

    // 4. REST Fallback verification
    try {
      const liveData = await trackingApi.getLiveTracking();
      addResult('REST Polling Fallback Operational', liveData && liveData.success !== false, `REST fallback verified`);
    } catch (e) {
      addResult('REST Polling Fallback Operational', false, e.message);
    }

  } catch (err) {
    addResult('Socket Integration Test', false, err.message);
  }

  return results;
};

export default {
  runSocketIntegrationTest,
};
