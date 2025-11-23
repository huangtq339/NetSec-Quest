const express = require('express');
const router = express.Router();
const SkillTreeController = require('../controllers/skillTreeController');
const { authenticateJWT, authorizeRole, optionalAuthenticate } = require('../middlewares/auth');

// 公开的技能树相关路由（可选认证）
router.get('/courses', SkillTreeController.getCourses);
router.get('/tree', optionalAuthenticate, SkillTreeController.getSkillTree);
router.get('/nodes/:nodeId', optionalAuthenticate, SkillTreeController.getSkillNode);

// 需要认证的路由
router.get('/progress', authenticateJWT, SkillTreeController.getUserProgress);
router.get('/recommended', authenticateJWT, SkillTreeController.getRecommendedNodes);
router.put('/nodes/:nodeId/progress', authenticateJWT, SkillTreeController.updateProgress);

// 管理员专用路由
router.post('/nodes', authenticateJWT, authorizeRole('admin'), SkillTreeController.createSkillNode);
router.put('/nodes/:nodeId', authenticateJWT, authorizeRole('admin'), SkillTreeController.updateSkillNode);
router.delete('/nodes/:nodeId', authenticateJWT, authorizeRole('admin'), SkillTreeController.deleteSkillNode);

module.exports = router;