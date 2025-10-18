<template>
  <!-- iOS风格一言展示区域 -->
  <iOSPullToRefresh :refreshing="isRefreshing" @refresh="handleRefresh">

    <div class="profile-view">
      <mdui-card class="profile-card mdui-hoverable">

        <IOSStatusBarPlayer :deviceStatus="deviceStatus" :currentActivity="currentActivity" :appIconMap="appIconMap"
          @music-playing-status-changed="handleMusicPlayingStatusChanged" />
        <!-- 卡片头部 -->
        <div class="mdui-card-content profile-header">
          <div class="mdui-flex mdui-flex-wrap">
            <!-- 头像与徽标 -->
            <div class="avatar-container" @dblclick="handleAvatarDoubleClick">
              <img src="https://q2.qlogo.cn/headimg_dl?dst_uin=1545433540&spec=100" alt="个人头像" class="avatar-image" />
              <!-- 双击头像可实现戳一戳功能 -->
              <!-- 状态徽标 -->
              <div class="avatar-badge status-badge"
                :class="{ 'life-pulse': currentStatus.isOnline && !musicPlayingState.isPlaying, 'online-status': currentStatus.isOnline && !musicPlayingState.isPlaying, 'music-playing': musicPlayingState.isPlaying }"
                :style="{ backgroundColor: musicPlayingState.isPlaying ? '#2196F3' : (currentStatus.isOnline ? '#4CAF50' : currentStatus.color) }"
                @click="showAppStatusTooltip">
                <mdui-icon :name="currentStatus.icon" class="status-icon"></mdui-icon>
              </div>
            </div>

            <!-- 个人信息 -->
            <div class="mdui-flex-grow-1 profile-info">
              <div class="mdui-flex mdui-items-center">
                <h2 class="profile-name">Cталин</h2>

              </div>

              <!-- 灵动岛音乐播放器 -->

              <!-- ip属地展示 -->
              <div class="ip-location-container  mdui-m-t-2">

                <span class="ip-location-label">IP:{{ (regionData && regionData.region) ? regionData.region : '未知'
                }}</span>

              </div>












              <!-- <div class="ios-battery-container mdui-flex mdui-items-center">
                <div style=" color: #999; font-size: x-small;">最近上线于</div>
              </div> -->


            </div>

            <!-- 媒体信息跳转区域 -->
            <div class="media-info-container">
              <div class="dropdown-container">
                <mdui-button @click="toggleDropdownMenu" variant="outlined" size="small" class="social-media-button">
                  <mdui-icon name="webhook" style="margin: 5px;" class="media-icon"></mdui-icon>
                </mdui-button>

                <!-- 下拉菜单 -->
                <div v-if="isDropdownOpen" class="dropdown-menu">
                  <div class="dropdown-item" @click="handleDropdownOption('投喂')">
                    <mdui-icon name="fastfood" size="14" class="dropdown-icon"></mdui-icon>
                    <span class="dropdown-text">投喂</span>
                  </div>

                  <!-- <div class="dropdown-item" @click="handleDropdownOption('发消息')">
                    <mdui-icon name="chat" size="14" class="dropdown-icon"></mdui-icon>
                    <span class="dropdown-text">发消息</span>
                  </div> -->
                  <div class="dropdown-item" @click="handleDropdownOption('媒体')">
                    <mdui-icon name="image" size="14" class="dropdown-icon"></mdui-icon>
                    <span class="dropdown-text">媒体</span>
                  </div>

                  <div class="dropdown-item" @click="handleDropdownOption('博客')">
                    <mdui-icon name="article" size="14" class="dropdown-icon"></mdui-icon>
                    <span class="dropdown-text">博客</span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载状态和错误信息显示区域 -->
        <div v-if="isLoading" class="mdui-card-content loading-container">
          <div class="mdui-flex mdui-items-center mdui-justify-center">
            <mdui-spinner size="small" class="loading-spinner"></mdui-spinner>
            <span class="loading-text mdui-m-l-2">正在获取最新状态...</span>
          </div>
        </div>

        <div v-else-if="loadingError" class="mdui-card-content error-container">
          <div class="mdui-flex mdui-items-center mdui-justify-between">
            <div class="mdui-flex mdui-items-center">
              <mdui-icon name="error" class="error-icon"></mdui-icon>
              <span class="error-text mdui-m-l-2">{{ loadingError }}</span>
            </div>
            <mdui-button @click="fetchStatusData" variant="text" size="small" class="retry-button">
              重试
            </mdui-button>
          </div>
        </div>




        <IOSHitokoto />


        <!-- 实时状态和活动应用 -->
        <div class="mdui-divider"></div>
        <div class="mdui-card-content status-container">
          <div class="mdui-flex mdui-items-center mdui-justify-between">
            <div class="mdui-flex mdui-items-center">
              <mdui-button :icon="deviceIcons[deviceStatus.device]" variant="outlined" @click="showAppStatusTooltip"
                class="status-button mdui-ripple">
                <span style="  animation: fadeIn 0.9s ease-in-out;
