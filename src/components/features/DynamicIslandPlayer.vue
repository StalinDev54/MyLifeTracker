<template>
  <!-- iOS状态栏 -->
  <div class="ios-status-bar">
    <!-- 状态栏顶部 - 显示时间和状态图标 -->
    <div class="status-bar-top" :class="{ 'has-tooltip': !isCurrentlyPlaying && isExpanded }">
      <!-- 左侧时间 -->
      <div class="status-bar-time">{{ currentTime }}</div>



      <div v-if="currentActivity && currentActivity.name" class="status-icon app-icon" :title="currentActivity.name">
        <template v-if="appIconMap[currentActivity.name]">
          <img :src="appIconMap[currentActivity.name]" :alt="currentActivity.name" class="app-status-icon">
        </template>
        <template v-else>
          <!-- <mdui-icon :name="currentActivity.icon || 'apps'" size="10"></mdui-icon> -->
        </template>
      </div>

      <!-- 右侧状态栏图标 -->
      <div class="status-bar-icons">

        <div
          v-if="isCurrentlyPlaying && (!currentActivity || !currentActivity.name || !currentActivity.name.includes('网易云'))"
          class="status-icon netease-cloud-icon">
          <img src="../../assets/APPicons/网易云音乐_9.3.70.png" alt="网易云音乐" class="netease-cloud-icon-img">
        </div>

        <!-- 信号图标 -->
        <div class="status-icon signal-icon">
          <svg width="18" height="14" viewBox="0 0 15 11" fill="none">
            <path
              d="M2.5 8.5V10.5H1.5V8.5H2.5ZM7.5 4.5V10.5H6.5V4.5H7.5ZM12.5 0.5V10.5H11.5V0.5H12.5ZM10 2.5V10.5H9V2.5H10ZM5 6.5V10.5H4V6.5H5Z"
              fill="currentColor" />
          </svg>
        </div>

        <!-- 网易云音乐图标 - 仅在音乐播放时显示，且当前活动应用不是网易云音乐时显示 -->

        <!-- 当前活动应用图标 -->


        <!-- WiFi图标 -->
        <!-- <div class="status-icon wifi-icon">
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
            <path
              d="M7.5 1.5C8.32843 1.5 9 2.17157 9 3V4.5C8.73478 4.5 8.5 4.73478 8.5 5C8.5 5.26522 8.73478 5.5 9 5.5H10C10.5523 5.5 11 5.94772 11 6.5V7.5C10.4477 7.5 10 7.94772 10 8.5C10 9.05228 10.4477 9.5 11 9.5H12C12.5523 9.5 13 9.94772 13 10.5V11H2V10.5C2 9.94772 2.44772 9.5 3 9.5H4C4.55228 9.5 5 9.05228 5 8.5C5 7.94772 4.55228 7.5 4 7.5V6.5C4 5.94772 4.44772 5.5 5 5.5H6C6.26522 5.5 6.5 5.26522 6.5 5C6.5 4.73478 6.26522 4.5 6 4.5V3C6 2.17157 6.67157 1.5 7.5 1.5Z"
              fill="currentColor" />
          </svg>
        </div> -->

        <!-- 电池图标 -->
        <div class="ios-battery" :class="getBatteryLevelClass()">
          <div class="ios-battery-top"></div>
          <div class="ios-battery-body">
            <div class="ios-battery-fill" :style="{ width: deviceStatus.battery.level + '%' }"></div>
          </div>
        </div>

        <!-- 电池百分比 -->
        <div class="ios-battery-percentage" :class="getBatteryLevelClass()">
          {{ deviceStatus.battery.level }}%
          <span v-if="deviceStatus.battery.charging" class="ios-charging-icon">⚡</span>
        </div>
      </div>
    </div>

    <!-- 状态栏底部 - 动态岛音乐播放器 -->
    <div class="dynamic-island-container" :class="{ 'is-playing': isCurrentlyPlaying, 'is-expanded': isExpanded }">
      <!-- 暂停播放时的气泡提示 -->
      <transition name="tooltip-fade">
        <div v-if="!isCurrentlyPlaying && showPauseTooltip" class="pause-tooltip">
          <div class="tooltip-content">
            <span class="tooltip-text">上次播放于{{ formatLastPlayTime() }}</span>
            <div class="tooltip-arrow"></div>
          </div>
        </div>
        <div v-else-if="isExpanded && showPlayTooltip" class="pause-tooltip">
          <div class="tooltip-content">
            <span class="tooltip-text">网易云听歌中</span>
            <div class="tooltip-arrow"></div>
          </div>
        </div>
      </transition>

      <div class="dynamic-island-wrapper" @click="toggleExpand" :class="{ 'expanded': isExpanded }">
        <!-- 动态背景 - 基于当前歌曲封面的高斯模糊效果 -->
        <div class="dynamic-background" :style="getDynamicBackgroundStyle()" v-if="currentSong.detail.cover"></div>
        <!-- 歌曲封面 -->
        <div class="song-cover-container"
          :class="{ 'cover-playing': currentSong && currentSong.id, 'is-playing': isCurrentlyPlaying }">
          <!-- 封面图片加载状态容器 -->
          <div class="cover-loader-wrapper">
            <!-- 封面图片 -->
            <img :src="currentSong.detail.cover ? currentSong.detail.cover.replace(/[`']/g, '') : ''"
              :alt="currentSong.detail.name" class="song-cover"
              :class="{ 'cover-rotate': isCurrentlyPlaying, 'loaded': isCoverLoaded }" @load="handleCoverLoad"
              @error="handleCoverError" />

            <!-- 加载中状态 - 当图片加载时显示 -->
            <div v-if="isLoading || !isCoverLoaded && currentSong.detail.cover" class="cover-loading">
              <div class="loading-spinner"></div>
            </div>

            <!-- 图片占位 - 当没有图片时显示 -->
            <div v-else-if="!currentSong.detail.cover" class="cover-placeholder">
              <div class="placeholder-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L14.5 9H21L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L3 9H9.5L12 3Z" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <!-- iOS播放律动效果（只在真正播放时显示） -->
          <div v-if="isCurrentlyPlaying" class="playing-visualizer">
            <div class="visualizer-bar" v-for="i in 4" :key="i" :style="{ animationDelay: i * 0.1 + 's' }"></div>
          </div>
        </div>

        <!-- 歌曲信息 -->
        <div class="song-info">
          <h3 class="song-name">{{ currentSong.detail.name }}</h3>
          <p class="song-artist">{{ currentSong.detail.artistNames.join(' / ') }}</p>

          <!-- iOS风格进度条 - 仅在展开状态显示 -->
          <div v-if="isExpanded" class="ios-progress-container">
            <!-- 进度条轨道 -->
            <div class="ios-progress-track" ref="progressTrack">
              <!-- 进度条填充 -->
              <div class="ios-progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>

            <!-- iOS风格歌词显示区域 - 仅在展开状态且有歌词时显示 -->


            <!-- 时间显示 -->
            <div class="ios-time-display">
              <span class="current-time">{{ formatTime(currentDisplayPosition || currentSong.position || 0) }}</span>
              <span class="total-time">{{ formatTime(currentSong.duration || 0) }}</span>
            </div>

            <div v-if="showLyrics && currentLyrics.length > 0" class="ios-lyrics-container">
              <transition name="lyric-fade" mode="out-in">
                <div :key="currentLyricIndex" class="ios-lyric-text" :class="{ 'lyric-playing': isCurrentlyPlaying }">
                  {{ getCurrentLyricText() }}
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- 按钮区域容器 -->
        <div class="player-buttons-container">
          <!-- 播放列表按钮 -->
          <div class="playlist-button" @click.stop="showRecentPlaylist"
            :class="{ 'button-playing': isCurrentlyPlaying }">
            <img src="../../assets/APPicons/dea253caeb50477275d52c88e8ec667f_720.png" alt="播放列表">
          </div>

          <!-- 一起听选项 - 只在展开状态显示 -->
          <div v-if="isExpanded" class="listen-together-button" @click.stop="showListenTogetherOptions">
            <img src="../../assets/APPicons/icons8-airpods-3-50.png" alt="一起听">
          </div>
        </div>

        <!-- 背景装饰 -->
        <div class="island-decoration" :class="{ 'decoration-playing': isCurrentlyPlaying }"></div>

        <!-- 播放时的音频波形效果 -->
        <div v-if="isCurrentlyPlaying" class="audio-wave-background">
          <div class="wave-circle" v-for="i in 3" :key="i" :style="{ animationDelay: i * 0.6 + 's' }"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 最近播放列表对话框 - 使用 Teleport 确保在最顶层 -->
  <Teleport to="body">
    <RecentPlaylistDialog :visible="showRecentPlaylistDialog" :recent-songs="recentPlaylistData"
      :current-playing-song="apiCurrentPlayingSong" @close="hideRecentPlaylist" @play-song="handlePlaySong" />
  </Teleport>

  <!-- 一起听对话框 - 使用 Teleport 确保在最顶层 -->
  <Teleport to="body">
    <ListenTogetherDialog :visible="showListenTogetherDialog" :current-song="currentSong"
      :current-position="currentDisplayPosition || currentSong.position || 0" :is-playing="isCurrentlyPlaying"
      @close="hideListenTogether" @toggle-play="togglePlayStatus" @exit="handleListenTogetherExit" />
  </Teleport>
