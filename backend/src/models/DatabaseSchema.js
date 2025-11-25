// 数据库模式定义文件 - 统一管理所有数据库表的列名
// 目的：确保前后端使用一致的字段名，避免列名不匹配问题

// 用户表字段定义
exports.userTable = {
  tableName: 'users',
  columns: {
    id: 'id',
    username: 'username',    // 对应前端的 studentId
    email: 'email',
    password: 'password',
    fullname: 'name',        // 对应前端的 name (数据库中实际字段名是name)
    name: 'name',            // 数据库中的实际字段名
    role: 'role',
    status: 'status',
    className: 'class_name', // 对应前端的 className
    interest: 'interest',    // 对应前端的 interest
    loginAttempts: 'login_attempts',
    lockedUntil: 'locked_until',
    lastLogin: 'last_login',
    createdAt: 'created_at',
    points: 'points'
  }
};

// 用户进度表字段定义
exports.userProgressTable = {
  tableName: 'user_progress',
  columns: {
    id: 'id',
    userId: 'user_id',
    nodeId: 'node_id',
    status: 'status',
    score: 'score',
    completedAt: 'completed_at'
  }
};

// 用户积分表字段定义
exports.userPointsTable = {
  tableName: 'user_points',
  columns: {
    id: 'id',
    userId: 'user_id',
    points: 'points',
    updatedAt: 'updated_at'
  }
};

// 积分记录表字段定义
exports.pointRecordsTable = {
  tableName: 'point_records',
  columns: {
    id: 'id',
    userId: 'user_id',
    pointsChange: 'points_change',
    reason: 'reason',
    relatedId: 'related_id',
    relatedType: 'related_type',
    createdAt: 'created_at'
  }
};

// 技能节点表字段定义
exports.skillNodesTable = {
  tableName: 'skill_nodes',
  columns: {
    id: 'id',
    name: 'name',
    description: 'description',
    parentId: 'parent_id',
    level: 'level',
    category: 'category'
  }
};

// 前端到后端的字段映射（保持向后兼容性）
exports.frontendToBackendMapping = {
  studentId: 'username',   // 前端的 studentId 对应数据库的 username
  name: 'name',            // 前端的 name 对应数据库的 name
  className: 'class_name', // 前端的 className 对应数据库的 class_name
  interest: 'interest'     // 前端的 interest 对应数据库的 interest
};

// 后端到前端的字段映射（用于返回给前端的数据格式化）
exports.backendToFrontendMapping = {
  username: 'studentId',   // 数据库的 username 对应前端的 studentId
  name: 'name',            // 数据库的 name 对应前端的 name
  class_name: 'className', // 数据库的 class_name 对应前端的 className
  interest: 'interest'     // 数据库的 interest 对应前端的 interest
};

// 扩展映射，同时保留username字段以便前端使用
exports.enhancedBackendToFrontendMapping = {
  ...exports.backendToFrontendMapping,
  // 额外保留username字段，确保前端可以同时访问studentId和username
};

/**
 * 将数据库查询结果转换为前端期望的格式
 * @param {Object|Array} data - 数据库查询结果
 * @param {Object} mapping - 字段映射关系
 * @returns {Object|Array} 转换后的对象或数组
 */
exports.mapToFrontendFormat = (data, mapping = exports.backendToFrontendMapping) => {
  // 使用映射进行基本转换
  const formattedData = internalMapToFrontendFormat(data, mapping);
  
  // 对于用户数据，确保同时包含username和studentId
  if (data && typeof data === 'object') {
    // 如果是对象数组
    if (Array.isArray(data)) {
      return formattedData.map(item => {
        if (item.studentId && !item.username) {
          item.username = item.studentId;
        }
        return item;
      });
    } 
    // 如果是单个对象
    else if (formattedData.studentId && !formattedData.username) {
      formattedData.username = formattedData.studentId;
    }
  }
  
  return formattedData;
};

// 内部映射函数，实际执行字段转换
function internalMapToFrontendFormat(data, mapping) {
  if (!data) return data;
  
  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => internalMapToFrontendFormat(item, mapping));
  }
  
  // 创建新对象，避免直接修改原始数据
  const result = {};
  
  // 遍历原始对象的所有属性
  Object.keys(data).forEach(key => {
    // 如果属性在映射中存在，使用映射后的值作为键
    if (mapping[key]) {
      result[mapping[key]] = data[key];
    } else {
      // 如果属性不在映射中，保留原始键名
      result[key] = data[key];
    }
  });
  
  return result;
}

/**
 * 将前端数据转换为数据库格式
 * @param {Object} data - 前端数据
 * @param {Object} mapping - 字段映射关系
 * @returns {Object} 转换后的对象
 */
exports.mapToBackendFormat = (data, mapping = exports.frontendToBackendMapping) => {
  if (!data) return data;
  
  const result = {};
  Object.keys(data).forEach(key => {
    const mappedKey = mapping[key] || key;
    result[mappedKey] = data[key];
  });
  
  return result;
};
