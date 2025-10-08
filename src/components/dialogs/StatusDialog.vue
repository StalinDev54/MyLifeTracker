<template>
  <div v-if="visible" class="status-dialog-overlay" @click="close">
    <div class="status-dialog-container" @click="handleContainerClick" ref="dialogContainer" @touchstart="handleTouchStart"
      @touchmove="handleTouchMove" @touchend="handleTouchEnd" :style="containerStyle">
      <!-- iOS风格头部 - 包含小白条 -->
      <div class="status-dialog-header">
        <!-- iOS风格小白条 -->
        <div class="ios-drag-handle" @touchstart="handleDragHandleTouchStart"></div>

        <h3 class="status-dialog-title">状态详情</h3>
      </div>

      <!-- iOS风格内容区域 -->
      <div class="status-dialog-content">
        <!-- 应用状态信息部分（仅在提供了appPackage时显示） -->
        <template v-if="appPackage || appUsageDescription">
          <div class="app-status-section">
            <div class="app-info-header">
              <mdui-avatar class="app-avatar">
                <mdui-icon :name="currentActivity.icon || 'apple'" size="24"></mdui-icon>
              </mdui-avatar>
              <div class="app-info-text">
                <h4 class="app-name">{{ currentActivity.name || '未知应用' }}</h4>
                <p class="app-package" v-if="appPackage">{{ appPackage }}</p>
              </div>
            </div>

            <div v-if="appUsageDescription" class="app-usage-section">
              <h5 class="section-title">应用用途</h5>
              <p class="app-usage-description">{{ appUsageDescription }}</p>
            </div>
          </div>
          <div class="divider"></div>
        </template>

        <!-- 常规状态信息 - iOS风格列表 -->
        <div class="ios-style-list">
          <!-- 锁屏状态下，优先显示首次锁屏记录的完整信息 -->
          <template v-if="!currentStatus.isOnline && firstLockRecord">
            <div class="status-info-item">
              <span class="status-info-label">当前状态</span>
              <span class="status-info-value">{{ currentStatus.label }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">开始时间</span>
              <span class="status-info-value">{{ formatFullDateTime(firstLockRecord.time ? firstLockRecord.time :
                startTime) }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">持续时长</span>
              <span class="status-info-value status-duration-value">{{ currentDuration }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">设备类型</span>
              <span class="status-info-value">{{ deviceTypeLabels[firstLockRecord.device] || getDeviceTypeLabel()
                }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">IP地址</span>
              <span class="status-info-value">{{ firstLockRecord.ip || deviceStatus.ip || '未知' }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">电池电量</span>
              <span class="status-info-value battery-info">
                <mdui-icon :name="firstLockRecord.is_charging ? 'battery_charging_full' : 'battery_full'" size="16"
                  class="battery-icon"></mdui-icon>
                {{ firstLockRecord.battery }}% <span class="lock-battery-note">(锁屏时)</span>
              </span>
            </div>
          </template>
          <!-- 未锁屏或没有首次锁屏记录时，显示实时信息 -->
          <template v-else>
            <div class="status-info-item">
              <span class="status-info-label">当前状态</span>
              <span class="status-info-value">{{ currentStatus.label }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">开始时间</span>
              <span class="status-info-value">{{ formatFullDateTime(startTime) }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">持续时长</span>
              <span class="status-info-value status-duration-value">{{ currentDuration }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">设备类型</span>
              <span class="status-info-value">{{ getDeviceTypeLabel() }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">IP地址</span>
              <span class="status-info-value">{{ deviceStatus.ip || '未知' }}</span>
            </div>
            <div class="status-info-item">
              <span class="status-info-label">电池电量</span>
              <span class="status-info-value battery-info">
                <template v-if="!currentStatus.isOnline && lockBatteryLevel !== null">
                  <mdui-icon :name="deviceStatus.battery.charging ? 'battery_charging_full' : 'battery_full'" size="16"
                    class="battery-icon"></mdui-icon>
                  {{ lockBatteryLevel }}% <span class="lock-battery-note">(锁屏时)</span>
                </template>
                <template v-else>
                  <mdui-icon :name="deviceStatus.battery.charging ? 'battery_charging_full' : 'battery_full'" size="16"
                    class="battery-icon"></mdui-icon>
                  {{ deviceStatus.battery.level }}%
                </template>
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  currentStatus: {
    type: Object,
    default: () => ({ label: '在线' })
  },
  deviceStatus: {
    type: Object,
    default: () => ({
      device: 'unknown',
      ip: '',
      battery: { level: 50, charging: false }
    })
  },
  lockBatteryLevel: {
    type: [Number, null],
    default: null
  },
  firstLockRecord: {
    type: [Object, null],
    default: null
  },
  currentActivity: {
    type: Object,
    default: () => ({
      name: '未知应用',
      description: '',
      icon: ''
    })
  },
  appPackage: {
    type: String,
    default: ''
  },
  appUsageDescription: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

const currentDuration = ref('0秒');
let durationTimer = null;

// 拖拽相关变量
const dialogContainer = ref(null);
const startY = ref(0);
const currentY = ref(0);
const isDragging = ref(false);
const dragThreshold = 100; // 关闭阈值

const deviceTypeLabels = {
  'phone': '手机',
  'tablet': '平板',
  'computer': '电脑',
  'unknown': '未知设备'
};

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

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟${remainingSeconds > 0 ? `${remainingSeconds}秒` : ''}`;
  } else if (minutes > 0) {
    return `${minutes}分钟${remainingSeconds > 0 ? `${remainingSeconds}秒` : ''}`;
  } else {
    return `${remainingSeconds}秒`;
  }
};

const getDeviceTypeLabel = () => {
  return deviceTypeLabels[props.deviceStatus.device] || '未知设备';
};

const updateDuration = () => {
  const now = Math.floor(Date.now() / 1000);
  // 锁屏状态下，使用首次锁屏时间计算持续时长
  const startTime = (!props.currentStatus.isOnline && props.firstLockRecord && props.firstLockRecord.time)
    ? props.firstLockRecord.time
    : props.startTime;
  const durationSeconds = now - startTime;
  currentDuration.value = formatDuration(durationSeconds);
};

const close = () => {
  emit('close');
};

// 拖拽相关方法
const handleTouchStart = (e) => {
  e.preventDefault(); // 阻止默认行为，防止页面滚动
  startY.value = e.touches[0].clientY;
  isDragging.value = true;
};

const handleTouchMove = (e) => {
  if (!isDragging.value) return;

  const touchY = e.touches[0].clientY;
  const diffY = touchY - startY.value;

  // 只允许向下拖拽（在移动端）
  if (diffY > 0) {
    currentY.value = diffY;
  } else {
    // 向上拖拽时限制距离，创造弹性效果
    currentY.value = Math.max(diffY * 0.3, -50);
  }
};

const handleTouchEnd = (e) => {
  if (!isDragging.value) return;

  // 如果拖拽距离超过阈值则关闭弹窗
  if (currentY.value > dragThreshold) {
    close();
  }

  // 重置拖拽状态
  currentY.value = 0;
  isDragging.value = false;
};

// 专门处理小白条的拖拽开始，确保事件不会冒泡
const handleDragHandleTouchStart = (e) => {
  e.stopPropagation();
  handleTouchStart(e);
};

// 处理容器点击事件，阻止事件冒泡
const handleContainerClick = (event) => {
  event.stopPropagation();
};

// 计算容器样式
const containerStyle = computed(() => {
  if (!currentY.value) return {};

  // 计算透明度和缩放比例，模拟iOS拖拽效果
  const opacity = 1 - Math.min(currentY.value / 300, 0.3);
  const scale = 1 - Math.min(currentY.value / 1000, 0.05);

  return {
    transform: `translateY(${currentY.value}px) scale(${scale})`,
    opacity: opacity,
    transition: 'none' // 拖拽时禁用过渡效果
  };
});

onMounted(() => {
  if (props.visible) {
    startTimer();
  }
});

// 监听visible属性变化
import { watch } from 'vue';
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    startTimer();
  } else {
    stopTimer();
  }
});

const startTimer = () => {
  updateDuration();
  if (!durationTimer) {
    durationTimer = setInterval(updateDuration, 1000);
  }
};

const stopTimer = () => {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
};

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.status-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
  overflow: hidden;
}

.status-dialog-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
}

.status-dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px 16px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* iOS风格小白条 - 拖拽指示器 */
.ios-drag-handle {
  width: 56px;
  height: 5px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2.5px;
  margin-bottom: 12px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  cursor: grab;
}

.ios-drag-handle:active {
  cursor: grabbing;
  opacity: 0.9;
}

.status-dialog-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.02em;
}

.status-close-button {
  color: #007aff;
  --mdui-button-opacity: 0.7;
  transition: --mdui-button-opacity 0.2s ease;
}

.status-close-button:hover {
  --mdui-button-opacity: 1;
}

.status-dialog-content {
  padding: 0;
}

/* 应用状态信息样式 */
.app-status-section {
  background-color: rgba(242, 242, 247, 0.7);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.app-info-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.app-avatar {
  background-color: #007aff;
  width: 48px;
  height: 48px;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.app-info-text {
  flex: 1;
}

.app-name {
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.01em;
}

.app-package {
  margin: 0;
  font-size: 0.75rem;
  color: #6c6c70;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.app-usage-section {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 8px;
}

.section-title {
  margin: 0 0 6px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #000000;
}

.app-usage-description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #3a3a3c;
}

.divider {
  height: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  margin: 0 0 0 0;
}

/* iOS风格列表 */
.ios-style-list {
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  margin: 16px;
}

/* 常规状态信息样式 - iOS风格 */
.status-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.status-info-item:last-child {
  border-bottom: none;
}

.status-info-item:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.status-info-label {
  font-size: 0.875rem;
  color: #6c6c70;
}

.status-info-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #3a3a3c;
  text-align: right;
}

.status-duration-value {
  color: #007aff;
  font-weight: 600;
  font-size: 1rem;
}

/* 电池信息样式 */
.battery-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 锁屏电量注释样式 */
.lock-battery-note {
  font-size: 0.7rem;
  color: #6c6c70;
  font-weight: normal;
}

.battery-icon {
  color: #34c759;
}

/* iOS风格动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }

  100% {
    opacity: 1;
  }
}

/* 响应式设计 - iOS风格适配 */
@media (min-width: 768px) {
  .status-dialog-container {
    width: 90%;
    max-width: 500px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  .status-dialog-overlay {
    align-items: center;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}
</style>