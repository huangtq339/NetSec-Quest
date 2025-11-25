const mysql = require('mysql2/promise');
const config = require('./config/config');
const { userTable } = require('./src/models/DatabaseSchema');

async function checkUserStatus() {
  try {
    // 直接创建数据库连接池
    const pool = mysql.createPool({
      host: config.database.mysql.host,
      user: config.database.mysql.user,
      password: config.database.mysql.password,
      database: config.database.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // 查询用户888888的信息
    const [users] = await pool.execute(
      `SELECT * FROM ${userTable.tableName} WHERE ${userTable.columns.username} = ?`,
      ['888888']
    );
    
    console.log('用户888888的数据库信息:', users);
    
    // 查询用户进度和积分信息
    if (users.length > 0) {
      const userId = users[0].id;
      
      const [progress] = await pool.execute(
        `SELECT * FROM user_progress WHERE user_id = ? LIMIT 5`,
        [userId]
      );
      
      const [points] = await pool.execute(
        `SELECT * FROM user_points WHERE user_id = ?`,
        [userId]
      );
      
      console.log('用户进度信息:', progress);
      console.log('用户积分信息:', points);
    }
    
    await pool.end();
  } catch (error) {
    console.error('查询用户状态时出错:', error);
  }
}

checkUserStatus();