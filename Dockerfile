# 使用官方 Nginx 镜像
FROM nginx:alpine

# 拷贝项目所有文件到 Nginx 默认静态目录
COPY . /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]