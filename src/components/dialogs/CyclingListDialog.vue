<template>
  <!-- 使用 Teleport 将弹窗挂载到 body 上，确保显示在最顶层 -->
  <Teleport to="body">
    <!-- iOS风格底部弹窗骑行列表 -->
    <div v-if="visible" class="cycling-list-bottom-sheet-overlay" @click="handleOverlayClick">
      <div class="cycling-list-bottom-sheet" :class="{ 'sheet-enter': visible }">
        <!-- 顶部拖拽指示器 -->
        <div class="drag-indicator-container" @touchstart.passive="handleDragStart" @touchmove.passive="handleDragMove"
          @touchend.passive="handleDragEnd" @mousedown="handleDragStart" @mousemove="handleDragMove" @mouseup="handleDragEnd">
          <div class="drag-indicator"></div>
        </div>

        <!-- 对话框头部 -->
        <div class="dialog-header">
          <h2 class="dialog-title">骑行记录</h2>
          <div class="record-count">数据同步于行者APP</div>
        </div>

        <!-- 骑行列表内容 -->
        <div class="cycling-list-content">
          <div v-if="cyclingList.length === 0" class="empty-state">
            <div class="empty-icon">🚴</div>
            <p class="empty-text">暂无骑行记录</p>
            <p class="empty-subtext">骑行后将显示在这里</p>
          </div>

          <div v-else class="cycling-list">
            <!-- 骑行记录列表 -->
            <div v-for="(record, index) in cyclingList" :key="record.id" class="cycling-item"
              @click="handleRecordClick(record)">
              <!-- 骑行记录封面 -->
              <div class="cycling-cover-wrapper">
                <img v-if="record.trackThumbnail" :src="record.trackThumbnail" :alt="record.title"
                  class="cycling-cover" />
                <div v-else class="cycling-cover-placeholder">
                  <mdui-icon name="directions_bike" class="placeholder-icon"></mdui-icon>
                </div>
              </div>

              <div class="cycling-details">
                <div class="cycling-main-info">
                  <h3 class="cycling-title">{{ record.title }}</h3>
                  <p class="cycling-subtitle">{{ formatDateTime(record.start_time) }}</p>
                </div>
                <!-- 骑行数据 -->
                <div class="cycling-data">
                  <div class="data-item">
                    <div class="data-label">距离</div>
                    <div class="data-value">{{ formatDistance(record.distance) }}</div>
                  </div>
                  <div class="data-item">
                    <div class="data-label">时长</div>
                    <div class="data-value">{{ formatDurationFromSeconds(record.duration) ||
                      formatDuration(record.start_time, record.end_time) }}
                    </div>
                  </div>
                  <div class="data-item">
                    <div class="data-label">全程均速</div>
                    <div class="data-value">{{ formatSpeed(record.avg_speed) ||
                      calculateSpeed(record.distance,
                        record.start_time, record.end_time) }}</div>
                  </div>
                </div>
              </div>

              <!-- 右侧信息区域 -->
              <div class="cycling-right-info">
                <div class="cycling-more">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部安全区域 -->
        <div class="safe-area-bottom"></div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'CyclingListDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    cyclingList: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'record-click'],
  data() {
    return {
      // 拖拽相关状态
      dragStartY: undefined,
      dragStartTime: undefined
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  },
  methods: {
    // 处理遮罩层点击
    handleOverlayClick(event) {
      if (event.target === event.currentTarget) {
        this.$emit('close');
      }
    },

    // 处理拖拽开始
    handleDragStart(event) {
      // 获取初始位置
      const touch = event.touches ? event.touches[0] : event;
      this.dragStartY = touch.clientY;
      this.dragStartTime = new Date().getTime();

      // 添加事件监听器
      const sheet = document.querySelector('.cycling-list-bottom-sheet');
      if (sheet) {
        sheet.style.transition = 'none';
      }
    },

    // 处理拖拽移动
    handleDragMove(event) {
      if (this.dragStartY === undefined) return;

      // 获取当前位置
      const touch = event.touches ? event.touches[0] : event;
      const currentY = touch.clientY;
      const deltaY = currentY - this.dragStartY;

      // 只处理向下拖拽
      if (deltaY > 0) {
        const sheet = document.querySelector('.cycling-list-bottom-sheet');
        if (sheet) {
          // 计算拖拽进度 (最大拖拽距离为屏幕高度的1/3)
          const maxDragDistance = window.innerHeight / 3;
          const dragProgress = Math.min(deltaY / maxDragDistance, 1);

          // 应用变换
          sheet.style.transform = `translateY(${deltaY}px)`;
          sheet.style.opacity = 1 - (dragProgress * 0.5);
        }
      }
    },

    // 处理拖拽结束
    handleDragEnd(event) {
      if (this.dragStartY === undefined) return;

      const touch = event.changedTouches ? event.changedTouches[0] : event;
      const currentY = touch.clientY;
      const deltaY = currentY - this.dragStartY;
      const dragDuration = new Date().getTime() - this.dragStartTime;

      // 重置拖拽起始位置
      this.dragStartY = undefined;
      this.dragStartTime = undefined;

      const sheet = document.querySelector('.cycling-list-bottom-sheet');
      if (sheet) {
        // 恢复过渡动画
        sheet.style.transition = '';

        // 判断是否应该关闭弹窗
        // 条件1: 拖拽距离超过屏幕高度的1/4
        // 条件2: 拖拽速度足够快 (快速下滑)
        const shouldClose =
          deltaY > window.innerHeight / 4 ||
          (deltaY > 50 && dragDuration < 300);

        if (shouldClose) {
          // 执行关闭动画
          sheet.style.transform = `translateY(100%)`;
          sheet.style.opacity = '0';

          // 延迟关闭弹窗
          setTimeout(() => {
            this.$emit('close');
          }, 300);
        } else {
          // 恢复原始位置
          sheet.style.transform = 'translateY(0)';
          sheet.style.opacity = '1';
        }
      }
    },

    // 格式化日期时间显示
    formatDateTime(timestamp) {
      if (!timestamp) return '未知时间';

      // 处理毫秒时间戳
      const date = new Date(timestamp);
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
    },

    // 格式化距离显示 (米转公里)
    formatDistance(distance) {
      if (!distance) return '0 km';
      return `${(distance / 1000).toFixed(1)} km`;
    },

    // 计算骑行时长（从秒数）
    formatDurationFromSeconds(durationInSeconds) {
      if (!durationInSeconds) return '';

      const durationMinutes = Math.floor(durationInSeconds / 60);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}min`;
      } else {
        return `${minutes}min`;
      }
    },

    // 计算骑行时长（从开始和结束时间戳）
    formatDuration(startTime, endTime) {
      if (!startTime || !endTime) return '0 min';

      const durationMs = endTime - startTime;
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}min`;
      } else {
        return `${minutes}min`;
      }
    },

    // 格式化速度显示 (km/h)
    formatSpeed(speed) {
      if (speed === undefined || speed === null) return '';
      return `${speed.toFixed(1)} km/h`;
    },

    // 计算平均速度 (km/h) - 后备方法
    calculateSpeed(distance, startTime, endTime) {
      if (!distance || !startTime || !endTime) return '0 km/h';

      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      if (durationHours === 0) return '0 km/h';

      const speed = (distance / 1000) / durationHours;
      return `${speed.toFixed(1)} km/h`;
    },

    // 处理记录点击事件
    handleRecordClick(record) {
      this.$emit('record-click', record);
    }
  },

  beforeUnmount() {
    // 清理事件监听器
    document.body.style.overflow = '';

    // 清理可能存在的拖拽状态
    this.dragStartY = undefined;
    this.dragStartTime = undefined;

    // 重置弹窗样式
    const sheet = document.querySelector('.cycling-list-bottom-sheet');
    if (sheet) {
      sheet.style.transition = '';
      sheet.style.transform = '';
      sheet.style.opacity = '';
    }
  }
};
</script>

