<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQL注入 - 联合查询注入</title>
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
        .card {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
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
        input[type="text"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
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
            margin-bottom: 20px;
            text-align: center;
        }
        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .results {
            margin-top: 20px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #3498db;
            color: white;
        }
        tr:hover {
            background-color: #f5f5f5;
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
        .hint {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
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
        <div class="card">
            <h2>SQL注入 - 联合查询注入</h2>
            <p>这个挑战展示了如何使用UNION语句进行SQL注入，从而获取数据库中的敏感信息。</p>
            
            <?php
            // 模拟数据库（产品信息）
            $products = [
                ['id' => 1, 'name' => '笔记本电脑', 'price' => 5999, 'category' => '电子产品'],
                ['id' => 2, 'name' => '智能手机', 'price' => 3999, 'category' => '电子产品'],
                ['id' => 3, 'name' => '耳机', 'price' => 299, 'category' => '配件'],
                ['id' => 4, 'name' => '鼠标', 'price' => 99, 'category' => '配件'],
                ['id' => 5, 'name' => '键盘', 'price' => 199, 'category' => '配件']
            ];
            
            // 模拟隐藏的管理员表
            $admin_table = [
                ['id' => 1, 'username' => 'admin', 'password' => 'supersecret123', 'email' => 'admin@example.com'],
                ['id' => 2, 'username' => 'manager', 'password' => 'manager456', 'email' => 'manager@example.com']
            ];
            
            // 模拟数据库查询
            $query_result = [];
            $build_query = '';
            
            if (isset($_GET['product_id'])) {
                $product_id = $_GET['product_id'];
                
                // 不安全的SQL查询构建（这是漏洞所在）
                $build_query = "SELECT id, name, price, category FROM products WHERE id = $product_id";
                
                // 检查是否有UNION注入尝试
                if (strpos(strtolower($product_id), 'union') !== false) {
                    // 处理UNION注入尝试
                    
                    // 检查是否尝试获取表名
                    if (strpos(strtolower($product_id), 'information_schema') !== false || 
                        strpos(strtolower($product_id), 'tables') !== false) {
                        // 模拟返回表名信息
                        $query_result = [
                            ['id' => 'TABLE', 'name' => 'products', 'price' => '', 'category' => '表名'],
                            ['id' => 'TABLE', 'name' => 'users', 'price' => '', 'category' => '表名'],
                            ['id' => 'TABLE', 'name' => 'admin_users', 'price' => '', 'category' => '表名']
                        ];
                    }
                    // 检查是否尝试获取列名
                    else if (strpos(strtolower($product_id), 'columns') !== false) {
                        // 模拟返回列名信息
                        $query_result = [
                            ['id' => 'COLUMN', 'name' => 'id', 'price' => '', 'category' => '列名'],
                            ['id' => 'COLUMN', 'name' => 'username', 'price' => '', 'category' => '列名'],
                            ['id' => 'COLUMN', 'name' => 'password', 'price' => '', 'category' => '列名'],
                            ['id' => 'COLUMN', 'name' => 'email', 'price' => '', 'category' => '列名']
                        ];
                    }
                    // 检查是否尝试从admin_users表获取数据
                    else if (strpos(strtolower($product_id), 'admin_users') !== false ||
                             strpos(strtolower($product_id), 'users') !== false) {
                        // 返回管理员数据（在实际攻击中，这会暴露敏感信息）
                        foreach ($admin_table as $admin) {
                            $query_result[] = [
                                'id' => $admin['id'],
                                'name' => $admin['username'],
                                'price' => $admin['password'],
                                'category' => $admin['email']
                            ];
                        }
                        
                        // 显示FLAG
                        echo "<div class='message error'>";
                        echo "<h3>FLAG发现!</h3>";
                        echo "<p>FLAG: FLAG{UNION_BASED_SQL_INJECTION_SUCCESS}</p>";
                        echo "</div>";
                    }
                    // 处理基本的UNION注入
                    else if (preg_match('/union.*select/i', $product_id)) {
                        // 尝试解析用户输入的列数
                        $union_parts = explode('union', strtolower($product_id));
                        if (count($union_parts) > 1) {
                            $select_part = $union_parts[1];
                            // 简单模拟返回自定义数据
                            $query_result = [
                                ['id' => 'INJECTED', 'name' => '数据', 'price' => '已注入', 'category' => '成功']
                            ];
                        }
                    }
                } else {
                    // 正常查询
                    foreach ($products as $product) {
                        if ($product['id'] == $product_id) {
                            $query_result[] = $product;
                            break;
                        }
                    }
                }
            }
            
            // 显示构建的查询
            if (!empty($build_query)) {
                echo "<div class='code-block'>构建的SQL查询: $build_query</div>";
            }
            
            // 显示查询结果
            if (!empty($query_result)) {
                echo "<div class='results'>";
                echo "<h3>查询结果:</h3>";
                echo "<table>";
                echo "<tr><th>ID</th><th>名称</th><th>价格</th><th>类别</th></tr>";
                foreach ($query_result as $row) {
                    echo "<tr>";
                    echo "<td>{$row['id']}</td>";
                    echo "<td>{$row['name']}</td>";
                    echo "<td>{$row['price']}</td>";
                    echo "<td>{$row['category']}</td>";
                    echo "</tr>";
                }
                echo "</table>";
                echo "</div>";
            } else if (isset($_GET['product_id'])) {
                echo "<div class='message error'>";
                echo "<p>未找到产品</p>";
                echo "</div>";
            }
            ?>
            
            <form method="get" action="union-based.php">
                <div class="form-group">
                    <label for="product_id">产品ID</label>
                    <input type="text" id="product_id" name="product_id" placeholder="输入产品ID">
                </div>
                <input type="submit" value="查询">
            </form>
            
            <div class="hint">
                <h3>提示</h3>
                <p>尝试使用UNION SELECT语句获取更多数据：</p>
                <ul>
                    <li>首先确定列数：<code>1 UNION SELECT 1,2,3,4</code></li>
                    <li>获取表名：<code>1 UNION SELECT table_name,table_schema,1,1 FROM information_schema.tables</code></li>
                    <li>获取列名：<code>1 UNION SELECT column_name,1,1,1 FROM information_schema.columns WHERE table_name='admin_users'</code></li>
                    <li>获取数据：<code>1 UNION SELECT username,password,email,1 FROM admin_users</code></li>
                </ul>
            </div>
            
            <div class="back-link">
                <a href="index.php">返回挑战列表</a>
            </div>
        </div>
    </div>
</body>
</html>
