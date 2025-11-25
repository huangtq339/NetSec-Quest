import React, { useEffect, useState } from 'react';
import { Typography, Divider } from 'antd';
import { 
  FileTextOutlined, DatabaseOutlined, CodeOutlined, 
  SafetyOutlined, BugOutlined, LockOutlined, 
  TrophyOutlined, CheckCircleOutlined, StarOutlined, 
  BookOutlined, MessageOutlined, GiftOutlined, CommentOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSkillTree } from '../contexts/SkillTreeContext';
import './Sidebar.css';

const { Title } = Typography;

const Sidebar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { selectedNode } = useSkillTree();
  
  // 状态管理：通知列表
  const [notifications, setNotifications] = useState([]);
  
  // 初始化通知列表
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('Failed to parse notifications:', error);
        // 如果解析失败，初始化系统通知
        initializeSystemNotification();
      }
    } else {
      // 如果没有保存的通知，初始化系统通知
      initializeSystemNotification();
    }
  }, []);
  
  // 初始化系统介绍通知
  const initializeSystemNotification = () => {
    const systemNotification = {
      id: 'system-welcome-' + Date.now(),
      title: '系统介绍',
      content: '欢迎使用网安技能树学习平台！本系统帮助您系统性学习网络安全知识，提供技能树导航、学习任务、积分排名等功能。请按照技能路径循序渐进地学习，完成任务获得积分和技能点数。',
      type: 'info',
      timestamp: new Date().toISOString()
    };
    
    setNotifications([systemNotification]);
    localStorage.setItem('notifications', JSON.stringify([systemNotification]));
  };
  
  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <Title level={5}>快速访问</Title>
      </div>
      
      {/* 学习记录、交流广场、资源推荐、反馈收集四个模块 */}
      <div className="sidebar-section">
        <div className="learning-tools">
          {
            [
              { icon: <BookOutlined />, label: '学习笔记' },
              { icon: <MessageOutlined />, label: '交流广场' },
              { icon: <GiftOutlined />, label: '资源推荐' },
              { icon: <CommentOutlined />, label: '反馈收集' }
            ].map((tool, index) => (
              <div key={index} className="overview-item horizontal-item hover-effect">
                <div className="overview-icon">{tool.icon}</div>
                <div className="overview-label">{tool.label}</div>
              </div>
            ))
          }
        </div>
      </div>
      
      <Divider />
      
      {/* 学习概览部分 */}
      <div className="sidebar-section">
        <Title level={5}>学习概览</Title>
        <div className="learning-overview">
          {isAuthenticated ? (
            <>
              <div className="overview-item horizontal-item hover-effect">
                <div className="overview-icon"><TrophyOutlined /></div>
                <div className="overview-label">全部积分</div>
                <div className="overview-value">{user?.points || 0}</div>
              </div>
              <div className="overview-item horizontal-item hover-effect">
                <div className="overview-icon"><CheckCircleOutlined /></div>
                <div className="overview-label">完成任务</div>
                <div className="overview-value">{user?.completedTasks || 0}</div>
              </div>
              <div className="overview-item horizontal-item hover-effect">
                <div className="overview-icon"><StarOutlined /></div>
                <div className="overview-label">技能点数</div>
                <div className="overview-value">{user?.skillPoints || 0}</div>
              </div>
            </>
          ) : (
            <div className="login-prompt">请登录查看学习概览</div>
          )}
        </div>
      </div>
      
      <Divider />
      
      {/* 最新通知部分 */}
      <div className="sidebar-section">
        <Title 
          level={5} 
          className="hover-effect cursor-pointer"
          onClick={() => navigate('/notifications')}
        >
          最新通知
        </Title>
        <div className="notifications-list">
          {notifications.length > 0 && (
            // 按时间戳排序，取最新的通知
            [...notifications]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 1)
              .map(notification => (
                <div 
                  key={notification.id} 
                  className="notification-item hover-effect"
                  onClick={() => navigate('/notifications')}
                >
                  <div className="notification-header">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="notification-content two-lines-ellipsis">
                    {notification.content}
                  </div>
                </div>
              ))
          ) || (
            <div className="notification-item empty-notification">
              <div className="notification-content">暂无通知</div>
            </div>
          )}
        </div>
      </div>
      
      <Divider />
      
      <div className="sidebar-section">
        <Title level={5}>安全领域</Title>
        <div className="skill-categories">
          {[
            { icon: <FileTextOutlined />, title: 'Web安全' },
            { icon: <DatabaseOutlined />, title: '网络安全' },
            { icon: <SafetyOutlined />, title: '系统安全' },
            { icon: <CodeOutlined />, title: '代码审计' },
            { icon: <BugOutlined />, title: '漏洞利用' },
            { icon: <LockOutlined />, title: 'CTF训练' }
          ].map((category, index) => (
            <div key={index} className="skill-category-item">
              <div className="category-icon">{category.icon}</div>
              <span className="category-title">{category.title}</span>
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
