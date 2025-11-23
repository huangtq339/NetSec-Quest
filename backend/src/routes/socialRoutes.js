const express = require('express');
const router = express.Router();
const SocialController = require('../controllers/SocialController');
const { authenticateJWT } = require('../middlewares/auth');

// 初始化路由，需要传入数据库连接（支持MySQL或SQLite）
function initializeSocialRoutes(db) {
  const socialController = new SocialController(db);

  // 关注相关路由
  router.post('/follow', authenticateJWT, (req, res) => socialController.followUser(req, res));
  router.delete('/follow/:followingId', authenticateJWT, (req, res) => socialController.unfollowUser(req, res));
  router.get('/followers/:userId', authenticateJWT, (req, res) => socialController.getFollowers(req, res));
  router.get('/following/:userId', authenticateJWT, (req, res) => socialController.getFollowing(req, res));
  router.get('/is-following/:followingId', authenticateJWT, (req, res) => socialController.isFollowing(req, res));

  // 消息相关路由
  router.post('/messages', authenticateJWT, (req, res) => socialController.sendMessage(req, res));
  router.get('/messages/:otherUserId', authenticateJWT, (req, res) => socialController.getMessages(req, res));
  router.get('/conversations', authenticateJWT, (req, res) => socialController.getConversations(req, res));
  router.get('/messages/unread/count', authenticateJWT, (req, res) => socialController.getUnreadMessageCount(req, res));
  router.put('/messages/:messageId/read', authenticateJWT, (req, res) => socialController.markMessageAsRead(req, res));
  router.delete('/messages/:messageId', authenticateJWT, (req, res) => socialController.deleteMessage(req, res));

  // 活动相关路由
  router.post('/activities', authenticateJWT, (req, res) => socialController.recordActivity(req, res));
  router.get('/activities/:userId', authenticateJWT, (req, res) => socialController.getUserActivities(req, res));
  router.get('/feed', authenticateJWT, (req, res) => socialController.getFeedActivities(req, res));

  return router;
}

module.exports = { initializeSocialRoutes };