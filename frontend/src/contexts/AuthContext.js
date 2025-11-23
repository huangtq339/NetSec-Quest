import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { message } from 'antd';

// 创建认证Context
const AuthContext = createContext();

// 认证Provider组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化时检查本地存储的token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // 设置axios默认headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 获取用户信息
          const response = await axios.get('/api/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // token无效或过期，清除本地存储
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录方法
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user: userData } = response.data;

      // 存储token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      setIsAuthenticated(true);
      message.success('登录成功');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请检查账号和密码');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 注册方法
  const register = async (userData) => {
    try {
      setIsLoading(true);
      await axios.post('/api/auth/register', userData);
      message.success('注册成功，请登录');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || '注册失败，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    message.success('已成功登出');
  };

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      const response = await axios.put('/api/auth/profile', profileData);
      setUser(response.data);
      message.success('个人信息更新成功');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || '更新失败，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 提供的值
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义Hook，方便使用Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export default AuthContext;
