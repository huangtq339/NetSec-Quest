const bcrypt = require('bcryptjs');
const { getMySQLPool } = require('../utils/database');

class UserModel {
  constructor() {
    this.db = null;
  }

  // 获取数据库连接
  async getConnection() {
    if (!this.db) {
      this.db = getMySQLPool();
    }
    return this.db;
  }

  // 创建新用户
  async createUser(userData) {
    try {
      const { username, password, email, role = 'student' } = userData;
      
      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const db = await this.getConnection();
      const [result] = await db.execute(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, email, role]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // 通过用户名查找用户
  async findByUsername(username) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  // 通过ID查找用户
  async findById(id) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  // 验证密码
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // 更新用户信息
  async updateUser(id, updateData) {
    try {
      // 如果有密码更新，需要重新加密
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      });
      
      values.push(id);
      
      const db = await this.getConnection();
      await db.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // 更新用户积分
  async updatePoints(userId, pointsChange, reason, relatedId = null, relatedType = null) {
    try {
      const db = await this.getConnection();
      // 开始事务
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // 更新用户积分
        await connection.execute(
          'UPDATE users SET points = points + ? WHERE id = ?',
          [pointsChange, userId]
        );
        
        // 记录积分变动
        await connection.execute(
          'INSERT INTO point_records (user_id, points_change, reason, related_id, related_type) VALUES (?, ?, ?, ?, ?)',
          [userId, pointsChange, reason, relatedId, relatedType]
        );
        
        // 提交事务
        await connection.commit();
        return true;
      } catch (error) {
        // 回滚事务
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating points:', error);
      throw error;
    }
  }

  // 获取用户进度统计
  async getUserProgress(userId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        `SELECT 
          COUNT(up.id) as total_nodes,
          SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_nodes,
          SUM(CASE WHEN up.status = 'completed' THEN up.score ELSE 0 END) as total_score
        FROM user_progress up
        WHERE up.user_id = ?`,
        [userId]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // 获取用户勋章
  async getUserMedals(userId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        `SELECT m.*, um.earned_at 
         FROM medals m
         JOIN user_medals um ON m.id = um.medal_id
         WHERE um.user_id = ?
         ORDER BY um.earned_at DESC`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting user medals:', error);
      throw error;
    }
  }

  // 检查并授予勋章
  async checkAndAwardMedals(userId) {
    try {
      const user = await this.findById(userId);
      const progress = await this.getUserProgress(userId);
      
      const db = await this.getConnection();
      // 获取所有勋章
      const [medals] = await db.execute('SELECT * FROM medals');
      
      for (const medal of medals) {
        // 检查用户是否已经获得该勋章
        const [existing] = await db.execute(
          'SELECT * FROM user_medals WHERE user_id = ? AND medal_id = ?',
          [userId, medal.id]
        );
        
        if (existing.length === 0) {
          let shouldAward = false;
          
          // 根据勋章条件类型检查是否满足
          switch (medal.condition_type) {
            case 'points':
              shouldAward = user.points >= medal.condition_value;
              break;
            case 'tasks_completed':
              shouldAward = progress.completed_nodes >= medal.condition_value;
              break;
            case 'special':
              // 特殊条件需要单独处理
              // 这里可以添加更复杂的逻辑
              break;
          }
          
          if (shouldAward) {
            // 授予勋章
            await db.execute(
              'INSERT INTO user_medals (user_id, medal_id) VALUES (?, ?)',
              [userId, medal.id]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking and awarding medals:', error);
      throw error;
    }
  }

  // 获取排行榜
  async getLeaderboard(limit = 10) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        'SELECT id, username, points, level FROM users ORDER BY points DESC LIMIT ?',
        [limit]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // 删除用户
  async deleteUser(id) {
    try {
      const db = await this.getConnection();
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = UserModel;