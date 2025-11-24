import React from 'react';
import { Card, Form, Input, Button, Typography, Select, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register } = useAuth();

  const onFinish = async (values) => {
    try {
      // 验证密码一致性
      if (values.password !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }

      // 显示加载消息
      const loadingKey = 'registerLoading';
      message.loading({ content: '正在注册中，请稍候...', key: loadingKey, duration: 0 });

      // 准备符合后端要求的数据格式
      const roleMap = {
        '学生': 'student',
        '教师': 'teacher',
        '管理员': 'admin'
      };
      
      // 准备注册数据 - 包含所有必要字段
      const registerData = {
        studentId: values.studentId,
        name: values.name,
        email: values.email,
        className: values.className,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: roleMap[values.role] || 'student'
      };

      // 发送注册请求
      const success = await register(registerData);

      // 只有注册成功时才销毁loading消息
      message.destroy(loadingKey);

      if (success) {
        message.success('注册成功！即将跳转到登录页面');
        // 延迟跳转，让用户有时间看到成功提示
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
      // 注册失败时不销毁loading消息，让AuthContext中的自定义错误提示正常显示
    } catch (error) {
      message.error('注册过程中发生错误，请稍后重试');
      console.error('注册错误:', error);
    }
  };

  // 密码验证规则
  const validateToNextPassword = (_, value) => {
    // 使用form实例而不是Form.useFormInstance()
    if (value && form.getFieldValue('password') !== value) {
      return Promise.reject(new Error('两次输入的密码不一致'));
    }
    return Promise.resolve();
  };

  // 验证主流电子邮箱的正则表达式
  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|qq\.com|163\.com|126\.com|sina\.com|sohu\.com|foxmail\.com|icloud\.com|aliyun\.com|139\.com|189\.com|edu\.cn|edu\.com)$/i;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      background: '#f5f5f5'
    }}>
      <Card 
        title="用户注册" 
        style={{ 
          width: 500, 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: 8
        }}
      >
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          style={{ maxWidth: 450, margin: '0 auto' }}
        >
          <Form.Item
            label="学号"
            name="studentId"
            rules={[
              { required: true, message: '请输入学号' },
              { whitespace: true, message: '学号不能为空' },
              { pattern: /^[a-zA-Z0-9]+$/, message: '学号只能包含字母和数字' },
              { min: 6, max: 15, message: '学号长度必须在6-15位之间' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="请输入学号（6-15位）"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[
              { required: true, message: '请输入姓名' },
              { whitespace: true, message: '姓名不能为空' },
              { max: 5, message: '姓名长度不能超过5个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="请输入姓名（5个字符之内）"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="电子邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入电子邮箱' },
              { whitespace: true, message: '电子邮箱不能为空' },
              { pattern: emailRegex, message: '请输入有效的主流电子邮箱' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="请输入主流电子邮箱（如：gmail.com, qq.com等）"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="班级"
            name="className"
            rules={[
              { required: true, message: '请输入班级' },
              { whitespace: true, message: '班级不能为空' },
              { max: 12, message: '班级长度不能超过12个字符' }
            ]}
          >
            <Input
              prefix={<TeamOutlined className="site-form-item-icon" />}
              placeholder="请输入班级（12个字之内）"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { whitespace: true, message: '密码不能为空' },
              { min: 6, max: 15, message: '密码长度必须在6-15位之间' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, message: '密码必须同时包含字母和数字' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="请输入密码（6-15位，必须包含字母和数字）"
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              { whitespace: true, message: '确认密码不能为空' },
              { validator: validateToNextPassword }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="请再次输入密码"
            />
          </Form.Item>
          
          <Form.Item
            label="角色"
            name="role"
            initialValue="学生"
          >
            <Select placeholder="请选择角色">
              <Option value="学生">学生</Option>
              <Option value="教师">教师</Option>
              <Option value="管理员">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="兴趣方向（非必选）"
            name="interest"
          >
            <Select placeholder="请选择兴趣方向" allowClear>
              <Option value="web安全">Web安全</Option>
              <Option value="密码学">密码学</Option>
              <Option value="二进制">二进制</Option>
              <Option value="逆向">逆向</Option>
              <Option value="杂项">杂项</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="register-form-button"
              style={{ width: '100%', marginTop: 16 }}
            >
              注册
            </Button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              已有账号？ <a href="/login">立即登录</a>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;