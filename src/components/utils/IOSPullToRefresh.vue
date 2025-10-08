<template>
  <div class="ios-pull-to-refresh-container">
    <!-- 刷新指示器 -->
    <div class="pull-to-refresh" :style="{
      height: indicatorHeight + 'px',
      transform: `translateY(${refreshOffset}px)`,
      transition: isAnimating ? 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease' : 'none',
      opacity: showRefreshIndicator ? (isDisabled ? 0.5 : 1) : 0,
      backgroundColor: backgroundColor || (isDarkMode.value ? 'rgba(23, 23, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)')
    }">
      <div class="refresh-content">
        <!-- 视觉元素容器 -->
        <div class="visual-container">
          <!-- 圆形进度背景 -->
          <div class="progress-ring" :style="{
            transform: `scale(${pullScale})`,
            transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }">
            <!-- 下拉箭头（非加载状态） -->
            <div v-if="!isRefreshing && !isLoading" class="arrow-icon"
              :style="{ transform: `rotate(${rotateDegree}deg)` }">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path :fill="iconColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </div>

            <!-- 加载动画（加载状态） -->
            <div v-else class="loading-spinner" :style="{ opacity: spinnerOpacity }">
              <svg class="circular-spinner" viewBox="25 25 50 50">
                <circle class="spinner-path" cx="50" cy="50" r="20" fill="none" :stroke="iconColor" stroke-width="3"
                  stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="0" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 状态文字 -->
        <span class="refresh-text" :class="{
          'success-text': !hasError && !isRefreshing && showRefreshIndicator,
          'error-text': hasError
        }" :style="{ color: textColor, fontFamily: fontFamily }" @click="handleRetry">
          {{ refreshText }}
        </span>
      </div>

      <!-- 装饰性波浪线 -->
      <div class="decorative-wave" v-if="showRefreshIndicator">
        <svg viewBox="0 0 200 10" width="200" height="10">
          <path :fill="'none'" :stroke="iconColor" stroke-opacity="0.3" stroke-width="1" :d="wavePath" />
        </svg>
      </div>
    </div>

    <!-- 内容区域包装器 -->
    <div ref="contentWrapper" class="content-wrapper" @touchstart.passive="handleTouchStart" @touchmove.passive="handleTouchMove"
      @touchend.passive="handleTouchEnd" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp" :style="{
        transform: `translateY(${contentOffset}px)`,
        transition: isAnimating ? 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        touchAction: 'pan-y'
      }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, onUnmounted, watch } from 'vue'

// 定义props
const props = defineProps({
  // 刷新触发回调函数
  onRefresh: {
    type: Function,
    required: true
  },
  // 控制下拉功能启用状态
  disabled: {
    type: Boolean,
    default: false
  },
  // 自定义指示器及文字颜色
  colors: {
    type: Object,
    default: () => ({
      primary: '#007aff',
      success: '#34c759',
      error: '#ff3b30',
      background: ''
    })
  },
  // 自定义状态文字
  texts: {
    type: Object,
    default: () => ({
      pull: '下拉刷新',
      release: '释放立即刷新',
      loading: '正在刷新...',
      success: '刷新完成',
      error: '刷新失败，点击重试'
    })
  },
  // 触发刷新的阈值
  triggerThreshold: {
    type: Number,
    default: 70
  },
  // 刷新指示器高度
  indicatorHeight: {
    type: Number,
    default: 70
  },
  // 背景色
  backgroundColor: {
    type: String,
    default: ''
  }
})

// 定义emits
const emit = defineEmits(['refresh'])

// 组件状态
const contentWrapper = ref(null)
const startY = ref(0)
const currentY = ref(0)
const contentOffset = ref(0)
const refreshOffset = ref(-props.indicatorHeight)
const isDragging = ref(false)
const isRefreshing = ref(false)
const isLoading = ref(false)
const isAnimating = ref(false)
const showRefreshIndicator = ref(false)
const rotateDegree = ref(0)
const refreshText = ref(props.texts.pull)
const spinnerOpacity = ref(0)
const hasError = ref(false)
const isDarkMode = ref(false)
const pullProgress = ref(0)
const pullScale = ref(1)
const wavePath = ref('')
const isDisabled = computed(() => props.disabled)

// 根据系统主题和自定义颜色计算最终颜色
const iconColor = computed(() => {
  if (props.colors.primary) return props.colors.primary
  return isDarkMode.value ? '#007aff' : '#007aff'
})

const successColor = computed(() => {
  if (props.colors.success) return props.colors.success
  return isDarkMode.value ? '#34c759' : '#34c759'
})

const errorColor = computed(() => {
  if (props.colors.error) return props.colors.error
  return isDarkMode.value ? '#ff3b30' : '#ff3b30'
})

const textColor = computed(() => {
  if (hasError.value) {
    return errorColor.value
  }
  if (!hasError.value && !isRefreshing.value && showRefreshIndicator.value && refreshText.value === props.texts.success) {
    return successColor.value
  }
  return iconColor.value
})

