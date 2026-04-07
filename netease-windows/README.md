# 网易云音乐播放状态监听服务

实时监听 Windows 网易云音乐客户端的播放状态，并自动上传到后端服务器。

## 功能特性

- ✅ 实时检测当前播放歌曲信息（歌曲 ID、名称、艺术家、专辑）
- ✅ 监听播放/暂停状态变化
- ✅ 跟踪播放进度（支持进度条拖拽）
- ✅ 检测单曲循环重新播放
- ✅ 防抖机制避免频繁上传
- ✅ 自动同步到后端服务器
- ✅ 支持 TypeScript 类型安全

## 环境要求

- **Node.js:** 版本 20.6.0 或更高
- **操作系统:** Windows（需要安装网易云音乐 Windows 客户端）
- **网易云音乐客户端:** 必须安装并运行

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 后端 API 地址
API_URL=http://localhost:3000/api/cloudmusic

# 鉴权密钥（与 server-up 的 SECRET_KEY 保持一致）
AUTH_KEY=your_secret_key_here
```

### 3. 启动服务

**开发模式（推荐）：**

```bash
npm run dev
```

**或者在 Windows 上双击：**

```
start-dev.bat
```

**生产模式：**

```bash
npm run build
npm start
```

## 工作原理

1. **数据库读取**
   - 服务会自动定位网易云音乐客户端的本地 SQLite 数据库
   - 数据库通常位于：`%LOCALAPPDATA%\Netease\CloudMusic\`

2. **状态检测**
   - 使用 `better-sqlite3` 读取数据库中的播放状态
   - 实时监听歌曲 ID、播放状态、播放进度的变化

3. **事件触发**
   - `play` - 切歌或重新播放时触发
   - `status` - 播放/暂停状态改变时触发
   - `position` - 播放进度改变时触发

4. **数据上传**
   - 使用防抖机制（1秒延迟）避免频繁上传
   - 仅在状态发生实质性变化时上传
   - 通过 HTTP POST 请求上传到后端 API

## 上传的数据格式

```json
{
  "available": true,
  "id": 123456789,
  "playing": true,
  "position": 45.5,
  "duration": 240.0,
  "detail": {
    "name": "歌曲名称",
    "artist": "艺术家",
    "album": "专辑名称"
  },
  "timestamp": 1234567890,
  "updateType": "play",
  "requestId": "unique-request-id"
}
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（热重载） |
| `npm run dev-bun` | 使用 Bun 运行开发模式 |
| `npm run build` | 编译 TypeScript 到 JavaScript |
| `npm start` | 生产模式运行 |
| `npm run start-bun` | 使用 Bun 运行生产模式 |

## 依赖说明

- `better-sqlite3` - 读取网易云音乐的 SQLite 数据库
- `axios` - 发送 HTTP 请求到后端 API
- `nanobus` - 事件总线，处理状态变化事件
- `typescript` - TypeScript 支持
- `tsx` - TypeScript 执行器（开发模式）

## 故障排查

### 服务无法启动

1. 检查 Node.js 版本是否 >= 20.6.0
2. 确保已安装所有依赖：`npm install`
3. 检查 `.env` 文件是否正确配置

### 无法检测到播放状态

1. 确保网易云音乐客户端正在运行
2. 检查数据库文件是否存在
3. 确认有读取数据库文件的权限
4. 尝试重启网易云音乐客户端

### 数据未上传到后端

1. 检查后端服务器是否运行（`http://localhost:3000`）
2. 确认 `.env` 中的 `API_URL` 配置正确
3. 确认 `AUTH_KEY` 与后端的 `SECRET_KEY` 一致
4. 查看控制台错误信息

### 频繁上传导致性能问题

服务已内置防抖机制（1秒延迟），正常情况下不会频繁上传。如果仍有问题：
1. 检查是否有多个实例同时运行
2. 调整 `UPLOAD_DEBOUNCE_DELAY` 参数（在 `src/index.ts` 中）

## 开发说明

### 项目结构

```
netease-windows/
├── src/
│   ├── cloudmusic-detector/    # 网易云音乐检测器核心
│   │   ├── index.ts            # 检测器主类
│   │   └── types.ts            # TypeScript 类型定义
│   ├── index.ts                # 主入口文件
│   └── utils.ts                # 工具函数
├── scripts/
│   └── register.js             # 注册脚本
├── .env.example                # 环境变量示例
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript 配置
└── start-dev.bat               # Windows 快速启动脚本
```

### 修改防抖延迟

在 `src/index.ts` 中修改：

```typescript
const UPLOAD_DEBOUNCE_DELAY = 1000; // 毫秒
```

### 添加新的事件监听

```typescript
detector.on('play', (songId) => {
  console.log('切歌:', songId);
  // 自定义处理逻辑
});

detector.on('status', (playing) => {
  console.log('播放状态:', playing ? '播放中' : '已暂停');
  // 自定义处理逻辑
});

detector.on('position', (position) => {
  console.log('播放进度:', position);
  // 自定义处理逻辑
});
```

## 注意事项

1. **隐私保护**
   - 服务仅读取播放状态，不会收集个人信息
   - 不会修改网易云音乐的任何数据
   - 上传的数据仅包含歌曲信息和播放状态

2. **性能影响**
   - 服务对系统资源占用极小
   - 不会影响网易云音乐客户端的性能
   - 采用防抖机制避免频繁操作

3. **兼容性**
   - 当前仅支持 Windows 平台
   - 需要网易云音乐 Windows 客户端
   - 不同版本的客户端数据库结构可能有差异

## 许可证

ISC License

## 相关链接

- [MyLifeTracker 主项目](../)
- [后端服务器文档](../server-up/README.md)
- [网易云音乐官网](https://music.163.com/)
