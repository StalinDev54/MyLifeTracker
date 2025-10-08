<template>
  <!-- 骨架屏作为单独的v-if组件，不在app-launch-records内部 -->
  <div v-if="loading" class="skeleton-outer-container">
    <iOSPullToRefresh :refreshing="isRefreshing" @refresh="handleRefresh">
      <div style="width: 300px; margin: 30px;" v-for="index in 5" :key="`skeleton-${index}`">
        <div style="display: flex; align-items: center">
          <s-skeleton style="width: 72px; height: 72px"></s-skeleton>
          <div style="flex-grow: 1; margin-left: 16px">
            <s-skeleton></s-skeleton>
            <s-skeleton style="margin-top: 8px"></s-skeleton>
            <s-skeleton style="margin-top: 8px; width: 80%"></s-skeleton>
          </div>
        </div>
      </div>
    </iOSPullToRefresh>
  </div>

  <!-- 数据加载完成或出现错误时显示的内容 -->
  <div v-else class="app-launch-records">



    <div class="pagination-dots">
      <div v-if="totalPages > 1" v-for="page in totalPages" :key="page" class="dot"
        :class="{ 'active': currentPage === page }" @click="goToPage(page)"></div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchData" class="retry-button">重试</button>
    </div>

    <!-- 数据列表 -->
    <div v-else>
      <iOSPullToRefresh :refreshing="isRefreshing" @refresh="handleRefresh">
        <!-- 数据加载完成后渲染实际卡片 -->
        <div class="cards-list">
          <div v-for="(record, index) in currentPageData" :key="index" class="card" @click="handleCardClick(record)">
            <!-- 用户头像 -->
            <div class="user-avatar" :style="getAvatarStyle(record)">{{ getUserInitial(record) }}
            </div>

            <!-- 用户核心信息区 -->
            <div class="card-info">
              <div class="user-header">
                <h3 class="user-name">{{ getUserName(record) }}</h3>
                <span class="visit-count">{{ record.sample_area || '未知地区' }}</span>
              </div>

              <div class="user-stats">
                <div class="stat-item">
                  <span class="stat-label">设备</span>
                  <span class="stat-value">{{ record.sample_device || '未知设备' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">系统</span>
                  <span class="stat-value">{{ record.sample_os || '未知系统' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">网络</span>
                  <span class="stat-value">{{ record.sample_network || '未知网络' }}</span>
                </div>
              </div>

              <!-- 社交媒体信息 -->
              <div class="social-media" v-if="record.socialMedia">
                <span class="social-label">来源: </span>
                <span class="social-platform">{{ record.socialMedia.platform || '直接访问' }}</span>
                <span class="social-content" v-if="record.socialMedia.content">{{ record.socialMedia.content }}</span>
              </div>
            </div>

            <!-- 访问时间与地区 -->
            <div class="card-meta">
              <p class="launch-time">{{ formatTime(record.session_start_time) }}</p>
            </div>
          </div>
        </div>
      </iOSPullToRefresh>

      <!-- 分页控件 -->

    </div>
  </div>

  <!-- 详情弹窗组件 -->
  <StatisticsDetailDialog :visible="dialogVisible" :user-info="dialogUserInfo" @close="closeDialog" />

  <s-divider style="margin-top: 5px;">数据来源于百度移动统计</s-divider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { BAIDU_STAT_CONFIG } from '../../utils/baiduConfig.js'
import iOSPullToRefresh from '../utils/iOSPullToRefresh.vue';
import StatisticsDetailDialog from '../dialogs/StatisticsDetailDialog.vue'
// 状态管理
const loading = ref(true)
const isRefreshing = ref(false)
const error = ref('')
const records = ref([])
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))

// 处理下拉刷新
const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await fetchData()
  } finally {
    isRefreshing.value = false
  }
}

// 计算当前页显示的数据
const currentPageData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = Math.min(startIndex + pageSize.value, records.value.length)
  return records.value.slice(startIndex, endIndex)
})

