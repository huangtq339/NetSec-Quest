import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useSkillTree } from '../contexts/SkillTreeContext';
import { Tooltip, Tag } from 'antd';

const SkillTreeVisualization = () => {
  const { skillTree, userProgress, selectedNode, setSelectedNode } = useSkillTree();
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!skillTree || !svgRef.current) return;

    // 清空SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 设置图表尺寸
    const container = d3.select(containerRef.current);
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    // 创建层级布局
    const treeLayout = d3.tree()
      .size([width - 100, height - 100])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

    // 转换数据为层级结构
    const root = d3.hierarchy(skillTree, d => d.children || []);
    
    // 计算节点位置
    treeLayout(root);

    // 创建缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.2, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 创建一个组来容纳所有内容
    const g = svg.append('g')
      .attr('transform', `translate(50, 50)`);

    // 绘制连接线
    const links = g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'connection-line')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('stroke', d => {
        // 根据子节点的进度改变连线颜色
        const childProgress = userProgress[d.target.data.id] || 0;
        if (childProgress >= 100) return '#52c41a';
        if (childProgress > 0) return '#faad14';
        return '#d9d9d9';
      });

    // 创建节点组
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => `skill-node node-${getStatusClass(d.data.id)}`)
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .on('click', (event, d) => handleNodeClick(d.data));

    // 绘制节点圆圈
    node.append('circle')
      .attr('r', 15)
      .attr('fill', d => getNodeColor(d.data.id))
      .attr('stroke', d => selectedNode?.id === d.data.id ? '#1890ff' : '#fff')
      .attr('stroke-width', d => selectedNode?.id === d.data.id ? 3 : 2);

    // 在节点中添加图标或文本
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .style('font-size', '10px')
      .text(d => d.data.icon || d.data.name[0]);

    // 添加节点标签
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .style('font-size', '12px')
      .text(d => d.data.name);

    // 添加提示信息
    node.each(function(d) {
      const nodeElement = d3.select(this);
      const tooltip = d3.select('body').append('div')
        .attr('class', 'custom-tooltip')
        .style('position', 'absolute')
        .style('padding', '8px')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('display', 'none');

      nodeElement.on('mouseover', (event) => {
        tooltip.html(`
          <div><strong>${d.data.name}</strong></div>
          <div>${d.data.description}</div>
          <div>进度: ${userProgress[d.data.id] || 0}%</div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .style('display', 'block');
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      });

      // 节点被移除时清理tooltip
      nodeElement.on('remove', () => {
        tooltip.remove();
      });
    });

    // 初始化缩放位置
    const initialScale = Math.min(width / (root.data.x1 || width), height / (root.data.y1 || height));
    const initialTranslateX = (width - (root.data.x1 || width) * initialScale) / 2;
    const initialTranslateY = (height - (root.data.y1 || height) * initialScale) / 2;
    
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity
        .translate(initialTranslateX, initialTranslateY)
        .scale(initialScale)
      );

    // 清理函数
    return () => {
      svg.selectAll('*').remove();
      svg.on('.zoom', null);
    };
  }, [skillTree, userProgress, selectedNode, setSelectedNode]);

  // 获取节点状态类
  const getStatusClass = (nodeId) => {
    const progress = userProgress[nodeId] || 0;
    if (progress >= 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'unlocked';
  };

  // 获取节点颜色
  const getNodeColor = (nodeId) => {
    const progress = userProgress[nodeId] || 0;
    if (progress >= 100) return '#52c41a';
    if (progress > 0) return '#faad14';
    return '#1890ff';
  };

  // 处理节点点击
  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div className="skill-tree-container" ref={containerRef}>
      <svg ref={svgRef} width="100%" height="100%">
        {/* D3将在这里渲染技能树 */}
      </svg>
      {selectedNode && (
        <div className="node-details">
          <h3>{selectedNode.name}</h3>
          <p>{selectedNode.description}</p>
          <Tag color={getStatusClass(selectedNode.id) === 'completed' ? 'green' : getStatusClass(selectedNode.id) === 'in-progress' ? 'orange' : 'blue'}>
            进度: {userProgress[selectedNode.id] || 0}%
          </Tag>
        </div>
      )}
    </div>
  );
};

export default SkillTreeVisualization;
