<template>
  <div class="ios-hitokoto-container">
    <div class="ios-hitokoto-card" @click="refreshHitokoto">
      <div class="ios-hitokoto-content">
        <div class="ios-hitokoto-quote">
          <mdui-icon name="format_quote" class="quote-icon"></mdui-icon>
        </div>
        <p class="ios-hitokoto-text" @click="copyHitokoto(hitokoto.text, $event)">
          {{ hitokoto.text || '加载中...' }}
          <span class="copy-indicator" v-if="showCopyTip">{{ copyTipText }}</span>
        </p>
        <!-- <p class="copy-hint">点击文字可复制</p> -->
        <p class="ios-hitokoto-source">
          — {{ hitokoto.from || '' }}
        </p>
      </div>
      <div class="ios-hitokoto-indicator"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 一言数据
const hitokoto = ref({
  text: '',
  from: ''
});

// 复制提示相关
const showCopyTip = ref(false);
const copyTipText = ref('');
let copyTipTimer = null;

// 复制一言内容
const copyHitokoto = async (text, event) => {
  // 阻止事件冒泡，防止触发父元素的刷新功能
  if (event) {
    event.stopPropagation();
  }
  try {
    if (!text || text === '加载中...' || text === '刷新中...') return;

    // 检查是否支持 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // 降级方案：使用传统的 execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    // 显示复制成功提示
    showCopyTip.value = true;
    copyTipText.value = '已复制！';

    // 清除之前的定时器
    if (copyTipTimer) {
      clearTimeout(copyTipTimer);
    }

    // 2秒后隐藏提示
    copyTipTimer = setTimeout(() => {
      showCopyTip.value = false;
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);

    // 显示复制失败提示
    showCopyTip.value = true;
    copyTipText.value = '复制失败';

    // 清除之前的定时器
    if (copyTipTimer) {
      clearTimeout(copyTipTimer);
    }

    // 2秒后隐藏提示
    copyTipTimer = setTimeout(() => {
      showCopyTip.value = false;
    }, 2000);
  }
};

// 获取一言数据
const fetchHitokoto = async () => {
  try {
    const response = await fetch('https://v1.hitokoto.cn/?encode=json');
    const data = await response.json();
    hitokoto.value = {
      text: data.hitokoto,
      from: data.from || data.from_who || '未知'
    };
  } catch (error) {
    console.error('获取一言数据失败:', error);
    hitokoto.value = {
      text: '人生若只如初见，何事秋风悲画扇。',
      from: '纳兰性德《木兰花·拟古决绝词柬友》'
    };
  }
};

// 刷新一言
const refreshHitokoto = () => {
  hitokoto.value.text = '刷新中...';
  fetchHitokoto();
};

// 组件挂载时获取一言数据
onMounted(() => {
  fetchHitokoto();
});
</script>

<style scoped>
/* iOS风格一言卡片样式 */
.ios-hitokoto-container {
  padding: 12px;
  display: flex;
  justify-content: center;
}

.ios-hitokoto-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 16px 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.ios-hitokoto-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.ios-hitokoto-card:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

.ios-hitokoto-content {
  position: relative;
  z-index: 1;
}

.ios-hitokoto-quote {
  position: absolute;
  top: -8px;
  left: -8px;
  opacity: 0.1;
  font-size: 48px;
  color: #007AFF;
  z-index: 0;
}

.quote-icon {
  font-size: 48px;
}

.ios-hitokoto-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
  padding: 8px 0;
  position: relative;
  z-index: 1;
  cursor: pointer;
}

/* 复制提示样式 */
.copy-indicator {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(0, 122, 255, 0.9);
  color: white;
  font-size: 11px;
  border-radius: 10px;
  animation: fadeIn 0.3s ease;
}

/* 点击复制提示样式 */
.copy-hint {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #8E8E93;
  text-align: center;
  opacity: 0.8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .copy-hint {
    font-size: 11px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 600px) {
  .copy-indicator {
    font-size: 10px;
    padding: 1px 6px;
  }
}

.ios-hitokoto-source {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #8E8E93;
  text-align: right;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.ios-hitokoto-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
  transition: background 0.3s ease;
}

.ios-hitokoto-card:hover .ios-hitokoto-indicator {
  background: rgba(0, 122, 255, 0.2);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .ios-hitokoto-container {
    padding: 8px 12px;
  }

  .ios-hitokoto-card {
    padding: 14px 18px;
    border-radius: 16px;
  }

  .ios-hitokoto-text {
    font-size: 15px;
  }

  .ios-hitokoto-source {
    font-size: 12px;
  }
}
</style>