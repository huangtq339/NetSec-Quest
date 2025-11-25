const { getDatabaseConnection } = require('../utils/database');

/**
 * 技能树模型 - 合并版
 * 整合了原SkillTreeModel和SkillTreeMySQLModel的功能
 */
class SkillTreeModel {
  constructor(db = null) {
    // 如果没有传入数据库连接，使用默认连接
    this.db = db;
  }

  /**
   * 获取数据库连接
   */
  async getConnection() {
    if (!this.db) {
      return await getDatabaseConnection();
    }
    return this.db;
  }

  /**
   * 获取所有课程
   */
  async getCourses() {
    const db = await this.getConnection();
    const [courses] = await db.execute('SELECT * FROM courses ORDER BY id');
    return courses;
  }

  /**
   * 获取技能节点信息
   */
  async getSkillNode(nodeId) {
    const db = await this.getConnection();
    const [nodes] = await db.execute('SELECT * FROM skill_nodes WHERE id = ?', [nodeId]);
    return nodes.length > 0 ? nodes[0] : null;
  }

  /**
   * 构建技能树结构
   */
  async buildSkillTree(courseId) {
    const db = await this.getConnection();
    
    // 获取指定课程的所有节点
    const [nodes] = await db.execute(
      'SELECT * FROM skill_nodes WHERE course_id = ? ORDER BY id', 
      [courseId]
    );

    // 构建树结构
    const nodeMap = {};
    let rootNodes = [];

    // 首先创建所有节点的映射
    nodes.forEach(node => {
      nodeMap[node.id] = { ...node, children: [] };
    });

    // 然后构建父子关系
    nodes.forEach(node => {
      if (!node.parent_id) {
        rootNodes.push(nodeMap[node.id]);
      } else if (nodeMap[node.parent_id]) {
        nodeMap[node.parent_id].children.push(nodeMap[node.id]);
      }
    });

    // 如果只有一个根节点，直接返回该节点
    if (rootNodes.length === 1) {
      return rootNodes[0];
    }

    // 否则返回根节点数组
    return { id: 'root', name: '技能树', children: rootNodes };
  }

  /**
   * 获取用户技能树进度
   */
  async getUserSkillProgress(userId, courseId = null) {
    const db = await this.getConnection();
    
    // 如果指定了课程ID，获取该课程的技能树
    if (courseId) {
      const skillTree = await this.buildSkillTree(courseId);
      
      // 获取用户在该课程的进度
      const [progress] = await db.execute(
        'SELECT node_id, status, score, completed_at FROM user_progress WHERE user_id = ?',
        [userId]
      );
      
      // 创建进度映射
      const progressMap = {};
      progress.forEach(item => {
        progressMap[item.node_id] = item;
      });
      
      // 递归添加进度信息到技能树节点
      const addProgressToNodes = (nodes) => {
        nodes.forEach(node => {
          if (progressMap[node.id]) {
            node.userProgress = progressMap[node.id];
          } else {
            // 未开始的节点默认为locked
            node.userProgress = { status: 'locked' };
          }
          
          if (node.children && node.children.length > 0) {
            addProgressToNodes(node.children);
          }
        });
      };
      
      if (skillTree.children) {
        addProgressToNodes(skillTree.children);
      } else {
        // 处理单个根节点的情况
        if (progressMap[skillTree.id]) {
          skillTree.userProgress = progressMap[skillTree.id];
        } else {
          skillTree.userProgress = { status: 'locked' };
        }
      }
      
      return skillTree;
    }
    
    // 如果没有指定课程ID，返回所有课程的进度概览
    return this.getUserOverallProgress(userId);
  }

  /**
   * 获取用户整体进度统计
   */
  async getUserOverallProgress(userId) {
    const db = await this.getConnection();
    
    // 计算整体完成情况
    const [stats] = await db.execute(
      `SELECT 
        COUNT(DISTINCT sn.id) as total_nodes,
        SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_nodes,
        ROUND((SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT sn.id)), 2) as completion_percentage
      FROM skill_nodes sn
      LEFT JOIN user_progress up ON sn.id = up.node_id AND up.user_id = ?`,
      [userId]
    );
    
    return stats[0];
  }

  /**
   * 获取节点任务列表
   */
  async getNodeTasks(nodeId) {
    const db = await this.getConnection();
    
    const [tasks] = await db.execute(
      `SELECT t.id, t.title, t.description, t.difficulty, t.points, t.content, t.created_at
       FROM tasks t
       JOIN node_tasks nt ON t.id = nt.task_id
       WHERE nt.node_id = ?
       ORDER BY t.id`,
      [nodeId]
    );
    
    return tasks;
  }

  /**
   * 检查节点解锁状态
   */
  async checkNodeUnlockStatus(userId, nodeId) {
    const db = await this.getConnection();
    
    // 获取节点信息
    const node = await this.getSkillNode(nodeId);
    if (!node) return false;
    
    // 如果没有父节点，默认是已解锁的
    if (!node.parent_id) return true;
    
    // 检查父节点是否完成
    const [parentProgress] = await db.execute(
      'SELECT status FROM user_progress WHERE user_id = ? AND node_id = ? AND status = ?',
      [userId, node.parent_id, 'completed']
    );
    
    return parentProgress.length > 0;
  }

  /**
   * 更新用户进度
   */
  async updateUserProgress(userId, nodeId, status, score = null) {
    const db = await this.getConnection();
    
    // 更新或插入用户进度
    await db.execute(
      `INSERT INTO user_progress (user_id, node_id, status, score, completed_at)
       VALUES (?, ?, ?, ?, CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END)
       ON DUPLICATE KEY UPDATE 
         status = VALUES(status), 
         score = VALUES(score), 
         completed_at = CASE WHEN VALUES(status) = 'completed' THEN NOW() ELSE completed_at END`,
      [userId, nodeId, status, score, status]
    );
  }

  /**
   * 获取子节点列表
   */
  async getChildNodes(nodeId) {
    const db = await this.getConnection();
    const [children] = await db.execute(
      'SELECT * FROM skill_nodes WHERE parent_id = ?',
      [nodeId]
    );
    return children;
  }

  /**
   * 创建技能节点
   */
  async createSkillNode(nodeData) {
    const db = await this.getConnection();
    const { name, parent_id, description, difficulty, course_id, points_required } = nodeData;
    
    const [result] = await db.execute(
      `INSERT INTO skill_nodes (name, parent_id, description, difficulty, course_id, points_required)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, parent_id || null, description, difficulty, course_id, points_required || null]
    );
    
    return result.insertId;
  }

  /**
   * 更新技能节点
   */
  async updateSkillNode(nodeId, updateData) {
    const db = await this.getConnection();
    
    // 构建更新语句
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClauses = fields.map(field => `${field} = ?`).join(', ');
    
    await db.execute(
      `UPDATE skill_nodes SET ${setClauses} WHERE id = ?`,
      [...values, nodeId]
    );
  }

  /**
   * 删除技能节点
   */
  async deleteSkillNode(nodeId) {
    const db = await this.getConnection();
    await db.execute('DELETE FROM skill_nodes WHERE id = ?', [nodeId]);
  }

  /**
   * 检查节点是否可访问
   */
  async checkNodeAccessibility(userId, nodeId) {
    // 结合解锁状态检查和权限检查
    const isUnlocked = await this.checkNodeUnlockStatus(userId, nodeId);
    
    // 可以根据需要添加额外的权限检查
    // 例如：检查用户是否有特定角色等
    
    return isUnlocked;
  }
}

module.exports = SkillTreeModel;