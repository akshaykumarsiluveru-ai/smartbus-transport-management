export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartBus backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
};
