const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const TargetSession = require('../models/targetSession');

// 靶机类型和配置
const TARGET_CONFIGS = {
  'web-vuln-basic': {
    containerName: 'web-vuln-basic',
    port: 8001,
    description: 'Web安全基础靶机 - 包含信息泄露、文件上传和认证绕过漏洞',
    category: 'web'
  },
  'web-vuln-sql': {
    containerName: 'web-vuln-sql',
    port: 8002,
    description: 'SQL注入靶机 - 包含各种类型的SQL注入漏洞',
    category: 'web'
  },
  'web-vuln-xss': {
    containerName: 'web-vuln-xss',
    port: 8003,
    description: 'XSS漏洞靶机 - 包含反射型和存储型XSS漏洞',
    category: 'web'
  },
  'network-vuln-basic': {
    containerName: 'network-vuln-basic',
    port: 8004,
    description: '网络安全基础靶机 - 包含网络服务漏洞',
    category: 'network'
  },
  'system-vuln-basic': {
    containerName: 'system-vuln-basic',
    port: 8005,
    sshPort: 2222,
    description: '系统安全靶机 - 包含系统级漏洞和提权挑战',
    category: 'system'
  }
};

/**
 * 获取所有可用靶机列表
 */
exports.getAvailableTargets = async (req, res) => {
  try {
    // 返回预定义的靶机配置列表
    const targets = Object.keys(TARGET_CONFIGS).map(key => ({
      id: key,
      ...TARGET_CONFIGS[key]
    }));
    
    res.status(200).json({
      success: true,
      targets
    });
  } catch (error) {
    console.error('获取靶机列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取靶机列表失败'
    });
  }
};

/**
 * 启动靶机会话
 */
exports.startTargetSession = async (req, res) => {
  const { targetId } = req.body;
  const userId = req.user._id;
  
  try {
    // 检查靶机类型是否有效
    if (!TARGET_CONFIGS[targetId]) {
      return res.status(400).json({
        success: false,
        message: '无效的靶机类型'
      });
    }
    
    // 检查用户是否已有此靶机的活动会话
    const existingSession = await TargetSession.findOne({
      userId,
      targetId,
      status: 'active'
    });
    
    if (existingSession) {
      return res.status(200).json({
        success: true,
        session: existingSession,
        targetUrl: getTargetUrl(TARGET_CONFIGS[targetId].port)
      });
    }
    
    // 检查并确保靶机容器正在运行
    const isRunning = await checkContainerStatus(TARGET_CONFIGS[targetId].containerName);
    
    if (!isRunning) {
      // 启动靶机容器
      await startContainer(TARGET_CONFIGS[targetId].containerName);
    }
    
    // 创建新的靶机会话记录
    const session = new TargetSession({
      userId,
      targetId,
      status: 'active',
      startTime: new Date()
    });
    
    await session.save();
    
    // 返回会话信息和靶机访问URL
    res.status(200).json({
      success: true,
      session,
      targetUrl: getTargetUrl(TARGET_CONFIGS[targetId].port)
    });
  } catch (error) {
    console.error('启动靶机会话失败:', error);
    res.status(500).json({
      success: false,
      message: '启动靶机会话失败',
      error: error.message
    });
  }
};

/**
 * 停止靶机会话
 */
exports.stopTargetSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id;
  
  try {
    // 查找会话
    const session = await TargetSession.findOneAndUpdate(
      { _id: sessionId, userId, status: 'active' },
      { 
        status: 'completed',
        endTime: new Date()
      },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或已结束'
      });
    }
    
    // 注意：在实际部署中，可能不需要停止容器，因为多个用户可能共享同一个靶机实例
    // 这里只更新会话状态
    
    res.status(200).json({
      success: true,
      message: '靶机会话已结束',
      session
    });
  } catch (error) {
    console.error('停止靶机会话失败:', error);
    res.status(500).json({
      success: false,
      message: '停止靶机会话失败'
    });
  }
};

/**
 * 获取用户的靶机会话历史
 */
exports.getUserSessions = async (req, res) => {
  const userId = req.user._id;
  const { targetId, status } = req.query;
  
  try {
    const query = { userId };
    
    if (targetId) query.targetId = targetId;
    if (status) query.status = status;
    
    const sessions = await TargetSession.find(query)
      .sort({ startTime: -1 })
      .limit(50);
    
    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('获取用户会话失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户会话失败'
    });
  }
};

/**
 * 提交靶机挑战答案
 */
