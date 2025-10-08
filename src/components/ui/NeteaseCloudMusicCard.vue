<template>
  <div class="netease-cloud-card-wrapper">
    <!-- 骨架屏幕 - 数据加载完成前显示 -->
    <mdui-card class="netease-cloud-card" v-if="isLoading">
      <div style="padding: 16px;">
        <div style="display: flex; align-items: center">
          <s-skeleton style="width: 64px; height: 64px; border-radius: 50%"></s-skeleton>
          <div style="flex-grow: 1; margin-left: 12px">
            <div style="display: flex; align-items: center;">
              <s-skeleton style="width: 120px;"></s-skeleton>
              <s-skeleton style="width: 60px; margin-left: 8px;"></s-skeleton>
            </div>
            <s-skeleton style="margin-top: 8px;"></s-skeleton>
            <s-skeleton style="margin-top: 8px; width: 70%"></s-skeleton>
          </div>
        </div>

        <!-- 音乐人标签骨架 -->
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <s-skeleton style="width: 80px; height: 24px;"></s-skeleton>
            <s-skeleton style="width: 90px; height: 24px;"></s-skeleton>
            <s-skeleton style="width: 85px; height: 24px;"></s-skeleton>
          </div>
        </div>

        <!-- 统计信息骨架 -->
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            <div style="text-align: center;">
              <s-skeleton style="width: 60px; margin: 0 auto;"></s-skeleton>
              <s-skeleton style="width: 40px; margin: 4px auto 0;"></s-skeleton>
            </div>
            <div style="text-align: center;">
              <s-skeleton style="width: 60px; margin: 0 auto;"></s-skeleton>
              <s-skeleton style="width: 40px; margin: 4px auto 0;"></s-skeleton>
            </div>
            <div style="text-align: center;">
              <s-skeleton style="width: 60px; margin: 0 auto;"></s-skeleton>
              <s-skeleton style="width: 40px; margin: 4px auto 0;"></s-skeleton>
            </div>
            <div style="text-align: center;">
              <s-skeleton style="width: 60px; margin: 0 auto;"></s-skeleton>
              <s-skeleton style="width: 40px; margin: 4px auto 0;"></s-skeleton>
            </div>
          </div>
        </div>
      </div>
    </mdui-card>

    <!-- 真实内容 - 数据加载完成后显示 -->
    <mdui-card class="netease-cloud-card" v-else-if="neteaseInfo" :class="{ 'card-loaded': isLoaded }">
      <!-- 头像和基本信息区域 -->
      <div class="avatar-section">
        <img :src="neteaseInfo.avatarUrl" alt="网易云头像" class="user-avatar" v-if="neteaseInfo.avatarUrl"
          @error="handleAvatarError">
        <div class="basic-info">
          <div class="name-section">
            <h4 class="user-name">{{ neteaseInfo.nickname }}
              <span class="vip-badge" v-if="neteaseInfo.vipType && neteaseInfo.vipType > 0">
                {{ getVipBadge(neteaseInfo.vipType) }}
              </span>
            </h4>
            <span class="level-badge">Lv.{{ neteaseInfo.level || 0 }}</span>
          </div>
          <p class="user-account">
            网易云ID: {{ neteaseInfo.userId }}
          </p>
          <p class="artist-name" v-if="neteaseInfo.artistName">
            艺名: {{ neteaseInfo.artistName }}
          </p>
        </div>
      </div>

      <!-- 音乐人身份标签区域 -->
      <div class="musician-tags-section" v-if="neteaseInfo.musicianTags && neteaseInfo.musicianTags.length > 0">
        <div class="tags-title"></div>
        <div class="tags-container">
          <span class="musician-tag" v-for="tag in neteaseInfo.musicianTags" :key="tag">
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 统计信息区域 -->
      <div class="statistics-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.listenSongs }}</div>
            <div class="stat-label">累计听歌</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.followers }}</div>
            <div class="stat-label">粉丝</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.follows }}</div>
            <div class="stat-label">关注</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.playlistCount }}</div>
            <div class="stat-label">歌单</div>
          </div>
        </div>
      </div>

      <!-- 账号信息区域 -->
      <div class="account-info" v-if="neteaseInfo.createDate">
        <p><mdui-icon name="schedule" size="14"></mdui-icon> 注册时间: {{ neteaseInfo.createDate }}</p>
      </div>
    </mdui-card>
  </div>

  <!-- 加载状态 -->

</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

