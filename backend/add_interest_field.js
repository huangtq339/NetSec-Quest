// 临时脚本：向users表添加interest和class_name字段
const mysql = require('mysql2/promise');

async function addFields() {
  let connection;
  try {
    // 直接使用数据库连接参数
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'cybersecurity_skill_tree'
    });

    console.log('Connected to MySQL database');

    // 添加interest字段
    await connection.execute(
      'ALTER TABLE users ADD COLUMN interest VARCHAR(100) DEFAULT \'Unknown\''
    );
    console.log('Added interest field successfully');

    // 尝试添加class_name字段（如果不存在）
    try {
      await connection.execute(
        'ALTER TABLE users ADD COLUMN class_name VARCHAR(100) DEFAULT \'Unknown\''
      );
      console.log('Added class_name field successfully');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('class_name field already exists, skipping');
      } else {
        throw err;
      }
    }

    console.log('All fields added successfully!');
  } catch (error) {
    console.error('Error adding fields:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addFields();