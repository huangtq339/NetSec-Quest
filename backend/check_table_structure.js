// 验证脚本来检查users表结构
const mysql = require('mysql2/promise');

async function checkTableStructure() {
  let connection;
  try {
    // 使用与之前相同的连接参数
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'cybersecurity_skill_tree'
    });

    console.log('Connected to MySQL database');

    // 查询表结构
    const [rows] = await connection.execute(
      'DESCRIBE users;'
    );

    console.log('\nUsers table structure:');
    rows.forEach(row => {
      console.log(`${row.Field} (${row.Type}) ${row.Null === 'NO' ? 'NOT NULL' : ''} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

    // 尝试查询一条数据，看看字段是否可访问
    try {
      const [users] = await connection.execute(
        'SELECT id, username, email, interest, class_name FROM users LIMIT 1;'
      );
      console.log('\nSample data query successful:');
      console.log(users[0] || 'No users found');
    } catch (err) {
      console.error('\nError querying with interest field:', err.message);
    }

  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTableStructure();