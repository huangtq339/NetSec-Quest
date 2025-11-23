-- 创建测试数据库
CREATE DATABASE IF NOT EXISTS sql_injection_target;

-- 使用创建的数据库
USE sql_injection_target;

-- 创建产品表
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL
);

-- 插入产品数据
INSERT INTO products (name, price, category) VALUES
('笔记本电脑', 5999.00, '电子产品'),
('智能手机', 3999.00, '电子产品'),
('耳机', 299.00, '配件'),
('鼠标', 99.00, '配件'),
('键盘', 199.00, '配件');

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

-- 插入普通用户数据
INSERT INTO users (username, password, email) VALUES
('user1', 'password1', 'user1@example.com'),
('user2', 'password2', 'user2@example.com'),
('user3', 'password3', 'user3@example.com');

-- 创建管理员表（包含敏感信息）
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin'
);

-- 插入管理员数据（在真实环境中密码应该加密存储）
INSERT INTO admin_users (username, password, email, role) VALUES
('admin', 'supersecret123', 'admin@example.com', 'superadmin'),
('manager', 'manager456', 'manager@example.com', 'admin');

-- 创建隐藏的配置表
CREATE TABLE IF NOT EXISTS config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(50) NOT NULL,
    key_value TEXT NOT NULL
);

-- 插入敏感配置信息
INSERT INTO config (key_name, key_value) VALUES
('db_password', 'root_password123'),
('api_key', 'sk_test_1234567890abcdef'),
('flag', 'FLAG{SQL_INJECTION_DATABASE_COMPROMISED}');

-- 创建日志表
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    user_id INT,
    ip_address VARCHAR(50)
);

-- 插入一些日志数据
INSERT INTO logs (action, user_id, ip_address) VALUES
('登录', 1, '192.168.1.100'),
('查询产品', 2, '192.168.1.101'),
('管理操作', 1, '192.168.1.100');
