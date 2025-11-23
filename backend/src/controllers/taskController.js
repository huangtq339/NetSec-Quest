const { getMySQLPool } = require('../utils/database');
const TaskModel = require('../models/TaskModel');

class TaskController {
  // 获取任务列表
  static async getTasks(req, res) {
    try {
      const { nodeId, status } = req.query;
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      const tasks = await taskModel.getTasks({ nodeId, status });
      
      return res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('获取任务列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取任务列表失败',
        error: error.message
      });
    }
  }

  // 获取任务详情
  static async getTaskDetail(req, res) {
    try {
      const { taskId } = req.params;
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      const task = await taskModel.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }
      
      // 如果用户已登录，获取用户任务提交历史
      if (req.user) {
        const submissions = await taskModel.getUserSubmissions(
          req.user.id,
          taskId,
          { limit: 5 }
        );
        task.submissions = submissions;
        
        // 获取用户最新的任务状态
        const [userTaskStatus] = await pool.execute(
          'SELECT status, last_attempt_at, completed_at FROM user_tasks WHERE user_id = ? AND task_id = ?',
          [req.user.id, taskId]
        );
        
        if (userTaskStatus.length > 0) {
          task.userStatus = userTaskStatus[0];
        }
      }
      
      return res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('获取任务详情错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取任务详情失败',
        error: error.message
      });
    }
  }

  // 提交任务
  static async submitTask(req, res) {
    try {
      const userId = req.user.id;
      const { taskId } = req.params;
      const { answer, additionalInfo } = req.body;
      
      if (!answer) {
        return res.status(400).json({
          success: false,
          message: '请提供任务答案'
        });
      }
      
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      // 检查任务是否存在
      const task = await taskModel.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }
      
      // 自动评分逻辑（简单示例，实际可能需要更复杂的评估）
      let score = 0;
      let passed = false;
      
      // 根据任务类型进行评分
      if (task.type === 'multiple_choice') {
        // 多选题评分
        if (JSON.stringify(answer.sort()) === JSON.stringify(JSON.parse(task.correct_answer).sort())) {
          score = 100;
          passed = true;
        }
      } else if (task.type === 'single_choice') {
        // 单选题评分
        if (answer === task.correct_answer) {
          score = 100;
          passed = true;
        }
      } else if (task.type === 'fill_blank') {
        // 填空题评分（支持多个正确答案）
        const correctAnswers = JSON.parse(task.correct_answer);
        if (correctAnswers.includes(answer)) {
          score = 100;
          passed = true;
        }
      } else if (task.type === 'short_answer' || task.type === 'practical') {
        // 简答题和实践题需要手动评分
        score = 0;
        passed = false;
      }
      
      // 提交任务
      const submissionId = await taskModel.submitTask({
        userId,
        taskId,
        answer,
        additionalInfo,
        score,
        passed
      });
      
      // 更新用户任务状态
      const status = passed ? 'completed' : 'attempted';
      const completedAt = passed ? new Date() : null;
      
      await pool.execute(
        `INSERT INTO user_tasks (user_id, task_id, status, last_attempt_at, completed_at, attempt_count) 
         VALUES (?, ?, ?, NOW(), ?, 1) 
         ON DUPLICATE KEY UPDATE 
           status = ?, 
           last_attempt_at = NOW(), 
           completed_at = COALESCE(completed_at, ?),
           attempt_count = attempt_count + 1`,
        [userId, taskId, status, completedAt, status, completedAt]
      );
      
      // 如果任务通过，增加用户积分
      if (passed) {
        const pointsToAdd = parseInt(task.points) || 10;
        await pool.execute(
          'UPDATE user_points SET points = points + ? WHERE user_id = ?',
          [pointsToAdd, userId]
        );
        
        // 检查是否需要解锁技能节点
        if (task.node_id) {
          await pool.execute(
            `UPDATE user_progress SET status = 'completed', completed_at = NOW() 
             WHERE user_id = ? AND node_id = ? AND status != 'completed'`,
            [userId, task.node_id]
          );
          
          // 解锁子节点
          await pool.execute(
            `UPDATE user_progress up
             JOIN skill_nodes sn ON up.node_id = sn.id
             SET up.status = 'pending'
             WHERE up.user_id = ? AND sn.parent_id = ? AND up.status = 'locked'`,
            [userId, task.node_id]
          );
        }
      }
      
      return res.status(200).json({
        success: true,
        message: '任务提交成功',
        data: {
          submissionId,
          score,
          passed,
          feedback: passed ? '恭喜您完成任务！' : '请继续尝试。'
        }
      });
    } catch (error) {
      console.error('提交任务错误:', error);
      return res.status(500).json({
        success: false,
        message: '提交任务失败',
        error: error.message
      });
    }
  }

  // 获取用户任务历史
  static async getUserTaskHistory(req, res) {
    try {
      const userId = req.user.id;
      const { taskId, limit = 10, offset = 0 } = req.query;
      
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      const submissions = await taskModel.getUserSubmissions(userId, taskId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return res.status(200).json({
        success: true,
        data: submissions
      });
    } catch (error) {
      console.error('获取用户任务历史错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取用户任务历史失败',
        error: error.message
      });
    }
  }

  // 获取任务统计信息
  static async getTaskStatistics(req, res) {
    try {
      const { taskId } = req.params;
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      const statistics = await taskModel.getTaskStatistics(taskId);
      
      if (!statistics) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('获取任务统计信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取任务统计信息失败',
        error: error.message
      });
    }
  }

  // 获取用户完成的任务列表
  static async getCompletedTasks(req, res) {
    try {
      const userId = req.user.id;
      const pool = getMySQLPool();
      
      const [tasks] = await pool.execute(
        `SELECT t.id, t.title, t.description, t.type, t.points, 
               ut.completed_at, ut.attempt_count
        FROM tasks t
        JOIN user_tasks ut ON t.id = ut.task_id
        WHERE ut.user_id = ? AND ut.status = 'completed'
        ORDER BY ut.completed_at DESC`,
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('获取已完成任务列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取已完成任务列表失败',
        error: error.message
      });
    }
  }

  // 管理员：创建任务
  static async createTask(req, res) {
    try {
      const { title, description, node_id, type, points, difficulty, 
              correct_answer, options, hints } = req.body;
      
      if (!title || !description || !node_id || !type || !points) {
        return res.status(400).json({
          success: false,
          message: '请填写必要的任务信息'
        });
      }
      
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      // 检查技能节点是否存在
      const [nodes] = await pool.execute('SELECT id FROM skill_nodes WHERE id = ?', [node_id]);
      if (nodes.length === 0) {
        return res.status(400).json({
          success: false,
          message: '指定的技能节点不存在'
        });
      }
      
      // 创建任务
      const taskId = await taskModel.createTask({
        title,
        description,
        node_id,
        type,
        points,
        difficulty,
        correct_answer,
        options,
        hints
      });
      
      return res.status(201).json({
        success: true,
        message: '任务创建成功',
        data: { taskId }
      });
    } catch (error) {
      console.error('创建任务错误:', error);
      return res.status(500).json({
        success: false,
        message: '创建任务失败',
        error: error.message
      });
    }
  }

  // 管理员：更新任务
  static async updateTask(req, res) {
    try {
      const { taskId } = req.params;
      const updateData = req.body;
      
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      // 检查任务是否存在
      const task = await taskModel.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }
      
      // 更新任务
      await taskModel.updateTask(taskId, updateData);
      
      return res.status(200).json({
        success: true,
        message: '任务更新成功'
      });
    } catch (error) {
      console.error('更新任务错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新任务失败',
        error: error.message
      });
    }
  }

  // 管理员：删除任务
  static async deleteTask(req, res) {
    try {
      const { taskId } = req.params;
      const pool = getMySQLPool();
      const taskModel = new TaskModel(pool);
      
      // 检查任务是否存在
      const task = await taskModel.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }
      
      // 删除任务相关的用户提交记录
      await pool.execute('DELETE FROM task_submissions WHERE task_id = ?', [taskId]);
      await pool.execute('DELETE FROM user_tasks WHERE task_id = ?', [taskId]);
      
      // 删除任务
      await taskModel.deleteTask(taskId);
      
      return res.status(200).json({
        success: true,
        message: '任务删除成功'
      });
    } catch (error) {
      console.error('删除任务错误:', error);
      return res.status(500).json({
        success: false,
        message: '删除任务失败',
        error: error.message
      });
    }
  }

  // 管理员：评分任务（适用于简答题和实践题）
  static async gradeTask(req, res) {
    try {
      const { submissionId } = req.params;
      const { score, feedback } = req.body;
      
      if (score === undefined || score === null || score < 0 || score > 100) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的评分（0-100）'
        });
      }
      
      const pool = getMySQLPool();
      const passed = score >= 60;
      
      // 更新评分
      const [result] = await pool.execute(
        'UPDATE task_submissions SET score = ?, feedback = ?, graded_by_admin = TRUE, graded_at = NOW() ' +
        'WHERE id = ?',
        [score, feedback, submissionId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '提交记录不存在'
        });
      }
      
      // 获取提交信息以更新用户任务状态
      const [submissions] = await pool.execute(
        'SELECT user_id, task_id FROM task_submissions WHERE id = ?',
        [submissionId]
      );
      
      const { user_id: userId, task_id: taskId } = submissions[0];
      
      // 如果评分后通过，更新用户任务状态
      if (passed) {
        // 获取任务信息
        const [tasks] = await pool.execute(
          'SELECT points, node_id FROM tasks WHERE id = ?',
          [taskId]
        );
        
        const task = tasks[0];
        
        // 更新用户任务状态
        await pool.execute(
          'UPDATE user_tasks SET status = ? WHERE user_id = ? AND task_id = ?',
          ['completed', userId, taskId]
        );
        
        // 增加用户积分
        await pool.execute(
          'UPDATE user_points SET points = points + ? WHERE user_id = ?',
          [task.points, userId]
        );
        
        // 解锁相关技能节点
        if (task.node_id) {
          await pool.execute(
            `UPDATE user_progress SET status = 'completed', completed_at = NOW() 
             WHERE user_id = ? AND node_id = ?`,
            [userId, task.node_id]
          );
        }
      }
      
      return res.status(200).json({
        success: true,
        message: '任务评分成功',
        data: {
          submissionId,
          score,
          feedback,
          passed
        }
      });
    } catch (error) {
      console.error('评分任务错误:', error);
      return res.status(500).json({
        success: false,
        message: '评分任务失败',
        error: error.message
      });
    }
  }
}

module.exports = TaskController;