<style scoped>
/* 底部弹窗遮罩层 */
.cycling-list-bottom-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.4s ease-out;
  touch-action: none;
  /* 防止页面滚动 */
}

/* iOS风格底部弹窗 */
.cycling-list-bottom-sheet {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15), 0 -1px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  position: relative;
  z-index: 10000;
  user-select: none;
}

.sheet-enter {
  transform: translateY(0);
  opacity: 1;
  animation: slideInFromBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 从下到上的iOS风格弹出动画 */
@keyframes slideInFromBottom {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }

  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 拖拽指示器容器 */
.drag-indicator-container {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: grab;
  position: relative;
  z-index: 2;
}

.drag-indicator-container:active {
  cursor: grabbing;
}

/* 拖拽指示器 */
.drag-indicator {
  width: 44px;
  height: 5px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2.5px;
  transition: all 0.2s ease;
}

.drag-indicator-container:hover .drag-indicator {
  background: rgba(0, 0, 0, 0.4);
  transform: scaleX(1.1);
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px 16px;
  position: relative;
  z-index: 2;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #000;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.record-count {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 400;
}

/* 骑行列表内容 */
.cycling-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin-top: -4px;
  overscroll-behavior: contain;
  position: relative;
  z-index: 2;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0 0 4px 0;
  font-weight: 500;
}

