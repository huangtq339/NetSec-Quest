import React from 'react';
import { Card, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const NotFound = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <Card title="页面未找到">
        <Title level={4}>404 - 页面不存在</Title>
        <p>您访问的页面不存在或已被删除</p>
        <Link to="/">返回首页</Link>
      </Card>
    </div>
  );
};

export default NotFound;