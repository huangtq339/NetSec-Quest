# 网安技能树闯关平台 - API文档

本文档详细描述了网安技能树闯关平台后端提供的所有API接口，包括接口路径、请求方法、参数说明、响应格式等信息，供前端开发人员和第三方系统集成使用。

## 目录

- [认证与用户管理](#认证与用户管理)
- [靶机环境管理](#靶机环境管理)
- [挑战进度管理](#挑战进度管理)
- [排行榜系统](#排行榜系统)
- [消息通知](#消息通知)

## 基础信息

### 基本URL

开发环境: `http://localhost:5000/api`
生产环境: `https://api.cybersecurity-skill-tree.com/api`

### 响应格式

所有API响应使用JSON格式，包含以下字段：

**成功响应**:
```json
{
  "success": true,
  "data": { /* 返回的数据内容 */ },
  "message": "操作成功" // 可选
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": 400, // HTTP状态码
    "message": "错误信息",
    "details": {} // 可选，详细错误信息
  }
}
```

### 认证方式

大部分API需要认证，通过在请求头中添加JWT令牌来实现：

```
Authorization: Bearer <your_token>
```

## 认证与用户管理

### 1. 用户注册

**POST** `/auth/register`

**请求体**:
```json
{
  "username": "string", // 用户名，长度3-20个字符
  "email": "string",    // 邮箱，有效的邮箱格式
  "password": "string"  // 密码，至少8个字符
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "token": "string" // JWT令牌
  },
  "message": "注册成功"
}
```

### 2. 用户登录

**POST** `/auth/login`

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "points": 0,
    "token": "string"
  },
  "message": "登录成功"
}
```

### 3. 获取用户信息

**GET** `/auth/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "points": 100,
    "level": 3,
    "completedChallenges": 15,
    "rank": 12,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-06-15T10:30:00.000Z"
  }
}
```

### 4. 更新用户信息

**PUT** `/auth/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "email": "string", // 可选
  "password": "string", // 可选，新密码
  "oldPassword": "string" // 仅当修改密码时必需
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "points": 100,
    "level": 3
  },
  "message": "更新成功"
}
```

## 靶机环境管理

### 1. 获取可用靶机列表

**GET** `/targets`

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `difficulty`: 可选，难度筛选 (easy/medium/hard)
- `category`: 可选，分类筛选 (web/sqli/xss/etc)
- `page`: 可选，页码，默认1
- `limit`: 可选，每页数量，默认10

**响应**:
```json
{
  "success": true,
  "data": {
    "targets": [
      {
        "id": "web-vuln-basic",
        "name": "基础Web漏洞靶机",
        "description": "包含常见Web漏洞的靶机环境，适合初学者练习",
        "difficulty": "easy",
        "category": "web",
        "points": 50,
        "solvedCount": 156,
        "available": true
      },
      {
        "id": "sql-injection-1",
        "name": "SQL注入靶机1",
        "description": "针对SQL注入漏洞的练习环境",
        "difficulty": "medium",
        "category": "sqli",
        "points": 100,
        "solvedCount": 89,
        "available": true
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

### 2. 获取靶机详情

**GET** `/targets/:targetId`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "web-vuln-basic",
    "name": "基础Web漏洞靶机",
    "description": "包含常见Web漏洞的靶机环境，适合初学者练习",
    "difficulty": "easy",
    "category": "web",
    "points": 50,
    "solvedCount": 156,
    "available": true,
    "instructions": "访问靶机地址，找到所有的flag...",
    "hint": "注意检查URL参数和表单输入",
    "yourProgress": {
      "attempted": true,
      "solved": false,
      "lastAttempt": "2023-06-14T15:30:00.000Z",
      "attemptCount": 3
    }
  }
}
```

### 3. 启动靶机会话

**POST** `/targets/sessions`

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "targetId": "web-vuln-basic"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-string",
    "targetId": "web-vuln-basic",
    "url": "http://localhost:8080/container-id",
    "expiresAt": "2023-06-15T12:00:00.000Z",
    "remainingTime": 3600 // 秒
  },
  "message": "靶机启动成功，有效期1小时"
}
```

### 4. 停止靶机会话

**DELETE** `/targets/sessions/:sessionId`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "靶机已停止"
}
```

### 5. 提交Flag

**POST** `/targets/flags`

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "sessionId": "uuid-string",
  "flag": "flag{example-flag-here}"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "correct": true,
    "pointsAwarded": 50,
    "newTotalPoints": 150,
    "newLevel": 4
  },
  "message": "Flag提交成功！"
}
```

## 挑战进度管理

### 1. 获取用户挑战进度

**GET** `/progress`

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `status`: 可选，筛选状态 (attempted/solved)
- `page`: 可选，页码，默认1
- `limit`: 可选，每页数量，默认20

**响应**:
```json
{
  "success": true,
  "data": {
    "progress": [
      {
        "targetId": "web-vuln-basic",
        "targetName": "基础Web漏洞靶机",
        "solved": true,
        "pointsEarned": 50,
        "solvedAt": "2023-06-10T14:25:00.000Z",
        "attemptCount": 2
      },
      {
        "targetId": "sql-injection-1",
        "targetName": "SQL注入靶机1",
        "solved": false,
        "lastAttempt": "2023-06-14T15:30:00.000Z",
        "attemptCount": 3
      }
    ],
    "stats": {
      "totalTargets": 50,
      "solvedTargets": 15,
      "attemptedTargets": 25,
      "completionRate": 30
    },
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "pages": 2
    }
  }
}
```

### 2. 获取技能树进度

**GET** `/progress/skill-tree`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": "web-fundamentals",
        "name": "Web基础",
        "progress": 80, // 完成百分比
        "completedChallenges": 4,
        "totalChallenges": 5
      },
      {
        "id": "sql-injection",
        "name": "SQL注入",
        "progress": 50,
        "completedChallenges": 2,
        "totalChallenges": 4
      }
    ],
    "overallProgress": 65
  }
}
```

## 排行榜系统

### 1. 获取全局排行榜

**GET** `/leaderboard`

**查询参数**:
- `timeframe`: 可选，时间范围 (daily/weekly/monthly/alltime)，默认alltime
- `limit`: 可选，显示数量，默认50

**响应**:
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user-1",
        "username": "hacker123",
        "points": 1500,
        "level": 10,
        "solvedChallenges": 75
      },
      {
        "rank": 2,
        "userId": "user-2",
        "username": "cybersecurity-pro",
        "points": 1250,
        "level": 9,
        "solvedChallenges": 68
      }
    ],
    "yourRank": {
      "rank": 12,
      "userId": "current-user-id",
      "username": "current-user",
      "points": 850,
      "level": 6,
      "solvedChallenges": 42
    }
  }
}
```

