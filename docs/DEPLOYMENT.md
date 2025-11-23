# 网安技能树闯关平台部署指南

本文档详细说明如何在不同环境中部署网安技能树闯关平台，包括开发环境和生产环境的配置步骤。

## 目录

- [环境要求](#环境要求)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
  - [使用Docker Compose部署](#使用docker-compose部署)
  - [手动部署](#手动部署)
- [靶机环境部署](#靶机环境部署)
- [环境变量配置](#环境变量配置)
- [数据库初始化](#数据库初始化)
- [常见问题](#常见问题)

## 环境要求

### 基础依赖

- **Node.js**: v14.17+ 或 v16.0+
- **npm**: v6.14+ 或 yarn v1.22+
- **Docker**: v20.10.0+
- **Docker Compose**: v2.0.0+

### 数据库

- **MongoDB**: v4.4+
- **MySQL**: v8.0+
- **Redis**: v6.0+

### 硬件要求

- **最低配置**:
  - CPU: 2核
  - 内存: 4GB
  - 存储: 50GB
  - 网络: 100Mbps

- **推荐配置**:
  - CPU: 4核以上
  - 内存: 8GB以上
  - 存储: 100GB SSD
  - 网络: 1Gbps

## 开发环境部署

### 1. 克隆代码仓库

```bash
git clone https://github.com/your-org/cybersecurity-skill-tree.git
cd cybersecurity-skill-tree
```

### 2. 配置环境变量

创建并编辑后端环境变量文件:

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，设置开发环境配置:

```dotenv
# 服务器配置
PORT=5000
NODE_ENV=development

# MongoDB配置
MONGO_URI=mongodb://localhost:27017/cybersecurity_dev

# MySQL配置
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=cybersecurity_dev
MYSQL_PORT=3306

# Redis配置
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your_jwt_secret_key_for_development_only
JWT_EXPIRE=7d

# Docker API配置
DOCKER_API_URL=http://localhost:2375
```

前端环境变量配置:

```bash
cd ../frontend
cp .env.example .env
```

编辑 `.env` 文件:

```dotenv
# API基础URL
REACT_APP_API_URL=http://localhost:5000/api

# 开发环境配置
NODE_ENV=development
```

### 3. 启动数据库服务

使用Docker Compose启动数据库服务:

```bash
cd ..
docker-compose -f docker-compose.dev.yml up -d mongo mysql redis
```

### 4. 安装依赖并启动服务

#### 后端服务

```bash
cd backend
npm install
npm run dev
```

#### 前端服务

```bash
cd ../frontend
npm install
npm start
```

### 5. 验证部署

- 访问前端: http://localhost:3000
- 访问后端API文档: http://localhost:5000/api/docs

## 生产环境部署

### 使用Docker Compose部署

#### 1. 准备环境配置

创建生产环境配置文件:

```bash
cp .env.example .env.prod
```

编辑 `.env.prod` 文件，设置生产环境配置:

```dotenv
# 通用配置
NODE_ENV=production

# 数据库配置 (生产环境建议使用独立的数据库服务)
MONGO_URI=mongodb://mongo:27017/cybersecurity_prod
MYSQL_HOST=mysql
MYSQL_USER=root
MYSQL_PASSWORD=secure_password_change_this
MYSQL_DATABASE=cybersecurity_prod
REDIS_URL=redis://redis:6379

# 安全配置
JWT_SECRET=your_secure_jwt_secret_key_change_this
```

#### 2. 构建和启动服务

使用生产环境配置启动所有服务:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

这将自动:
- 构建前端和后端的Docker镜像
- 启动所有必要的服务(前端、后端、数据库、缓存)
- 配置服务之间的网络连接

#### 3. 配置反向代理 (可选)

对于生产环境，建议使用Nginx作为反向代理服务器，配置SSL证书并处理静态资源。

示例Nginx配置:

```nginx
server {
    listen 80;
    server_name cybersecurity.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name cybersecurity.example.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # 前端静态资源
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API路由
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 手动部署

#### 1. 后端部署

1. 安装Node.js和相关依赖:

```bash
cd backend
npm install --production
```

2. 配置生产环境变量:

```bash
cp .env.example .env
# 编辑.env文件，设置生产环境配置
```

3. 使用PM2管理进程:

```bash
npm install -g pm2
pm run build
pm run start:prod
```

#### 2. 前端部署

1. 构建生产版本:

```bash
cd frontend
npm install
npm run build
```

2. 部署静态文件:

将构建好的静态文件部署到Web服务器(如Nginx、Apache):

```bash
# 使用Nginx示例
cp -r build/* /var/www/html/
```

## 靶机环境部署

### 靶机配置

靶机环境位于 `targets/` 目录下，每个靶机包含自己的配置文件和Dockerfile。

### 手动部署单个靶机

以 `web-vuln-basic` 靶机为例:

```bash
cd targets/web-vuln-basic
docker build -t web-vuln-basic .
docker run -d --name web-vuln-basic -p 8001:80 web-vuln-basic
```

### 自动化靶机部署

系统会通过Docker API自动管理靶机容器，确保:
- 用户每次访问时创建隔离的容器环境
- 会话结束时自动清理容器
- 限制资源使用，确保系统安全

## 环境变量配置

### 后端环境变量

#### 核心配置

| 环境变量 | 描述 | 默认值 | 必需 |
|----------|------|--------|------|
| `PORT` | 服务器端口 | 5000 | 否 |
| `NODE_ENV` | 运行环境 | development | 否 |
| `MONGO_URI` | MongoDB连接字符串 | mongodb://localhost:27017/cybersecurity | 是 |
| `JWT_SECRET` | JWT签名密钥 | - | 是 |
| `JWT_EXPIRE` | JWT过期时间 | 7d | 否 |

#### 数据库配置

| 环境变量 | 描述 | 默认值 | 必需 |
|----------|------|--------|------|
| `MYSQL_HOST` | MySQL主机地址 | localhost | 是 |
| `MYSQL_USER` | MySQL用户名 | root | 是 |
| `MYSQL_PASSWORD` | MySQL密码 | - | 是 |
| `MYSQL_DATABASE` | MySQL数据库名 | cybersecurity | 是 |
| `REDIS_URL` | Redis连接URL | redis://localhost:6379 | 是 |

#### Docker配置

| 环境变量 | 描述 | 默认值 | 必需 |
|----------|------|--------|------|
| `DOCKER_API_URL` | Docker API地址 | http://localhost:2375 | 是 |
| `DOCKER_CONTAINER_PREFIX` | 容器名称前缀 | cybersec_ | 否 |
| `DOCKER_NETWORK` | Docker网络名称 | cybersecurity_net | 否 |

### 前端环境变量

| 环境变量 | 描述 | 默认值 | 必需 |
|----------|------|--------|------|
| `REACT_APP_API_URL` | API基础URL | http://localhost:5000/api | 是 |
| `REACT_APP_NODE_ENV` | 运行环境 | development | 否 |
| `REACT_APP_VERSION` | 应用版本号 | 1.0.0 | 否 |

## 数据库初始化

### MongoDB初始化

MongoDB数据库会在系统首次启动时自动创建必要的集合和索引。

### MySQL初始化

执行MySQL初始化脚本:

```bash
mysql -h localhost -u root -p < backend/scripts/init_mysql.sql
```

初始化脚本会创建必要的表结构和初始数据。

## 常见问题

### 1. Docker容器无法启动

**问题**: 靶机容器创建失败

**解决方案**:
- 检查Docker服务是否正常运行: `docker info`
- 验证Docker API连接: `curl http://localhost:2375/info`
- 检查端口是否被占用: `netstat -tuln | grep <port>`

### 2. 数据库连接失败

**问题**: 应用无法连接到MongoDB或MySQL

**解决方案**:
- 验证数据库服务是否运行: `docker ps | grep mysql` 或 `docker ps | grep mongo`
- 检查环境变量配置是否正确
- 确认网络配置: `docker network ls`

### 3. 权限问题

**问题**: 容器内的文件权限错误

**解决方案**:
- 检查挂载卷的权限设置
- 调整Dockerfile中的用户权限

### 4. 性能问题

**问题**: 系统响应缓慢

**解决方案**:
- 增加服务器资源(CPU/内存)
- 优化数据库索引
- 启用Redis缓存
- 调整Node.js内存限制: `NODE_OPTIONS="--max-old-space-size=4096"`

### 5. 安全问题

**问题**: 生产环境安全配置

**解决方案**:
- 更改默认密码和密钥
- 启用HTTPS
- 配置防火墙规则
- 限制Docker API访问
- 定期更新依赖包

## 监控与维护

### 日志管理

系统日志默认位于:
- 后端日志: `backend/logs/`
- Docker日志: 使用 `docker logs <container_id>` 查看

### 备份策略

建议定期备份:
- MongoDB数据: `mongodump`
- MySQL数据: `mysqldump`
- 配置文件和用户上传数据

### 定期维护任务

- 清理过期的靶机容器
- 优化数据库性能
- 更新系统依赖
- 检查安全漏洞

## 扩展指南

### 添加新的靶机

1. 在 `targets/` 目录下创建新目录
2. 创建Dockerfile和必要的配置文件
3. 在 `backend/src/controllers/targetController.js` 中添加新靶机配置
4. 更新数据库中的靶机信息

### 扩展功能模块

系统采用模块化设计，可以通过以下方式扩展功能:

1. 在 `backend/src/controllers/` 中添加新控制器
2. 在 `backend/src/routes/` 中注册新路由
3. 更新前端组件和服务

---

如需更多帮助，请联系项目维护团队: cybersecurity@example.com