</template>

<script>
import RecentPlaylistDialog from '../dialogs/RecentPlaylistDialog.vue';
import ListenTogetherDialog from '../dialogs/ListenTogetherDialog.vue';
import { fetchMusicData, onMusicDataUpdate, offMusicDataUpdate, processMusicData, getCurrentPlayingSong, updatePlayingStatus, clearAllPlayingStatus, disconnectMusicSocket } from '../../utils/musicApi.js';
import { fetchLyricsWithCache, parseLRCLyrics, getCurrentLyricIndex, getCurrentLyricText, extractSongId } from '../../utils/lyricApi.js';
import { Snackbar } from 'sober'

export default {
  name: 'IOSStatusBarPlayer',
  emits: ['music-playing-status-changed'],
  components: {
    RecentPlaylistDialog,
    ListenTogetherDialog
  },
  props: {
    deviceStatus: {
      type: Object,
      default: () => ({
        battery: {
          level: 85,
          charging: true
        }
      })
    },
    currentActivity: {
      type: Object,
      default: () => ({
        name: '',
        description: '',
        icon: ''
      })
    },
    appIconMap: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      // 展开状态 - 默认收纳，只有在播放音乐时才展开
      isExpanded: false,
      // 气泡显示状态
      showPauseTooltip: false,
      showPlayTooltip: false,
      // 上次播放时间戳 - 初始化为当前时间，将在接收到数据后更新为实际播放时间戳
      lastPlayTime: Date.now(),
      // 暂停提示定时器
      pauseTooltipTimer: null,
      // 自动隐藏定时器
      autoHideTimer: null,
      // 当前时间
      currentTime: '',
      // 时间更新定时器
      timeUpdateTimer: null,
      // 最近播放列表显示状态
      showRecentPlaylistDialog: false,
      // 一起听对话框显示状态
      showListenTogetherDialog: false,
      // 音乐数据
      recentPlaylistData: [],
      // 当前API提供的当前歌曲
      apiCurrentPlayingSong: null,
      // 数据加载状态
      isLoading: false,
      // 错误信息
      errorMessage: '',
      // 数据更新定时器
      dataUpdateTimer: null,
      // 封面图片加载状态
      isCoverLoaded: false,
      // 封面图片错误状态
      isCoverError: false,
      // 进度条更新定时器
      progressUpdateTimer: null,
      // 上一个播放状态，用于检测播放/暂停状态变化
      previousPlayingState: undefined,
      // 当前显示的播放进度位置（基于Socket数据和时间戳计算）
      currentDisplayPosition: 0,
      // 歌词相关状态
      currentLyrics: [],
      currentLyricIndex: 0,
      showLyrics: true, // 是否显示歌词
      lyricScrollEnabled: true, // 是否启用歌词滚动
      lyricsLoading: false, // 歌词加载状态
      lyricsError: null // 歌词加载错误信息
    };
  },
  watch: {
    // 当当前歌曲变化时，重置封面加载状态
    'currentSong.id': function () {
      this.isCoverLoaded = false;
      this.isCoverError = false;
    },
    // 监听音乐播放状态变化，通过emit发送给父组件并控制播放器展开/收起
    isCurrentlyPlaying: function (newVal, oldVal) {
      this.$emit('music-playing-status-changed', {
        isPlaying: newVal,
        currentSong: this.currentSong
      });

      // 只要播放状态为false就收纳播放器
      if (!newVal) {
        this.isExpanded = false;

        // 当从播放状态切换到暂停状态时，记录暂停时间并显示提示
        if (oldVal === true && this.currentSong && this.currentSong.id) {
          // 使用从API获取的实际播放时间戳，而不是本地时间
          this.lastPlayTime = this.currentSong.timestamp || Date.now();
          this.showPauseTooltipWithDelay();
        }
      }
      // 只要播放状态为true就展开播放器
      if (newVal) {
        this.isExpanded = true;
        // 播放时隐藏暂停提示
        this.hidePauseTooltip();
      }
    },
    // 监听当前歌曲信息变化
    currentSong: {
      handler: function (newSong, oldSong) {
        this.$emit('music-playing-status-changed', {
          isPlaying: this.isCurrentlyPlaying,
          currentSong: newSong
        });

        // 当歌曲切换时，重置歌词状态并加载新歌词
        if (oldSong && newSong && oldSong.id !== newSong.id) {
          this.resetLyricsState();
          this.loadLyricsForSong(newSong);
        }
        // 当首次获取到歌曲信息时，也加载歌词
        else if (!oldSong && newSong && newSong.id) {
          this.loadLyricsForSong(newSong);
        }
      },
      deep: true
    },

    // 监听播放进度变化，同步歌词显示
    currentDisplayPosition: function (newPosition) {
      if (this.lyricScrollEnabled && this.currentLyrics.length > 0) {
        this.updateCurrentLyricIndex(newPosition);
      }
    },
    // 监听展开状态变化，当展开时显示相应气泡并设置2秒后隐藏
    isExpanded: function (newVal) {
      // 清除之前可能存在的定时器
      if (this.autoHideTimer) {
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = null;
      }

      // 如果展开了且音乐处于停止状态，立即显示暂停气泡并设置2秒后隐藏
      if (newVal && !this.isCurrentlyPlaying) {
        // 立即显示气泡
        this.showPauseTooltip = true;
        this.showPlayTooltip = false;

        // 设置2秒后自动隐藏气泡的定时器
        this.autoHideTimer = setTimeout(() => {
          this.showPauseTooltip = false;
          this.autoHideTimer = null;
        }, 2000);
      }
      // 如果展开了且音乐处于播放状态，立即显示播放中气泡并设置2秒后隐藏
      else if (newVal && this.isCurrentlyPlaying) {
        // 立即显示播放中气泡
        this.showPlayTooltip = true;
        this.showPauseTooltip = false;

        // 设置2秒后自动隐藏播放中气泡的定时器
        this.autoHideTimer = setTimeout(() => {
          this.showPlayTooltip = false;
          this.autoHideTimer = null;
        }, 2000);
      }
      // 如果收起了播放器，隐藏所有气泡
      else if (!newVal) {
        this.showPauseTooltip = false;
        this.showPlayTooltip = false;
      }
    }
  },
  computed: {
    // 当前歌曲（从 API 的 currentPlayingSong 获取，如果没有则显示第一首）
    currentSong() {
      // 如果没有数据，返回默认状态
      if (this.recentPlaylistData.length === 0) {
        return {
          available: false,
          id: 0,
          playing: false,
          position: 0,
          duration: 0,
          detail: {
            name: this.isLoading ? "获取音乐播放中..." : "暂无播放",
            cover: "",
            albumName: "",
            artistNames: []
          },
          timestamp: Date.now()
        };
      }

      // 优先使用 API 提供的 currentPlayingSong，如果没有则使用第一首歌
      // currentPlayingSong 表示当前歌曲（无论是否暂停），playing 字段只表示播放/暂停状态
      return this.apiCurrentPlayingSong || this.recentPlaylistData[0];
    },

    // 当前是否正在播放（只判断播放/暂停状态，不影响歌曲显示）
    isCurrentlyPlaying() {
      // playing 字段只表示播放/暂停状态，不影响歌曲信息显示
      return this.currentSong &&
        this.currentSong.playing === true &&
        this.recentPlaylistData.length > 0;
    },

    // 进度百分比（基于实时计算的显示位置）
    progressPercentage() {
      if (!this.currentSong.duration || this.currentSong.duration <= 0) {
        return 0;
      }
      // 使用实时计算的显示位置，而不是原始Socket数据位置
      const displayPosition = this.currentDisplayPosition || this.currentSong.position || 0;
      const percentage = (displayPosition / this.currentSong.duration) * 100;
      return Math.min(Math.max(percentage, 0), 100);
    }
  },
  mounted() {
    // 初始化时间显示
    this.updateTime();
    // 设置时间更新定时器 - 每秒更新一次以确保时间准确
    this.timeUpdateTimer = setInterval(() => {
      this.updateTime();
    }, 1000); // 每秒更新一次

    // 注册音乐数据实时更新回调
    onMusicDataUpdate(this.handleMusicDataUpdate);

    // 添加页面滚动事件监听
    this.setupScrollListener();

    // 设置进度条拖拽事件监听
    this.setupProgressBarEvents();

    // 启动进度条更新定时器
    this.startProgressUpdate();

    // 初始化歌词状态
    this.resetLyricsState();

    // 注意：现在不立即加载音乐数据，而是依赖于ProfileView.vue中已经初始化好的Socket连接
    // 但为了防止网络问题，添加一个延迟加载作为备用方案
    setTimeout(() => {
      if (!this.recentPlaylistData.length && !this.isLoading) {
        console.log('🎵 备用方案：尝试加载音乐数据');
        this.loadMusicData();
      }
    }, 2000);

    // 如果已经有当前歌曲，立即加载歌词
    this.$nextTick(() => {
      if (this.currentSong && this.currentSong.id) {
        this.loadLyricsForSong(this.currentSong);
      }
    });
  },
  beforeUnmount() {
    // 清理定时器
    if (this.timeUpdateTimer) {
      clearInterval(this.timeUpdateTimer);
    }
    if (this.dataUpdateTimer) {
      clearInterval(this.dataUpdateTimer);
    }
    if (this.progressUpdateTimer) {
      clearInterval(this.progressUpdateTimer);
    }
    if (this.pauseTooltipTimer) {
      clearTimeout(this.pauseTooltipTimer);
    }
    // 清理自动隐藏定时器
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
    }

    // 清理进度条拖拽事件监听器
    if (this._eventListeners && this._eventListeners.length > 0) {
      this._eventListeners.forEach(listener => {
        if (listener.target && typeof listener.target.removeEventListener === 'function') {
          listener.target.removeEventListener(listener.type, listener.handler);
        }
      });
      this._eventListeners = [];
    }

    // 移除音乐数据更新回调
    offMusicDataUpdate(this.handleMusicDataUpdate);

    // 断开音乐Socket连接
    disconnectMusicSocket();

    // 移除滚动事件监听
    this.removeScrollListener();
  },
  methods: {
    // 设置页面滚动监听 - 仅在电脑端启用
    setupScrollListener() {
      // 检测是否为移动端设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;

      // 移动端直接返回，不添加滚动监听
      if (isMobile) {
        // console.log('🔧 移动端设备，跳过滚动监听设置');
        return;
      }

      // 存储上一次滚动的位置
      this.lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // 添加滚动事件监听，使用节流来优化性能
      this.scrollHandler = this.throttle(this.handleScroll, 100);
      window.addEventListener('scroll', this.scrollHandler);
      // console.log('🔧 电脑端设备，已启用滚动监听');
    },

    // 移除页面滚动监听
    removeScrollListener() {
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler);
        this.scrollHandler = null;
        // console.log('🔧 已移除滚动监听');
      }
    },

    // 处理页面滚动事件 - 仅电脑端有效
    handleScroll() {
      // 再次检查是否为移动端，双重保险
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;

      if (isMobile) {
        return; // 移动端直接返回，不处理滚动
      }

      // 只有在音乐播放时才响应滚动展开/收纳
      if (!this.isCurrentlyPlaying) {
        return;
      }

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDiff = scrollTop - this.lastScrollTop;

      // 只有在滚动距离超过20px时才触发状态切换，避免微小滚动带来的频繁变化
      if (Math.abs(scrollDiff) > 20) {
        // 下滑页面（向下滚动）
        if (scrollDiff > 0 && this.isExpanded) {
          this.isExpanded = false;
          // console.log('🔧 电脑端向下滚动，收纳灵动岛');
        }
        // 上滑页面（向上滚动）
        else if (scrollDiff < 0 && !this.isExpanded) {
          this.isExpanded = true;
          // console.log('🔧 电脑端向上滚动，展开灵动岛');
        }

        // 更新上一次滚动位置
        this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // 避免出现负数
      }
    },

    // 节流函数 - 限制函数调用频率
    throttle(func, delay) {
      let timeoutId;
      let lastExecTime = 0;

      return function (...args) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastExecTime;

        // 清除之前的定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 如果距离上次执行的时间超过了延迟时间，立即执行
        if (elapsedTime > delay) {
          func.apply(this, args);
          lastExecTime = currentTime;
        } else {
          // 否则，设置定时器在剩余时间后执行
          timeoutId = setTimeout(() => {
            func.apply(this, args);
            lastExecTime = Date.now();
          }, delay - elapsedTime);
        }
      };
    },

    // 设置进度条拖拽事件监听
    setupProgressBarEvents() {
      // 等待DOM更新完成
      this.$nextTick(() => {
        if (this.$refs.progressTrack) {
          const progressTrack = this.$refs.progressTrack;
          let isDragging = false;

          // 处理拖拽开始
          const handleDragStart = (e) => {
            isDragging = true;
            // 拖拽开始时清除进度更新定时器，避免拖拽过程中的进度计算冲突
            if (this.progressUpdateTimer) {
              clearInterval(this.progressUpdateTimer);
              this.progressUpdateTimer = null;
            }
            this.updateProgressFromEvent(e);
          };

          // 处理拖拽中
          const handleDragMove = (e) => {
            if (isDragging) {
              this.updateProgressFromEvent(e);
            }
          };

          // 处理拖拽结束
          const handleDragEnd = () => {
            if (isDragging) {
              isDragging = false;
              // 拖拽结束后，以新位置为基准重新计算进度
              this.onProgressBarDragged();
            }
          };

          // 添加鼠标事件监听
          progressTrack.addEventListener('mousedown', handleDragStart);
          window.addEventListener('mousemove', handleDragMove);
          window.addEventListener('mouseup', handleDragEnd);

          // 创建触摸事件处理函数的引用
          const touchStartHandler = (e) => {
            e.preventDefault();
            handleDragStart(e.touches[0]);
          };

          const touchMoveHandler = (e) => {
            if (isDragging) {
              e.preventDefault();
              handleDragMove(e.touches[0]);
            }
          };

          // 添加触摸事件监听（使用被动监听器优化性能）
          progressTrack.addEventListener('touchstart', touchStartHandler, { passive: false });
          window.addEventListener('touchmove', touchMoveHandler, { passive: false });
          window.addEventListener('touchend', handleDragEnd);

          // 存储事件监听器引用以便在组件销毁时移除
          this._eventListeners = this._eventListeners || [];
          this._eventListeners.push({
            target: progressTrack,
            type: 'mousedown',
            handler: handleDragStart
          });
          this._eventListeners.push({
            target: window,
            type: 'mousemove',
            handler: handleDragMove
          });
          this._eventListeners.push({
            target: window,
            type: 'mouseup',
            handler: handleDragEnd
          });
          this._eventListeners.push({
            target: progressTrack,
            type: 'touchstart',
            handler: touchStartHandler
          });
          this._eventListeners.push({
            target: window,
            type: 'touchmove',
            handler: touchMoveHandler
          });
          this._eventListeners.push({
            target: window,
            type: 'touchend',
            handler: handleDragEnd
          });
        }
      });
    },

    // 根据鼠标/触摸事件更新进度
    updateProgressFromEvent(e) {
      // 只有当socket播放状态为暂停时才允许拖拽进度条
      if (this.apiCurrentPlayingSong && this.apiCurrentPlayingSong.playing === true) {
        console.log('🎵 Socket播放状态为播放中，无法拖拽进度条');
        return;
      }
      
      if (!this.apiCurrentPlayingSong || !this.$refs.progressTrack) {
        return;
      }

      const progressTrack = this.$refs.progressTrack;
      const rect = progressTrack.getBoundingClientRect();
      const clientX = e.clientX || e.pageX;
      const position = (clientX - rect.left) / rect.width;

      // 计算新的播放位置（确保在有效范围内）
      const newPosition = Math.max(0, Math.min(this.apiCurrentPlayingSong.duration,
        Math.floor(position * this.apiCurrentPlayingSong.duration)));

      // 更新显示位置（用于拖拽时的实时反馈）
      this.currentDisplayPosition = newPosition;

      // 确保UI立即更新
      this.$forceUpdate();
    },

    // 进度条拖拽结束后处理
    onProgressBarDragged() {
      // 只有当socket播放状态为暂停时才处理拖拽结束事件
      if (this.apiCurrentPlayingSong && this.apiCurrentPlayingSong.playing === true) {
        console.log('🎵 Socket播放状态为播放中，无法拖拽进度条');
        return;
      }
      
      if (!this.apiCurrentPlayingSong) {
        return;
      }

      const newPosition = this.currentDisplayPosition;
      console.log(`🎵 进度条被拖拽到新位置: ${newPosition}s`);

      // 更新Socket数据的播放位置和时间戳
      this.apiCurrentPlayingSong.position = newPosition;
      this.apiCurrentPlayingSong.timestamp = Date.now();

      // 立即基于新的拖拽位置重新计算进度
      this.calculateCorrectProgress();

      // 重新启动进度更新定时器，以新位置为基准
      this.startProgressUpdate();

      // 注意：这里应该发送拖拽位置到服务器，确保其他用户也能看到一致的进度
      // TODO: 发送拖拽进度到服务器
      console.log('🎵 拖拽完成，建议发送新进度到服务器以保持多用户同步');
    },
    // 更新当前时间
    updateTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      this.currentTime = `${hours}:${minutes}`;
    },

    // 获取电池电量级别样式类
    getBatteryLevelClass() {
      const level = this.deviceStatus.battery.level;
      if (level >= 60) {
        return 'battery-level-high';
      } else if (level >= 20) {
        return 'battery-level-medium';
      } else {
        return 'battery-level-low';
      }
    },

    // 切换展开/收起状态
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },

    // 显示最近播放列表
    showRecentPlaylist() {
      this.showRecentPlaylistDialog = true;
    },

    // 显示一起听选项
    showListenTogetherOptions() {
      // this.showListenTogetherDialog = true;

      // 发射全局事件通知App.vue显示悬浮球
      window.dispatchEvent(new CustomEvent('listen-together-show'));
      console.log('显示一起听选项');
    },

    // 隐藏最近播放列表
    hideRecentPlaylist() {
      this.showRecentPlaylistDialog = false;
    },

    // 隐藏一起听对话框
    hideListenTogether() {
      this.showListenTogetherDialog = false;
    },

    // 处理一起听退出事件
    handleListenTogetherExit() {
      // 隐藏一起听对话框
      this.showListenTogetherDialog = false;
      // 发射全局事件通知App.vue隐藏悬浮球
      window.dispatchEvent(new CustomEvent('listen-together-exit'));
      // 可以在这里添加其他退出一起听的逻辑
      console.log('退出一起听功能');
    },

    // 切换播放状态
    togglePlayStatus() {
      // 这里可以添加切换播放状态的逻辑
      console.log('切换播放状态');
      // TODO: 实现播放/暂停功能
    },

    // 处理播放歌曲
    handlePlaySong(song) {
      console.log('播放歌曲:', song);
      // 更新所有歌曲的播放状态
      this.recentPlaylistData = updatePlayingStatus(this.recentPlaylistData, song.id);
      this.hideRecentPlaylist();
    },

    // 加载音乐数据
    async loadMusicData() {
      try {
        this.isLoading = true;
        this.errorMessage = '';

        const result = await fetchMusicData(this.handleMusicDataUpdate);

        if (result.success) {
          this.processReceivedMusicData(result);
        } else {
          this.errorMessage = result.error || '获取音乐数据失败';
          console.error('🎵 获取音乐数据失败:', result.error);
        }
      } catch (error) {
        this.errorMessage = '网络连接失败';
        console.error('🎵 加载音乐数据时发生错误:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // 处理接收到的音乐数据（统一处理逻辑）
    processReceivedMusicData(result) {
      // 处理音乐数据，保持原始的playing状态
      this.recentPlaylistData = processMusicData(result.data);

      // 保存 API 提供的 currentPlayingSong
      this.apiCurrentPlayingSong = result.currentPlayingSong || null;

      // 如果有当前歌曲，使用其时间戳更新lastPlayTime
      if (this.apiCurrentPlayingSong && this.apiCurrentPlayingSong.timestamp) {
        this.lastPlayTime = this.apiCurrentPlayingSong.timestamp;
      }

      // 检查是否是新的播放/暂停状态变更
      const isPlayingStateChange = this.previousPlayingState !== undefined &&
        this.previousPlayingState !== this.isCurrentlyPlaying;

      // 记录上一个播放状态
      this.previousPlayingState = this.isCurrentlyPlaying;

      // 根据接收到的Socket数据进行进度计算
      if (this.apiCurrentPlayingSong) {
        // 确保Socket推送数据包含时间戳
        if (!this.apiCurrentPlayingSong.timestamp) {
          this.apiCurrentPlayingSong.timestamp = Date.now();
          console.log('⚠️ Socket数据缺少时间戳，使用当前时间作为基准');
        }

        // 立即基于Socket数据计算实时进度
        this.calculateCorrectProgress();

        if (isPlayingStateChange) {
          if (this.isCurrentlyPlaying) {
            console.log('▶️ 检测到播放状态变更，基于Socket推送数据重新计算实时进度');
          } else {
            console.log('⏸️ 检测到暂停状态变更，停止进度计算，保持Socket推送的暂停位置');
          }
        }
      }

      // 重新启动进度更新定时器
      this.startProgressUpdate();
    },

    // Socket实时数据更新回调函数
    handleMusicDataUpdate(result) {
      // console.log('🎵 接收到Socket实时音乐数据更新:', result);
      this.processReceivedMusicData(result);
    },

    // 处理封面图片加载完成
    handleCoverLoad() {
      this.isCoverLoaded = true;
      this.isCoverError = false;
    },

    // 处理封面图片加载错误
    handleCoverError() {
      this.isCoverLoaded = false;
      this.isCoverError = true;
    },

    // 获取动态背景样式 - 基于当前歌曲封面的高斯模糊效果
    getDynamicBackgroundStyle() {
      if (!this.currentSong.detail.cover) {
        return {};
      }

      const coverUrl = this.currentSong.detail.cover.replace(/[`']/g, '');

      return {
        backgroundImage: `url("${coverUrl}")`,
        opacity: this.isCurrentlyPlaying ? 0.4 : 0.25
      };
    },

    // 启动进度条更新定时器
    startProgressUpdate() {
      // 清除现有定时器
      if (this.progressUpdateTimer) {
        clearInterval(this.progressUpdateTimer);
      }

      // 初始化时基于Socket数据计算实时进度
      this.calculateCorrectProgress();

      // 提高更新频率到每200毫秒一次，以获得更流畅的歌词同步
      this.progressUpdateTimer = setInterval(() => {
        if (this.apiCurrentPlayingSong && this.apiCurrentPlayingSong.timestamp && this.isCurrentlyPlaying) {
          // 始终基于Socket推送的数据和时间戳重新计算实时进度
          this.calculateCorrectProgress();
        }
      }, 200);
    },

    // 根据Socket推送数据的时间戳计算实时播放进度
    calculateCorrectProgress() {
      if (!this.apiCurrentPlayingSong || !this.apiCurrentPlayingSong.timestamp) {
        return;
      }

      try {
        // 获取当前系统时间
        const currentSystemTime = Date.now();

        // 计算从Socket推送时间戳到现在的时间差（保持毫秒级精度）
        const timeDifferenceMs = currentSystemTime - this.apiCurrentPlayingSong.timestamp;
        // 转换为秒，但保留小数部分以提高精度
        const timeDifference = timeDifferenceMs / 1000;

        if (this.isCurrentlyPlaying) {
          // 播放状态：基于Socket推送的进度位置 + 时间差来计算当前实时进度
          // 添加一个小的补偿值来抵消可能的网络延迟
          const delayCompensation = 0.2; // 200ms的补偿，可根据实际情况调整
          const calculatedPosition = this.apiCurrentPlayingSong.position + timeDifference + delayCompensation;

          // 确保进度不会超过歌曲总时长或小于0
          const correctPosition = Math.min(Math.max(calculatedPosition, 0), this.apiCurrentPlayingSong.duration);

          // 更新当前播放进度（不修改原始Socket数据，仅用于显示）
          this.currentDisplayPosition = correctPosition;

          // console.log(`🎵 播放中 - Socket基准位置: ${this.apiCurrentPlayingSong.position}s, 时间差: ${timeDifference}s, 补偿: ${delayCompensation}s, 计算位置: ${correctPosition}s`);
        } else {
          // 暂停状态：直接使用Socket推送的进度位置，不计算时间差
          this.currentDisplayPosition = this.apiCurrentPlayingSong.position;

          // console.log(`🎵 已暂停 - 使用Socket推送位置: ${this.apiCurrentPlayingSong.position}s`);
        }
      } catch (error) {
        console.error('🎵 计算进度时发生错误:', error);
      }
    },

    // 保存当前播放进度到本地存储（仅用作备份，不作为计算基准）
    saveCurrentProgress() {
      if (!this.apiCurrentPlayingSong) {
        return;
      }

      try {
        const localStorageKey = `music_progress_${this.apiCurrentPlayingSong.id}`;
        const progressData = {
          position: this.currentDisplayPosition || this.apiCurrentPlayingSong.position,
          lastUpdatedTime: Date.now(),
          duration: this.apiCurrentPlayingSong.duration,
          socketTimestamp: this.apiCurrentPlayingSong.timestamp
        };

        localStorage.setItem(localStorageKey, JSON.stringify(progressData));
      } catch (error) {
        console.error('🎵 保存进度到本地存储失败:', error);
      }
    },

    // 格式化时间显示（秒转为 mm:ss 格式）
    formatTime(seconds) {
      if (!seconds || seconds < 0) {
        return '0:00';
      }

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // 立即显示暂停提示气泡并设置5秒后自动隐藏
    showPauseTooltipWithDelay() {
      // 清除之前的定时器
      if (this.pauseTooltipTimer) {
        clearTimeout(this.pauseTooltipTimer);
      }

      // 立即显示气泡
      this.showPauseTooltip = true;

      // 2秒后自动隐藏气泡
      this.pauseTooltipTimer = setTimeout(() => {
        this.showPauseTooltip = false;
      }, 2000);
    },

    // 隐藏暂停提示气泡
    hidePauseTooltip() {
      // 直接隐藏气泡
      this.showPauseTooltip = false;
      if (this.pauseTooltipTimer) {
        clearTimeout(this.pauseTooltipTimer);
        this.pauseTooltipTimer = null;
      }
    },

    // 格式化上次播放时间
    formatLastPlayTime() {
      if (!this.lastPlayTime) {
        return '刚刚';
      }

      const now = Date.now();
      const diff = now - this.lastPlayTime;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) {
        return '刚刚';
      } else if (minutes < 60) {
        return `${minutes}分钟前`;
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else if (days < 7) {
        return `${days}天前`;
      } else {
        // 超过7天显示具体日期时间
        const date = new Date(this.lastPlayTime);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${month}-${day} ${hour}:${minute}`;
      }
    },

    // 歌词相关方法
    // 获取当前歌词文本
    getCurrentLyricText() {
      if (!this.currentLyrics || this.currentLyrics.length === 0) {
        return this.lyricsLoading ? '正在加载歌词...' : '暂无歌词';
      }

      const currentLyric = this.currentLyrics[this.currentLyricIndex];
      return currentLyric ? currentLyric.text : '暂无歌词';
    },

    // 根据播放进度更新当前歌词索引
    updateCurrentLyricIndex(currentPosition) {
      if (!this.currentLyrics || this.currentLyrics.length === 0) {
        return;
      }

      // 直接在组件内计算歌词索引，避免额外函数调用的开销
      let newIndex = 0;
      // 标记是否找到完全匹配的歌词
      let foundExactMatch = false;

      // 遍历歌词数组，找到与当前播放位置最匹配的歌词
      for (let i = 0; i < this.currentLyrics.length; i++) {
        // 当前歌词的时间戳
        const lyricTime = this.currentLyrics[i].time;

        // 如果当前位置大于等于歌词时间戳，更新索引
        if (currentPosition >= lyricTime) {
          newIndex = i;
          foundExactMatch = true;
        } else {
          // 一旦找到第一个时间戳大于当前位置的歌词，跳出循环
          break;
        }
      }

      // 优化提前量逻辑，确保歌词与时间轴精确匹配
      // 1. 如果没有找到完全匹配的歌词，检查第一句歌词
      if (!foundExactMatch && this.currentLyrics[0] && currentPosition >= this.currentLyrics[0].time - 0.5) {
        newIndex = 0;
      }

      // 2. 为即将到来的歌词添加更精确的提前量
      if (this.currentLyrics[newIndex + 1]) {
        const nextLyricTime = this.currentLyrics[newIndex + 1].time;
        // 如果下一句歌词在0.6秒内到来，提前切换，给用户更好的体验
        if (currentPosition + 0.6 >= nextLyricTime) {
          newIndex = newIndex + 1;
        }
      }

      // 只有当索引发生变化时才更新，避免不必要的重渲染
      if (newIndex !== this.currentLyricIndex) {
        this.currentLyricIndex = newIndex;
        // 可选：用于调试的日志输出
        // console.log(`🎵 歌词切换到第 ${this.currentLyricIndex + 1} 行: ${this.getCurrentLyricText()} (当前位置: ${currentPosition.toFixed(2)}s, 歌词时间: ${this.currentLyrics[this.currentLyricIndex].time.toFixed(2)}s)`);
      }
    },

    // 重置歌词状态
    resetLyricsState() {
      this.currentLyricIndex = 0;
      this.currentLyrics = [];
      this.lyricsLoading = false;
      this.lyricsError = null;
      this.showLyrics = true;
    },

    // 为指定歌曲加载歌词
    async loadLyricsForSong(song) {
      if (!song || !song.id) {
        this.resetLyricsState();
        return;
      }

      const songId = extractSongId(song);
      if (!songId) {
        console.warn('🎵 无法从歌曲数据中提取歌曲ID:', song);
        this.resetLyricsState();
        return;
      }

      this.lyricsLoading = true;
      this.lyricsError = null;

      try {
        // console.log(`🎵 开始加载歌曲 "${song.detail?.name || songId}" 的歌词`);

        const result = await fetchLyricsWithCache(songId, true);

        if (result.success && result.lyrics && result.lyrics.length > 0) {
          this.currentLyrics = result.lyrics;
          this.currentLyricIndex = 0;
          this.lyricsError = null;

          // 根据当前播放位置更新歌词索引
          if (this.currentDisplayPosition > 0) {
            this.updateCurrentLyricIndex(this.currentDisplayPosition);
          }

          // console.log(`🎵 成功加载歌词，共 ${result.lyrics.length} 行`);
        } else {
          this.currentLyrics = [];
          this.lyricsError = result.error || '暂无歌词';
          // console.log(`🎵 歌曲 "${song.detail?.name || songId}" 暂无歌词`);
        }
      } catch (error) {
        console.error(`🎵 加载歌词失败:`, error);
        this.currentLyrics = [];
        this.lyricsError = '加载歌词失败';
      } finally {
        this.lyricsLoading = false;
      }
    },

    // 解析LRC格式歌词（供组件内部使用）
    parseLRCLyrics(lrcText) {
      return parseLRCLyrics(lrcText);
    }
  }
};
</script>

<style scoped>
/* iOS状态栏整体样式 */
.ios-status-bar {
  width: 100%;
  margin: 4px auto;
  padding: 4px 16px 8px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  /* 添加定位上下文 */
}

/* 状态栏顶部 - 时间和图标 */
.status-bar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
  transition: padding-top 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 10;
  /* 确保状态栏在动态岛上层 */
}

/* 当气泡显示时，为状态栏添加额外的上边距 */
.status-bar-top.has-tooltip {
  padding-top: 28px;
  /* 为气泡预留空间 */
}

/* 确保状态栏图标容器有足够的空间显示 */
.status-bar-icons {
  flex-shrink: 0;
}

/* 状态栏时间显示 */
.status-bar-time {
  font-size: 16px;
  font-weight: 600;
  padding-left: 15px;
  color: #000000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: -0.02em;
}

/* 状态栏图标容器 */
.status-bar-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 状态栏图标样式 */
.status-icon {
  color: #000000;
  opacity: 0.9;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.app-status-icon {
  width: 20px;
  height: 45px;
  margin-left: 12px;
  object-fit: contain;
  border-radius: 3px;
}

/* 网易云音乐图标样式 */
.netease-cloud-icon {
  width: 20px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.netease-cloud-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 3px;
  /* animation: neteasePulse 2s ease-in-out infinite; */
}

@keyframes neteasePulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.status-icon:hover {
  opacity: 1;
}

/* 暂停提示气泡样式 */
.pause-tooltip {
  position: absolute;
  top: -55px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tooltip-content {
  position: relative;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(25px) saturate(1.2);
  -webkit-backdrop-filter: blur(25px) saturate(1.2);
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  margin-top: 25px;
  white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.12);
  min-width: 120px;
  text-align: center;
}

.tooltip-text {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(0, 0, 0, 0.88);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* 气泡提示动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tooltip-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(15px) scale(0.8);
}

.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px) scale(0.9);
}

