const { Score, Achievement, Badge, Leaderboard } = require('../models/score');
const User = require('../models/user');

// 添加积分
exports.addScore = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    
    // 查找或创建用户积分记录
    let scoreRecord = await Score.findOne({ userId });
    if (!scoreRecord) {
      scoreRecord = new Score({ userId });
    }
    
    // 更新积分
    scoreRecord.totalScore += points;
    scoreRecord.lastActiveDate = new Date();
    
    // 更新每日连续登录/活动
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(scoreRecord.lastActiveDate);
    lastDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    if (dayDiff === 1) {
      // 连续登录
      scoreRecord.dailyStreak += 1;
    } else if (dayDiff > 1) {
      // 中断了连续登录
      scoreRecord.dailyStreak = 1;
    }
    
    // 检查是否解锁新成就
    const updatedAchievements = await checkAchievements(scoreRecord);
    if (updatedAchievements.unlocked) {
      scoreRecord.achievements.push(...updatedAchievements.newAchievements);
    }
    
    await scoreRecord.save();
    
    // 更新排行榜缓存
    await updateLeaderboards(userId, scoreRecord.totalScore);
    
    // 获取用户信息
    const user = await User.findById(userId).select('username avatar');
    
    return res.status(200).json({
      success: true,
      score: scoreRecord,
      user: user,
      unlockedAchievements: updatedAchievements.newAchievements
    });
  } catch (error) {
    console.error('Error adding score:', error);
    return res.status(500).json({ success: false, message: '添加积分失败', error: error.message });
  }
};

// 获取用户积分信息
exports.getUserScore = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const scoreRecord = await Score.findOne({ userId })
      .populate('achievements.achievementId', 'name description icon')
      .populate('badges.badgeId', 'name description image rarity');
    
    if (!scoreRecord) {
      return res.status(404).json({ success: false, message: '用户积分记录不存在' });
    }
    
    return res.status(200).json({ success: true, score: scoreRecord });
  } catch (error) {
    console.error('Error getting user score:', error);
    return res.status(500).json({ success: false, message: '获取用户积分失败', error: error.message });
  }
};

// 获取排行榜
exports.getLeaderboard = async (req, res) => {
  try {
    const { type } = req.params; // 'daily', 'weekly', 'monthly', 'all_time'
    
    // 获取排行榜缓存
    let leaderboard = await Leaderboard.findOne({ type }).sort({ updatedAt: -1 });
    
    // 如果缓存不存在或已过期（超过1小时），重新生成
    const now = new Date();
    if (!leaderboard || (now - leaderboard.updatedAt) > 3600000) {
      await generateLeaderboard(type);
      leaderboard = await Leaderboard.findOne({ type }).sort({ updatedAt: -1 });
    }
    
    // 获取用户在排行榜中的位置（如果已登录）
    let userRank = null;
    if (req.user) {
      userRank = leaderboard.rankings.find(r => r.userId.toString() === req.user._id.toString());
    }
    
    return res.status(200).json({
      success: true,
      leaderboard: {
        type: leaderboard.type,
        updatedAt: leaderboard.updatedAt,
        rankings: leaderboard.rankings.slice(0, 100) // 最多返回100名
      },
      userRank
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({ success: false, message: '获取排行榜失败', error: error.message });
  }
};

// 生成排行榜
async function generateLeaderboard(type) {
  const now = new Date();
  let startDate = null;
  
  switch (type) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all_time':
      // 不设置开始时间，获取所有记录
      break;
  }
  
  // 构建查询
  let query = {};
  if (startDate) {
    query.lastActiveDate = { $gte: startDate };
  }
  
  // 获取用户积分数据
  const scores = await Score.find(query)
    .sort({ totalScore: -1 })
    .limit(100);
  
  // 填充用户信息
  const rankings = [];
  for (let i = 0; i < scores.length; i++) {
    const user = await User.findById(scores[i].userId).select('username avatar');
    if (user) {
      rankings.push({
        userId: scores[i].userId,
        username: user.username,
        avatar: user.avatar,
        score: scores[i].totalScore,
        rank: i + 1
      });
    }
  }
  
  // 更新排行榜缓存
  const leaderboard = new Leaderboard({
    type,
    rankings
  });
  
  await leaderboard.save();
  
  // 清理旧的排行榜数据（只保留最近10条）
  const oldLeaderboards = await Leaderboard.find({ type })
    .sort({ updatedAt: -1 })
    .skip(10);
  
  if (oldLeaderboards.length > 0) {
    await Leaderboard.deleteMany({ _id: { $in: oldLeaderboards.map(lb => lb._id) } });
  }
}

// 更新排行榜缓存
async function updateLeaderboards(userId, score) {
  // 异步更新所有类型的排行榜
  const types = ['daily', 'weekly', 'monthly', 'all_time'];
  const user = await User.findById(userId).select('username avatar');
  
  // 为每种类型的排行榜更新用户的排名
  for (const type of types) {
    const leaderboard = await Leaderboard.findOne({ type }).sort({ updatedAt: -1 });
    if (leaderboard) {
      const userIndex = leaderboard.rankings.findIndex(r => r.userId.toString() === userId);
      
      if (userIndex >= 0) {
        // 更新现有排名
        leaderboard.rankings[userIndex].score = score;
      } else {
        // 添加新排名
        leaderboard.rankings.push({
          userId,
          username: user.username,
          avatar: user.avatar,
          score,
          rank: leaderboard.rankings.length + 1
        });
      }
      
      // 重新排序
      leaderboard.rankings.sort((a, b) => b.score - a.score);
      // 更新排名数字
      leaderboard.rankings.forEach((r, i) => r.rank = i + 1);
      
      await leaderboard.save();
    }
  }
}

// 检查是否解锁新成就
async function checkAchievements(scoreRecord) {
  const unlockedAchievements = [];
  const existingAchievementIds = scoreRecord.achievements.map(a => a.achievementId.toString());
  
  // 获取所有可能解锁的成就
  const allAchievements = await Achievement.find();
  
  for (const achievement of allAchievements) {
    // 如果已经解锁，则跳过
    if (existingAchievementIds.includes(achievement._id.toString())) {
      continue;
    }
    
    let isUnlocked = false;
    
    // 根据成就类型检查条件
    switch (achievement.conditionType) {
      case 'total_score':
        isUnlocked = scoreRecord.totalScore >= achievement.conditionValue;
        break;
      case 'streak':
        isUnlocked = scoreRecord.dailyStreak >= achievement.conditionValue;
        break;
      // 其他类型的条件检查可以在这里添加
    }
    
    if (isUnlocked) {
      unlockedAchievements.push({
        achievementId: achievement._id,
        unlockedAt: new Date()
      });
    }
  }
  
  return {
    unlocked: unlockedAchievements.length > 0,
    newAchievements: unlockedAchievements
  };
}

// 获取成就列表
exports.getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find();
    return res.status(200).json({ success: true, achievements });
  } catch (error) {
    console.error('Error getting achievements:', error);
    return res.status(500).json({ success: false, message: '获取成就列表失败', error: error.message });
  }
};

// 获取徽章列表
exports.getBadges = async (req, res) => {
  try {
    const badges = await Badge.find();
    return res.status(200).json({ success: true, badges });
  } catch (error) {
    console.error('Error getting badges:', error);
    return res.status(500).json({ success: false, message: '获取徽章列表失败', error: error.message });
  }
};
