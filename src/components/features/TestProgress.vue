<template>
  <div class="test-progress-container">
    <h2>实时进度测试</h2>
    <div class="song-info">
      <p>歌曲: {{ currentSong.detail.name }}</p>
      <p>艺术家: {{ currentSong.detail.artistNames.join(' / ') }}</p>
      <p>专辑: {{ currentSong.detail.albumName }}</p>
    </div>
    <div class="progress-info">
      <p>当前进度: {{ formatTime(currentPosition) }}</p>
      <p>总时长: {{ formatTime(currentSong.duration) }}</p>
      <p>播放状态: {{ isPlaying ? '播放中' : '已暂停' }}</p>
      <p>进度百分比: {{ progressPercentage.toFixed(2) }}%</p>
    </div>
    <div class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestProgress',
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
  computed: {
    progressPercentage() {
      if (!this.currentSong.duration || this.currentSong.duration <= 0) {
        return 0;
      }
      const percentage = (this.currentPosition / this.currentSong.duration) * 100;
      return Math.min(Math.max(percentage, 0), 100);
    }
  },
  methods: {
    formatTime(seconds) {
      if (!seconds || seconds < 0) {
        return '0:00';
      }

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.test-progress-container {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 20px;
}

.song-info p,
.progress-info p {
  margin: 5px 0;
}

.progress-bar {
  margin-top: 20px;
}

.progress-track {
  width: 100%;
  height: 10px;
  background: #ddd;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #8355ff;
  transition: width 0.2s ease;
}
</style>