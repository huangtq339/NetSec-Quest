import React from 'react';
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
      label: <Link to="/rankings">排行榜</Link>
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
                  {user?.name?.slice(-1) || user?.username?.slice(-1) || 'U'}
                </Avatar>
                <span className="username">{user?.username || '用户'}</span>
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
