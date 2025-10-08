<template>
  <!-- iOS风格沉浸式Bottom Sheet弹窗 -->
  <div v-if="visible" class="song-detail-overlay" :class="{ 'fade-out': isClosing }" @click="handleOverlayClick">
    <!-- 动态背景 - 基于当前歌曲封面的高斯模糊效果 -->
    <div class="dynamic-background" :style="getDynamicBackgroundStyle()" v-if="song && song.detail?.cover"></div>

    <div class="song-detail-sheet" :class="{ 'sheet-enter': visible, 'sheet-exit': !visible }" @click.stop>
      <!-- iOS风格拖拽指示器 -->
      <div class="drag-indicator"></div>



      <!-- 内容滚动容器 -->
      <div class="sheet-content" style="position: relative; z-index: 2;">
        <!-- 歌曲封面 -->
        <div class="cover-container">
          <div class="cover-wrapper" :class="{ 'cover-rotate': isPlaying }">
            <img :src="song.detail?.cover" :alt="song.detail?.name || '封面'" class="song-cover" />
            <div class="cover-disc"></div>
          </div>
        </div>

        <!-- 歌曲信息 -->
        <div class="song-info">
          <h2 class="song-title">{{ song.detail?.name || '未知歌曲' }}</h2>
          <p class="song-artist">{{ song.detail?.artistNames?.join(' / ') || '未知歌手' }}</p>
          <p class="song-album">专辑：{{ song.detail?.albumName || '未知专辑' }}</p>

          <!-- 歌曲元数据 -->
          <div class="song-meta">
            <div class="meta-item">
              <span class="meta-label">时长</span>
              <span class="meta-value">{{ formatDuration(song.duration) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">平台</span>
              <span class="meta-value">网易云音乐</span>
            </div>
          </div>
        </div>

        <!-- 收听记录信息 - 简化显示 -->
        <div class="play-history-compact" v-if="song.timestamp">
          <span class="history-label">收听于</span>
          <span class="history-time-compact">{{ formatFullTimestamp(song.timestamp) }}</span>
        </div>
      </div>

      <!-- iOS风格操作面板 - 紧凑样式 - 固定在底部 -->
      <div class="ios-action-panel-compact fixed-bottom">
        <button class="action-btn-compact play-btn" @click="playSong">
          <svg class="btn-icon-compact" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
        <button class="action-btn-compact share-btn" @click="shareSong">
          <svg class="btn-icon-compact" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>

      <!-- iOS风格安全区域底部间距 -->
      <div class="safe-area-bottom"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SongDetailDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    song: {
      type: Object,
      default: () => ({})
    },
    isPlaying: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      isClosing: false
    };
  },
  watch: {
    visible(newVal) {
      // 重置关闭状态
      if (newVal) {
        this.isClosing = false;
      }
    }
  },
  methods: {
    // 处理遮罩层点击
    handleOverlayClick(event) {
      // 点击背景区域关闭弹窗
      if (event.target === event.currentTarget) {
        this.handleClose();
      }
    },

    // 获取动态背景样式 - 基于歌曲封面的高斯模糊效果
    getDynamicBackgroundStyle() {
      if (!this.song || !this.song.detail?.cover) return {};

      return {
        backgroundImage: `url(${this.song.detail.cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(80px) saturate(1.5)',
        WebkitFilter: 'blur(80px) saturate(1.5)',
        opacity: 0.5
      };
    },

    // 关闭弹窗 - 添加淡出动画
    handleClose() {
      if (this.isClosing) return;

      this.isClosing = true;

      // 添加淡出类
      const overlay = document.querySelector('.song-detail-overlay');
      if (overlay) {
        overlay.classList.add('fade-out');
      }

      // 等待淡出动画完成后再发出close事件
      setTimeout(() => {
        this.$emit('close');
        // 移除淡出类，以便下次打开时正常显示
        if (overlay) {
          overlay.classList.remove('fade-out');
        }
      }, 300);
    },

    // 格式化时长
    formatDuration(duration) {
      if (!duration) return '0:00';
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    // 格式化完整时间戳
    formatFullTimestamp(timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 格式化时间戳摘要
    formatTimestampSummary(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        const diffInSeconds = Math.floor((now - date) / 1000) % 60;
        return `刚刚播放 (${diffInMinutes}分${diffInSeconds}秒前)`;
      } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        const minutes = Math.floor((diffInHours - hours) * 60);
        return `今天播放 (${hours}小时${minutes}分钟前)`;
      } else if (diffInHours < 48) {
        const hours = Math.floor(diffInHours);
        const minutes = Math.floor((diffInHours - hours) * 60);
        return `昨天播放 (${hours}小时${minutes}分钟前)`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}天前播放`;
      }
    },

    // 格式化紧凑时间戳 - 精确到秒
    formatCompactTimestamp(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInSeconds < 60) {
        // 小于1分钟，显示秒
        return `${diffInSeconds}秒前`;
      } else if (diffInMinutes < 60) {
        // 小于1小时，显示分秒
        const seconds = diffInSeconds % 60;
        return `${diffInMinutes}分${seconds}秒前`;
      } else if (diffInHours < 24) {
        // 小于1天，显示时分
        const minutes = diffInMinutes % 60;
        return `${diffInHours}小时${minutes}分钟前`;
      } else if (diffInHours < 48) {
        // 昨天，显示昨天+时间
        const hours = diffInHours % 24;
        const minutes = diffInMinutes % 60;
        return `昨天 ${hours}小时${minutes}分钟前`;
      } else {
        // 其他情况显示日期时间
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
    },

    // 播放歌曲并跳转 - 优先使用ID跳转到网易云官方单曲页面
    playSong() {
      // 尝试获取歌曲ID（可能存在于不同位置）
      const songId = this.song.id || this.song.songId || this.song.detail?.id || this.song.detail?.songId;

      if (songId) {
        // 如果有歌曲ID，直接跳转到网易云音乐官方单曲详情页
        const url = `https://music.163.com/#/song?id=${songId}`;
        window.open(url, '_blank');
      } else {
        // 如果没有ID，回退到通过歌名搜索
        const songName = encodeURIComponent(this.song.detail?.name || '');
        const url = `https://jiclub.site/music/#/search?source=1&keyword=${songName}`;
        window.open(url, '_blank');
      }
    },

    // 分享歌曲
    shareSong() {
      const songName = encodeURIComponent(this.song.detail?.name || '未知歌曲');
      const artistNames = encodeURIComponent((this.song.detail?.artistNames || ['未知歌手']).join(' / '));
      const url = `https://jiclub.site/music/#/search?source=1&keyword=${songName}%20${artistNames}`;
      window.open(url, '_blank');
    }
  }
};
</script>

