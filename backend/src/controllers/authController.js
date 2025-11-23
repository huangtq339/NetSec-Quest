const bcrypt = require('bcryptjs');
const { getMySQLPool } = require('../utils/database');
const { generateToken } = require('../middlewares/auth');
const config = require('../../config/config');

class AuthController {
  // 用户注册
  static async register(req, res) {
    try {
      const { username, email, password, fullName } = req.body;
      
      // 验证输入
      if (!username || !email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: '请填写所有必填字段'
        });
      }
      
      const pool = getMySQLPool();
      
      // 检查用户名是否已存在
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已被使用'
        });
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, config.auth.bcryptSaltRounds);
      
      // 创建用户
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, hashedPassword, fullName, 'user', 'active']
      );
      
      // 生成JWT令牌
      const token = generateToken(result.insertId, 'user');
      
      // 初始化用户进度记录
      await pool.execute(
        'INSERT INTO user_progress (user_id, node_id, status) ' +
        'SELECT ?, id, "locked" FROM skill_nodes WHERE parent_id IS NULL',
        [result.insertId]
      );
      
      // 初始化用户积分
      await pool.execute(
        'INSERT INTO user_points (user_id, points) VALUES (?, ?)',
        [result.insertId, 0]
      );
      
      return res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          userId: result.insertId,
          username,
          email,
          fullName,
          token
        }
      });
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
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '请提供用户名和密码'
        });
      }
      
      const pool = getMySQLPool();
      
      // 查找用户
      const [users] = await pool.execute(
        'SELECT id, username, email, password, full_name, role, status, login_attempts, locked_until ' +
        'FROM users WHERE username = ? OR email = ?',
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
          lockedUntil = new Date(Date.now() + config.auth.lockoutDuration * 60 * 1000);
          updateFields = {
            login_attempts: 0,
            status: 'locked',
            locked_until: lockedUntil
          };
        }
        
        // 更新登录尝试次数
        await pool.execute(
          'UPDATE users SET login_attempts = ?, status = ?, locked_until = ? WHERE id = ?',
          [updateFields.login_attempts, status, lockedUntil, user.id]
        );
        
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }
      
      // 登录成功，重置登录尝试次数
      await pool.execute(
        'UPDATE users SET login_attempts = 0, last_login = NOW() WHERE id = ?',
        [user.id]
      );
      
      // 生成JWT令牌
      const token = generateToken(user.id, user.role);
      
      return res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
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
        'SELECT id, username, email, full_name, role, created_at, last_login ' +
        'FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      // 获取用户积分
      const [points] = await pool.execute(
        'SELECT points FROM user_points WHERE user_id = ?',
        [userId]
      );
      
      // 获取用户成就
      const [achievements] = await pool.execute(
        'SELECT a.id, a.name, a.description, a.icon, ua.earned_at ' +
        'FROM achievements a ' +
        'JOIN user_achievements ua ON a.id = ua.achievement_id ' +
        'WHERE ua.user_id = ?',
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        data: {
          ...users[0],
          points: points.length > 0 ? points[0].points : 0,
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
      const values = [];
      
      if (email) {
        // 检查邮箱是否已被其他用户使用
        const [existing] = await pool.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );
        
        if (existing.length > 0) {
          return res.status(400).json({
            success: false,
            message: '邮箱已被使用'
          });
        }
        
        updateFields.push('email = ?');
        values.push(email);
      }
      
      if (fullName) {
        updateFields.push('full_name = ?');
        values.push(fullName);
      }
      
      values.push(userId);
      
      // 更新用户信息
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      // 获取更新后的用户信息
      const [updatedUsers] = await pool.execute(
        'SELECT id, username, email, full_name FROM users WHERE id = ?',
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        message: '用户信息更新成功',
        data: updatedUsers[0]
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
      
      // 获取用户当前密码
      const [users] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '当前密码错误'
        });
      }
      
      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, config.auth.bcryptSaltRounds);
      
      // 更新密码
      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId]
      );
      
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
  
  // 登出
  static async logout(req, res) {
    try {
      // 在实际应用中，可能需要将token加入黑名单
      // 这里简单返回成功消息
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