// 获取百度统计API数据
const fetchData = async () => {
  loading.value = true
  error.value = ''

  try {
    // 使用环境变量中的代理地址，如果不存在则使用默认地址
    const proxyUrl = import.meta.env.VITE_BAIDU_STAT_PROXY_URL || '/baidu-stat/proxy';

    // 使用后端安全代理接口，通过POST请求体传递业务参数
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: BAIDU_STAT_CONFIG.APP_KEY,
        method: 'sample/a',
        'max-results': 30
      })
    })

    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`)
    }

    let rawData = await response.json()

    // 解析数据
    parseData(rawData)
  } catch (err) {
    error.value = `获取数据失败: ${err.message || '未知错误'}`
    console.error('API请求错误:', err)

    // 提供模拟数据作为备用
    provideMockData()
  } finally {
    loading.value = false
  }
}

// 解析API返回的数据
const parseData = (rawData) => {
  if (!rawData || !rawData.result) {
    error.value = '数据格式错误'
    provideMockData()
    return
  }

  const parsed = []
  const timeData = rawData.result.items[0] // 时间数据
  const detailData = rawData.result.items[1] // 详细数据
  const fields = rawData.result.fields

  // 确保两个数组长度相同
  const maxLength = Math.min(timeData.length, detailData.length)

  for (let i = 0; i < maxLength; i++) {
    const record = {
      [fields[0]]: timeData[i][0], // session_start_time
      [fields[1]]: detailData[i][0], // sample_version
      [fields[2]]: detailData[i][1], // sample_channel
      [fields[3]]: detailData[i][2], // sample_area
      [fields[4]]: detailData[i][3], // sample_os
      [fields[5]]: detailData[i][4], // sample_device
      [fields[6]]: detailData[i][5], // sample_screen
      [fields[7]]: detailData[i][6] // sample_network
    }
    parsed.push(record)
  }

  records.value = parsed
  totalRecords.value = parsed.length
  currentPage.value = 1 // 重置到第一页
}

// 提供模拟数据作为备用
const provideMockData = () => {
  // 生成当前时间和30分钟内的时间字符串
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  const now = new Date();
  const recentTime1 = new Date(now.getTime() - Math.floor(Math.random() * 30 * 60 * 1000));
  const recentTime2 = new Date(now.getTime() - Math.floor(Math.random() * 30 * 60 * 1000));

  // 基于web_reference中的数据格式创建模拟数据
  const mockRecords = [
    // 最近30分钟内的数据（用于测试新的时间格式）
    {
      userName: '最近访客1',
      session_start_time: formatDate(recentTime1),
      sample_version: '1.0.2',
      sample_channel: 'appstore',
      sample_area: '北京',
      sample_os: 'iOS 17.2',
      sample_device: 'iPhone 15 Pro',
      sample_screen: '1242x2688',
      sample_network: '5G',
      visitCount: 1,
      socialMedia: {
        platform: '微信',
        content: '刚刚分享'
      }
    },
    {
      userName: '最近访客2',
      session_start_time: formatDate(recentTime2),
      sample_version: '1.0.3',
      sample_channel: 'googleplay',
      sample_area: '上海',
      sample_os: 'Android 13',
      sample_device: 'Samsung Galaxy S23',
      sample_screen: '1080x2400',
      sample_network: '4G',
      visitCount: 2,
      socialMedia: {
        platform: '微博',
        content: '热门话题'
      }
    },
    {
      userName: '张小明',
      session_start_time: '2025/09/02 05:17:01',
      sample_version: '1.0.2',
      sample_channel: 'appstore',
      sample_area: '北京',
      sample_os: 'iOS 17.2',
      sample_device: 'iPhone 15 Pro',
      sample_screen: '1242x2688',
      sample_network: '5G',
      visitCount: 3,
      socialMedia: {
        platform: '微信',
        content: '分享自朋友圈'
      }
    },
    {
      userName: '李华',
      session_start_time: '2025/09/02 04:50:27',
      sample_version: '1.0.3',
      sample_channel: 'googleplay',
      sample_area: '上海',
      sample_os: 'Android 13',
      sample_device: 'Samsung Galaxy S23',
      sample_screen: '1080x2400',
      sample_network: '4G',
      visitCount: 1,
      socialMedia: {
        platform: '微博',
        content: '热门话题推荐'
      }
    },
    {
      userName: '王芳',
      session_start_time: '2025/09/02 02:50:44',
      sample_version: '1.0.2',
      sample_channel: 'website',
      sample_area: '广州',
      sample_os: 'macOS 14.1',
      sample_device: 'MacBook Pro',
      sample_screen: '1920x1080',
      sample_network: 'Wi-Fi',
      visitCount: 5,
      socialMedia: {
        platform: '抖音',
        content: '短视频引流'
      }
    },
    {
      userName: '赵伟',
      session_start_time: '2025/09/02 02:39:44',
      sample_version: '1.0.1',
      sample_channel: 'appstore',
      sample_area: '深圳',
      sample_os: 'iPadOS 17.1',
      sample_device: 'iPad Pro',
      sample_screen: '1640x2360',
      sample_network: 'Wi-Fi',
      visitCount: 2
    },
    {
      userName: '陈静',
      session_start_time: '2025/09/02 01:42:31',
      sample_version: '1.0.3',
      sample_channel: 'huawei',
      sample_area: '杭州',
      sample_os: 'HarmonyOS 4.0',
      sample_device: 'Huawei Mate 60',
      sample_screen: '1224x2700',
      sample_network: '5G',
      visitCount: 7,
      socialMedia: {
        platform: '小红书',
        content: '笔记分享'
      }
    },
    {
      userName: '刘强',
      session_start_time: '2025/09/01 23:50:12',
      sample_version: '1.0.2',
      sample_channel: 'xiaomi',
      sample_area: '成都',
      sample_os: 'Android 14',
      sample_device: 'Xiaomi 14 Pro',
      sample_screen: '1440x3200',
      sample_network: '5G',
      visitCount: 4,
      socialMedia: {
        platform: 'QQ',
        content: '群聊分享'
      }
    }
  ]

  records.value = mockRecords
  totalRecords.value = mockRecords.length
  currentPage.value = 1 // 重置到第一页
}

// 组件挂载时获取数据
onMounted(() => {
  fetchData()
})

// 分页导航方法
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 获取用户名称
const getUserName = (record) => {
  if (record.userName) return record.userName
  // 基于设备名和地区生成用户名
  const device = record.sample_device || '访客'
  const area = record.sample_area || '未知'
  return `${device}用户`
}


// 根据用户信息生成头像样式配置
const getAvatarStyle = (record) => {
  // 增加更多颜色选项以提高多样性
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
    '#909399', '#C0C4CC', '#F7BA1E', '#E06666',
    '#74C7B8', '#9370DB', '#6FA8DC', '#FF9900',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9D423'
  ];

  // 头像形状选项
  const shapes = ['circle', 'rounded', 'square'];

  // 边框样式选项
  const borders = ['none', 'thin', 'medium', 'thick'];

  const name = getUserName(record);
  let hash = 0;

  // 计算哈希值，考虑更多用户属性以增加多样性
  const seed = name + (record.sample_device || '') + (record.sample_area || '');
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colorIndex = Math.abs(hash) % colors.length;
  const shapeIndex = Math.abs(hash % 100) % shapes.length;
  const borderIndex = Math.abs(hash % 1000) % borders.length;

  // 构建样式配置，优化为始终使用圆角
  const style = {
    backgroundColor: colors[colorIndex],
    borderRadius: '8px' // 固定为圆角样式
  };

  // 添加边框样式
  if (borders[borderIndex] !== 'none') {
    const borderWidth =
      borders[borderIndex] === 'thin' ? '2px' :
        borders[borderIndex] === 'medium' ? '3px' : '4px';

    // 为边框选择对比色
    const borderColors = ['#ffffff', '#f0f0f0', '#e0e0e0'];
    const borderColor = borderColors[Math.abs(hash % 10000) % borderColors.length];

    style.border = `${borderWidth} solid ${borderColor}`;

    // 添加轻微阴影效果增加立体感
    if (borders[borderIndex] !== 'thin') {
      style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
    }
  }

  return style;
}

// 获取用户首字母（保持原有功能）
const getUserInitial = (record) => {
  const name = getUserName(record)
  return name.charAt(0).toUpperCase()
}

// 为了保持兼容性，保留原函数名但返回更多样式
const getAvatarColor = (record) => {
  return getAvatarStyle(record).backgroundColor;
}

// 格式化时间显示
const formatTime = (timeString) => {
  if (!timeString) return ''

  const date = new Date(timeString)
  const now = new Date()
  const diffInMinutes = (now - date) / (1000 * 60)
  const diffInHours = diffInMinutes / 60

  // 30分钟以内显示'距离现在多久 xx前'格式
  if (diffInMinutes < 30) {
    if (diffInMinutes < 1) {
      return '刚刚'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}分钟前`
    }
  }
  // 24小时以内显示具体时间
  else if (diffInHours < 24) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  // 昨天的显示昨天+时间
  else if (diffInHours < 48) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  }
  // 更早的显示日期
  else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
  }
}

