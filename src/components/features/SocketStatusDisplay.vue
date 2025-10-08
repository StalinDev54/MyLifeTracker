<template>
  <div class="online-status-container">
    <!-- 在线人数头像显示区域：仅当socket连接且在线人数>0时显示 -->
    <div class="avatars-container" v-if="socketConnected && onlineUsers > 0">
      <!-- 显示前3个用户头像 -->
      <s-avatar v-for="index in Math.min(displayedOnlineUsers, 3)" :key="index"
        :src="`https://api.dicebear.com/7.x/personas/svg?seed=${socketId || 'default'}-${index}`" :alt="`在线用户 ${index}`"
        class="user-avatar">
        <s-badge slot="badge" class="online-badge"></s-badge>
      </s-avatar>

      <!-- 显示在线状态文本 -->
      <div class="status-text">
        <!-- 1-3人时显示精确人数 -->
        <template v-if="displayedOnlineUsers <= 3">
          <div style="font-size: small;">&nbsp; &nbsp; &nbsp;在线</div>
        </template>
        &nbsp;
        <!-- 超过3人时显示简化信息 -->
        <template v-else>
          <div style="font-size: small;"> &nbsp;&nbsp; &nbsp; &nbsp; 等{{ displayedOnlineUsers }} 人在线
          </div>
        </template>
      </div>
    </div>

    <!-- 连接状态指示器 - 仅在调试模式或连接状态变化时显示 -->
    <div v-if="showConnectionStatus" class="connection-status-indicator">
      <span :class="['connection-dot', { 'connected': socketConnected }]"></span>
      <span v-if="lastUpdatedOnline" class="last-update-time">{{ formatTime(lastUpdatedOnline) }}</span>
    </div>
  </div>

</template>

<script setup>
import { defineProps, computed, watch, ref } from 'vue';

// 定义组件属性
const props = defineProps({
  onlineUsers: {
    type: Number,
    default: 0
  },
  lastUpdatedOnline: {
    type: Date,
    default: null
  },
  socketConnected: {
    type: Boolean,
    default: false
  },
  socketId: {
    type: String,
    default: ''
  }
});

// 防抖处理的在线用户数
const displayedOnlineUsers = ref(props.onlineUsers);
// 是否显示连接状态指示器
const showConnectionStatus = ref(false);

// 防抖函数 - 避免频繁更新在线用户数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 防抖更新在线用户数的函数
const debouncedUpdateOnlineUsers = debounce((value) => {
  displayedOnlineUsers.value = value;
}, 300); // 300ms防抖

// 监听onlineUsers变化，使用防抖函数更新显示值
watch(
  () => props.onlineUsers,
  (newValue) => {
    debouncedUpdateOnlineUsers(newValue);
  },
  { immediate: true }
);

// 监听socket连接状态变化
watch(
  () => props.socketConnected,
  (newStatus, oldStatus) => {
    // 仅在连接状态变化时显示状态指示器
    if (newStatus !== oldStatus) {
      showConnectionStatus.value = true;
      // 3秒后隐藏状态指示器
      setTimeout(() => {
        showConnectionStatus.value = false;
      }, 3000);
    }
  }
);

// 格式化时间显示
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};
</script>

<style scoped>
.online-status-container {
  display: flex;
  align-items: center;
  position: relative;
}

.avatars-container {
  display: flex;
  align-items: center;
  transition: opacity 0.3s ease;
}

.user-avatar {
  margin-right: -8px;
  /* 头像重叠效果 */
  border: 2px solid #fff;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: translateY(-2px);
  z-index: 10;
}

.online-badge {
  background-color: #4caf50;
  width: 8px;
  height: 8px;
  min-width: unset;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* 连接状态指示器样式 */
.connection-status-indicator {
  display: flex;
  align-items: center;
  margin-left: 8px;
  font-size: 10px;
  color: #999;
}

.connection-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f44336;
  margin-right: 4px;
  transition: background-color 0.3s ease;
}

.connection-dot.connected {
  background-color: #4caf50;
  animation: pulse 2s infinite;
}

.last-update-time {
  white-space: nowrap;
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }

  70% {
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .avatars-container {
    transform: scale(0.9);
  }
}
</style>