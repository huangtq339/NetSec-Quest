const express = require('express');
const router = express.Router();
const { authenticateJWT: auth } = require('../middlewares/auth');
const targetController = require('../controllers/targetController');

// 靶机相关路由
router.use(auth); // 所有靶机操作都需要认证

/**
 * @swagger
 * /api/targets:      *   get:      *     summary: 获取所有可用靶机列表      *     tags: [Targets]      *     security:      *       - BearerAuth: []      *     responses:      *       200:      *         description: 成功获取靶机列表      *         content:      *           application/json:      *             schema:      *               type: object      *               properties:      *                 success:      *                   type: boolean      *                 targets:      *                   type: array      *                   items:      *                     type: object      *                     properties:      *                       id:      *                         type: string      *                       containerName:      *                         type: string      *                       port:      *                         type: number      *                       description:      *                         type: string      *                       category:      *                         type: string      */
router.get('/', targetController.getAvailableTargets);

/**
 * @swagger
 * /api/targets/sessions:      *   post:      *     summary: 启动新的靶机会话      *     tags: [Targets]      *     security:      *       - BearerAuth: []      *     requestBody:      *       required: true      *       content:      *         application/json:      *           schema:      *             type: object      *             properties:      *               targetId:      *                 type: string      *                 required: true      *     responses:      *       200:      *         description: 成功启动靶机会话      *         content:      *           application/json:      *             schema:      *               type: object      *               properties:      *                 success:      *                   type: boolean      *                 session:      *                   type: object      *                 targetUrl:      *                   type: string      */
router.post('/sessions', targetController.startTargetSession);

/**
 * @swagger
 * /api/targets/sessions/{sessionId}:      *   put:      *     summary: 停止靶机会话      *     tags: [Targets]      *     security:      *       - BearerAuth: []      *     parameters:      *       - in: path      *         name: sessionId      *         required: true      *         schema:      *           type: string      *     responses:      *       200:      *         description: 成功停止靶机会话      */
router.put('/sessions/:sessionId', targetController.stopTargetSession);

/**
 * @swagger
 * /api/targets/sessions:      *   get:      *     summary: 获取用户的靶机会话历史      *     tags: [Targets]      *     security:      *       - BearerAuth: []      *     parameters:      *       - in: query      *         name: targetId      *         schema:      *           type: string      *       - in: query      *         name: status      *         schema:      *           type: string      *           enum: [active, completed, expired]      *     responses:      *       200:      *         description: 成功获取会话历史      *         content:      *           application/json:      *             schema:      *               type: object      *               properties:      *                 success:      *                   type: boolean      *                 sessions:      *                   type: array      *                   items:      *                     type: object      */
router.get('/sessions', targetController.getUserSessions);

/**
 * @swagger
 * /api/targets/flag:      *   post:      *     summary: 提交靶机挑战答案(FLAG)      *     tags: [Targets]      *     security:      *       - BearerAuth: []      *     requestBody:      *       required: true      *       content:      *         application/json:      *           schema:      *             type: object      *             properties:      *               sessionId:      *                 type: string      *                 required: true      *               flag:      *                 type: string      *                 required: true      *     responses:      *       200:      *         description: 提交成功      *         content:      *           application/json:      *             schema:      *               type: object      *               properties:      *                 success:      *                   type: boolean      *                 message:      *                   type: string      *                 pointsAwarded:      *                   type: number      *                   nullable: true      */
router.post('/flag', targetController.submitFlag);

module.exports = router;
