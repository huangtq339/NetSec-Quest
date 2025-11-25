import React from 'react';
import { Card, Row, Col, Statistic, Typography, Divider, Button } from 'antd';
import { TrophyOutlined, BookOutlined, BarChartOutlined, GiftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 页面快捷入口
  const quickActions = [
    {
      title: '技能树学习',
      icon: <BookOutlined />,
      description: '开始你的网络安全学习之旅',
      color: '#1890ff',
      path: '/skill-tree'
    },
    {
      title: '学习仪表盘',
      icon: <BarChartOutlined />,
      description: '查看你的学习进度和成果',
      color: '#52c41a',
      path: '/dashboard'
    },
    {
      title: '排行榜',
      icon: <TrophyOutlined />,
      description: '查看其他学习者的排名',
      color: '#faad14',
      path: '/rankings'
    },
    {
      title: '学习任务',
      icon: <GiftOutlined />,
      description: '完成任务获取奖励积分',
      color: '#f5222d',
      path: '/skill-tree'
    }
  ];

  const handleQuickAction = (path) => {
    navigate(path);
  };

  return (
    <div className="home-page">
      <div className="welcome-section">
        <Title level={2}>欢迎回来，{user?.name || user?.username || '用户'}！</Title>
        <Paragraph>
          这里是网络安全技能树学习平台，帮助你系统性地学习网络安全知识。
          选择下方的功能模块开始你的学习之旅！
        </Paragraph>
      </div>

      <Divider />

      <div className="quick-actions">
        <Title level={4}>快速开始</Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                hoverable
                className="action-card"
                style={{ backgroundColor: `${action.color}15` }}
                styles={{ body: { padding: '24px' } }}
                onClick={() => handleQuickAction(action.path)}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '24px', marginRight: '12px', color: action.color }}>
                    {action.icon}
                  </div>
                  <Text strong style={{ fontSize: '16px' }}>{action.title}</Text>
                </div>
                <Text type="secondary">{action.description}</Text>
                <div style={{ marginTop: '16px' }}>
                  <Button type="link" style={{ color: action.color, padding: 0 }}>
                    立即前往 &gt;
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      <div className="learning-overview">
        <Title level={4}>学习概览</Title>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic 
                title="已完成技能点" 
                value={0} 
                precision={0}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic 
                title="总积分" 
                value={0} 
                precision={0}
                prefix={<GiftOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic 
                title="排名" 
                value="未排名" 
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="recent-activities" style={{ marginTop: '24px' }}>
        <Title level={4}>最新活动</Title>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">暂无活动记录</Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;