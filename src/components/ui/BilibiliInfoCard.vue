<template>
  <div class="bilibili-card-wrapper">
    <!-- 骨架屏幕 - 数据加载完成前显示 -->
    <mdui-card class="bilibili-card" v-if="!bilibiliInfo">
      <div style="padding: 16px;">
        <div style="display: flex; align-items: center">
          <s-skeleton style="width: 72px; height: 72px; border-radius: 50% "></s-skeleton>
          <div style="flex-grow: 1; margin-left: 16px">
            <s-skeleton></s-skeleton>
            <s-skeleton style="margin-top: 8px"></s-skeleton>
            <s-skeleton style="margin-top: 8px; width: 80%"></s-skeleton>
          </div>
        </div>
      </div>
    </mdui-card>

    <!-- 真实内容 - 数据加载完成后显示 -->
    <mdui-card class="bilibili-card" v-else :class="{ 'card-loaded': isLoaded }">
      <!-- 头像和基本信息区域 -->
      <div class="avatar-section">
        <div class="avatar-container">
          <img :src="bilibiliInfo?.face || 'https://picsum.photos/200/200'" alt="B站头像" class="user-avatar"
            @error="handleAvatarError">
        </div>
        <div class="basic-info">
          <div class="name-section">
            <h4 class="user-name">
              {{ bilibiliInfo?.name || '未知用户' }}
              <span class="bilibili-vip-badge" v-if="bilibiliInfo?.vipStatus > 0">
                {{ getBilibiliVipBadge(bilibiliInfo?.vipStatus || 0) }}
              </span>
              <span class="bilibili-vip-expired" v-else-if="bilibiliInfo?.vipType > 0 && bilibiliInfo?.vipStatus === 0">
                💎 会员已过期
              </span>
              <span class="official-badge" v-if="bilibiliInfo?.isOfficial">
                🏢 {{ bilibiliInfo?.officialTitle || '官方认证' }}
              </span>
              <!-- 勋章信息 -->
              <span class="nameplate-badge" v-if="bilibiliInfo?.nameplate && bilibiliInfo?.nameplate.name">
                🏅 {{ bilibiliInfo?.nameplate.name }}
              </span>
            </h4>
            <span class="level-badge">Lv.{{ bilibiliInfo?.level || 0 }}</span>
          </div>
          <p class="user-account">
            B站ID: {{ bilibiliInfo?.mid }}
          </p>
          <!-- 会员到期时间 -->
          <p class="vip-expire-date" v-if="bilibiliInfo?.vipExpireDate">
            会员到期: {{ bilibiliInfo?.vipExpireDate }}
          </p>
        </div>
      </div>

      <!-- 个性签名区域 -->
      <div class="sign-section" v-if="bilibiliInfo?.sign">
        <p class="user-sign">{{ bilibiliInfo?.sign }}</p>
      </div>
      <div class="sign-section" v-else>
        <p class="user-sign">这个人很懒，什么都没有留下</p>
      </div>

      <!-- 统计信息区域 -->
      <div class="statistics-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.videoNum }}</div>
            <div class="stat-label">视频</div>
          </div>

          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.followNum }}</div>
            <div class="stat-label">关注</div>
          </div>

          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.fansNum }}</div>
            <div class="stat-label">粉丝</div>
          </div>

          <!-- 添加点赞数显示 -->
          <div class="stat-item">
            <div class="stat-value">{{ animatedValues.likeNum }}</div>
            <div class="stat-label">获赞</div>
          </div>
        </div>
      </div>
    </mdui-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

// 数据状态
const bilibiliInfo = ref(null);
const isLoaded = ref(false);
const animatedValues = ref({
  videoNum: '0',
  followNum: '0',
  fansNum: '0',
  likeNum: '0'
});

// 用户ID配置
const bilibiliMid = '213203496';

// 处理头像加载失败
const handleAvatarError = (event) => {
  console.warn('B站头像加载失败，使用默认头像');
  event.target.src = 'https://picsum.photos/200/200';
};

