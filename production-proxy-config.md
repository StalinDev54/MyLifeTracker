# 生产环境配置后端代理指南

根据之前的修改，前端代码已经统一使用相对路径`/baidu-stat`进行 API 调用。在生产环境中，需要在服务器端配置相应的代理规则，将这些请求转发到百度统计 API，从而解决跨域问题。

以下是几种常见服务器的代理配置方法：

## 1. Nginx 代理配置

如果您的生产环境使用 Nginx 服务器，可以在 Nginx 配置文件中添加以下配置：

```nginx
server {
    listen 80;
    server_name me.jiclub.site;

    # 静态资源配置
    location / {
        root /path/to/your/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 百度统计API代理配置
    location /baidu-stat {
        # 转发到百度统计API
        proxy_pass https://openapi.baidu.com;

        # 设置请求头
        proxy_set_header Host openapi.baidu.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 设置用户代理
        proxy_set_header User-Agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

        # 重写请求路径，移除/baidu-stat前缀
        rewrite ^/baidu-stat(.*)$ $1 break;

        # 增加请求超时时间
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

## 2. Apache 代理配置

如果您的生产环境使用 Apache 服务器，需要启用`mod_proxy`和`mod_proxy_http`模块，然后添加以下配置：

```apache
<VirtualHost *:80>
    ServerName me.jiclub.site
    DocumentRoot /path/to/your/dist

    # 确保前端路由正常工作
    <Directory /path/to/your/dist>
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    # 百度统计API代理配置
    ProxyPass "/baidu-stat" "https://openapi.baidu.com"
    ProxyPassReverse "/baidu-stat" "https://openapi.baidu.com"

    # 设置请求头
    RequestHeader set Host "openapi.baidu.com"
    RequestHeader set User-Agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
</VirtualHost>
```

## 3. Node.js Express 代理配置

如果您使用 Node.js Express 作为生产服务器，可以使用`http-proxy-middleware`包来配置代理：

首先安装依赖：

```bash
npm install express http-proxy-middleware --save
```

然后创建服务器文件：

```javascript
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 静态资源服务
app.use(express.static(path.join(__dirname, "dist")));

// 百度统计API代理配置
app.use(
  "/baidu-stat",
  createProxyMiddleware({
    target: "https://openapi.baidu.com",
    changeOrigin: true,
    pathRewrite: {
      "^/baidu-stat": "", // 移除路径前缀
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
    timeout: 60000, // 超时时间
  })
);

// 确保SPA路由正常工作
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

## 4. 注意事项

1. 请根据您实际的服务器环境选择对应的配置方法

2. 替换配置中的`/path/to/your/dist`为您实际的前端构建文件路径

3. 如果您使用 HTTPS，请确保配置了正确的 SSL 证书和 HTTPS 监听端口

4. 配置完成后，重启服务器使配置生效

5. 测试代理是否正常工作：访问您的网站，检查百度统计数据是否能正常获取

6. 如果遇到问题，请检查服务器日志以获取详细的错误信息

通过以上配置，您的生产环境将能够正确代理百度统计 API 请求，解决之前遇到的 CORS 跨域问题。
