const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mysql = require('mysql2/promise');
const redis = require('redis');

// 全局变量存储测试资源
let mongoServer;
let mysqlPool;
let redisClient;

// 测试前的设置
beforeAll(async () => {
  // 设置环境变量为测试模式
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  
  try {
    // 启动MongoDB内存服务器
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // 配置MySQL连接池（使用测试数据库）
    mysqlPool = mysql.createPool({
      host: process.env.TEST_MYSQL_HOST || 'localhost',
      user: process.env.TEST_MYSQL_USER || 'root',
      password: process.env.TEST_MYSQL_PASSWORD || 'password',
      database: process.env.TEST_MYSQL_DATABASE || 'test_cybersecurity_skill_tree',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // 连接Redis
    redisClient = redis.createClient({
      url: process.env.TEST_REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
    
  } catch (error) {
    console.error('测试设置失败:', error);
    throw error;
  }
});

// 每个测试用例后清理数据
afterEach(async () => {
  try {
    // 清除MongoDB集合数据
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
    }
    
    // 清除Redis缓存
    if (redisClient) {
      await redisClient.flushDb();
    }
  } catch (error) {
    console.error('清理测试数据失败:', error);
  }
});

// 测试后的清理
afterAll(async () => {
  try {
    // 断开数据库连接
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    if (mysqlPool) {
      await mysqlPool.end();
    }
    
    if (redisClient) {
      await redisClient.disconnect();
    }
  } catch (error) {
    console.error('测试清理失败:', error);
  }
});

// 模拟child_process的spawn方法，避免在测试中实际执行shell命令
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    stdout: {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          // 模拟成功的输出
          process.nextTick(() => callback(Buffer.from('')));
        }
      })
    },
    stderr: {
      on: jest.fn()
    },
    on: jest.fn((event, callback) => {
      if (event === 'close') {
        process.nextTick(() => callback(0));
      }
    })
  }))
}));

// 提供模拟的响应对象
global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

// 提供模拟的请求对象
global.mockRequest = (options = {}) => {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    user: {},
    ...options
  };
};
