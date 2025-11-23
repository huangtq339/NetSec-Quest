# 网安技能树闯关平台 - 开发者指南

本文档旨在为参与网安技能树闯关平台开发的开发者提供详细的指导，包括项目架构、开发流程、代码规范、测试方法以及常见问题解决方案。

## 目录

- [项目架构概览](#项目架构概览)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [开发工作流程](#开发工作流程)
- [后端开发指南](#后端开发指南)
- [前端开发指南](#前端开发指南)
- [靶机开发指南](#靶机开发指南)
- [测试指南](#测试指南)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

## 项目架构概览

网安技能树闯关平台采用前后端分离的架构设计，主要包含以下组件：

### 前端

- **技术栈**: React.js + TypeScript + Redux + Ant Design
- **主要功能**: 用户界面、交互逻辑、数据展示
- **构建工具**: Webpack, Babel
- **测试框架**: Jest, React Testing Library

### 后端

- **技术栈**: Node.js + Express + MongoDB + MySQL + Redis
- **主要功能**: API服务、业务逻辑、数据存储、靶机管理
- **认证授权**: JWT
- **实时通信**: Socket.IO
- **测试框架**: Jest, Supertest

### 靶机环境

- **技术栈**: Docker + Docker Compose
- **主要功能**: 提供隔离的漏洞环境
- **容器管理**: Docker API

## 开发环境设置

### 前提条件

确保您的开发环境已安装以下软件：

- Git
- Node.js v14+ 或 v16+
- npm v6+ 或 yarn v1+
- Docker 和 Docker Compose
- MongoDB v4.4+
- MySQL v8.0+
- Redis v6.0+

### 环境设置步骤

#### 1. 克隆代码仓库

```bash
git clone https://github.com/your-org/cybersecurity-skill-tree.git
cd cybersecurity-skill-tree
```

#### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

#### 3. 配置环境变量

创建并配置开发环境变量文件：

```bash
# 后端环境变量
cd backend
cp .env.example .env
# 编辑.env文件，根据您的本地环境配置参数

# 前端环境变量
cd ../frontend
cp .env.example .env
# 编辑.env文件，配置API地址等
```

#### 4. 启动开发服务器

```bash
# 启动后端开发服务器
cd backend
npm run dev

# 启动前端开发服务器
cd ../frontend
npm start
```

后端服务默认运行在 http://localhost:5000
前端服务默认运行在 http://localhost:3000

## 代码规范

### JavaScript/TypeScript 规范

- **命名约定**:
  - 变量/函数: 使用小驼峰命名法 (e.g., `userName`, `getUserInfo()`)
  - 常量: 使用大写下划线命名法 (e.g., `MAX_RETRY`, `API_BASE_URL`)
  - 类/组件: 使用大驼峰命名法 (e.g., `UserProfile`, `TargetManager`)
  - 文件命名: 小驼峰命名 (e.g., `userService.js`, `targetController.js`)

- **代码风格**:
  - 使用单引号 `'` 而非双引号 `"`
  - 使用 2 个空格缩进
  - 语句结尾使用分号
  - 大括号风格: 行尾大括号
  ```javascript
  // 推荐
  if (condition) {
    // 代码
  }
  
  // 不推荐
  if (condition)
  {
    // 代码
  }
  ```

- **注释规范**:
  - 函数/方法: 使用 JSDoc 格式注释
  ```javascript
  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户信息对象
   */
  async function getUserInfo(userId) {}
  ```
  - 复杂逻辑: 添加内联注释说明
  - 文件顶部: 添加文件描述和作者信息

### React 组件规范

- **组件结构**:
  - 使用函数式组件和Hooks
  - 组件拆分合理，职责单一
  - 使用 PropTypes 或 TypeScript 进行类型检查

- **样式管理**:
  - 使用 Ant Design 组件库的样式系统
  - 自定义样式使用 CSS Modules 或 styled-components
  - 避免使用行内样式

- **状态管理**:
  - 组件内部状态使用 useState
  - 共享状态使用 Redux 或 Context API
  - 异步操作使用 Redux Toolkit 或自定义 Hooks

### 后端API规范

- **RESTful API 设计**:
  - 使用 HTTP 方法: GET, POST, PUT, DELETE
  - 资源命名: 使用复数形式 (e.g., `/api/users`, `/api/targets`)
  - 版本控制: `/api/v1/...`

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {...}, // 成功时返回的数据
    "message": "操作成功" // 可选的消息
  }
  ```

  错误响应:
  ```json
  {
    "success": false,
    "error": {
      "code": 400,
      "message": "错误信息"
    }
  }
  ```

## 开发工作流程

### 分支管理

项目使用 Git Flow 工作流，主要分支包括：

- **main/master**: 稳定的生产代码分支
- **develop**: 开发主分支
- **feature/\***: 新功能开发分支
- **bugfix/\***: Bug 修复分支
- **release/\***: 发布准备分支

### 提交规范

提交信息应遵循以下格式：

```
<类型>: <简短描述>

<详细描述（可选）>

<关联Issue（可选）>
```

其中类型包括：
- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档修改
- `style`: 代码风格调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建配置修改
- `ci`: CI/CD 配置修改

### Pull Request 流程

1. 在 GitHub/GitLab 上创建新的 Pull Request
2. 填写 PR 描述，包括：
   - 功能概述
   - 实现细节
   - 测试方法
   - 相关 Issue 链接
3. 等待代码审查
4. 根据审查意见进行修改
5. 合并到目标分支

## 后端开发指南

### 项目结构

```
backend/
├── src/
│   ├── controllers/     # API控制器
│   ├── models/          # 数据模型
│   ├── routes/          # 路由配置
│   ├── services/        # 业务逻辑
│   ├── middleware/      # 中间件
│   ├── utils/           # 工具函数
│   ├── config/          # 配置文件
│   └── server.js        # 服务器入口
├── tests/               # 测试文件
├── scripts/             # 脚本文件
└── package.json         # 项目配置
```

### 控制器开发

控制器负责处理HTTP请求，调用相应的服务层方法，并返回响应。

**示例**: 创建一个新的控制器

```javascript
// src/controllers/exampleController.js

const exampleService = require('../services/exampleService');

/**
 * 获取示例数据
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
exports.getExampleData = async (req, res) => {
  try {
    const data = await exampleService.getData(req.params.id);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.status || 500,
        message: error.message || '服务器内部错误'
      }
    });
  }
};
```

### 模型开发

使用 Mongoose 定义 MongoDB 模型，使用 Sequelize 定义 MySQL 模型。

**MongoDB模型示例**:

```javascript
// src/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
```

### 路由配置

在 `routes` 目录中定义API路由，并与控制器方法关联。

**示例**:

```javascript
// src/routes/exampleRoutes.js

const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');
const authMiddleware = require('../middleware/auth');

// 公开路由
router.get('/public', exampleController.getPublicData);

// 需要认证的路由
router.get('/protected', authMiddleware, exampleController.getProtectedData);

module.exports = router;
```

然后在 `server.js` 中注册路由：

```javascript
const exampleRoutes = require('./routes/exampleRoutes');
app.use('/api/examples', exampleRoutes);
```

## 前端开发指南

### 项目结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── components/      # 可复用组件
│   ├── pages/           # 页面组件
│   ├── redux/           # Redux状态管理
│   ├── services/        # API服务
│   ├── hooks/           # 自定义Hooks
│   ├── utils/           # 工具函数
│   ├── assets/          # 资源文件
│   ├── App.js           # 应用入口组件
│   └── index.js         # 渲染入口
└── package.json         # 项目配置
```

### 组件开发

推荐使用函数式组件和Hooks进行开发。

**示例组件**:

```jsx
// src/components/TargetCard.jsx

import React from 'react';
import { Card, Button, Tag } from 'antd';

/**
 * 靶机卡片组件
 * @param {Object} props - 组件属性
 * @param {string} props.id - 靶机ID
 * @param {string} props.title - 靶机标题
 * @param {string} props.description - 靶机描述
 * @param {string} props.difficulty - 难度级别
 * @param {Function} props.onStart - 开始挑战回调函数
 */
const TargetCard = ({ id, title, description, difficulty, onStart }) => {
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'default';
    }
  };

  return (
    <Card
      title={title}
      extra={<Tag color={getDifficultyColor(difficulty)}>{difficulty}</Tag>}
      style={{ marginBottom: 16 }}
    >
      <p>{description}</p>
      <Button type="primary" onClick={() => onStart(id)} style={{ marginTop: 16 }}>
        开始挑战
      </Button>
    </Card>
  );
};

export default TargetCard;
```

### API服务

使用 Axios 创建API服务，统一处理请求和响应。

**示例**:

```javascript
// src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 处理认证错误，例如token过期
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// 具体的API服务
export const targetService = {
  async getTargets() {
    return api.get('/targets');
  },
  
  async startTargetSession(targetId) {
    return api.post('/targets/sessions', { targetId });
  },
  
  async submitFlag(sessionId, flag) {
    return api.post('/targets/flags', { sessionId, flag });
  }
};
```

## 靶机开发指南

### 靶机结构

每个靶机都应该按照以下结构组织：

```
targets/[target-id]/
├── Dockerfile           # Docker构建文件
├── docker-compose.yml   # Docker Compose配置（可选）
├── apache-config.conf   # Web服务器配置
├── pages/               # Web页面文件
│   ├── index.php        # 主页
│   └── ...              # 其他页面
├── database/            # 数据库相关文件
│   └── init.sql         # 数据库初始化脚本
└── README.md            # 靶机说明文档
```

### 创建新靶机

1. **创建靶机目录结构**

2. **编写Dockerfile**
   ```dockerfile
   FROM php:7.4-apache
   
   # 安装必要的PHP扩展
   RUN docker-php-ext-install mysqli pdo pdo_mysql
   
   # 启用Apache模块
   RUN a2enmod rewrite
   
   # 复制配置文件
   COPY apache-config.conf /etc/apache2/sites-available/000-default.conf
   
   # 复制应用文件
   COPY pages/ /var/www/html/
   
   # 设置权限
   RUN chown -R www-data:www-data /var/www/html
   
   # 暴露端口
   EXPOSE 80
   ```

3. **配置Apache/Nginx**
   确保配置文件包含必要的安全设置和重写规则。

4. **创建漏洞页面**
   根据靶机目标创建包含特定漏洞的页面。

5. **添加到靶机控制器**
   在 `targetController.js` 中添加新靶机的配置。

## 测试指南

### 后端测试

项目使用 Jest 进行后端测试。

**运行测试**:
```bash
cd backend
npm test
```

**编写测试**:

在 `tests` 目录下创建测试文件，命名格式为 `[module].test.js`。

**示例测试**:

```javascript
// tests/controllers/targetController.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('Target Controller', () => {
  test('GET /api/targets should return all targets', async () => {
    const res = await request(app).get('/api/targets');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

### 前端测试

使用 Jest 和 React Testing Library 进行前端测试。

**运行测试**:
```bash
cd frontend
npm test
```

**编写测试**:

```jsx
// src/components/TargetCard.test.jsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TargetCard from './TargetCard';

it('renders target card with correct title', () => {
  render(
    <TargetCard
      id="web-vuln-basic"
      title="基础Web漏洞靶机"
      description="包含常见Web漏洞的靶机环境"
      difficulty="easy"
      onStart={() => {}}
    />
  );
  expect(screen.getByText('基础Web漏洞靶机')).toBeInTheDocument();
});

it('calls onStart when button is clicked', () => {
  const handleStart = jest.fn();
  render(
    <TargetCard
      id="web-vuln-basic"
      title="基础Web漏洞靶机"
      description="包含常见Web漏洞的靶机环境"
      difficulty="easy"
      onStart={handleStart}
    />
  );
  fireEvent.click(screen.getByText('开始挑战'));
  expect(handleStart).toHaveBeenCalledWith('web-vuln-basic');
});
```

## 部署指南

详见 [部署文档](DEPLOYMENT.md)。

## 常见问题

### 开发环境

**Q: 无法连接到数据库**
A: 检查数据库服务是否运行，以及环境变量配置是否正确。

**Q: Docker容器无法启动**
A: 检查Docker服务是否运行，端口是否被占用，Dockerfile是否正确。

### 代码开发

**Q: 如何添加新的API端点**
A: 
1. 在 `controllers` 中创建新的控制器方法
2. 在 `routes` 中注册新的路由
3. 在 `services` 中实现业务逻辑

**Q: 如何处理认证和授权**
A: 使用JWT进行认证，在需要认证的路由上添加 `authMiddleware`。

### 调试技巧

- **后端调试**: 使用 `console.log` 或配置 VS Code 的 Node.js 调试器
- **前端调试**: 使用浏览器开发者工具和 React DevTools
- **Docker调试**: 使用 `docker logs [container_id]` 查看容器日志

## 最佳实践

1. **代码质量**:
   - 遵循代码规范
   - 编写单元测试，保证测试覆盖率
   - 使用 ESLint 和 Prettier 保持代码质量

2. **安全性**:
   - 对所有用户输入进行验证和过滤
   - 使用参数化查询防止SQL注入
   - 保护敏感数据，避免硬编码密码和密钥

3. **性能优化**:
   - 使用缓存减少数据库查询
   - 优化前端组件渲染
   - 使用分页加载大量数据

4. **文档维护**:
   - 保持代码注释清晰准确
   - 及时更新文档以反映代码变化
   - 为新功能添加使用说明

---

希望本指南对您的开发工作有所帮助。如有任何问题或建议，请通过项目的Issue系统或讨论区提出。
