<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>认证绕过漏洞</title>
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
        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            text-align: center;
        }
        .hint {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            text-align: center;
        }
        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="login-form">
            <h2>管理员登录</h2>
            
            <?php
            // 简单的认证绕过漏洞演示
            session_start();
            
            // 如果已经登录，显示成功信息
            if (isset($_SESSION['admin']) && $_SESSION['admin'] === true) {
                echo '<div class="success">';
                echo '<h3>恭喜！</h3>';
                echo '<p>您已成功登录到管理员面板。</p>';
                echo '<p>FLAG: FLAG{AUTHENTICATION_BYPASS_EXPLOITED}</p>';
                echo '<p><a href="logout.php">退出登录</a></p>';
                echo '</div>';
                exit();
            }
            
            // 显示登录错误（如果有）
            if (isset($_GET['error'])) {
                echo '<div class="error">登录失败，请检查用户名和密码。</div>';
            }
            
            // 处理登录请求
            if ($_SERVER['REQUEST_METHOD'] == 'POST') {
                // 获取表单数据
                $username = $_POST['username'];
                $password = $_POST['password'];
                
                // 这里有两个主要的漏洞：
                // 1. 没有对输入进行过滤
                // 2. 直接在查询字符串中拼接用户名
                
                // 模拟数据库查询（不安全的实现）
                $isValid = false;
                
                // 方法1: 字符串拼接方式（可被SQL注入）
                // 模拟SQL查询逻辑
                if ($username == 'admin' && $password == 'password') {
                    $isValid = true;
                }
                
                // 方法2: 检查是否有特殊参数绕过认证
                // 不安全的逻辑，允许通过特殊参数绕过登录
                if (isset($_POST['bypass']) || isset($_GET['bypass'])) {
                    $isValid = true;
                }
                
                // 检查cookie是否包含绕过信息
                if (isset($_COOKIE['admin']) && $_COOKIE['admin'] == 'true') {
                    $isValid = true;
                }
                
                if ($isValid) {
                    // 设置会话
                    $_SESSION['admin'] = true;
                    header('Location: login.php');
                    exit();
                } else {
                    header('Location: login.php?error=1');
                    exit();
                }
            }
            ?>
            
            <form method="post" action="login.php">
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
                <p>尝试使用不同的绕过技术，比如SQL注入、特殊参数、cookie修改等。</p>
            </div>
        </div>
    </div>
</body>
</html>
