const { getMySQLPool } = require('../utils/database');

class SkillTreeModel {
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

  // 获取技能树节点
  async getNodes() {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute('SELECT * FROM skill_nodes');
      return rows;
    } catch (error) {
      console.error('Error getting skill nodes:', error);
      throw error;
    }
  }

  // 获取单个节点
  async getNodeById(nodeId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute('SELECT * FROM skill_nodes WHERE node_id = ?', [nodeId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting skill node by id:', error);
      throw error;
    }
  }

  // 获取节点的子节点
  async getNodeChildren(nodeId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute('SELECT * FROM skill_nodes WHERE parent_id = ?', [nodeId]);
      return rows;
    } catch (error) {
      console.error('Error getting node children:', error);
      throw error;
    }
  }

  // 获取技能树
  async getSkillTree() {
    try {
      const db = await this.getConnection();
      const [nodes] = await db.execute('SELECT * FROM skill_nodes');
      
      // 构建树结构
      const nodeMap = {};
      const rootNodes = [];
      
      // 首先创建所有节点的映射
      nodes.forEach(node => {
        node.children = [];
        nodeMap[node.node_id] = node;
      });
      
      // 然后构建树结构
      nodes.forEach(node => {
        if (node.parent_id === null || node.parent_id === 0) {
          rootNodes.push(node);
        } else if (nodeMap[node.parent_id]) {
          nodeMap[node.parent_id].children.push(node);
        }
      });
      
      return rootNodes;
    } catch (error) {
      console.error('Error getting skill tree:', error);
      throw error;
    }
  }

  // 获取用户技能进度
  async getUserProgress(userId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        'SELECT * FROM user_progress WHERE user_id = ?',
        [userId]
      );
      
      // 转换为映射便于查找
      const progressMap = {};
      rows.forEach(progress => {
        progressMap[progress.node_id] = progress;
      });
      
      return progressMap;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // 更新节点进度
  async updateNodeProgress(userId, nodeId, status, score = null) {
    try {
      const db = await this.getConnection();
      
      // 检查是否已存在进度记录
      const [existing] = await db.execute(
        'SELECT * FROM user_progress WHERE user_id = ? AND node_id = ?',
        [userId, nodeId]
      );
      
      if (existing.length > 0) {
        // 更新现有记录
        await db.execute(
          'UPDATE user_progress SET status = ?, score = ?, updated_at = NOW() WHERE user_id = ? AND node_id = ?',
          [status, score, userId, nodeId]
        );
      } else {
        // 创建新记录
        await db.execute(
          'INSERT INTO user_progress (user_id, node_id, status, score, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [userId, nodeId, status, score]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating node progress:', error);
      throw error;
    }
  }

  // 获取课程信息
  async getCourses() {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute('SELECT * FROM courses');
      return rows;
    } catch (error) {
      console.error('Error getting courses:', error);
      throw error;
    }
  }

  // 获取课程节点
  async getCourseNodes(courseId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        'SELECT sn.* FROM skill_nodes sn JOIN course_nodes cn ON sn.node_id = cn.node_id WHERE cn.course_id = ?',
        [courseId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting course nodes:', error);
      throw error;
    }
  }

  // 获取任务信息
  async getTasks(nodeId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute('SELECT * FROM tasks WHERE node_id = ?', [nodeId]);
      return rows;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  // 更新任务进度
  async updateTaskProgress(userId, taskId, status, score = null) {
    try {
      const db = await this.getConnection();
      
      // 检查是否已存在进度记录
      const [existing] = await db.execute(
        'SELECT * FROM user_task_progress WHERE user_id = ? AND task_id = ?',
        [userId, taskId]
      );
      
      const now = new Date();
      if (existing.length > 0) {
        // 更新现有记录
        await db.execute(
          'UPDATE user_task_progress SET status = ?, score = ?, attempts = attempts + 1, updated_at = ? WHERE user_id = ? AND task_id = ?',
          [status, score, now, userId, taskId]
        );
      } else {
        // 创建新记录
        await db.execute(
          'INSERT INTO user_task_progress (user_id, task_id, status, score, attempts, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
          [userId, taskId, status, score, now, now]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  }

  // 获取靶机配置
  async getVMConfig(taskId) {
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(
        'SELECT * FROM vm_configs WHERE task_id = ?',
        [taskId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting VM config:', error);
      throw error;
    }
  }

  // 保存任务评估结果
  async saveTaskEvaluation(evaluationData) {
    try {
      const { submissionId, userId, taskId, score, status, errors = [], logs = '' } = evaluationData;
      const db = await this.getConnection();
      
      await db.execute(
        'INSERT INTO task_evaluations (submission_id, user_id, task_id, score, status, errors, logs, evaluated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [submissionId, userId, taskId, score, status, JSON.stringify(errors), logs]
      );
      
      return true;
    } catch (error) {
      console.error('Error saving task evaluation:', error);
      throw error;
    }
  }
}

module.exports = SkillTreeModel;