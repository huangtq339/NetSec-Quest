class TaskModel {
  constructor(mysqlPool) {
    this.mysqlPool = mysqlPool;
  }

  // 创建新任务
  async createTask(taskData) {
    try {
      const { title, description, difficulty, points_reward, node_id, vm_template_id, evaluation_script } = taskData;
      
      const [result] = await this.mysqlPool.execute(
        'INSERT INTO tasks (title, description, difficulty, points_reward, node_id, vm_template_id, evaluation_script) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, difficulty, points_reward, node_id, vm_template_id, evaluation_script]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // 获取任务列表
  async getTasks(filters = {}) {
    try {
      let query = 'SELECT * FROM tasks WHERE 1=1';
      const params = [];
      
      if (filters.node_id) {
        query += ' AND node_id = ?';
        params.push(filters.node_id);
      }
      
      if (filters.difficulty) {
        query += ' AND difficulty = ?';
        params.push(filters.difficulty);
      }
      
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      const [rows] = await this.mysqlPool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  // 通过ID获取任务详情
  async getTaskById(id) {
    try {
      const [rows] = await this.mysqlPool.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting task by id:', error);
      throw error;
    }
  }

  // 更新任务
  async updateTask(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      });
      
      values.push(id);
      
      await this.mysqlPool.execute(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // 删除任务
  async deleteTask(id) {
    try {
      await this.mysqlPool.execute('DELETE FROM tasks WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // 提交任务
  async submitTask(submissionData) {
    try {
      const { user_id, task_id, submission_content } = submissionData;
      
      const [result] = await this.mysqlPool.execute(
        'INSERT INTO task_submissions (user_id, task_id, submission_content) VALUES (?, ?, ?)',
        [user_id, task_id, submission_content]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
  }

  // 评分任务提交
  async gradeSubmission(submissionId, score, feedback, status) {
    try {
      // 开始事务
      const connection = await this.mysqlPool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 获取提交信息
        const [submissions] = await connection.execute(
          'SELECT user_id, task_id FROM task_submissions WHERE id = ?',
          [submissionId]
        );
        
        if (submissions.length === 0) {
          throw new Error('Submission not found');
        }
        
        const { user_id, task_id } = submissions[0];
        
        // 更新提交状态
        await connection.execute(
          'UPDATE task_submissions SET score = ?, feedback = ?, status = ? WHERE id = ?',
          [score, feedback, status, submissionId]
        );
        
        // 如果通过，更新用户积分和进度
        if (status === 'passed') {
          // 获取任务奖励积分
          const [tasks] = await connection.execute(
            'SELECT points_reward, node_id FROM tasks WHERE id = ?',
            [task_id]
          );
          
          if (tasks.length > 0) {
            const { points_reward, node_id } = tasks[0];
            
            // 更新用户积分
            await connection.execute(
              'UPDATE users SET points = points + ? WHERE id = ?',
              [points_reward, user_id]
            );
            
            // 记录积分变动
            await connection.execute(
              'INSERT INTO point_records (user_id, points_change, reason, related_id, related_type) VALUES (?, ?, ?, ?, ?)',
              [user_id, points_reward, 'task_completed', task_id, 'task']
            );
            
            // 更新节点进度
            await connection.execute(
              'INSERT INTO user_progress (user_id, node_id, status, score, completed_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = ?, score = ?, completed_at = NOW()',
              [user_id, node_id, 'completed', score, 'completed', score]
            );
          }
        }
        
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
      console.error('Error grading submission:', error);
      throw error;
    }
  }

  // 获取用户任务提交历史
  async getUserSubmissions(userId, taskId = null) {
    try {
      let query = 'SELECT * FROM task_submissions WHERE user_id = ?';
      const params = [userId];
      
      if (taskId) {
        query += ' AND task_id = ?';
        params.push(taskId);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await this.mysqlPool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error getting user submissions:', error);
      throw error;
    }
  }

  // 获取任务统计信息
  async getTaskStatistics(taskId) {
    try {
      const [rows] = await this.mysqlPool.execute(
        `SELECT 
          COUNT(*) as total_submissions,
          SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_submissions,
          AVG(score) as average_score,
          MIN(created_at) as first_submission,
          MAX(created_at) as last_submission
        FROM task_submissions 
        WHERE task_id = ?`,
        [taskId]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error getting task statistics:', error);
      throw error;
    }
  }

  // 获取用户任务进度
  async getUserTaskProgress(userId, taskId) {
    try {
      const [rows] = await this.mysqlPool.execute(
        `SELECT ts.*, t.title, t.difficulty, t.points_reward 
         FROM task_submissions ts
         JOIN tasks t ON ts.task_id = t.id
         WHERE ts.user_id = ? AND ts.task_id = ?
         ORDER BY ts.created_at DESC LIMIT 1`,
        [userId, taskId]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting user task progress:', error);
      throw error;
    }
  }

  // 获取推荐任务（基于用户进度和难度）
  async getRecommendedTasks(userId, limit = 5) {
    try {
      // 这里可以实现更复杂的推荐算法
      // 目前简单实现：获取用户未完成的任务，按难度排序
      const [rows] = await this.mysqlPool.execute(
        `SELECT t.* 
         FROM tasks t
         LEFT JOIN (
           SELECT DISTINCT task_id 
           FROM task_submissions 
           WHERE user_id = ? AND status = 'passed'
         ) ut ON t.id = ut.task_id
         WHERE ut.task_id IS NULL
         ORDER BY 
           CASE t.difficulty
             WHEN 'easy' THEN 1
             WHEN 'medium' THEN 2
             WHEN 'hard' THEN 3
           END
         LIMIT ?`,
        [userId, limit]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting recommended tasks:', error);
      throw error;
    }
  }
}

module.exports = TaskModel;