const mongoose = require('mongoose');

const targetSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // 会话持续时间（秒）
    default: 0
  },
  isFlagSubmitted: {
    type: Boolean,
    default: false
  },
  submittedFlag: {
    type: String
  },
  flagCorrect: {
    type: Boolean,
    default: false
  },
  flagSubmitTime: {
    type: Date
  },
  incorrectFlags: [
    {
      flag: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  actions: [
    {
      type: String,
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  score: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

// 计算会话持续时间
function calculateDuration() {
  if (this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000); // 转换为秒
  }
  return Math.floor((Date.now() - this.startTime) / 1000); // 转换为秒
}

// 设置虚拟字段
targetSessionSchema.virtual('durationSeconds').get(function() {
  return calculateDuration.call(this);
});

// 格式化的持续时间显示
targetSessionSchema.virtual('formattedDuration').get(function() {
  const seconds = calculateDuration.call(this);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟 ${remainingSeconds}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟 ${remainingSeconds}秒`;
  }
  return `${remainingSeconds}秒`;
});

// 添加靶机信息虚拟字段
targetSessionSchema.virtual('targetInfo').get(function() {
  // 这里可以根据targetId返回预定义的靶机信息
  const targetInfo = {
    'web-vuln-basic': {
      name: 'Web安全基础',
      description: '包含信息泄露、文件上传和认证绕过漏洞',
      category: 'web',
      difficulty: 'beginner'
    },
    'web-vuln-sql': {
      name: 'SQL注入靶机',
      description: '包含各种类型的SQL注入漏洞',
      category: 'web',
      difficulty: 'intermediate'
    },
    'web-vuln-xss': {
      name: 'XSS漏洞靶机',
      description: '包含反射型和存储型XSS漏洞',
      category: 'web',
      difficulty: 'intermediate'
    },
    'network-vuln-basic': {
      name: '网络安全基础',
      description: '包含网络服务漏洞',
      category: 'network',
      difficulty: 'intermediate'
    },
    'system-vuln-basic': {
      name: '系统安全靶机',
      description: '包含系统级漏洞和提权挑战',
      category: 'system',
      difficulty: 'advanced'
    }
  };
  
  return targetInfo[this.targetId] || null;
});

// 索引定义以提高查询性能
targetSessionSchema.index({ userId: 1, targetId: 1, status: 1 });
targetSessionSchema.index({ status: 1, startTime: -1 });

// 预保存钩子 - 计算最终持续时间
targetSessionSchema.pre('save', function(next) {
  if (this.isModified('endTime') && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// 静态方法 - 查找用户的所有活跃会话
targetSessionSchema.statics.findActiveSessions = async function(userId) {
  return this.find({ userId, status: 'active' });
};

// 静态方法 - 获取用户在某个靶机上的最佳成绩
targetSessionSchema.statics.getBestScoreForTarget = async function(userId, targetId) {
  return this.findOne({ userId, targetId, flagCorrect: true })
    .sort({ score: -1 });
};

// 静态方法 - 获取用户已完成靶机的统计信息
targetSessionSchema.statics.getCompletedTargetsStats = async function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: 'completed',
        flagCorrect: true
      }
    },
    {
      $group: {
        _id: '$targetId',
        totalSessions: { $sum: 1 },
        bestScore: { $max: '$score' },
        firstCompleted: { $min: '$endTime' },
        lastCompleted: { $max: '$endTime' }
      }
    },
    {
      $sort: { firstCompleted: 1 }
    }
  ]);
};

module.exports = mongoose.model('TargetSession', targetSessionSchema);
