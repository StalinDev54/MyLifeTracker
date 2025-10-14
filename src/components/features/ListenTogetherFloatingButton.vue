<template>
  <div class="listen-together-floating-container">
    <!-- 悬浮按钮 -->
    <transition name="float-button">
      <div v-if="isVisible" class="listen-together-floating-button" @click="showDialog">
        <img src="../../assets/APPicons/icons8-airpods-3-50.png" alt="一起听" class="floating-button-icon" />
        <!-- 播放指示器 - 内嵌在悬浮球中 -->

      </div>
    </transition>
    <div v-if="isPlaying && isVisible" class="floating-play-indicator"></div>
    <!-- 一起听对话框 -->
    <ListenTogetherDialog :visible="isDialogVisible" :current-song="currentSong" :current-position="currentPosition"
      :is-playing="isPlaying" @close="handleClose" @toggle-play="togglePlay" @exit="handleExitAndDispatch"
      @update:currentPosition="handleUpdateCurrentPosition" />
  </div>
</template>

<script>
import ListenTogetherDialog from '../dialogs/ListenTogetherDialog.vue';
import { Snackbar } from 'sober';
import { fetchMusicUrl, createAudioPlayer, playAudio, pauseAudio, syncAudioPosition } from '../../utils/listenTogetherApi.js';

