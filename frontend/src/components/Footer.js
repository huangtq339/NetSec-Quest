import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import { GithubOutlined, CodeOutlined, BookOutlined } from '@ant-design/icons';
import './Footer.css';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const Footer = () => {
  return (
    <AntFooter className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <Text>© 2025 网安技能树闯关平台</Text>
          <Space className="footer-links">
            <Link href="/about" target="_blank">关于我们</Link>
            <Link href="/terms" target="_blank">使用条款</Link>
            <Link href="/privacy" target="_blank">隐私政策</Link>
            <Link href="/contact" target="_blank">联系我们</Link>
          </Space>
        </div>
        
        <div className="footer-right">
          <Space className="social-links">
            <Link href="https://github.com" target="_blank" className="social-link">
              <GithubOutlined />
              <span>GitHub</span>
            </Link>
            <Link href="https://docs.example.com" target="_blank" className="social-link">
              <BookOutlined />
              <span>文档</span>
            </Link>
            <Link href="https://api.example.com" target="_blank" className="social-link">
              <CodeOutlined />
              <span>API</span>
            </Link>
          </Space>
          
          <Text className="version">版本 1.0.0</Text>
        </div>
      </div>
      
      <div className="footer-bottom">
        <Text type="secondary" className="disclaimer">
          本平台仅用于网络安全学习和技能提升，请勿将所学技能用于非法用途。
        </Text>
      </div>
    </AntFooter>
  );
};

export default Footer;