// 弹窗状态
const dialogVisible = ref(false)
const selectedRecord = ref(null)

// 卡片点击交互逻辑
const handleCardClick = (record) => {
  selectedRecord.value = record
  dialogVisible.value = true
}

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false
  selectedRecord.value = null
}

// 准备传递给弹窗的用户信息
const dialogUserInfo = computed(() => {
  if (!selectedRecord.value) {
    return {}
  }

  const record = selectedRecord.value
  const name = getUserName(record)

  return {
    name: name,
    avatarColor: getAvatarColor(record),
    initial: getUserInitial(record),
    visitCount: record.visit_count || 0,
    device: record.sample_device || '未知设备',
    os: record.sample_os || '未知系统',
    network: record.sample_network || '未知网络',
    area: record.sample_area || '未知地区',
    version: record.sample_version || '未知版本',

    screen: record.sample_screen || '未知分辨率',
    startTime: record.session_start_time,

    socialMedia: record.social_media ? {
      platform: record.social_media.platform || '社交媒体',
      content: record.social_media.content || ''
    } : null
  }
})

</script>

<style scoped>
/* 容器与头部 */
.app-launch-records {
  padding: 20px;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  max-width: 140000px;
  margin: 0 auto;
  background-color: #ffffff;
  min-height: 100vh;
  animation: fadeIn 0.8s ease-out;
}

