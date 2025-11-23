<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web安全基础靶机</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
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
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .vuln-list li:last-child {
            border-bottom: none;
        }
        .vuln-list a {
            color: #3498db;
            text-decoration: none;
            font-weight: bold;
        }
        .vuln-list a:hover {
            text-decoration: underline;
        }
        .vuln-desc {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <header>
        <h1>Web安全基础靶机</h1>
        <p>这是一个用于学习Web安全基础的靶机环境，包含常见的Web安全漏洞</p>
    </header>
    
    <div class="container">
        <div class="card">
            <h2>信息泄露漏洞</h2>
            <ul class="vuln-list">
                <li>
                    <a href="info-leak.php">基本信息泄露</a>
                    <div class="vuln-desc">通过简单的访问，查看敏感的服务器信息和配置</div>
                </li>
            </ul>
        </div>
        
        <div class="card">
            <h2>文件上传漏洞</h2>
            <ul class="vuln-list">
                <li>
                    <a href="file-upload/index.php">基础文件上传</a>
                    <div class="vuln-desc">尝试上传恶意文件，看看能否绕过限制</div>
                </li>
            </ul>
        </div>
        
        <div class="card">
            <h2>认证绕过漏洞</h2>
            <ul class="vuln-list">
                <li>
                    <a href="authentication/login.php">不安全的登录页面</a>
                    <div class="vuln-desc">尝试不使用正确的用户名密码登录系统</div>
                </li>
            </ul>
        </div>
        
        <div class="card">
            <h2>实验说明</h2>
            <p>本靶机仅供学习使用，请勿用于非法用途。通过尝试利用这些漏洞，您可以更好地理解Web安全的重要性，并学习如何在实际开发中避免这些问题。</p>
            <p>每个漏洞页面都包含了一些提示，帮助您完成挑战。</p>
        </div>
    </div>
</body>
</html>
