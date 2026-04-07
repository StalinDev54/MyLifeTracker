# Tasker 配置快速指南

这是一个详细的 Tasker 配置示例，帮助你快速设置设备日志自动上传功能。

## 前置准备

1. 安装 Tasker 应用
2. 授予 Tasker 无障碍服务权限
3. 将 Tasker 加入电池优化白名单
4. 获取后端 API 地址和鉴权密钥

## 配置步骤

### 第一步：创建全局变量

在 Tasker 主界面，点击右上角 "变量" 标签：

1. 点击 "+" 创建新变量
2. 创建以下全局变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `%API_URL` | `https://api.jiclub.site/postStalin` | 后端 API 地址 |
| `%AUTH_KEY` | `your_secret_key` | 鉴权密钥 |
| `%DEVICE_NAME` | `Xiaomi 12` | 你的设备名称 |

### 第二步：创建任务 - 上传锁屏状态

1. 点击 "任务" 标签
2. 点击 "+" 创建新任务
3. 任务名称：`Upload Lock Status`
4. 添加以下动作：

#### 动作 1：HTTP 请求

- 类型：`网络` → `HTTP 请求`
- 配置：
  - 方法：`POST`
  - URL：`%API_URL`
  - 请求头：
    ```
    Content-Type:application/json
    X-Auth-Key:%AUTH_KEY
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
  - 超时（秒）：`10`

#### 动作 2：通知（可选，用于调试）

- 类型：`警告` → `通知`
- 配置：
  - 标题：`设备日志`
  - 文本：`已上传锁屏状态`

### 第三步：创建任务 - 上传解锁状态

1. 点击 "任务" 标签
2. 点击 "+" 创建新任务
3. 任务名称：`Upload Unlock Status`
4. 添加以下动作：

#### 动作 1：获取前台应用

- 类型：`应用` → `获取应用信息`
- 配置：
  - 包名：`%WIN`
  - 存储到：`%app_package`

#### 动作 2：HTTP 请求

- 类型：`网络` → `HTTP 请求`
- 配置：
  - 方法：`POST`
  - URL：`%API_URL`
  - 请求头：
    ```
    Content-Type:application/json
    X-Auth-Key:%AUTH_KEY
    ```
  - 请求体：
    ```json
    {
      "device": "%DEVICE_NAME",
      "status": true,
      "battery": %BATT,
      "is_charging": %CHARGING,
      "app_package": "%app_package"
    }
    ```
  - 超时（秒）：`10`

### 第四步：创建配置文件 - 锁屏触发

1. 点击 "配置文件" 标签
2. 点击 "+" 创建新配置文件
3. 选择 `事件` → `显示` → `显示关闭`
4. 返回后选择任务：`Upload Lock Status`

### 第五步：创建配置文件 - 解锁触发

1. 点击 "配置文件" 标签
2. 点击 "+" 创建新配置文件
3. 选择 `事件` → `显示` → `显示开启`
4. 返回后选择任务：`Upload Unlock Status`

### 第六步：测试配置

1. 锁屏手机，等待 2-3 秒
2. 解锁手机
3. 检查后端是否收到日志数据
4. 如果有问题，查看 Tasker 的运行日志

## 高级配置

### 添加应用切换监听

如果想监听应用切换事件：

1. 创建新任务：`Upload App Change`
2. 添加 HTTP 请求动作（同上）
3. 创建配置文件：
   - 事件：`应用` → `应用已更改`
   - 任务：`Upload App Change`

### 添加防抖延迟

为避免频繁上传，可以添加延迟：

1. 在 HTTP 请求动作前添加：
   - 类型：`任务` → `等待`
   - 秒数：`2`

### 添加网络检查

确保有网络连接时才上传：

1. 在 HTTP 请求动作前添加：
   - 类型：`网络` → `测试网络`
   - 如果失败，跳过后续动作

## 常见问题

### Q：为什么没有上传数据？

A：检查以下几点：
1. Tasker 是否有无障碍权限
2. Tasker 是否在电池优化白名单
3. 网络是否正常
4. API 地址和密钥是否正确
5. 查看 Tasker 运行日志

### Q：如何查看 Tasker 运行日志？

A：
1. 打开 Tasker
2. 点击右上角三个点
3. 选择 "运行日志"
4. 查看任务执行情况和错误信息

### Q：电池消耗会增加吗？

A：
- 正常情况下电池消耗很小
- 建议将 Tasker 加入电池优化白名单
- 避免过于频繁的上传（建议至少间隔 2 秒）

## 导出和分享配置

配置完成后，可以导出配置文件：

1. 长按配置文件
2. 选择 "导出"
3. 选择导出位置
4. 分享给其他设备使用

## 备份建议

定期备份 Tasker 配置：

1. Tasker 主界面
2. 右上角三个点
3. 选择 "数据" → "备份"
4. 保存备份文件到安全位置

## 相关资源

- [Tasker 官方文档](https://tasker.joaoapps.com/userguide/en/)
- [Tasker 中文教程](https://www.reddit.com/r/tasker/)
- [后端 API 文档](../server-up/README.md)
