# 网安技能树闯关平台

## 项目概述
网安技能树闯关平台是一个集成了在线靶机环境、学习路径管理和竞赛系统的综合网络安全教育平台。该平台旨在帮助网络安全学习者通过实战练习提升技能，并通过挑战和竞赛激发学习兴趣。

### 核心功能
- **在线靶机环境**：提供多种难度级别的漏洞靶机，支持实时部署和管理
- **学习路径系统**：基于技能树结构的渐进式学习路径，包含知识点和实践任务
- **用户进度追踪**：记录用户学习进度、挑战完成情况和技能掌握程度
- **实时排名系统**：基于积分的用户排名，支持个人和团队竞赛
- **社交互动功能**：学习小组、讨论区和学习资源共享

## 系统架构

### 技术栈

#### 前端
- React.js + TypeScript
- Redux (状态管理)
- React Router (路由管理)
- Axios (API请求)
- Ant Design (UI组件库)

#### 后端
- Node.js + Express
- MongoDB (用户数据、进度、积分)
- MySQL (靶机配置、题目库)
- Redis (缓存、会话管理)
- Socket.IO (实时通信)

#### 靶机环境
- Docker (容器化部署)
- Docker Compose (多容器编排)
- Apache/NGINX (Web服务器)
- PHP/Python (后端语言)

### 系统架构图

```
+-----------------+      +----------------+      +---------------+
|   前端应用      |<---->|    后端API     |<---->|   数据库集群   |
|  (React/TypeScript)|  |   (Express)   |  | (MongoDB/MySQL/Redis)
+-----------------+      +----------------+      +---------------+
                                  |
                          +---------------+
                          |  靶机管理系统  |
                          |  (Docker API) |
                          +---------------+
                                  |
                          +---------------+
                          |   容器集群    |
                          |  (Docker容器) |
                          +---------------+
```

## 快速开始

### 环境要求
- Node.js v14+ 或 v16+
- MongoDB v4.4+
- MySQL v8.0+
- Redis v6.0+
- Docker v20.10+
- Docker Compose v2.0+

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/your-org/cybersecurity-skill-tree.git
cd cybersecurity-skill-tree
```

#### 2. 后端安装

```bash
cd backend
npm install
```

#### 3. 前端安装

```bash
cd ../frontend
npm install
```

#### 4. 环境配置

复制示例配置文件并修改：

```bash
# 后端配置
cd backend
cp .env.example .env
# 编辑.env文件，配置数据库连接和其他设置

# 前端配置
cd ../frontend
cp .env.example .env
# 编辑.env文件，配置API地址等
```

#### 5. 启动服务

使用Docker Compose启动所有服务：

```bash
cd ..
docker-compose up -d
```

或者手动启动各组件：

```bash
# 启动后端
cd backend
npm start

# 启动前端
cd ../frontend
npm start
```

## 靶机环境

### 可用靶机
- **web-vuln-basic**: 基础Web漏洞靶机，包含信息泄露、目录遍历等漏洞
- **web-vuln-sql**: SQL注入靶机，包含多种SQL注入类型的挑战
- 更多靶机将持续添加...

### 靶机管理
靶机通过Docker容器化部署，确保环境隔离和安全。系统自动管理容器的创建、停止和删除，用户可以通过Web界面直接访问靶机。

## 开发指南

### 后端开发

```bash
cd backend
npm run dev  # 开发模式启动
npm test     # 运行测试
```

### 前端开发

```bash
cd frontend
npm run dev  # 开发模式启动
npm run build  # 构建生产版本
```

## 部署说明

### 生产环境部署

#### Docker部署（推荐）

使用提供的Docker Compose文件可以一键部署整个系统：

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### 手动部署

1. 构建前端生产版本：
   ```bash
   cd frontend
   npm run build
   ```

2. 将构建结果复制到后端的静态文件目录

3. 配置生产环境的环境变量

4. 使用PM2等进程管理工具启动后端服务：
   ```bash
   cd backend
   pm2 start src/server.js --name cybersecurity-skill-tree
   ```

### 环境变量配置

#### 后端关键环境变量
- `PORT`: 服务器端口
- `MONGO_URI`: MongoDB连接字符串
- `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`: MySQL配置
- `REDIS_URL`: Redis连接URL
- `JWT_SECRET`: JWT密钥
- `DOCKER_API_URL`: Docker API地址

## 安全注意事项

1. 生产环境中务必修改默认密码和密钥
2. 限制Docker API的访问权限
3. 定期更新依赖包以修复安全漏洞
4. 配置适当的防火墙规则，限制容器网络访问
5. 监控系统日志，及时发现异常活动

## 贡献指南

欢迎提交Issue和Pull Request。贡献代码前请确保：
1. 代码符合项目的代码规范
2. 编写了相应的测试用例
3. 提交前运行了所有测试

## 许可证

本项目采用MIT许可证。详情请见LICENSE文件。

## 联系方式

项目维护团队：cybersecurity@example.com
