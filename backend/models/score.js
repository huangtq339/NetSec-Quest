const mongoose = require('mongoose');

// 用户积分模型
const ScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalScore: {
    type: Number,
    default: 0
  },
  achievements: [{
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  badges: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dailyStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 成就模型
const AchievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  conditionType: {
    type: String,
    required: true,
    enum: ['tasks_completed', 'total_score', 'streak', 'specific_skill', 'time_based']
  },
  conditionValue: {
    type: Number,
    required: true
  },
  pointsReward: {
    type: Number,
    default: 0
  }
});

// 徽章模型
const BadgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'rare', 'epic', 'legendary']
  },
  requirement: {
    type: String
  },
  pointsReward: {
    type: Number,
    default: 0
  }
});

// 排行榜模型（用于缓存排行榜数据，提高查询性能）
const LeaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'all_time']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  rankings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String
    },
    score: {
      type: Number
    },
    rank: {
      type: Number
    }
  }]
});

const Score = mongoose.model('Score', ScoreSchema);
const Achievement = mongoose.model('Achievement', AchievementSchema);
const Badge = mongoose.model('Badge', BadgeSchema);
const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);

module.exports = { Score, Achievement, Badge, Leaderboard };
