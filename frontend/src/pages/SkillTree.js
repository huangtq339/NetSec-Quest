import React, { useEffect, useState } from 'react';
import { Card, Spin, Select, Typography, Empty, Button, Space, Tag } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useSkillTree } from '../contexts/SkillTreeContext';
import { useAuth } from '../contexts/AuthContext';
import SkillTreeVisualization from '../components/SkillTreeVisualization';
import './SkillTree.css';

const { Title, Text } = Typography;
const { Option } = Select;

const SkillTree = () => {
  const [searchParams] = useSearchParams();
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const { courses, skillTree, userProgress, selectedNode, loadSkillTree, getNodeTasks, isLoading } = useSkillTree();
  const { isAuthenticated } = useAuth();
  const [nodeTasks, setNodeTasks] = useState([]);

  // 初始化时加载课程和技能树
  useEffect(() => {
    const courseId = searchParams.get('course') || selectedCourseId || (Array.isArray(courses) && courses.length > 0 ? courses[0].id : null);
    if (courseId) {
      setSelectedCourseId(courseId);
      loadSkillTree(courseId);
    }
  }, [courses, searchParams]);

  // 当选择的课程改变时加载对应的技能树
  useEffect(() => {
    if (selectedCourseId) {
      loadSkillTree(selectedCourseId);
      // 清空选中的节点和任务
      setNodeTasks([]);
    }
  }, [selectedCourseId]);

  // 当选中节点改变时，加载该节点的任务
  useEffect(() => {
    if (selectedNode && isAuthenticated) {
      loadNodeTasks(selectedNode.id);
    } else {
      setNodeTasks([]);
    }
  }, [selectedNode, isAuthenticated]);

  // 加载节点任务
  const loadNodeTasks = async (nodeId) => {
    const tasks = await getNodeTasks(nodeId);
    setNodeTasks(tasks);
  };

  // 获取节点进度
  const getNodeProgress = (nodeId) => {
    return userProgress[nodeId] || 0;
  };

  // 计算整体进度
  const calculateOverallProgress = () => {
    if (!skillTree || Object.keys(userProgress).length === 0) return 0;
    
    const nodes = getAllNodes(skillTree);
    if (nodes.length === 0) return 0;
    
    const totalProgress = nodes.reduce((sum, node) => {
      return sum + (userProgress[node.id] || 0);
    }, 0);
    
    return Math.round(totalProgress / nodes.length);
  };

  // 递归获取所有节点
  const getAllNodes = (tree) => {
    let nodes = [tree];
    if (tree.children && tree.children.length > 0) {
      tree.children.forEach(child => {
        nodes = [...nodes, ...getAllNodes(child)];
      });
    }
    return nodes;
  };

  return (
    <div className="skill-tree-page">
      <div className="page-header">
        <Title level={2}>技能树学习</Title>
        <div className="header-controls">
          <div className="course-selector">
            <Text strong>选择课程: </Text>
            <Select 
              value={selectedCourseId} 
              onChange={setSelectedCourseId}
              style={{ width: 200, marginLeft: 16 }}
            >
              {(Array.isArray(courses) ? courses : []).map(course => (
                <Option key={course.id} value={course.id}>{course.name}</Option>
              ))}
            </Select>
          </div>
          
          {skillTree && (
            <div className="progress-info">
              <Text>整体进度: </Text>
              <Tag color="blue">{calculateOverallProgress()}%</Tag>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Spin size="large" tip="正在加载技能树..." />
        </div>
      ) : !skillTree ? (
        <Empty description="暂无技能树数据" />
      ) : (
        <div className="skill-tree-content">
          <Card className="visualization-card">
            <SkillTreeVisualization />
          </Card>

          {selectedNode && (
            <Card className="node-details-card">
              <div className="node-header">
                <div>
                  <Title level={4}>{selectedNode.name}</Title>
                  <Tag color={getNodeProgress(selectedNode.id) >= 100 ? 'green' : getNodeProgress(selectedNode.id) > 0 ? 'orange' : 'blue'}>
                    进度: {getNodeProgress(selectedNode.id)}%
                  </Tag>
                </div>
              </div>
              
              <div className="node-description">
                <Text>{selectedNode.description}</Text>
              </div>
              
              {selectedNode.requirements && (
                <div className="node-requirements">
                  <Text strong>前置要求: </Text>
                  <div className="requirements-list">
                    {selectedNode.requirements.map(req => (
                      <Tag key={req} color="default">{req}</Tag>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="node-tasks">
                <Title level={5}>相关任务</Title>
                {nodeTasks.length > 0 ? (
                  <div className="tasks-list">
                    {nodeTasks.map(task => (
                      <div key={task.id} className="task-item">
                        <Space>
                          <Text strong>{task.title}</Text>
                          <Tag color={task.difficulty}>{task.difficulty}</Tag>
                          <Button 
                            type="link" 
                            href={`/task/${task.id}`}
                          >
                            去挑战
                          </Button>
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description="暂无相关任务" />
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillTree;
