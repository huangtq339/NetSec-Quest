import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // 如果正在加载认证状态，可以显示加载中或不做任何操作
  if (isLoading) {
    return null; // 或者返回一个加载组件
  }
  
  return isAuthenticated ? (
    children || <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;