" class="status-label">状态:</span>
                <span class="status-text mdui-m-l-2" :style="{ color: currentStatus.color }">
                  {{ currentStatus.label }}
                </span>
                <mdui-icon name="chevron_right" class="status-arrow"></mdui-icon>
              </mdui-button>


              <!-- IP地址显示 (在大屏幕上显示) -->
              <div class="ip-address mdui-hidden-xs-only">
                <span class="ip-label">&nbsp;&nbsp;IP:</span>
                <span class="ip-value">{{ deviceStatus.ip || '未知' }}</span>
                <span class="update-time-info">{{ formatRelativeTime(lastUpdated) }}更新</span>
              </div>
            </div>

            <div class="update-time-container">


              <div style="font-size: small;" v-if="currentActivity.name" class="app-info-group"
                @click="showStatusDetails">
                <span class="update-time">于{{ formatDateTime(statusStartTime) }}开始使用&nbsp; </span>
                <span style="color:  #2196F3;;" class="activity-name"> {{ currentActivity.name }}</span>
                <mdui-icon name="help_outline" class="info-icon" :title="'点击查看详情'" />
              </div>

              <!-- 锁屏状态的美化布局 -->
              <div v-else class="lock-status-container mdui-flex mdui-items-center mdui-justify-between w-full"
                @click="showStatusDetails">
                <div class="mdui-flex mdui-items-center">
                  <div class="lock-icon-container" :style="{ backgroundColor: currentStatus.color + '20' }">
                    <mdui-icon name="lock" class="lock-status-icon" :style="{ color: currentStatus.color }" />
                  </div>
                  <div class="mdui-m-l-2">
                    <div class="mdui-flex mdui-items-center">
                      <span class="update-time">于{{ formatDateTime(firstLockRecord.time) }}&nbsp;</span>

                      <span style="font-size: small; color: #2196F3;" class="lock-status"> {{
                        currentStatus.label }}</span>
                      <mdui-icon name="help_outline" class="info-icon" :title="'点击查看详情'" />
                    </div>
                  </div>
                </div>

                <!-- 近期数据查看模块 -->

              </div>
            </div>


          </div>
        </div>

        <div class="mdui-divider"></div>

        <!-- 动态活动卡片 -->
        <mdui-card variant="outlined" class="activity-card mdui-hoverable">
          <div class="mdui-card-content active-app-section p-4">
            <!-- 锁屏状态显示 -->
            <template v-if="!currentStatus.isOnline">
              <div class="lock-screen-content">
                <div class="lock-screen-header mdui-flex mdui-items-center mb-3">
                  <div class="lock-icon-container" :style="{ backgroundColor: currentStatus.color + '20' }">
                    <mdui-icon name="wind_power" class="lock-status-icon" :style="{ color: currentStatus.color }" />
                  </div>
                  <div class="mdui-m-l-3">
                    <h4 class="lock-status-title" :style="{ color: currentStatus.color }">未在使用设备</h4>

                  </div>
                </div>

                <!-- 近期活动数据统计模块 -->
                <div class="recent-data-section mdui-m-t-1 p-2 rounded-lg" style="background-color: #f8f9fa;">
                  <div style="margin: 4px;" class="mdui-flex mdui-items-center mdui-justify-between mb-1">
                    <h5 class="section-title mdui-text-truncate" style="font-size: 0.75rem;">
                      <mdui-icon name="trending_up" size="14" class="mdui-m-r-1" style="color: #2196F3;"></mdui-icon>
                      近期活动统计
                    </h5>
                    <!-- <span class="total-duration-desc" style="font-size: 0.7rem;">
                      {{ formatDuration(totalDuration) }}内：
                    </span> -->
                  </div>

                  <!-- 数据概览卡片 -->
                  <div class="recent-stats mdui-flex mdui-flex-wrap gap-2 mdui-m-t-0">
                    <!-- 活动记录统计项 -->
                    <div class="stat-item mdui-card p-2 mdui-hoverable" @click="navigateToRecentActivities"
                      style="min-width: 60px;">
                      <div class="mdui-flex mdui-flex-col items-center">
                        <div style="margin: 2px;" class="mdui-icon-wrapper bg-primary/10 p-1 rounded-full mb-1">
                          <mdui-icon name="history" size="14" style="color: #2196F3;"></mdui-icon>
                        </div>
                        <div class="stat-number mdui-text-center font-bold text-primary" style="font-size: 0.8rem;">{{
                          processedActivityRecords.length || 0 }}</div>
                        <div class="stat-label mdui-text-center text-xs text-gray-600">活动记录</div>
                      </div>
                    </div>

                    <!-- 总使用时长统计项 -->
                    <div class="stat-item mdui-card p-2 mdui-hoverable" @click="navigateToRecentActivities"
                      style="min-width: 60px;">
                      <div class="mdui-flex mdui-flex-col items-center">
                        <div style="margin: 2px;" class="mdui-icon-wrapper bg-primary/10 p-1 rounded-full mb-1">
                          <mdui-icon name="timer" size="14" style="color: #2196F3;"></mdui-icon>
                        </div>
                        <div class="stat-number mdui-text-center font-bold text-primary" style="font-size: 0.8rem;">
                          {{ formatDuration(getTotalUsageTime()) }}
                        </div>
                        <div class="stat-label mdui-text-center text-xs text-gray-600">总应用时长</div>
                      </div>
                    </div>

                    <!-- 常用应用统计项 -->
                    <div class="stat-item mdui-card p-2 mdui-hoverable" @click="navigateToRecentActivities"
                      style="min-width: 60px;">
                      <div class="mdui-flex mdui-flex-col items-center">
                        <div style="margin: 2px;" class="mdui-icon-wrapper bg-primary/10 p-1 rounded-full mb-1">
                          <mdui-icon name="apps" size="14" style="color: #2196F3;"></mdui-icon>
                        </div>
                        <div class="stat-number mdui-text-center font-bold text-primary truncate max-w-[80px]"
                          style="font-size: 0.8rem;">
                          {{ getMostUsedApp() }}
                        </div>
                        <div class="stat-label mdui-text-center text-xs text-gray-600">常用应用</div>
                      </div>
                    </div>
                  </div>

                  <!-- 近期数据查看按钮 -->
                  <div class="mdui-flex mdui-justify-center mdui-m-t-2">
                    <mdui-button icon="history" @click="navigateToRecentActivities" variant="text" size="small"
                      color="primary" class="mdui-ripple mdui-hoverable transition-all duration-300 hover:scale-105"
                      style="font-size: 0.75rem;">
                      查看近期活动
                      <mdui-badge variant="tonal" class="ml-1 transition-transform duration-300 hover:scale-110"
                        v-if="processedActivityRecords.length > 0">
                        {{ processedActivityRecords.length }}
                      </mdui-badge>
                    </mdui-button>
                  </div>
                </div>
              </div>
            </template>

            <!-- 正常应用状态显示 -->
            <template v-else>
              <div class="mdui-flex mdui-items-center mdui-justify-between gap-2">
                <!-- 应用图标和信息区域 -->
                <div @click="showAppStatusTooltip" class="mdui-flex mdui-items-center flex-1 min-w-0">
                  <!-- 优先使用实际的应用图标文件 -->
                  <template v-if="currentActivity.name && appIconMap[currentActivity.name]">
                    <img :src="appIconMap[currentActivity.name]" alt="{{ currentActivity.name }}" class="app-icon mr-3"
                      style="width: 24px; height: 24px; border-radius: 6px;">
                  </template>
                  <!-- 否则使用mdui-icon -->
                  <template v-else>
                    <mdui-icon :name="currentActivity.icon" class="app-icon mr-3"></mdui-icon>
                  </template>
                  <div class="active-app-info min-w-0">
                    <h4 class="active-app-name truncate">{{ currentActivity.name }}</h4>
                    <!-- 包名显示 - 优化样式 -->
                    <div v-if="apppackage && apppackage !== 'com.example.app'" class="package-name mdui-text-truncate">
                      <span style="font-size: 0.75rem; color: #2196F3;;">{{ apppackage }}</span>
                    </div>
                    <div class="mdui-flex mdui-items-center mdui-m-t-1">
                      <p class="active-app-status text-sm text-muted truncate mdui-m-r-2">{{ currentActivity.description
                      }}
                      </p>
                      <!-- 其他应用的近期按钮 - 优化样式和位置 -->
                      <mdui-button v-if="apppackage && apppackage !== 'com.example.app'" icon="wb_twilight"
                        @click.stop="navigateToRecentActivities" variant="text" size="small" color="primary"
                        class="mdui-ripple mdui-hoverable">
                        近期活动历史

                        <mdui-badge variant="tonal" class="ml-1 transition-transform duration-300 hover:scale-110"
                          v-if="processedActivityRecords.length > 0">
                          {{ processedActivityRecords.length }}
                        </mdui-badge>
                      </mdui-button>
                    </div>
                  </div>
                </div>

                <!-- 按钮区域 - 优化特定应用的活动记录按钮 -->

              </div>
            </template>
          </div>


        </mdui-card>



      </mdui-card>

      <mdui-card class="profile-card mdui-hoverable">
        <CyclingData v-if="cyclingData" :cycling-data="cyclingData" :cycling-list="cyclingList" />
      </mdui-card>

      <!-- 天气地域模块卡片 -->
      <WeatherRegionCard :ip="deviceStatus.ip" />



      <!-- 社交账号卡片 -->
      <div class="social-accounts-container">
        <!-- 在线人数和Socket连接状态显示 -->
        <SocketStatusDisplay :online-users="onlineUsers" :last-updated-online="lastUpdatedOnline"
          :socket-connected="socketConnected" :socket-id="socketId" />
      </div>



      <!-- 合作商信息显示区域 -->
      <!-- 公安监管认证提示
      <div style="text-align: center;  padding: 1px; border-radius: 6px; ">
        <div
          style="display: inline-flex; align-items: center; padding: 4px 12px; background-color: #fff; border-radius: 20px; border: 1px solid #0066cc;">
          <img src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png" alt="  湘ICP备2025137878号"
            style="height: 18px; margin-right: 6px;" />
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="beian-link">
            湘ICP备2025137878号
          </a>


        </div>


      </div> -->
      <s-divider>

        <img src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png" alt="Powered by Vue.js"
          style="height: 16px;  margin-right: -5px;" />
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="beian-link">
          湘ICP备2025137878号
        </a></s-divider>
      <!-- 
      <s-divider>
        <p style="margin-top: 1px; font-size: 13px; color: #333;">
          本站已依法接入<span style="color: #d32f2f; font-weight: bold;">公安机关网络安全监管系统</span>

        </p>
      </s-divider> -->
    </div>



  </iOSPullToRefresh>
  <!-- 状态详情弹窗组件 -->
  <StatusDialog :visible="isStatusDialogVisible" :start-time="statusStartTime" :current-status="currentStatus"
    :device-status="deviceStatus" :lock-battery-level="lockBatteryLevel" :first-lock-record="firstLockRecord"
    @close="closeStatusDialog" />

  <!-- 应用状态提示弹窗组件 -->
  <AppStatusTooltip :visible="isAppStatusTooltipVisible" :start-time="statusStartTime"
    :current-activity="currentActivity" :app-package="apppackage"
    :app-usage-description="getAppUsageDescription(apppackage)" :show-duration="true"
    :first-lock-record="firstLockRecord" :current-status="currentStatus" @close="closeAppStatusTooltip" />

  <!-- iOS风格收款码弹窗组件 -->
  <PaymentQRCodeDialog :visible="isPaymentDialogVisible"
    :wechatQRCodeUrl="'https://wework.qpic.cn/wwpic3az/476342_hm8mnuW1Q9erQLI_1742174282/0'"
    :alipayQRCodeUrl="'https://wework.qpic.cn/wwpic3az/721582_2W7EimbEQUSaBll_1734075111/0'" :amount="'投喂我一杯咖啡☕️'"
    @close="closePaymentDialog" />
</template>

<style scoped>
.social-accounts-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  flex-wrap: wrap;
  gap: 10px;
}

/* 在线人数显示样式 */
.online-users-display {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(33, 150, 243, 0.1);
}

.online-users-display:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: rgba(33, 150, 243, 0.3);
}

.online-users-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