// 格式化数字显示（添加千位分隔符）
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 获取B站会员徽章
const getBilibiliVipBadge = (vipStatus) => {
  if (vipStatus === 1) return '💎 大会员';
  if (vipStatus === 2) return '👑 年度大会员';
  return '';
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
  if (bilibiliInfo.value) {
    // 错开启动每个动画，使效果更自然
    setTimeout(() => animateNumber('videoNum', bilibiliInfo.value.videoNum || 0), 100);
    setTimeout(() => animateNumber('followNum', bilibiliInfo.value.followNum || 0), 300);
    setTimeout(() => animateNumber('fansNum', bilibiliInfo.value.fansNum || 0), 500);
    setTimeout(() => animateNumber('likeNum', bilibiliInfo.value.likeNum || 0), 700);
  }
};

// 设置备选数据的函数
const setFallbackData = () => {
  // 基于最新的API返回数据结构设置备选数据
  bilibiliInfo.value = {
    mid: bilibiliMid,
    name: '账号己重置',
    face: 'https://picsum.photos/id/237/200/200', // 使用占位图替代可能无法访问的B站图片
    level: 5, // 与API中的level_info.current_level保持一致的字段名
    sign: '才发现有这么多同志',
    vipType: 1,
    vipStatus: 0,
    vipExpireDate: '',
    followNum: 38, // 根据API返回的attention字段
    fansNum: 1111, // 根据API返回的follower字段
    videoNum: 88, // 根据API返回的archive_count字段
    likeNum: 12400, // 根据API返回的like_num字段
    isOfficial: false,
    officialTitle: '',
    nameplate: {
      name: '见习偶像',
      image: 'https://picsum.photos/id/1005/100/100'
    } // 根据API返回的nameplate信息
  };
  console.log('已设置备选B站数据');
};

// 获取B站信息
const fetchBilibiliInfo = async () => {
  try {
    // 使用配置的代理路径
    const apiUrl = `/x/web-interface/card?mid=${bilibiliMid}`;
    // console.log('发起B站请求的URL:', apiUrl);

    const response = await fetch(apiUrl);
    // console.log('B站响应状态码:', response.status);

    let data;
    try {
      data = await response.json();
      // console.log('B站API返回数据:', data);
    } catch (jsonError) {
      // console.error('解析B站API返回数据失败:', jsonError);
      // 解析失败时使用备选数据
      setFallbackData();
      return;
    }

    // 根据B站官方API返回格式处理数据
    if (data && data.code === 0 && data.data && data.data.card) {
      const card = data.data.card;
      const rootData = data.data; // 保存顶层data对象以获取follower和like_num等字段

      // 处理头像URL，替换为代理路径
      let avatarUrl = card.face;
      if (avatarUrl && avatarUrl.includes('hdslb.com')) {
        // console.log('原始头像URL:', `\`${avatarUrl}\``);
        // 将B站图片URL转换为代理路径
        avatarUrl = avatarUrl.replace('https://i0.hdslb.com', '/bilibili-img');
        avatarUrl = avatarUrl.replace('https://i1.hdslb.com', '/bilibili-img-i1');
        avatarUrl = avatarUrl.replace('https://i2.hdslb.com', '/bilibili-img-i2');
        // console.log('处理后头像URL:', avatarUrl);
      }

      // 设置B站信息，添加完整的空值检查，确保正确映射所有API返回字段
      bilibiliInfo.value = {
        mid: card.mid || bilibiliMid,
        name: card.name || '未知用户',
        face: avatarUrl || `https://picsum.photos/seed/${bilibiliMid}/200/200`,
        level: card.level_info?.current_level || 0, // 从level_info对象获取等级
        vipType: card.vip?.type || 0,
        vipStatus: card.vip?.status || 0,
        vipExpireDate: card.vip?.due_date ? new Date(Number(card.vip.due_date)).toLocaleDateString() : '', // 确保due_date被正确解析为数字类型的时间戳
        isOfficial: card.official_verify?.type === 1,
        officialTitle: card.official_verify?.desc || '',
        fansNum: rootData.follower || 0, // 从顶层data对象获取粉丝数
        followNum: card.attention || 0, // 从card对象获取关注数
        videoNum: rootData.archive_count || 0, // 从顶层data对象获取视频数
        likeNum: rootData.like_num || 0, // 从顶层data对象获取点赞数
        sign: card.sign || '',
        nameplate: card.nameplate || null
      };
    } else {
      console.error('B站API返回数据格式异常:', data);
      // 返回格式异常时使用备选数据
      setFallbackData();
    }
  } catch (error) {
    console.error('获取B站信息失败:', error);
    setFallbackData();
  }
};