.empty-subtext {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.4);
  margin: 0;
}

/* 骑行列表 */
.cycling-list {
  padding: 4px;
}

/* 骑行项 */
.cycling-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-bottom: 4px;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  animation: fadeIn 0.5s ease-out;
  gap: 12px;
  min-height: 76px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cycling-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0);
  transition: background 0.2s ease;
  pointer-events: none;
  z-index: 1;
}

.cycling-item:hover::before {
  background: rgba(255, 255, 255, 0.15);
}

.cycling-item:active::before {
  background: rgba(255, 255, 255, 0.2);
}

/* 骑行封面 */
.cycling-cover-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: rgba(76, 175, 80, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cycling-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cycling-item:hover .cycling-cover {
  transform: scale(1.05);
}

.cycling-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4CAF50;
}

.placeholder-icon {
  font-size: 24px;
}

/* 骑行详情 */
.cycling-details {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cycling-main-info {
  flex: 1;
  min-width: 0;
}

.cycling-title {
  font-size: 16px;
  font-weight: 500;
  color: #000;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.cycling-subtitle {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 骑行数据 */
.cycling-data {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.data-label {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 2px;
}

.data-value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

/* 右侧信息区域 */
.cycling-right-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 32px;
}

/* 更多操作按钮 */
.cycling-more {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  color: rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.02);
}

.cycling-more:hover {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.7);
  transform: scale(1.05);
}

.cycling-more:active {
  transform: scale(0.95);
}

/* 底部安全区域 */
.safe-area-bottom {
  height: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.1);
}

/* 混入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.cycling-list-content::-webkit-scrollbar {
  width: 6px;
}

.cycling-list-content::-webkit-scrollbar-track {
  background: transparent;
}

.cycling-list-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.cycling-list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .cycling-list-bottom-sheet {
    max-height: 80vh;
    border-radius: 20px 20px 0 0;
  }

  .drag-indicator {
    width: 40px;
    height: 4px;
  }

  .dialog-header {
    padding: 6px 20px 12px;
  }

  .dialog-title {
    font-size: 19px;
  }

  .cycling-item {
    padding: 10px 12px;
    gap: 10px;
    min-height: 70px;
  }

  .cycling-cover-wrapper {
    width: 52px;
    height: 52px;
  }

  .cycling-title {
    font-size: 15px;
  }

  .cycling-subtitle {
    font-size: 12px;
  }

  .cycling-data {
    gap: 8px;
  }

  .data-label {
    font-size: 10px;
  }

  .data-value {
    font-size: 11px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
  .dialog-header {
    padding: 6px 16px 10px;
  }

  .cycling-item {
    padding: 8px 10px;
    gap: 8px;
    min-height: 64px;
  }

  .cycling-cover-wrapper {
    width: 48px;
    height: 48px;
  }

  .cycling-title {
    font-size: 14px;
  }

  .cycling-subtitle {
    font-size: 11px;
  }

  .cycling-data {
    gap: 6px;
  }

  .data-label {
    font-size: 9px;
  }

  .data-value {
    font-size: 10px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .cycling-list-bottom-sheet {
    transition: none;
  }

  .cycling-cover {
    transition: none;
  }
}
</style>