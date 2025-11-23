const express = require('express');
const router = express.Router();
const ScoreController = require('../controllers/scoreController');
const { authenticateJWT: authMiddleware } = require('../middlewares/auth');

// 积分相关路由
router.post('/add', authMiddleware, ScoreController.addScore); // 添加积分
router.get('/user/:userId', authMiddleware, ScoreController.getUserScore); // 获取用户积分信息

// 排行榜相关路由
router.get('/leaderboard/:type', ScoreController.getLeaderboard); // 获取排行榜（支持公开访问）

// 成就相关路由
router.get('/achievements', ScoreController.getAchievements); // 获取成就列表（支持公开访问）
router.get('/badges', ScoreController.getBadges); // 获取徽章列表（支持公开访问）

module.exports = router;