const fontFamily = computed(() => {
  return '-apple-system, BlinkMacSystemFont, "San Francisco", "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
})

// 监听系统主题变化
const setupThemeListener = () => {
  // 检查初始主题
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  isDarkMode.value = mediaQuery.matches

  // 监听主题变化
  const handleThemeChange = (e) => {
    isDarkMode.value = e.matches
  }

  mediaQuery.addEventListener('change', handleThemeChange)

  return () => {
    mediaQuery.removeEventListener('change', handleThemeChange)
  }
}

// 生成波浪路径
const generateWavePath = (amplitude, wavelength, progress) => {
  const path = []
  const points = 50
  const width = 200

  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width
    const y = 5 + Math.sin((i / wavelength) * Math.PI * 2 + progress * Math.PI * 4) * amplitude
    path.push(`${x},${y}`)
  }

  return `M${path.join(' L')}`
}

// 监听下拉进度变化
watch(pullProgress, (newProgress) => {
  // 更新波浪动画
  wavePath.value = generateWavePath(2, 10, newProgress * 0.5)

  // 更新缩放效果
  pullScale.value = 1 + (newProgress * 0.3)
})

// 组件挂载时设置主题监听
let cleanupThemeListener = null
onMounted(() => {
  cleanupThemeListener = setupThemeListener()
  // 初始波浪路径
  wavePath.value = generateWavePath(2, 10, 0)
})

onUnmounted(() => {
  if (cleanupThemeListener) {
    cleanupThemeListener()
  }
})

// 处理触摸开始事件
const handleTouchStart = (e) => {
  if (isRefreshing.value || isDisabled.value) return

  // 只有在页面顶部才能触发下拉刷新
  if (window.scrollY === 0) {
    isDragging.value = true
    startY.value = e.touches[0].clientY
    currentY.value = startY.value
    // 重置错误状态
    hasError.value = false
  }
}

// 处理触摸移动事件
const handleTouchMove = (e) => {
  if (!isDragging.value || isRefreshing.value || isDisabled.value) return

  currentY.value = e.touches[0].clientY
  const diff = currentY.value - startY.value

  // 只允许向下拉动
  if (diff > 0) {
    e.preventDefault() // 防止页面滚动

    // 控制下拉速度，添加弹性阻尼效果
    const pullDistance = Math.min(diff, props.triggerThreshold * 2.5) * 0.7
    const progress = pullDistance / props.triggerThreshold

    // 更新下拉进度
    pullProgress.value = Math.min(progress, 1)

    contentOffset.value = pullDistance
    refreshOffset.value = pullDistance - props.indicatorHeight

    // 显示刷新指示器
    showRefreshIndicator.value = true

    // 根据下拉距离更新文本和旋转角度
    if (pullDistance >= props.triggerThreshold) {
      refreshText.value = props.texts.release
      // 箭头从0°旋转到180°，添加弹性效果
      rotateDegree.value = 180 + (progress - 1) * 30
    } else {
      refreshText.value = props.texts.pull
      // 箭头旋转角度随下拉距离非线性变化，增强视觉反馈
      rotateDegree.value = (progress * 1.2) * 180
    }
  }
}

// 处理触摸结束事件
const handleTouchEnd = () => {
  if (!isDragging.value || isRefreshing.value || isDisabled.value) {
    isDragging.value = false
    return
  }

  isDragging.value = false
  isAnimating.value = true

  const pullDistance = contentOffset.value

  // 如果达到触发阈值，开始刷新
  if (pullDistance >= props.triggerThreshold && !hasError.value) {
    startRefresh()
  } else {
    // 否则恢复初始状态
    resetRefreshState()
  }
}

// 处理鼠标事件（用于桌面端调试）
const handleMouseDown = (e) => {
  if (isRefreshing.value || isDisabled.value) return

  if (window.scrollY === 0) {
    isDragging.value = true
    startY.value = e.clientY
    currentY.value = startY.value
    // 重置错误状态
    hasError.value = false
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value || isRefreshing.value || isDisabled.value) return

  currentY.value = e.clientY
  const diff = currentY.value - startY.value

  if (diff > 0) {
    e.preventDefault()

    const pullDistance = Math.min(diff, props.triggerThreshold * 2.5) * 0.7
    const progress = pullDistance / props.triggerThreshold

    // 更新下拉进度
    pullProgress.value = Math.min(progress, 1)

    contentOffset.value = pullDistance
    refreshOffset.value = pullDistance - props.indicatorHeight

    showRefreshIndicator.value = true

    if (pullDistance >= props.triggerThreshold) {
      refreshText.value = props.texts.release
      rotateDegree.value = 180 + (progress - 1) * 30
    } else {
      refreshText.value = props.texts.pull
      rotateDegree.value = (progress * 1.2) * 180
    }
  }
}