// 监听数据变化，启动动画
watch(bilibiliInfo, (newValue) => {
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
  await fetchBilibiliInfo();
});
</script>

<style lang="scss" scoped>
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

/* Bilibili相关样式 */
.bilibili-card-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto;
}

.bilibili-card {
  width: 100%;
  max-width: 400px;
  /* 适配手机宽度 */
  border-radius: 12px;
  /* 圆角设计 */
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  /* 轻微阴影 */
  background: #ffffff;
  border: 1px solid #e0e0e0;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease-out;
  cursor: pointer;
}

/* 淡入动画 */
.bilibili-card.card-loaded {
  opacity: 1;
  transform: translateY(0);
}

/* 悬停效果 */
.bilibili-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

/* 头像和基本信息区域 */
.avatar-section {
  display: flex;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

/* 头像容器 */
.avatar-container {
  position: relative;
}

.user-avatar {
  width: 64px;
  /* 适中的头像大小 */
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
  color: #00a1d6;
}

.level-badge {
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.level-badge:hover {
  background: #1976d2;
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

.vip-expire-date {
  margin: 0;
  font-size: 12px;
  color: #999;
}

/* 签名区域 - 气泡样式 */
.sign-section {
  margin: 0 16px 16px 16px;
}

.user-sign {
  margin: 0;
  padding: 12px 16px;
  background: #e3f2fd;
  border-radius: 18px;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  text-align: left;
  border-left: 3px solid #1976d2;
  transition: all 0.3s ease;
}

.user-sign:hover {
  background: #bbdefb;
  transform: translateX(5px);
}

/* 统计信息区域 */
.statistics-section {
  margin: 0 16px 16px 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  text-align: center;
}

.stat-item {
  padding: 8px 4px;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.stat-item:hover {
  background: #f5f5f5;
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
  color: #00a1d6;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 勋章样式 */
.nameplate-badge {
  margin-left: 6px;
  padding: 2px 6px;
  background: #fff8e1;
  color: #ff6f00;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: inline-block;
  vertical-align: middle;
  animation: nameplate-shine 2s infinite;
}

@keyframes nameplate-shine {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
    text-shadow: 0 0 5px rgba(255, 111, 0, 0.6);
  }
}

/* Bilibili会员徽章样式 */
.bilibili-vip-badge {
  margin-left: 6px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #00a1d6 0%, #00b5e5 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: inline-block;
  vertical-align: middle;
  animation: bilibili-shine 2s infinite;
}

@keyframes bilibili-shine {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
    text-shadow: 0 0 5px rgba(0, 161, 214, 0.8);
  }
}

.bilibili-vip-expired {
  margin-left: 6px;
  padding: 2px 6px;
  background: #f5f5f5;
  color: #999;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: inline-block;
  vertical-align: middle;
}

.official-badge {
  margin-left: 6px;
  padding: 2px 6px;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: inline-block;
  vertical-align: middle;
  animation: official-shine 2s infinite;
}

@keyframes official-shine {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
    text-shadow: 0 0 5px rgba(46, 125, 50, 0.6);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bilibili-card {
    max-width: 100%;
    margin-bottom: 16px;
  }

  .bilibili-card:hover {
    transform: translateY(-3px);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>