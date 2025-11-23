import React, { useEffect, useState } from 'react';
import { Card, Tabs, List, Avatar, Tag, Divider, Typography, Spin, Empty, Row, Col } from 'antd';
import { TrophyOutlined, CrownOutlined, StarOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './Rankings.css';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

const Rankings = () => {
  const [activeTab, setActiveTab] = useState('weekly');
  const [rankings, setRankings] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // 获取排行榜数据
  useEffect(() => {
    loadRankings(activeTab);
  }, [activeTab]);

  // 获取成就和徽章数据
  useEffect(() => {
    loadAchievementsAndBadges();
    if (isAuthenticated && user) {
      loadUserScore();
    }
  }, [isAuthenticated, user]);

  const loadRankings = async (type) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/scores/leaderboard/${type}`);
      const data = await response.json();
      
      if (data.success) {
        setRankings(data.leaderboard);
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievementsAndBadges = async () => {
    try {
      // 获取成就列表
      const achievementsResponse = await fetch(`${process.env.REACT_APP_API_URL}/scores/achievements`);
      const achievementsData = await achievementsResponse.json();
      if (achievementsData.success) {
        setAchievements(achievementsData.achievements);
      }

      // 获取徽章列表
      const badgesResponse = await fetch(`${process.env.REACT_APP_API_URL}/scores/badges`);
      const badgesData = await badgesResponse.json();
      if (badgesData.success) {
        setBadges(badgesData.badges);
      }
    } catch (error) {
      console.error('获取成就和徽章失败:', error);
    }
  };

  const loadUserScore = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/scores/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUserScore(data.score);
      }
    } catch (error) {
      console.error('获取用户积分失败:', error);
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'daily':
        return <CalendarOutlined />;
      case 'weekly':
        return <TrophyOutlined />;
      case 'monthly':
        return <CrownOutlined />;
      case 'all_time':
        return <StarOutlined />;
      default:
        return null;
    }
  };

  const getTabTitle = (tab) => {
    const titles = {
      daily: '今日排行',
      weekly: '周排行榜',
      monthly: '月排行榜',
      all_time: '总排行榜'
    };
    return titles[tab] || tab;
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#8c8c8c',
      rare: '#1890ff',
      epic: '#722ed1',
      legendary: '#fa8c16'
    };
    return colors[rarity] || '#8c8c8c';
  };

  const getUserBadgeCount = (rarity) => {
    if (!userScore || !userScore.badges) return 0;
    return userScore.badges.filter(badge => {
      const badgeObj = badges.find(b => b._id === badge.badgeId.toString());
      return badgeObj && badgeObj.rarity === rarity;
    }).length;
  };

  return (
    <div className="rankings-page">
      <Title level={2}>排行榜</Title>
      
      <Row gutter={[24, 24]}>
        {/* 用户信息卡片 */}
        <Col xs={24} lg={6}>
          <Card className="user-score-card">
            <Title level={4}>我的战绩</Title>
            
            {isAuthenticated && userScore ? (
              <>
                <div className="user-info">
                  <Avatar size={64} src={user.avatar}>
                    {user.username[0].toUpperCase()}
                  </Avatar>
                  <div className="user-details">
                    <Text strong className="username">{user.username}</Text>
                    <Text className="total-score">总积分: {userScore.totalScore}</Text>
                    <div className="stats">
                      <Tag color="blue">连续登录: {userScore.dailyStreak}天</Tag>
                    </div>
                  </div>
                </div>
                
                <Divider />
                
                <div className="badge-stats">
                  <Text strong>徽章收集:</Text>
                  <div className="badge-counts">
                    <div className="badge-count">
                      <Tag color={getRarityColor('common')}>普通</Tag>
                      <Text>{getUserBadgeCount('common')}个</Text>
                    </div>
                    <div className="badge-count">
                      <Tag color={getRarityColor('rare')}>稀有</Tag>
                      <Text>{getUserBadgeCount('rare')}个</Text>
                    </div>
                    <div className="badge-count">
                      <Tag color={getRarityColor('epic')}>史诗</Tag>
                      <Text>{getUserBadgeCount('epic')}个</Text>
                    </div>
                    <div className="badge-count">
                      <Tag color={getRarityColor('legendary')}>传说</Tag>
                      <Text>{getUserBadgeCount('legendary')}个</Text>
                    </div>
                  </div>
                </div>
                
                <Divider />
                
                <div className="recent-achievements">
                  <Text strong>最近成就:</Text>
                  {userScore.achievements && userScore.achievements.length > 0 ? (
                    <List
                      size="small"
                      dataSource={userScore.achievements.slice(-3).reverse()}
                      renderItem={(item) => {
                        const achievement = achievements.find(a => a._id === item.achievementId.toString());
                        return (
                          <List.Item>
                            <List.Item.Meta
                              title={achievement ? achievement.name : '未知成就'}
                              description={
                                new Date(item.unlockedAt).toLocaleDateString('zh-CN')
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty description="暂无成就" />
                  )}
                </div>
              </>
            ) : (
              <Empty description="登录后查看个人战绩" />
            )}
          </Card>
        </Col>
        
        {/* 排行榜 */}
        <Col xs={24} lg={18}>
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              className="rankings-tabs"
            >
              {['daily', 'weekly', 'monthly', 'all_time'].map(tab => (
                <TabPane 
                  tab={<span>{getTabIcon(tab)} {getTabTitle(tab)}</span>} 
                  key={tab}
                >
                  {loading ? (
                    <div className="loading-container">
                      <Spin size="large" tip="正在加载排行榜..." />
                    </div>
                  ) : rankings && rankings.rankings.length > 0 ? (
                    <List
                      className="rankings-list"
                      dataSource={rankings.rankings}
                      renderItem={(item, index) => (
                        <List.Item 
                          className={`rank-item ${item.userId === (user?.id || user?._id) ? 'current-user' : ''}`}
                        >
                          <div className="rank-number">
                            {index < 3 ? (
                              <Tag color={index === 0 ? 'red' : index === 1 ? 'gold' : 'green'} className="medal">
                                {index + 1}
                              </Tag>
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          <List.Item.Meta
                            avatar={
                              <Avatar src={item.avatar}>
                                {item.username[0].toUpperCase()}
                              </Avatar>
                            }
                            title={
                              <div className="user-rank-info">
                                <Text strong>{item.username}</Text>
                                {item.userId === (user?.id || user?._id) && (
                                  <Tag color="blue" style={{ marginLeft: 8 }}>我</Tag>
                                )}
                              </div>
                            }
                            description={
                              <div className="score-info">
                                <Text className="score">积分: {item.score}</Text>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无排行数据" />
                  )}
                </TabPane>
              ))}
            </Tabs>
          </Card>
          
          {/* 成就展示 */}
          <Card className="achievements-card">
            <Title level={4}>成就列表</Title>
            <div className="achievements-grid">
              {achievements.map((achievement) => {
                const isUnlocked = isAuthenticated && userScore && 
                  userScore.achievements.some(a => a.achievementId.toString() === achievement._id);
                
                return (
                  <div 
                    key={achievement._id} 
                    className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">
                      {achievement.icon ? (
                        <img src={achievement.icon} alt={achievement.name} />
                      ) : (
                        <StarOutlined />
                      )}
                    </div>
                    <Title level={5}>{achievement.name}</Title>
                    <Paragraph>{achievement.description}</Paragraph>
                    <div className="achievement-reward">
                      <Tag color={isUnlocked ? 'green' : 'default'}>
                        {isUnlocked ? '已解锁' : '未解锁'} (+{achievement.pointsReward}分)
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Rankings;
