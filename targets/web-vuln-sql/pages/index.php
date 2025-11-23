<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQL注入靶机</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #333;
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
        }
        .card {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #333;
            border-bottom: 2px solid #e74c3c;
            padding-bottom: 10px;
        }
        .vuln-list {
            list-style-type: none;
            padding: 0;
        }
        .vuln-list li {
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }
        .vuln-list li:last-child {
            border-bottom: none;
        }
        .vuln-list a {
            color: #3498db;
            text-decoration: none;
            font-weight: bold;
            font-size: 18px;
        }
        .vuln-list a:hover {
            text-decoration: underline;
        }
        .vuln-desc {
            color: #666;
            font-size: 16px;
            margin-top: 10px;
            padding-left: 20px;
        }
        .level {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            margin-left: 10px;
        }
        .easy {
            background-color: #2ecc71;
            color: white;
        }
        .medium {
            background-color: #f39c12;
            color: white;
        }
        .hard {
            background-color: #e74c3c;
            color: white;
        }
    </style>
</head>
<body>
    <header>
        <h1>SQL注入靶机</h1>
        <p>这是一个专门用于学习和实践SQL注入技术的靶机环境</p>
    </header>
    
    <div class="container">
        <div class="card">
            <h2>SQL注入挑战</h2>
            <p>SQL注入是一种常见的Web安全漏洞，攻击者通过在输入中插入恶意SQL代码，使应用程序执行非预期的数据库操作。</p>
            <p>以下是不同类型和难度的SQL注入挑战：</p>
            
            <ul class="vuln-list">
                <li>
                    <a href="basic-login.php">基础登录绕过 <span class="level easy">简单</span></a>
                    <div class="vuln-desc">利用SQL注入绕过登录认证，无需正确的用户名和密码</div>
                </li>
                <li>
                    <a href="union-based.php">联合查询注入 <span class="level medium">中等</span></a>
                    <div class="vuln-desc">使用UNION语句提取数据库中的敏感信息</div>
                </li>
                <li>
                    <a href="blind-based.php">布尔盲注 <span class="level hard">困难</span></a>
                    <div class="vuln-desc">通过布尔值响应推断数据库信息</div>
                </li>
                <li>
                    <a href="time-based.php">时间盲注 <span class="level hard">困难</span></a>
                    <div class="vuln-desc">通过时间延迟推断数据库信息</div>
                </li>
            </ul>
        </div>
        
        <div class="card">
            <h2>学习资源</h2>
            <p>SQL注入是OWASP Top 10中的常见漏洞。通过这些挑战，您可以学习如何：</p>
            <ul>
                <li>识别SQL注入漏洞</li>
                <li>利用不同类型的SQL注入攻击</li>
                <li>理解SQL注入的危害</li>
                <li>学习如何防止SQL注入</li>
            </ul>
        </div>
    </div>
</body>
</html>
