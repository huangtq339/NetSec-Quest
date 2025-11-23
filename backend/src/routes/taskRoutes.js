const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticateJWT, authorizeRole, optionalAuthenticate } = require('../middlewares/auth');

// 公开的任务相关路由（可选认证）
router.get('/', optionalAuthenticate, TaskController.getTasks);
router.get('/:taskId', optionalAuthenticate, TaskController.getTaskDetail);
router.get('/:taskId/statistics', TaskController.getTaskStatistics);

// 需要认证的路由
router.post('/:taskId/submit', authenticateJWT, TaskController.submitTask);
router.get('/history', authenticateJWT, TaskController.getUserTaskHistory);
router.get('/completed', authenticateJWT, TaskController.getCompletedTasks);

// 管理员专用路由
router.post('/', authenticateJWT, authorizeRole('admin'), TaskController.createTask);
router.put('/:taskId', authenticateJWT, authorizeRole('admin'), TaskController.updateTask);
router.delete('/:taskId', authenticateJWT, authorizeRole('admin'), TaskController.deleteTask);
router.put('/submissions/:submissionId/grade', authenticateJWT, authorizeRole('admin'), TaskController.gradeTask);

module.exports = router;