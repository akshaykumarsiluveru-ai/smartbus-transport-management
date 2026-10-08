import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDbConnection } from './config/db.js';
import { initSocketServer } from './socket/socketServer.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import busRoutes from './routes/busRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);

// Root route welcome endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to SmartBus Backend API Server',
    healthCheck: `/api/health`,
  });
});

// Centralized Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server wrapper & initialize Socket.IO server infrastructure
const httpServer = http.createServer(app);
initSocketServer(httpServer);

// Start HTTP Server & Verify Database Connection
httpServer.listen(PORT, async () => {
  console.log(`🚀 SmartBus backend server running on port ${PORT}`);
  console.log(`📡 Health Check endpoint available at http://localhost:${PORT}/api/health`);
  console.log(`⚡ Socket.IO real-time infrastructure initialized`);
  await testDbConnection();
});
