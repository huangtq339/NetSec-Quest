const { 
  getAvailableTargets, 
  startTargetSession, 
  stopTargetSession,
  getUserSessions,
  submitFlag
} = require('../../src/controllers/targetController');
const TargetSession = require('../../src/models/targetSession');

// 模拟依赖
jest.mock('../../src/models/targetSession');
const { spawn } = require('child_process');

// 测试用例描述
describe('Target Controller', () => {
  let req, res;
  
  // 每个测试前设置
  beforeEach(() => {
    req = global.mockRequest();
    res = global.mockResponse();
    
    // 重置所有模拟
    jest.clearAllMocks();
  });
  
  describe('getAvailableTargets', () => {
    it('应该返回所有可用的靶机列表', async () => {
      // 执行控制器函数
      await getAvailableTargets(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        targets: expect.arrayContaining([
          expect.objectContaining({
            id: 'web-vuln-basic',
            description: expect.any(String),
            category: 'web'
          }),
          expect.objectContaining({
            id: 'web-vuln-sql',
            description: expect.any(String),
            category: 'web'
          })
        ])
      });
    });
    
    it('应该处理服务器错误', async () => {
      // 模拟控制器抛出错误
      jest.spyOn(console, 'error').mockImplementation();
      
      // 这里我们模拟一个错误情况
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 模拟一个导致错误的情况
      Object.defineProperty(global, 'Object', {
        value: {
          keys: jest.fn(() => { throw new Error('测试错误'); })
        },
        configurable: true
      });
      
      await getAvailableTargets(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '获取靶机列表失败'
      });
      
      // 恢复原始的Object.keys
      Object.defineProperty(global, 'Object', {
        value: Object,
        configurable: true
      });
      console.error = originalConsoleError;
    });
  });
  
  describe('startTargetSession', () => {
    it('应该为有效的靶机类型创建新会话', async () => {
      // 设置请求参数
      req.body = { targetId: 'web-vuln-basic' };
      req.user = { _id: 'user123' };
      
      // 模拟数据库查询返回空结果（没有现有会话）
      TargetSession.findOne.mockResolvedValue(null);
      
      // 模拟创建新会话
      const mockSession = {
        userId: 'user123',
        targetId: 'web-vuln-basic',
        status: 'active',
        startTime: expect.any(Date)
      };
      TargetSession.mockImplementation(() => mockSession);
      mockSession.save = jest.fn().mockResolvedValue(mockSession);
      
      // 执行控制器函数
      await startTargetSession(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        session: mockSession,
        targetUrl: expect.stringContaining('8001')
      });
    });
    
    it('应该返回已存在的活动会话', async () => {
      // 设置请求参数
      req.body = { targetId: 'web-vuln-sql' };
      req.user = { _id: 'user123' };
      
      // 模拟数据库查询返回现有会话
      const existingSession = {
        userId: 'user123',
        targetId: 'web-vuln-sql',
        status: 'active',
        startTime: new Date()
      };
      TargetSession.findOne.mockResolvedValue(existingSession);
      
      // 执行控制器函数
      await startTargetSession(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        session: existingSession,
        targetUrl: expect.stringContaining('8002')
      });
    });
    
    it('应该拒绝无效的靶机类型', async () => {
      // 设置请求参数
      req.body = { targetId: 'invalid-target' };
      req.user = { _id: 'user123' };
      
      // 执行控制器函数
      await startTargetSession(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '无效的靶机类型'
      });
    });
  });
  
  describe('stopTargetSession', () => {
    it('应该成功停止活动会话', async () => {
      // 设置请求参数
      req.params = { sessionId: 'session123' };
      req.user = { _id: 'user123' };
      
      // 模拟数据库更新返回更新后的会话
      const updatedSession = {
        _id: 'session123',
        userId: 'user123',
        status: 'completed',
        endTime: expect.any(Date)
      };
      TargetSession.findOneAndUpdate.mockResolvedValue(updatedSession);
      
      // 执行控制器函数
      await stopTargetSession(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '靶机会话已结束',
        session: updatedSession
      });
    });
    
    it('应该处理不存在的会话', async () => {
      // 设置请求参数
      req.params = { sessionId: 'non-existent' };
      req.user = { _id: 'user123' };
      
      // 模拟数据库更新返回null（会话不存在）
      TargetSession.findOneAndUpdate.mockResolvedValue(null);
      
      // 执行控制器函数
      await stopTargetSession(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '会话不存在或已结束'
      });
    });
  });
  
  describe('submitFlag', () => {
    it('应该接受正确的FLAG并返回成功', async () => {
      // 设置请求参数
      req.body = {
        sessionId: 'session123',
        flag: 'FLAG{INFO_LEAK_VULNERABILITY_FOUND}'
      };
      req.user = { _id: 'user123' };
      req.app = { locals: { addScore: jest.fn().mockResolvedValue(true) } };
      
      // 模拟数据库查询返回会话
      const session = {
        _id: 'session123',
        userId: 'user123',
        targetId: 'web-vuln-basic',
        status: 'active'
      };
      TargetSession.findOne.mockResolvedValue(session);
      
      // 模拟数据库更新
      TargetSession.findByIdAndUpdate.mockResolvedValue({});
      
      // 执行控制器函数
      await submitFlag(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '恭喜！FLAG正确',
        pointsAwarded: 30
      });
    });
    
    it('应该拒绝错误的FLAG', async () => {
      // 设置请求参数
      req.body = {
        sessionId: 'session123',
        flag: 'INCORRECT_FLAG'
      };
      req.user = { _id: 'user123' };
      
      // 模拟数据库查询返回会话
      const session = {
        _id: 'session123',
        userId: 'user123',
        targetId: 'web-vuln-basic',
        status: 'active'
      };
      TargetSession.findOne.mockResolvedValue(session);
      
      // 模拟数据库更新
      TargetSession.findByIdAndUpdate.mockResolvedValue({});
      
      // 执行控制器函数
      await submitFlag(req, res);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'FLAG不正确，请继续尝试'
      });
    });
  });
});
