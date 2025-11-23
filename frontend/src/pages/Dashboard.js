import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const Dashboard = () => {
  return (
    <div style={{ padding: 20 }}>
      <Card title="仪表盘">
        <Title level={4}>仪表盘占位组件</Title>
        <p>此组件将显示用户的学习进度和统计信息</p>
      </Card>
    </div>
  );
};

export default Dashboard;