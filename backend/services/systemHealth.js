function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  let dbStatus = 'unknown';

  try {
    const mongoose = require('mongoose');
    const dbStateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';
  } catch {
    dbStatus = 'uninitialized';
  }

  return {
    uptime_sec: Math.floor(process.uptime()),
    database_status: dbStatus,
    memory: {
      rss_mb: (memoryUsage.rss / (1024 * 1024)).toFixed(2),
      heapTotal_mb: (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2),
      heapUsed_mb: (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2)
    }
  };
}

module.exports = { getSystemMetrics };
