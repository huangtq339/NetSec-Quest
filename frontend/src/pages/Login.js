import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Tabs, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 使用items属性替代TabPane组件

const Login = () => {
  const [form] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('password');
  const [countdown, setCountdown] = useState(0);
  const [showQrLogin, setShowQrLogin] = useState(false); // 控制扫码登录显示状态
  const [activeQrTab, setActiveQrTab] = useState('wechat'); // 控制扫码登录内部的tab切换
  const navigate = useNavigate();
  const { login, loginWithCode, sendVerificationCode } = useAuth();

  // 账号密码登录
  const handlePasswordLogin = async (values) => {
    try {
      // 调用登录方法，将学号作为studentId传入，并包含rememberMe参数
      const success = await login({
        studentId: values.studentId,
        password: values.password,
        rememberMe: values.rememberMe // 添加记住我参数
      });
      
      if (success) {
        navigate('/');
      }
    } catch (error) {
      // 根据后端返回的错误信息显示不同提示
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.includes('锁定')) {
        // 如果是账户锁定提示，显示具体信息
        message.error(errorMessage);
      } else {
        // 其他情况统一显示安全提示
        message.error('账号或密码不正确');
      }
      console.error('登录错误:', error);
    }
  };

  // 发送验证码
  const handleSendCode = async (values) => {
    try {
      // 使用AuthContext中的方法发送验证码
      const success = await sendVerificationCode({ email: values.email });
      if (success) {
        message.success('验证码发送成功');
        // 开始60秒倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      message.error('发送验证码失败，请稍后重试');
      console.error('发送验证码错误:', error);
    }
  };

  // 邮箱验证码登录
  const handleEmailLogin = async (values) => {
    try {
      const success = await loginWithCode({  
        email: values.email,
        code: values.code,
        rememberMe: values.rememberMe // 添加记住我参数
      });
      
      if (success) {
        navigate('/');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请稍后重试');
      console.error('验证码登录错误:', error);
    }
  };

  // 处理扫码登录切换
  const handleQrCodeClick = () => {
    setShowQrLogin(!showQrLogin);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      background: '#f5f5f5'
    }}>
      <Card 
        title="用户登录"
        extra={
          // 放大的二维码图标，点击切换扫码登录
          <div 
            onClick={handleQrCodeClick} 
            style={{ 
              cursor: 'pointer', 
              fontSize: '32px', // 放大图标尺寸
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QrcodeOutlined />
          </div>
        }
        style={{ 
          width: 400, 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: 8,
          minHeight: 450 // 设置卡片固定的最小高度，确保切换时完全等高
        }}
        styles={{
          body: {
            padding: '0 24px 24px 24px', // 移除顶部内边距，统一由内容控制
          }
        }}
      >
        {showQrLogin ? (
          // 扫码登录界面 - 确保与账号密码登录高度完全一致
          <div style={{ 
            height: 350, // 固定高度为350px，与账号密码登录完全一致
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 使用Tab切换微信和学习通扫码，与账号密码登录保持相同的间距和样式 */}
            <Tabs 
              activeKey={activeQrTab} 
              onChange={setActiveQrTab}
              style={{ 
                marginTop: 24, 
                height: '100%' // 让Tabs组件占满父容器高度
              }}
              items={[
                {
                  key: 'wechat',
                  label: '微信扫码',
                  children: (
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%', // 占满Tab内容区域
                      padding: '20px 0' // 添加适当的内边距
                    }}>
                      {/* 微信二维码 */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          width: 200, 
                          height: 200, 
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <span>微信二维码</span>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'learning',
                  label: '学习通扫码',
                  children: (
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%', // 占满Tab内容区域
                      padding: '20px 0' // 添加适当的内边距
                    }}>
                      {/* 学习通二维码 */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          width: 200, 
                          height: 200, 
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <span>学习通二维码</span>
                        </div>
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </div>
        ) : (
          // 原来的账号密码/邮箱登录界面
          <div style={{ 
            height: 350, // 固定高度为350px，与扫码登录完全一致
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              style={{ 
                marginTop: 24, 
                height: '100%' // 让Tabs组件占满父容器高度
              }}
              items={[
                {
                  key: 'password',
                  label: '账号密码登录',
                  children: (
                    <Form
                      form={form}
                      name="password-login"
                      onFinish={handlePasswordLogin}
                      layout="vertical"
                      style={{ maxWidth: 350, margin: '0 auto', height: '100%' }}
                    >
                      <Form.Item
                        label="学号"
                        name="studentId"
                        rules={[
                          { required: true, message: '请输入学号' },
                          { whitespace: true, message: '学号不能为空' }
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined className="site-form-item-icon" />}
                          placeholder="请输入学号"
                          autoComplete="off"
                        />
                      </Form.Item>
                      
                      <Form.Item
                        label="密码"
                        name="password"
                        rules={[
                          { required: true, message: '请输入密码' },
                          { whitespace: true, message: '密码不能为空' },
                          { min: 6, message: '密码长度不能少于6位' }
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined className="site-form-item-icon" />}
                          placeholder="请输入密码"
                        />
                      </Form.Item>
                      
                      {/* 添加记住我复选框 */}
                      <Form.Item 
                        name="rememberMe"
                        valuePropName="checked"
                        initialValue={false}
                        style={{ marginBottom: 8 }}
                      >
                        <Checkbox>记住我（30天）</Checkbox>
                      </Form.Item>
                      
                      <Form.Item>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          className="login-form-button"
                          style={{ width: '100%', marginTop: 16 }}
                        >
                          登录
                        </Button>
                      </Form.Item>
                    </Form>
                  )
                },
                {
                  key: 'email',
                  label: '邮箱验证码登录',
                  children: (
                    <Form
                      form={emailForm}
                      name="email-login"
                      layout="vertical"
                      style={{ maxWidth: 350, margin: '0 auto', height: '100%' }}
                    >
                      <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined className="site-form-item-icon" />}
                          placeholder="请输入邮箱"
                          autoComplete="off"
                        />
                      </Form.Item>
                      
                      <Form.Item
                        label="验证码"
                        name="code"
                        rules={[
                          { required: true, message: '请输入验证码' },
                          { len: 6, message: '验证码为6位数字' },
                          { pattern: /^\d+$/, message: '验证码只能包含数字' }
                        ]}
                      >
                        <Input.Group compact>
                          <Input
                            style={{ width: '60%' }}
                            placeholder="请输入验证码"
                            autoComplete="off"
                          />
                          <Button 
                            type="primary"
                            style={{ width: '38%', marginLeft: '2%' }}
                            disabled={countdown > 0}
                            onClick={() => {
                              const values = emailForm.getFieldsValue();
                              emailForm.validateFields(['email']).then(() => {
                                handleSendCode(values);
                              }).catch(() => {
                                message.warning('请先输入有效的邮箱地址');
                              });
                            }}
                          >
                            {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                          </Button>
                        </Input.Group>
                      </Form.Item>
                      
                      {/* 添加记住我复选框 */}
                      <Form.Item 
                        name="rememberMe"
                        valuePropName="checked"
                        initialValue={false}
                        style={{ marginBottom: 8 }}
                      >
                        <Checkbox>记住我（30天）</Checkbox>
                      </Form.Item>
                      
                      <Form.Item>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          className="login-form-button"
                          style={{ width: '100%', marginTop: 16 }}
                          onClick={(e) => {
                            e.preventDefault();
                            emailForm.validateFields().then(handleEmailLogin);
                          }}
                        >
                          登录
                        </Button>
                      </Form.Item>
                    </Form>
                  )
                }
              ]}
            />
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          还没有账号？ <a href="/register">立即注册</a>
        </div>
      </Card>
    </div>
  );
};

export default Login;