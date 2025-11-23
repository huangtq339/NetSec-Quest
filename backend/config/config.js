require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.SERVER_PORT || 5000,
    host: process.env.SERVER_HOST || '0.0.0.0'
  },
  
  // 数据库配置
  database: {
    // 数据库类型
    type: process.env.DATABASE_TYPE || 'mysql',
    
    // MySQL配置
    mysql: {
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root_password',
      database: process.env.MYSQL_DATABASE || 'cybersecurity_skill_tree',
      port: process.env.MYSQL_PORT || 3306,
      connectionLimit: process.env.DB_CONNECTION_LIMIT || 10
    },
    
    // SQLite配置
    sqlite: {
      path: process.env.SQLITE_PATH || './data.db'
    },
    
    // MongoDB配置
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27018/skill_tree',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    
    // Redis配置
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || ''
    }
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // 认证配置
  auth: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 30 // 分钟
  },
  
  // 安全配置
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 每IP限制请求数
    }
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  },
  
  // 靶机配置
  vm: {
    baseImage: process.env.VM_BASE_IMAGE || 'ubuntu:latest',
    timeoutMinutes: parseInt(process.env.VM_TIMEOUT_MINUTES) || 60,
    maxConcurrentVms: parseInt(process.env.MAX_CONCURRENT_VMS) || 10
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  }
};