/* 生命闪烁动画效果 */
@keyframes pulse-life {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.life-pulse {
  animation: pulse-life 2s infinite;
}

/* 音乐播放动画效果 */
@keyframes pulse-music {
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(33, 150, 243, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
}

.music-playing {
  animation: pulse-music 2s infinite;
}

/* 状态按钮样式 */
.status-button {
  position: relative;
  overflow: hidden;
}

/* 下拉菜单样式 */
.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 1000;
  transition: all 0.3s ease;
  opacity: 1;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  margin: 2px;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-icon {
  margin-right: 8px;
  color: #666;
}

.dropdown-text {
  font-size: 0.875rem;
  color: #333;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.status-arrow {
  margin-left: 8px;
  transition: transform 0.3s ease;
}

.status-button:hover .status-arrow {
  transform: translateX(2px);
}

.status-button:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, computed, inject } from 'vue';

import IOSHitokoto from '../components/utils/IOSHitokoto.vue';
import { useRouter } from 'vue-router';
import WeatherRegionCard from '../components/ui/WeatherRegionCard.vue';
import StatusDialog from '../components/dialogs/StatusDialog.vue';
import AppStatusTooltip from '../components/dialogs/AppStatusTooltip.vue';
import iOSPullToRefresh from '../components/utils/IOSPullToRefresh.vue';
import SocketStatusDisplay from '../components/features/SocketStatusDisplay.vue';
import IOSStatusBarPlayer from '../components/features/DynamicIslandPlayer.vue';
import PaymentQRCodeDialog from '../components/dialogs/PaymentQRCodeDialog.vue';
import CyclingData from '../components/features/CyclingData.vue';
import { getRandomFeedback } from '../utils/words.js';
import { Snackbar } from 'sober';
import { snackbar } from "mdui/functions/snackbar.js";
import { io } from 'socket.io-client';
// 导入音乐API相关函数
import { onMusicDataUpdate, offMusicDataUpdate, disconnectMusicSocket, initMusicSocket } from '../utils/musicApi.js';
// import { snackbar } from 'mdui';
const router = useRouter();

// Socket.IO连接
let socket = null;
const onlineUsers = ref(0);
const lastUpdatedOnline = ref(null);
const socketConnected = ref(false); // Socket连接状态变量
const socketId = ref(''); // Socket连接ID

// 控制投喂弹窗显示的变量
const isPaymentDialogVisible = ref(false);

// 关闭投喂弹窗的函数
const closePaymentDialog = () => {
  isPaymentDialogVisible.value = false;
};

// 连接Socket.IO服务器
const connectSocket = () => {
  // 防止重复连接：如果已经有socket实例且处于连接状态，不创建新连接
  if (socket && socket.connected) {
    console.log('Socket连接已存在且处于连接状态，避免重复连接');
    socketConnected.value = true;
    if (socket.id) {
      socketId.value = socket.id;
    }
    return;
  }

  try {
    // 创建socket连接，指定完整的API路径
    socket = io(`${import.meta.env.VITE_API_BASE_URL}`, {
      path: '/socket.io', // 修正路径，与服务端默认监听路径一致
      autoConnect: true,
      timeout: 5000, // 5秒超时
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000, // 增加重连延迟到2秒
      reconnectionDelayMax: 5000, // 最大重连延迟5秒
      transports: ["polling", "websocket"] // 指定传输方式以提高兼容性
    });

    // 监听连接事件
    socket.on('connect', () => {
      socketConnected.value = true;
      socketId.value = socket.id;
      // console.log('Socket.IO连接成功，ID:', socket.id);

      // 标记为主要Socket连接
      socket._isMainSocket = true;

      // 将主Socket连接传递给音乐API，实现连接合并
      initMusicSocket(socket);
    });

    // 跟踪上一次的在线人数，用于检测人数变化
    let previousOnlineUsers = 0;
    let isNewConnection = true; // 标记当前是否是新连接（自己）

    // 监听在线人数更新事件（服务端会主动推送）
    socket.on('onlineUsersUpdate', (count) => {
      const newCount = count || 0;

      // 检查人数是否增加并且不是自己连接导致的
      if (newCount > previousOnlineUsers && !isNewConnection) {
        // 计算增加的人数
        const increasedCount = newCount - previousOnlineUsers;

        // 显示提示信息
        snackbar({
          message: (`${increasedCount}人来👀了 `),
          action: "忽略",
          queue: "sd",
          autoCloseDelay: 3000,
          onActionClick: () => console.log("click action button")
        });


      }

      // 更新在线人数和最后更新时间
      onlineUsers.value = newCount;
      lastUpdatedOnline.value = new Date();

      // 如果是首次更新，标记为已连接
      if (isNewConnection) {
        isNewConnection = false;
      }

      // 保存当前人数作为下一次的比较基准
      previousOnlineUsers = newCount;
    });

    // 监听日志更新事件（服务端会主动推送最新状态）
    socket.on('logsUpdate', (logsData) => {
      // console.log('接收到实时日志更新:', logsData);
      handleLogsUpdate(logsData);
    });

    // 监听断开连接事件
    socket.on('disconnect', (reason) => {
      console.log('Socket.IO连接断开，原因:', reason);
      socketConnected.value = false;
      socketId.value = '';
    });

    // 监听连接错误事件
    socket.on('connect_error', (error) => {
      console.error('Socket.IO连接错误:', error.message);
      // 提供更友好的错误提示
      if (error.message.includes('ETIMEDOUT')) {
        console.error('Socket.IO连接超时，请检查服务器是否可达');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('Socket.IO连接被拒绝，服务器可能未运行');
      } else if (error.message === 'server error') {
        console.error('Socket.IO服务器返回错误，可能是服务器内部问题或API路径配置错误');
      }
    });

    // 监听重连尝试事件
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`正在尝试重连... (第${attemptNumber}次)`);
    });

    // 监听重连成功事件
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket.IO重连成功 (第${attemptNumber}次尝试)`);
    });

    // 监听重连失败事件
    socket.on('reconnect_failed', () => {
      console.error('Socket.IO重连失败');
      // 重连失败后清理socket实例，以便下次尝试重新创建
      socket = null;
      socketConnected.value = false;
      socketId.value = '';
    });
  } catch (error) {
    console.error('创建Socket.IO连接失败:', error);
  }
};

// 处理Socket.IO日志更新事件
const handleLogsUpdate = (logsData) => {
  try {
    // 适配API返回的数据 - 现在返回的是数组，以第一个元素为最新状态
    if (Array.isArray(logsData) && logsData.length > 0) {
      // 获取最新的状态数据（数组的第一个元素）
      const latestData = logsData[0];

      // 保存最近的状态数据，用于音乐暂停时恢复图标
      recentStatusData.value = latestData;

      // 更新设备状态
      deviceStatus.value = {
        battery: {
          level: latestData.battery || 50,
          charging: latestData.is_charging || false
        },
        device: latestData.device || 'unknown',
        ip: latestData.ip || ''
      };

      // 检查并更新首次锁屏记录
      if (latestData.firstLockRecord) {
        firstLockRecord.value = latestData.firstLockRecord;
      }

      apppackage.value = latestData.app_package || 'com.example.app';

      // 更新当前活动应用
      currentActivity.value = {
        name: latestData.app_name || '',
        description: latestData.app_name ? `正在使用  ${latestData.app_name}` :
          (latestData.status ? '手机已解锁' : '已锁屏'),
        icon: latestData.app_name ? (appIcons[latestData.app_name] || 'launch') :
          (latestData.status ? 'lock_open' : 'lock')
      };

      // 智能化用户状态判断
      let statusLabel = '';
      let statusIcon = '';
      let statusColor = '';

      if (latestData.status) {
        // 设备已解锁状态
        if (latestData.app_name) {
          // 正在使用应用
          statusLabel = `${latestData.app_name}`;
          statusIcon = 'wifi';
          statusColor = '#2196F3';
        } else {
          // 已解锁但未使用特定应用
          statusLabel = '手机已解锁';
          statusIcon = 'lock_open';
          statusColor = '#4CAF50';
        }
      } else {
        // 设备锁定状态
        const now = Math.floor(Date.now() / 1000);
        const lastActive = latestData.time || now;
        const inactiveTime = now - lastActive;

        if (inactiveTime < 300) { // 5分钟内
          statusLabel = '锁屏';
          statusIcon = 'wifi';
          statusColor = '#757575';
        } else if (inactiveTime < 1800) { // 30分钟内
          statusLabel = '设备锁定';
          statusIcon = 'wifi';
          statusColor = '#9E9E9E';
        } else {
          statusLabel = '长时间未使用';
          statusIcon = 'wifi';
          statusColor = '#757575';
        }
      }

      // 考虑电池状态的额外信息
      if (latestData.status && latestData.battery < 20 && !latestData.is_charging) {
        statusLabel += ' (电量低)';
        statusColor = '#F44336';
      }

      // 更新用户状态
      currentStatus.value = {
        label: statusLabel,
        icon: statusIcon,
        color: statusColor,
        isOnline: latestData.status
      };

      // 如果正在播放音乐，显示音乐图标（优先级最高）
      if (musicPlayingState.value.isPlaying) {
        // currentStatus.value.label = musicPlayingState.value.trackName || '正在播放音乐';
        // currentStatus.value.color = '#757575'; // 音乐播放时使用蓝色
        currentStatus.value.icon = 'headphones';
      }


      // 更新时间
      lastUpdated.value = new Date();
      if (!latestData.status && logsData.length > 1) {
        // 当设备处于锁定状态且数据数组长度大于1时，按用户要求的逻辑确定最新锁屏时间
        // 1. 按时间正序（从小到大）排序所有记录
        const sortedLogs = [...logsData].sort((a, b) => a.time - b.time);
        // 2. 筛选出有效锁屏动作（前一条为status: true，当前为status: false的记录）
        const validLockActions = [];
        for (let i = 1; i < sortedLogs.length; i++) {
          if (sortedLogs[i - 1].status === true && sortedLogs[i].status === false) {
            validLockActions.push(sortedLogs[i]);
          }
        }
        // 3. 在有效锁屏动作中取时间最晚的记录
        if (validLockActions.length > 0) {
          const latestValidLock = validLockActions.reduce((latest, current) =>
            current.time > latest.time ? current : latest
          );
          statusStartTime.value = latestValidLock.time;
          // 保存锁屏时的电池电量
          lockBatteryLevel.value = latestValidLock.battery || 50;
        } else {
          // 如果没有有效锁屏动作，找出所有status为false的记录中时间最新的
          const lockRecords = logsData.filter(record => record.status === false);
          if (lockRecords.length > 0) {
            const latestLockRecord = lockRecords.reduce((latest, current) =>
              current.time > latest.time ? current : latest
            );
            statusStartTime.value = latestLockRecord.time;
            lockBatteryLevel.value = latestLockRecord.battery || 50;
          } else if (latestData.time) {
            statusStartTime.value = latestData.time;
            // 保存该时间点的电池电量
            lockBatteryLevel.value = latestData.battery || 50;
          } else {
            statusStartTime.value = Math.floor(Date.now() / 1000);
            // 保存当前的电池电量
            lockBatteryLevel.value = deviceStatus.value.battery.level;
          }
        }
      } else if (latestData.time) {
        // 如果API返回了时间，使用API返回的时间（锁屏状态下显示锁屏发生时间）
        statusStartTime.value = latestData.time;
      } else {
        // 如果没有API返回时间，使用当前时间
        statusStartTime.value = Math.floor(Date.now() / 1000);
      }

      // 分析应用使用数据并更新处理后的记录
      const analysisResult = analyzeAppUsageData(logsData);
      processedActivityRecords.value = analysisResult.records;

      // 存储到localStorage，供RecentActivitiesView使用
      try {
        // 创建一个完全脱离Vue响应式系统的普通JavaScript对象
        // 使用展开运算符和JSON.parse/stringify确保移除所有响应式属性
        const serializableRecords = analysisResult.records.map(record => ({
          ...record
        }));
        const serializableData = {
          records: JSON.parse(JSON.stringify(serializableRecords)),
          totalDuration: Number(analysisResult.totalDuration), // 确保是纯数字
          lastUpdated: Date.now(),
          source: 'socket'
        };
        localStorage.setItem('processedActivityRecords', JSON.stringify(serializableData));

        // 发送事件，将处理后的活动数据立即传递给RecentActivitiesView
        window.dispatchEvent(new CustomEvent('activityDataUpdated', {
          detail: processedActivityRecords.value
        }));
      } catch (storageError) {
        console.error('保存Socket数据到localStorage失败:', storageError);
      }
    }
  } catch (error) {
    console.error('处理Socket日志更新失败:', error);
  }
};

// 断开Socket.IO连接
const disconnectSocket = () => {
  if (socket) {
    try {
      // 先移除所有事件监听器
      socket.off('connect');
      socket.off('onlineUsersUpdate');
      socket.off('logsUpdate');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect_attempt');
      socket.off('reconnect');
      socket.off('reconnect_failed');

      // 断开连接
      socket.disconnect();

      console.log('Socket.IO连接已断开并清理资源');
    } catch (error) {
      console.error('断开Socket.IO连接时出错:', error);
    } finally {
      // 更新状态
      socketConnected.value = false;
      socketId.value = '';
      // 确保socket引用被清除
      socket = null;
    }
  }
};

// 导航到最近活动页面
const navigateToRecentActivities = () => {
  router.push('/recent-activities');
};

// 导航到社交媒体页面
const navigateToSocialMedia = () => {
  router.push('/social-media');
};

// 下拉菜单状态
const isDropdownOpen = ref(false);

// 切换下拉菜单显示状态
const toggleDropdownMenu = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// 处理下拉菜单选项点击
const handleDropdownOption = (option) => {
  isDropdownOpen.value = false;
  if (option === '媒体') {
    navigateToSocialMedia();
  } else if (option === '投喂') {
    // 显示iOS风格收款码弹窗
    isPaymentDialogVisible.value = true;
  } else if (option === '博客') {
    // 跳转到博客网站
    window.open('https://blog.jiclub.site', '_blank');
  }
  else if (option === '发消息') {
    window.open('https://chat.jiclub.site/', '_blank')
  }
};

// 点击页面其他地方关闭下拉菜单
const closeDropdownOnClickOutside = (event) => {
  const dropdownContainer = event.target.closest('.dropdown-container');
  if (!dropdownContainer) {
    isDropdownOpen.value = false;
  }
};

// 处理从DynamicIslandPlayer组件接收到的音乐播放状态更新
const handleMusicPlayingStatusChanged = (musicStatus) => {
  // 更新音乐播放状态
  musicPlayingState.value.isPlaying = musicStatus.isPlaying;
  musicPlayingState.value.currentSong = musicStatus.currentSong;
  // 更新用户状态
  updateStatusWithMusic();
};

// 更新用户状态，考虑音乐播放情况
const updateStatusWithMusic = () => {
  if (musicPlayingState.value.isPlaying) {
    // 如果正在播放音乐，显示音乐图标（优先级最高）
    currentStatus.value.icon = 'headphones';
    // 确保颜色为蓝色
    // currentStatus.value.color = '#757575';
  } else {
    // 如果音乐暂停，恢复原始图标
    // 为了避免影响智能化用户状态判断的结果，我们需要重新获取并应用当前状态的图标
    // 这里我们检查是否有最近的状态数据，如果有，重新计算图标
    if (recentStatusData.value) {
      const latestData = recentStatusData.value;
      let statusIcon = '';
      let statusColor = '';

      if (latestData.status) {
        // 设备已解锁状态
        if (latestData.app_name) {
          // 正在使用应用
          statusIcon = 'wifi';
          statusColor = '#2196F3';
        } else {
          // 已解锁但未使用特定应用
          statusIcon = 'lock_open';
          statusColor = '#4CAF50';
        }
      } else {
        // 设备锁定状态
        statusIcon = 'wifi';
        statusColor = '#757575';

        // 如果是离线状态，使用灰色
        if (!latestData.status) {
          statusColor = '#757575';
        }
      }

      currentStatus.value.icon = statusIcon;
      currentStatus.value.color = statusColor;
    }
  }
};

// 组件挂载时添加点击外部关闭下拉菜单的事件监听器
onMounted(() => {
  document.addEventListener('click', closeDropdownOnClickOutside);

  // 不再单独获取音乐数据，将通过组件通信获取
  // 初始化音乐播放状态为false，等待从DynamicIslandPlayer获取实际数据
  // fetchMusicData(handleMusicDataUpdate);
  // onMusicDataUpdate(handleMusicDataUpdate);

  // 添加事件监听器
  window.addEventListener('regionDataUpdated', handleRegionDataUpdate);

  // 添加页面关闭事件监听器，确保Socket连接被正确断开
  window.addEventListener('beforeunload', handleBeforeUnload);

  // 从localStorage尝试获取之前保存的地域数据
  try {
    const savedRegionData = localStorage.getItem('regionData');
    if (savedRegionData) {
      const parsedData = JSON.parse(savedRegionData);
      if (parsedData && parsedData.region) {
        regionData.value.region = parsedData.region;
      } else if (parsedData && parsedData.city) {
        // 如果没有region数据，使用city数据作为备选
        regionData.value.region = parsedData.city;
      }
    }
  } catch (error) {
    console.warn('无法从localStorage读取地域数据:', error);
  }
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnClickOutside);

  // 不再需要清理音乐数据相关资源
  // offMusicDataUpdate(handleMusicDataUpdate);
  // disconnectMusicSocket();

  // 移除地域数据更新事件监听器
  window.removeEventListener('regionDataUpdated', handleRegionDataUpdate);

  // 移除页面关闭事件监听器
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// 状态数据
const lastUpdated = ref(new Date());
const deviceStatus = ref({
  battery: {
    level: 50,
    charging: false
  },
  device: 'unknown',
  ip: ''
});

// 添加regionData响应式数据，用于存储从WeatherRegionCard组件获取的地域信息
const regionData = ref({
  city: '未知',
  region: '未知'
});
// 保存最近的状态数据，用于恢复图标
const recentStatusData = ref(null);
// 存储锁屏时的电池电量
const lockBatteryLevel = ref(50);
// 存储首次锁屏记录
const firstLockRecord = ref(null);

// 当前活动应用数据
const currentActivity = ref({
  name: 'Visual Studio Code',
  description: '正在进行代码开发',
  icon: 'code'
});

// 应用开始时间

// 应用使用描述映射
const appUsageMapping = ref([
  {
    package_name: "com.tencent.mm",
    usage: "社交沟通、支付、小程序使用、公众号阅读"
  },
  {
    package_name: "com.taobao.taobao",
    usage: "在线购物、商品浏览、下单支付、物流查询"
  },
  {
    package_name: "com.netease.cloudmusic",
    usage: "音乐播放、歌单创建、歌词查看、直播互动"
  },
  {
    package_name: "com.ss.android.ugc.aweme",
    usage: "短视频浏览、作品发布、直播观看、商品购买"
  },
  {
    package_name: "com.tencent.mobileqq",
    usage: "社交聊天、文件传输、空间动态查看、游戏登录"
  },
  {
    package_name: "com.baidu.BaiduMap",
    usage: "地图导航、地点搜索、路线规划、实时路况查询"
  },
  {
    package_name: "com.tencent.peng",
    usage: "视频观看、点播、综艺浏览、直播观看"
  }
]);

// 根据包名获取应用使用描述
const getAppUsageDescription = (packageName) => {
  if (!packageName || packageName === 'com.example.app') {
    return '锁屏状态，可能在用电脑 或者骑行去了...';
  }

  const mapping = appUsageMapping.value.find(item => item.package_name === packageName);
  if (mapping) {
    return mapping.usage;
  }

  // 没有匹配的包名时返回默认描述
  return `${currentActivity.value.name}，你应该知道在做什么`;
};

// 用户状态
const currentStatus = ref({
  label: '离线',
  icon: 'wifi',
  color: '#757575'
});

// 地域数据更新处理函数
const handleRegionDataUpdate = (event) => {
  if (event.detail && event.detail.region) {
    regionData.value.region = event.detail.region;
  } else if (event.detail && event.detail.city) {
    // 如果没有region数据，使用city数据作为备选
    regionData.value.region = event.detail.city;
  }
};

// 音乐播放状态
// 将从DynamicIslandPlayer组件中获取，不再单独爬取
const musicPlayingState = ref({
  isPlaying: false,
  currentSong: null
});

// 根据设备类型映射图标
const deviceIcons = {
  'phone': 'devices_other',
  'tablet': 'tablet',
  'computer': 'laptop',
  'unknown': 'devices_other'
};

// 注入全局应用图标映射
const appIconMap = inject('appIconMap', {});

// 应用图标映射表（保留用于未在appIconMap中找到的应用）
const appIcons = {
  'MT管理器': 'folder',
  'Visual Studio Code': 'code',
  'Chrome 浏览器': 'chrome',
  'Spotify': 'music_note',
  'Photoshop': 'edit',
  'Kindle': 'book',
  '信息': 'sms',
  '联系人': 'contacts',
  'Lua代码手册': 'menu_book',
  'Visual Studio Code': 'code'
};

// 定时更新状态
let updateInterval = null;

// 刷新状态
const isRefreshing = ref(false);

// 处理下拉刷新
const handleRefresh = async () => {
  isRefreshing.value = true;
  try {
    await fetchStatusData();
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    // 确保在任何情况下都关闭刷新状态
    setTimeout(() => {
      isRefreshing.value = false;
    }, 1500);
  }
};



// 计算并格式化相对时间（多久前）
const formatRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const secondsDiff = Math.floor((now - past) / 1000);

  // 初始状态显示"刚刚"
  if (secondsDiff < 1) {
    return '刚刚';
  } else if (secondsDiff < 60) {
    return `${secondsDiff}秒前`;
  } else if (secondsDiff < 3600) {
    const minutes = Math.floor(secondsDiff / 60);
    return `${minutes}分钟前`;
  } else {
    const hours = Math.floor(secondsDiff / 3600);
    return `${hours}小时前`;
  }
};

// 用于更新相对时间显示的定时器
let relativeTimeInterval = null;

// 获取电池级别样式类
const getBatteryLevelClass = () => {
  const level = deviceStatus.value.battery.level;

  if (level > 70) return 'battery-level-high';
  if (level > 30) return 'battery-level-medium';
  return 'battery-level-low';
};

// 存储处理后的应用使用记录，将用于传递给RecentActivitiesView
const processedActivityRecords = ref([]);

// 存储总统计时长
const totalDuration = ref(0);

// 格式化时长显示
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${remainingSeconds > 0 ? `${remainingSeconds}秒` : ''}`;
  } else {
    return `${remainingSeconds}秒`;
  }
};