export default {
  name: 'ListenTogetherFloatingButton',
  components: {
    ListenTogetherDialog
  },
  props: {
    currentSong: {
      type: Object,
      default: () => ({
        id: 0,
        playing: false,
        position: 0,
        duration: 0,
        detail: {
          name: '',
          cover: '',
          albumName: '',
          artistNames: []
        }
      })
    },
    currentPosition: {
      type: Number,
      default: 0
    },
    isPlaying: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDialogVisible: false,
      isVisible: false, // 默认不显示悬浮按钮，只有用户主动打开弹窗才显示
      audioPlayer: null, // 音频播放器实例
      userInteracted: false, // 用户是否已交互
      currentSongId: null, // 当前歌曲ID缓存
      audioUrl: null, // 音频URL缓存
      lastSyncTime: 0 // 上次同步时间戳
    };
  },

  watch: {
    // 监听音乐播放状态，根据播放状态显示/隐藏悬浮球
    isPlaying: {
      handler(newVal) {
        console.log('🎵 一起听播放状态变化:', newVal);

        // 只有在用户已经加入一起听（打开过弹窗）的情况下才根据播放状态显示悬浮球
        if (this.userInteracted) {
          // 控制音频播放器的播放/暂停
          if (this.audioPlayer) {
            if (newVal) {
              console.log('🎵 开始播放音频');
              playAudio(this.audioPlayer, this.userInteracted);
            } else {
              console.log('🎵 暂停音频播放');
              pauseAudio(this.audioPlayer);
            }
          }
        }
      },
      immediate: true
    },
    // 监听当前歌曲变化，自动加载并播放音乐
    currentSong: {
      handler(newSong, oldSong) {
        // 只有在用户已经加入一起听（打开过弹窗）的情况下才处理歌曲变化
        if (this.userInteracted && newSong.id && newSong.id !== (oldSong?.id || 0)) {
          console.log('🎵 歌曲ID发生变化，从', oldSong?.id || 0, '变为', newSong.id);
          this.loadAndPlayMusic(newSong);
        }
      },
      deep: true
    },
    // 监听播放位置变化，同步音频播放器进度
    currentPosition: {
      handler(newPosition) {
        // 只有在用户已经加入一起听（打开过弹窗）的情况下才同步播放位置
        if (!this.userInteracted) {
          return;
        }

        // 限制同步频率，避免过于频繁的同步操作
        const now = Date.now();
        if (now - this.lastSyncTime < 100) { // 100ms内只同步一次
          return;
        }

        if (this.audioPlayer) {
          // 只有当差异超过阈值时才同步，避免频繁更新
          if (Math.abs(this.audioPlayer.currentTime - newPosition) > 0.5) {
            this.audioPlayer.currentTime = newPosition;
            this.lastSyncTime = now;
          }
        }
      }
    }
  },

  methods: {
    async showDialog() {
      // 显示"正在加入中"提示
      Snackbar.builder('正在加入一起听');

      this.isDialogVisible = true;
      // Snackbar.builder('已加入一起听~')
      // 显示弹窗时显示悬浮球，表示用户已加入一起听
      this.isVisible = true;

      // 标记用户已交互，表示用户已主动加入一起听
      this.userInteracted = true;

      // 如果有当前歌曲，加载并播放音乐
      if (this.currentSong && this.currentSong.id) {
        // 使用nextTick确保DOM更新后再加载音乐，避免阻塞UI
        this.$nextTick(() => {
          this.loadAndPlayMusic(this.currentSong);
        });
      }
    },

    handleClose() {
      // 关闭弹窗时仍然显示悬浮球，因为用户仍在一起听状态
      this.isDialogVisible = false;
      this.isVisible = true;

      // 不再暂停音乐播放 - 音乐应该继续播放
      // 只有点击退出一起听时才暂停播放
    },

    async loadAndPlayMusic(song) {
      // 只有在用户已经加入一起听（打开过弹窗）的情况下才加载音乐
      if (!this.userInteracted) {
        console.log('🎵 用户尚未加入一起听，不加载音乐');
        return;
      }

      console.log('🎵 加载音乐，当前播放状态:', this.isPlaying, '歌曲ID:', song.id);

      try {
        // 检查是否需要重新获取音频URL（歌曲ID发生变化时）
        if (!this.audioUrl || this.currentSongId !== song.id) {
          console.log('🎵 歌曲ID发生变化，需要加载新歌曲:', song.id);

          // 在获取新歌曲URL之前，先完全停止并清理当前播放器
          if (this.audioPlayer) {
            console.log('🎵 完全停止并清理当前播放器');
            // 移除所有事件监听器
            this.audioPlayer.removeEventListener('timeupdate', this.handleTimeUpdate);
            this.audioPlayer.removeEventListener('ended', this.handlePlaybackEnded);
            this.audioPlayer.removeEventListener('play', this.handlePlay);
            this.audioPlayer.removeEventListener('pause', this.handlePause);
            // 暂停播放
            this.audioPlayer.pause();
            // 重置播放器状态
            this.audioPlayer.currentTime = 0;
            // 清空src
            this.audioPlayer.src = '';
            // 设置为null以确保完全释放
            this.audioPlayer = null;
          }

          console.log('🎵 获取新歌曲的音频URL:', song.id);
          // 获取音乐播放URL
          const audioUrl = await fetchMusicUrl(song.id);
          if (!audioUrl) {
            console.error('🎵 无法获取音乐播放URL');
            return;
          }

          // 更新缓存
          this.audioUrl = audioUrl;
          this.currentSongId = song.id;

          // 创建新的音频播放器
          console.log('🎵 创建新的音频播放器');
          this.audioPlayer = createAudioPlayer(this.audioUrl);

          // 添加播放事件监听器
          this.audioPlayer.addEventListener('timeupdate', this.handleTimeUpdate);
          this.audioPlayer.addEventListener('ended', this.handlePlaybackEnded);
          this.audioPlayer.addEventListener('play', this.handlePlay);
          this.audioPlayer.addEventListener('pause', this.handlePause);
        }

        // 确保播放器存在
        if (!this.audioPlayer) {
          console.log('🎵 播放器不存在，创建新的音频播放器');
          this.audioPlayer = createAudioPlayer(this.audioUrl);

          // 添加播放事件监听器
          this.audioPlayer.addEventListener('timeupdate', this.handleTimeUpdate);
          this.audioPlayer.addEventListener('ended', this.handlePlaybackEnded);
          this.audioPlayer.addEventListener('play', this.handlePlay);
          this.audioPlayer.addEventListener('pause', this.handlePause);
        }

        // 根据socket推送的播放状态来决定是否播放
        // socket推送的状态优先级最高
        if (this.isPlaying && this.currentPosition >= 0) {
          console.log('🎵 根据socket状态开始播放');
          // 同步播放位置后再播放
          if (Math.abs(this.audioPlayer.currentTime - this.currentPosition) > 0.1) {
            console.log('🎵 同步播放位置到:', this.currentPosition);
            this.audioPlayer.currentTime = this.currentPosition;
          }
          await playAudio(this.audioPlayer, this.userInteracted);
        } else if (!this.isPlaying && this.audioPlayer && !this.audioPlayer.paused) {
          // 如果socket推送的是暂停状态，且音频正在播放，则暂停
          console.log('🎵 根据socket状态暂停播放');
          pauseAudio(this.audioPlayer);
        } else if (this.isPlaying && this.audioPlayer.paused) {
          // 如果socket推送的是播放状态，但音频暂停了，则同步位置并播放
          console.log('🎵 同步位置并恢复播放');
          if (Math.abs(this.audioPlayer.currentTime - this.currentPosition) > 0.1) {
            console.log('🎵 同步播放位置到:', this.currentPosition);
            this.audioPlayer.currentTime = this.currentPosition;
          }
          await playAudio(this.audioPlayer, this.userInteracted);
        }

        // 同步播放位置（使用更小的阈值确保精确同步）
        // 确保总是同步到最新的实时进度
        if (this.currentPosition >= 0) {
          // 使用更小的阈值(0.1秒)确保精确同步到最新进度
          if (Math.abs(this.audioPlayer.currentTime - this.currentPosition) > 0.1) {
            console.log('🎵 同步播放位置到:', this.currentPosition);
            this.audioPlayer.currentTime = this.currentPosition;
          }
        }
      } catch (error) {
        console.error('🎵 加载音乐时发生错误:', error);
      }
    },

    handleTimeUpdate() {
      if (this.audioPlayer) {
        // 限制更新频率，避免过于频繁的更新操作
        const now = Date.now();
        if (now - this.lastSyncTime < 100) { // 100ms内只更新一次
          return;
        }

        // 只有当差异超过阈值时才更新父组件，避免频繁更新
        if (Math.abs(this.audioPlayer.currentTime - this.currentPosition) > 0.5) {
          // 通过事件通知父组件更新播放位置
          this.$emit('update:currentPosition', this.audioPlayer.currentTime);
          this.lastSyncTime = now;
        }
      }
    },
    handlePlaybackEnded() {
      // 播放结束时暂停
      this.$emit('update:isPlaying', false);
    },
    handlePlay() {
      // 播放开始时更新状态
      this.$emit('update:isPlaying', true);
    },
    handlePause() {
      // 暂停时更新状态
      this.$emit('update:isPlaying', false);
    },
    togglePlay() {
      // 用户主动切换播放状态
      // 但socket推送的状态优先级最高，这里只通知父组件尝试更新状态
      if (this.audioPlayer) {
        if (this.isPlaying) {
          // 当前是播放状态，用户想要暂停
          pauseAudio(this.audioPlayer);
          // 通过事件通知父组件更新播放状态
          this.$emit('update:isPlaying', false);
        } else {
          // 当前是暂停状态，用户想要播放
          playAudio(this.audioPlayer, this.userInteracted).then(success => {
            if (success) {
              // 通过事件通知父组件更新播放状态
              this.$emit('update:isPlaying', true);
            }
          });
        }
      }
    },
    handleExit() {
      // 处理退出一起听功能 - 立即隐藏悬浮球，优先级最高
      Snackbar.builder('已退出一起听')
      this.isDialogVisible = false;
      this.isVisible = false; // 退出时隐藏悬浮球

      // 清理音频播放器并暂停播放
      if (this.audioPlayer) {
        this.audioPlayer.pause();
        this.audioPlayer = null;
      }

      // 重置缓存
      this.audioUrl = null;
      this.currentSongId = null;

      // 重置用户交互状态
      this.userInteracted = false;
    },
    handleExitAndDispatch() {
      // 先执行退出逻辑
      this.handleExit();

      // 再触发自定义事件，通知App.vue销毁播放实例
      window.dispatchEvent(new CustomEvent('listen-together-exit'));
    },
    // 处理来自ListenTogetherDialog的位置更新事件
    handleUpdateCurrentPosition(newPosition) {
      console.log('🎵 接收到ListenTogetherDialog的位置更新事件:', newPosition);
      // 将位置更新事件传递给父组件
      this.$emit('update:currentPosition', newPosition);
    }
  },

  beforeUnmount() {
    // 组件销毁前清理音频播放器
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }

    // 清理缓存
    this.audioUrl = null;
    this.currentSongId = null;
  }
};
</script>

