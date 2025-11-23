const { getDatabaseConnection } = require('../utils/database');
const SkillTreeMySQLModel = require('../models/SkillTreeMySQLModel');

class SkillTreeController {
  constructor() {
    this.skillTreeModel = null;
  }

  // 初始化模型
  async initialize() {
    if (!this.skillTreeModel) {
      const pool = getMySQLPool();
      this.skillTreeModel = new SkillTreeMySQLModel(pool);
    }
  }

  // 获取所有课程
  static async getCourses(req, res) {
    try {
      // 使用getDatabaseConnection()替代直接使用MySQL连接池，支持SQLite
      const db = await getDatabaseConnection();
      const skillTreeModel = new SkillTreeMySQLModel(db);
      const courses = await skillTreeModel.getCourses();
      
      return res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('获取课程列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取课程列表失败',
        error: error.message
      });
    }
  }

  // 获取技能树结构
  static async getSkillTree(req, res) {
    try {
      const { courseId } = req.query;
      const pool = getMySQLPool();
      const skillTreeModel = new SkillTreeMySQLModel(pool);
      
      let skillTree;
      if (req.user) {
        // 已登录用户获取带进度的技能树
        skillTree = await skillTreeModel.getUserSkillProgress(req.user.id, courseId);
      } else {
        // 未登录用户获取基础技能树
        skillTree = await skillTreeModel.buildSkillTree(courseId);
      }
      
      return res.status(200).json({
        success: true,
        data: skillTree
      });
    } catch (error) {
      console.error('获取技能树错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取技能树失败',
        error: error.message
      });
    }
  }

  // 获取技能节点详情
  static async getSkillNode(req, res) {
    try {
      const { nodeId } = req.params;
      const pool = getMySQLPool();
      const skillTreeModel = new SkillTreeMySQLModel(pool);
      
      // 获取节点信息
      const node = await skillTreeModel.getSkillNode(nodeId);
      
      if (!node) {
        return res.status(404).json({
          success: false,
          message: '技能节点不存在'
        });
      }
      
      let nodeData = { ...node };
      
      // 获取节点关联的任务
      nodeData.tasks = await skillTreeModel.getNodeTasks(nodeId);
      
      // 如果用户已登录，获取用户在该节点的进度
      if (req.user) {
        const unlockStatus = await skillTreeModel.checkNodeUnlockStatus(req.user.id, nodeId);
        
        const [progress] = await pool.execute(
          'SELECT status, score, completed_at FROM user_progress WHERE user_id = ? AND node_id = ?',
          [req.user.id, nodeId]
        );
        
        nodeData.userProgress = progress.length > 0 ? progress[0] : null;
        nodeData.isUnlocked = unlockStatus;
      }
      
      return res.status(200).json({
        success: true,
        data: nodeData
      });
    } catch (error) {
      console.error('获取技能节点详情错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取技能节点详情失败',
        error: error.message
      });
    }
  }

  // 更新用户技能节点进度
  static async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const { nodeId } = req.params;
      const { status, score } = req.body;
      
      if (!status || !['pending', 'in_progress', 'completed', 'locked'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        });
      }
      
      const pool = getMySQLPool();
      const skillTreeModel = new SkillTreeMySQLModel(pool);
      
      // 检查节点是否存在
      const node = await skillTreeModel.getSkillNode(nodeId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: '技能节点不存在'
        });
      }
      
      // 检查节点是否已解锁
      const isUnlocked = await skillTreeModel.checkNodeUnlockStatus(userId, nodeId);
      if (!isUnlocked && status !== 'locked') {
        return res.status(403).json({
          success: false,
          message: '该技能节点尚未解锁'
        });
      }
      
      // 更新进度
      await skillTreeModel.updateUserProgress(userId, nodeId, status, score);
      
      // 如果节点完成，更新用户积分
      if (status === 'completed') {
        // 根据节点难度计算积分奖励
        const difficultyPoints = {
          'beginner': 10,
          'intermediate': 25,
          'advanced': 50,
          'expert': 100
        };
        
        const pointsToAdd = difficultyPoints[node.difficulty] || 10;
        
        await pool.execute(
          'UPDATE user_points SET points = points + ? WHERE user_id = ?',
          [pointsToAdd, userId]
        );
        
        // 检查是否解锁子节点
        const childNodes = await skillTreeModel.getChildNodes(nodeId);
        for (const childNode of childNodes) {
          await pool.execute(
            `INSERT INTO user_progress (user_id, node_id, status) 
             VALUES (?, ?, 'pending') 
             ON DUPLICATE KEY UPDATE status = 'pending'`,
            [userId, childNode.id]
          );
        }
      }
      
      // 获取更新后的进度
      const updatedTree = await skillTreeModel.getUserSkillProgress(userId);
      
      return res.status(200).json({
        success: true,
        message: '进度更新成功',
        data: {
          skillTree: updatedTree,
          updatedNodeId: nodeId
        }
      });
    } catch (error) {
      console.error('更新进度错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新进度失败',
        error: error.message
      });
    }
  }

  // 获取用户整体进度
  static async getUserProgress(req, res) {
    try {
      const userId = req.user.id;
      const pool = getMySQLPool();
      const skillTreeModel = new SkillTreeMySQLModel(pool);
      
      // 获取整体进度统计
      const progressStats = await skillTreeModel.getUserOverallProgress(userId);
      
      // 获取按课程分组的进度
      const [courseProgress] = await pool.execute(
        `SELECT 
          c.id, c.name, 
          COUNT(sn.id) as total_nodes,
          SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_nodes,
          ROUND((SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(sn.id)), 2) as completion_percentage
        FROM courses c
        JOIN skill_nodes sn ON c.id = sn.course_id
        LEFT JOIN user_progress up ON sn.id = up.node_id AND up.user_id = ?
        GROUP BY c.id, c.name`,
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        data: {
          overall: progressStats,
          byCourse: courseProgress
        }
      });
    } catch (error) {
      console.error('获取用户进度错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取用户进度失败',
        error: error.message
      });
    }
  }

  // 获取推荐的下一个学习节点
  static async getRecommendedNodes(req, res) {
    try {
      const userId = req.user.id;
      const pool = getMySQLPool();
      
      // 获取已解锁但未完成的节点
      const [recommendedNodes] = await pool.execute(
        `SELECT sn.id, sn.name, sn.parent_id, sn.description, sn.difficulty, 
               c.name as course_name, c.id as course_id
        FROM skill_nodes sn
        JOIN courses c ON sn.course_id = c.id
        WHERE sn.id IN (
          SELECT node_id FROM user_progress 
          WHERE user_id = ? AND status = 'pending'
        )
        ORDER BY 
          CASE sn.difficulty 
            WHEN 'beginner' THEN 1
            WHEN 'intermediate' THEN 2
            WHEN 'advanced' THEN 3
            WHEN 'expert' THEN 4
            ELSE 5
          END, 
          sn.id
        LIMIT 5`,
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        data: recommendedNodes
      });
    } catch (error) {
      console.error('获取推荐节点错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取推荐节点失败',
        error: error.message
      });
    }
  }

  // 管理员：创建新技能节点
  static async createSkillNode(req, res) {
    try {
      const { name, parent_id, description, difficulty, course_id, points_required } = req.body;
      
      if (!name || !description || !difficulty || !course_id) {
        return res.status(400).json({
          success: false,
          message: '请填写必要的节点信息'
        });
      }
      
      const pool = getMySQLPool();
      const skillTreeModel = new SkillTreeMySQLModel(pool);
      
      // 如果有父节点，检查父节点是否存在
      if (parent_id) {
        const parentNode = await skillTreeModel.getSkillNode(parent_id);
        if (!parentNode) {
          return res.status(400).json({
            success: false,
            message: '指定的父节点不存在'
          });
        }
      }
      
      // 检查课程是否存在
      const [courses] = await pool.execute('SELECT id FROM courses WHERE id = ?', [course_id]);
      if (courses.length === 0) {
        return res.status(400).json({
          success: false,
          message: '指定的课程不存在'
        });
      }
      
      // 创建节点
      const nodeId = await skillTreeModel.createSkillNode({
        name,
        parent_id,
        description,
        difficulty,
        course_id,
        points_required
      });
      
      // 为所有现有用户初始化该节点的进度
      await pool.execute(
        `INSERT INTO user_progress (user_id, node_id, status) 
         SELECT id, ?, CASE WHEN ? IS NULL THEN 'pending' ELSE 'locked' END 
         FROM users`,
        [nodeId, parent_id]
      );
      
      return res.status(201).json({
        success: true,
        message: '技能节点创建成功',
        data: { nodeId }
      });
    } catch (error) {
      console.error('创建技能节点错误:', error);
      return res.status(500).json({
        success: false,
        message: '创建技能节点失败',
        error: error.message
      });
    }
  }

  // 管理员：更新技能节点
  static async updateSkillNode(req, res) {
    try {
      const { nodeId } = req.params;
      const updateData = req.body;
      
      const pool = getMySQLPool();
      const skillTreeModel = new SkillTreeMySQLModel(pool);
      
      // 检查节点是否存在
      const node = await skillTreeModel.getSkillNode(nodeId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: '技能节点不存在'
        });
      }
      
      // 更新节点
      await skillTreeModel.updateSkillNode(nodeId, updateData);
      
      return res.status(200).json({
        success: true,
        message: '技能节点更新成功'
      });
    } catch (error) {
      console.error('更新技能节点错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新技能节点失败',
        error: error.message
      });
    }
  }

  // 管理员：删除技能节点
  static async deleteSkillNode(req, res) {
    try {
      const { nodeId } = req.params;
      const pool = getMySQLPool();
      const skillTreeModel = new SkillTreeMySQLModel(pool);
      
      // 检查节点是否存在
      const node = await skillTreeModel.getSkillNode(nodeId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: '技能节点不存在'
        });
      }
      
      // 检查是否有子节点
      const childNodes = await skillTreeModel.getChildNodes(nodeId);
      if (childNodes.length > 0) {
        return res.status(400).json({
          success: false,
          message: '无法删除具有子节点的节点，请先删除子节点'
        });
      }
      
      // 删除节点相关的用户进度
      await pool.execute('DELETE FROM user_progress WHERE node_id = ?', [nodeId]);
      
      // 删除节点
      await skillTreeModel.deleteSkillNode(nodeId);
      
      return res.status(200).json({
        success: true,
        message: '技能节点删除成功'
      });
    } catch (error) {
      console.error('删除技能节点错误:', error);
      return res.status(500).json({
        success: false,
        message: '删除技能节点失败',
        error: error.message
      });
    }
  }
}

module.exports = SkillTreeController;