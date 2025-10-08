<template>
  <div class="test-audio-duration">
    <h2>音频时长测试组件</h2>
    <div class="test-controls">
      <input v-model="songId" placeholder="输入歌曲ID" />
      <button @click="testAudioDuration">测试音频时长</button>
    </div>
    <div class="test-results" v-if="result">
      <h3>测试结果:</h3>
      <p>歌曲ID: {{ result.songId }}</p>
      <p>使用的URL: {{ result.url }}</p>
      <p>是否为官方URL: {{ result.isOfficial ? '是' : '否' }}</p>
      <div v-if="result.duration !== null">
        <p>音频时长: {{ result.duration }} 秒</p>
        <p>是否为试听版本 (≤30秒): {{ result.duration <= 30 ? '是' : '否' }}</p>
        <p v-if="result.backupUrl">备用API URL: {{ result.backupUrl }}</p>
      </div>
      <p v-if="result.error" class="error">错误: {{ result.error }}</p>
    </div>
  </div>
</template>

<script>
import { getOfficialMusicUrl, getBackupMusicUrl } from '../../utils/listenTogetherApi.js';

export default {
  name: 'TestAudioDuration',
  data() {
    return {
      songId: '',
      result: null
    };
  },
  methods: {
    async testAudioDuration() {
      if (!this.songId) {
        alert('请输入歌曲ID');
        return;
      }

      this.result = {
        songId: this.songId,
        url: null,
        isOfficial: true,
        duration: null,
        backupUrl: null,
        error: null
      };

      try {
        // 优先使用网易云官方URL
        const url = getOfficialMusicUrl(this.songId);
        this.result.url = url;
        
        // 创建音频元素检查时长
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = url;
        
        // 等待元数据加载
        await new Promise((resolve, reject) => {
          audio.addEventListener('loadedmetadata', async () => {
            this.result.duration = audio.duration;
            audio.remove();
            
            // 如果是试听版本，获取备用API URL
            if (this.result.duration <= 30) {
              this.result.isOfficial = false;
              try {
                const backupUrl = await getBackupMusicUrl(this.songId);
                this.result.backupUrl = backupUrl;
              } catch (error) {
                console.error('获取备用API URL时出错:', error);
              }
            }
            
            resolve();
          });
          
          audio.addEventListener('error', (e) => {
            this.result.error = '无法加载音频元数据';
            audio.remove();
            resolve();
          });
          
          // 5秒超时
          setTimeout(() => {
            this.result.error = '检查音频元数据超时';
            audio.remove();
            resolve();
          }, 5000);
        });
      } catch (error) {
        console.error('测试音频时长时出错:', error);
        this.result.error = error.message || '未知错误';
      }
    }
  }
};
</script>

<style scoped>
.test-audio-duration {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 20px;
}

.test-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.test-controls input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.test-controls button {
  padding: 8px 16px;
  background: #8355ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-controls button:hover {
  background: #6a3fdf;
}

.test-results {
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error {
  color: #ff3b30;
}
</style>