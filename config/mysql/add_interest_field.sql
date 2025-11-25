USE cybersecurity_skill_tree;

-- 向users表添加interest字段
ALTER TABLE users
ADD COLUMN interest VARCHAR(100) DEFAULT 'Unknown';

-- 确保class_name字段存在（如果之前没有的话）
ALTER TABLE users
ADD COLUMN class_name VARCHAR(100) DEFAULT 'Unknown';

SELECT 'Fields added successfully' AS status;