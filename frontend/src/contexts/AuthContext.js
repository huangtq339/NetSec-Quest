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

  // 初始化时检查本地存储的token和Cookie认证
  useEffect(() => {
    const initAuth = async () => {
      try {
        let token = null;
        
        // 先检查sessionStorage中的token（会话登录，优先保证刷新页面不退出）
        token = sessionStorage.getItem('token');
        
        // 如果sessionStorage没有token，再检查localStorage（记住我模式）
        if (!token) {
          const localStorageToken = localStorage.getItem('token');
          const tokenExpiry = localStorage.getItem('tokenExpiry');
          
          if (localStorageToken && tokenExpiry) {
            // 检查token是否过期
            const expiryDate = new Date(tokenExpiry);
            const currentDate = new Date();
            
            if (currentDate <= expiryDate) {
              // token未过期，使用它
              token = localStorageToken;
            } else {
              // token已过期，清除localStorage中的token
              localStorage.removeItem('token');
              localStorage.removeItem('tokenExpiry');
            }
          }
        }
        
        // 即使没有token，也要确保Authorization头被正确设置或移除
        if (token) {
          // 设置axios默认headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 只有当有token时才尝试获取用户信息
          try {
            const response = await axios.get('/api/auth/me', {
              withCredentials: true // 允许跨域请求携带credentials（包括Cookies）
            });
            
            // 确保响应包含用户数据
            if (response.data && response.data.success) {
              if (response.data.data) {
                setUser(response.data.data);
              } else if (response.data.user) {
                setUser(response.data.user);
              }
              setIsAuthenticated(true);
            } else {
              // 服务端返回失败但token可能还有效，保留token继续尝试
              console.warn('认证信息验证失败但保留token继续尝试');
              setIsAuthenticated(true); // 先设置为已认证，避免页面跳转
              // 不清除token，允许用户继续使用
            }
          } catch (apiError) {
            // 隐藏内部API错误，不向用户显示
            console.error('获取用户信息API错误:', apiError);
            
            // 只清除token的情况：明确的401 Unauthorized响应
            if (apiError.response && apiError.response.status === 401) {
              // 只有当服务器明确返回401时才清除token
              localStorage.removeItem('token');
              localStorage.removeItem('tokenExpiry');
              sessionStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
              setIsAuthenticated(false);
            } else {
              // 其他错误（如500服务器错误）不清除token，保留登录状态
              // 静默处理内部错误，不向用户显示任何提示
              console.warn('内部服务器错误，保持登录状态');
              setIsAuthenticated(true); // 保留登录状态
              // 不清除token，允许用户继续使用
            }
          }
        } else {
          // 如果没有token，确保Authorization头被移除
          delete axios.defaults.headers.common['Authorization'];
          // 无token时不尝试调用需要认证的API
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('认证初始化失败:', error);
        // 清除所有认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        sessionStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录方法 - 支持记住登录状态
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      // 添加withCredentials配置，确保Cookie能够被正确设置
      const response = await axios.post('/api/auth/login', credentials, {
        withCredentials: true // 允许跨域请求携带credentials（包括Cookies）
      });
      
      // 验证响应是否成功
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || '登录失败，服务器返回无效响应');
      }
      
      // 处理不同格式的响应数据
      const token = response.data.data?.token || response.data.token;
      let userData = null;
      
      if (response.data.data?.user) {
        userData = response.data.data.user;
      } else if (response.data.user) {
        userData = response.data.user;
      } else if (response.data.data) {
        userData = response.data.data;
      }
      
      if (!userData) {
        throw new Error('登录成功但未返回用户数据');
      }

      // 存储token逻辑优化：
      // 1. 无论是否勾选记住我，都使用sessionStorage存储token（确保刷新页面不退出登录）
      // 2. 如果勾选了记住我，同时使用localStorage存储token（实现重新打开浏览器自动登录）
      if (token) {
        try {
          // 始终使用sessionStorage，确保刷新页面不会退出登录
          sessionStorage.setItem('token', token);
          console.log('Token已存储到sessionStorage');
          
          // 如果勾选了记住我，同时使用localStorage实现持久化登录（30天）
          if (credentials.rememberMe) {
            // 存储token和过期时间（30天后）
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            localStorage.setItem('token', token);
            localStorage.setItem('tokenExpiry', expiryDate.toISOString());
            console.log('Token已存储到localStorage（记住我模式）');
          }
          
          // 确保Authorization头被正确设置
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Authorization头已设置');
        } catch (storageError) {
          console.error('Token存储失败:', storageError);
          // 即使存储失败，也要设置Authorization头，让当前会话能正常工作
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }

      setUser(userData);
      setIsAuthenticated(true);
      message.success('登录成功');
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      // 确保错误信息格式正确
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message || 
                          error.message || 
                          '登录失败，请检查账号和密码';
      message.error(errorMessage);
      
      // 确保状态正确重置
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 注册方法
  const register = async (userData) => {
    try {
      setIsLoading(true);
      await axios.post('/api/auth/register', userData, {
        withCredentials: true
      });
      message.success('注册成功，请登录');
      return true;
    } catch (error) {
      const originalMessage = error.response?.data?.message;
      // 针对学号和邮箱重复的情况提供更友好的提示
      if (originalMessage === '学号已存在' || originalMessage === '邮箱已被注册') {
        message.error('已存在当前电子邮箱或学号的账户，请直接登录');
      } else {
        message.error(originalMessage || '注册失败，请稍后重试');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出方法 - 清除所有认证信息
  const logout = async () => {
    try {
      // 调用后端登出接口，清除服务器端的Cookie
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 清除所有存储和状态
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      sessionStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      message.success('已成功登出');
    }
  };

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      const response = await axios.put('/api/auth/me', profileData, {
        withCredentials: true
      });
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

  // 发送验证码方法
  const sendVerificationCode = async (params) => {
    try {
      setIsLoading(true);
      await axios.post('/api/auth/send-code', params, {
        withCredentials: true
      });
      message.success('验证码已发送，请查收');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || '发送验证码失败，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录方法 - 支持记住登录状态
  const loginWithCode = async (credentials) => {
    try {
      setIsLoading(true);
      
      // 添加withCredentials配置
      const response = await axios.post('/api/auth/login-code', credentials, {
        withCredentials: true
      });
      
      // 验证响应是否成功
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || '验证码登录失败，服务器返回无效响应');
      }
      
      // 处理不同格式的响应数据
      const token = response.data.data?.token || response.data.token;
      let userData = null;
      
      if (response.data.data?.user) {
        userData = response.data.data.user;
      } else if (response.data.user) {
        userData = response.data.user;
      } else if (response.data.data) {
        userData = response.data.data;
      }
      
      if (!userData) {
        throw new Error('登录成功但未返回用户数据');
      }

      // 存储token逻辑优化：
      // 1. 无论是否勾选记住我，都使用sessionStorage存储token（确保刷新页面不退出登录）
      // 2. 如果勾选了记住我，同时使用localStorage存储token（实现重新打开浏览器自动登录）
      if (token) {
        try {
          // 始终使用sessionStorage，确保刷新页面不会退出登录
          sessionStorage.setItem('token', token);
          console.log('Token已存储到sessionStorage');
          
          // 如果勾选了记住我，同时使用localStorage实现持久化登录（30天）
          if (credentials.rememberMe) {
            // 存储token和过期时间（30天后）
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            localStorage.setItem('token', token);
            localStorage.setItem('tokenExpiry', expiryDate.toISOString());
            console.log('Token已存储到localStorage（记住我模式）');
          }
          
          // 确保Authorization头被正确设置
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Authorization头已设置');
        } catch (storageError) {
          console.error('Token存储失败:', storageError);
          // 即使存储失败，也要设置Authorization头，让当前会话能正常工作
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }

      setUser(userData);
      setIsAuthenticated(true);
      message.success('登录成功');
      return true;
    } catch (error) {
      console.error('验证码登录失败:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message || 
                          error.message || 
                          '验证码无效或已过期';
      message.error(errorMessage);
      setIsAuthenticated(false);
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
    updateProfile,
    sendVerificationCode,
    loginWithCode
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