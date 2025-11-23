FROM php:8.0-apache

# 安装基本工具和PHP扩展
RUN apt-get update && apt-get install -y \
    vim \
    curl \
    git \
    && docker-php-ext-install mysqli pdo pdo_mysql

# 启用Apache重写模块
RUN a2enmod rewrite

# 创建Web目录
RUN mkdir -p /var/www/html/basic \
    && mkdir -p /var/www/html/file-upload \
    && mkdir -p /var/www/html/authentication

# 设置权限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# 创建基础漏洞页面 - 信息泄露
COPY pages/index.php /var/www/html/
COPY pages/info-leak.php /var/www/html/

# 创建文件上传漏洞页面
COPY pages/file-upload/ /var/www/html/file-upload/

# 创建认证绕过页面
COPY pages/authentication/ /var/www/html/authentication/

# 配置Apache
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf

# 重启Apache服务
RUN service apache2 restart

EXPOSE 80

CMD ["apache2-foreground"]
