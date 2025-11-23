const TeamModel = require('../models/TeamModel');

class TeamController {
  constructor(mysqlPool) {
    this.teamModel = new TeamModel(mysqlPool);
    // 初始化团队相关表
    this.teamModel.initializeTables().catch(err => {
      console.error('Failed to initialize team tables:', err);
    });
  }

  // 创建团队
  async createTeam(req, res) {
    try {
      const { name, description } = req.body;
      const userId = req.user.id; // 从认证中间件获取
      
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Team name is required'
          }
        });
      }
      
      const result = await this.teamModel.createTeam({
        name: name.trim(),
        description: description || '',
        creatorId: userId
      });
      
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Team created successfully'
      });
    } catch (error) {
      // 处理重复名称错误
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: {
            code: 409,
            message: 'Team with this name already exists'
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to create team',
          details: error.message
        }
      });
    }
  }

  // 获取团队详情
  async getTeamDetails(req, res) {
    try {
      const { teamId } = req.params;
      
      const team = await this.teamModel.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: 'Team not found'
          }
        });
      }
      
      // 获取团队成员
      const members = await this.teamModel.getTeamMembers(teamId);
      
      return res.status(200).json({
        success: true,
        data: {
          ...team,
          members
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get team details',
          details: error.message
        }
      });
    }
  }

  // 获取用户的团队列表
  async getUserTeams(req, res) {
    try {
      const userId = req.user.id;
      
      const teams = await this.teamModel.getUserTeams(userId);
      
      return res.status(200).json({
        success: true,
        data: teams
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get user teams',
          details: error.message
        }
      });
    }
  }

  // 发送团队邀请
  async sendTeamInvitation(req, res) {
    try {
      const { teamId, receiverId } = req.body;
      const senderId = req.user.id;
      
      if (!teamId || !receiverId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Team ID and receiver ID are required'
          }
        });
      }
      
      // 不能邀请自己
      if (senderId === receiverId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Cannot invite yourself'
          }
        });
      }
      
      const result = await this.teamModel.inviteToTeam(teamId, senderId, receiverId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Invitation sent successfully'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Only team members can send invitations') {
        statusCode = 403;
      } else if (error.message === 'User is already a team member') {
        statusCode = 400;
      } else if (error.message === 'Invitation already sent') {
        statusCode = 409;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode,
          message: error.message
        }
      });
    }
  }

  // 获取用户收到的邀请
  async getUserInvitations(req, res) {
    try {
      const userId = req.user.id;
      
      const invitations = await this.teamModel.getUserInvitations(userId);
      
      return res.status(200).json({
        success: true,
        data: invitations
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get user invitations',
          details: error.message
        }
      });
    }
  }

  // 处理团队邀请
  async handleTeamInvitation(req, res) {
    try {
      const { invitationId, action } = req.body;
      const userId = req.user.id;
      
      if (!invitationId || !action || !['accepted', 'rejected'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Invalid invitation ID or action'
          }
        });
      }
      
      const result = await this.teamModel.handleInvitation(invitationId, userId, action);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: action === 'accepted' ? 'Invitation accepted' : 'Invitation rejected'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Invalid or expired invitation') {
        statusCode = 404;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode,
          message: error.message
        }
      });
    }
  }

  // 创建竞赛
  async createCompetition(req, res) {
    try {
      const { name, description, startTime, endTime } = req.body;
      
      if (!name || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Name, start time, and end time are required'
          }
        });
      }
      
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Invalid date format'
          }
        });
      }
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'End time must be after start time'
          }
        });
      }
      
      const result = await this.teamModel.createCompetition({
        name: name.trim(),
        description: description || '',
        startTime: start,
        endTime: end
      });
      
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Competition created successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to create competition',
          details: error.message
        }
      });
    }
  }

  // 获取竞赛列表
  async getCompetitions(req, res) {
    try {
      const { status } = req.query;
      
      const validStatuses = ['upcoming', 'active', 'finished'];
      const filterStatus = status && validStatuses.includes(status) ? status : null;
      
      const competitions = await this.teamModel.getCompetitions(filterStatus);
      
      return res.status(200).json({
        success: true,
        data: competitions
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get competitions',
          details: error.message
        }
      });
    }
  }

  // 团队加入竞赛
  async joinCompetition(req, res) {
    try {
      const { competitionId, teamId } = req.body;
      const userId = req.user.id;
      
      if (!competitionId || !teamId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Competition ID and team ID are required'
          }
        });
      }
      
      const result = await this.teamModel.joinCompetition(competitionId, teamId, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Team joined competition successfully'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Only team leader can join competitions') {
        statusCode = 403;
      } else if (error.message === 'Team already joined this competition') {
        statusCode = 409;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode,
          message: error.message
        }
      });
    }
  }

  // 记录团队得分
  async recordTeamScore(req, res) {
    try {
      const { competitionId, teamId, targetId, points } = req.body;
      const userId = req.user.id;
      
      if (!competitionId || !teamId || !targetId || !points) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'All fields are required'
          }
        });
      }
      
      if (typeof points !== 'number' || points <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Points must be a positive number'
          }
        });
      }
      
      const result = await this.teamModel.recordTeamScore(
        competitionId,
        teamId,
        userId,
        targetId,
        points
      );
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Team score recorded successfully'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'User is not a member of this team') {
        statusCode = 403;
      } else if (error.message === 'Team is not participating in this competition') {
        statusCode = 400;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode,
          message: error.message
        }
      });
    }
  }

  // 获取竞赛排行榜
  async getCompetitionLeaderboard(req, res) {
    try {
      const { competitionId } = req.params;
      
      const leaderboard = await this.teamModel.getCompetitionLeaderboard(competitionId);
      
      return res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get competition leaderboard',
          details: error.message
        }
      });
    }
  }

  // 获取团队竞赛详情
  async getTeamCompetitionDetails(req, res) {
    try {
      const { competitionId, teamId } = req.params;
      
      const details = await this.teamModel.getTeamCompetitionDetails(competitionId, teamId);
      
      if (!details.teamInfo) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: 'Team not found in this competition'
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get team competition details',
          details: error.message
        }
      });
    }
  }

  // 离开团队
  async leaveTeam(req, res) {
    try {
      const { teamId } = req.params;
      const userId = req.user.id;
      
      const result = await this.teamModel.leaveTeam(teamId, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Successfully left the team'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Not a team member') {
        statusCode = 404;
      } else if (error.message === 'Team leader cannot leave. Please transfer leadership first.') {
        statusCode = 403;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode,
          message: error.message
        }
      });
    }
  }

  // 转让团队领导权限
  async transferLeadership(req, res) {
    try {
      const { teamId, newLeaderId } = req.body;
      const currentLeaderId = req.user.id;
      
      if (!teamId || !newLeaderId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Team ID and new leader ID are required'
          }
        });
      }
      
      const result = await this.teamModel.transferLeadership(teamId, currentLeaderId, newLeaderId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Leadership transferred successfully'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Only team leader can transfer leadership') {
        statusCode = 403;
      } else if (error.message === 'New leader must be a team member') {
        statusCode = 400;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode,
          message: error.message
        }
      });
    }
  }

  // 解散团队
  async deleteTeam(req, res) {
    try {
      const { teamId } = req.params;
      const userId = req.user.id;
      
      const result = await this.teamModel.deleteTeam(teamId, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Team deleted successfully'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Only team leader can delete the team') {
        statusCode = 403;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode,
          message: error.message
        }
      });
    }
  }
}

module.exports = TeamController;