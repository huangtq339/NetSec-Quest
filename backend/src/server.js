const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const config = require('../config/config');
const { initializeDatabase, getMySQLPool, closeDatabaseConnections } = require('./utils/database');
const routes = require('./routes');
const targetRoutes = require('./routes/targetRoutes');
const { initializeTeamRoutes } = require('./routes/teamRoutes');
const { initializeSocialRoutes } = require('./routes/socialRoutes');

// 导入性能监控中间件
const {
  requestLogger,
  errorHandler,
  rateLimiter,
  performanceOptimizer
} = require('./middleware/performanceMonitor');

// 创建Express应用
const app = express();

// 配置中间件
app.use(helmet()); // 安全增强
app.use(compression()); // 启用响应压缩
app.use(cors({
  origin: config.security.cors.origin,
  methods: config.security.cors.methods,
  allowedHeaders: config.security.cors.allowedHeaders
}));

// 应用性能优化
performanceOptimizer(app);

app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// 使用请求日志中间件
app.use(requestLogger);

// 使用速率限制中间件
app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 })); // API路由限制为每分钟100个请求

// 日志中间件
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API路由
app.use('/api', routes);
app.use('/api/targets', targetRoutes);

// 404错误处理
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 使用错误处理中间件
app.use(errorHandler);

// 启动服务器
let server = null;

async function startServer() {
  try {
    // 初始化数据库
    await initializeDatabase();
    
    // 获取数据库连接池
    const db = await getMySQLPool();
    
    // 初始化并注册团队和社交路由（将数据库连接传递给路由）
    app.use('/api/teams', initializeTeamRoutes(db));
    app.use('/api/social', initializeSocialRoutes(db));
    
    // 启动HTTP服务器
    const port = config.server.port;
    const host = config.server.host;
    
    server = app.listen(port, host, () => {
      console.log(`服务器运行在 http://${host}:${port}`);
    });
    
    // 处理未捕获的异常
    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
      shutdownServer(1);
    });
    
    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
      shutdownServer(1);
    });
    
    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('收到终止信号，正在关闭服务器...');
      shutdownServer(0);
    });
    
    process.on('SIGINT', () => {
      console.log('收到中断信号，正在关闭服务器...');
      shutdownServer(0);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 关闭服务器
async function shutdownServer(exitCode) {
  try {
    // 关闭HTTP服务器
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('HTTP服务器已关闭');
    }
    
    // 关闭数据库连接
    await closeDatabaseConnections();
    
    console.log('服务器已优雅关闭');
    process.exit(exitCode);
  } catch (error) {
    console.error('关闭服务器时发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer();
}

// 导出应用和启动函数供测试使用
module.exports = {
  app,
  startServer,
  shutdownServer
};