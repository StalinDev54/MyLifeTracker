<template>
  <!-- iOS风格底部弹窗 - 用于展示收款码 -->
  <div v-if="visible" class="payment-qrcode-overlay" @click="handleOverlayClick">
    <div class="payment-qrcode-container" :class="{ 'dialog-enter': visible, 'dragging': isDragging }"
      :style="{ transform: `translateY(${dragOffset}px)` }" ref="dialogContainer" @click.stop>
      <!-- iOS风格头部 - 包含小白条 -->
      <div class="payment-qrcode-header" @touchstart.passive="startDrag" @touchmove.passive="onDrag" @touchend.passive="endDrag"
        @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseleave="endDrag">
        <div class="ios-drag-handle"></div>
        <h3 class="payment-qrcode-title">ᓚᘏᗢ喵喵祝你天天开心~</h3>
      </div>

      <!-- 内容区域 -->
      <div class="payment-qrcode-content">
        <!-- 切换按钮 -->
        <div class="payment-tabs">
          <button class="payment-tab" :class="{ active: currentPayment === 'wechat' }"
            @click="currentPayment = 'wechat'">
            <div class="tab-icon wechat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#07C160">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            微信支付
          </button>
          <button class="payment-tab" :class="{ active: currentPayment === 'alipay' }"
            @click="currentPayment = 'alipay'">
            <div class="tab-icon alipay-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1677FF">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            支付宝
          </button>
        </div>

        <!-- 收款码展示区域 -->
        <div class="qrcode-display-area">
          <!-- 微信收款码 -->
          <div v-if="currentPayment === 'wechat'" class="qrcode-container wechat-qrcode">
            <!-- 使用占位图，实际项目中应替换为真实收款码 -->
            <div v-if="wechatQRCodeUrl">
              <!-- 直接使用硬编码的URL确保图片显示 -->
              <img src="https://wework.qpic.cn/wwpic3az/476342_hm8mnuW1Q9erQLI_1742174282/0" alt="微信收款码"
                class="qrcode-image" />
              <!-- 调试信息 -->

            </div>
            <div v-else class="qrcode-placeholder">
              <div class="placeholder-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="#07C160">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <p>微信收款码</p>
              <p class="placeholder-note">请替换为真实收款码图片</p>
            </div>
            <p class="payment-amount">{{ currentPayment === 'wechat' ? '给我加一个小鸡腿' : '给我加个泡芙' }}</p>
          </div>

          <!-- 支付宝收款码 -->
          <div v-else class="qrcode-container alipay-qrcode">
            <!-- 使用占位图，实际项目中应替换为真实收款码 -->
            <div v-if="alipayQRCodeUrl">
              <!-- 直接使用硬编码的URL确保图片显示 -->
              <img src="https://wework.qpic.cn/wwpic3az/721582_2W7EimbEQUSaBll_1734075111/0" alt="支付宝收款码"
                class="qrcode-image" />

            </div>
            <div v-else class="qrcode-placeholder">
              <div class="placeholder-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="#1677FF">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <p>支付宝收款码</p>
              <p class="placeholder-note">请替换为真实收款码图片</p>
            </div>
            <p class="payment-amount">{{ currentPayment === 'wechat' ? '给我加一个小鸡腿' : '给我加个泡芙' }}</p>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="payment-tip">
          <p>投喂方式：备注+留言想说的话(❁´◡`❁) </p>
          <p>使用{{ currentPayment === 'wechat' ? '微信' : '支付宝' }}扫描上方二维码就可以投喂支持我啦~</p>
        </div>
      </div>

      <!-- 底部关闭按钮 -->
      <div class="payment-qrcode-footer">
        <button class="close-button" @click="star">
          给个Star
          <s-icon name="favorite" style="color: white;width:20px ;"></s-icon>
        </button>
      </div>

      <!-- iOS风格安全区域底部间距 -->
      <div class="safe-area-bottom"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';

// 定义props，使用camelCase格式
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  wechatQRCodeUrl: {
    type: String,
    default: ''
  },
  alipayQRCodeUrl: {
    type: String,
    default: ''
  },
  amount: {
    type: String,
    default: '8.88'
  }
});

// 定义emits
const emit = defineEmits(['close']);

// 响应式数据
const currentPayment = ref('wechat'); // 默认显示微信收款码
const dragOffset = ref(0);
const startY = ref(0);
const isDragging = ref(false);
const dialogContainer = ref(null);
const dialogHeight = ref(0);

// 调试 - 查看接收到的props值
onMounted(() => {
  console.log('PaymentQRCodeDialog mounted with props:', props);
});

// 监听props变化
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    console.log('Dialog became visible with QR codes:', {
      wechatQRCodeUrl: props.wechatQRCodeUrl,
      alipayQRCodeUrl: props.alipayQRCodeUrl
    });

    // 等待DOM更新后获取弹窗高度
    await nextTick();
    if (dialogContainer.value) {
      dialogHeight.value = dialogContainer.value.offsetHeight;
    }
  }
});

// 开始拖拽
const startDrag = (event) => {
  // 只在头部区域拖拽才触发
  if (event.target.closest('.payment-qrcode-header')) {
    isDragging.value = true;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    startY.value = clientY - dragOffset.value;

    // 防止拖拽时选中文本
    event.preventDefault();
  }
};

// 拖拽中
const onDrag = (event) => {
  if (!isDragging.value) return;

  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  const newOffset = clientY - startY.value;

  // 只允许向下拖拽
  dragOffset.value = Math.max(0, newOffset);

  // 防止拖拽时选中文本
  event.preventDefault();
};

// 结束拖拽
const endDrag = (event) => {
  if (!isDragging.value) return;

  isDragging.value = false;

  // 如果拖拽距离超过弹窗高度的一半，则关闭弹窗
  if (dragOffset.value > dialogHeight.value / 2) {
    handleClose();
  } else {
    // 否则回到原位
    dragOffset.value = 0;
  }
};

// 处理遮罩层点击
const handleOverlayClick = (event) => {
  // 点击背景区域关闭弹窗
  if (event.target === event.currentTarget) {
    handleClose();
  }
};

// 关闭弹窗
const handleClose = () => {
  dragOffset.value = 0;
  emit('close');
};

const star = () => {
  window.open('https://github.com/StalinDev54/MyLifeTracker', '_blank')
}
</script>

<style scoped>
/* 弹窗遮罩层 */
.payment-qrcode-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

/* 弹窗容器 */
.payment-qrcode-container {
  background-color: white;
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 弹窗进入动画 */
.payment-qrcode-container.dialog-enter {
  transform: translateY(0);
}

.payment-qrcode-container.dragging {
  transition: none;
}

/* iOS风格头部 - 包含小白条 */
.payment-qrcode-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: grab;
}

.payment-qrcode-header:active {
  cursor: grabbing;
}

/* iOS风格小白条 */
.ios-drag-handle {
  width: 36px;
  height: 5px;
  background-color: rgba(60, 60, 67, 0.3);
  border-radius: 3px;
  margin-bottom: 8px;
}

/* 弹窗标题 */
.payment-qrcode-title {
  font-size: 17px;
  font-weight: 600;
  color: #000;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 内容区域 */
.payment-qrcode-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 切换按钮 */
.payment-tabs {
  display: flex;
  border-radius: 10px;
  background-color: #f2f2f7;
  margin-bottom: 20px;
  overflow: hidden;
}

.payment-tab {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background-color: transparent;
  color: #8e8e93;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.payment-tab.active {
  background-color: white;
  color: #000;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 收款码展示区域 */
.qrcode-display-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 10px;
  background-color: white;
  padding: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 占位图样式 */
.qrcode-placeholder {
  width: 200px;
  height: 200px;
  background-color: #f8f8f8;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ddd;
}

.placeholder-icon {
  margin-bottom: 12px;
}

.placeholder-note {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 4px;
}

/* 金额显示 */
.payment-amount {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 12px 0 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 提示信息 */
.payment-tip {
  text-align: center;
  padding: 12px;
  background-color: #f8f8f8;
  border-radius: 10px;
  margin-bottom: 16px;
}

.payment-tip p {
  margin: 0;
  font-size: 14px;
  color: #8e8e93;
  line-height: 1.5;
}

/* 底部关闭按钮 */
.payment-qrcode-footer {
  padding: 0 20px 16px;
}

.close-button {
  width: 100%;
  padding: 12px;
  border: none;
  background-color: #007aff;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.close-button:hover {
  background-color: #0056cc;
}

.close-button:active {
  transform: scale(0.98);
}

/* iOS风格安全区域底部间距 */
.safe-area-bottom {
  height: env(safe-area-inset-bottom, 16px);
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 400px) {
  .payment-qrcode-container {
    width: 100%;
  }

  .qrcode-image,
  .qrcode-placeholder {
    width: 180px;
    height: 180px;
  }
}
</style>