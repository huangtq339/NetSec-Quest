const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateJWT } = require('../middlewares/auth');

// 认证相关路由
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authenticateJWT, AuthController.logout);

// 用户信息相关路由
router.get('/me', authenticateJWT, AuthController.getCurrentUser);
router.put('/me', authenticateJWT, AuthController.updateUser);
router.put('/password', authenticateJWT, AuthController.changePassword);

module.exports = router;