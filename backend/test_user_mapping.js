// 测试用户数据映射逻辑
const { mapToFrontendFormat, backendToFrontendMapping } = require('./src/models/DatabaseSchema');

// 模拟数据库返回的用户数据
const mockUserData = {
  id: 16,
  username: '333333',
  email: '333333@eq.com',
  name: '张思',
  role: 'student',
  class_name: '建筑',
  interest: 'Unknown',
  last_login: '2025-11-25T11:23:27.080Z',
  created_at: '2025-11-25T03:23:12.080Z'
};

console.log('原始数据库用户数据:');
console.log(mockUserData);

// 测试映射函数
const frontendUserData = mapToFrontendFormat(mockUserData);

console.log('\n转换后的前端用户数据:');
console.log(frontendUserData);

// 检查是否同时包含username和studentId
console.log('\n验证结果:');
console.log(`是否包含studentId字段: ${'studentId' in frontendUserData}`);
console.log(`是否包含username字段: ${'username' in frontendUserData}`);
console.log(`studentId值: ${frontendUserData.studentId}`);
console.log(`username值: ${frontendUserData.username}`);
console.log(`两个字段是否相等: ${frontendUserData.studentId === frontendUserData.username}`);