### 2. 获取好友排行榜

**GET** `/leaderboard/friends`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "friend-1",
        "username": "friend1",
        "points": 950,
        "level": 7,
        "solvedChallenges": 48
      },
      {
        "rank": 2,
        "userId": "current-user-id",
        "username": "current-user",
        "points": 850,
        "level": 6,
        "solvedChallenges": 42
      }
    ]
  }
}
```

## 消息通知

### 1. 获取用户通知

**GET** `/notifications`

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `unreadOnly`: 可选，只返回未读通知 (true/false)，默认false
- `page`: 可选，页码，默认1
- `limit`: 可选，每页数量，默认20

**响应**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-1",
        "type": "challenge-completed",
        "title": "挑战完成！",
        "message": "恭喜您完成了'基础Web漏洞靶机'挑战，获得50积分！",
        "read": false,
        "createdAt": "2023-06-15T10:30:00.000Z",
        "relatedTargetId": "web-vuln-basic"
      },
      {
        "id": "notif-2",
        "type": "rank-up",
        "title": "排名提升！",
        "message": "您的排名上升到了第12位！",
        "read": true,
        "createdAt": "2023-06-14T15:45:00.000Z"
      }
    ],
    "unreadCount": 5,
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "pages": 2
    }
  }
}
```

### 2. 标记通知为已读

**PUT** `/notifications/:notificationId/read`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "通知已标记为已读"
}
```

### 3. 标记所有通知为已读

**PUT** `/notifications/read-all`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "markedCount": 5
  },
  "message": "所有通知已标记为已读"
}
```

## 状态码

API使用以下HTTP状态码：

- **200 OK**: 请求成功
- **201 Created**: 资源创建成功
- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未授权，需要认证
- **403 Forbidden**: 拒绝访问
- **404 Not Found**: 资源不存在
- **500 Internal Server Error**: 服务器内部错误

## 错误码

常见错误码说明：

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| AUTH_FAILED | 认证失败 | 检查用户名和密码 |
| TOKEN_EXPIRED | 令牌过期 | 重新登录获取新令牌 |
| INVALID_TOKEN | 无效令牌 | 检查令牌格式 |
| USER_NOT_FOUND | 用户不存在 | 确认用户信息 |
| TARGET_UNAVAILABLE | 靶机不可用 | 稍后再试或联系管理员 |
| SESSION_EXPIRED | 会话已过期 | 重新启动靶机会话 |
| INVALID_FLAG | 无效的Flag | 检查Flag格式 |
| FLAG_ALREADY_SUBMITTED | 已提交过该Flag | 挑战已完成 |

---

如果您在使用API过程中遇到任何问题，请联系平台管理员获取支持。
