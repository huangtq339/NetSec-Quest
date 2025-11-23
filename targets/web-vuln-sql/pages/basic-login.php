<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQL注入 - 基础登录绕过</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
        }
        .login-form {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2 {
            color: #333;
            text-align: center;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #666;
        }
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        input[type="submit"] {
            width: 100%;
            background-color: #3498db;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        input[type="submit"]:hover {
            background-color: #2980b9;
        }
        .message {
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            text-align: center;
        }
        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .hint {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
        .code-block {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin-top: 20px;
            font-family: monospace;
            overflow-x: auto;
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: #3498db;
            text-decoration: none;
        }
        .back-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="login-form">
            <h2>SQL注入 - 基础登录绕过</h2>
            
            <?php
            // 模拟数据库连接
            $servername = "localhost";
            $username = "root";
            $password = "password";
            $dbname = "users";
            
            // 模拟数据库（实际环境中应该从数据库获取）
            $users = [
                ['id' => 1, 'username' => 'admin', 'password' => 'admin123'],
                ['id' => 2, 'username' => 'user1', 'password' => 'password1'],
                ['id' => 3, 'username' => 'user2', 'password' => 'password2']
            ];
            
            // 处理登录请求
            if ($_SERVER['REQUEST_METHOD'] == 'POST') {
                $input_username = $_POST['username'];
                $input_password = $_POST['password'];
                
                // 不安全的SQL查询构建（这是漏洞所在）
                // 实际环境中，这会连接到数据库执行查询
                $query = "SELECT * FROM users WHERE username = '$input_username' AND password = '$input_password'";
                
                // 显示构建的查询（仅用于学习目的）
                echo "<div class='code-block'>构建的SQL查询: $query</div>";
                
                // 模拟查询执行
                // 在实际环境中，这里会将查询发送到数据库
                $is_valid = false;
                $user_data = null;
                
                // 简单的模拟查询逻辑（基于字符串匹配）
                foreach ($users as $user) {
                    // 不安全的字符串匹配，可被SQL注入绕过
                    if (preg_match("/$input_username/i", $user['username']) && 
                        preg_match("/$input_password/i", $user['password'])) {
                        $is_valid = true;
                        $user_data = $user;
                        break;
                    }
                }
                
                // 检查是否使用了SQL注入绕过
                if (strpos($input_username, "' OR '1'='1") !== false || 
                    strpos($input_username, "'--") !== false ||
                    strpos($input_username, "'/*") !== false) {
                    $is_valid = true;
                    $user_data = ['id' => 1, 'username' => 'admin', 'password' => '***'];
                }
                
                if ($is_valid) {
                    echo "<div class='message success'>";
                    echo "<h3>登录成功！</h3>";
                    echo "<p>欢迎回来，管理员！</p>";
                    echo "<p>FLAG: FLAG{SQL_INJECTION_LOGIN_BYPASS}</p>";
                    echo "<p>用户ID: " . $user_data['id'] . "</p>";
                    echo "<p>用户名: " . $user_data['username'] . "</p>";
                    echo "</div>";
                } else {
                    echo "<div class='message error'>";
                    echo "<p>用户名或密码错误</p>";
                    echo "</div>";
                }
            }
            ?>
            
            <form method="post" action="basic-login.php">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" placeholder="请输入密码">
                </div>
                <input type="submit" value="登录">
            </form>
            
            <div class="hint">
                <h3>提示</h3>
                <p>尝试在用户名或密码字段中输入SQL注入字符串，比如：</p>
                <ul>
                    <li>username: <code>' OR '1'='1</code></li>
                    <li>username: <code>'--</code></li>
                    <li>username: <code>admin'--</code></li>
                </ul>
            </div>
            
            <div class="back-link">
                <a href="index.php">返回挑战列表</a>
            </div>
        </div>
    </div>
</body>
</html>
