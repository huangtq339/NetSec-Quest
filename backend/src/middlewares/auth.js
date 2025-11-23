const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { getMySQLPool } = require('../utils/database');

// 生成JWT令牌
const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { 
      id: userId,
      role: role 
    },
    config.jwt.secret,
    { 
      expiresIn: config.jwt.expiresIn 
    }
  );
};

// JWT认证中间件
const authenticateJWT = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少认证令牌'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 将用户信息存储到请求对象中
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    // 检查用户是否存在且有效
    const pool = getMySQLPool();
    const [users] = await pool.execute(
      'SELECT id, status FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    if (users[0].status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '用户账户已被禁用'
      });
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    
    console.error('认证错误:', error);
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误'
    });
  }
};

// 角色权限检查中间件
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }
    
    // 管理员拥有所有权限
    if (req.user.role === 'admin') {
      return next();
    }
    
    // 检查用户角色是否匹配所需角色
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    next();
  };
};

// 可选认证中间件（不强制要求认证，但如果提供了有效token则解析用户信息）
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
    } catch (error) {
      // token无效不影响继续处理
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  generateToken,
  authenticateJWT,
  authorizeRole,
  optionalAuthenticate
};