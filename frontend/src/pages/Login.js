import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const Login = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <Card title="登录页面" style={{ width: 400 }}>
        <Title level={4}>登录功能占位组件</Title>
        <p>此组件将包含用户登录表单</p>
      </Card>
    </div>
  );
};

export default Login;