const mysql = require('mysql2/promise');
const config = require('../../config/config');

// 数据库连接对象
let mysqlPool = null;

// 创建MySQL连接池
const createMySQLPool = async () => {
  try {
    const pool = mysql.createPool({
      host: config.database.mysql.host,
      user: config.database.mysql.user,
      password: config.database.mysql.password,
      database: config.database.mysql.database,
      port: config.database.mysql.port,
      connectionLimit: config.database.mysql.connectionLimit,
      waitForConnections: true,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false },
      allowPublicKeyRetrieval: true
    });

    // 测试连接
    const connection = await pool.getConnection();
    console.log('MySQL 连接成功');
    connection.release();

    mysqlPool = pool;
    return pool;
  } catch (error) {
    console.error('MySQL 连接失败:', error);
    throw error;
  }
};

// 获取数据库连接
const getDatabaseConnection = () => {
  return getMySQLPool();
};

// 获取MySQL连接池
const getMySQLPool = () => {
  if (!mysqlPool) {
    throw new Error('MySQL连接池尚未初始化');
  }
  return mysqlPool;
};

// 初始化数据库
const initializeDatabase = async () => {
  try {
    await createMySQLPool();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 关闭数据库连接
const closeDatabaseConnections = async () => {
  try {
    // 关闭MySQL连接池
    if (mysqlPool) {
      await mysqlPool.end();
      console.log('MySQL 连接已关闭');
      mysqlPool = null;
    }
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
  }
};

module.exports = {
  initializeDatabase,
  getDatabaseConnection,
  getMySQLPool,
  closeDatabaseConnections
};