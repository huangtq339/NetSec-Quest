import React from 'react';
import { Card, Typography } from 'antd';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

const TaskDetail = () => {
  const { taskId } = useParams();
  
  return (
    <div style={{ padding: 20 }}>
      <Card title={`任务详情 - ID: ${taskId}`}>
        <Title level={4}>任务详情占位组件</Title>
        <p>此组件将显示任务的详细信息和提交界面</p>
      </Card>
    </div>
  );
};

export default TaskDetail;