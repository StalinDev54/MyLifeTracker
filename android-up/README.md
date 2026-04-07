# Android 设备日志上传客户端

Android 客户端应用，用于自动监听和上传手机使用状况到后端服务器。

## 功能特性

- ✅ 自动监听手机锁屏/解锁状态
- ✅ 记录当前运行的应用信息
- ✅ 监测电池电量和充电状态
- ✅ 自动上传设备使用日志到后端
- ✅ 支持后台运行和自动启动
- ✅ 断网重连自动补传数据

## 实现方式

推荐使用以下工具实现：

### 方案一：AutoTask（推荐）

**项目地址：** [xjunz/AutoTask](https://github.com/xjunz/AutoTask)

AutoTask 是一个支持 Shizuku 和无障碍服务的自动化助手应用，功能强大且免费开源。

**优势：**
- ✅ 完全免费开源
- ✅ 支持 Shizuku 模式（无需无障碍权限）
- ✅ 支持无障碍服务模式
- ✅ 流程图式配置，直观易用
- ✅ 功能强大，支持复杂的自动化任务
- ✅ 活跃维护，社区支持良好

**使用说明：**

本项目使用 AutoTask 实现设备日志自动上传功能。详细配置教程请联系项目作者获取。

**基本配置思路：**
1. 创建锁屏/解锁监听任务
2. 配置 HTTP 请求动作
3. 设置请求头和请求体
4. 测试并启用任务

> 💡 如需详细的 AutoTask 配置教程，请联系项目作者。

### 方案二：Tasker / MacroDroid
### 方案三：自定义 Android 应用

使用 Android Studio 开发原生应用，监听系统广播和前台服务。
#### 任务配置示例

**1. 锁屏事件监听**
- 触发条件：屏幕关闭（Screen Off）
- 执行动作：
  - 获取电池电量
  - 获取充电状态
  - 发送 HTTP POST 请求到后端 API

**2. 解锁事件监听**
- 触发条件：屏幕开启（Screen On）
- 执行动作：
  - 获取当前前台应用包名和应用名
  - 获取电池电量
  - 获取充电状态
  - 发送 HTTP POST 请求到后端 API

**3. 应用切换监听**
- 触发条件：应用切换（App Changed）
- 执行动作：
  - 获取新应用的包名和应用名
  - 发送 HTTP POST 请求到后端 API

### 方案二：自定义 Android 应用

使用 Android Studio 开发原生应用，监听系统广播和前台服务。

## API 接口说明

### 上传设备日志

**接口地址：** `POST /postStalin`

**请求头：**
```
Content-Type: application/json
X-Auth-Key: your_secret_key
```

**请求体：**
```json
{
  "device": "设备名称（如：Xiaomi 12）",
  "status": true,  // true=解锁，false=锁屏
  "battery": 85,   // 电池电量（0-100）
  "is_charging": false,  // 是否正在充电
  "app_name": "微信",  // 当前应用名称（可选）
  "app_package": "com.tencent.mm",  // 应用包名（可选）
  "time": 1234567890,  // Unix 时间戳（可选，默认使用服务器时间）
  "ip": "192.168.1.100"  // 设备 IP（可选）
}
```

**响应示例：**
```json
{
  "device": "Xiaomi 12",
  "status": true,
  "battery": 85,
  "is_charging": false,
  "time": 1234567890,
  "ip": "192.168.1.100",
  "app_name": "微信",
  "app_package": "com.tencent.mm"
}
```

## Tasker 配置示例

### 1. 创建任务：上传锁屏状态

**任务名称：** Upload Lock Status

**动作步骤：**

1. **变量设置**
   - 名称：`%DEVICE_NAME`
   - 值：`Xiaomi 12`（替换为你的设备名称）

2. **变量设置**
   - 名称：`%API_URL`
   - 值：`https://api.jiclub.site/postStalin`（替换为你的后端地址）

3. **变量设置**
   - 名称：`%AUTH_KEY`
   - 值：`your_secret_key`（替换为你的鉴权密钥）

4. **HTTP 请求**
   - 方法：POST
   - URL：`%API_URL`
   - 请求头：
     ```
     Content-Type: application/json
     X-Auth-Key: %AUTH_KEY
     ```
   - 请求体：
     ```json
     {
       "device": "%DEVICE_NAME",
       "status": false,
       "battery": %BATT,
       "is_charging": %CHARGING
     }
     ```

### 2. 创建任务：上传解锁状态

**任务名称：** Upload Unlock Status

**动作步骤：**

1-3. （同上，设置变量）

4. **获取前台应用**
   - 使用 Tasker 的 `%WIN` 变量获取当前应用

5. **HTTP 请求**
   - 方法：POST
   - URL：`%API_URL`
   - 请求头：
     ```
     Content-Type: application/json
     X-Auth-Key: %AUTH_KEY
     ```
   - 请求体：
     ```json
     {
       "device": "%DEVICE_NAME",
       "status": true,
       "battery": %BATT,
       "is_charging": %CHARGING,
       "app_package": "%WIN"
     }
     ```

### 3. 创建配置文件（Profile）

**配置文件 1：锁屏监听**
- 事件：Display Off
- 任务：Upload Lock Status

**配置文件 2：解锁监听**
- 事件：Display On
- 任务：Upload Unlock Status

## MacroDroid 配置示例

### 宏 1：锁屏上传

**触发器：**
- 屏幕关闭

**动作：**
1. HTTP 请求
   - 方法：POST
   - URL：`https://api.jiclub.site/postStalin`
   - 请求头：
     ```
     Content-Type: application/json
     X-Auth-Key: your_secret_key
     ```
   - 请求体：
     ```json
     {
       "device": "Xiaomi 12",
       "status": false,
       "battery": {battery_level},
       "is_charging": {is_charging}
     }
     ```

### 宏 2：解锁上传

**触发器：**
- 屏幕开启

**动作：**
1. HTTP 请求
   - 方法：POST
## 配置步骤

### 使用 AutoTask（推荐）

#### 1. 安装自动化应用

推荐应用（任选其一）：
- **AutoTask**（免费开源，功能强大，推荐）
- **Tasker**（付费，功能最强大）
- **MacroDroid**（免费版有限制，付费版功能完整）
- **AutomateIt**（免费，功能简单）
- **Automate**（免费，流程图式配置）

#### 2. 配置后端地址和密钥

**模式 A：Shizuku 模式（推荐）**
#### 3. 创建自动化任务

按照上述示例创建锁屏和解锁监听任务。

#### 4. 测试功能
**模式 B：无障碍服务模式**
- 无需额外应用
- 需要授予无障碍权限
- 兼容性更好

#### 5. 授予必要权限任务

详细配置步骤请联系项目作者获取教程文档。

**基本配置要点：**
- 创建锁屏/解锁事件监听
- 配置 HTTP POST 请求
- 设置 API 地址和鉴权密钥
- 配置请求体 JSON 格式
- 测试并启用任务

#### 4. 授予必要权限

根据选择的模式授予相应权限：
- Shizuku 模式：启动 Shizuku 服务
- 无障碍模式：授予无障碍服务权限
- 电池优化白名单
- 自启动权限

### 使用 Tasker / MacroDroid
     Content-Type: application/json
     X-Auth-Key: your_secret_key
     ```
   - 请求体：
     ```json
     {
       "device": "Xiaomi 12",
       "status": true,
       "battery": {battery_level},
       "is_charging": {is_charging},
       "app_package": "{foreground_app}"
     }
     ```

## 权限要求

使用自动化应用需要授予以下权限：

- ✅ 无障碍服务（Accessibility Service）- 用于获取前台应用
- ✅ 电池优化白名单 - 允许后台运行
- ✅ 自启动权限 - 开机自动启动
- ✅ 网络权限 - 上传数据到服务器

## 配置步骤

### 1. 安装自动化应用

推荐应用（任选其一）：
- **Tasker**（付费，功能最强大）
- **MacroDroid**（免费版有限制，付费版功能完整）
- **AutomateIt**（免费，功能简单）
- **Automate**（免费，流程图式配置）

### 2. 配置后端地址和密钥

在自动化任务中设置：
- API 地址：`https://your-domain.com/postStalin`
- 鉴权密钥：与 `server-up/.env` 中的 `SECRET_KEY` 保持一致

### 3. 创建自动化任务

按照上述示例创建锁屏和解锁监听任务。

### 4. 测试功能

1. 锁屏手机，检查后端是否收到锁屏日志
2. 解锁手机，检查后端是否收到解锁日志
3. 切换应用，检查是否记录应用信息

### 5. 授予必要权限

确保自动化应用已获得所有必要权限，特别是：
- 无障碍服务
- 后台运行权限
- 自启动权限

## 数据说明

### 设备状态字段

| 字段 | 类型 | 说明 | 必需 |
|------|------|------|------|
| `device` | string | 设备名称 | 是 |
| `status` | boolean | 锁屏状态（true=解锁，false=锁屏） | 是 |
| `battery` | number | 电池电量（0-100） | 是 |
| `is_charging` | boolean | 是否正在充电 | 是 |
| `app_name` | string | 应用名称 | 否 |
| `app_package` | string | 应用包名 | 否 |
| `time` | number | Unix 时间戳 | 否 |
| `ip` | string | 设备 IP 地址 | 否 |

### 特殊处理逻辑

后端会自动处理以下情况：

1. **锁屏状态更新**
   - 同一设备的锁屏状态会被更新而不是新增
   - 保留首次锁屏的记录（`firstLockRecord`）

2. **电量更新**
   - 非锁屏状态下的电量变化会更新现有记录
   - 避免频繁创建新记录

3. **数据限制**
   - 后端最多保留 30 条设备日志
   - 超过限制会自动删除最旧的记录

## 故障排查

### 数据未上传

1. **检查网络连接**
   - 确保手机可以访问后端服务器
   - 测试 API 地址是否可访问

## 推荐应用下载

- **[AutoTask](https://github.com/xjunz/AutoTask/releases)** - 免费开源，推荐使用
- [Shizuku](https://github.com/RikkaApps/Shizuku/releases) - AutoTask 的 Shizuku 模式需要
- [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm)
- [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)
- [AutomateIt](https://play.google.com/store/apps/details?id=AutomateIt.mainPackage)
- [Automate](https://play.google.com/store/apps/details?id=com.llamalab.automate)

## 获取 AutoTask 配置教程

如需详细的 AutoTask 配置教程和示例文件，请通过以下方式联系项目作者：

- 📧 通过项目 Issues 提问
- 💬 加入项目讨论群
- 📝 查看项目 Wiki 文档

> 💡 提示：AutoTask 配置完成后，可以导出配置文件分享给其他设备使用。
   - 确认鉴权密钥与后端一致
   - 检查请求体格式是否正确

4. **查看日志**
   - 在自动化应用中查看任务执行日志
   - 检查是否有错误信息

### 应用信息获取失败

1. **授予无障碍权限**
   - 设置 → 无障碍 → 启用自动化应用

2. **检查应用兼容性**
   - 某些系统可能限制获取前台应用
   - 尝试使用其他自动化应用

### 后台被杀

1. **加入电池优化白名单**
   - 设置 → 电池 → 电池优化 → 选择"不优化"

2. **允许自启动**
   - 设置 → 应用管理 → 自启动管理 → 允许

3. **锁定后台**
   - 在最近任务中锁定自动化应用

## 安全建议

1. **使用 HTTPS**
   - 生产环境必须使用 HTTPS 加密传输
   - 避免明文传输敏感数据

2. **保护鉴权密钥**
   - 不要在公开场合分享密钥
   - 定期更换密钥

3. **限制上传频率**
   - 避免过于频繁的上传
   - 可以设置最小上传间隔（如 5 秒）

4. **数据隐私**
   - 仅上传必要的数据
   - 不要上传敏感的个人信息

## 开发计划

未来可能开发的功能：

- [ ] 原生 Android 应用
- [ ] 更详细的应用使用时长统计
- [ ] 位置信息记录（可选）
- [ ] 网络流量统计
- [ ] 屏幕使用时长分析
- [ ] 本地数据缓存和批量上传
- [ ] 数据加密传输

## 相关链接

- [MyLifeTracker 主项目](../)
- [后端服务器文档](../server-up/README.md)
- [后端 API 文档](../server-up/README.md#api-端点)

## 推荐应用下载

- [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm)
- [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)
- [AutomateIt](https://play.google.com/store/apps/details?id=AutomateIt.mainPackage)
- [Automate](https://play.google.com/store/apps/details?id=com.llamalab.automate)

## 许可证

ISC License
https://github.com/xjunz/AutoTask