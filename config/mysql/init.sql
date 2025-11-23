-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS cybersecurity_skill_tree;

USE cybersecurity_skill_tree;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    points INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技能节点表
CREATE TABLE IF NOT EXISTS skill_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id INT REFERENCES skill_nodes(id) ON DELETE CASCADE,
    description TEXT,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    course_id INT REFERENCES courses(id),
    points_required INT DEFAULT 0
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    points_reward INT NOT NULL,
    node_id INT REFERENCES skill_nodes(id),
    vm_template_id VARCHAR(255),
    evaluation_script TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户进度表
CREATE TABLE IF NOT EXISTS user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    node_id INT REFERENCES skill_nodes(id) ON DELETE CASCADE,
    status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    score INT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_node (user_id, node_id)
);

-- 任务提交表
CREATE TABLE IF NOT EXISTS task_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    submission_content TEXT,
    score INT,
    feedback TEXT,
    status ENUM('pending', 'graded', 'passed', 'failed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS point_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    points_change INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    related_id INT,
    related_type ENUM('task', 'competition', 'achievement'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 勋章表
CREATE TABLE IF NOT EXISTS medals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    condition_type ENUM('points', 'tasks_completed', 'time_spent', 'special'),
    condition_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户勋章表
CREATE TABLE IF NOT EXISTS user_medals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    medal_id INT REFERENCES medals(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_medal (user_id, medal_id)
);

-- 团队表
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    leader_id INT REFERENCES users(id),
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 团队成员表
CREATE TABLE IF NOT EXISTS team_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role ENUM('leader', 'member') NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_user (team_id, user_id)
);

-- 竞赛表
CREATE TABLE IF NOT EXISTS competitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    rules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 竞赛参与表
CREATE TABLE IF NOT EXISTS competition_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT REFERENCES competitions(id) ON DELETE CASCADE,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    ranking INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_competition_team (competition_id, team_id)
);

-- 靶机模板表
CREATE TABLE IF NOT EXISTS vm_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    docker_image VARCHAR(255) NOT NULL,
    config_params TEXT,
    resource_limits TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 运行中靶机表
CREATE TABLE IF NOT EXISTS running_vms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    template_id INT REFERENCES vm_templates(id),
    container_id VARCHAR(255) NOT NULL,
    status ENUM('starting', 'running', 'stopping', 'stopped', 'error') NOT NULL,
    ip_address VARCHAR(50),
    port_mappings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    stopped_at TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_skill_nodes_parent ON skill_nodes(parent_id);
CREATE INDEX idx_skill_nodes_course ON skill_nodes(course_id);
CREATE INDEX idx_tasks_node ON tasks(node_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_node ON user_progress(node_id);
CREATE INDEX idx_task_submissions_user ON task_submissions(user_id);
CREATE INDEX idx_task_submissions_task ON task_submissions(task_id);
CREATE INDEX idx_point_records_user ON point_records(user_id);
CREATE INDEX idx_user_medals_user ON user_medals(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_competition_participants_competition ON competition_participants(competition_id);
CREATE INDEX idx_competition_participants_team ON competition_participants(team_id);
CREATE INDEX idx_running_vms_user ON running_vms(user_id);
CREATE INDEX idx_running_vms_task ON running_vms(task_id);

-- 插入初始数据
-- 插入示例课程
INSERT INTO courses (name, description) VALUES 
('计算机网络基础', '计算机网络原理、协议分析与网络安全基础'),
('操作系统安全', '操作系统原理、安全机制与漏洞分析'),
('密码学基础', '密码学原理、加密算法与应用'),
('Web安全', 'Web应用安全、常见漏洞与防护技术'),
('渗透测试', '渗透测试方法论、工具使用与实战技巧');

-- 插入示例勋章
INSERT INTO medals (name, description, condition_type, condition_value) VALUES 
('初学者', '完成第一个任务', 'tasks_completed', 1),
('网络新手', '完成所有计算机网络基础任务', 'special', 1),
('安全卫士', '累计获得1000积分', 'points', 1000),
('任务大师', '完成50个任务', 'tasks_completed', 50),
('学习达人', '连续学习7天', 'time_spent', 7);

-- 插入示例靶机模板
INSERT INTO vm_templates (name, description, docker_image, config_params) VALUES 
('基础Linux靶机', '用于学习Linux基础命令和权限管理', 'ubuntu:20.04', '{"ports":{"22":22,"80":80},"resources":{"memory":"512m","cpu":"0.5"}}'),
('Web漏洞靶机', '包含常见Web漏洞的练习环境', 'vulnerables/web-dvwa', '{"ports":{"80":80},"resources":{"memory":"1g","cpu":"1"}}'),
('网络分析靶机', '用于网络协议分析和流量捕获', 'networkanalyzer', '{"ports":{"8080":8080},"resources":{"memory":"1g","cpu":"1"}}');

-- 插入管理员用户（密码：admin123）
INSERT INTO users (username, password, email, role) VALUES 
('admin', '$2a$10$e5eJzLxFT8XfJjMzqB8uCOK2x7vF1QmI1g4Z6Y1g4Z6Y1g4Z6Y1g4Z', 'admin@example.com', 'admin');

-- 创建视图：用户技能进度统计
CREATE VIEW v_user_skill_progress AS
SELECT 
    u.id as user_id,
    u.username,
    u.points,
    u.level,
    COUNT(up.id) as total_nodes,
    SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_nodes,
    ROUND(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(up.id), 2) as completion_percentage
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
GROUP BY u.id, u.username, u.points, u.level;

-- 创建视图：任务统计
CREATE VIEW v_task_statistics AS
SELECT
    t.id as task_id,
    t.title,
    t.difficulty,
    COUNT(ts.id) as total_submissions,
    SUM(CASE WHEN ts.status = 'passed' THEN 1 ELSE 0 END) as passed_submissions,
    ROUND(SUM(CASE WHEN ts.status = 'passed' THEN 1 ELSE 0 END) * 100.0 / COUNT(ts.id), 2) as pass_rate,
    AVG(ts.score) as average_score
FROM tasks t
LEFT JOIN task_submissions ts ON t.id = ts.task_id
GROUP BY t.id, t.title, t.difficulty;