// 数据状态
const neteaseInfo = ref(null);
const isLoading = ref(false);
const error = ref('');
const isLoaded = ref(false);
const animatedValues = ref({
  listenSongs: '0',
  followers: '0',
  follows: '0',
  playlistCount: '0'
});

// 用户ID配置
const neteaseUserId = '557642378';

// 格式化数字显示（添加千位分隔符）
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 获取VIP徽章
const getVipBadge = (vipType) => {
  switch (vipType) {
    case 1:
      return '🎧 音乐包';
    case 2:
      return '💎 豪华VIP';
    case 4:
      return '👑 黑胶VIP';
    case 11:
      return '🎤 网易音乐人';
    default:
      return '🎵 VIP';
  }
};

// 处理头像加载失败
const handleAvatarError = (event) => {
  console.warn('网易云头像加载失败，使用默认头像');
  event.target.src = 'https://picsum.photos/200/200';
};

// 数字动画函数
const animateNumber = (key, targetValue, duration = 2000) => {
  const startValue = 0;
  const startTime = performance.now();

  const updateNumber = (currentTime) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    // 使用缓动函数使动画更自然
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);

    animatedValues.value[key] = formatNumber(currentValue);

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  };

  requestAnimationFrame(updateNumber);
};

// 启动所有数字动画
const startAllAnimations = () => {
  if (neteaseInfo.value) {
    // 错开启动每个动画，使效果更自然
    setTimeout(() => animateNumber('listenSongs', neteaseInfo.value.listenSongs || 0), 100);
    setTimeout(() => animateNumber('followers', neteaseInfo.value.followers || 0), 300);
    setTimeout(() => animateNumber('follows', neteaseInfo.value.follows || 0), 500);
    setTimeout(() => animateNumber('playlistCount', neteaseInfo.value.playlistCount || 0), 700);
  }
};