.tooltip-fade-enter-to,
.tooltip-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

/* 小屏幕手机端 (< 375px) */
@media (max-width: 374px) {
  .pause-tooltip {
    top: -48px;
  }

  .tooltip-content {
    padding: 6px 10px;
    font-size: 11px;
    border-radius: 10px;
    min-width: 100px;
    font-weight: 500;
  }

  .tooltip-arrow {
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(0, 0, 0, 0.88);
  }
}

/* 标准手机端 (375px - 479px) */
@media (min-width: 375px) and (max-width: 479px) {
  .pause-tooltip {
    top: -52px;
  }

  .tooltip-content {
    padding: 8px 12px;
    font-size: 12px;
    border-radius: 12px;
    min-width: 110px;
    font-weight: 500;
  }

  .tooltip-arrow {
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 7px solid rgba(0, 0, 0, 0.88);
  }
}

/* 大屏手机端 (480px - 767px) */
@media (min-width: 480px) and (max-width: 767px) {
  .pause-tooltip {
    top: -58px;
  }

  .tooltip-content {
    padding: 9px 13px;
    font-size: 13px;
    border-radius: 13px;
    min-width: 115px;
    font-weight: 600;
  }

  .tooltip-arrow {
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid rgba(0, 0, 0, 0.88);
  }
}

