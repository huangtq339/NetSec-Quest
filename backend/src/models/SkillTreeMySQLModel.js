class SkillTreeMySQLModel {
  constructor(mysqlPool) {
    this.mysqlPool = mysqlPool;
  }

  // 创建课程
  async createCourse(courseData) {
    try {
      const { name, description } = courseData;
      
      const [result] = await this.mysqlPool.execute(
        'INSERT INTO courses (name, description) VALUES (?, ?)',
        [name, description]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  // 获取所有课程
  async getCourses() {
    try {
      // 兼容MySQL和SQLite
      if (this.mysqlPool.execute) {
        // MySQL连接池
        const [rows] = await this.mysqlPool.execute('SELECT * FROM courses');
        return rows;
      } else if (this.mysqlPool.all) {
        // SQLite连接 - 使用原始的all方法
        return new Promise((resolve, reject) => {
          this.mysqlPool.all('SELECT * FROM courses', (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      } else {
        throw new Error('不支持的数据库连接类型');
      }
    } catch (error) {
      console.error('Error getting courses:', error);
      throw error;
    }
  }

  // 创建技能节点
  async createSkillNode(nodeData) {
    try {
      const { name, parent_id, description, difficulty, course_id, points_required } = nodeData;
      
      const [result] = await this.mysqlPool.execute(
        'INSERT INTO skill_nodes (name, parent_id, description, difficulty, course_id, points_required) VALUES (?, ?, ?, ?, ?, ?)',
        [name, parent_id || null, description, difficulty, course_id, points_required || 0]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating skill node:', error);
      throw error;
    }
  }

  // 获取技能节点
  async getSkillNode(id) {
    try {
      const [rows] = await this.mysqlPool.execute(
        'SELECT * FROM skill_nodes WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting skill node:', error);
      throw error;
    }
  }

  // 获取课程下的所有节点
  async getNodesByCourse(courseId) {
    try {
      const [rows] = await this.mysqlPool.execute(
        'SELECT * FROM skill_nodes WHERE course_id = ? ORDER BY parent_id',
        [courseId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting nodes by course:', error);
      throw error;
    }
  }

  // 获取子节点
  async getChildNodes(parentId) {
    try {
      const [rows] = await this.mysqlPool.execute(
        'SELECT * FROM skill_nodes WHERE parent_id = ?',
        [parentId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting child nodes:', error);
      throw error;
    }
  }

  // 构建技能树结构
  async buildSkillTree(courseId = null) {
    try {
      let query = 'SELECT * FROM skill_nodes';
      const params = [];
      
      if (courseId) {
        query += ' WHERE course_id = ?';
        params.push(courseId);
      }
      
      const [nodes] = await this.mysqlPool.execute(query, params);
      
      // 构建树结构
      const nodeMap = {};
      const rootNodes = [];
      
      // 首先创建所有节点的映射
      nodes.forEach(node => {
        nodeMap[node.id] = {
          ...node,
          children: []
        };
      });
      
      // 然后构建父子关系
      nodes.forEach(node => {
        if (node.parent_id === null || node.parent_id === undefined) {
          rootNodes.push(nodeMap[node.id]);
        } else if (nodeMap[node.parent_id]) {
          nodeMap[node.parent_id].children.push(nodeMap[node.id]);
        }
      });
      
      return rootNodes;
    } catch (error) {
      console.error('Error building skill tree:', error);
      throw error;
    }
  }

  // 更新技能节点
  async updateSkillNode(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      });
      
      values.push(id);
      
      await this.mysqlPool.execute(
        `UPDATE skill_nodes SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return true;
    } catch (error) {
      console.error('Error updating skill node:', error);
      throw error;
    }
  }

  // 删除技能节点
  async deleteSkillNode(id) {
    try {
      await this.mysqlPool.execute('DELETE FROM skill_nodes WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting skill node:', error);
      throw error;
    }
  }

  // 更新用户技能节点进度
  async updateUserProgress(userId, nodeId, status, score = null) {
    try {
      const completedAt = status === 'completed' ? new Date() : null;
      
      await this.mysqlPool.execute(
        `INSERT INTO user_progress (user_id, node_id, status, score, completed_at) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE status = ?, score = ?, completed_at = ?`,
        [userId, nodeId, status, score, completedAt, status, score, completedAt]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  // 获取用户技能树进度
  async getUserSkillProgress(userId, courseId = null) {
    try {
      let query = `
        SELECT sn.id, sn.name, sn.parent_id, sn.difficulty, 
               up.status, up.score, up.completed_at
        FROM skill_nodes sn
        LEFT JOIN user_progress up ON sn.id = up.node_id AND up.user_id = ?
      `;
      const params = [userId];
      
      if (courseId) {
        query += ' WHERE sn.course_id = ?';
        params.push(courseId);
      }
      
      const [rows] = await this.mysqlPool.execute(query, params);
      
      // 构建带进度的树结构
      const nodeMap = {};
      const rootNodes = [];
      
      rows.forEach(row => {
        nodeMap[row.id] = {
          id: row.id,
          name: row.name,
          parent_id: row.parent_id,
          difficulty: row.difficulty,
          status: row.status || 'pending',
          score: row.score,
          completed_at: row.completed_at,
          children: []
        };
      });
      
      rows.forEach(row => {
        const node = nodeMap[row.id];
        if (node.parent_id === null || node.parent_id === undefined) {
          rootNodes.push(node);
        } else if (nodeMap[node.parent_id]) {
          nodeMap[node.parent_id].children.push(node);
        }
      });
      
      return rootNodes;
    } catch (error) {
      console.error('Error getting user skill progress:', error);
      throw error;
    }
  }

  // 获取用户整体进度统计
  async getUserOverallProgress(userId) {
    try {
      const [rows] = await this.mysqlPool.execute(
        `SELECT 
          COUNT(sn.id) as total_nodes,
          SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_nodes,
          ROUND((SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(sn.id)), 2) as completion_percentage,
          SUM(CASE WHEN up.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_nodes
        FROM skill_nodes sn
        LEFT JOIN user_progress up ON sn.id = up.node_id AND up.user_id = ?`,
        [userId]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error getting user overall progress:', error);
      throw error;
    }
  }

  // 检查节点是否解锁（基于前置条件）
  async checkNodeUnlockStatus(userId, nodeId) {
    try {
      // 获取节点信息
      const node = await this.getSkillNode(nodeId);
      if (!node) return false;
      
      // 如果是根节点，自动解锁
      if (node.parent_id === null) return true;
      
      // 检查父节点是否已完成
      const [rows] = await this.mysqlPool.execute(
        'SELECT status FROM user_progress WHERE user_id = ? AND node_id = ?',
        [userId, node.parent_id]
      );
      
      // 如果父节点已完成，则解锁当前节点
      return rows.length > 0 && rows[0].status === 'completed';
    } catch (error) {
      console.error('Error checking node unlock status:', error);
      throw error;
    }
  }

  // 批量创建技能节点（用于初始化技能树）
  async batchCreateNodes(nodes) {
    try {
      const connection = await this.mysqlPool.getConnection();
      await connection.beginTransaction();
      
      try {
        const insertPromises = nodes.map(node => 
          connection.execute(
            'INSERT INTO skill_nodes (name, parent_id, description, difficulty, course_id, points_required) VALUES (?, ?, ?, ?, ?, ?)',
            [node.name, node.parent_id || null, node.description, node.difficulty, node.course_id, node.points_required || 0]
          )
        );
        
        const results = await Promise.all(insertPromises);
        await connection.commit();
        
        return results.map(result => result[0].insertId);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error batch creating nodes:', error);
      throw error;
    }
  }

  // 获取节点关联的任务
  async getNodeTasks(nodeId) {
    try {
      const [rows] = await this.mysqlPool.execute(
        'SELECT * FROM tasks WHERE node_id = ?',
        [nodeId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting node tasks:', error);
      throw error;
    }
  }
}

module.exports = SkillTreeMySQLModel;