import React, { createContext, useState, useContext, useMemo } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useAuth } from './AuthContext';

// 创建任务Context
const TaskContext = createContext();

// 任务Provider组件
export const TaskProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 获取任务列表
  const getTasks = async (filters = {}) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/api/tasks?${params}`);
      setTasks(response.data);
      return response.data;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      } else {
        message.error('获取任务列表失败，请稍后重试');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 获取任务详情
  const getTaskById = async (taskId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/tasks/${taskId}`);
      setCurrentTask(response.data);
      return response.data;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      } else {
        message.error('获取任务详情失败，请稍后重试');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 提交任务
  const submitTask = async (taskId, submission) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/tasks/${taskId}/submit`, submission);
      
      // 更新任务历史
      setTaskHistory(prev => [response.data, ...prev]);
      
      if (response.data.isCorrect) {
        message.success('恭喜！任务提交成功！');
      } else {
        message.warning('任务提交失败，请重试');
      }
      
      return response.data;
    } catch (error) {
      console.error('提交任务失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      } else {
        message.error('提交任务失败，请稍后重试');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 获取用户任务历史
  const getUserTaskHistory = async (taskId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/tasks/${taskId}/history`);
      setTaskHistory(response.data);
      return response.data;
    } catch (error) {
      console.error('获取任务历史失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 获取任务统计信息
  const getTaskStatistics = async (taskId) => {
    try {
      const response = await axios.get(`/api/tasks/${taskId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('获取任务统计失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      }
      return {};
    }
  };

  // 获取用户已完成的任务
  const getUserCompletedTasks = async () => {
    try {
      const response = await axios.get('/api/tasks/completed');
      return response.data;
    } catch (error) {
      console.error('获取已完成任务失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      }
      return [];
    }
  };

  // 尝试获取任务提示
  const getTaskHint = async (taskId) => {
    try {
      const response = await axios.get(`/api/tasks/${taskId}/hint`);
      return response.data;
    } catch (error) {
      console.error('获取提示失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      } else if (error.response?.status === 429) {
        message.error('提示次数已用完');
      } else {
        message.error('获取提示失败，请稍后重试');
      }
      return { hint: null, remainingHints: 0 };
    }
  };

  // 获取下一个推荐任务
  const getNextRecommendedTask = async () => {
    try {
      const response = await axios.get('/api/tasks/recommended');
      return response.data;
    } catch (error) {
      console.error('获取推荐任务失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      }
      return null;
    }
  };

  // 重置当前任务状态
  const resetCurrentTask = () => {
    setCurrentTask(null);
    setTaskHistory([]);
  };

  // 提供的值 - 使用useMemo优化渲染性能
  const value = useMemo(() => ({
    tasks,
    currentTask,
    taskHistory,
    isLoading,
    getTasks,
    getTaskById,
    submitTask,
    getUserTaskHistory,
    getTaskStatistics,
    getUserCompletedTasks,
    getTaskHint,
    getNextRecommendedTask,
    resetCurrentTask
  }), [tasks, currentTask, taskHistory, isLoading]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// 自定义Hook，方便使用Context
export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask必须在TaskProvider内部使用');
  }
  return context;
};

export default TaskContext;
