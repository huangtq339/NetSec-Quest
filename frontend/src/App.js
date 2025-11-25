import React, { memo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import { SkillTreeProvider } from './contexts/SkillTreeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SkillTree from './pages/SkillTree';
import TaskDetail from './pages/TaskDetail';
import Dashboard from './pages/Dashboard';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

const { Header: AntHeader, Content, Sider } = Layout;

// 应用内容布局 - 优化布局组件，根据路径动态显示侧边栏
const AppContent = memo(function AppContent() {
  const location = useLocation();
  // 登录页和注册页不显示侧边栏
  const showSidebar = !['/login', '/register'].includes(location.pathname);
  
  return (
    <Layout className="app-layout">
      <AntHeader className="app-header">
        <Header />
      </AntHeader>
      <Layout>
        {showSidebar && <Sider width={250} className="app-sidebar" theme="light">
          <Sidebar />
        </Sider>}
        <Content className={`app-content ${!showSidebar ? 'full-width' : ''}`}>
          <Routes>
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/skill-tree" element={<PrivateRoute><SkillTree /></PrivateRoute>} />
            <Route path="/task/:taskId" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Content>
      </Layout>
      <Footer />
    </Layout>
  );
});

AppContent.displayName = 'AppContent';

// 主应用组件
function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <SkillTreeProvider>
          <AppContent />
        </SkillTreeProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