// 格式化日期时间显示
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (date >= today) {
    return `今天 ${timeStr}`;
  } else if (date >= yesterday) {
    return `昨天 ${timeStr}`;
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day} ${timeStr}`;
  }
};

// 格式化完整日期时间（UTC+8）
const formatFullDateTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 计算总使用时长
const getTotalUsageTime = () => {
  if (processedActivityRecords.value.length === 0) {
    return 0;
  }
  return processedActivityRecords.value.reduce((total, record) => {
    return total + (record.usage_seconds || 0);
  }, 0);
};


// 获取最常用的应用
const getMostUsedApp = () => {
  if (processedActivityRecords.value.length === 0) {
    return '无';
  }

  const appUsage = {};
  processedActivityRecords.value.forEach(record => {
    if (appUsage[record.appName]) {
      appUsage[record.appName] += (record.usage_seconds || 0);
    } else {
      appUsage[record.appName] = (record.usage_seconds || 0);
    }
  });

  let mostUsedApp = '';
  let maxUsage = 0;

  for (const app in appUsage) {
    if (appUsage[app] > maxUsage) {
      maxUsage = appUsage[app];
      mostUsedApp = app;
    }
  }

  return mostUsedApp || '无';
};

// 分析应用使用数据，计算停留时长
const analyzeAppUsageData = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return { records: [], totalDuration: 0 };
  }

  // 一、数据处理前置步骤
  // 1. 数据收集与筛选：保留所有记录，确保时间线完整
  const allRecords = [...dataArray];

  // 2. 时间线排序：按time字段升序排序（从最早到最新）
  const sortedRecords = allRecords.sort((a, b) => a.time - b.time);

  // 修复要点3：解决总时长变量依赖问题
  // 计算总时长（最晚记录时间 - 最早记录时间）
  let calculatedDuration = 0;
  if (sortedRecords.length > 1) {
    const firstRecordTime = sortedRecords[0].time;
    const lastRecordTime = sortedRecords[sortedRecords.length - 1].time;
    calculatedDuration = lastRecordTime - firstRecordTime;
  }

  // 移除对外部响应式变量 totalDuration 的直接引用
  // totalDuration.value = calculatedDuration;

  // 提取所有应用打开记录（status=true）
  const appOpenRecords = sortedRecords.filter(record => record.status === true && record.app_name);

  if (appOpenRecords.length === 0) {
    return [];
  }

  const result = [];
  const processedIndices = new Set(); // 用于跟踪已处理的记录索引

  // 二、核心计算逻辑
  for (let i = 0; i < appOpenRecords.length; i++) {
    // 如果记录已经被处理过（作为连续打开同一应用的一部分），则跳过
    if (processedIndices.has(i)) {
      continue;
    }

    const currentRecord = appOpenRecords[i];
    const T_start = currentRecord.time;

    // 初始化结束事件变量
    let T_lock = null; // 锁屏时间戳
    let T_switch = null; // 切换应用时间戳
    let end_event_type = null;
    let end_timestamp = null;
    let end_time = null;
    let usage_seconds = 0;
    let is_ended = false;

    // 检查是否是连续打开同一应用的情况
    let continuousSameApp = false;
    let lastSameAppIndex = i;

    // 查找连续打开的同一应用记录（排除中间有锁屏的情况）
    for (let j = i + 1; j < appOpenRecords.length; j++) {
      const nextAppRecord = appOpenRecords[j];
      const prevAppRecord = appOpenRecords[j - 1]; // 获取前一条记录

      if (nextAppRecord.app_name !== currentRecord.app_name) {
        break; // 应用不同，终止查找
      }

      // 检查前一条记录与当前记录之间是否有锁屏事件
      const hasLockScreenBetween = sortedRecords.some(record =>
        record.time > prevAppRecord.time &&
        record.time < nextAppRecord.time &&
        record.status === false
      );

      // 检查是否有firstLockRecord
      const hasFirstLockRecordBetween = sortedRecords.some(record =>
        record.time > prevAppRecord.time &&
        record.time < nextAppRecord.time &&
        record.firstLockRecord &&
        record.firstLockRecord.time
      );

      if (hasLockScreenBetween || hasFirstLockRecordBetween) {
        break; // 中间有锁屏或firstLockRecord，不视为连续
      }

      // 检查时间间隔是否合理（30分钟内）
      const timeInterval = nextAppRecord.time - prevAppRecord.time;
      if (timeInterval > 1800) { // 超过30分钟（1800秒）
        break; // 时间间隔过长，不视为连续
      }

      // 无锁屏，且应用相同，且时间间隔合理，视为连续
      continuousSameApp = true;
      lastSameAppIndex = j;
      processedIndices.add(j); // 标记为已处理
    }

    // 修复要点2：精确起始索引匹配
    // 确定要查找结束事件的起始索引
    const searchStartIndex = sortedRecords.findIndex(record =>
      record.time === appOpenRecords[lastSameAppIndex].time &&
      record.app_name === appOpenRecords[lastSameAppIndex].app_name
    );

    // 步骤2：寻找结束事件
    // 首先在整个数据集中查找与当前应用相关的firstLockRecord
    let earliestRelevantFirstLockTime = null;
    for (let j = 0; j < sortedRecords.length; j++) {
      const record = sortedRecords[j];
      // 检查是否有firstLockRecord且时间有效
      if (record.firstLockRecord && record.firstLockRecord.time &&
        record.firstLockRecord.time > T_start && record.firstLockRecord.time < T_start + 14400) {
        // 选择最早的相关firstLockTime
        if (!earliestRelevantFirstLockTime || record.firstLockRecord.time < earliestRelevantFirstLockTime) {
          earliestRelevantFirstLockTime = record.firstLockRecord.time;
        }
      }
    }

    // 然后按正常逻辑查找结束事件
    for (let j = searchStartIndex + 1; j < sortedRecords.length; j++) {
      const nextEvent = sortedRecords[j];

      // 修复要点1：优化结束事件查找逻辑
      // 检查是否是锁屏事件（status:false）
      if (nextEvent.status === false) {
        // 如果找到了相关的firstLockTime，使用它
        if (earliestRelevantFirstLockTime) {
          T_lock = earliestRelevantFirstLockTime;
        } else {
          // 否则使用当前记录的时间
          T_lock = nextEvent.time;
        }
        break;
      }

      // 检查是否是切换应用事件（status:true 且 app_name 不同）
      if (nextEvent.status === true && nextEvent.app_name && nextEvent.app_name !== currentRecord.app_name) {
        // 找到切换应用事件，立即设置并停止搜索
        T_switch = nextEvent.time;
        break;
      }
    }

    // 步骤3：计算使用时间
    if (T_lock !== null) {
      // 锁屏事件优先
      end_timestamp = T_lock;
      end_event_type = '锁屏';
      usage_seconds = T_lock - T_start;
      is_ended = true;
    } else if (T_switch !== null) {
      // 切换应用事件
      end_timestamp = T_switch;
      end_event_type = '切换应用';
      usage_seconds = T_switch - T_start;
      is_ended = true;
    } else {
      // 未找到任何事件（当前应用是日志最后一条记录）
      end_event_type = '未结束';
      end_timestamp = null;
      // usage_seconds = 30; // 默认30秒
      is_ended = false;
    }

    // 处理特殊情况

    // 1. 连续打开同一应用的情况已经在前面处理

    // 2. 时间戳相同的记录：视为瞬时操作
    if (usage_seconds === 0 && is_ended) {
      continue; // 跳过这些记录
    }

    // 3. 限制最大时长为4小时，避免异常数据
    if (usage_seconds > 14400) {
      usage_seconds = 14400;
      end_timestamp = T_start + usage_seconds;
      end_event_type = '超时截断';
    }

    // 格式化结束时间
    if (end_timestamp) {
      end_time = formatFullDateTime(end_timestamp);
    }

    // 创建记录对象，包含所有新要求的字段，并兼容原有结构
    const record = {
      // 原有字段，保持兼容性
      id: result.length + 1,
      appName: currentRecord.app_name,
      duration: is_ended ? formatDuration(usage_seconds) : '未结束',
      project: `${currentRecord.app_name}使用记录`,
      time: formatDateTime(T_start),
      rawTime: T_start,
      endTime: end_timestamp || T_start,
      batteryLevel: currentRecord.battery || 50,
      charging: currentRecord.is_charging || false,
      ip: currentRecord.ip || '192.168.1.1',
      status: true,
      app_name: currentRecord.app_name,
      device: currentRecord.device || 'unknown',
      hasEnded: is_ended,

      // 新增字段，满足新需求
      app_package: currentRecord.app_package || `${currentRecord.app_name.toLowerCase().replace(/\s+/g, '_')}.package`, // 生成一个模拟的包名
      start_time: formatFullDateTime(T_start),
      start_timestamp: T_start,
      end_event_type: end_event_type,
      end_time: end_time,
      end_timestamp: end_timestamp,
      usage_seconds: usage_seconds
    };

    result.push(record);
  }

  // 按时间戳降序排序（最新的在前）返回结果
  const sortedResult = result.sort((a, b) => b.rawTime - a.rawTime);

  // 修复要点3：解决总时长变量依赖问题
  // 返回结果对象，使用内部计算的 calculatedDuration
  return {
    records: sortedResult,
    totalDuration: calculatedDuration
  };
};


// 应用包名 - 设置默认值以确保显示正确的用途信息
const apppackage = ref('com.tencent.mobileqq');

// 加载状态指示
const isLoading = ref(false);
const loadingError = ref('');

// 从API获取状态数据
const fetchStatusData = async () => {
  isLoading.value = true;
  loadingError.value = '';

  try {
    // 增加fetch超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/getStalin`, {
      signal: controller.signal,
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'omit' // 不发送cookie，减少CORS问题
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dataArray = await response.json();

    // 适配API返回的数据 - 现在返回的是数组，以第一个元素为最新状态
    if (Array.isArray(dataArray) && dataArray.length > 0) {
      // 获取最新的状态数据（数组的第一个元素）
      const latestData = dataArray[0];

      // 更新设备状态
      deviceStatus.value = {
        battery: {
          level: latestData.battery || 50,
          charging: latestData.is_charging || false
        },
        device: latestData.device || 'unknown',
        ip: latestData.ip || ''
      };

      // 检查并更新首次锁屏记录
      if (latestData.firstLockRecord) {
        firstLockRecord.value = latestData.firstLockRecord;
      }

      apppackage.value = latestData.app_package || 'com.example.app';

      // 更新当前活动应用
      currentActivity.value = {
        name: latestData.app_name || '',
        description: latestData.app_name ? `正在使用  ${latestData.app_name}` :
          (latestData.status ? '手机已解锁' : '已锁屏'),
        icon: latestData.app_name ? (appIcons[latestData.app_name] || 'launch') :
          (latestData.status ? 'lock_open' : 'lock')
      };

      // 智能化用户状态判断
      let statusLabel = '';
      let statusIcon = '';
      let statusColor = '';

      if (latestData.status) {
        // 设备已解锁状态
        if (latestData.app_name) {
          // 正在使用应用
          statusLabel = `${latestData.app_name}`;
          statusIcon = 'wifi';
          statusColor = '#2196F3';
        } else {
          // 已解锁但未使用特定应用
          statusLabel = '手机已解锁';
          statusIcon = 'lock_open';
          statusColor = '#4CAF50';
        }
      } else {
        // 设备锁定状态
        const now = Math.floor(Date.now() / 1000);
        const lastActive = latestData.time || now;
        const inactiveTime = now - lastActive;

        if (inactiveTime < 300) { // 5分钟内
          statusLabel = '锁屏';
          statusIcon = 'wifi';
          statusColor = '#757575';
        } else if (inactiveTime < 1800) { // 30分钟内
          statusLabel = '设备锁定';
          statusIcon = 'wifi';
          statusColor = '#9E9E9E';
        } else {
          statusLabel = '长时间未使用';
          statusIcon = 'wifi';
          statusColor = '#757575';
        }
      }

      // 考虑电池状态的额外信息
      if (latestData.status && latestData.battery < 20 && !latestData.is_charging) {
        statusLabel += ' (电量低)';
        statusColor = '#F44336';
      }

      // 更新用户状态
      currentStatus.value = {
        label: statusLabel,
        icon: statusIcon,
        color: statusColor,
        isOnline: latestData.status
      };

      // 更新时间
      lastUpdated.value = new Date();
      if (!latestData.status && dataArray.length > 1) {
        // 当设备处于锁定状态且数据数组长度大于1时，按用户要求的逻辑确定最新锁屏时间
        // 1. 按时间正序（从小到大）排序所有记录
        const sortedLogs = [...dataArray].sort((a, b) => a.time - b.time);
        // 2. 筛选出有效锁屏动作（前一条为status: true，当前为status: false的记录）
        const validLockActions = [];
        for (let i = 1; i < sortedLogs.length; i++) {
          if (sortedLogs[i - 1].status === true && sortedLogs[i].status === false) {
            validLockActions.push(sortedLogs[i]);
          }
        }
        // 3. 在有效锁屏动作中取时间最晚的记录
        if (validLockActions.length > 0) {
          const latestValidLock = validLockActions.reduce((latest, current) =>
            current.time > latest.time ? current : latest
          );
          statusStartTime.value = latestValidLock.time;
          // 保存锁屏时的电池电量
          lockBatteryLevel.value = latestValidLock.battery || 50;
        } else {
          // 如果没有有效锁屏动作，找出所有status为false的记录中时间最新的
          const lockRecords = dataArray.filter(record => record.status === false);
          if (lockRecords.length > 0) {
            const latestLockRecord = lockRecords.reduce((latest, current) =>
              current.time > latest.time ? current : latest
            );
            statusStartTime.value = latestLockRecord.time;
            lockBatteryLevel.value = latestLockRecord.battery || 50;
          } else if (latestData.time) {
            statusStartTime.value = latestData.time;
            // 保存该时间点的电池电量
            lockBatteryLevel.value = latestData.battery || 50;
          } else {
            statusStartTime.value = Math.floor(Date.now() / 1000);
            // 保存当前的电池电量
            lockBatteryLevel.value = deviceStatus.value.battery.level;
          }
        }
      } else if (latestData.time) {
        statusStartTime.value = latestData.time;
      } else {
        statusStartTime.value = Math.floor(Date.now() / 1000);
      }

      // 分析应用使用数据并更新处理后的记录
      const analysisResult = analyzeAppUsageData(dataArray);
      processedActivityRecords.value = analysisResult.records;

      // 存储到localStorage，供RecentActivitiesView使用
      try {
        // 创建一个完全脱离Vue响应式系统的普通JavaScript对象
        // 使用展开运算符和JSON.parse/stringify确保移除所有响应式属性
        const serializableRecords = analysisResult.records.map(record => ({
          ...record
        }));
        const serializableData = {
          records: JSON.parse(JSON.stringify(serializableRecords)),
          totalDuration: Number(analysisResult.totalDuration), // 确保是纯数字
          lastUpdated: Date.now(),
          source: 'api'
        };
        localStorage.setItem('processedActivityRecords', JSON.stringify(serializableData));
        console.log('数据已成功保存到localStorage，记录数量:', analysisResult.records.length, '总时长:', analysisResult.totalDuration, '秒');
      } catch (storageError) {
        console.error('保存数据到localStorage失败:', storageError);
      }
    }
  } catch (error) {
    // 优化错误处理，区分超时错误和其他错误
    if (error.name === 'AbortError') {
      console.error('获取状态数据超时，请稍后再试');
      loadingError.value = '获取状态数据超时，请稍后再试';
    } else {
      console.error('获取状态数据失败:', error.message || error);
      loadingError.value = `获取状态数据失败: ${error.message || '未知错误'}`;
    }

    // 尝试从localStorage读取缓存的数据
    try {
      const cachedData = localStorage.getItem('processedActivityRecords');
      if (cachedData) {
        // 如果没有从API获取到数据，使用当前时间作为开始时间
        statusStartTime.value = Math.floor(Date.now() / 1000);
        const parsedData = JSON.parse(cachedData);
        processedActivityRecords.value = parsedData.records || [];
        // 如果缓存数据中有totalDuration，也需要更新
        if (parsedData.totalDuration !== undefined) {
          // 存储totalDuration到localStorage，供RecentActivitiesView使用
          // 创建一个完全脱离Vue响应式系统的普通JavaScript对象
          // 使用展开运算符和JSON.parse/stringify确保移除所有响应式属性
          const serializableRecords = (parsedData.records || []).map(record => ({
            ...record
          }));
          const serializableData = {
            records: JSON.parse(JSON.stringify(serializableRecords)),
            totalDuration: Number(parsedData.totalDuration), // 确保是纯数字
            lastUpdated: Date.now(),
            source: parsedData.source || 'cache'
          };
          localStorage.setItem('processedActivityRecords', JSON.stringify(serializableData));
        }
        console.log('已加载缓存数据，记录数量:', processedActivityRecords.value.length);
        loadingError.value = ''; // 清除错误信息，因为我们使用了缓存数据
      } else {
        // 如果没有缓存数据，创建一些模拟数据用于展示
        console.log('创建模拟数据用于展示');
        loadingError.value = ''; // 清除错误信息，因为我们使用了模拟数据
        const mockData = [
          {
            id: 1,
            appName: 'Visual Studio Code',
            duration: '2小时30分钟',
            project: 'Vue项目开发',
            time: '今天 10:00',
            rawTime: Math.floor(Date.now() / 1000) - 9000,
            endTime: Math.floor(Date.now() / 1000) - 9000 + 9000,
            batteryLevel: 85,
            charging: true,
            ip: '192.168.1.100',
            status: true,
            app_name: 'Visual Studio Code',
            device: 'computer'
          },
          {
            id: 2,
            appName: 'Chrome 浏览器',
            duration: '1小时15分钟',
            project: '文档查阅',
            time: '今天 08:45',
            rawTime: Math.floor(Date.now() / 1000) - 18900,
            endTime: Math.floor(Date.now() / 1000) - 18900 + 4500,
            batteryLevel: 75,
            charging: false,
            ip: '192.168.1.100',
            status: true,
            app_name: 'Chrome 浏览器',
            device: 'computer'
          }
        ];
        processedActivityRecords.value = mockData;
        // 计算模拟数据的总时长
        const now = Math.floor(Date.now() / 1000);
        const earliestRecordTime = Math.min(...mockData.map(record => record.rawTime));
        const mockTotalDuration = now - earliestRecordTime;

        // 保存模拟数据到localStorage
        // 创建一个完全脱离Vue响应式系统的普通JavaScript对象
        // 使用展开运算符和JSON.parse/stringify确保移除所有响应式属性
        const serializableRecords = mockData.map(record => ({
          ...record
        }));
        const serializableData = {
          records: JSON.parse(JSON.stringify(serializableRecords)),
          totalDuration: Number(mockTotalDuration), // 确保是纯数字
          lastUpdated: Date.now(),
          source: 'mock'
        };
        localStorage.setItem('processedActivityRecords', JSON.stringify(serializableData));
      }
    } catch (cacheError) {
      console.error('读取缓存数据失败:', cacheError);
      loadingError.value = '读取缓存数据也失败，请刷新页面重试';

      // 创建一些模拟数据用于展示
      const mockData = [
        {
          id: 1,
          appName: 'Visual Studio Code',
          duration: '2小时30分钟',
          project: 'Vue项目开发',
          time: '今天 10:00',
          rawTime: Math.floor(Date.now() / 1000) - 9000,
          endTime: Math.floor(Date.now() / 1000) - 9000 + 9000,
          batteryLevel: 85,
          charging: true,
          ip: '192.168.1.100',
          status: true,
          app_name: 'Visual Studio Code',
          device: 'computer'
        }
      ];
      processedActivityRecords.value = mockData;
    }
  } finally {
    // 无论请求成功还是失败，都设置加载状态为false
    isLoading.value = false;
  }
};

