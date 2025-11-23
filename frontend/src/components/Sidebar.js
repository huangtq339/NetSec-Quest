import React from 'react';
import { Menu, Typography, Divider } from 'antd';
import { FileTextOutlined, DatabaseOutlined, CodeOutlined, SafetyOutlined, BugOutlined, LockOutlined, UserOutlined, TrophyOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSkillTree } from '../contexts/SkillTreeContext';
import './Sidebar.css';

const { Title } = Typography;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { courses, selectedNode, setSelectedNode } = useSkillTree();
  
  // 技能分类菜单项
  const skillCategories = [
    {
      key: 'web-security',
      icon: <SafetyOutlined />,
      label: 'Web安全',
      description: '学习Web应用安全知识'
    },
    {
      key: 'network-security',
      icon: <DatabaseOutlined />,
      label: '网络安全',
      description: '网络协议与安全防御'
    },
    {
      key: 'system-security',
      icon: <LockOutlined />,
      label: '系统安全',
      description: '操作系统安全配置'
    },
    {
      key: 'code-analysis',
      icon: <CodeOutlined />,
      label: '代码审计',
      description: '安全编码与漏洞分析'
    },
    {
      key: 'vulnerability',
      icon: <BugOutlined />,
      label: '漏洞利用',
      description: '常见漏洞原理与实践'
    },
    {
      key: 'ctf',
      icon: <FileTextOutlined />,
      label: 'CTF训练',
      description: '网络安全竞赛题目'
    }
  ];

  // 处理技能分类点击
  const handleCategoryClick = (category) => {
    // 如果有对应的课程，加载该课程的技能树
    const course = courses.find(c => c.category === category.key);
    if (course) {
      navigate(`/skill-tree?course=${course.id}`);
    }
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <Title level={5}>学习路径</Title>
      </div>
      
      {isAuthenticated && (
        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-label">总积分</span>
            <span className="stat-value">{user?.points || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">完成任务</span>
            <span className="stat-value">{user?.completedTasks || 0}</span>
          </div>
        </div>
      )}
      
      <Divider />
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        className="sidebar-menu"
        items={[
          {
            key: '/skill-tree',
            icon: <FileTextOutlined />,
            label: '技能树'
          },
          {
            key: '/dashboard',
            icon: <TrophyOutlined />,
            label: '仪表盘'
          },
          {
            key: '/rankings',
            icon: <UserOutlined />,
            label: '排行榜'
          },
          ...(isAuthenticated ? [{
            key: '/notifications',
            icon: <BellOutlined />,
            label: '通知'
          }] : [])
        ]}
      />
      
      <Divider />
      
      <div className="sidebar-section">
        <Title level={5}>技能分类</Title>
        <div className="category-list">
          {skillCategories.map(category => (
            <div 
              key={category.key} 
              className="category-item"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-info">
                <div className="category-name">{category.label}</div>
                <div className="category-description">{category.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedNode && (
        <>
          <Divider />
          <div className="sidebar-section">
            <Title level={5}>当前节点</Title>
            <div className="current-node">
              <h4>{selectedNode.name}</h4>
              <p>{selectedNode.description}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