<style scoped>
/* iOS风格沉浸式Bottom Sheet弹窗遗罩层 */
.song-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 10001;
  opacity: 0;
  animation: overlayFadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  cursor: pointer;
  overflow: hidden;
}

/* 动态背景 - 基于歌曲封面的高斯模糊效果 */
.dynamic-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  transform: scale(1.1);
  /* 稍微放大以避免边缘空白 */
  transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
  will-change: opacity, transform;
  pointer-events: none;
  /* 不响应点击事件，让点击事件传递到遮罩层 */
}

/* 背景淡入动画 */
.song-detail-overlay .dynamic-background {
  opacity: 0;
  transform: scale(1.2);
  animation: backgroundFadeIn 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.song-detail-overlay.fade-out .dynamic-background {
  opacity: 1;
  transform: scale(1.1);
  animation: backgroundFadeOut 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 遮罩层淡出动画 */
.song-detail-overlay.fade-out {
  animation: overlayFadeOut 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* iOS风格Bottom Sheet弹窗 */
.song-detail-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  will-change: transform, opacity;
  z-index: 1;
}

/* 弹窗进入动画 */
.sheet-enter {
  transform: translateY(0);
  opacity: 1;
}

/* 弹窗退出动画 */
.sheet-exit {
  transform: translateY(100%);
  opacity: 0;
}

/* iOS风格拖拽指示器 */
.drag-indicator {
  width: 36px;
  height: 5px;
  background: rgba(60, 60, 67, 0.3);
  border-radius: 3px;
  margin: 12px auto 8px;
  flex-shrink: 0;
}

/* 内容滚动容器 */
.sheet-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 隐藏滚动条 */
.sheet-content::-webkit-scrollbar {
  display: none;
}

.sheet-content {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 封面容器 */
.cover-container {
  margin-bottom: 32px;
  position: relative;
  width: 220px;
  height: 220px;
  margin-top: 8px;
}

/* 封面包装器 */
.cover-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
  position: relative;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
}


/* 封面图片 */
.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 唱片机效果圆盘 */
.cover-disc {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.cover-disc::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
}

/* 歌曲信息 */
.song-info {
  text-align: center;
  margin-bottom: 28px;
  width: 100%;
  max-width: 320px;
}

.song-title {
  font-size: 22px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  margin: 0 0 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
  letter-spacing: -0.5px;
}

.song-artist {
  font-size: 17px;
  color: rgba(0, 0, 0, 0.65);
  margin: 0 0 8px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
  font-weight: 500;
}

.song-album {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0 0 20px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
  font-weight: 400;
}

/* 歌曲元数据 */
.song-meta {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding-top: 16px;
  border-top: 1px solid rgba(60, 60, 67, 0.1);
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.meta-label {
  font-size: 13px;
  color: rgba(60, 60, 67, 0.5);
  margin-bottom: 6px;
  font-weight: 500;
}

.meta-value {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.8);
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
}

/* 收听记录信息 - 紧凑样式 */
.play-history-compact {
  width: 100%;
  max-width: 320px;
  margin-bottom: 16px;
  padding: 8px 12px;
  /* background: rgba(248, 248, 248, 0.7); */
  border-radius: 12px;
  border: 1px solid rgba(60, 60, 67, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-label {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.6);
  font-weight: 500;
}

.history-time-compact {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.8);
  font-weight: 500;
}

/* iOS风格操作面板 - 紧凑样式 */
.ios-action-panel-compact {
  width: 100%;
  max-width: 320px;
  margin-top: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 固定在底部的操作面板样式 */
.ios-action-panel-compact.fixed-bottom {
  position: relative;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 16px 24px;
  padding-bottom: calc(env(safe-area-inset-bottom, 12px) + 16px);
  /* background: rgba(255, 255, 255, 0.85); */
  /* backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); */
  border-top: 1px solid rgba(60, 60, 67, 0.1);
  z-index: 10;
}

/* 横屏时调整 */
@media (orientation: landscape) and (max-height: 500px) {
  .ios-action-panel-compact.fixed-bottom {
    padding: 12px 24px;
    padding-bottom: 12px;
    gap: 16px;
  }
}

.action-btn-compact {
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(248, 248, 248, 0.9);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  touch-action: manipulation;
  border: 1px solid rgba(60, 60, 67, 0.08);
}

.action-btn-compact:active {
  transform: scale(0.95);
  background: rgba(240, 240, 245, 0.95);
}

.play-btn {
  background: rgba(59, 130, 246, 0.1);
}

.play-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

.btn-icon-compact {
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.2s ease;
}

/* 移除原有的播放历史和操作面板样式 */
.play-history,
.ios-action-panel {
  display: none;
}

/* 旧版操作按钮样式 */
.action-buttons-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border: none;
  background: rgba(248, 248, 248, 0.9);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  touch-action: manipulation;
  border: 1px solid rgba(60, 60, 67, 0.08);
  min-height: 80px;
}

.action-btn:active {
  transform: scale(0.96);
  background: rgba(240, 240, 245, 0.95);
}

.btn-icon-wrapper {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.favorite-btn.active .btn-icon-wrapper {
  background: rgba(255, 59, 48, 0.1);
  box-shadow: 0 2px 15px rgba(255, 59, 48, 0.2);
}

.btn-icon {
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.2s ease;
}

.favorite-btn.active .btn-icon {
  fill: #ff3b30;
  stroke: none;
  transform: scale(1.1);
  animation: heartBeat 0.3s ease;
}

.btn-text {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.8);
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: -0.2px;
}

.favorite-btn.active .btn-text {
  color: #ff3b30;
  font-weight: 700;
}

/* 安全区域底部间距 */
.safe-area-bottom {
  height: env(safe-area-inset-bottom, 20px);
  min-height: 20px;
  flex-shrink: 0;
  background: transparent;
}

/* 动画效果 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 背景淡入动画 */
@keyframes backgroundFadeIn {
  from {
    opacity: 0;
    transform: scale(1.2);
  }

  to {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* 背景淡出动画 */
@keyframes backgroundFadeOut {
  from {
    opacity: 1;
    transform: scale(1.1);
  }

  to {
    opacity: 0;
    transform: scale(1.2);
  }
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }

  to {
    opacity: 1;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}

@keyframes overlayFadeOut {
  from {
    opacity: 1;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  to {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
}

/* 弹窗内容元素级联动画 */
.cover-container,
.song-info,
.play-history-compact,
.ios-action-panel-compact {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  will-change: transform, opacity;
}

.sheet-enter .cover-container {
  transition-delay: 0.1s;
  opacity: 1;
  transform: translateY(0);
}

.sheet-enter .song-info {
  transition-delay: 0.2s;
  opacity: 1;
  transform: translateY(0);
}

.sheet-enter .play-history-compact {
  transition-delay: 0.3s;
  opacity: 1;
  transform: translateY(0);
}

.sheet-enter .ios-action-panel-compact {
  transition-delay: 0.4s;
  opacity: 1;
  transform: translateY(0);
}

/* 响应式适配 - 移动设备 */
@media (max-width: 480px) {
  .song-detail-sheet {
    border-radius: 16px 16px 0 0;
  }

  .cover-container {
    width: 200px;
    height: 200px;
  }

  .song-title {
    font-size: 20px;
  }

  .song-artist {
    font-size: 16px;
  }

  .song-album {
    font-size: 14px;
  }

  .song-meta {
    gap: 24px;
  }

  .play-history {
    padding: 16px;
  }

  .action-buttons-row {
    gap: 10px;
  }

  .action-btn {
    padding: 16px 12px;
    min-height: 72px;
  }

  .btn-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .btn-text {
    font-size: 13px;
  }
}

/* 小屏幕手机额外适配 */
@media (max-width: 360px) {
  .sheet-content {
    padding: 8px 20px 0;
  }

  .cover-container {
    width: 180px;
    height: 180px;
  }

  .close-button {
    width: 30px;
    height: 30px;
  }

  .song-info {
    max-width: 280px;
  }

  .play-history {
    max-width: 280px;
  }

  .ios-action-panel {
    max-width: 280px;
  }
}

/* 高屏手机适配 */
@media (min-height: 800px) {
  .song-detail-sheet {
    max-height: 75vh;
    margin: 20px auto;
    width: 90%;
    max-width: 500px;
    left: auto;
    right: auto;
    bottom: auto;
    top: 50%;
    transform: translate(0, 50%);
    border-radius: 24px;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.25);
  }

  .sheet-enter {
    transform: translate(0, -50%);
  }

  .sheet-exit {
    transform: translate(0, 50%);
  }

  .cover-container {
    width: 240px;
    height: 240px;
    margin-bottom: 36px;
  }

  .song-info {
    margin-bottom: 32px;
  }

  .song-title {
    font-size: 24px;
    letter-spacing: -0.6px;
  }

  .song-artist {
    font-size: 18px;
  }

  .song-album {
    font-size: 16px;
  }

  .song-meta {
    gap: 40px;
  }

  .meta-label {
    font-size: 14px;
  }

  .meta-value {
    font-size: 16px;
  }

  .play-history-compact {
    margin-bottom: 20px;
    padding: 10px 16px;
  }

  .history-label {
    font-size: 13px;
  }

  .history-time-compact {
    font-size: 14px;
  }

  .ios-action-panel-compact {
    margin-top: 8px;
    margin-bottom: 12px;
    gap: 24px;
  }

  .ios-action-panel-compact.fixed-bottom {
    margin-bottom: 12px;
    padding: 16px 24px;
    gap: 24px;
  }

  .ios-action-panel-compact.fixed-bottom {
    margin-bottom: 12px;
    padding: 16px 24px;
    gap: 24px;
  }

  .ios-action-panel-compact.fixed-bottom {
    margin-bottom: 12px;
    padding: 16px 24px;
    gap: 24px;
  }

  .action-btn-compact {
    width: 48px;
    height: 48px;
  }

  .btn-icon-compact {
    width: 22px;
    height: 22px;
  }
}

/* 电脑端适配优化 */
@media (min-width: 768px) {
  .song-detail-sheet {
    max-height: 85vh;
    margin: 20px auto;
    width: 90%;
    max-width: 500px;
    left: auto;
    right: auto;
    bottom: auto;
    top: 50%;
    transform: translate(0, 50%);
    border-radius: 24px;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.25);
  }

  .sheet-enter {
    transform: translate(0, -50%);
  }

  .sheet-exit {
    transform: translate(0, 50%);
  }

  .cover-container {
    width: 240px;
    height: 240px;
    margin-bottom: 36px;
  }

  .song-info {
    margin-bottom: 32px;
  }

  .song-title {
    font-size: 24px;
    letter-spacing: -0.6px;
  }

  .song-artist {
    font-size: 18px;
  }

  .song-album {
    font-size: 16px;
  }

  .song-meta {
    gap: 40px;
  }

  .meta-label {
    font-size: 14px;
  }

  .meta-value {
    font-size: 16px;
  }

  .play-history-compact {
    margin-bottom: 20px;
    padding: 10px 16px;
  }

  .history-label {
    font-size: 13px;
  }

  .history-time-compact {
    font-size: 14px;
  }

  .ios-action-panel-compact {
    margin-top: 8px;
    margin-bottom: 12px;
    gap: 24px;
  }

  .action-btn-compact {
    width: 48px;
    height: 48px;
  }

  .btn-icon-compact {
    width: 22px;
    height: 22px;
  }
}

/* 大屏幕电脑适配 */
@media (min-width: 1024px) {
  .song-detail-sheet {
    max-width: 550px;
    border-radius: 28px;
  }

  .cover-container {
    width: 260px;
    height: 260px;
  }

  .close-button {
    width: 36px;
    height: 36px;
  }

  .close-button svg {
    width: 22px;
    height: 22px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .song-detail-sheet {
    max-height: 95vh;
  }

  .cover-container {
    width: 160px;
    height: 160px;
    margin-bottom: 20px;
  }

  .song-info {
    margin-bottom: 20px;
  }

  .play-history {
    margin-bottom: 16px;
    padding: 16px;
  }

  .action-btn {
    padding: 12px 10px;
    min-height: 64px;
  }

  .safe-area-bottom {
    height: 12px;
    min-height: 12px;
  }
}
</style>