// 获取骑行数据
const cyclingData = ref(null);
const cyclingList = ref([]); // 用于存储骑行列表数据
const fetchCyclingData = async () => {
  try {
    // 从API获取骑行数据
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/Getxingzhe`);
    const result = await response.json();

    // 检查API响应是否成功
    if (result.success && result.data && result.data.results && result.data.results.length > 0) {
      // 获取最新的骑行记录（第一个记录）
      const latestRecord = result.data.results[0];

      // 获取详细信息
      if (latestRecord.id) {
        try {
          const detailResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/Getxingzhe/${latestRecord.id}`);
          const detailResult = await detailResponse.json();

          if (detailResult.success && detailResult.data && detailResult.data.data) {
            const detailData = detailResult.data.data;
            // 将详细信息合并到记录中
            latestRecord.avg_speed = detailData.avg_speed;
            latestRecord.duration = detailData.duration;
            latestRecord.calories = detailData.calories;
            latestRecord.max_speed = detailData.max_speed;
            latestRecord.elevation_gain = detailData.elevation_gain;
          }
        } catch (detailError) {
          console.error('获取骑行详细数据失败:', detailError);
        }
      }

      // 添加轨迹缩略图URL（根据uuid生成）
      if (latestRecord.uuid) {
        latestRecord.trackThumbnail = `https://static.imxingzhe.com/workout/${latestRecord.uuid}.png`;
      }

      cyclingData.value = latestRecord;

      // 设置骑行列表数据
      cyclingList.value = result.data.results.map(record => {
        // 为每个记录添加轨迹缩略图URL
        if (record.uuid) {
          record.trackThumbnail = `https://static.imxingzhe.com/workout/${record.uuid}.png`;
        }
        return record;
      });
    } else {
      // 如果API没有返回有效数据，使用模拟数据作为后备
      const mockCyclingData = {
        id: 201235699,
        start_time: 1758948628000,
        end_time: 1758970947000,
        distance: 104180,
        sport: 3,
        title: "2025-09-27 下午 骑行",
        uuid: "46fce1ce-c1f3-4502-baf2-fa4fcadf0d50",
        detail: "",
        trackThumbnail: "https://static.imxingzhe.com/workout/46fce1ce-c1f3-4502-baf2-fa4fcadf0d50.png",
        avg_speed: 21.816,
        duration: 17185,
        calories: 2575000,
        max_speed: 14.17
      };
      cyclingData.value = mockCyclingData;

      // 模拟骑行列表数据
      cyclingList.value = [
        mockCyclingData,
        {
          id: 201235698,
          start_time: 1758848628000,
          end_time: 1758870947000,
          distance: 84180,
          sport: 3,
          title: "2025-09-26 下午 骑行",
          uuid: "46fce1ce-c1f3-4502-baf2-fa4fcadf0d51",
          detail: "",
          trackThumbnail: "https://static.imxingzhe.com/workout/46fce1ce-c1f3-4502-baf2-fa4fcadf0d51.png",
          avg_speed: 19.816,
          duration: 15185,
          calories: 2175000,
          max_speed: 12.17
        },
        {
          id: 201235697,
          start_time: 1758748628000,
          end_time: 1758770947000,
          distance: 64180,
          sport: 3,
          title: "2025-09-25 下午 骑行",
          uuid: "46fce1ce-c1f3-4502-baf2-fa4fcadf0d52",
          detail: "",
          trackThumbnail: "https://static.imxingzhe.com/workout/46fce1ce-c1f3-4502-baf2-fa4fcadf0d52.png",
          avg_speed: 17.816,
          duration: 13185,
          calories: 1875000,
          max_speed: 10.17
        }
      ];
    }
  } catch (error) {
    console.error('获取骑行数据失败:', error);
    // 出错时使用模拟数据作为后备
    const mockCyclingData = {
      id: 201235699,
      start_time: 1758948628000,
      end_time: 1758970947000,
      distance: 104180,
      sport: 3,
      title: "2025-09-27 下午 骑行",
      uuid: "46fce1ce-c1f3-4502-baf2-fa4fcadf0d50",
      detail: "",
      trackThumbnail: "https://static.imxingzhe.com/workout/46fce1ce-c1f3-4502-baf2-fa4fcadf0d50.png",
      avg_speed: 21.816,
      duration: 17185,
      calories: 2575000,
      max_speed: 14.17
    };
    cyclingData.value = mockCyclingData;

    // 模拟骑行列表数据
    cyclingList.value = [
      mockCyclingData,
      {
        id: 201235698,
        start_time: 1758848628000,
        end_time: 1758870947000,
        distance: 84180,
        sport: 3,
        title: "2025-09-26 下午 骑行",
        uuid: "46fce1ce-c1f3-4502-baf2-fa4fcadf0d51",
        detail: "",
        trackThumbnail: "https://static.imxingzhe.com/workout/46fce1ce-c1f3-4502-baf2-fa4fcadf0d51.png",
        avg_speed: 19.816,
        duration: 15185,
        calories: 2175000,
        max_speed: 12.17
      },
      {
        id: 201235697,
        start_time: 1758748628000,
        end_time: 1758770947000,
        distance: 64180,
        sport: 3,
        title: "2025-09-25 下午 骑行",
        uuid: "46fce1ce-c1f3-4502-baf2-fa4fcadf0d52",
        detail: "",
        trackThumbnail: "https://static.imxingzhe.com/workout/46fce1ce-c1f3-4502-baf2-fa4fcadf0d52.png",
        avg_speed: 17.816,
        duration: 13185,
        calories: 1875000,
        max_speed: 10.17
      }
    ];
  }
};

