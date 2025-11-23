const fs = require('fs');
const path = require('path');

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // 重写res.send方法以捕获响应体大小
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: body ? body.length : 0,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    
    // 记录到控制台（开发环境）
    console.log(`${logEntry.timestamp} | ${logEntry.method} ${logEntry.url} | ${logEntry.statusCode} | ${logEntry.responseTime}`);
    
    // 记录到文件（生产环境）
    if (process.env.NODE_ENV === 'production') {
      const logFilePath = path.join(__dirname, '../../logs/requests.log');
      ensureLogDirectory();
      
      fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', (err) => {
        if (err) console.error('写入日志失败:', err);
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
    status: err.status || 500
  };
  
  // 记录错误
  console.error('Error:', errorLog);
  
  // 在生产环境中记录到文件
  if (process.env.NODE_ENV === 'production') {
    const errorLogPath = path.join(__dirname, '../../logs/errors.log');
    ensureLogDirectory();
    
    fs.appendFile(errorLogPath, JSON.stringify(errorLog) + '\n', (err) => {
      if (err) console.error('写入错误日志失败:', err);
    });
  }
  
  // 返回适当的错误响应
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message
  });
};

// 速率限制中间件
const rateLimiter = (options = {}) => {
  const { windowMs = 15 * 60 * 1000, max = 100 } = options;
  const ipRequests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // 清理过期的请求记录
    if (ipRequests.has(ip)) {
      const requests = ipRequests.get(ip).filter(time => now - time < windowMs);
      ipRequests.set(ip, requests);
    } else {
      ipRequests.set(ip, []);
    }
    
    const requests = ipRequests.get(ip);
    
    // 检查是否超过速率限制
    if (requests.length >= max) {
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试'
      });
    }
    
    // 记录当前请求
    requests.push(now);
    
    // 移除过期的请求记录（保持内存使用效率）
    if (requests.length > max * 2) {
      ipRequests.set(ip, requests.slice(requests.length - max));
    }
    
    next();
  };
};

// 内存使用监控
const memoryMonitor = (interval = 60000) => {
  if (process.env.NODE_ENV !== 'production') return;
  
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const memoryLog = {
      timestamp: new Date().toISOString(),
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    };
    
    console.log('Memory Usage:', memoryLog);
    
    // 记录到文件
    const memoryLogPath = path.join(__dirname, '../../logs/memory.log');
    ensureLogDirectory();
    
    fs.appendFile(memoryLogPath, JSON.stringify(memoryLog) + '\n', (err) => {
      if (err) console.error('写入内存日志失败:', err);
    });
    
    // 如果内存使用超过阈值，发出警告
    if (memoryUsage.heapUsed > memoryUsage.heapTotal * 0.8) {
      console.warn('警告: 内存使用率超过80%');
    }
  }, interval);
};

// 确保日志目录存在
function ensureLogDirectory() {
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// 应用性能优化建议
const performanceOptimizer = (app) => {
  // 1. 启用压缩
  try {
    const compression = require('compression');
    app.use(compression());
  } catch (e) {
    console.warn('未安装compression中间件，建议安装: npm install compression');
  }
  
  // 2. 缓存控制
  app.use((req, res, next) => {
    if (req.path.match(/\.(jpg|jpeg|png|gif|ico|css|js)$/)) {
      res.setHeader('Cache-Control', 'max-age=86400'); // 24小时
    }
    next();
  });
  
  // 3. 设置安全相关的HTTP头部
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  
  // 4. 优化路由处理顺序
  // 提示: 将常用路由放在前面以减少路由匹配时间
  
  // 5. 启动内存监控
  memoryMonitor();
};

module.exports = {
  requestLogger,
  errorHandler,
  rateLimiter,
  memoryMonitor,
  performanceOptimizer
};