exports.submitFlag = async (req, res) => {
  const { sessionId, flag } = req.body;
  const userId = req.user._id;
  
  try {
    // 查找会话
    const session = await TargetSession.findOne({
      _id: sessionId,
      userId,
      status: 'active'
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或已结束'
      });
    }
    
    // 验证提交的flag
    const isCorrect = await validateFlag(session.targetId, flag);
    
    if (isCorrect) {
      // 更新会话记录，标记为已完成挑战
      await TargetSession.findByIdAndUpdate(sessionId, {
        isFlagSubmitted: true,
        submittedFlag: flag,
        flagCorrect: true,
        flagSubmitTime: new Date()
      });
      
      // 计算并添加积分奖励
      const points = calculatePointsForTarget(session.targetId);
      
      // 这里应该调用积分系统的API来添加积分
      // 为了简化，我们假设已经有一个全局的addScore函数
      if (req.app.locals.addScore) {
        await req.app.locals.addScore(userId, points, 'target_completion', session.targetId);
      }
      
      res.status(200).json({
        success: true,
        message: '恭喜！FLAG正确',
        pointsAwarded: points
      });
    } else {
      // 记录错误的flag提交
      await TargetSession.findByIdAndUpdate(sessionId, {
        $push: {
          incorrectFlags: {
            flag,
            timestamp: new Date()
          }
        }
      });
      
      res.status(200).json({
        success: false,
        message: 'FLAG不正确，请继续尝试'
      });
    }
  } catch (error) {
    console.error('提交FLAG失败:', error);
    res.status(500).json({
      success: false,
      message: '提交FLAG失败'
    });
  }
};

// 辅助函数：检查容器状态
async function checkContainerStatus(containerName) {
  return new Promise((resolve, reject) => {
    const cmd = spawn('docker', ['ps', '-f', `name=${containerName}`, '--format', '{{.Names}}']);
    
    let output = '';
    
    cmd.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    cmd.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim() === containerName);
      } else {
        resolve(false); // 如果命令失败，假设容器未运行
      }
    });
    
    cmd.on('error', (error) => {
      console.error('检查容器状态时出错:', error);
      resolve(false);
    });
  });
}

// 辅助函数：启动容器
async function startContainer(containerName) {
  return new Promise((resolve, reject) => {
    const cmd = spawn('docker', ['start', containerName]);
    
    let stderr = '';
    
    cmd.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    cmd.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        // 如果启动失败，尝试从docker-compose启动
        console.log(`尝试从docker-compose启动容器: ${containerName}`);
        startFromDockerCompose(containerName)
          .then(resolve)
          .catch(reject);
      }
    });
    
    cmd.on('error', (error) => {
      console.error('启动容器时出错:', error);
      reject(error);
    });
  });
}

// 辅助函数：从docker-compose启动容器
async function startFromDockerCompose(serviceName) {
  return new Promise((resolve, reject) => {
    const cmd = spawn('docker-compose', ['up', '-d', serviceName], {
      cwd: path.resolve(__dirname, '../../..')
    });
    
    let stderr = '';
    
    cmd.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    cmd.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`从docker-compose启动失败: ${stderr}`));
      }
    });
    
    cmd.on('error', (error) => {
      reject(error);
    });
  });
}

// 辅助函数：获取靶机URL
function getTargetUrl(port) {
  // 在实际部署中，应该使用配置的域名或IP
  return `http://localhost:${port}`;
}

// 辅助函数：验证FLAG
async function validateFlag(targetId, submittedFlag) {
  // 预定义的FLAG值
  const validFlags = {
    'web-vuln-basic': [
      'FLAG{INFO_LEAK_VULNERABILITY_FOUND}',
      'FLAG{AUTHENTICATION_BYPASS_EXPLOITED}'
    ],
    'web-vuln-sql': [
      'FLAG{SQL_INJECTION_LOGIN_BYPASS}',
      'FLAG{UNION_BASED_SQL_INJECTION_SUCCESS}',
      'FLAG{SQL_INJECTION_DATABASE_COMPROMISED}'
    ],
    'web-vuln-xss': [
      'FLAG{XSS_VULNERABILITY_EXPLOITED}'
    ],
    'network-vuln-basic': [
      'FLAG{NETWORK_SERVICE_COMPROMISED}'
    ],
    'system-vuln-basic': [
      'FLAG{PRIVILEGE_ESCALATION_SUCCESS}'
    ]
  };
  
  const flagsForTarget = validFlags[targetId] || [];
  return flagsForTarget.includes(submittedFlag);
}

// 辅助函数：根据靶机类型计算积分
function calculatePointsForTarget(targetId) {
  // 根据靶机难度设置不同的积分奖励
  const pointsMap = {
    'web-vuln-basic': 30,
    'web-vuln-sql': 50,
    'web-vuln-xss': 40,
    'network-vuln-basic': 60,
    'system-vuln-basic': 80
  };
  
  return pointsMap[targetId] || 50;
}
