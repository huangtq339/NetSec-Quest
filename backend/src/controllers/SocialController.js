const SocialModel = require('../models/SocialModel');

class SocialController {
  constructor(mysqlPool) {
    this.socialModel = new SocialModel(mysqlPool);
    // 初始化社交相关表
    this.socialModel.initializeTables().catch(err => {
      console.error('Failed to initialize social tables:', err);
    });
  }

  // 关注用户
  async followUser(req, res) {
    try {
      const { followingId } = req.body;
      const followerId = req.user.id;
      
      if (!followingId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Following ID is required'
          }
        });
      }
      
      const result = await this.socialModel.followUser(followerId, followingId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Successfully followed user'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Cannot follow yourself') {
        statusCode = 400;
      } else if (error.message === 'User not found') {
        statusCode = 404;
      } else if (error.message === 'Already following this user') {
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

  // 取消关注
  async unfollowUser(req, res) {
    try {
      const { followingId } = req.params;
      const followerId = req.user.id;
      
      const result = await this.socialModel.unfollowUser(followerId, followingId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Successfully unfollowed user'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Not following this user') {
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

  // 获取用户的关注列表
  async getFollowing(req, res) {
    try {
      const { userId } = req.params;
      
      const following = await this.socialModel.getFollowing(userId);
      
      return res.status(200).json({
        success: true,
        data: following
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get following list',
          details: error.message
        }
      });
    }
  }

  // 获取用户的粉丝列表
  async getFollowers(req, res) {
    try {
      const { userId } = req.params;
      
      const followers = await this.socialModel.getFollowers(userId);
      
      return res.status(200).json({
        success: true,
        data: followers
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get followers list',
          details: error.message
        }
      });
    }
  }

  // 检查是否已关注
  async isFollowing(req, res) {
    try {
      const { followingId } = req.params;
      const followerId = req.user.id;
      
      const isFollowing = await this.socialModel.isFollowing(followerId, followingId);
      
      return res.status(200).json({
        success: true,
        data: { isFollowing }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to check following status',
          details: error.message
        }
      });
    }
  }

  // 发送消息
  async sendMessage(req, res) {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user.id;
      
      if (!receiverId || !content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Receiver ID and content are required'
          }
        });
      }
      
      const result = await this.socialModel.sendMessage(senderId, receiverId, content.trim());
      
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Message sent successfully'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Cannot send message to yourself') {
        statusCode = 400;
      } else if (error.message === 'Receiver not found') {
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

  // 获取用户间的消息记录
  async getMessages(req, res) {
    try {
      const { otherUserId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user.id;
      
      const messages = await this.socialModel.getMessages(
        userId,
        otherUserId,
        parseInt(limit),
        parseInt(offset)
      );
      
      return res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get messages',
          details: error.message
        }
      });
    }
  }

  // 获取用户的消息会话列表
  async getConversations(req, res) {
    try {
      const userId = req.user.id;
      
      const conversations = await this.socialModel.getConversations(userId);
      
      return res.status(200).json({
        success: true,
        data: conversations
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get conversations',
          details: error.message
        }
      });
    }
  }

  // 获取未读消息数量
  async getUnreadMessageCount(req, res) {
    try {
      const userId = req.user.id;
      
      const count = await this.socialModel.getUnreadMessageCount(userId);
      
      return res.status(200).json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get unread message count',
          details: error.message
        }
      });
    }
  }

  // 标记消息为已读
  async markMessageAsRead(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      
      const result = await this.socialModel.markMessageAsRead(messageId, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Message marked as read'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Message not found or not received by user') {
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

  // 删除消息
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      
      const result = await this.socialModel.deleteMessage(messageId, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Message not found or not sent/received by user') {
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

  // 获取用户活动列表
  async getUserActivities(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const activities = await this.socialModel.getUserActivities(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
      
      return res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get user activities',
          details: error.message
        }
      });
    }
  }

  // 获取关注用户的活动信息流
  async getFeed(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 30, offset = 0 } = req.query;
      
      const feed = await this.socialModel.getFeedActivities(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
      
      return res.status(200).json({
        success: true,
        data: feed
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get feed',
          details: error.message
        }
      });
    }
  }

  // 记录用户活动（内部使用或管理员使用）
  async recordActivity(req, res) {
    try {
      const { activityType, targetType, targetId, content } = req.body;
      const userId = req.user.id;
      
      if (!activityType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Activity type is required'
          }
        });
      }
      
      const result = await this.socialModel.recordActivity(
        userId,
        activityType,
        targetType,
        targetId,
        content
      );
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Activity recorded successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to record activity',
          details: error.message
        }
      });
    }
  }
}

module.exports = SocialController;