// 存储当前状态的开始时间（时间戳）
const statusStartTime = ref(Math.floor(Date.now() / 1000));




// 控制状态详情弹窗的显示/隐藏
const isStatusDialogVisible = ref(false);

// 显示状态详情弹窗
const showStatusDetails = () => {
  isStatusDialogVisible.value = true;
};

// 关闭状态详情弹窗
const closeStatusDialog = () => {
  isStatusDialogVisible.value = false;
};

// 控制应用状态详情弹窗的显示/隐藏
const isAppStatusDialogVisible = ref(false);


// 关闭应用状态详情弹窗
const closeAppStatusDialog = () => {
  isAppStatusDialogVisible.value = false;
};

// 控制应用状态提示弹窗的显示/隐藏
const isAppStatusTooltipVisible = ref(false);

// 显示应用状态提示弹窗
const showAppStatusTooltip = () => {
  isAppStatusTooltipVisible.value = true;
};

// 关闭应用状态提示弹窗
const closeAppStatusTooltip = () => {
  isAppStatusTooltipVisible.value = false;
};


// 组件挂载时获取数据、启动定时器和初始化智能活动推荐
onMounted(async () => {
  // 初始获取数据
  fetchStatusData();
  fetchCyclingData();
  // 每15秒更新一次数据
  //updateInterval = setInterval(fetchStatusData, 15000);

  // 每30秒自动更新相对时间显示
  relativeTimeInterval = setInterval(() => {
    // 强制Vue重新渲染相对时间
    lastUpdated.value = new Date(lastUpdated.value.getTime());
  }, 30000);

  // 为RecentActivitiesView提供一个事件监听机制
  window.addEventListener('requestActivityData', () => {
    console.log('接收到RecentActivitiesView的数据请求');
    // 确保有数据可以发送
    if (processedActivityRecords.value.length === 0) {
      console.log('当前没有可用数据，尝试重新获取');
      fetchStatusData().then(() => {
        // 发送事件，传递处理后的活动数据
        window.dispatchEvent(new CustomEvent('activityDataReady', {
          detail: processedActivityRecords.value
        }));
      });
    } else {
      // 直接发送现有数据
      window.dispatchEvent(new CustomEvent('activityDataReady', {
        detail: processedActivityRecords.value
      }));
    }
  });

  // 连接Socket.IO服务器，自动接收在线人数更新（服务端会主动推送）
  connectSocket();
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
  if (relativeTimeInterval) clearInterval(relativeTimeInterval);
  // 清除底部弹窗 - 添加更严格的存在性检查
  try {
    if (typeof bottomSheet !== 'undefined' && bottomSheet !== null) {
      if (typeof bottomSheet.showed !== 'undefined') bottomSheet.showed = false;
      if (typeof bottomSheet.removeAllEventListeners === 'function') {
        bottomSheet.removeAllEventListeners('close');
      }
    }
  } catch (error) {
    console.warn('清理底部弹窗时出错，但不影响程序运行:', error);
  }

  // 断开Socket.IO连接
  disconnectSocket();
});

