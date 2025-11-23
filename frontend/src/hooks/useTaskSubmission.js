import { useState } from 'react';
import { message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useSkillTree } from '../contexts/SkillTreeContext';

// 任务难度对应的积分奖励
const DIFFICULTY_POINTS = {
  easy: 10,
  medium: 25,
  hard: 50,
  expert: 100
};

// 首次完成额外奖励
const FIRST_COMPLETION_BONUS = 20;

const useTaskSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateUserScore } = useAuth();
  const { updateNodeProgress, selectedNode } = useSkillTree();

  // 提交任务
  const submitTask = async (taskId, answer, isHintUsed = false) => {
    if (!user) {
      message.error('请先登录');
      return { success: false, message: '请先登录' };
    }

    setIsSubmitting(true);

    try {
      // 提交任务答案到后端
      const response = await fetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          answer,
          isHintUsed
        })
      });

      const data = await response.json();

      if (data.success) {
        message.success('任务提交成功！');
        
        // 如果任务完成，处理积分奖励和进度更新
        if (data.isCorrect) {
          await handleTaskCompletion(taskId, data.task, data.isFirstCompletion);
          
          // 返回任务结果和奖励信息
          return {
            success: true,
            isCorrect: true,
            message: data.message,
            rewards: {
              points: calculatePoints(data.task, data.isFirstCompletion),
              isFirstCompletion: data.isFirstCompletion,
              newLevel: data.newLevel
            }
          };
        } else {
          return {
            success: true,
            isCorrect: false,
            message: data.message,
            hints: data.hints || []
          };
        }
      } else {
        message.error(data.message || '提交失败，请重试');
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('任务提交失败:', error);
      message.error('网络错误，请稍后重试');
      return { success: false, message: '网络错误' };
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理任务完成后的逻辑
  const handleTaskCompletion = async (taskId, task, isFirstCompletion) => {
    try {
      // 计算积分奖励
      const points = calculatePoints(task, isFirstCompletion);
      
      // 添加积分
      await addScore(points, 'task_completion', taskId);
      
      // 如果有选中的节点，更新其进度
      if (selectedNode) {
        await updateNodeProgress(selectedNode.id, taskId);
      }
      
      // 显示奖励信息
      showRewardMessage(points, isFirstCompletion);
      
    } catch (error) {
      console.error('处理任务完成逻辑失败:', error);
    }
  };

  // 计算积分
  const calculatePoints = (task, isFirstCompletion) => {
    const basePoints = DIFFICULTY_POINTS[task.difficulty] || DIFFICULTY_POINTS.medium;
    const timeBonus = calculateTimeBonus(task);
    const hintPenalty = task.isHintUsed ? Math.floor(basePoints * 0.2) : 0; // 使用提示扣减20%积分
    const firstBonus = isFirstCompletion ? FIRST_COMPLETION_BONUS : 0;
    
    return Math.max(0, basePoints + timeBonus - hintPenalty + firstBonus);
  };

  // 计算时间奖励（快速完成额外奖励）
  const calculateTimeBonus = (task) => {
    // 这里可以根据任务难度和完成时间计算额外奖励
    // 暂时返回固定值
    return Math.floor(DIFFICULTY_POINTS[task.difficulty] * 0.1);
  };

  // 添加积分到用户账户
  const addScore = async (points, reason, referenceId = null) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/scores/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id,
          points,
          reason,
          referenceId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 更新本地用户积分信息
        if (updateUserScore) {
          updateUserScore(data.score.totalScore);
        }
        
        // 如果有新解锁的成就，显示通知
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
          data.unlockedAchievements.forEach(achievement => {
            message.success(`🎉 解锁新成就！`);
          });
        }
        
        return data.score;
      }
    } catch (error) {
      console.error('添加积分失败:', error);
    }
  };

  // 显示奖励信息
  const showRewardMessage = (points, isFirstCompletion) => {
    let messageContent = `获得 ${points} 积分！`;
    if (isFirstCompletion) {
      messageContent += ' 🏆 首次完成额外奖励！';
    }
    message.success(messageContent);
  };

  // 获取任务提示
  const getTaskHint = async (taskId) => {
    if (!user) {
      message.error('请先登录');
      return null;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/hint`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        message.info('提示已获取，请注意：使用提示将减少获得的积分');
        return data.hint;
      } else {
        message.error(data.message || '获取提示失败');
        return null;
      }
    } catch (error) {
      console.error('获取提示失败:', error);
      message.error('网络错误，请稍后重试');
      return null;
    }
  };

  return {
    submitTask,
    isSubmitting,
    addScore,
    getTaskHint
  };
};

export default useTaskSubmission;
