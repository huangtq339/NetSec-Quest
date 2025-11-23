const express = require('express');
const router = express.Router();

// 导入路由模块
const authRoutes = require('./authRoutes');
const skillTreeRoutes = require('./skillTreeRoutes');
const taskRoutes = require('./taskRoutes');
const scoreRoutes = require('./scoreRoutes');

// 健康检查路由
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '服务运行正常'
  });
});

// API 路由前缀
router.use('/auth', authRoutes);
router.use('/skill-tree', skillTreeRoutes);
router.use('/tasks', taskRoutes);
router.use('/scores', scoreRoutes);

module.exports = router;