/* 页面进入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 骨架屏进入动画 */
.skeleton-outer-container {
  animation: fadeIn 0.5s ease-out;
}

/* 骨架屏卡片动画（交错效果） */
.skeleton-outer-container>div>div {
  animation: skeletonSlideUp 0.6s ease-out;
}

.skeleton-outer-container>div>div:nth-child(1) {
  animation-delay: 0.1s;
}

.skeleton-outer-container>div>div:nth-child(2) {
  animation-delay: 0.2s;
}

.skeleton-outer-container>div>div:nth-child(3) {
  animation-delay: 0.3s;
}

.skeleton-outer-container>div>div:nth-child(4) {
  animation-delay: 0.4s;
}

.skeleton-outer-container>div>div:nth-child(5) {
  animation-delay: 0.5s;
}

/* 卡片上滑动画 */
@keyframes skeletonSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.view-all {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

/* 确保在所有屏幕尺寸下骨架屏卡片保持良好显示 */
@media (max-width: 000px) {
  .skeleton-card {
    padding: 12px 16px;
  }
}

@media (max-width: 650px) {
  .skeleton-card {
    padding: 10px 12px;
  }
}

/* 卡片列表 */
.cards-list {
  display: flex;

  flex-direction: column;
  gap: 16px;
}

/* 数据卡片进入动画（交错效果） */
.cards-list .card {
  animation: cardSlideUp 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  opacity: 0;
}

/* 为每个卡片添加不同的动画延迟，创建交错效果 */
.cards-list .card:nth-child(1) {
  animation-delay: 0.1s;
}

.cards-list .card:nth-child(2) {
  animation-delay: 0.2s;
}

.cards-list .card:nth-child(3) {
  animation-delay: 0.3s;
}

.cards-list .card:nth-child(4) {
  animation-delay: 0.4s;
}

.cards-list .card:nth-child(5) {
  animation-delay: 0.5s;
}

.cards-list .card:nth-child(6) {
  animation-delay: 0.6s;
}

.cards-list .card:nth-child(7) {
  animation-delay: 0.7s;
}

.cards-list .card:nth-child(8) {
  animation-delay: 0.8s;
}

/* 卡片上滑进入动画 */
@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 统计信息显示 */
.stats-info {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
}

.error-container p {
  color: #f56c6c;
  margin-bottom: 20px;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
}

.retry-button {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background-color: #66b1ff;
}

/* 分页控件 */
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  padding: 20px 16px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.pagination-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  gap: 8px;
  margin-bottom: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #dcdfe6;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background-color: #409eff;
}

