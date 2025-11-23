<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>信息泄露漏洞</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #333;
            color: white;
            padding: 15px;
            margin-bottom: 20px;
        }
        .card {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2 {
            color: #333;
        }
        .info-section {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        pre {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .hint {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <header>
        <h1>信息泄露漏洞</h1>
    </header>
    
    <div class="container">
        <div class="card">
            <h2>服务器信息</h2>
            <p>本页面展示了服务器的一些基本信息。在实际生产环境中，这种信息泄露可能会给攻击者提供有价值的情报。</p>
            
            <div class="info-section">
                <h3>环境变量</h3>
                <?php
                // 显示环境变量信息
                echo "<pre>";
                foreach ($_SERVER as $key => $value) {
                    echo "$key: $value\n";
                }
                echo "</pre>";
                ?>
            </div>
            
            <div class="info-section">
                <h3>PHP配置信息</h3>
                <?php
                // 显示PHP配置信息（在实际生产环境中应禁用）
                phpinfo();
                ?>
            </div>
            
            <div class="info-section">
                <h3>文件系统信息</h3>
                <p>当前工作目录: <?php echo getcwd(); ?></p>
                <p>服务器时间: <?php echo date("Y-m-d H:i:s"); ?></p>
            </div>
        </div>
        
        <div class="card">
            <h2>任务要求</h2>
            <p>请尝试获取以下信息：</p>
            <ul>
                <li>操作系统类型和版本</li>
                <li>PHP版本</li>
                <li>服务器软件名称和版本</li>
                <li>找到隐藏的管理员路径</li>
            </ul>
            
            <div class="hint">
                <h3>提示</h3>
                <p>仔细查看页面展示的信息，您可能会发现一些有趣的线索。</p>
                <p>尝试在URL中添加不同的参数或路径。</p>
            </div>
            
            <!-- 隐藏的管理员信息 -->
            <div class="success" style="display: none;" id="flag">
                <h3>恭喜！</h3>
                <p>您已成功获取信息泄露挑战的标记：FLAG{INFO_LEAK_VULNERABILITY_FOUND}</p>
            </div>
        </div>
    </div>
    
    <!-- 隐藏的管理员路径处理 -->
    <script>
        // 简单的客户端验证，仅作为演示
        if (window.location.search.includes('admin_path') || window.location.pathname.includes('admin')) {
            document.getElementById('flag').style.display = 'block';
        }
    </script>
</body>
</html>
