# AutoTask 配置指南

本文档提供 AutoTask 的基本配置思路和要点，帮助你快速上手。

## 关于 AutoTask

**项目地址：** [xjunz/AutoTask](https://github.com/xjunz/AutoTask)

AutoTask 是一个功能强大的 Android 自动化助手应用，支持：
- ✅ Shizuku 模式（无需无障碍权限）
- ✅ 无障碍服务模式
- ✅ 流程图式配置
- ✅ 完全免费开源

## 前置准备

### 1. 安装应用

从 [GitHub Releases](https://github.com/xjunz/AutoTask/releases) 下载并安装：
- AutoTask APK
- Shizuku APK（如果使用 Shizuku 模式）

### 2. 选择运行模式

#### 模式 A：Shizuku 模式（推荐）

**优势：**
- 无需无障碍权限
- 权限更精细，更安全
- 性能更好
- 不会被系统限制

**配置步骤：**
1. 安装并启动 Shizuku 应用
2. 在 Shizuku 中启动服务（需要 ADB 或 Root）
3. 在 AutoTask 中选择 Shizuku 模式
4. 授予 AutoTask 使用 Shizuku 的权限

#### 模式 B：无障碍服务模式

**优势：**
- 无需额外应用
- 配置简单
- 兼容性好

**配置步骤：**
1. 在 AutoTask 中选择无障碍服务模式
2. 授予无障碍服务权限
3. 将 AutoTask 加入电池优化白名单

## 配置要点

### 需要实现的功能

1. **锁屏事件监听**
   - 触发条件：屏幕关闭
   - 执行动作：上传锁屏状态到后端

2. **解锁事件监听**
   - 触发条件：屏幕开启
   - 执行动作：上传解锁状态和当前应用信息

3. **应用切换监听（可选）**
   - 触发条件：前台应用改变
   - 执行动作：上传新应用信息

### HTTP 请求配置

**API 端点：** `POST /postStalin`

**请求头：**
```
Content-Type: application/json
X-Auth-Key: your_secret_key
```

**锁屏请求体：**
```json
{
  "device": "设备名称",
  "status": false,
  "battery": 85,
  "is_charging": false
}
```

**解锁请求体：**
```json
{
  "device": "设备名称",
  "status": true,
  "battery": 85,
  "is_charging": false,
  "app_package": "com.example.app"
}
```

## 配置流程（概要）

### 1. 创建任务流程

在 AutoTask 中创建新的自动化流程：

1. 打开 AutoTask
2. 创建新流程
3. 设置流程名称（如：上传设备日志）
4. 配置触发条件
5. 添加执行动作
6. 保存并启用

### 2. 配置触发条件

**锁屏触发：**
- 事件类型：屏幕状态
- 条件：屏幕关闭

**解锁触发：**
- 事件类型：屏幕状态
- 条件：屏幕开启

### 3. 配置执行动作

**动作类型：** HTTP 请求

**配置项：**
- 请求方法：POST
- URL：`https://api.jiclub.site/postStalin`
- 请求头：添加 Content-Type 和 X-Auth-Key
- 请求体：JSON 格式的设备信息

### 4. 获取系统信息

在 AutoTask 中获取以下系统信息：

- 电池电量：使用系统变量
- 充电状态：使用系统变量
- 前台应用：使用应用检测功能
- 设备名称：手动设置或使用系统属性

### 5. 测试和调试

1. 启用流程
2. 锁屏/解锁手机
3. 查看 AutoTask 日志
4. 检查后端是否收到数据
5. 根据日志调整配置

## 常见问题

### Q：如何启动 Shizuku 服务？

A：有两种方式：

**方式 1：通过 ADB（推荐）**
```bash
adb shell sh /storage/emulated/0/Android/data/moe.shizuku.privileged.api/start.sh
```

**方式 2：通过 Root**
- 在 Shizuku 应用中直接启动
- 需要授予 Root 权限

### Q：AutoTask 被系统杀后台怎么办？

A：
1. 将 AutoTask 加入电池优化白名单
2. 允许 AutoTask 自启动
3. 在最近任务中锁定 AutoTask
4. 使用 Shizuku 模式（更不容易被杀）

### Q：如何查看 AutoTask 日志？

A：
1. 打开 AutoTask
2. 进入设置或日志页面
3. 查看任务执行记录
4. 检查错误信息

### Q：HTTP 请求失败怎么办？

A：检查以下几点：
1. 网络连接是否正常
2. API 地址是否正确
3. 鉴权密钥是否正确
4. 请求体格式是否正确
5. 后端服务器是否运行

## 高级配置

### 添加防抖延迟

为避免频繁上传，可以添加延迟：
- 在 HTTP 请求前添加等待动作
- 延迟时间：2-5 秒

### 添加网络检查

确保有网络时才上传：
- 添加网络状态检查条件
- 如果无网络，跳过上传或稍后重试

### 添加错误处理

处理上传失败的情况：
- 捕获 HTTP 错误
- 记录失败日志
- 可选：稍后重试

### 批量上传

如果担心频繁上传影响性能：
- 本地缓存数据
- 定时批量上传
- 减少网络请求次数

## 导出和分享配置

配置完成后，可以导出配置文件：

1. 在 AutoTask 中选择流程
2. 导出配置文件
3. 分享给其他设备
4. 在其他设备上导入配置

## 获取详细教程

如需更详细的配置教程、截图说明或配置文件，请联系项目作者：

- 📧 通过 GitHub Issues 提问
- 💬 加入项目讨论群
- 📝 查看项目文档

## 相关资源

- [AutoTask GitHub](https://github.com/xjunz/AutoTask)
- [Shizuku GitHub](https://github.com/RikkaApps/Shizuku)
- [后端 API 文档](../server-up/README.md)
- [Android 客户端文档](./README.md)

## 注意事项

1. **隐私保护**
   - 仅上传必要的设备信息
   - 不要上传敏感数据
   - 使用 HTTPS 加密传输

2. **性能优化**
   - 避免过于频繁的上传
   - 使用防抖机制
   - 合理设置上传间隔

3. **电池优化**
   - 将应用加入白名单
   - 避免不必要的后台活动
   - 使用 Shizuku 模式更省电

4. **兼容性**
   - 不同 Android 版本可能有差异
   - 不同厂商系统可能有限制
   - 建议在 Android 8.0+ 使用

## 许可证

本配置指南遵循项目主许可证（ISC License）。

AutoTask 项目遵循其自身的开源许可证，详见其 GitHub 仓库。
