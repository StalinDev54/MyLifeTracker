# MyLifeTracker 后端服务器

基于 Express + Socket.IO 的后端服务，提供 RESTful API 和实时通信能力。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少需要配置：
- `SECRET_KEY` - API 鉴权密钥（必须修改）
- `PORT` - 服务器端口（默认 3000）

### 3. 启动服务器

**开发模式（热重载）：**
```bash
npm run dev
```

**生产模式：**
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 核心功能

### 1. 实时通信（Socket.IO）

- **在线用户统计** - 实时追踪连接用户数
- **日志推送** - 设备日志实时更新
- **音乐同步** - 音乐播放状态实时同步

### 2. RESTful API

#### 基础信息
- `GET /` - 服务状态和 API 列表

#### 实时数据
- `GET /api/online-users` - 获取在线用户数

#### 音乐相关
- `GET /api/cloudmusic` - 获取音乐播放记录
- `POST /api/cloudmusic` - 添加音乐播放记录（需鉴权）

#### 设备日志
- `GET /getStalin` - 获取设备日志
- `POST /postStalin` - 添加设备日志（需鉴权）

#### 专注任务
- `GET /api/focus-tasks` - 获取专注任务
- `POST /api/focus-tasks` - 更新专注任务（需鉴权）
- `POST /api/focus-tasks/toggle` - 切换任务状态（需鉴权）

#### 运动数据
- `GET /Getxingzhe` - 获取行者运动列表
- `GET /Getxingzhe/:id` - 获取运动详情

#### 数据分析
- `POST /baidu-stat/proxy` - 百度统计代理
- `GET /getlifeabout` - 爬取动态数据

### 3. API 代理

- **B站 API** - `/x/web-interface/card`
- **B站图片** - `/bilibili-img/*`, `/bilibili-img-i1/*`, `/bilibili-img-i2/*`

## 数据存储

当前使用 JSON 文件存储（Demo 阶段）：

- `lifelogs.json` - 设备使用日志（最多 30 条）
- `cloudmusic_logs.json` - 音乐播放记录（最多 15 条）
- `focus_tasks.json` - 专注任务数据

## API 鉴权

需要鉴权的接口需要在请求头中携带密钥：

```javascript
headers: {
  'X-Auth-Key': 'your_secret_key',
  'Content-Type': 'application/json'
}
```

密钥在 `.env` 文件的 `SECRET_KEY` 中配置。

## 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `PORT` | 服务器端口 | 否 | 3000 |
| `SECRET_KEY` | API 鉴权密钥 | 是 | - |
| `BAIDU_STAT_TOKEN` | 百度统计 Token | 否 | - |
| `XINGZHE_TOKEN` | 行者运动 Token | 否 | - |
| `WEBSITE_ROOT` | 网站根目录 | 否 | - |
| `JS_DIRECTORY` | JS 目录 | 否 | - |
| `SCRAPE_TARGET_URL` | 爬取目标 URL | 否 | - |

## 生产部署

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name mylifetracker-backend

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.IO 支持
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 开发注意事项

1. **环境变量** - 敏感信息必须通过 `.env` 配置，不要硬编码
2. **鉴权验证** - 所有写入操作必须验证 `X-Auth-Key`
3. **错误处理** - 所有 API 端点必须有完整的 try-catch
4. **CORS 配置** - 在 `ALLOWED_ORIGINS` 中添加允许的域名
5. **数据清理** - 定期清理过期数据，避免文件过大

## 依赖说明

- `express` - Web 框架
- `socket.io` - 实时通信
- `axios` - HTTP 客户端
- `jsdom` - HTML 解析
- `http-proxy-middleware` - API 代理
- `dotenv` - 环境变量管理

## 故障排查

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Socket.IO 连接失败

1. 检查 CORS 配置中是否包含前端域名
2. 确认防火墙是否开放端口
3. 查看浏览器控制台的错误信息

### 数据文件损坏

删除对应的 JSON 文件，服务器会自动重新创建：

```bash
rm lifelogs.json cloudmusic_logs.json focus_tasks.json
```

## 许可证

ISC License
