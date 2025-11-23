# 网安技能树闯关平台 - 系统架构设计文档

## 1. 项目需求分析

### 1.1 核心功能需求

**知识体系可视化**
- 将网安专业核心课程转化为可视化技能树
- 支持多级节点展示，体现知识点的层次关系
- 直观展示学习进度和完成状态

**学习过程游戏化**
- 将知识点拆解为闯关任务
- 通过完成任务点亮技能树节点
- 提供任务指引和提示系统

**实践环境虚拟化**
- 为每个任务提供安全隔离的在线靶机环境
- 支持用户在靶机中进行实战操作
- 自动评估任务完成情况

**学习进度社区化**
- 积分系统记录学习成就
- 排行榜展示用户/团队排名
- 勋章系统奖励特殊成就
- 团队竞赛功能促进协作学习

### 1.2 非功能需求

- **性能要求**：系统响应时间<2秒，支持至少1000人同时在线
- **安全性**：靶机环境隔离，用户数据加密存储，权限管理
- **可扩展性**：模块化设计，支持新增技能节点和任务
- **可用性**：系统稳定运行，定期备份数据
- **兼容性**：支持主流浏览器和操作系统

## 2. 系统架构设计

### 2.1 总体架构

采用前后端分离的微服务架构：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    前端应用     │◄───►│    API网关      │◄───►│   微服务集群    │
│  (React/Vue)    │     │  (负载均衡)     │     │                 │
└─────────────────┘     └─────────────────┘     ├─────────────────┤
                                                │  用户服务       │
                                                ├─────────────────┤
                                                │  技能树服务     │
                                                ├─────────────────┤
                                                │  任务服务       │
                                                ├─────────────────┤
                                                │  靶机管理服务   │
                                                ├─────────────────┤
                                                │  游戏化服务     │
                                                └─────────────────┘
                                                          ▲
                                                          │
┌─────────────────┐     ┌─────────────────┐     ┌─────────┴─────────┐
│   Docker容器    │◄───►│ 容器编排(K8s)   │◄───►│  数据存储层      │
│  (靶机环境)     │     │                 │     │  (MySQL/MongoDB) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2 技术栈选择

**前端技术栈**：
- React.js (或Vue.js) + Redux (状态管理)
- D3.js (技能树可视化)
- Ant Design (UI组件库)
- Socket.io-client (实时通信)

**后端技术栈**：
- Node.js + Express.js (API服务)
- Java Spring Boot (微服务)
- Python Flask (靶机管理和评估)

**数据库**：
- MySQL (关系型数据：用户、任务、成绩)
- MongoDB (非关系型数据：技能树结构、靶机配置)
- Redis (缓存：排行榜、在线状态)

**容器和部署**：
- Docker (容器化部署)
- Kubernetes (容器编排)
- Docker Compose (开发环境)

## 3. 模块设计

### 3.1 用户模块

**功能**：用户注册、登录、个人信息管理、权限控制

**数据结构**：
- 用户表：ID、用户名、密码(加密)、邮箱、角色、积分、等级
- 用户进度表：用户ID、技能节点ID、完成状态、完成时间、得分

### 3.2 技能树模块

**功能**：技能树结构管理、节点展示、进度跟踪

**数据结构**：
- 技能节点表：节点ID、节点名称、父节点ID、描述、难度、关联任务ID列表
- 课程表：课程ID、课程名称、课程描述、关联节点ID列表

### 3.3 任务模块

**功能**：任务管理、任务下发、任务评估

**数据结构**：
- 任务表：任务ID、任务名称、任务描述、难度、靶机配置、评分标准
- 任务提交表：提交ID、用户ID、任务ID、提交内容、评分、提交时间

### 3.4 靶机模块

**功能**：靶机创建、配置、管理、销毁

**数据结构**：
- 靶机模板表：模板ID、名称、描述、Docker镜像、配置参数
- 运行中靶机表：靶机实例ID、用户ID、模板ID、容器ID、状态、创建时间、过期时间

### 3.5 游戏化模块

**功能**：积分管理、排行榜、勋章、团队竞赛

**数据结构**：
- 积分记录表：记录ID、用户ID、积分变化、变化原因、时间
- 勋章表：勋章ID、勋章名称、获取条件、图标
- 用户勋章表：用户ID、勋章ID、获取时间
- 团队表：团队ID、团队名称、创建者ID、成员列表
- 竞赛表：竞赛ID、名称、规则、开始时间、结束时间、参与团队

## 4. API设计

### 4.1 用户相关API

- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/users/profile - 获取用户信息
- PUT /api/users/profile - 更新用户信息

### 4.2 技能树相关API

- GET /api/skills/tree - 获取技能树结构
- GET /api/skills/progress - 获取用户技能进度
- PUT /api/skills/progress/:nodeId - 更新技能节点进度

### 4.3 任务相关API

- GET /api/tasks/list - 获取任务列表
- GET /api/tasks/:taskId - 获取任务详情
- POST /api/tasks/:taskId/submit - 提交任务
- GET /api/tasks/:taskId/result - 获取任务结果

### 4.4 靶机相关API

- POST /api/vms/start/:taskId - 启动靶机
- GET /api/vms/status/:vmId - 获取靶机状态
- POST /api/vms/stop/:vmId - 停止靶机

### 4.5 游戏化相关API

- GET /api/leaderboard - 获取排行榜
- GET /api/medals - 获取勋章列表
- GET /api/teams - 获取团队列表
- POST /api/competitions/join - 加入竞赛

## 5. 数据库设计

### 5.1 主要数据表

**users表**
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | 加密密码 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱 |
| role | ENUM('student', 'teacher', 'admin') | NOT NULL | 角色 |
| points | INT | DEFAULT 0 | 积分 |
| level | INT | DEFAULT 1 | 等级 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**skill_nodes表**
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 节点ID |
| name | VARCHAR(100) | NOT NULL | 节点名称 |
| parent_id | INT | REFERENCES skill_nodes(id) | 父节点ID |
| description | TEXT | | 节点描述 |
| difficulty | ENUM('easy', 'medium', 'hard') | NOT NULL | 难度 |
| course_id | INT | REFERENCES courses(id) | 所属课程ID |

**tasks表**
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 任务ID |
| title | VARCHAR(100) | NOT NULL | 任务标题 |
| description | TEXT | NOT NULL | 任务描述 |
| difficulty | ENUM('easy', 'medium', 'hard') | NOT NULL | 难度 |
| points_reward | INT | NOT NULL | 奖励积分 |
| vm_template_id | INT | REFERENCES vm_templates(id) | 靶机模板ID |
| evaluation_script | TEXT | | 自动评估脚本 |

**user_progress表**
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| user_id | INT | REFERENCES users(id) | 用户ID |
| node_id | INT | REFERENCES skill_nodes(id) | 节点ID |
| task_id | INT | REFERENCES tasks(id) | 任务ID |
| status | ENUM('pending', 'in_progress', 'completed') | NOT NULL | 状态 |
| score | INT | | 得分 |
| completed_at | TIMESTAMP | | 完成时间 |

## 6. 安全设计

### 6.1 靶机环境安全

- 使用Docker容器隔离每个用户的靶机环境
- 限制容器资源使用（CPU、内存、网络）
- 禁用危险操作，限制容器权限
- 设置靶机自动销毁时间，避免资源浪费

### 6.2 数据安全

- 用户密码加盐哈希存储
- API请求使用JWT token认证
- 敏感数据传输使用HTTPS加密
- 定期数据备份和恢复机制

### 6.3 访问控制

- 基于角色的访问控制（RBAC）
- 学生、教师、管理员权限分离
- 限制API访问频率，防止暴力攻击

## 7. 部署架构

### 7.1 开发环境

- Docker Compose编排开发环境
- 本地数据库和Redis缓存
- 前端热重载开发服务器

### 7.2 生产环境

- Kubernetes集群管理容器
- 负载均衡分发请求
- 数据库主从复制保证数据安全
- 容器自动扩缩容应对流量变化

## 8. 项目实施计划

### 8.1 第一阶段：基础架构搭建
- 搭建开发环境和基础框架
- 实现用户认证系统
- 设计并创建数据库结构

### 8.2 第二阶段：核心功能开发
- 开发技能树可视化界面
- 实现任务管理系统
- 开发靶机管理模块

### 8.3 第三阶段：游戏化功能实现
- 开发积分和排行榜系统
- 实现勋章奖励机制
- 开发团队竞赛功能

### 8.4 第四阶段：系统测试和优化
- 进行功能测试和性能测试
- 安全审计和漏洞修复
- 用户体验优化

### 8.5 第五阶段：部署和维护
- 系统部署上线
- 监控系统运行状态
- 持续更新和迭代

## 9. 未来扩展方向

- 支持更多类型的靶机环境
- 增加AI辅助学习功能
- 集成更多安全工具到平台
- 开发移动客户端支持
- 建立校企合作机制，提供企业级安全挑战