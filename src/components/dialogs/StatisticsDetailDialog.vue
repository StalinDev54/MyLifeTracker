<template>
  <div v-if="visible" class="detail-dialog-overlay" @click="close">
    <div class="detail-dialog-container" @click.stop ref="dialogContainer" @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove" @touchend.passive="handleTouchEnd" :style="containerStyle">
      <!-- iOS风格头部 - 包含小白条 -->
      <div class="detail-dialog-header">
        <!-- iOS风格小白条 -->
        <div class="ios-drag-handle" @touchstart.passive.stop="handleDragHandleTouchStart"></div>

        <h3 class="detail-dialog-title">用户详情</h3>
      </div>

      <!-- iOS风格内容区域 -->
      <div class="detail-dialog-content">
        <!-- 用户基本信息部分 -->
        <div class="user-basic-section">
          <div class="user-avatar" :style="{ backgroundColor: userInfo.avatarColor }">
            {{ userInfo.initial }}
          </div>
          <div class="user-info-text">
            <h4 class="user-name">{{ userInfo.name }}</h4>
            <p class="user-visit-count"> {{ formatFullDateTime(userInfo.startTime) }}</p>
          </div>
        </div>
        <div class="divider"></div>

        <!-- 设备信息 - iOS风格列表 -->
        <div class="ios-style-list">
          <div class="detail-info-item">
            <span class="detail-info-label">设备</span>
            <span class="detail-info-value">{{ userInfo.device || '未知设备' }}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">系统</span>
            <span class="detail-info-value">{{ userInfo.os || '未知系统' }}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">网络</span>
            <span class="detail-info-value">{{ userInfo.network || '未知网络' }}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">地区</span>
            <span class="detail-info-value">{{ userInfo.area || '未知地区' }}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">版本</span>
            <span class="detail-info-value">{{ userInfo.version || '未知版本' }}</span>
          </div>

          <div class="detail-info-item">
            <span class="detail-info-label">屏幕</span>
            <span class="detail-info-value">{{ userInfo.screen || '未知分辨率' }}</span>
          </div>


        </div>

        <!-- 社交媒体信息 -->
        <template v-if="userInfo.socialMedia">
          <div class="divider"></div>
          <div class="social-media-section">
            <h5 class="section-title">社交媒体</h5>
            <div class="social-item">
              <span class="social-platform">{{ userInfo.socialMedia.platform }}: </span>
              <span class="social-content">{{ userInfo.socialMedia.content }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({
      name: '未知用户',
      avatarColor: '#409EFF',
      initial: '?',
      visitCount: 0,
      device: '未知设备',
      os: '未知系统',
      network: '未知网络',
      area: '未知地区',
      version: '未知版本',
      channel: '未知渠道',
      screen: '未知分辨率',
      startTime: null,
      duration: '未知',
      socialMedia: null
    })
  }
});

const emit = defineEmits(['close']);

// 拖拽相关变量
const dialogContainer = ref(null);
const startY = ref(0);
const currentY = ref(0);
const isDragging = ref(false);
const dragThreshold = 100; // 关闭阈值

const formatFullDateTime = (timestamp) => {
  if (!timestamp) return '未知时间';

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
  e.preventDefault(); // 阻止默认行为，防止页面滚动
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
  e.preventDefault(); // 阻止默认行为，防止页面滚动
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
</script>

<style scoped>
.detail-dialog-overlay {
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

.detail-dialog-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
}

.detail-dialog-header {
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

.detail-dialog-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.02em;
}

.detail-dialog-content {
  padding: 0;
}

/* 用户基本信息样式 */
.user-basic-section {
  background-color: rgba(242, 242, 247, 0.7);
  padding: 16px;
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 48px;
  height: 48px;
  font-size: 20px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-info-text {
  flex: 1;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.01em;
}

.user-visit-count {
  margin: 0;
  font-size: 0.75rem;
  color: #6c6c70;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
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

/* 详情信息样式 - iOS风格 */
.detail-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.detail-info-item:last-child {
  border-bottom: none;
}

.detail-info-item:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.detail-info-label {
  font-size: 0.875rem;
  color: #6c6c70;
}

.detail-info-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #3a3a3c;
  text-align: right;
}

.duration-info {
  color: #007aff;
  font-weight: 600;
  font-size: 1rem;
}

/* 社交媒体信息样式 */
.social-media-section {
  padding: 16px;
  background-color: rgba(242, 242, 247, 0.7);
  margin: 16px;
  border-radius: 12px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #000000;
}

.social-item {
  font-size: 0.875rem;
  line-height: 1.4;
}

.social-platform {
  color: #007aff;
  font-weight: 500;
}

.social-content {
  color: #3a3a3c;
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

/* 响应式设计 - iOS风格适配 */
@media (min-width: 768px) {
  .detail-dialog-container {
    width: 90%;
    max-width: 500px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  .detail-dialog-overlay {
    align-items: center;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}
</style>