const handleMouseUp = () => {
  if (!isDragging.value || isRefreshing.value || isDisabled.value) {
    isDragging.value = false
    return
  }

  isDragging.value = false
  isAnimating.value = true

  const pullDistance = contentOffset.value

  if (pullDistance >= props.triggerThreshold && !hasError.value) {
    startRefresh()
  } else {
    resetRefreshState()
  }
}

// 处理重试点击
const handleRetry = () => {
  if (hasError.value) {
    hasError.value = false
    startRefresh()
  }
}

// 开始刷新
const startRefresh = async () => {
  isRefreshing.value = true
  isLoading.value = true
  hasError.value = false
  refreshText.value = props.texts.loading
  rotateDegree.value = 0

  // 设置内容和刷新指示器的位置
  contentOffset.value = props.indicatorHeight
  refreshOffset.value = 0

  // 菊花加载器淡入
  setTimeout(() => {
    spinnerOpacity.value = 1
  }, 50)

  try {
    // 触发刷新事件，确保onRefresh返回Promise
    if (typeof props.onRefresh === 'function') {
      await Promise.resolve(props.onRefresh())
    }

    // 刷新成功
    refreshText.value = props.texts.success
  } catch (error) {
    console.error('刷新数据失败:', error)
    // 刷新失败
    hasError.value = true
    refreshText.value = props.texts.error
  } finally {
    // 刷新完成后显示结果并恢复状态
    setTimeout(() => {
      // 菊花加载器淡出
      spinnerOpacity.value = 0
      setTimeout(() => {
        isLoading.value = false
        // 只有在成功或失败状态下才显示结果文本
        if (!hasError.value) {
          // 成功时短暂显示后收起，添加弹性弹跳效果
          setTimeout(() => {
            resetRefreshState(true)
          }, 500)
        } else {
          // 失败时保持显示，等待用户点击重试
          isRefreshing.value = false
          isAnimating.value = false
        }
      }, 200)
    }, hasError.value ? 1000 : 500)
  }
}

// 重置刷新状态
const resetRefreshState = (withBounce = false) => {
  isAnimating.value = true

  // 重置位置
  const duration = withBounce ? 600 : 300
  const startTime = Date.now()
  const startContentOffset = contentOffset.value
  const startRefreshOffset = refreshOffset.value

  // 使用requestAnimationFrame实现平滑动画
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    let easeProgress
    if (withBounce) {
      // 添加弹跳效果
      if (progress < 0.4) {
        easeProgress = 2 * progress * progress
      } else if (progress < 0.6) {
        easeProgress = 0.32 + 1.2 * (progress - 0.4)
      } else {
        easeProgress = 1 - Math.pow(2, -10 * (progress - 0.6)) * 0.4
      }
    } else {
      // 使用ease-out缓动函数
      easeProgress = 1 - Math.pow(1 - progress, 3)
    }

    contentOffset.value = startContentOffset * (1 - easeProgress)
    refreshOffset.value = startRefreshOffset * (1 - easeProgress) - props.indicatorHeight * easeProgress

    // 更新缩放和进度
    if (showRefreshIndicator.value) {
      pullScale.value = 1 + ((1 - easeProgress) * 0.3)
      pullProgress.value = 1 - easeProgress
    }

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // 动画完成，重置状态
      contentOffset.value = 0
      refreshOffset.value = -props.indicatorHeight
      refreshText.value = props.texts.pull
      rotateDegree.value = 0
      pullScale.value = 1
      pullProgress.value = 0

      // 等待动画完成后隐藏指示器并重置状态
      setTimeout(() => {
        showRefreshIndicator.value = false
        isRefreshing.value = false
        isLoading.value = false
        isAnimating.value = false
        spinnerOpacity.value = 0
        hasError.value = false
      }, 100)
    }
  }

  requestAnimationFrame(animate)
}
</script>

<style scoped>
.ios-pull-to-refresh-container {
  position: relative;
  overflow: hidden;
  min-height: 100%;
}

.content-wrapper {
  will-change: transform;
  min-height: 100%;
}

.pull-to-refresh {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.refresh-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  position: relative;
  z-index: 2;
}

.visual-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
}

.progress-ring {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
}

.arrow-icon {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center;
}

.loading-spinner {
  transition: opacity 0.3s ease;
  transform-origin: center;
}

.circular-spinner {
  animation: rotate 1.5s linear infinite;
  width: 20px;
  height: 20px;
}

.spinner-path {
  stroke-dasharray: 113;
  stroke-dashoffset: 0;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 113;
    stroke-width: 3;
  }

  50% {
    stroke-dashoffset: 28;
    stroke-width: 4;
  }

  100% {
    stroke-dashoffset: 113;
    stroke-width: 3;
  }
}

.refresh-text {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  transition: color 0.3s ease;
  user-select: none;
  cursor: pointer;
}

.success-text {
  font-weight: 600;
}

.error-text {
  font-weight: 600;
}

.decorative-wave {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  z-index: 1;
  animation: wave-move 2s ease-in-out infinite;
}

@keyframes wave-move {

  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  50% {
    transform: translateX(-50%) translateY(-1px);
  }
}
</style>