/* 平板端竖屏 (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .pause-tooltip {
    top: -65px;
  }

  .tooltip-content {
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 16px;
    min-width: 130px;
    font-weight: 600;
    backdrop-filter: blur(30px) saturate(1.3);
    -webkit-backdrop-filter: blur(30px) saturate(1.3);
  }

  .tooltip-arrow {
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 9px solid rgba(0, 0, 0, 0.88);
  }
}

/* 小笔记本电脑 (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .pause-tooltip {
    top: -72px;
  }

  .tooltip-content {
    padding: 14px 18px;
    font-size: 15px;
    border-radius: 18px;
    min-width: 140px;
    font-weight: 600;
    backdrop-filter: blur(35px) saturate(1.4);
    -webkit-backdrop-filter: blur(35px) saturate(1.4);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .tooltip-arrow {
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid rgba(0, 0, 0, 0.88);
  }
}

/* 大屏幕电脑端 (≥ 1440px) */
@media (min-width: 1440px) {
  .pause-tooltip {
    top: -80px;
  }

  .tooltip-content {
    padding: 16px 20px;
    font-size: 16px;
    border-radius: 20px;
    min-width: 150px;
    font-weight: 600;
    backdrop-filter: blur(40px) saturate(1.5);
    -webkit-backdrop-filter: blur(40px) saturate(1.5);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45), 0 6px 16px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .tooltip-arrow {
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 12px solid rgba(0, 0, 0, 0.88);
  }
}

