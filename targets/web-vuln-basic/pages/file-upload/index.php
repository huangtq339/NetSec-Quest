<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文件上传漏洞</title>
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
        .upload-form {
            margin-top: 20px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }
        input[type="file"] {
            margin-bottom: 10px;
        }
        input[type="submit"] {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        input[type="submit"]:hover {
            background-color: #2980b9;
        }
        .message {
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .hint {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
        .uploaded-files {
            margin-top: 20px;
        }
        .file-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .file-item:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <header>
        <h1>文件上传漏洞</h1>
    </header>
    
    <div class="container">
        <div class="card">
            <h2>文件上传挑战</h2>
            <p>尝试上传不同类型的文件，看看能否绕过限制。</p>
            
            <div class="upload-form">
                <form action="upload.php" method="post" enctype="multipart/form-data">
                    <label for="fileToUpload">选择文件：</label>
                    <input type="file" name="fileToUpload" id="fileToUpload">
                    <br>
                    <input type="submit" value="上传文件" name="submit">
                </form>
            </div>
            
            <?php
            // 显示上传消息（如果有）
            if (isset($_GET['message'])) {
                $message = $_GET['message'];
                $type = isset($_GET['type']) ? $_GET['type'] : 'error';
                echo "<div class=\"message $type\">$message</div>";
            }
            ?>
            
            <div class="uploaded-files">
                <h3>已上传的文件：</h3>
                <?php
                // 显示已上传的文件列表
                $uploadDir = './uploads/';
                if (is_dir($uploadDir)) {
                    $files = scandir($uploadDir);
                    foreach ($files as $file) {
                        if ($file != '.' && $file != '..') {
                            echo "<div class=\"file-item\">
                                <a href=\"$uploadDir$file\" target=\"_blank\">$file</a>
                            </div>";
                        }
                    }
                } else {
                    echo "<p>还没有上传任何文件</p>";
                }
                ?>
            </div>
            
            <div class="hint">
                <h3>提示</h3>
                <p>尝试上传PHP文件，或者修改文件扩展名绕过限制。</p>
                <p>常见的绕过方法包括：使用双扩展名、修改MIME类型等。</p>
            </div>
        </div>
    </div>
</body>
</html>