.pagination-info {
  color: #909399;
  font-size: 13px;
  font-weight: 500;
}

/* 移动端适配优化 */
@media (max-width: 480px) {
  .pagination-dots {
    gap: 6px;
  }

  .dot {
    width: 10px;
    height: 10px;
  }

  .dot.active {
    width: 20px;
  }
}

/* 单张卡片 */
.card {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 350px;
  min-height: 120px;
  box-sizing: border-box;
}

.card:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

/* 卡片内部区域 */
.user-avatar {
  width: 48px;
  height: 48px;
  font-size: 20px;
  font-weight: 600;
  color: white;
  /* 文字颜色固定为白色以确保在彩色背景上的可读性 */
  margin-right: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  /* 固定为圆角样式，与JS设置保持一致 */
}

.card-info {
  flex: 1;
  min-width: 0;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.visit-count {
  font-size: 12px;
  color: #909399;
  background-color: #f4f4f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.user-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 10px;
  color: #909399;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.social-media {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.social-label {
  color: #909399;
}

.social-platform {
  color: #409eff;
  font-weight: 500;
}

.social-content {
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-left: 20px;
  flex-shrink: 0;
}

.launch-time {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.status-tag {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  font-weight: 500;
  color: #606266;
  background-color: #f4f4f5;
}

/* 移动端适配（屏幕宽度≤480px时） */
@media (max-width: 480px) {
  .app-launch-records {
    padding: 12px;
  }

  .skeleton-container {
    gap: 12px;
    padding: 6px 0;
  }

  .skeleton-card {
    padding: 12px 16px;
    min-height: 100px;
  }

  .card {
    padding: 12px 16px;
    min-height: 100px;
  }

  .card-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
    margin-right: 12px;
  }

  .device-name {
    font-size: 15px;
    margin-bottom: 4px;
  }

  .device-details {
    font-size: 13px;
    margin-bottom: 3px;
  }

  .device-meta {
    font-size: 12px;
  }

  .card-meta {
    padding-left: 12px;
  }

  .launch-time {
    font-size: 12px;
    margin-bottom: 6px;
  }

  .status-tag {
    font-size: 11px;
    padding: 3px 8px;
  }
}

/* 更窄的移动端适配 */
@media (max-width: 360px) {
  .skeleton-container {
    gap: 10px;
    padding: 4px 0;
  }

  .skeleton-card {
    padding: 10px 12px;
  }

  .card {
    padding: 10px 12px;
  }

  .card-icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
    margin-right: 10px;
  }

  .device-name {
    font-size: 14px;
  }

  .device-details {
    font-size: 12px;
  }

  .device-meta {
    font-size: 11px;
  }

  .card-meta {
    padding-left: 10px;
  }

  .launch-time {
    font-size: 11px;
  }
}
</style>