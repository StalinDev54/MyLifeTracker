<template>
  <!-- 使用 Teleport 将弹窗挂载到 body 上，确保显示在最顶层 -->
  <Teleport to="body">
    <!-- iOS风格底部弹窗 -->
    <div v-if="visible" class="equipment-bottom-sheet-overlay" @click="handleOverlayClick">
      <div class="equipment-bottom-sheet" :class="{ 'sheet-enter': visible }">
        <!-- 顶部拖拽指示器 -->
        <div class="drag-indicator-container" @touchstart.passive="handleDragStart" @touchmove.passive="handleDragMove"
          @touchend.passive="handleDragEnd" @mousedown="handleDragStart" @mousemove="handleDragMove" @mouseup="handleDragEnd">
          <div class="drag-indicator"></div>
        </div>

        <!-- 对话框头部 -->
        <div class="dialog-header">
          <h2 class="dialog-title">骑行装备</h2>
          <div class="record-count">我的码表与车辆信息</div>
          <!-- <button class="close-button" @click="handleClose">
            <mdui-icon name="close" class="close-icon"></mdui-icon>
          </button> -->
        </div>

        <!-- 装备列表内容 -->
        <div class="equipment-list-content">
          <!-- 码表信息 -->
          <div class="equipment-section">
            <h3 class="section-title">
              <mdui-icon name="speed" class="section-icon"></mdui-icon>
              码表
            </h3>
            <div class="equipment-item">
              <div class="equipment-cover-wrapper">
                <img :src="xossG2Image" alt="XOSS G2 码表" class="equipment-cover" />
              </div>
              <div class="equipment-details">
                <h3 class="equipment-name">XOSS G2 行者小G 二代</h3>
                <p class="equipment-description">高精度GPS码表，支持多种传感器连接</p>
                <div class="equipment-specs">
                  <div class="spec-item">
                    <mdui-icon name="gps_fixed" class="spec-icon"></mdui-icon>
                    <span class="spec-label">定位精度</span>
                    <span class="spec-value">±3米</span>
                  </div>
                  <div class="spec-item">
                    <mdui-icon name="battery_charging_full" class="spec-icon"></mdui-icon>
                    <span class="spec-label">续航时间</span>
                    <span class="spec-value">24小时</span>
                  </div>
                  <div class="spec-item">
                    <mdui-icon name="water_drop" class="spec-icon"></mdui-icon>
                    <span class="spec-label">防水等级</span>
                    <span class="spec-value">IPX7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 车辆信息 -->
          <div class="equipment-section">
            <h3 class="section-title">
              <mdui-icon name="pedal_bike" class="section-icon"></mdui-icon>
              车辆
            </h3>
            <div class="equipment-item">
              <div class="equipment-cover-wrapper">
                <img :src="campAceImage" alt="Camp Ace 5000" class="equipment-cover" />
              </div>
              <div class="equipment-details">
                <h3 class="equipment-name">Camp Ace 5000</h3>
                <p class="equipment-description">高性能公路自行车，主要喜欢车架</p>
                <div class="equipment-specs">
                  <div class="spec-item">
                    <mdui-icon name="construction" class="spec-icon"></mdui-icon>
                    <span class="spec-label">车架材质</span>
                    <span class="spec-value">碳纤维</span>
                  </div>
                  <div class="spec-item">
                    <mdui-icon name="settings" class="spec-icon"></mdui-icon>
                    <span class="spec-label">变速系统</span>
                    <span class="spec-value">20速</span>
                  </div>
                  <div class="spec-item">
                    <mdui-icon name="change_circle" class="spec-icon"></mdui-icon>
                    <span class="spec-label">轮组</span>
                    <span class="spec-value">诺飞客 C50</span>
                  </div>
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
  name: 'CyclingEquipmentDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      // 码表图片链接
      xossG2Image: 'https://xingzhe-h5.oss-cn-hangzhou.aliyuncs.com/xingzhe-h5/xingzhe/static/img/nav.3b3cf7e.jpg',
      // 车辆图片链接
      campAceImage: 'https://wework.qpic.cn/wwpic3az/180294_9536l2fGRJyVskg_1759150545/0',
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
      const sheet = document.querySelector('.equipment-bottom-sheet');
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
        const sheet = document.querySelector('.equipment-bottom-sheet');
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

      const sheet = document.querySelector('.equipment-bottom-sheet');
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

    handleClose() {
      this.$emit('close');
    }
  },

  beforeUnmount() {
    // 清理事件监听器
    document.body.style.overflow = '';

    // 清理可能存在的拖拽状态
    this.dragStartY = undefined;
    this.dragStartTime = undefined;

    // 重置弹窗样式
    const sheet = document.querySelector('.equipment-bottom-sheet');
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
.equipment-bottom-sheet-overlay {
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
.equipment-bottom-sheet {
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

.close-button {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: translateY(-50%) scale(1.1);
}

.close-icon {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.7);
}

/* 装备列表内容 */
.equipment-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  margin-top: -4px;
  overscroll-behavior: contain;
  position: relative;
  z-index: 2;
}

/* 装备分类标题 */
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px 0;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: #4CAF50;
  font-size: 20px;
}

/* 装备项 */
.equipment-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.equipment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 装备封面 */
.equipment-cover-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: rgba(76, 175, 80, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.equipment-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.equipment-item:hover .equipment-cover {
  transform: scale(1.05);
}

/* 装备详情 */
.equipment-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-name {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.equipment-description {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

/* 装备规格 */
.equipment-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-item {
  display: flex;
  flex-direction: column;
  min-width: 70px;
  gap: 4px;
}

.spec-icon {
  color: #4CAF50;
  font-size: 16px;
  align-self: center;
}

.spec-label {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 2px;
  text-align: center;
}

.spec-value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  background: rgba(76, 175, 80, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
  display: inline-block;
  text-align: center;
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
.equipment-list-content::-webkit-scrollbar {
  width: 6px;
}

.equipment-list-content::-webkit-scrollbar-track {
  background: transparent;
}

.equipment-list-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.equipment-list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .equipment-bottom-sheet {
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

  .close-button {
    width: 28px;
    height: 28px;
  }

  .close-icon {
    font-size: 18px;
  }

  .section-icon {
    font-size: 18px;
  }

  .spec-icon {
    font-size: 14px;
  }

  .equipment-item {
    gap: 12px;
    padding: 12px;
  }

  .equipment-cover-wrapper {
    width: 80px;
    height: 80px;
  }

  .equipment-name {
    font-size: 15px;
  }

  .equipment-description {
    font-size: 12px;
  }

  .spec-item {
    min-width: 60px;
  }

  .spec-label {
    font-size: 10px;
  }

  .spec-value {
    font-size: 11px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
  .dialog-header {
    padding: 6px 16px 10px;
  }

  .close-button {
    width: 26px;
    height: 26px;
  }

  .close-icon {
    font-size: 16px;
  }

  .section-icon {
    font-size: 16px;
  }

  .spec-icon {
    font-size: 12px;
  }

  .equipment-item {
    gap: 10px;
    padding: 10px;
  }

  .equipment-cover-wrapper {
    width: 70px;
    height: 70px;
  }

  .equipment-name {
    font-size: 14px;
  }

  .equipment-description {
    font-size: 11px;
  }

  .spec-item {
    min-width: 55px;
  }

  .spec-label {
    font-size: 9px;
  }

  .spec-value {
    font-size: 10px;
    padding: 1px 4px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .equipment-bottom-sheet {
    transition: none;
  }

  .equipment-cover {
    transition: none;
  }
}
</style>