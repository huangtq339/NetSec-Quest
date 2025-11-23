import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useAuth } from './AuthContext';

// 创建技能树Context
const SkillTreeContext = createContext();

// 技能树Provider组件
export const SkillTreeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [skillTree, setSkillTree] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 加载课程列表
  const loadCourses = async () => {
    try {
      setIsLoading(true);
      // 修改API路径，确保连接到正确的后端服务
      const response = await axios.get('http://localhost:5000/api/skill-tree/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('加载课程列表失败:', error);
      message.error('加载课程列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载技能树数据
  const loadSkillTree = async (courseId) => {
    try {
      setIsLoading(true);
      // 更正API路径，匹配后端实际配置
      const response = await axios.get(`/api/skill-tree/tree?courseId=${courseId}`);
      setSkillTree(response.data);
      
      // 如果用户已登录，同时加载用户进度
      if (isAuthenticated) {
        await loadUserProgress(courseId);
      }
      
      return response.data;
    } catch (error) {
      console.error('加载技能树失败:', error);
      message.error('加载技能树失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 加载用户进度
  const loadUserProgress = async (courseId) => {
    try {
      const response = await axios.get('/api/skill-tree/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUserProgress(response.data);
      return response.data;
    } catch (error) {
      console.error('加载用户进度失败:', error);
      return {};
    }
  };

  // 更新节点进度
  const updateNodeProgress = async (nodeId, progress) => {
    try {
      await axios.put(`/api/skill-tree/nodes/${nodeId}/progress`, { progress }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 更新本地进度状态
      setUserProgress(prev => ({
        ...prev,
        [nodeId]: progress
      }));
      
      message.success('进度更新成功');
      return true;
    } catch (error) {
      console.error('更新节点进度失败:', error);
      message.error('更新进度失败');
      return false;
    }
  };

  // 获取节点任务列表
  const getNodeTasks = async (nodeId) => {
    try {
      const response = await axios.get(`/api/skills/nodes/${nodeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取节点任务失败:', error);
      message.error('获取任务列表失败');
      return [];
    }
  };

  // 获取推荐学习节点
  const getRecommendedNodes = async () => {
    try {
      const response = await axios.get('/api/skills/recommended', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取推荐节点失败:', error);
      return [];
    }
  };

  // 获取用户整体进度
  const getUserOverallProgress = async () => {
    try {
      const response = await axios.get('/api/skills/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取整体进度失败:', error);
      return { completed: 0, total: 0, percentage: 0 };
    }
  };

  // 初始化时加载课程列表
  useEffect(() => {
    loadCourses();
  }, []);

  // 当认证状态变化时，重新加载进度
  useEffect(() => {
    if (isAuthenticated && skillTree) {
      loadUserProgress(skillTree.courseId);
    } else if (!isAuthenticated) {
      setUserProgress({});
    }
  }, [isAuthenticated, skillTree?.courseId]);

  // 提供的值
  const value = {
    courses,
    skillTree,
    userProgress,
    selectedNode,
    isLoading,
    loadCourses,
    loadSkillTree,
    loadUserProgress,
    updateNodeProgress,
    getNodeTasks,
    getRecommendedNodes,
    getUserOverallProgress,
    setSelectedNode
  };

  return <SkillTreeContext.Provider value={value}>{children}</SkillTreeContext.Provider>;
};

// 自定义Hook，方便使用Context
export const useSkillTree = () => {
  const context = useContext(SkillTreeContext);
  if (!context) {
    throw new Error('useSkillTree必须在SkillTreeProvider内部使用');
  }
  return context;
};

export default SkillTreeContext;
