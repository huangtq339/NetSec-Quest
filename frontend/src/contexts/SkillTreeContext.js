import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useAuth } from './AuthContext';

// 创建技能树Context
const SkillTreeContext = createContext();

// 技能树Provider组件
export const SkillTreeProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [skillTree, setSkillTree] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // 添加缓存以避免重复请求
  const [skillTreeCache, setSkillTreeCache] = useState(new Map());
  const [nodeTasksCache, setNodeTasksCache] = useState(new Map());

  // 加载课程列表
  const loadCourses = async () => {
    try {
      setIsLoading(true);
      // 使用相对路径，确保与axios默认配置一致
      const response = await axios.get('/api/skill-tree/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('加载课程列表失败:', error);
      message.error('加载课程列表失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载技能树数据 - 添加缓存机制
  const loadSkillTree = async (courseId) => {
    try {
      // 检查缓存
      if (skillTreeCache.has(courseId)) {
        const cachedData = skillTreeCache.get(courseId);
        setSkillTree(cachedData);
        
        // 如果用户已登录，同时加载用户进度
        if (isAuthenticated) {
          await loadUserProgress(courseId);
        }
        
        return cachedData;
      }
      
      setIsLoading(true);
      const response = await axios.get(`/api/skill-tree/tree?courseId=${courseId}`);
      const treeData = response.data;
      setSkillTree(treeData);
      
      // 更新缓存
      setSkillTreeCache(prev => new Map(prev).set(courseId, treeData));
      
      // 如果用户已登录，同时加载用户进度
      if (isAuthenticated) {
        await loadUserProgress(courseId);
      }
      
      return treeData;
    } catch (error) {
      console.error('加载技能树失败:', error);
      message.error('加载技能树失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 加载用户进度 - 修复API路径
  const loadUserProgress = async (courseId) => {
    if (!isAuthenticated) return {};
    
    try {
      const response = await axios.get(`/api/skill-tree/progress?courseId=${courseId}`);
      setUserProgress(response.data);
      return response.data;
    } catch (error) {
      console.error('加载用户进度失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      } else if (error.response?.status === 404) {
        // 如果没有进度记录，设置为空对象
        setUserProgress({});
      }
      return {};
    }
  };

  // 更新节点进度
  const updateNodeProgress = async (nodeId, progress) => {
    try {
      // 使用axios默认的Authorization头配置
      await axios.put(`/api/skill-tree/nodes/${nodeId}/progress`, { progress });
      
      // 更新本地进度状态
      setUserProgress(prev => ({
        ...prev,
        [nodeId]: progress
      }));
      
      message.success('进度更新成功');
      return true;
    } catch (error) {
      console.error('更新节点进度失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      } else {
        message.error('更新进度失败，请稍后重试');
      }
      return false;
    }
  };

  // 获取节点任务列表 - 添加缓存
  const getNodeTasks = async (nodeId) => {
    try {
      // 检查缓存
      if (nodeTasksCache.has(nodeId)) {
        return nodeTasksCache.get(nodeId);
      }
      
      // 匹配后端实际路由
      const response = await axios.get(`/api/skill-tree/nodes/${nodeId}`);
      const tasks = response.data || [];
      
      // 更新缓存
      setNodeTasksCache(prev => new Map(prev).set(nodeId, tasks));
      
      return tasks;
    } catch (error) {
      console.error('获取节点任务失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      }
      return [];
    }
  };

  // 获取推荐学习节点
  const getRecommendedNodes = async () => {
    try {
      // 使用axios默认的Authorization头配置
      const response = await axios.get('/api/skills/recommended');
      return response.data;
    } catch (error) {
      console.error('获取推荐节点失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      }
      return [];
    }
  };

  // 获取用户整体进度
  const getUserOverallProgress = async () => {
    try {
      // 使用axios默认的Authorization头配置
      const response = await axios.get('/api/skills/progress');
      return response.data;
    } catch (error) {
      console.error('获取整体进度失败:', error);
      if (error.response?.status === 401) {
        message.error('会话已过期，请重新登录');
      }
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
      // 清除缓存以确保数据安全
      setNodeTasksCache(new Map());
    }
  }, [isAuthenticated, skillTree?.courseId]);

  // 提供的值 - 使用useMemo优化渲染性能
  const value = useMemo(() => ({
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
  }), [courses, skillTree, userProgress, selectedNode, isLoading]);

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
