import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const Register = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <Card title="注册页面" style={{ width: 400 }}>
        <Title level={4}>注册功能占位组件</Title>
        <p>此组件将包含用户注册表单</p>
      </Card>
    </div>
  );
};

export default Register;