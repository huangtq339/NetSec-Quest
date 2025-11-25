import React, { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Typography, Space } from 'antd';
import { UserOutlined, BellOutlined, HomeOutlined, TrophyOutlined, LogoutOutlined, SettingOutlined, BookOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // 调试：打印用户数据结构和头像显示相关字段
  useEffect(() => {
    console.log('当前用户数据:', user);
    if (user) {
      // 找出可用的姓名字段
    }
  }, [user]);
  
  // 查找可用的姓名字段函数
  const findAvailableName = (userData) => {
    // 优先使用name字段（可能来自中文姓名）
    if (userData?.name && typeof userData.name === 'string' && userData.name.trim()) {
      return userData.name;
    }
    // 也可以检查其他可能包含姓名的字段
    if (userData?.fullName && typeof userData.fullName === 'string' && userData.fullName.trim()) {
      return userData.fullName;
    }
    // 检查中文姓名可能的其他字段名
    if (userData?.chineseName && typeof userData.chineseName === 'string' && userData.chineseName.trim()) {
      return userData.chineseName;
    }
    // 最后使用username作为后备
    if (userData?.username && typeof userData.username === 'string') {
      return userData.username;
    }
    return null;
  };
  
  // 获取头像显示字符
  const getAvatarCharacter = (userData) => {
    const displayName = findAvailableName(userData);
    // 如果有显示名称，返回最后一个字符；否则返回默认的'U'
    return displayName ? displayName.slice(-1) : 'U';
  };
  
  // 导航菜单项配置
  const menuItems = [
    {
      key: '/skill-tree',
      icon: <HomeOutlined />,
      label: <Link to="/skill-tree">技能树</Link>
    },
    {
      key: '/dashboard',
      icon: <TrophyOutlined />,
      label: <Link to="/dashboard">仪表盘</Link>
    },
    {
      key: '/rankings',
      icon: <TrophyOutlined />,
      label: <Link to="/rankings">排行榜</Link>
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: <Link to="/notifications">通知</Link>
    }
  ];

  // 处理登出
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Link to="/profile">
          <Space>
            <UserOutlined />
            <span>个人中心</span>
          </Space>
        </Link>
      ),
    },
    {
      key: 'settings',
      label: (
        <Space>
          <SettingOutlined />
          <span>设置</span>
        </Space>
      ),
    },
    {
      key: 'logout',
      label: (
        <span onClick={handleLogout}>
          <Space>
            <LogoutOutlined />
            <span>退出登录</span>
          </Space>
        </span>
      ),
    },
  ];

  return (
    <div className="header-container">
      <div className="header-left">
        <Link to="/" className="logo">
          <Title level={3} className="logo-title">
            <BookOutlined className="logo-icon" />
            网安技能树
          </Title>
        </Link>
        <div className="nav-menu">
          <Menu mode="horizontal" selectedKeys={[window.location.pathname]} items={menuItems} />
        </div>
      </div>
      
      <div className="header-right">
        {isAuthenticated ? (
          <>
            <Badge count={5} style={{ marginRight: 16 }}>
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar>
                  {getAvatarCharacter(user)}
                </Avatar>
                <span className="username">{user?.studentId || '用户'}</span>
              </div>
            </Dropdown>
          </>
        ) : (
          <>
            <Button type="link" onClick={() => navigate('/login')}>登录</Button>
            <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;