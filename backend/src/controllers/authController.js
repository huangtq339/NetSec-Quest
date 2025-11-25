const bcrypt = require('bcryptjs');
const { getMySQLPool } = require('../utils/database');
const { generateToken } = require('../middlewares/auth');
const config = require('../../config/config');
// 导入数据库模式定义
const {
  userTable,
  userProgressTable,
  userPointsTable,
  mapToFrontendFormat
} = require('../models/DatabaseSchema');

class AuthController {
  // 用户注册
  static async register(req, res) {
    try {
      // 直接使用前端发送的字段名称
      const { studentId, name, email, password, className, interest = 'Unknown' } = req.body;
      
      // 验证输入
      if (!studentId || !email || !password || !name || !className) {
        return res.status(400).json({
          success: false,
          message: '请填写所有必填字段'
        });
      }
      
      const pool = getMySQLPool();
      let connection = null;
      
      try {
        // 获取数据库连接
        connection = await pool.getConnection();
        
        // 开始事务
        await connection.beginTransaction();
        
        // 检查学号和邮箱是否已存在
        const [existingUsers] = await connection.execute(
          `SELECT ${userTable.columns.id} FROM ${userTable.tableName} WHERE ${userTable.columns.username} = ? OR ${userTable.columns.email} = ?`,
          [studentId, email]
        );
        
        if (existingUsers.length > 0) {
          // 回滚事务
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: '用户名或邮箱已被使用'
          });
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, config.auth.bcryptSaltRounds);
        
        // 创建用户 - 保存所有必要字段，包括班级信息和兴趣方向
        const [result] = await connection.execute(
          `INSERT INTO ${userTable.tableName} 
           (${userTable.columns.username}, ${userTable.columns.email}, ${userTable.columns.password}, 
            ${userTable.columns.name}, ${userTable.columns.role}, ${userTable.columns.className}, ${userTable.columns.interest}) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [studentId, email, hashedPassword, name, 'student', className, interest]
        );
        
        // 生成JWT令牌
        const token = generateToken(result.insertId, 'student');
        
        // 初始化用户进度记录 - 检查skill_nodes表是否存在
        try {
          await connection.execute(
            `INSERT INTO ${userProgressTable.tableName} (${userProgressTable.columns.userId}, ${userProgressTable.columns.nodeId}, ${userProgressTable.columns.status}) ` +
            'SELECT ?, id, "locked" FROM skill_nodes WHERE parent_id IS NULL',
            [result.insertId]
          );
        } catch (progressError) {
          console.warn('初始化用户进度时出错（可能是表不存在）:', progressError.message);
          // 继续执行，不回滚事务
        }
        
        // 尝试更新用户表中的积分字段（如果存在），而不是使用单独的表
        try {
          await connection.execute(
            `UPDATE ${userTable.tableName} SET points = ? WHERE id = ?`,
            [0, result.insertId]
          );
        } catch (pointsError) {
          console.warn('更新用户积分时出错:', pointsError.message);
          // 继续执行，不回滚事务
        }
        
        // 提交事务
        await connection.commit();
        
        return res.status(201).json({
          success: true,
          message: '注册成功',
          data: mapToFrontendFormat({
          userId: result.insertId,
          [userTable.columns.username]: studentId,
          [userTable.columns.email]: email,
          [userTable.columns.name]: name,
          [userTable.columns.className]: className,
          [userTable.columns.interest]: interest,
          token
        })
        });
      } catch (error) {
        // 发生错误时回滚事务
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            console.error('回滚事务时出错:', rollbackError);
          }
        }
        throw error; // 重新抛出错误，让外部try-catch处理
      } finally {
        // 释放连接
        if (connection) {
          connection.release();
        }
      }
    } catch (error) {
      console.error('注册错误:', error);
      return res.status(500).json({
        success: false,
        message: '注册过程中发生错误',
        error: error.message
      });
    }
  }
  
  // 用户登录
  static async login(req, res) {
    try {
      // 兼容前端传递的studentId参数
      const username = req.body.username || req.body.studentId;
      const password = req.body.password;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '请提供用户名和密码'
        });
      }
      
      const pool = getMySQLPool();
      
      // 查找用户
      const [users] = await pool.execute(
        `SELECT 
          ${userTable.columns.id}, 
          ${userTable.columns.username}, 
          ${userTable.columns.email}, 
          ${userTable.columns.password}, 
          ${userTable.columns.name}, 
          ${userTable.columns.role}, 
          ${userTable.columns.status}, 
          ${userTable.columns.loginAttempts}, 
          ${userTable.columns.lockedUntil}, 
          ${userTable.columns.className}, 
          ${userTable.columns.interest} 
        FROM ${userTable.tableName} 
        WHERE ${userTable.columns.username} = ? OR ${userTable.columns.email} = ?`,
        [username, username]
      );
      
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }
      
      const user = users[0];
      
      // 检查账户是否被锁定
      if (user.status === 'locked' || (user.locked_until && new Date() < new Date(user.locked_until))) {
        return res.status(403).json({
          success: false,
          message: '账户已被锁定，请稍后再试'
        });
      }
      
      // 检查密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        // 增加登录失败次数
        const newAttempts = (user.login_attempts || 0) + 1;
        let updateFields = { login_attempts: newAttempts };
        let status = user.status;
        let lockedUntil = null;
        
        // 如果失败次数超过限制，锁定账户
        if (newAttempts >= config.auth.maxLoginAttempts) {
          status = 'locked';
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + config.auth.lockoutDurationMinutes);
          lockedUntil = lockUntil;
        }
        
        // 更新登录尝试次数和锁定状态
        await pool.execute(
          `UPDATE ${userTable.tableName} 
           SET login_attempts = ?, status = ?, locked_until = ? 
           WHERE id = ?`,
          [newAttempts, status, lockedUntil, user.id]
        );
        
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }
      
      // 登录成功，重置登录尝试次数
      await pool.execute(
        `UPDATE ${userTable.tableName} 
         SET login_attempts = 0, last_login = ? 
         WHERE id = ?`,
        [new Date(), user.id]
      );
      
      // 生成JWT令牌
      const token = generateToken(user.id, user.role);
      
      // 使用mapToFrontendFormat格式化用户数据
      const userData = mapToFrontendFormat({
        [userTable.columns.id]: user.id,
        [userTable.columns.username]: user.username,
        [userTable.columns.email]: user.email,
        [userTable.columns.name]: user.name,
        [userTable.columns.role]: user.role
      });
      
      return res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          ...userData,
          token
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      return res.status(500).json({
        success: false,
        message: '登录过程中发生错误',
        error: error.message
      });
    }
  }
  
  // 获取当前用户信息
  static async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;
      const pool = getMySQLPool();
      
      // 获取用户信息
      const [users] = await pool.execute(
        `SELECT 
          ${userTable.columns.id}, 
          ${userTable.columns.username}, 
          ${userTable.columns.email}, 
          ${userTable.columns.name}, 
          ${userTable.columns.role}, 
          ${userTable.columns.createdAt}, 
          ${userTable.columns.lastLogin}, 
          ${userTable.columns.className}, 
          ${userTable.columns.interest} 
        FROM ${userTable.tableName} 
        WHERE ${userTable.columns.id} = ?`,
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      // 获取用户积分 - 添加错误处理防止表不存在导致的500错误
      let userPoints = 0;
      try {
        const [points] = await pool.execute(
          `SELECT ${userPointsTable.columns.points} 
           FROM ${userPointsTable.tableName} 
           WHERE ${userPointsTable.columns.userId} = ?`,
          [userId]
        );
        userPoints = points.length > 0 ? points[0].points : 0;
      } catch (pointsError) {
        // 如果表不存在或查询出错，使用默认积分值0
        console.warn('获取用户积分失败，使用默认值0:', pointsError.message);
        userPoints = 0;
      }
      
      // 获取用户成就 - 添加错误处理防止表不存在导致的500错误
      let achievements = [];
      try {
        const [achievementsResult] = await pool.execute(
          'SELECT a.id, a.name, a.description, a.icon, ua.earned_at ' +
          'FROM achievements a ' +
          'JOIN user_achievements ua ON a.id = ua.achievement_id ' +
          'WHERE ua.user_id = ?',
          [userId]
        );
        achievements = achievementsResult;
      } catch (achievementsError) {
        // 如果表不存在或查询出错，使用空数组
        console.warn('获取用户成就失败，使用空数组:', achievementsError.message);
        achievements = [];
      }
      
      // 获取用户数据
      const userData = users[0];
      
      // 直接使用数据库中的name字段值，不进行任何替换
      // 使用mapToFrontendFormat函数将数据库字段映射为前端期望的格式
      const formattedUserData = mapToFrontendFormat(userData);
      
      return res.status(200).json({
        success: true,
        data: {
          ...formattedUserData,
          points: userPoints,
          achievements
        }
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: error.message
      });
    }
  }
  
  // 更新用户信息
  static async updateUser(req, res) {
    try {
      const userId = req.user.id;
      const { email, fullName } = req.body;
      
      if (!email && !fullName) {
        return res.status(400).json({
          success: false,
          message: '没有提供要更新的信息'
        });
      }
      
      const pool = getMySQLPool();
      const updateFields = [];
      const updateValues = [];
      
      if (email) {
        // 检查邮箱是否已被其他用户使用
        const [existingUsers] = await pool.execute(
          `SELECT ${userTable.columns.id} FROM ${userTable.tableName} WHERE ${userTable.columns.email} = ? AND ${userTable.columns.id} != ?`,
          [email, userId]
        );
        
        if (existingUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: '邮箱已被使用'
          });
        }
        
        updateFields.push(`${userTable.columns.email} = ?`);
        updateValues.push(email);
      }
      
      if (fullName) {
        updateFields.push(`${userTable.columns.name} = ?`);
        updateValues.push(fullName);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有有效的更新字段'
        });
      }
      
      // 添加userId到参数列表末尾
      updateValues.push(userId);
      
      // 执行更新
      const [result] = await pool.execute(
        `UPDATE ${userTable.tableName} SET ${updateFields.join(', ')} WHERE ${userTable.columns.id} = ?`,
        updateValues
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在或没有更新'
        });
      }
      
      // 获取更新后的用户信息
      const [updatedUsers] = await pool.execute(
        `SELECT 
          ${userTable.columns.id}, 
          ${userTable.columns.username}, 
          ${userTable.columns.email}, 
          ${userTable.columns.name}, 
          ${userTable.columns.role}, 
          ${userTable.columns.createdAt}, 
          ${userTable.columns.lastLogin} 
        FROM ${userTable.tableName} 
        WHERE ${userTable.columns.id} = ?`,
        [userId]
      );
      
      // 使用mapToFrontendFormat格式化返回数据
      const formattedUserData = mapToFrontendFormat(updatedUsers[0]);
      
      return res.status(200).json({
        success: true,
        message: '用户信息更新成功',
        data: formattedUserData
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新用户信息失败',
        error: error.message
      });
    }
  }
  
  // 修改密码
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '请提供当前密码和新密码'
        });
      }
      
      const pool = getMySQLPool();
      
      // 获取当前用户的密码
      const [users] = await pool.execute(
        `SELECT ${userTable.columns.password} FROM ${userTable.tableName} WHERE ${userTable.columns.id} = ?`,
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      const user = users[0];
      
      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '当前密码不正确'
        });
      }
      
      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, config.auth.bcryptSaltRounds);
      
      // 更新密码
      const [result] = await pool.execute(
        `UPDATE ${userTable.tableName} SET ${userTable.columns.password} = ? WHERE ${userTable.columns.id} = ?`,
        [hashedNewPassword, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在或密码未更新'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      console.error('修改密码错误:', error);
      return res.status(500).json({
        success: false,
        message: '修改密码失败',
        error: error.message
      });
    }
  }
  
  // 用户登出
  static async logout(req, res) {
    try {
      // JWT是无状态的，服务端不需要做特殊处理
      // 客户端负责删除token
      
      return res.status(200).json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('登出错误:', error);
      return res.status(500).json({
        success: false,
        message: '登出失败',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;