/* 超宽屏电脑端 (≥ 1920px) */
@media (min-width: 1920px) {
  .pause-tooltip {
    top: -88px;
  }

  .tooltip-content {
    padding: 18px 24px;
    font-size: 17px;
    border-radius: 22px;
    min-width: 160px;
    font-weight: 600;
    backdrop-filter: blur(45px) saturate(1.6);
    -webkit-backdrop-filter: blur(45px) saturate(1.6);
    box-shadow: 0 20px 56px rgba(0, 0, 0, 0.5), 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .tooltip-arrow {
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-top: 14px solid rgba(0, 0, 0, 0.88);
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .tooltip-content {
    /* 触摸设备上稍微增大气泡尺寸，便于阅读 */
    padding: 10px 16px;
    min-width: 125px;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2),
(min-resolution: 192dpi) {
  .tooltip-content {
    /* Retina屏幕上增强毛玻璃效果 */
    backdrop-filter: blur(30px) saturate(1.3) brightness(1.1);
    -webkit-backdrop-filter: blur(30px) saturate(1.3) brightness(1.1);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .tooltip-content {
    background: rgba(28, 28, 30, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .tooltip-arrow {
    border-top-color: rgba(28, 28, 30, 0.9);
  }
}

/* 浅色模式适配 */
@media (prefers-color-scheme: light) {
  .tooltip-content {
    background: rgba(0, 0, 0, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }

  .tooltip-arrow {
    border-top-color: rgba(0, 0, 0, 0.85);
  }
}

/* 动画性能优化 */
.pause-tooltip {
  will-change: transform, opacity;
}

.tooltip-content {
  will-change: backdrop-filter, box-shadow;
}

/* 确保气泡在所有设备上都保持在动态岛上方的正确位置 */
.dynamic-island-container {
  position: relative;
  margin: 0 auto;
  left: 0;
  right: 0;
}

/* 小屏幕手机端 (< 375px) - 气泡适配 */
@media (max-width: 374px) {
  .status-bar-top.has-tooltip {
    padding-top: 24px;
    /* 小屏幕上调整间距 */
  }
}

/* 标准手机端 (375px - 479px) - 气泡适配 */
@media (min-width: 375px) and (max-width: 479px) {
  .status-bar-top.has-tooltip {
    padding-top: 26px;
    /* 标准手机上调整间距 */
  }
}

/* 大屏手机端 (480px - 767px) - 气泡适配 */
@media (min-width: 480px) and (max-width: 767px) {
  .status-bar-top.has-tooltip {
    padding-top: 28px;
    /* 大屏手机上调整间距 */
  }
}

/* 动态岛容器样式 */
.dynamic-island-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 8px 0;
  position: relative;
  left: 0;
  right: 0;
  display: flex;
  /* 添加flex布局 */
  justify-content: center;
  /* 水平居中 */
}

.dynamic-island-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 28px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  /* 缩略状态的宽度 */
  width: 180px;
  margin: 0 auto;
  /* 基础背景 - 在没有封面时使用 */
  background: rgba(240, 240, 240, 0.6);
  box-sizing: border-box;
  left: 0;
  right: 0;
}

/* 动态背景层 - 基于当前歌曲封面的高斯模糊效果 */
.dynamic-background {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(25px) saturate(1.5) brightness(1.1);
  -webkit-filter: blur(25px) saturate(1.5) brightness(1.1);
  z-index: -1;
  transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0.25;
  transform: scale(1.1);
}

/* 播放时加强背景效果 */
.is-playing .dynamic-background {
  opacity: 0.4;
  filter: blur(20px) saturate(1.8) brightness(1.2);
  -webkit-filter: blur(20px) saturate(1.8) brightness(1.2);
  animation: backgroundPulse 3s ease-in-out infinite;
}

@keyframes backgroundPulse {

  0%,
  100% {
    transform: scale(1.1);
    opacity: 0.4;
  }

  50% {
    transform: scale(1.15);
    opacity: 0.5;
  }
}

/* 展开状态下的背景效果 */
.dynamic-island-wrapper.expanded .dynamic-background {
  top: -15px;
  left: -15px;
  right: -15px;
  bottom: -15px;
  filter: blur(30px) saturate(1.6) brightness(1.15);
  -webkit-filter: blur(30px) saturate(1.6) brightness(1.15);
  transform: scale(1.2);
}

/* 展开状态 */
.dynamic-island-wrapper.expanded {
  width: 100%;
  max-width: 380px;
  padding: 12px 16px;
  gap: 16px;
  /* 确保展开状态下不会被内容撑开 */
  box-sizing: border-box;
  min-width: 320px;
}

.is-playing .dynamic-island-wrapper {
  box-shadow: 0 8px 32px rgba(131, 85, 255, 0.15);
  /* 增强毛玻璃效果 */
  backdrop-filter: blur(30px) saturate(1.2);
  -webkit-backdrop-filter: blur(30px) saturate(1.2);
}

.song-cover-container {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 100px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  padding: 2px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 2;
}

/* 当前歌曲的封面容器效果（显示当前歌曲状态） */
.cover-playing {
  box-shadow: 0 0 20px rgba(131, 85, 255, 0.3);
}

/* 正在播放时的动画效果 */
.cover-playing.is-playing {
  animation: coverPulse 2s ease-in-out infinite;
}

@keyframes coverPulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(131, 85, 255, 0.3);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(131, 85, 255, 0.5);
  }
}

/* 展开状态下的封面 */
.dynamic-island-wrapper.expanded .song-cover-container {
  width: 52px;
  height: 52px;
}

.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.cover-rotate {
  animation: rotate 10s linear infinite;
}

/* iOS风格的播放可视化效果 */
.playing-visualizer {
  position: absolute;
  bottom: 2px;
  right: 2px;
  display: flex;
  align-items: end;
  gap: 1px;
  height: 12px;
  width: 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 2px;
  padding: 1px;
}

.visualizer-bar {
  flex: 1;
  background: #ffffff;
  border-radius: 0.5px;
  min-height: 2px;
  animation: visualizerPulse 1.2s ease-in-out infinite;
}

@keyframes visualizerPulse {

  0%,
  100% {
    height: 20%;
  }

  25% {
    height: 60%;
  }

  50% {
    height: 100%;
  }

  75% {
    height: 40%;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 封面加载状态相关样式 */
.cover-loader-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

/* 图片加载动画 */
.song-cover {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.song-cover.loaded {
  opacity: 1;
}

/* 加载中状态 */
.cover-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(131, 85, 255, 0.3);
  border-top: 2px solid rgba(131, 85, 255, 1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 图片占位 */
.cover-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(240, 240, 240, 0.9), rgba(220, 220, 220, 0.9));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.placeholder-icon {
  width: 40%;
  height: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(131, 85, 255, 0.7);
}

.song-info {
  flex: 1;
  min-width: 0;
  max-width: 280px;

  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 2;
  /* 确保歌曲信息区域不会因为内容过长而撑开灵动岛 */
  overflow: hidden;
}

.song-name {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: font-size 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  /* 增加文字阴影提高可读性 */
  /* text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); */
  /* 增加最大宽度以显示更多歌曲信息 */
  max-width: 90px;
}

.song-artist {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.7);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: font-size 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  /* 增加最大宽度以显示更多艺术家信息 */
  max-width: 80px;
}

/* 展开状态下的文字样式 - 严格一行显示，超出10字符截断，加粗显示 */
.dynamic-island-wrapper.expanded .song-name {
  font-size: 18px;
  /* 严格一行显示 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  /* 加粗显示 */
  font-weight: 700;
  /* 限制最大宽度为10字符宽度 */
  max-width: 220px;
}

.dynamic-island-wrapper.expanded .song-artist {
  font-size: 12px;
  /* 严格一行显示 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  /* 加粗显示 */
  font-weight: 600;
  /* 限制最大宽度为10字符宽度 */
  max-width: 180px;
}

.dynamic-island-wrapper.expanded .song-info {
  /* 限制展开状态下歌曲信息区域的最大宽度 */
  margin-top: 23px;
  max-width: 240px;
}

/* 按钮区域容器样式 */
.player-buttons-container {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 2;
}

/* 播放列表按钮样式 - 收纳状态下尺寸变小 */
.playlist-button {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  /* background: rgba(255, 255, 255, 0.3); */
  /* backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); */
  /* border: 1px solid rgba(255, 255, 255, 0.2); */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: rgba(0, 0, 0, 0.7);
  position: relative;
}

/* 播放列表图标样式 - 收纳状态下图标变小 */
.playlist-button img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  vertical-align: middle;
}

/* 一起听按钮样式 - 无背景和动效 */
.listen-together-button {
  flex-shrink: 0;
  width: 36px;
  margin-bottom: 10px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.7);
  position: relative;
}

/* 一起听图标样式 */
.listen-together-button img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  margin-top: 8px;
  vertical-align: middle;
}

.playlist-button:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
  color: rgba(0, 0, 0, 0.9);
}

.playlist-button:active {
  transform: scale(0.95);
}

/* 播放时的按钮效果 */
.button-playing {
  /* animation: buttonGlow 2s ease-in-out infinite; */
}

@keyframes buttonGlow {

  0%,
  100% {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 rgba(131, 85, 255, 0.3);
  }

  50% {
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 15px rgba(131, 85, 255, 0.4);
  }
}

/* 展开状态下的按钮区域容器 */
.dynamic-island-wrapper.expanded .player-buttons-container {
  gap: 8px;
}

/* 展开状态下的按钮 */
.dynamic-island-wrapper.expanded .playlist-button {
  width: 40px;
  height: 40px;
}

/* 展开状态下的一起听按钮 - 只调整大小，不添加背景和动效 */
.dynamic-island-wrapper.expanded .listen-together-button {
  width: 40px;
  height: 40px;
}

/* 展开状态下的图标 */
.dynamic-island-wrapper.expanded .playlist-button img,
.dynamic-island-wrapper.expanded .listen-together-button img {
  width: 20px;
  height: 20px;
}

.island-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(131, 85, 255, 0.08), transparent 70%);
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1;
}

