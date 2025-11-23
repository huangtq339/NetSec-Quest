<?php
// 文件上传漏洞演示 - 不安全的文件上传处理

// 设置上传目录
$targetDir = "uploads/";

// 确保上传目录存在
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// 获取文件名
$targetFile = $targetDir . basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;

// 获取文件扩展名
$imageFileType = strtolower(pathinfo($targetFile,PATHINFO_EXTENSION));

// 简单的文件类型检查（可被绕过）
if(isset($_POST["submit"])) {
    // 仅检查文件扩展名（不安全的做法）
    $allowedTypes = array("jpg", "jpeg", "png", "gif");
    
    // 这个检查可以通过双扩展名或大小写混合等方式绕过
    if (!in_array($imageFileType, $allowedTypes)) {
        $message = "只允许上传 JPG, JPEG, PNG 和 GIF 文件!";
        $type = "error";
        $uploadOk = 0;
    }
}

// 检查文件是否已存在
if (file_exists($targetFile)) {
    $message = "抱歉，文件已存在!";
    $type = "error";
    $uploadOk = 0;
}

// 检查文件大小（10MB限制）
if ($_FILES["fileToUpload"]["size"] > 10000000) {
    $message = "抱歉，您的文件太大了!";
    $type = "error";
    $uploadOk = 0;
}

// 尝试上传文件
if ($uploadOk == 1) {
    // 这里没有进行MIME类型检查或内容验证
    // 也没有对文件名进行清理，允许特殊字符
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $targetFile)) {
        $message = "文件 " . htmlspecialchars(basename($_FILES["fileToUpload"]["name"])) . " 已成功上传。";
        $type = "success";
    } else {
        $message = "抱歉，上传文件时发生了错误。";
        $type = "error";
    }
}

// 重定向回上传页面，并显示消息
header("Location: index.php?message=" . urlencode($message) . "&type=" . $type);
exit();
