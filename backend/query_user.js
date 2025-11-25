const mysql = require('mysql2/promise');
const config = require('./config/config');

async function queryUser() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: config.database.mysql.host,
      user: config.database.mysql.user,
      password: config.database.mysql.password,
      database: config.database.mysql.database,
      port: config.database.mysql.port
    });
    
    console.log('数据库连接成功');
    
    // 查询用户信息
    const [rows] = await connection.execute(
      'SELECT name, username, email FROM users WHERE username = ?',
      ['20230375']
    );
    
    console.log('查询结果:', rows);
    
    // 关闭连接
    await connection.end();
  } catch (error) {
    console.error('查询错误:', error);
  }
}

queryUser();