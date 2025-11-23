FROM php:7.4-apache

# 安装必要的工具和扩展
RUN apt-get update && apt-get install -y \
    libpq-dev \
    mysql-client \
    && docker-php-ext-install mysqli pdo pdo_mysql

# 启用Apache重写模块
RUN a2enmod rewrite

# 创建Web目录
RUN mkdir -p /var/www/html/sql-injection

# 设置权限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# 复制SQL注入漏洞页面
COPY pages/ /var/www/html/sql-injection/

# 复制数据库初始化脚本
COPY database/ /docker-entrypoint-initdb.d/

# 配置Apache
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf

# 重启Apache服务
RUN service apache2 restart

EXPOSE 80

CMD ["apache2-foreground"]
