<?php
// 简单的登出页面
session_start();

// 销毁会话
$_SESSION = array();

// 如果需要，删除会话Cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 销毁会话
@session_destroy();

// 重定向到登录页面
header('Location: login.php');
exit();