/* 播放时的装饰效果 */
.decoration-playing {
  background: radial-gradient(circle at 50% 50%, rgba(131, 85, 255, 0.15), transparent 70%);
  animation: decorationGlow 2.5s ease-in-out infinite;
}

@keyframes decorationGlow {

  0%,
  100% {
    background: radial-gradient(circle at 50% 50%, rgba(131, 85, 255, 0.15), transparent 70%);
  }

  50% {
    background: radial-gradient(circle at 50% 50%, rgba(131, 85, 255, 0.25), transparent 70%);
  }
}

/* 手机端适配 - 确保在各种屏幕尺寸上都有良好表现 */
@media (max-width: 480px) {

  /* 限制动态岛容器的最大宽度为屏幕宽度的90% */
  .dynamic-island-container {
    width: 90%;
    max-width: none;
    margin: 0 auto;
    padding: 5px 0;
    display: flex;
    justify-content: center;
  }

  /* 确保展开状态下不会超出屏幕 */
  .dynamic-island-wrapper {
    padding: 6px 10px;
    gap: 8px;
    border-radius: 26px;
  }

  .dynamic-island-wrapper.expanded {
    width: 100%;
    max-width: none;
    padding: 8px;
    gap: 8px;
    margin: 0 auto;
    border-radius: 30px;
  }

  /* 移动端展开状态下的文字 - 支持换行显示 */
  .dynamic-island-wrapper.expanded .song-name {
    font-size: 18px;
    /* 允许换行显示完整歌名 */
    white-space: normal;
    overflow: hidden;
    text-overflow: initial;
    line-height: 1.3;
    max-height: 2.6em;
    /* 最多显示2行 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-weight: 600;
  }

  .dynamic-island-wrapper.expanded .song-artist {
    font-size: 12px;
    /* 允许换行显示完整歌手信息 */
    white-space: normal;
    overflow: hidden;
    text-overflow: initial;
    line-height: 1.2;
    max-height: 2.4em;
    /* 最多显示2行 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-weight: 500;
  }

  /* 增大展开状态下的封面大小 */
  .dynamic-island-wrapper.expanded .song-cover-container {
    width: 55px;
    height: 55px;
  }

  /* 减小展开状态下的按钮大小 */
  .dynamic-island-wrapper.expanded .playlist-button {
    width: 35px;
    height: 35px;
  }

  /* 减小展开状态下的图标大小 */
  .dynamic-island-wrapper.expanded .playlist-button img {
    width: 20px;
    height: 20px;
  }

  /* 增大收纳状态下的封面大小 */
  .song-cover-container {
    width: 40px;
    height: 40px;
  }

  /* 减小收纳状态下的按钮大小 */
  .playlist-button {
    width: 26px;
    height: 26px;
  }

  /* 减小收纳状态下的图标大小 */
  .playlist-button img {
    width: 16px;
    height: 16px;
  }

  /* 增加内边距防止内容贴近边缘 */
  .ios-status-bar {
    padding: 4px 12px 8px;
  }
}

/* 小屏幕手机额外适配 */
@media (max-width: 360px) {

  /* 进一步限制宽度 */
  .dynamic-island-container {
    width: 95%;
    margin: 0 auto;
    display: flex;
    justify-content: center;
  }

  /* 小屏幕展开状态下的文字 - 支持换行显示 */
  .dynamic-island-wrapper.expanded .song-name {
    font-size: 13px;
    /* 允许换行显示完整歌名 */
    white-space: normal;
    overflow: hidden;
    text-overflow: initial;
    line-height: 1.3;
    max-height: 2.6em;
    /* 最多显示2行 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-weight: 600;
  }

  .dynamic-island-wrapper.expanded .song-artist {
    font-size: 11px;
    /* 允许换行显示完整歌手信息 */
    white-space: normal;
    overflow: hidden;
    text-overflow: initial;
    line-height: 1.2;
    max-height: 2.4em;
    /* 最多显示2行 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-weight: 500;
  }

  /* 增大缩略状态下的文字大小 */
  .song-name {
    font-size: 13px;
    font-weight: 600;
  }

  .song-artist {
    font-size: 11px;
    font-weight: 500;
  }

  /* 减小状态栏图标间距 */
  .status-bar-icons {
    gap: 4px;
  }

  /* 进一步减小应用图标间距，确保信号图标不被遮挡 */
  .app-status-icon {
    margin-left: 8px;
  }

  /* 确保状态栏图标不被动态岛遮挡 */
  .status-bar-top {
    z-index: 4000;
  }

  /* 减小状态栏文字大小 */
  .status-bar-time {
    font-size: 15px;
  }

  /* 减小电池图标大小 */
  .ios-battery-body {
    width: 35px;
    height: 14px;
  }

  /* 减小电池百分比文字大小 */
  .ios-battery-percentage {
    font-size: 11px;
  }
}

/* 适配电脑端的响应式设计 */
@media (min-width: 768px) {

  /* 中等屏幕优化 */
  .dynamic-island-container {
    max-width: 600px;
  }

  .dynamic-island-wrapper {
    width: 200px;
  }

  .dynamic-island-wrapper.expanded {
    max-width: 500px;
  }

  /* 中等屏幕展开状态下的封面更大 */
  .dynamic-island-wrapper.expanded .song-cover-container {
    width: 60px;
    height: 60px;
  }

  /* 中等屏幕展开状态下的文字 - 支持换行显示 */
  .dynamic-island-wrapper.expanded .song-name {
    font-size: 18px;
    /* 允许换行显示完整歌名 */
    white-space: normal;
    overflow: hidden;
    text-overflow: initial;
    line-height: 1.3;
    max-height: 2.6em;
    /* 最多显示2行 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .dynamic-island-wrapper.expanded .song-artist {
    font-size: 14px;
    /* 允许换行显示完整歌手信息 */
    white-space: normal;
    overflow: hidden;
    text-overflow: initial;
    line-height: 1.2;
    max-height: 2.4em;
    /* 最多显示2行 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* 中等屏幕歌词样式优化 */
  .ios-lyrics-container {
    margin: 10px 0;
    padding: 0 6px;
    min-height: 28px;
  }

  .ios-lyric-text {
    font-size: 14px;
    padding: 5px 10px;
    border-radius: 10px;
    letter-spacing: 0.4px;
    max-width: 280px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

/* 大屏幕电脑端优化 */
@media (min-width: 1024px) {
  .dynamic-island-container {
    max-width: 800px;
  }

  .dynamic-island-wrapper {
    width: 220px;
    padding: 10px 14px;
    gap: 14px;
  }

  .dynamic-island-wrapper.expanded {
    max-width: 600px;
    padding: 14px 20px;
    gap: 18px;
  }

  /* 大屏幕展开状态下的封面更大 */
  .dynamic-island-wrapper.expanded .song-cover-container {
    width: 68px;
    height: 68px;
  }

  /* 大屏幕展开状态下的文字更大 */
  .dynamic-island-wrapper.expanded .song-name {
    font-size: 20px;
  }

  .dynamic-island-wrapper.expanded .song-artist {
    font-size: 15px;
  }

  /* 大屏幕展开状态下的按钮更大 */
  .dynamic-island-wrapper.expanded .playlist-button {
    width: 44px;
    height: 44px;
  }

  /* 大屏幕展开状态下的图标更大 */
  .dynamic-island-wrapper.expanded .playlist-button img {
    width: 22px;
    height: 22px;
  }

  /* 大屏幕歌词样式优化 */
  .ios-lyrics-container {
    margin: 12px 0;
    padding: 0 8px;
    min-height: 32px;
  }

  .ios-lyric-text {
    font-size: 15px;
    padding: 6px 12px;
    border-radius: 12px;
    letter-spacing: 0.5px;
    max-width: 320px;
    width: fit-content;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

/* 超大屏幕电脑端优化 */
@media (min-width: 1440px) {
  .dynamic-island-container {
    max-width: 500px;
  }

  .dynamic-island-wrapper.expanded {
    max-width: 700px;
  }

  /* 超大屏幕电脑端展开状态下的封面更大 */
  .dynamic-island-wrapper.expanded .song-cover-container {
    width: 76px;
    height: 76px;
  }

  /* 超大屏幕电脑端展开状态下的文字更大 */
  .dynamic-island-wrapper.expanded .song-name {
    font-size: 22px;
  }

  .dynamic-island-wrapper.expanded .song-artist {
    font-size: 16px;
  }

  /* 提升整体质感 */
  .dynamic-island-container {
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);

  }

  /* 优化阴影和过渡效果 */
  .dynamic-island-wrapper {
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

/* iOS风格进度条样式 */
.ios-progress-container {
  width: 100%;
  max-width: 280px;
  margin: 12px auto 0;
  padding: 0 2px;
}

.ios-progress-track {
  position: relative;
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.ios-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #4976d5, rgba(45, 44, 44, 0.9));
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
}

/* 正在播放时的进度条效果 */
.is-playing .ios-progress-fill {
  background: linear-gradient(90deg, #8355ff, #a855f7, #ffffff);
  box-shadow: 0 0 10px rgba(131, 85, 255, 0.4);
  animation: progressGlow 2.5s ease-in-out infinite;
}

@keyframes progressGlow {

  0%,
  100% {
    box-shadow: 0 0 10px rgba(131, 85, 255, 0.4);
  }

  50% {
    box-shadow: 0 0 14px rgba(131, 85, 255, 0.6);
  }
}

/* iOS风格歌词显示区域 */
.ios-lyrics-container {
  width: 100%;
  margin: 8px 0;
  padding: 0 4px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* 确保歌词容器不会撑开灵动岛 */
  max-width: 100%;
  overflow: hidden;
}

.ios-lyric-text {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 电脑端默认状态下的歌词样式 */
@media (min-width: 768px) {
  .ios-lyric-text {
    max-width: 300px;
  }
}

@media (min-width: 1024px) {
  .ios-lyric-text {
    max-width: 350px;
  }
}

@media (min-width: 1440px) {
  .ios-lyric-text {
    max-width: 400px;
  }
}

/* 电脑端展开状态下的歌词样式 - 响应式显示 */
@media (min-width: 768px) {
  .dynamic-island-wrapper.expanded .ios-lyric-text {
    max-width: none;
    width: auto;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    box-sizing: border-box;
    padding: 4px 12px;
    word-wrap: break-word;
  }

  .dynamic-island-wrapper.expanded .ios-lyrics-container {
    padding: 0 12px;
    box-sizing: border-box;
  }
}

/* 大屏幕电脑端展开状态下的歌词样式 */
@media (min-width: 1024px) {
  .dynamic-island-wrapper.expanded .ios-lyric-text {
    max-width: none;
    width: auto;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    font-size: 14px;
    padding: 5px 16px;
    word-wrap: break-word;
  }

  .dynamic-island-wrapper.expanded .ios-lyrics-container {
    padding: 0 16px;
    margin: 10px 0;
  }
}

/* 超大屏幕电脑端展开状态下的歌词样式 */
@media (min-width: 1440px) {
  .dynamic-island-wrapper.expanded .ios-lyric-text {
    max-width: none;
    width: auto;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    font-size: 15px;
    padding: 6px 20px;
    word-wrap: break-word;
  }

  .dynamic-island-wrapper.expanded .ios-lyrics-container {
    padding: 0 20px;
    margin: 12px 0;
  }
}

/* 正在播放时的歌词效果 */
.lyric-playing {
  color: #ffffff;
  /* font-weight: 600; */
  /* background: rgba(131, 85, 255, 0.2); */
  /* border: 1px solid rgba(131, 85, 255, 0.3);
  box-shadow: 0 0 12px rgba(131, 85, 255, 0.25), 0 2px 8px rgba(0, 0, 0, 0.2); */
  /* animation: lyricGlow 2s ease-in-out infinite; */
}

@keyframes lyricGlow {

  0%,
  100% {
    background: rgba(131, 85, 255, 0.2);
    box-shadow: 0 0 12px rgba(131, 85, 255, 0.25), 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  50% {
    background: rgba(131, 85, 255, 0.3);
    box-shadow: 0 0 16px rgba(131, 85, 255, 0.35), 0 2px 12px rgba(0, 0, 0, 0.25);
  }
}

/* 歌词切换动画 */
.lyric-fade-enter-active,
.lyric-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.lyric-fade-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
  filter: blur(2px);
}

.lyric-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
  filter: blur(2px);
}

.lyric-fade-enter-to,
.lyric-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* 时间显示样式 - 基于播放器背景动态取色优化 */
.ios-time-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 2px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0.2px;
}

.current-time,
.total-time {
  /* 半透明黑色背景确保在任何背景下都有良好对比度 */
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  /* 文字阴影进一步提高可读性 */
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  font-weight: 600;
}

/* 正在播放时的时间显示效果 - 增强对比度和清晰度 */
.is-playing .current-time {
  /* 增强黑色背景透明度提高对比度 */
  background: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  /* 增加文字加粗和阴影效果 */
  font-weight: 700;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
  /* 添加微妙的光晕效果提升视觉突出度 */
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
}

@keyframes timeGlow {

  0%,
  100% {
    background: rgba(131, 85, 255, 0.15);
    box-shadow: 0 0 8px rgba(131, 85, 255, 0.2);
  }

  50% {
    background: rgba(131, 85, 255, 0.25);
    box-shadow: 0 0 12px rgba(131, 85, 255, 0.3);
  }
}

/* 移动端进度条优化 */
@media (max-width: 768px) {
  .ios-progress-track {
    height: 3px;
  }

  .ios-time-display {
    font-size: 10px;
    margin-top: 10px;
  }

  /* 移动端歌词样式优化 */
  .ios-lyrics-container {
    margin: 6px 0;
    padding: 0 2px;
    min-height: 20px;
  }

  .ios-lyric-text {
    font-size: 12px;
    padding: 3px 6px;
    border-radius: 6px;
    letter-spacing: 0.2px;
    max-width: 220px;
    width: fit-content;
    margin: 0 auto;
  }
}

/* 小屏幕手机进度条优化 */
@media (max-width: 480px) {
  .ios-progress-container {
    margin-top: 10px;
    padding: 0 1px;
    margin: 4 auto;
  }

  .ios-progress-track {
    height: 2.5px;
  }

  .ios-time-display {
    font-size: 9px;
    margin-top: 8px;
  }

  .current-time,
  .total-time {
    padding: 1px 4px;
    border-radius: 6px;
  }

  /* 小屏幕手机歌词样式优化 */
  .ios-lyrics-container {
    margin: 5px 0;
    padding: 0 1px;
    min-height: 18px;
  }

  .ios-lyric-text {
    font-size: 11px;
    padding: 2px 5px;
    border-radius: 5px;
    letter-spacing: 0.1px;
    max-width: 200px;
    width: fit-content;
    margin: 0 auto;
  }
}

/* iOS风格电池样式 */
.ios-battery {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ios-battery-top {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: -4px;
  width: 4px;
  height: 8px;
  border-radius: 0 2px 2px 0;
  background-color: #000000;
}

.ios-battery-body {
  width: 40px;
  height: 16px;
  border: 2px solid #000000;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 2px;
  background-color: transparent;
}

.ios-battery-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.5s ease, background-color 0.3s ease;
}

.ios-battery-percentage {
  font-size: 12px;
  font-weight: 500;
  color: #000000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: color 0.3s ease;
}

.ios-charging-icon {
  font-size: 10px;
  margin-left: 2px;
  animation: pulse 1.5s infinite;
}

/* 电池电量级别样式 */
.battery-level-high .ios-battery-fill {
  background-color: #34c759;
}

.battery-level-high .ios-battery-percentage {
  color: #34c759;
}

.battery-level-medium .ios-battery-fill {
  background-color: #ffcc00;
}

.battery-level-medium .ios-battery-percentage {
  color: #ffcc00;
}

.battery-level-low .ios-battery-fill {
  background-color: #ff3b30;
}

.battery-level-low .ios-battery-percentage {
  color: #ff3b30;
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

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}
</style>