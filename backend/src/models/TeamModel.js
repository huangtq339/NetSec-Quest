class TeamModel {
  constructor() {
    this.db = null;
  }

  // 获取数据库连接
  async getConnection() {
    if (!this.db) {
      this.db = require('../utils/database').getMySQLPool();
    }
    return this.db;
  }

  // 初始化团队相关表
  async initializeTables() {
    try {
      console.log('开始初始化团队相关表，使用MySQL数据库');
      
      // 使用MySQL的统一执行方法
      const executeQuery = async (sql) => {
        try {
          const db = await this.getConnection();
          return await db.execute(sql);
        } catch (error) {
          console.error('执行SQL失败:', error.message);
          throw error;
        }
      };

      // 创建团队表（兼容SQLite语法）
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL UNIQUE,
          description VARCHAR(5000),
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 创建团队成员表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS team_members (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          team_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role VARCHAR(50) DEFAULT 'member',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(team_id, user_id)
        );
      `);

      // 创建竞赛表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS competitions (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          description VARCHAR(5000),
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          status VARCHAR(20) DEFAULT 'upcoming',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 创建团队竞赛参与表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS competition_teams (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          competition_id INTEGER NOT NULL,
          team_id INTEGER NOT NULL,
          score INTEGER DEFAULT 0,
          \`rank\` INTEGER DEFAULT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(competition_id, team_id)
        );
      `);

      // 创建团队得分记录表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS team_scores (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          competition_id INTEGER NOT NULL,
          team_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          target_id VARCHAR(100) NOT NULL,
          points INTEGER NOT NULL,
          earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 创建团队邀请表
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS team_invitations (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          team_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          UNIQUE(team_id, receiver_id, status)
        );
      `);

      console.log('Team tables initialized successfully');
    } catch (error) {
      console.error('Error initializing team tables:', error);
      throw error;
    }
  }

  // 通用查询执行方法
  async executeQuery(sql, params = []) {
    try {
      const db = await this.getConnection();
      return await db.execute(sql, params);
    } catch (error) {
      console.error('SQL执行错误:', error.message);
      throw error;
    }
  }

  // 通用事务处理方法
  async withTransaction(callback) {
    // 仅使用MySQL事务处理
        const db = await this.getConnection();
        const connection = await db.getConnection();
      await connection.beginTransaction();
      try {
        const result = await callback(connection);
        await connection.commit();
        connection.release();
        return result;
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
  }

  // 创建新团队
  async createTeam(teamData) {
    try {
      const { name, description, creatorId } = teamData;
      
      const result = await this.withTransaction(async (conn) => {
        // 创建团队
        const insertResult = await this.executeQuery(
          'INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)',
          [name, description, creatorId]
        );
        
        const teamId = insertResult[0].insertId;
        
        // 添加创建者为团队领导
        await this.executeQuery(
          'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
          [teamId, creatorId, 'leader']
        );
        
        return { teamId, name, description, createdBy: creatorId };
      });
      
      return result;
    } catch (error) {
      console.error('创建团队失败:', error);
      throw error;
    }
  }

  // 获取团队信息
  async getTeamById(teamId) {
    try {
      const rows = await this.executeQuery(
        'SELECT t.*, u.username as creator_name FROM teams t JOIN users u ON t.created_by = u.id WHERE t.id = ?',
        [teamId]
      );
      
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('获取团队信息失败:', error);
      throw error;
    }
  }

  // 获取用户所在的团队列表
  async getUserTeams(userId) {
    try {
      const rows = await this.executeQuery(
        `SELECT t.id, t.name, t.description, t.created_at, tm.role, u.username as creator_name
         FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         JOIN users u ON t.created_by = u.id
         WHERE tm.user_id = ?`,
        [userId]
      );
      
      return rows || [];
    } catch (error) {
      console.error('获取用户团队列表失败:', error);
      throw error;
    }
  }

  // 获取团队成员列表
  async getTeamMembers(teamId) {
    try {
      const rows = await this.executeQuery(
        `SELECT u.id, u.username, u.email, u.points, u.level, tm.role, tm.joined_at
         FROM team_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = ?`,
        [teamId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  }

  // 邀请用户加入团队
  async inviteToTeam(teamId, senderId, receiverId) {
    try {
      // 检查邀请者是否是团队成员
      const inviterMembership = await this.executeQuery(
        'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, senderId]
      );
      
      if (!inviterMembership || inviterMembership.length === 0) {
        throw new Error('Only team members can send invitations');
      }
      
      // 检查是否已经是团队成员
      const existingMember = await this.executeQuery(
        'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, receiverId]
      );
      
      if (existingMember && existingMember.length > 0) {
        throw new Error('User is already a team member');
      }
      
      // 检查是否有待处理的邀请
      const existingInvitation = await this.executeQuery(
        'SELECT id FROM team_invitations WHERE team_id = ? AND receiver_id = ? AND status = ?',
        [teamId, receiverId, 'pending']
      );
      
      if (existingInvitation && existingInvitation.length > 0) {
        throw new Error('Invitation already sent');
      }
      
      // 创建邀请
      const result = await this.executeQuery(
        'INSERT INTO team_invitations (team_id, sender_id, receiver_id) VALUES (?, ?, ?)',
        [teamId, senderId, receiverId]
      );
      
      return { invitationId: this.isSQLite ? result[0].insertId : result[0].insertId };
    } catch (error) {
      console.error('邀请用户加入团队失败:', error);
      throw error;
    }
  }

  // 处理团队邀请
  async handleInvitation(invitationId, userId, action) {
    try {
      // 验证邀请是否存在且属于该用户
      const invitation = await this.executeQuery(
        'SELECT * FROM team_invitations WHERE id = ? AND receiver_id = ? AND status = ?',
        [invitationId, userId, 'pending']
      );
      
      if (!invitation || invitation.length === 0) {
        throw new Error('Invalid or expired invitation');
      }
      
      const { team_id, sender_id } = invitation[0];
      
      // 使用事务处理
      const result = await this.withTransaction(async () => {
        // 更新邀请状态
        await this.executeQuery(
          'UPDATE team_invitations SET status = ? WHERE id = ?',
          [action, invitationId]
        );
        
        // 如果接受邀请，添加为团队成员
        if (action === 'accepted') {
          await this.executeQuery(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [team_id, userId, 'member']
          );
        }
        
        return { success: true, action };
      });
      
      return result;
    } catch (error) {
      console.error('处理邀请失败:', error);
      throw error;
    }
  }

  // 获取用户收到的邀请
  async getUserInvitations(userId) {
    try {
      const rows = await this.executeQuery(
        `SELECT ti.id, ti.team_id, ti.sender_id, ti.status, ti.created_at, ti.expires_at,
         t.name as team_name, u.username as sender_name
         FROM team_invitations ti
         JOIN teams t ON ti.team_id = t.id
         JOIN users u ON ti.sender_id = u.id
         WHERE ti.receiver_id = ? AND ti.status = ?`,
        [userId, 'pending']
      );
      
      return rows || [];
    } catch (error) {
      console.error('获取用户邀请失败:', error);
      throw error;
    }
  }

  // 创建竞赛
  async createCompetition(competitionData) {
    try {
      const { name, description, startTime, endTime } = competitionData;
      
      const result = await this.executeQuery(
        'INSERT INTO competitions (name, description, start_time, end_time) VALUES (?, ?, ?, ?)',
        [name, description, startTime, endTime]
      );
      
      return { 
        competitionId: this.isSQLite ? result[0].insertId : result[0].insertId, 
        name, 
        description, 
        startTime, 
        endTime 
      };
    } catch (error) {
      console.error('创建竞赛失败:', error);
      throw error;
    }
  }

  // 获取竞赛列表
  async getCompetitions(status = null) {
    try {
      let query = 'SELECT * FROM competitions';
      const params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const rows = await this.executeQuery(query, params);
      
      return rows || [];
    } catch (error) {
      console.error('获取竞赛列表失败:', error);
      throw error;
    }
  }

  // 团队加入竞赛
  async joinCompetition(competitionId, teamId, userId) {
    try {
      // 验证用户是否是团队领导
      const membership = await this.executeQuery(
        'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, userId]
      );
      
      if (!membership || membership.length === 0 || membership[0].role !== 'leader') {
        throw new Error('Only team leader can join competitions');
      }
      
      // 检查是否已经加入
      const existingEntry = await this.executeQuery(
        'SELECT id FROM competition_teams WHERE competition_id = ? AND team_id = ?',
        [competitionId, teamId]
      );
      
      if (existingEntry && existingEntry.length > 0) {
        throw new Error('Team already joined this competition');
      }
      
      // 添加到竞赛
      const result = await this.executeQuery(
        'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
        [competitionId, teamId]
      );
      
      return { entryId: this.isSQLite ? result[0].insertId : result[0].insertId };
    } catch (error) {
      console.error('加入竞赛失败:', error);
      throw error;
    }
  }

  // 记录团队得分
  async recordTeamScore(competitionId, teamId, userId, targetId, points) {
    try {
      // 验证用户是否是团队成员
      const membership = await this.executeQuery(
        'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, userId]
      );
      
      if (!membership || membership.length === 0) {
        throw new Error('User is not a member of this team');
      }
      
      // 验证团队是否参加了该竞赛
      const competitionEntry = await this.executeQuery(
        'SELECT id FROM competition_teams WHERE competition_id = ? AND team_id = ?',
        [competitionId, teamId]
      );
      
      if (!competitionEntry || competitionEntry.length === 0) {
        throw new Error('Team is not participating in this competition');
      }
      
      // 使用事务处理
      const result = await this.withTransaction(async () => {
        // 记录得分
        await this.executeQuery(
          'INSERT INTO team_scores (competition_id, team_id, user_id, target_id, points) VALUES (?, ?, ?, ?, ?)',
          [competitionId, teamId, userId, targetId, points]
        );
        
        // 更新团队总得分
        await this.executeQuery(
          `UPDATE competition_teams 
           SET score = score + ? 
           WHERE competition_id = ? AND team_id = ?`,
          [points, competitionId, teamId]
        );
        
        return { success: true };
      });
      
      return result;
    } catch (error) {
      console.error('记录团队得分失败:', error);
      throw error;
    }
  }

  // 获取竞赛排行榜
  async getCompetitionLeaderboard(competitionId) {
    try {
      const rows = await this.executeQuery(
        `SELECT ct.team_id, t.name as team_name, COUNT(DISTINCT tm.user_id) as member_count,
         ct.score, 
         (SELECT COUNT(*) FROM competition_teams WHERE competition_id = ? AND score > ct.score) + 1 as rank
         FROM competition_teams ct
         JOIN teams t ON ct.team_id = t.id
         JOIN team_members tm ON t.id = tm.team_id
         WHERE ct.competition_id = ?
         GROUP BY ct.team_id, ct.score, t.name
         ORDER BY ct.score DESC`,
        [competitionId, competitionId]
      );
      
      return rows || [];
    } catch (error) {
      console.error('获取竞赛排行榜失败:', error);
      throw error;
    }
  }

  // 获取团队在竞赛中的详细得分记录
  async getTeamCompetitionDetails(competitionId, teamId) {
    try {
      const teamInfo = await this.executeQuery(
        `SELECT t.name as team_name, ct.score, 
         (SELECT COUNT(*) FROM competition_teams WHERE competition_id = ? AND score > ct.score) + 1 as rank
         FROM teams t
         JOIN competition_teams ct ON t.id = ct.team_id
         WHERE ct.competition_id = ? AND t.id = ?`,
        [competitionId, competitionId, teamId]
      );
      
      const scores = await this.executeQuery(
        `SELECT ts.user_id, u.username, ts.target_id, ts.points, ts.earned_at
         FROM team_scores ts
         JOIN users u ON ts.user_id = u.id
         WHERE ts.competition_id = ? AND ts.team_id = ?
         ORDER BY ts.earned_at DESC`,
        [competitionId, teamId]
      );
      
      return {
        teamInfo: teamInfo && teamInfo.length > 0 ? teamInfo[0] : null,
        scoreHistory: scores || []
      };
    } catch (error) {
      console.error('Error getting team competition details:', error);
      throw error;
    }
  }

  // 离开团队
  async leaveTeam(teamId, userId) {
    try {
      // 检查是否是团队领导
      const leadership = await this.executeQuery(
        'SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND role = ?',
        [teamId, 'leader']
      );
      
      const membership = await this.executeQuery(
        'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, userId]
      );
      
      if (!membership || membership.length === 0) {
        throw new Error('Not a team member');
      }
      
      // 如果是最后一个领导，不允许离开
      if (membership[0].role === 'leader' && leadership[0].count <= 1) {
        throw new Error('Team leader cannot leave. Please transfer leadership first.');
      }
      
      // 移除团队成员
      await this.executeQuery(
        'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, userId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('离开团队失败:', error);
      throw error;
    }
  }

  // 转让团队领导权限
  async transferLeadership(teamId, currentLeaderId, newLeaderId) {
    try {
      // 验证当前用户是否是团队领导
      const leadership = await this.executeQuery(
        'SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = ?',
        [teamId, currentLeaderId, 'leader']
      );
      
      if (!leadership || leadership.length === 0) {
        throw new Error('Only team leader can transfer leadership');
      }
      
      // 验证新领导是否是团队成员
      const membership = await this.executeQuery(
        'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, newLeaderId]
      );
      
      if (!membership || membership.length === 0) {
        throw new Error('New leader must be a team member');
      }
      
      // 使用事务处理
      const result = await this.withTransaction(async () => {
        // 将当前领导降级为普通成员
        await this.executeQuery(
          'UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?',
          ['member', teamId, currentLeaderId]
        );
        
        // 将新领导升级为领导
        await this.executeQuery(
          'UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?',
          ['leader', teamId, newLeaderId]
        );
        
        return { success: true };
      });
      
      return result;
    } catch (error) {
      console.error('转让领导权限失败:', error);
      throw error;
    }
  }

  // 解散团队
  async deleteTeam(teamId, userId) {
    try {
      // 验证用户是否是团队领导
      const leadership = await this.executeQuery(
        'SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = ?',
        [teamId, userId, 'leader']
      );
      
      if (!leadership || leadership.length === 0) {
        throw new Error('Only team leader can delete the team');
      }
      
      // 删除团队（注意：SQLite可能需要手动删除关联数据）
      const result = await this.withTransaction(async () => {
        // 首先删除相关记录
        await this.executeQuery('DELETE FROM team_invitations WHERE team_id = ?', [teamId]);
        await this.executeQuery('DELETE FROM team_scores WHERE team_id = ?', [teamId]);
        
        // 获取并删除相关竞赛记录
        const competitionTeams = await this.executeQuery(
          'SELECT competition_id FROM competition_teams WHERE team_id = ?',
          [teamId]
        );
        for (const ct of competitionTeams) {
          await this.executeQuery(
            'DELETE FROM competition_teams WHERE competition_id = ? AND team_id = ?',
            [ct.competition_id, teamId]
          );
        }
        
        // 删除团队成员
        await this.executeQuery('DELETE FROM team_members WHERE team_id = ?', [teamId]);
        
        // 最后删除团队
        await this.executeQuery('DELETE FROM teams WHERE id = ?', [teamId]);
        
        return { success: true };
      });
      
      return result;
    } catch (error) {
      console.error('解散团队失败:', error);
      throw error;
    }
  }
}

module.exports = TeamModel;