// 获取网易云音乐信息 - 使用vite.config.js中配置的接口
const fetchNeteaseInfo = async () => {
  try {
    // 使用环境变量来区分开发和生产环境
    let apiUrl = '';

    // 检查是否在开发环境
    console.log('是否在开发环境:', import.meta.env.DEV);

    if (import.meta.env.DEV) {
      // 开发环境使用代理路径
      apiUrl = `/user/detail?uid=${neteaseUserId}`;
    } else {
      // 生产环境可以直接使用目标API地址或其他配置
      apiUrl = `https://zmusic.i9mr.com/user/detail?uid=${neteaseUserId}`;
    }

    // console.log('发起网易云请求的URL:', apiUrl);
    // console.log('当前页面URL:', window.location.href);

    const response = await fetch(apiUrl);
    // console.log('网易云响应状态码:', response.status);
    // console.log('网易云响应URL:', response.url);

    const data = await response.json();

    // 根据API实际返回格式处理数据
    if (data && data.code === 200 && data.profile) {
      // 获取用户详细信息
      const userProfile = data.profile;

      // 从API返回数据中提取更多信息
      const listenSongs = data.listenSongs || 0; // 累计听歌数
      const followers = userProfile.followeds || 0; // 粉丝数
      const follows = userProfile.follows || 0; // 关注数
      const playlistCount = userProfile.playlistCount || 0; // 歌单数量
      const createTime = data.createTime || 0; // 创建时间
      const artistName = userProfile.artistName || ''; // 音乐人艺名

      // 获取音乐人身份标签
      let musicianTags = [];
      if (userProfile.mainAuthType && userProfile.mainAuthType.tags) {
        musicianTags = userProfile.mainAuthType.tags;
      }

      // 格式化创建时间
      let createDate = '';
      if (createTime) {
        const date = new Date(createTime);
        createDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      // 处理头像URL
      let avatarUrl = userProfile.avatarUrl || '';
      // 如果头像URL为空或不完整，使用占位图
      if (!avatarUrl || !avatarUrl.match(/^https?:\/\//)) {
        avatarUrl = 'https://picsum.photos/200/200';
      }

      // 构建用户资料
      neteaseInfo.value = {
        nickname: userProfile.nickname || '未知用户',
        userId: userProfile.userId || neteaseUserId,
        avatarUrl: avatarUrl,
        level: data.level || 0,
        listenSongs: listenSongs,
        followers: followers,
        follows: follows,
        playlistCount: playlistCount,
        createDate: createDate,
        artistName: artistName,
        musicianTags: musicianTags,
        signature: userProfile.signature || userProfile.description || '',
        vipType: userProfile.vipType || 0
      };
    } else {
      console.warn('网易云信息API返回格式不符合预期:', data);
    }
  } catch (err) {
    console.error('获取网易云音乐信息失败:', err);
    error.value = '获取网易云音乐信息失败';
    // 出错时使用备用数据
    neteaseInfo.value = {
      nickname: '网易云用户',
      userId: neteaseUserId,
      avatarUrl: 'https://picsum.photos/200/200',
      level: 10,
      listenSongs: 10000,
      followers: 100,
      follows: 50,
      playlistCount: 10,
      createDate: '2018-01-01',
      artistName: '',
      musicianTags: [],
      signature: '音乐让生活更美好',
      vipType: 4
    };
  }
};

// 监听数据变化，启动动画
watch(neteaseInfo, (newValue) => {
  if (newValue) {
    // 延迟启动动画，确保DOM已更新
    setTimeout(() => {
      isLoaded.value = true;
      startAllAnimations();
    }, 100);
  }
});

// 组件挂载时获取数据
onMounted(async () => {
  isLoading.value = true;
  error.value = '';

  try {
    // 获取网易云信息
    await fetchNeteaseInfo();
  } catch (err) {
    error.value = '获取网易云音乐信息失败，请稍后重试';
    console.error('获取网易云音乐信息失败:', err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.netease-cloud-card-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto;
}

.netease-cloud-card {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  width: 100%;
  max-width: 400px; // 适配手机宽度
  border-radius: 12px; // 圆角设计
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1); // 轻微阴影
  background: #ffffff;
  border: 1px solid #e0e0e0;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease-out;
  cursor: pointer;
}

/* 淡入动画 */
.netease-cloud-card.card-loaded {
  opacity: 1;
  transform: translateY(0);
}

/* 悬停效果 */
.netease-cloud-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.user-avatar {
  width: 64px; // 适中的头像大小
  height: 64px;
  border-radius: 50%;
  border: 2px solid #f0f0f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* 头像悬停效果 */
.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  border-color: #ffd700;
}

.basic-info {
  flex: 1;
  min-width: 0;
}

.name-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #333;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.user-name:hover {
  color: #ff6f00;
}

.level-badge {
  padding: 2px 8px;
  background: #fff3e0;
  color: #f57c00;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.level-badge:hover {
  background: #f57c00;
  color: white;
  transform: scale(1.05);
}

.user-account {
  margin: 0;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.artist-name {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.artist-name:hover {
  color: #f57c00;
}

/* VIP徽章样式 */
.vip-badge {
  margin-left: 6px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #8b4513;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: inline-block;
  vertical-align: middle;
  animation: shine 2s infinite;
}

@keyframes shine {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
  }
}

/* 音乐人身份标签区域 */
.musician-tags-section {
  margin: 0 16px 16px 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.tags-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.musician-tag {
  padding: 4px 10px;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 12px;
  border-radius: 12px;
  border: 1px solid #c8e6c9;
  transition: all 0.3s ease;
}

.musician-tag:hover {
  background: #c8e6c9;
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(46, 125, 50, 0.1);
}

/* 统计信息区域 */
.statistics-section {
  margin: 0 16px 16px 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  text-align: center;
}

.stat-item {
  padding: 8px 4px;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.stat-item:hover {
  background: #fff3e0;
  transform: scale(1.05);
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 2px;
  transition: color 0.3s ease;
}

.stat-item:hover .stat-value {
  color: #f57c00;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 账号信息区域 */
.account-info {
  margin: 0 16px 16px 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.account-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease;
}

.account-info:hover p {
  color: #f57c00;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;

  .loading-spinner {
    margin-bottom: 12px;
    width: 24px;
    height: 24px;
    color: #f57c00;
  }

  p {
    color: #666;
    font-size: 14px;
  }
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;

  .error-icon {
    margin-bottom: 12px;
    font-size: 32px;
    color: #f44336;
  }

  p {
    color: #f44336;
    font-size: 14px;
    max-width: 280px;
  }
}

/* 骨架屏样式 */
s-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .netease-cloud-card {
    max-width: 100%;
    margin-bottom: 16px;
  }

  .netease-cloud-card:hover {
    transform: translateY(-3px);
  }

  .avatar-section {
    padding: 12px;
    gap: 10px;
  }

  .user-avatar {
    width: 56px;
    height: 56px;
  }

  .user-name {
    font-size: 15px;
  }

  .vip-badge {
    font-size: 9px;
    padding: 1px 4px;
    margin-left: 4px;
  }

  .level-badge {
    padding: 1px 6px;
    font-size: 11px;
  }

  .artist-name {
    font-size: 11px;
  }

  .musician-tags-section,
  .statistics-section,
  .account-info {
    margin: 0 12px 12px 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>