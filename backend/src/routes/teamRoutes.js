const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/TeamController');
const { authenticateJWT } = require('../middlewares/auth');

// 初始化路由，需要传入数据库连接（支持MySQL或SQLite）
function initializeTeamRoutes(db) {
  const teamController = new TeamController(db);

  // 团队管理相关路由
  router.post('/create', authenticateJWT, (req, res) => teamController.createTeam(req, res));
  router.get('/user', authenticateJWT, (req, res) => teamController.getUserTeams(req, res));
  router.get('/:teamId', authenticateJWT, (req, res) => teamController.getTeamDetails(req, res));
  router.post('/leave/:teamId', authenticateJWT, (req, res) => teamController.leaveTeam(req, res));
  router.post('/transfer-leadership', authenticateJWT, (req, res) => teamController.transferLeadership(req, res));
  router.delete('/:teamId', authenticateJWT, (req, res) => teamController.deleteTeam(req, res));

  // 团队邀请相关路由
  router.post('/invite', authenticateJWT, (req, res) => teamController.sendTeamInvitation(req, res));
  router.get('/invitations', authenticateJWT, (req, res) => teamController.getUserInvitations(req, res));
  router.post('/invitation/handle', authenticateJWT, (req, res) => teamController.handleTeamInvitation(req, res));

  // 竞赛相关路由
  router.post('/competitions/create', authenticateJWT, (req, res) => teamController.createCompetition(req, res));
  router.get('/competitions', authenticateJWT, (req, res) => teamController.getCompetitions(req, res));
  router.post('/competitions/join', authenticateJWT, (req, res) => teamController.joinCompetition(req, res));
  router.get('/competitions/:competitionId/leaderboard', authenticateJWT, (req, res) => teamController.getCompetitionLeaderboard(req, res));
  router.post('/competitions/score', authenticateJWT, (req, res) => teamController.recordTeamScore(req, res));
  router.get('/competitions/:competitionId/teams/:teamId', authenticateJWT, (req, res) => teamController.getTeamCompetitionDetails(req, res));

  return router;
}

module.exports = { initializeTeamRoutes };