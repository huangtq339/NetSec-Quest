import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const Profile = () => {
  return (
    <div style={{ padding: 20 }}>
      <Card title="个人资料">
        <Title level={4}>个人资料占位组件</Title>
        <p>此组件将显示和编辑用户的个人信息</p>
      </Card>
    </div>
  );
};

export default Profile;