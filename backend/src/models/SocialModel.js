const { v4: uuidv4 } = require('uuid');

class SocialModel {
  constructor() {
    this.db = null;
  }

  // 获取数据库连接
  async getConnection() {
    if (!this.db) {
      this.db = require('../utils/database').getMySQLPool();
    }
    return this.db;
  }

  // 通用查询执行方法
  async executeQuery(sql, params = []) {
    try {
      const db = await this.getConnection();
      return await db.execute(sql, params);
    } catch (error) {
      console.error('Error executing query:', sql, params, error);
      throw error;
    }
  }

  // 初始化社交相关表
  async initializeTables() {
    try {
      // 关注关系表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS follows (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          follower_id INTEGER NOT NULL,
          following_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(follower_id, following_id),
          FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // 消息表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(36) PRIMARY KEY,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // 用户活动表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS user_activities (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          user_id INTEGER NOT NULL,
          activity_type VARCHAR(50) NOT NULL,
          target_type VARCHAR(50),
          target_id INTEGER,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_activities (user_id, created_at)
        );
      `);

      return { success: true };
    } catch (error) {
      console.error('Error initializing social tables:', error);
      throw error;
    }
  }

  // 关注用户
  async followUser(followerId, followingId) {
    try {
      // 不能关注自己
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }

      // 检查用户是否存在
      const [follower] = await this.executeQuery('SELECT id FROM users WHERE id = ?', [followerId]);
      const [following] = await this.executeQuery('SELECT id FROM users WHERE id = ?', [followingId]);
      
      if (follower.length === 0 || following.length === 0) {
        throw new Error('用户不存在');
      }

      // 创建关注关系
      const [result] = await this.executeQuery(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
      );

      // 记录活动
      await this.executeQuery(
        'INSERT INTO user_activities (user_id, activity_type, target_type, target_id, content) VALUES (?, ?, ?, ?, ?)',
        [followerId, 'follow', 'user', followingId, `关注了用户 ${followingId}`]
      );

      return { success: true, followId: result.insertId };
    } catch (error) {
      // 处理重复关注
      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('UNIQUE constraint failed')) {
        throw new Error('已经关注了该用户');
      }
      throw error;
    }
  }

  // 取消关注
  async unfollowUser(followerId, followingId) {
    try {
      const [result] = await this.executeQuery(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
      );

      if (result.affectedRows === 0) {
        throw new Error('未关注该用户');
      }

      // 记录活动
      await this.executeQuery(
        'INSERT INTO user_activities (user_id, activity_type, target_type, target_id, content) VALUES (?, ?, ?, ?, ?)',
        [followerId, 'unfollow', 'user', followingId, `取消关注了用户 ${followingId}`]
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 获取用户的关注列表
  async getFollowing(userId) {
    try {
      const [results] = await this.executeQuery(`
        SELECT u.id, u.username, u.email, u.avatar, u.level, u.xp
        FROM users u
        JOIN follows f ON u.id = f.following_id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
      `, [userId]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户的粉丝列表
  async getFollowers(userId) {
    try {
      const [results] = await this.executeQuery(`
        SELECT u.id, u.username, u.email, u.avatar, u.level, u.xp
        FROM users u
        JOIN follows f ON u.id = f.follower_id
        WHERE f.following_id = ?
        ORDER BY f.created_at DESC
      `, [userId]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // 检查是否已关注
  async isFollowing(followerId, followingId) {
    try {
      const [result] = await this.executeQuery(
        'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
      );
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // 发送消息
  async sendMessage(senderId, receiverId, content) {
    try {
      // 不能给自己发消息
      if (senderId === receiverId) {
        throw new Error('不能给自己发消息');
      }

      // 检查接收者是否存在
      const [receiver] = await this.executeQuery('SELECT id FROM users WHERE id = ?', [receiverId]);
      if (receiver.length === 0) {
        throw new Error('接收者不存在');
      }

      const messageId = uuidv4();
      await this.executeQuery(
        'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
        [messageId, senderId, receiverId, content]
      );

      return { success: true, messageId };
    } catch (error) {
      throw error;
    }
  }

  // 获取用户间的消息记录
  async getMessages(userId, otherUserId, limit = 50, offset = 0) {
    try {
      const [results] = await this.executeQuery(`
        SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
               u1.username as sender_username, u1.avatar as sender_avatar,
               u2.username as receiver_username, u2.avatar as receiver_avatar
        FROM messages m
        JOIN users u1 ON m.sender_id = u1.id
        JOIN users u2 ON m.receiver_id = u2.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, otherUserId, otherUserId, userId, limit, offset]);

      // 标记接收的消息为已读
      await this.executeQuery(
        'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
        [otherUserId, userId]
      );

      return results;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户的消息会话列表（最近的聊天对象）
  async getConversations(userId) {
    try {
      // MySQL查询
      const [results] = await this.executeQuery(`
        SELECT 
          CASE 
            WHEN m.sender_id = ? THEN m.receiver_id 
            ELSE m.sender_id 
          END as other_user_id,
          u.username, u.avatar, u.level, u.xp,
          MAX(m.created_at) as last_message_time,
          (SELECT content FROM messages 
           WHERE (sender_id = ? AND receiver_id = other_user_id) 
              OR (sender_id = other_user_id AND receiver_id = ?) 
           ORDER BY created_at DESC LIMIT 1) as last_message_content,
          SUM(CASE WHEN m.receiver_id = ? AND m.is_read = FALSE THEN 1 ELSE 0 END) as unread_count
        FROM messages m
        JOIN users u ON (CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END) = u.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        GROUP BY other_user_id, u.username, u.avatar, u.level, u.xp
        ORDER BY last_message_time DESC
      `, [userId, userId, userId, userId, userId, userId, userId]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // 获取未读消息数量
  async getUnreadMessageCount(userId) {
    try {
      const [result] = await this.executeQuery(
        'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
        [userId]
      );
      return result[0].count;
    } catch (error) {
      throw error;
    }
  }

  // 标记消息为已读
  async markMessageAsRead(messageId, userId) {
    try {
      const [result] = await this.executeQuery(
        'UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
        [messageId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('消息不存在或不是该用户接收的');
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 删除消息
  async deleteMessage(messageId, userId) {
    try {
      const [result] = await this.executeQuery(
        'DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
        [messageId, userId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('消息不存在或不是该用户发送/接收的');
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 记录用户活动
  async recordActivity(userId, activityType, targetType, targetId, content) {
    try {
      const [result] = await this.executeQuery(
        'INSERT INTO user_activities (user_id, activity_type, target_type, target_id, content) VALUES (?, ?, ?, ?, ?)',
        [userId, activityType, targetType || null, targetId || null, content || '']
      );

      return { success: true, activityId: result.insertId };
    } catch (error) {
      throw error;
    }
  }

  // 获取用户活动列表
  async getUserActivities(userId, limit = 20, offset = 0) {
    try {
      const [results] = await this.executeQuery(
        'SELECT * FROM user_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );
      return results;
    } catch (error) {
      throw error;
    }
  }

  // 获取关注用户的活动（信息流）
  async getFeedActivities(userId, limit = 30, offset = 0) {
    try {
      const [results] = await this.executeQuery(`
        SELECT a.*, u.username, u.avatar, u.level, u.xp
        FROM user_activities a
        JOIN follows f ON a.user_id = f.following_id
        JOIN users u ON a.user_id = u.id
        WHERE f.follower_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
      return results;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SocialModel;