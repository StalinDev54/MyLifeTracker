<template>
  <div class="recent-activities-container">
    <!-- 直接显示所有内容，去除卡片包裹 -->

    <!-- 使用 s-segmented-button 实现筛选切换 -->
    <div class="filter-container" style="padding: 16px;">
      <div class="mdui-flex mdui-items-center mdui-justify-center">
        <s-segmented-button v-model.lazy="filterOption">
          <s-segmented-button-item style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"
            value="recent">应用使用记录</s-segmented-button-item>
          <s-segmented-button-item style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"
            value="insights">使用洞察</s-segmented-button-item>
          <s-segmented-button-item style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"
            value="longterm">动态</s-segmented-button-item>
        </s-segmented-button>
      </div>
    </div>

    <div class="mdui-divider"></div>

    <!-- 应用使用记录 -->
    <div v-if="filterOption === 'recent'" class="app-usage-records">
      <div class="records-header" v-if="!isLoading">
        <!-- 总时长显示 -->
        <div class="total-duration-info">
          <!-- 原有图标 -->
          <mdui-icon name="timer" size="16" class="duration-icon"></mdui-icon>

          <!-- 拆分时间文本：时间变量 + 右侧新增元素 -->
          <div class="duration-text-wrapper">
            <!-- 原有时间文本（拆分后） -->
            <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="duration-text">
              近 <span class="time-value">{{ formatDuration(getActualTotalDuration()) }}</span>内：
            </span>

            <!-- 👉 新增元素：放在时间右侧，可替换为按钮、图标、状态文本等 -->

          </div>
        </div>


        <!-- 分页控件 -->
        <div class="ios-pagination">
          <div class="ios-pagination-dots">
            <div v-for="page in totalPages" :key="page" class="ios-pagination-dot"
              :class="{ 'active': currentPage === page }" @click="changePage(page)"></div>
          </div>
        </div>
      </div>
      <div class="records-list">
        <!-- 骨架屏 -->
        <div v-if="isLoading" class="skeleton-list">
          <div v-for="i in itemsPerPage" :key="i" class="record-item skeleton-item">
            <div style="display: flex; align-items: center">
              <s-skeleton style="width: 72px; height: 72px"></s-skeleton>
              <div style="flex-grow: 1; margin-left: 16px">
                <s-skeleton></s-skeleton>
                <s-skeleton style="margin-top: 8px"></s-skeleton>
                <s-skeleton style="margin-top: 8px; width: 80%"></s-skeleton>
              </div>
            </div>
          </div>
        </div>
        <!-- 实际数据 -->
        <div v-else-if="appUsageRecords.length > 0">
          <div v-for="record in currentPageRecords" :key="record.id" class="record-item"
            @click="viewRecordDetail(record)" style="cursor: pointer;">
            <div class="record-header">
              <!-- 根据图标类型显示不同的元素 -->
              <template v-if="isIconPath(getAppIcon(record.appName))">
                <img :src="getAppIcon(record.appName)" alt="{{ record.appName }}" class="record-icon-img">
              </template>
              <template v-else>
                <mdui-icon :name="getAppIcon(record.appName)" class="record-icon"></mdui-icon>
              </template>
              <div class="record-app-info" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div class="record-app-name">{{ record.appName }}</div>

                <div class="record-usage" style="font-size: 0.75rem; color: #666; margin-top: 4px;">
                  {{ getAppUsageDescription(record.appName) }}
                </div>
              </div>
            </div>
            <div class="record-details">
              <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="record-duration">{{
                record.duration }}</span>
              <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="record-time">{{
                record.time }}</span>
            </div>
            <div class="record-meta">
              <div class="meta-item">
                <mdui-icon name="battery_std" size="14" v-if="record.batteryLevel !== undefined"></mdui-icon>
                <span v-if="record.batteryLevel !== undefined">{{ record.batteryLevel }}%</span>
                <mdui-icon name="power" size="14" v-if="record.charging"></mdui-icon>
                <span v-if="record.charging" class="charging-text">充电中</span>
              </div>
              <div v-if="record.end_event_type == '锁屏'" class="meta-item">
                <mdui-icon name="directions_boat" size="14"></mdui-icon>
                <span class="way-text">{{ record.end_event_type }}</span>
              </div>
              <div v-else class="meta-item">
                <mdui-icon name="app_shortcut" size="14"></mdui-icon>
                <span class="way-text">{{ record.end_event_type }}</span>
              </div>


            </div>
          </div>
        </div>
        <!-- 无数据状态 -->
        <div v-else class="no-data">
          <mdui-icon name="data_usage" class="no-data-icon"></mdui-icon>
          <p class="no-data-text">暂无应用使用记录</p>
          <p class="no-data-subtext">请稍后刷新或检查网络连接</p>
        </div>
      </div>
    </div>

    <!-- 使用洞察视图 -->
    <div v-else-if="filterOption === 'insights'" class="insights-container">
      <div class="insights-summary" v-if="!isLoading && appUsageRecords.length > 0">
        <!-- 总时长显示 -->

        <div class="total-duration-info">
          <!-- 原有图标 -->
          <mdui-icon name="timer" size="16" class="duration-icon"></mdui-icon>

          <!-- 拆分时间文本：时间变量 + 右侧新增元素 -->
          <div class="duration-text-wrapper">
            <!-- 原有时间文本（拆分后） -->
            <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="duration-text">
              近 <span class="time-value">{{ formatDuration(getActualTotalDuration()) }}</span>内：
            </span>

            <!-- 👉 新增元素：放在时间右侧，可替换为按钮、图标、状态文本等 -->
            <div class="right-element">
              <!-- 示例：新增“今日活跃”文本，可根据需求修改 -->
              <mdui-icon name="activity" size="14" class="right-icon"></mdui-icon>
              <span class="right-text">共{{ appUsageRecords.length }}条记录</span>
            </div>
          </div>
        </div>
        <!-- 应用使用时长统计 -->
        <div class="insight-card">
          <h4 style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="insight-title">使用最久的应用</h4>
          <div class="top-apps">
            <div v-for="(app, index) in topUsedApps" :key="index" class="top-app-item">
              <div class="app-rank">{{ index + 1 }}</div>
              <!-- 根据图标类型显示不同的元素 -->
              <template v-if="isIconPath(getAppIcon(app.name))">
                <img :src="getAppIcon(app.name)" alt="{{ app.name }}" class="app-icon-img">
              </template>
              <template v-else>
                <mdui-icon :name="getAppIcon(app.name)" class="app-icon"></mdui-icon>
              </template>
              <div class="app-name">{{ app.name }}</div>
              <div class="app-total-duration">{{ formatDuration(app.totalSeconds) }}</div>
            </div>
          </div>
        </div>

        <!-- 使用时段分析 -->
        <div class="insight-card">
          <h4 style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="insight-title">活跃时段分布</h4>
          <div class="time-distribution">
            <div v-for="hour in activeHours" :key="hour.hour" class="time-bar">
              <div class="hour-label">{{ hour.hour }}时</div>
              <div class="bar-container">
                <div class="bar" :style="{ width: hour.percentage + '%' }"></div>
              </div>
              <div class="hour-count">{{ hour.count }}</div>
            </div>
          </div>
        </div>

        <!-- 电池使用趋势 -->
        <div v-if="batteryTrend.length > 0" class="insight-card">
          <h4 style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="insight-title">电池使用趋势</h4>
          <div class="battery-trend-container">
            <div class="battery-trend">
              <!-- 水平参考线 -->
              <div class="reference-lines">
                <div class="reference-line" style="top: 25%;"><span>75%</span></div>
                <div class="reference-line" style="top: 50%;"><span>50%</span></div>
                <div class="reference-line" style="top: 75%;"><span>25%</span></div>
              </div>
              <!-- 电池数据点 -->
              <div v-for="(data, index) in batteryTrend.slice(0, 10).reverse()" :key="index" class="battery-point">
                <div class="time-label">{{ formatShortTime(data.time) }}</div>
                <div class="battery-level-wrapper">
                  <div class="battery-level"
                    :style="{ height: data.batteryLevel + '%', backgroundColor: getBatteryColor(data.batteryLevel) }">
                  </div>
                  <!-- 充电状态指示器 -->
                  <div v-if="data.charging" class="charging-indicator">
                    <mdui-icon name="power" size="12"></mdui-icon>
                  </div>
                </div>
                <div class="battery-percentage">{{ data.batteryLevel }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else-if="!isLoading" class="no-data">
        <mdui-icon name="trending_up" class="no-data-icon"></mdui-icon>
        <p class="no-data-text">暂无使用洞察数据</p>
        <p class="no-data-subtext">请先查看应用使用记录</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="skeleton-list">
        <div class="record-item skeleton-item">
          <s-skeleton style="width: 100%; height: 32px; margin-bottom: 8px"></s-skeleton>
          <s-skeleton style="width: 100%; height: 120px"></s-skeleton>
        </div>
      </div>
    </div>

    <!-- 长期数据视图 -->
    <div v-else>
      <life-about> </life-about>
      <!-- 兴趣爱好区域 -->
    </div>

    <!-- 活动日志详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="modal-title">活动详情</h3>
          <mdui-icon name="close" class="close-icon" @click="closeDetailModal"></mdui-icon>
        </div>
        <div class="modal-body" v-if="selectedRecord">
          <div class="detail-item">
            <span class="detail-label">应用名称：</span>
            <span class="detail-value">{{ selectedRecord.appName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">应用包名：</span>
            <span class="detail-value">{{ selectedRecord.app_package }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">使用描述：</span>
            <span class="detail-value">{{ getAppUsageDescription(selectedRecord.appName) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">使用时长：</span>
            <span class="detail-value">{{ selectedRecord.duration }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">开始时间：</span>
            <span class="detail-value">{{ selectedRecord.time }}</span>
          </div>
          <div class="detail-item" v-if="selectedRecord.endTime">
            <span class="detail-label">结束时间：</span>
            <span class="detail-value">{{ formatDateTime(selectedRecord.endTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">电池电量：</span>
            <span class="detail-value">{{ selectedRecord.batteryLevel }}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">充电状态：</span>
            <span class="detail-value">{{ selectedRecord.charging ? '充电中' : '未充电' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">IP地址：</span>
            <span class="detail-value">{{ selectedRecord.ip }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">后一事件：</span>
            <span class="detail-value">{{ selectedRecord.end_event_type }}</span>
          </div>
          <!-- <div class="detail-item">
          <span class="detail-label">状态：</span>
          <span class="detail-value">{{ selectedRecord.status ? '已解锁' : '未使用' }}</span>
        </div> -->
        </div>
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="modal-footer">
          <s-button @click="closeDetailModal">关闭</s-button>
        </div>
      </div>
    </div>
    <s-divider v-if="filterOption === 'recent'">
      <div class="right-element">
        <!-- 示例：新增“今日活跃”文本，可根据需求修改 -->
        <span style="font-size: smaller;" class="right-text">共捕获{{ appUsageRecords.length }}条记录</span>
      </div>
    </s-divider margin-bottom="156px">

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject } from 'vue';
import LifeAbout from '../components/ui/LifeAbout.vue';
import { getAppUsageDescription } from '../utils/appUtils.js';
// 过滤器选项
const filterOption = ref('recent'); // 'recent', 'insights' 或 'longterm'
const currentPage = ref(1);
const itemsPerPage = 8;
const isLoading = ref(true);

// 详情弹窗相关
const showDetailModal = ref(false);
const selectedRecord = ref(null);

// 应用使用记录数据
const appUsageRecords = ref([]);
// 总时长（秒）
const totalDuration = ref(0);

// 注入全局应用图标映射
const appIconMap = inject('appIconMap', {});



// 获取应用图标（返回图标名称或路径）
const getAppIcon = (appName) => {
  // 优先使用图标文件路径
  if (appName && appIconMap[appName]) {
    return appIconMap[appName];
  }

  // 应用图标映射表（保留用于未在appIconMap中找到的应用）
  const appIcons = {
    '微信': 'wechat',
    'QQ': 'forum',
    '哔哩哔哩': 'play_circle_outline',
    '微博': 'public',
    '抖音': 'ondemand_video',
    '支付宝': 'credit_card',
    '信息': 'message',
    '设置': 'settings',
    '日历': 'date_range',
    '电话': 'phone',
    '相机': 'camera',
    '相册': 'collections',
    '浏览器': 'chrome_reader_mode',
    '音乐': 'music_note',
    '视频': 'movie',
    '地图': 'map',
    '天气': 'wb_sunny',
    '时钟': 'schedule',
    '邮件': 'mail',
    '文件': 'insert_drive_file',
    '计算器': 'functions',
    '备忘录': 'edit_note',
    '健康': 'accessibility',
    '应用商店': 'shopping_bag',
    '应用': 'apps',
    '搜索': 'search',
    '家庭': 'home',
    '播客': 'podcasts',
    '照片': 'photo',
    '钱包': 'account_balance_wallet',
    '未使用任何应用': 'lock_open'
  };

  // 尝试直接匹配
  if (appIcons[appName]) {
    return appIcons[appName];
  }

  // 尝试关键词匹配
  const nameLower = appName.toLowerCase();
  if (nameLower.includes('微信') || nameLower.includes('wechat')) {
    return 'wechat';
  } else if (nameLower.includes('qq')) {
    return 'forum';
  } else if (nameLower.includes('bilibili') || nameLower.includes('哔哩哔哩')) {
    return 'play_circle_outline';
  } else if (nameLower.includes('浏览器') || nameLower.includes('chrome')) {
    return 'chrome_reader_mode';
  } else if (nameLower.includes('音乐') || nameLower.includes('music')) {
    return 'music_note';
  } else if (nameLower.includes('视频') || nameLower.includes('movie')) {
    return 'movie';
  } else if (nameLower.includes('地图')) {
    return 'map';
  } else if (nameLower.includes('天气')) {
    return 'wb_sunny';
  } else if (nameLower.includes('设置')) {
    return 'settings';
  } else if (nameLower.includes('相机') || nameLower.includes('camera')) {
    return 'camera';
  } else if (nameLower.includes('相册') || nameLower.includes('photo')) {
    return 'collections';
  } else if (nameLower.includes('邮件') || nameLower.includes('mail')) {
    return 'mail';
  } else if (nameLower.includes('未使用')) {
    return 'lock_open';
  }

  // 默认图标
  return 'apps';
};

// 判断是否为图标文件路径
const isIconPath = (icon) => {
  return typeof icon === 'string' && (icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.svg'));
}


// 格式化时长显示
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${remainingSeconds > 0 ? `${remainingSeconds}秒` : ''}`;
  } else {
    return `${remainingSeconds}秒`;
  }
};



// 获取实际总时长（从最早记录到当前时间）
const getActualTotalDuration = () => {
  // 如果已有有效总时长，直接返回
  if (totalDuration.value > 0) {
    return totalDuration.value;
  }

  // 如果有应用记录，计算从最早记录到当前时间的时长
  if (appUsageRecords.value.length > 0) {
    const now = Math.floor(Date.now() / 1000); // 当前时间（秒）
    // 查找最早的记录时间
    const earliestRecord = appUsageRecords.value.reduce((earliest, record) => {
      if (!earliest || (record.rawTime && record.rawTime < earliest.rawTime)) {
        return record;
      }
      return earliest;
    }, null);

    // 如果找到最早记录，计算时长
    if (earliestRecord && earliestRecord.rawTime) {
      return now - earliestRecord.rawTime;
    }
  }

  // 默认返回0秒
  return 0;
};

// 查看日志详情
const viewRecordDetail = (record) => {
  selectedRecord.value = record;
  showDetailModal.value = true;
};

// 关闭详情弹窗
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedRecord.value = null;
};

// 格式化短时间显示
const formatShortTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 格式化日期时间
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 判断是否是今天、昨天或更早
  if (date >= today) {
    // 今天
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `今天 ${hours}:${minutes}`;
  } else if (date >= yesterday) {
    // 昨天
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `昨天 ${hours}:${minutes}`;
  } else {
    // 更早
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  }
};

// 获取电池颜色
const getBatteryColor = (level) => {
  if (level >= 70) {
    return '#4CAF50';
  } else if (level >= 30) {
    return '#FFC107';
  } else {
    return '#F44336';
  }
};

// 从localStorage加载数据
const loadAppUsageRecords = () => {
  try {
    const storedData = localStorage.getItem('processedActivityRecords');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      appUsageRecords.value = parsedData.records || [];
      // 读取总时长数据
      if (parsedData.totalDuration !== undefined) {
        totalDuration.value = parsedData.totalDuration;
      }
      console.log('从localStorage加载数据，记录数量:', appUsageRecords.value.length, '总时长:', totalDuration.value, '秒');
      // 设置加载完成
      isLoading.value = false;

      if (appUsageRecords.value.length === 0) {
        // 如果没有数据，请求ProfileView提供数据
        console.log('localStorage中无有效数据，请求ProfileView提供数据');
        window.dispatchEvent(new CustomEvent('requestActivityData'));
      }
    } else {
      // 如果localStorage中没有数据，请求ProfileView提供数据
      console.log('localStorage中没有数据，请求ProfileView提供数据');
      window.dispatchEvent(new CustomEvent('requestActivityData'));
      // 如果请求后5秒仍没有数据，生成模拟数据
      setTimeout(() => {
        if (appUsageRecords.value.length === 0 && isLoading.value) {
          console.log('请求数据超时，生成模拟数据');
          generateMockData();
          isLoading.value = false;
        }
      }, 5000);
    }
  } catch (error) {
    console.error('加载应用使用记录失败:', error);
    // 请求ProfileView提供数据
    window.dispatchEvent(new CustomEvent('requestActivityData'));
    isLoading.value = false;
  }
};

// 生成模拟数据
const generateMockData = () => {
  const mockApps = [
    { name: '微信', project: '聊天', icon: 'wechat' },
    { name: 'QQ', project: '社交', icon: 'forum' },
    { name: '哔哩哔哩', project: '视频观看', icon: 'play_circle_outline' },
    { name: '浏览器', project: '网页浏览', icon: 'chrome_reader_mode' },
    { name: '音乐', project: '音乐播放', icon: 'music_note' },
    { name: '未使用任何应用', project: '设备锁屏', icon: 'lock_open' }
  ];

  const mockData = [];
  const now = Math.floor(Date.now() / 1000);

  // 生成过去24小时内的15条模拟记录
  for (let i = 0; i < 15; i++) {
    const app = mockApps[Math.floor(Math.random() * mockApps.length)];
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const recordTime = now - (hoursAgo * 3600) - (minutesAgo * 60);
    const durationMinutes = Math.floor(Math.random() * 60) + 5;
    const durationSeconds = durationMinutes * 60;

    let durationText = '';
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      durationText = `${hours}小时${minutes}分钟`;
    } else {
      durationText = `${durationMinutes}分钟`;
    }

    let timeDisplay = '';
    if (hoursAgo === 0) {
      if (minutesAgo < 5) {
        timeDisplay = '刚刚';
      } else {
        timeDisplay = `${minutesAgo}分钟前`;
      }
    } else if (hoursAgo === 1) {
      timeDisplay = '1小时前';
    } else if (hoursAgo < 24) {
      timeDisplay = `${hoursAgo}小时前`;
    } else {
      timeDisplay = '昨天';
    }

    mockData.push({
      id: i + 1,
      appName: app.name,
      duration: durationText,
      project: app.project,
      time: timeDisplay,
      rawTime: recordTime,
      endTime: recordTime + durationSeconds,
      batteryLevel: Math.floor(Math.random() * 100),
      charging: Math.random() > 0.7,
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      status: Math.random() > 0.2,
      app_name: app.name,
      device: 'desktop'
    });
  }

  // 按时间倒序排列
  mockData.sort((a, b) => b.rawTime - a.rawTime);

  // 如果mockData不为空，设置模拟的总时长（当前时间 - 最早记录时间）
  if (mockData.length > 0) {
    const now = Date.now() / 1000; // 转换为秒
    const earliestRecordTime = Math.min(...mockData.map(record => record.rawTime));
    totalDuration.value = Math.round(now - earliestRecordTime);
    console.log('生成模拟总时长:', totalDuration.value, '秒');

    // 将模拟数据和总时长保存到localStorage
    try {
      // 创建一个完全脱离Vue响应式系统的普通JavaScript对象
      // 使用展开运算符和JSON.parse/stringify确保移除所有响应式属性
      const serializableRecords = mockData.map(record => ({
        ...record
      }));
      const serializableData = {
        records: JSON.parse(JSON.stringify(serializableRecords)),
        totalDuration: Number(totalDuration.value), // 确保是纯数字
        lastUpdated: Date.now(),
        source: 'mock'
      };
      localStorage.setItem('processedActivityRecords', JSON.stringify(serializableData));
      console.log('模拟数据已保存到localStorage');
    } catch (storageError) {
      console.error('保存模拟数据到localStorage失败:', storageError);
    }
  }

  return mockData;
};

// 处理从ProfileView发送的数据
const handleActivityData = (event) => {
  const receivedData = event.detail || [];
  // console.log('接收到ProfileView发送的数据，记录数量:', receivedData.length);

  // 设置加载完成
  isLoading.value = false;

  if (Array.isArray(receivedData) && receivedData.length > 0) {
    // 检查是否是包含records和totalDuration的对象
    if (receivedData.records && Array.isArray(receivedData.records)) {
      appUsageRecords.value = receivedData.records;
      if (receivedData.totalDuration !== undefined) {
        totalDuration.value = receivedData.totalDuration;
      }
    } else {
      // 兼容旧格式
      appUsageRecords.value = receivedData;
    }

    // 保存到localStorage
    try {
      // 创建一个完全脱离Vue响应式系统的普通JavaScript对象
      // 使用展开运算符和JSON.parse/stringify确保移除所有响应式属性
      const serializableRecords = appUsageRecords.value.map(record => ({
        ...record
      }));
      const serializableData = {
        records: JSON.parse(JSON.stringify(serializableRecords)),
        totalDuration: Number(totalDuration.value), // 确保是纯数字
        lastUpdated: Date.now(),
        source: 'profile_view'
      };
      localStorage.setItem('processedActivityRecords', JSON.stringify(serializableData));
    } catch (storageError) {
      console.error('保存接收到的数据到localStorage失败:', storageError);
    }
  } else {
    console.warn('接收到的数据为空或格式不正确');
    // 确保至少有一些模拟数据用于展示
    if (appUsageRecords.value.length === 0) {
      console.log('生成模拟数据用于展示');
      appUsageRecords.value = generateMockData();
    }
  }
};

// 处理从ProfileView发送的数据(兼容旧版事件)
const handleActivityDataReady = handleActivityData;

// 计算当前页显示的记录
const currentPageRecords = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return appUsageRecords.value.slice(startIndex, endIndex);
});

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(appUsageRecords.value.length / itemsPerPage);
});

// 计算使用最多的前5个应用
const topUsedApps = computed(() => {
  // 提取每条记录中的应用名称和使用时长
  const appMap = new Map();

  appUsageRecords.value.forEach(record => {
    let seconds = 0;

    // 优先使用新添加的usage_seconds字段
    if (record.usage_seconds !== undefined && record.usage_seconds > 0) {
      seconds = record.usage_seconds;
    } else {
      // 后备方案：解析duration文本为秒数
      const durationText = record.duration;
      if (durationText && durationText !== '正在使用') {
        if (durationText.includes('小时')) {
          const hoursMatch = durationText.match(/(\d+)小时/);
          if (hoursMatch) {
            seconds += parseInt(hoursMatch[1]) * 3600;
          }
        }
        if (durationText.includes('分钟')) {
          const minutesMatch = durationText.match(/(\d+)分钟/);
          if (minutesMatch) {
            seconds += parseInt(minutesMatch[1]) * 60;
          }
        }
        if (durationText.includes('秒')) {
          const secondsMatch = durationText.match(/(\d+)秒/);
          if (secondsMatch) {
            seconds += parseInt(secondsMatch[1]);
          }
        }
      }
    }

    if (seconds > 0) {
      if (appMap.has(record.appName)) {
        appMap.set(record.appName, appMap.get(record.appName) + seconds);
      } else {
        appMap.set(record.appName, seconds);
      }
    }
  });

  // 转换为数组并排序
  const appArray = Array.from(appMap.entries()).map(([name, totalSeconds]) => ({
    name,
    totalSeconds
  }));

  return appArray.sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, 5);
});

// 计算活跃时段分布
const activeHours = computed(() => {
  // 创建0-23时的计数数组
  const hourCounts = Array(24).fill(0);

  appUsageRecords.value.forEach(record => {
    if (record.rawTime) {
      const hour = new Date(record.rawTime * 1000).getHours();
      hourCounts[hour]++;
    }
  });

  // 计算最大值
  const maxCount = Math.max(...hourCounts);

  // 转换为百分比
  return hourCounts.map((count, index) => ({
    hour: index,
    count,
    percentage: maxCount > 0 ? (count / maxCount) * 100 : 0
  })).filter(hour => hour.count > 0); // 只保留有记录的时段
});

// 计算电池趋势数据
const batteryTrend = computed(() => {
  return appUsageRecords.value
    .filter(record => record.batteryLevel !== undefined && record.rawTime)
    .sort((a, b) => a.rawTime - b.rawTime) // 按时间升序排序
    .map(record => ({
      time: record.rawTime,
      batteryLevel: record.batteryLevel,
      charging: record.charging
    }));
});

// 切换页面
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  console.log('RecentActivitiesView组件挂载，开始加载数据');
  loadAppUsageRecords();
  // 添加事件监听 - 同时监听两种数据更新事件
  window.addEventListener('activityDataReady', handleActivityDataReady);
  window.addEventListener('activityDataUpdated', handleActivityData);

  // 确保5秒后如果仍然没有数据，显示模拟数据
  setTimeout(() => {
    if (appUsageRecords.value.length === 0 && isLoading.value) {
      console.log('数据加载超时，显示模拟数据');
      appUsageRecords.value = generateMockData();
      isLoading.value = false;
    }
  }, 5000);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('activityDataReady', handleActivityDataReady);
  window.removeEventListener('activityDataUpdated', handleActivityData);
});
</script>

<style lang="scss" scoped>
/* 过滤器样式 */
.filter-container {
  padding: 16px;
}

.filter-container s-segmented-button {
  font-size: 0.875rem;
}

/* 应用使用记录样式 */
.app-usage-records {
  padding: 16px;
}

/* 记录头部样式 - 包含总时长和分页 */
.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

/* 总时长信息样式 */
.total-duration-info {
  display: flex;
  align-items: center;
  padding: 1px 8px;
  background-color: #f5f5f5;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
}

.duration-icon {
  margin-right: 6px;
  color: #4CAF50;
}

.duration-text {
  font-weight: 500;
}

/* 电池使用趋势容器 */
.battery-trend-container {
  position: relative;
  padding: 15px 0;
}

/* 电池趋势样式 */
.battery-trend {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 180px;
  padding-bottom: 10px;
  position: relative;
}

/* 参考线样式 */
.reference-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.reference-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e0e0e0;
}

.reference-line span {
  position: absolute;
  left: 0;
  top: -10px;
  font-size: 11px;
  color: #999;
}

/* 电池数据点样式 */
.battery-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin: 0 5px;
  position: relative;
}

/* 时间标签 */
.time-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
}

/* 电池水平包装器 */
.battery-level-wrapper {
  flex: 1;
  width: 100%;
  max-width: 40px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  margin-bottom: 8px;
}

/* 电池水平条 */
.battery-level {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  position: relative;
  min-height: 10px;
}

/* 电池百分比 */
.battery-percentage {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

/* 充电状态指示器 */
.charging-indicator {
  position: absolute;
  top: -18px;
  right: -5px;
  background-color: #2196F3;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .records-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .battery-trend {
    height: 150px;
  }

  .battery-point {
    margin: 0 2px;
  }

  .battery-level-wrapper {
    max-width: 30px;
  }

  .time-label {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .battery-trend {
    height: 120px;
  }

  .battery-level-wrapper {
    max-width: 20px;
  }

  .reference-line span {
    display: none;
  }
}

.records-list {
  margin-bottom: 16px;
}

/* 骨架屏样式 */
.skeleton-list {
  width: 100%;
}

.skeleton-item {
  padding: 12px;
  margin-bottom: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid transparent;
}

.record-item {
  padding: 12px;
  margin-bottom: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.record-item:hover {
  background-color: #fff;
  border-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.record-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.record-icon {
  margin-right: 12px;
  color: #2196F3;
  font-size: 24px;
}

/* 记录项图片图标样式 */
.record-icon-img {
  margin-right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
  font-size: 24px;
}

.record-app-info {
  flex-grow: 1;
}

.record-app-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}

.record-project {
  font-size: 0.75rem;
  color: #666;
}

.record-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 6px;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #666;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.charging-text {
  color: #4CAF50;
}

.ip-text {
  font-family: monospace;
}

/* 使用洞察样式 */
.insights-container {
  padding: 16px;
}

.insights-summary {
  width: 100%;
}

.insight-card {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  margin-top: 15px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.insight-card:hover {
  background-color: #fff;
  border-color: #e0e0e0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.insight-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

/* 顶部应用列表 */
.top-apps {
  display: flex;
  flex-direction: column;

  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  gap: 8px;
}

.top-app-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.top-app-item:hover {
  background-color: #e8e8e8;
}

.app-rank {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2196F3;
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: bold;
  margin-right: 8px;
}

.app-icon {
  margin-right: 12px;
  color: #666;
  font-size: 20px;
}

/* 顶部应用图片图标样式 */
.app-icon-img {
  margin-right: 12px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  object-fit: cover;
}

.app-name {
  flex-grow: 1;
  font-size: 0.8rem;
  color: #333;
}

.app-total-duration {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
}

/* 时段分布 */
.time-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hour-label {
  width: 40px;
  font-size: 0.75rem;
  color: #666;
  text-align: right;
}

.bar-container {
  flex-grow: 1;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background-color: #2196F3;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.hour-count {
  width: 30px;
  font-size: 0.75rem;
  color: #666;
  text-align: center;
}

/* 电池趋势 */
.battery-trend-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}

.battery-trend {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 8px 0;
  min-width: fit-content;
}

.battery-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
}

.time-label {
  font-size: 0.7rem;
  color: #666;
  margin-bottom: 4px;
}

/* 父容器：控制图标与文本区横向对齐 */
.total-duration-info {
  display: flex;
  /* 横向排列子元素 */
  align-items: center;
  /* 垂直居中 */
  gap: 8px;
  /* 图标与文本区的间距，可调整 */
  /* 原有其他样式（如margin/padding）保留 */
}

/* 时间文本 + 右侧新增元素 的容器：横向排列 */
.duration-text-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  /* 时间文本与右侧新增元素的间距，可调整 */
}

/* 👉 右侧新增元素的样式（根据需求自定义） */
.right-element {
  display: flex;
  align-items: center;
  gap: 4px;
  /* 新增元素内部图标与文字的间距 */
  color: #666;
  /* 示例颜色，可调整 */
  font-size: 14px;
  /* 示例字号，可调整 */
}

/* 新增元素的图标样式（可选） */
.right-icon {
  color: #2196F3;
  /* 示例蓝色，可调整 */
}

.battery-level {
  width: 12px;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  margin-bottom: 4px;
}

.battery-percentage {
  font-size: 0.65rem;
  color: #666;
}

/* 移动端电池趋势响应式优化 */
@media (max-width: 600px) {
  .battery-trend {
    gap: 2px;
    height: 100px;
  }

  .battery-point {
    min-width: 30px;
  }

  .battery-level {
    width: 10px;
  }

  .time-label {
    font-size: 0.65rem;
  }

  .battery-percentage {
    font-size: 0.6rem;
  }
}

@media (max-width: 400px) {
  .battery-point {
    min-width: 25px;
  }

  .battery-level {
    width: 8px;
  }
}

/* 无数据状态 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-data-icon {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 16px;
}

.no-data-text {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 8px;
}

.no-data-subtext {
  font-size: 0.75rem;
  color: #999;
}

/* iOS风格分页样式 */
.ios-pagination {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.ios-pagination-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ios-pagination-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ccc;
  transition: all 0.3s ease;
  cursor: pointer;
}

.ios-pagination-dot.active {
  width: 24px;
  border-radius: 4px;
  background-color: #007aff;
  /* iOS蓝色 */
}

/* 平台信息样式 */
.platforms-container {
  padding: 16px;
}

.platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.platform-item {
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.platform-item:hover {
  background-color: #fff;
  border-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.platform-icon {
  margin-right: 8px;
  color: #2196F3;
}

.platform-info {
  flex-grow: 1;
}

.platform-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-icon {
  font-size: 1.25rem;
  color: #999;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-icon:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.detail-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  flex-shrink: 0;
  width: 100px;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.detail-value {
  flex-grow: 1;
  font-size: 0.875rem;
  color: #333;
  word-break: break-all;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .modal-content {
    max-width: 100%;
    margin: 16px;
  }

  .detail-label {
    width: 80px;
    font-size: 0.8rem;
  }

  .detail-value {
    font-size: 0.8rem;
  }
}


.platform-details {
  font-size: 0.75rem;
  color: #666;
}


/* 通用样式 */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.mdui-icon {
  vertical-align: middle;
  font-size: inherit;
}

/* 移动端触摸优化 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 防止文本选择导致的缩放 */
body {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 表单元素允许选择 */
input,
textarea,
select {
  -webkit-user-select: text;
  -khtml-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

/* 全局移动端水平滚动限制 */
:root {
  overflow-x: hidden;
  width: 100%;
}

body {
  overflow-x: hidden !important;
  width: 100% !important;
  position: relative;
}

/* 主容器水平滚动限制 */
.app-usage-records,
.insights-container,
.records-list,
.records-header,
.time-distribution,
.top-apps,
.filter-container,
.modal-content,
.modal-overlay,
.battery-trend-container,
.battery-trend {
  width: 100%;
  overflow-x: hidden !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 确保所有内容元素不超出屏幕宽度 */
.record-item,
.insight-card,
.top-app-item,
.time-bar,
.detail-item,
.record-header,
.record-details,
.record-meta,
.meta-item,
.duration-text-wrapper,
.ios-pagination-dots {
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}

/* 防止内容溢出的特定样式 */
.record-app-name,
.record-project,
.record-duration,
.record-time {
  word-break: break-word;
  max-width: 100%;
}

/* 触摸设备特定样式 - 仅限制组件内容，不影响全局滚动 */
@media (max-width: 768px) {
  .recent-activities-container {
    -webkit-overflow-scrolling: touch;
    overflow-x: hidden;
    max-width: 100%;
  }

  .recent-activities-container * {
    box-sizing: border-box;
    max-width: 100%;
    overflow-x: hidden;
  }

  /* 防止长按选择文本 */
  .recent-activities-container {
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}

/* 响应式设计 */
@media (max-width: 360px) {
  .platforms-grid {
    grid-template-columns: 1fr;
  }

  /* 小屏幕优化 */
  .filter-container {
    padding: 8px;
  }

  .record-item {
    padding: 12px 8px;
  }

  .insight-card {
    padding: 12px 8px;
  }

  .skeleton-list {
    padding: 0 8px;
  }
}

@media (min-width: 361px) and (max-width: 600px) {
  .platforms-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* 中等屏幕优化 */
  .filter-container {
    padding: 12px;
  }
}

@media (min-width: 601px) {
  .platforms-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 适配全面屏手机 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 16px);
  }
}
</style>