<style scoped>
.listen-together-floating-container {
  position: fixed;
  bottom: 50px;
  right: 20px;
  z-index: 9999;
}

.listen-together-floating-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  /* 更加透明的高斯模糊渐变背景 */
  background: linear-gradient(135deg, rgba(131, 85, 255, 0.2), rgba(168, 85, 247, 0.1));
  /* backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px); */
  /* box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3); */
  /* border: 1px solid rgba(255, 255, 255, 0.2); */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.listen-together-floating-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 70%);
  transform: rotate(30deg);
  pointer-events: none;
}

.listen-together-floating-button:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, rgba(131, 85, 255, 0.3), rgba(168, 85, 247, 0.15));
  box-shadow:
    0 6px 25px rgba(0, 0, 0, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.listen-together-floating-button:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, rgba(131, 85, 255, 0.15), rgba(168, 85, 247, 0.08));
}

.floating-button-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.floating-play-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #4ade80;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
  animation: pulse 1.5s infinite ease-in-out;
  transform: translate(50%, -50%);
  z-index: 10000;
}

@keyframes pulse {
  0% {
    transform: translate(50%, -50%) scale(1);
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
  }

  50% {
    transform: translate(50%, -50%) scale(1.1);
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.8);
  }

  100% {
    transform: translate(50%, -50%) scale(1);
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
  }
}

/* 悬浮按钮动画 */
.float-button-enter-active,
.float-button-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.float-button-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.float-button-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .listen-together-floating-container {
    bottom: 80px;
    right: 16px;
  }

  .listen-together-floating-button {
    width: 45px;
    height: 45px;
  }

  .floating-button-icon {
    width: 22px;
    height: 22px;
  }

  .floating-play-indicator {
    width: 10px;
    height: 10px;
    animation: pulse-small 1.5s infinite ease-in-out;
  }
}

@media (max-width: 480px) {
  .listen-together-floating-container {
    bottom: 70px;
    right: 12px;
  }

  .listen-together-floating-button {
    width: 40px;
    height: 40px;
  }

  .floating-button-icon {
    width: 20px;
    height: 20px;
  }

  .floating-play-indicator {
    width: 8px;
    height: 8px;
    animation: pulse-small 1.5s infinite ease-in-out;
  }
}

@keyframes pulse-small {
  0% {
    transform: translate(50%, -50%) scale(1);
    box-shadow: 0 0 4px rgba(74, 222, 128, 0.6);
  }

  50% {
    transform: translate(50%, -50%) scale(1.1);
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.8);
  }

  100% {
    transform: translate(50%, -50%) scale(1);
    box-shadow: 0 0 4px rgba(74, 222, 128, 0.6);
  }
}
</style>