// 组件从缓存恢复时更新数据
onActivated(() => {
  //fetchStatusData();

  // 发送广播通知数据已更新
  setTimeout(() => {
    if (processedActivityRecords.value.length > 0) {
      window.dispatchEvent(new CustomEvent('activityDataUpdated', {
        detail: processedActivityRecords.value
      }));
    }
  }, 1000);
});

// 双击头像戳一戳功能
const handleAvatarDoubleClick = () => {
  // 使用已有的随机语录功能
  const randomMessage = getRandomFeedback();
  Snackbar.builder(randomMessage);
}

// 添加处理页面关闭的函数
const handleBeforeUnload = () => {
  // 断开Socket.IO连接
  disconnectSocket();
  // 断开音乐Socket连接
  disconnectMusicSocket();
};

</script>

<style lang="scss" scoped>
.profile-view {
  display: flex;
  margin-top: 18px;
  flex-direction: column;
  margin: 5px;
  gap: 16px;
}

.profile-card {
  width: 100%;
  transition: all 0.3s ease;
}

/* 卡片头部样式 */
.profile-header {
  padding: 16px;
  display: flex;
  align-items: center;
  position: relative;
}

/* 主要flex容器样式 */
.profile-header .mdui-flex {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.avatar-container {
  margin-right: 16px;
  position: relative;
  z-index: 1;
}

.avatar-image {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 头像徽标样式 */
.avatar-badge {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-badge {
  bottom: 0;
  right: -8px;
  z-index: 10;
}

.online-status {
  /* 在线状态特殊样式 */
  background-color: #4CAF50 !important;
  border: 2px solid #fff;
  width: 18px;
  height: 18px;
  display: flex;
  margin-right: 5px;
  align-items: center;
  justify-content: center;
  /* 确保在线状态时只显示绿色圆点，不显示图标 */
}

.online-status .status-icon {
  display: none;

}

/* 音乐播放状态样式 */
.music-playing {
  background-color: #2196F3 !important;
  border: 2px solid #fff;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon {
  font-size: 14px;
  color: white;
}

.profile-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 媒体信息容器样式 */
.media-info-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  white-space: nowrap;
  z-index: 1;
}

/* 社交媒体按钮样式 */
.social-media-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  background-color: rgba(33, 150, 243, 0.1);
  border-color: rgba(33, 150, 243, 0.3);
}

.social-media-button:hover {
  background-color: rgba(33, 150, 243, 0.2);
  border-color: rgba(33, 150, 243, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
}

.media-icon {
  color: #2196F3;
  font-size: 16px;
}

.media-text {
  color: #2196F3;
  font-size: 0.875rem;
  font-weight: 500;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

/* IP属地展示样式 */
.ip-location-container {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  color: #999;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  width: fit-content;
  transition: all 0.3s ease;
}


.ip-location-label {
  font-size: 0.70rem;
  color: #999;

  font-weight: 500;
}


/* iOS风格电池样式 */
.ios-battery-container {
  gap: 8px;
  animation: fadeIn 0.3s ease-in-out;
}

/* IP地址更新时间样式 */
.ip-address {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-time-info {
  font-size: 11px;
  color: #999;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.update-time-info:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #666;
}

.ios-battery {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ios-battery-top {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: -4px;
  width: 4px;
  height: 8px;
  border-radius: 0 2px 2px 0;
  background-color: #333;
}

.ios-battery-body {
  width: 40px;
  height: 16px;
  border: 2px solid #333;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 2px;
  background-color: #fff;
}

.ios-battery-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.5s ease, background-color 0.3s ease;
}

.ios-battery-percentage {
  font-size: 0.875rem;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: color 0.3s ease;
}

.ios-charging-icon {
  font-size: 12px;
  margin-left: 2px;
  animation: pulse 1.5s infinite;
}

/* 电池电量级别样式 */
.battery-level-high .ios-battery-fill {
  background-color: #34c759;
}

.battery-level-high .ios-battery-percentage {
  color: #34c759;
}

.battery-level-medium .ios-battery-fill {
  background-color: #ffcc00;
}

.battery-level-medium .ios-battery-percentage {
  color: #ffcc00;
}

.battery-level-low .ios-battery-fill {
  background-color: #ff3b30;
}

.battery-level-low .ios-battery-percentage {
  color: #ff3b30;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* 更新时间容器样式 */
.update-time-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 信息图标样式 */
.info-icon {
  font-size: 14px;
  color: #2196F3;
  cursor: pointer;
  margin-left: 4px;
}


/* 状态容器样式 */
.status-container {
  padding: 12px 16px;
}

.status-label {
  font-size: 0.875rem;
  color: #666;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.update-time {
  font-size: 0.75rem;
  color: #999;
}

/* 活动卡片样式 */
.activity-card {
  margin: 16px;
  width: calc(100% - 32px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.active-app-section {
  padding: 16px;
  margin-left: 0;
  display: flex;
  align-items: center;
}

.app-icon {
  margin-right: 12px;
  color: #2196F3;
  font-size: 20px;
}

.active-app-info {
  flex-grow: 1;
}

.active-app-name {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 2px 0;
  color: #333;
}

.active-app-status {
  font-size: 0.75rem;
  color: #666;
  margin: 0;
}

.package-name {
  margin-bottom: 4px;
}

/* 响应式设计优化 */
@media (max-width: 360px) {
  .activity-card {
    margin: 12px;
    width: calc(100% - 24px);
  }

  .active-app-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .active-app-name {
    margin-top: 6px;
    margin-left: 0;
  }

  .mdui-flex.mdui-justify-between {
    width: 100%;
  }

  /* 确保按钮在小屏幕上排列合理 */
  .mdui-flex.mdui-items-center.gap-2 {
    width: 100%;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

/* 通用

.mdui-card-content {
  padding: 16px;
}

.mdui-icon {
  vertical-align: middle;
  font-size: inherit;
}

/* 锁屏状态容器美化样式 */
.lock-status-container {
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #f5f5f5;
  transition: all 0.2s ease;
  cursor: pointer;
}

.lock-status-container:hover {
  background-color: #eeeeee;
  transform: translateY(-1px);
}

.lock-icon-container {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ff980020;
}

.lock-status-icon {
  font-size: 18px;
  color: #ff9800;
}

.lock-status {
  font-weight: 500;
}

/* 响应式锁屏状态布局 */
@media (max-width: 360px) {
  .lock-status-container {
    padding: 6px 10px;
    width: 100%;
  }

  .lock-icon-container {
    width: 28px;
    height: 28px;
  }

  .lock-status-icon {
    font-size: 16px;
  }
}

.active-app-name {
  margin-top: 6px;
  margin-left: 0;
}

/* 锁屏幕状态样式 */
.lock-screen-content {
  width: 100%;
}

.lock-screen-header {
  margin-bottom: 16px;
}

.lock-status-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.possible-activities-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin: 0 0 8px 0;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.activity-option:hover {
  background-color: #e9ecef;
  transform: translateX(2px);
}

.activity-icon {
  color: #2196F3;
  margin-right: 8px;
  font-size: 16px;
}

.activity-text {
  font-size: 0.875rem;
  color: #333;
}

/* 响应式调整 */
@media (max-width: 360px) {
  .activity-option {
    padding: 8px 10px;
  }
}

/* 近期数据统计模块样式 */
.recent-data-section {
  border-radius: 8px;
  transition: all 0.3s ease;
  margin-top: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
}

.recent-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.stat-item {
  flex: 1;
  min-width: 100px;
  background-color: white;
  margin: 2px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(33, 150, 243, 0.1);
}

.stat-item:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: rgba(33, 150, 243, 0.3);
}

.stat-item:active {
  transform: translateY(0);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #2196F3, #03A9F4);
}

.stat-number {
  font-size: 1rem;
  font-weight: 600;
  margin-left: 4px;
  color: #2196F3;
  margin-bottom: 4px;
  transition: color 0.2s ease;
}

.stat-item:hover .stat-number {
  color: #03A9F4;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  margin-left: 4px;
  font-weight: 500;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}

.total-duration-desc {
  font-size: 12px;
  color: #666;
  background-color: rgba(33, 150, 243, 0.08);
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.total-duration-desc:hover {
  background-color: rgba(33, 150, 243, 0.12);
  color: #2196F3;
}

/* 加载状态和错误信息样式 */
.loading-container {
  background-color: #f5f5f5;
  padding: 10px 16px;
  border-radius: 4px;
  margin: 8px 0;
}

.loading-spinner {
  color: #2196F3;
}

.loading-text {
  color: #666;
  font-size: 14px;
}

.error-container {
  background-color: #ffebee;
  padding: 10px 16px;
  border-radius: 4px;
  margin: 8px 0;
  border-left: 4px solid #f44336;
}

.error-icon {
  color: #f44336;
}

.error-text {
  color: #d32f2f;
  font-size: 14px;
}

.retry-button {
  color: #2196F3;
  text-transform: uppercase;
  font-weight: 500;
  font-size: 12px;
}

.retry-button:hover {
  background-color: rgba(33, 150, 243, 0.08);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .recent-stats {
    justify-content: center;
  }

  .stat-item {
    min-width: 90px;
  }

  .stat-number {
    font-size: 0.9rem;
  }
}

@media (max-width: 360px) {
  .recent-data-section {
    padding: 12px;
  }

  .recent-stats {
    gap: 8px;
  }

  .stat-item {
    min-width: 80px;
    padding: 12px 8px;
  }

  .stat-number {
    font-size: 0.875rem;
  }
}

.beian-link {
  font-size: 13px;
  color: #555;
  text-decoration: none;
  transition: all 0.3s ease;
  // padding: 6px 12px;
  border-radius: 4px;
  // background-color: rgba(255, 255, 255, 0.7);
  // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  // border: 1px solid #e0e0e0;
  font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
  font-weight: 500;
}


.beian-link::before {
  content: '公网安';
  display: inline-block;
  margin-right: 4px;
  color: #1a73e8;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {

  .beian-link {
    font-size: 12px;
    padding: 5px 10px;
  }
}
</style>
