const mysql = require('mysql2/promise');
const config = require('./config/config');

async function updateUserName() {
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
    
    // 更新用户姓名
    const [result] = await connection.execute(
      'UPDATE users SET name = ? WHERE username = ?',
      ['张三', '20230375']  // 将姓名设置为"张三"
    );
    
    console.log('更新结果:', result.affectedRows, '行受影响');
    
    // 验证更新是否成功
    const [rows] = await connection.execute(
      'SELECT name FROM users WHERE username = ?',
      ['20230375']
    );
    
    console.log('更新后的name值:', rows[0]?.name);
    
    // 关闭连接
    await connection.end();
  } catch (error) {
    console.error('更新错误:', error);
  }
}

updateUserName();