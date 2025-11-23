const { getMySQLPool } = require('../utils/database');

class ScoreController {
  // 添加积分
  static async addScore(req, res) {
    try {
      const { points, reason } = req.body;
      const userId = req.user.id;
      
      if (!points || points <= 0) {
        return res.status(400).json({
          success: false,
          message: '积分必须为正数'
        });
      }

      const pool = getMySQLPool();
      
      // 开始事务
      await pool.beginTransaction();
      
      // 更新用户积分
      await pool.execute(
        'UPDATE user_points SET points = points + ? WHERE user_id = ?',
        [points, userId]
      );
      
      // 记录积分变更日志
      await pool.execute(
        'INSERT INTO point_logs (user_id, points_change, reason, created_at) VALUES (?, ?, ?, NOW())',
        [userId, points, reason || '系统奖励']
      );
      
      // 提交事务
      await pool.commit();
      
      // 获取更新后的积分
      const [result] = await pool.execute(
        'SELECT points FROM user_points WHERE user_id = ?',
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        message: '积分添加成功',
        data: {
          currentPoints: result[0]?.points || 0,
          addedPoints: points
        }
      });
    } catch (error) {
      // 回滚事务
      const pool = getMySQLPool();
      await pool.rollback();
      
      console.error('添加积分失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取用户积分信息
  static async getUserScore(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      
      // 只有管理员或用户本人可以查看积分信息
      if (req.user.role !== 'admin' && currentUserId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问其他用户的积分信息'
        });
      }

      const pool = getMySQLPool();
      
      // 获取用户积分
      const [points] = await pool.execute(
        'SELECT points FROM user_points WHERE user_id = ?',
        [userId]
      );
      
      if (points.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在或积分信息未初始化'
        });
      }
      
      // 获取最近的积分变更记录
      const [logs] = await pool.execute(
        'SELECT points_change, reason, created_at FROM point_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        data: {
          points: points[0].points,
          recentChanges: logs
        }
      });
    } catch (error) {
      console.error('获取用户积分失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取排行榜
  static async getLeaderboard(req, res) {
    try {
      const { type } = req.params; // type 可以是 'daily', 'weekly', 'monthly', 'all'
      
      const pool = getMySQLPool();
      let query = '';
      let params = [];
      
      switch (type) {
        case 'daily':
          query = 'SELECT u.id, u.username, u.full_name, up.points FROM users u JOIN user_points up ON u.id = up.user_id WHERE u.status = "active" ORDER BY up.points DESC LIMIT 50';
          break;
        case 'weekly':
          query = 'SELECT u.id, u.username, u.full_name, up.points FROM users u JOIN user_points up ON u.id = up.user_id WHERE u.status = "active" ORDER BY up.points DESC LIMIT 50';
          break;
        case 'monthly':
          query = 'SELECT u.id, u.username, u.full_name, up.points FROM users u JOIN user_points up ON u.id = up.user_id WHERE u.status = "active" ORDER BY up.points DESC LIMIT 50';
          break;
        case 'all':
        default:
          query = 'SELECT u.id, u.username, u.full_name, up.points FROM users u JOIN user_points up ON u.id = up.user_id WHERE u.status = "active" ORDER BY up.points DESC LIMIT 50';
          break;
      }
      
      const [users] = await pool.execute(query, params);
      
      return res.status(200).json({
        success: true,
        data: {
          type: type,
          leaderboard: users.map((user, index) => ({
            rank: index + 1,
            userId: user.id,
            username: user.username,
            fullName: user.full_name,
            points: user.points
          }))
        }
      });
    } catch (error) {
      console.error('获取排行榜失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取成就列表
  static async getAchievements(req, res) {
    try {
      const pool = getMySQLPool();
      
      const [achievements] = await pool.execute(
        'SELECT id, name, description, icon, points_required, category FROM achievements ORDER BY points_required ASC'
      );
      
      return res.status(200).json({
        success: true,
        data: achievements
      });
    } catch (error) {
      console.error('获取成就列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取徽章列表
  static async getBadges(req, res) {
    try {
      const pool = getMySQLPool();
      
      const [badges] = await pool.execute(
        'SELECT id, name, description, icon, condition_type, condition_value FROM badges ORDER BY id ASC'
      );
      
      return res.status(200).json({
        success: true,
        data: badges
      });
    } catch (error) {
      console.error('获取徽章列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

module.exports = ScoreController;