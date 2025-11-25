const express = require('express');
const router = express.Router();
const SkillTreeController = require('../controllers/skillTreeController');
const { authenticateJWT, authorizeRole, optionalAuthenticate } = require('../middlewares/auth');

// 创建控制器实例
const skillTreeController = new SkillTreeController();

// 公开的技能树相关路由（可选认证）
router.get('/courses', skillTreeController.getCourses.bind(skillTreeController));
router.get('/tree', optionalAuthenticate, skillTreeController.getSkillTree.bind(skillTreeController));
router.get('/nodes/:nodeId', optionalAuthenticate, skillTreeController.getNodeDetails.bind(skillTreeController));

// 需要认证的路由
router.get('/progress', authenticateJWT, skillTreeController.getUserProgress.bind(skillTreeController));
router.get('/recommended', authenticateJWT, skillTreeController.getRecommendedNodes.bind(skillTreeController));
router.put('/nodes/:nodeId/progress', authenticateJWT, skillTreeController.updateProgress.bind(skillTreeController));

// 管理员专用路由
router.post('/nodes', authenticateJWT, authorizeRole('admin'), skillTreeController.createNode.bind(skillTreeController));
router.put('/nodes/:nodeId', authenticateJWT, authorizeRole('admin'), skillTreeController.updateNode.bind(skillTreeController));
router.delete('/nodes/:nodeId', authenticateJWT, authorizeRole('admin'), skillTreeController.deleteNode.bind(skillTreeController));

module.exports = router;