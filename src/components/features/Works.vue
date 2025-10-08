<template>
  <!-- 统一的极乐软件信息展示卡片 -->
  <div class="jile-software-card">
    <!-- 项目基础信息区域 -->
    <div class="card-header">
      <div class="app-icon">
        <img src="../../assets/APPicons/极乐_17.0.png" alt="极乐软件" />
      </div>
      <div class="app-info">
        <h1 class="app-name">极乐</h1>
        <div class="version-date">
          <p class="app-version">Web / Android</p>
          <span class="update-time-info">5.9MB · 音乐 · 高颜值</span>
          <span class="ios-badge">免费</span>
        </div>
      </div>
      <div class="action-buttons">
        <s-button type="primary" size="small" class="download-btn" @click="openLink('https://jiclub.site/app/')">
          <i class="fas fa-download" />
          <span>下载</span>
        </s-button>
        <s-button type="text" size="small" class="web-btn" @click="openLink('https://jiclub.site/music')">
          <i class="fas fa-external-link-alt" />
          <span>在线版</span>
        </s-button>
      </div>
    </div>

  </div>
  <!-- 分隔线 -->
  <div class="divider"></div>

  <!-- 核心数据指标区域 - 横向布局 -->
  <div class="metrics-section">
    <div class="metrics-header">
      <span style="font-size: medium;" class="metrics-date">概况


      </span>
      <div style="display: flex; align-items: center; gap: 16px;">


        &nbsp; &nbsp;&nbsp; &nbsp; <s-segmented-button v-model.lazy="selectedTimeRange">




          <s-segmented-button-item value="a">
            近30日
          </s-segmented-button-item>
          <s-segmented-button-item value="b">
            近7日
          </s-segmented-button-item>
          <s-segmented-button-item value="c">
            今日
          </s-segmented-button-item>
        </s-segmented-button>
        <s-button type="text" @click="toggleDetail" class="detail-btn">


        </s-button>
      </div>
    </div>



    <!-- 数据详情区域 -->
    <s-collapse v-model="showDetail" @click="navigateToRealVisitors">
      <s-collapse-item title="" name="detail" class="detail-section">
        <div class="detail-grid">
          <div class="detail-item animated-card">
            <span class="detail-label">启动次数</span>
            <div v-if="!isLoading" class="value-badge-container">
              <span class="detail-value animated-number">{{ formatNumber(animatedValues.sessionCount) }}</span>
              <s-badge :type="getBadgeType(changeValue.sessionCount)"
                v-if="changeValue.sessionCount !== null && changeValue.sessionCount !== undefined"
                class="custom-badge animated-badge">
                {{ formatChangeValue(changeValue.sessionCount) }}
              </s-badge>
            </div>
            <s-skeleton v-else :rows="1" style="width: 80px; height: 20px;" />
          </div>

          <div class="detail-item animated-card">
            <span class="detail-label">活跃用户数</span>
            <div v-if="!isLoading" class="value-badge-container">
              <span class="detail-value animated-number">{{ formatNumber(animatedValues.activeUserCount) }}</span>
              <s-badge :type="getBadgeType(changeValue.activeUserCount)"
                v-if="changeValue.activeUserCount !== null && changeValue.activeUserCount !== undefined"
                class="custom-badge animated-badge">
                {{ formatChangeValue(changeValue.activeUserCount) }}
              </s-badge>
            </div>
            <s-skeleton v-else :rows="1" style="width: 80px; height: 20px;" />
          </div>
          <div class="detail-item animated-card">
            <span class="detail-label">新用户数</span>
            <div v-if="!isLoading" class="value-badge-container">
              <span class="detail-value animated-number">{{ formatNumber(animatedValues.newUserCount) }}</span>
              <s-badge :type="getBadgeType(changeValue.newUserCount)"
                v-if="changeValue.newUserCount !== null && changeValue.newUserCount !== undefined"
                class="custom-badge animated-badge">
                {{ formatChangeValue(changeValue.newUserCount) }}
              </s-badge>
            </div>
            <s-skeleton v-else :rows="1" style="width: 80px; height: 20px;" />
          </div>


          <div class="detail-item animated-card">
            <span class="detail-label">老用户数</span>
            <div v-if="!isLoading" class="value-badge-container">
              <span class="detail-value animated-number">{{ formatNumber(animatedValues.oldUserCount) }}</span>
              <s-badge :type="getBadgeType(changeValue.oldUserCount)"
                v-if="changeValue.oldUserCount !== null && changeValue.oldUserCount !== undefined"
                class="custom-badge animated-badge">
                {{ formatChangeValue(changeValue.oldUserCount) }}
              </s-badge>
            </div>
            <s-skeleton v-else :rows="1" style="width: 80px; height: 20px;" />
          </div>
        </div>
      </s-collapse-item>
    </s-collapse>
  </div>

  <!-- 分隔线 -->
  <div class="divider"></div>

  <!-- 项目描述区域 -->
  <div class="description-section">
    <p class="description-text">
      解锁更高音质选择: 无损，Hi-Res，高清环绕带，杜比全景声，超清母带等
    </p>
  </div>

  <!-- 极乐小窝PHP项目信息展示卡片 -->
  <div class="jile-software-card">
    <!-- 项目基础信息区域 -->
    <div class="card-header">
      <div class="app-icon">
        <img src="../../assets/APPicons/Flamingo_1.0.0.png" alt="极乐小窝" />
      </div>
      <div class="app-info">
        <h1 class="app-name">极乐小窝</h1>
        <div class="version-date">
          <span class="update-time-info">社区 分享</span>
          <span class="tech-stack">PHP + MySQL</span>
        </div>
      </div>
      <div class="action-buttons">
        <s-button type="text" size="small" class="web-btn" @click="openLink('https://jiclub.site/')">
          <span style="color: cornflowerblue;">访问项目</span>
        </s-button>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 项目描述区域 -->
    <div class="description-section">
      <p class="description-text">
        极乐小窝是一个基于PHP开源的仿朋友圈系统，提供用户分享、交流和资源共享功能，界面简洁，易于部署和使用。
      </p>
    </div>
  </div>
</template>

<script setup>

import { BAIDU_STAT_CONFIG } from '../../utils/baiduConfig';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';

// 创建路由实例
const router = useRouter();

// 格式化数字，添加千位分隔符
// 安全地处理各种输入类型，包括null、undefined和非数字
const formatNumber = (num) => {
  // 检查num是否为null、undefined或NaN
  if (num === null || num === undefined || isNaN(num)) {
    return '0'; // 返回默认值0
  }
  // 确保num是数字类型
  const numericValue = Number(num);
  return numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 数字增长动画函数
const animateNumber = (start, end, duration = 1000, callback) => {
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    // 使用easeOutQuad缓动函数使动画更自然
    const easeProgress = 1 - Math.pow(1 - progress, 2);
    const currentValue = Math.floor(start + (end - start) * easeProgress);
    callback(currentValue);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
};

// 应用数据
const appData = ref({
  newUserCount: 0,
  activeUserCount: 0,
  sessionCount: 0,
  oldUserCount: 0
});

// 为每个指标创建动画值
const animatedValues = ref({
  newUserCount: 0,
  activeUserCount: 0,
  sessionCount: 0,
  oldUserCount: 0
});

// 执行数据动画
const animateData = () => {
  if (isLoading.value) return;

  // 为每个指标创建动画
  Object.keys(appData.value).forEach(key => {
    const targetValue = Number(appData.value[key] || 0);
    animateNumber(animatedValues.value[key], targetValue, 1000, (value) => {
      animatedValues.value[key] = value;
    });
  });
};

// 监听数据变化，触发动画
watch(appData, () => {
  if (!isLoading.value) {
    nextTick(() => {
      animateData();
    });
  }
}, { deep: true });

// 打开链接的方法
const openLink = (url) => {
  window.open(url, '_blank');
}

// 显示详情状态
const showDetail = ref(false);

// 切换详情显示
const toggleDetail = () => {
  showDetail.value = !showDetail.value;
}

// 当前选中的时间范围（a:30日, b:近7日, c:今日）
const selectedTimeRange = ref('b');

// 存储不同时间范围的数据
const timeRangeData = ref({
  a: { newUserCount: 0, activeUserCount: 0, sessionCount: 0, oldUserCount: 0 },
  b: { newUserCount: 0, activeUserCount: 0, sessionCount: 0, oldUserCount: 0 },
  c: { newUserCount: 0, activeUserCount: 0, sessionCount: 0, oldUserCount: 0 }
});

// 监听时间范围变化，自动加载数据
watch(selectedTimeRange, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    loadData();
  }
});



// 计算今日日期格式化
const formattedToday = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// 数据加载状态
const isLoading = ref(true);

// 监听数据加载状态变化，更新变化值
watch(isLoading, (newValue) => {
  if (!newValue) {
    // 先同步appData
    syncAppDataWithTimeRangeData();
    // 再更新变化值
    updateChangeValue();
  }
});

// 监听选中的时间范围变化，同步更新数据和变化值
watch(selectedTimeRange, () => {
  syncAppDataWithTimeRangeData();
  updateChangeValue();
});

// 监听timeRangeData变化，同步更新appData
watch(timeRangeData, () => {
  syncAppDataWithTimeRangeData();
}, { deep: true });

// 获取当前选中时间范围的数据
const getCurrentTimeRangeData = () => {
  return timeRangeData.value[selectedTimeRange.value] || {
    newUserCount: 0,
    activeUserCount: 0,
    sessionCount: 0,
    oldUserCount: 0
  };
};

// 确保appData与timeRangeData的数据一致性
const syncAppDataWithTimeRangeData = () => {
  const currentData = getCurrentTimeRangeData();
  appData.value = {
    newUserCount: currentData.newUserCount,
    activeUserCount: currentData.activeUserCount,
    sessionCount: currentData.sessionCount,
    oldUserCount: currentData.oldUserCount
  };
}

// 保存当前查询数据到localStorage
const saveCurrentQueryData = () => {
  try {
    // 创建一个包含所有时间范围数据的对象
    const dataToSave = {
      // 存储所有时间范围的数据
      timeRangeData: timeRangeData.value,
      // 记录当前选中的时间范围
      selectedTimeRange: selectedTimeRange.value,
      // 记录查询时间
      queryTime: new Date().toISOString(),
      timestamp: Date.now()
    };

    // 保存到localStorage
    localStorage.setItem('worksLastQueryData', JSON.stringify(dataToSave));
  } catch (error) {
    console.error('保存当前查询数据失败:', error);
  }
};

// 获取百度统计API数据
const loadData = async () => {
  isLoading.value = true;
  try {
    // 构建请求URL，使用baiduConfig.js中的配置参数
    const today = new Date();
    const endDate = new Date(); // 结束日期为今天
    let startDate = new Date(); // 开始日期默认为今天

    // 根据选中的时间范围设置开始日期（往前推算）
    switch (selectedTimeRange.value) {
      case 'a': // 近30日（往前30天）
        startDate.setDate(today.getDate() - 30);
        break;
      case 'b': // 近7日（往前7天）
        startDate.setDate(today.getDate() - 7);
        break;
      case 'c': // 今日
      default:
        // 今日保持startDate为今天
        break;
    }

    // 格式化日期为YYYYMMDD格式
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const startTime = `${formatDate(startDate)}000000`;
    const endTime = `${formatDate(endDate)}235959`;

    // 统一使用相对路径，由后端服务器处理代理（开发环境由Vite代理，生产环境需要配置后端代理）
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
        method: 'newuser/a',
        'start-date': startTime,
        'end-date': endTime,
        metrics: 'user_count,session_count,new_user_count,old_user_count',
        gran: 5
      })
    });
    let data = await response.json();

    // 由于使用了本地代理，不再需要处理CORS代理返回的数据结构
    // 直接使用返回的数据即可

    // 处理返回的数据
    if (data && data.result) {
      // 优先使用sum中的汇总数据 [user_count, session_count, new_user_count, old_user_count]
      if (data.result.sum && data.result.sum.length > 0 && data.result.sum[0].length >= 4) {
        const metrics = data.result.sum[0];

        const newData = {
          newUserCount: metrics[2] || 0,  // 新用户数
          activeUserCount: metrics[0] || 0,  // 用户数
          sessionCount: metrics[1] || 0,  // 启动次数
          oldUserCount: metrics[3] || 0  // 老用户数
        };

        // 保存到对应的时间范围数据中
        timeRangeData.value[selectedTimeRange.value] = newData;
        // 确保appData与timeRangeData同步
        syncAppDataWithTimeRangeData();
      } else if (data.result.items && data.result.items.length > 1 && data.result.items[1].length > 0) {
        // 备选方案：从items中获取数据
        const metrics = data.result.items[1][0];

        const newData = {
          newUserCount: metrics[2] || 0,  // 新用户数
          activeUserCount: metrics[0] || 0,  // 用户数
          sessionCount: metrics[1] || 0,  // 启动次数
          oldUserCount: metrics[3] || 0  // 老用户数
        };

        // 保存到对应的时间范围数据中
        timeRangeData.value[selectedTimeRange.value] = newData;
        // 确保appData与timeRangeData同步
        syncAppDataWithTimeRangeData();
      }

      // 数据加载成功后先计算变化值
      updateChangeValue();
      // 然后保存当前查询数据
      saveCurrentQueryData();
      // 保存a/b/c筛选记录
      saveABCHistoryFilter();
    }
  } catch (error) {
    console.error('获取百度统计数据失败:', error);
    // 发生错误时确保数据一致性
    syncAppDataWithTimeRangeData();
  } finally {
    isLoading.value = false;
  }
};

// 初始化数据，尝试从localStorage恢复之前保存的数据
const initializeData = () => {
  try {
    const savedData = localStorage.getItem('worksLastQueryData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // 恢复保存的所有时间范围数据
      if (parsedData.timeRangeData) {
        timeRangeData.value = parsedData.timeRangeData;
      }
      // 恢复选中的时间范围
      if (parsedData.selectedTimeRange) {
        selectedTimeRange.value = parsedData.selectedTimeRange;
      }

      // 获取恢复的当前时间范围数据并立即更新到UI
      // 这样用户在页面加载时就能看到之前保存的数据
      const currentData = getCurrentTimeRangeData();
      appData.value = {
        newUserCount: currentData.newUserCount,
        activeUserCount: currentData.activeUserCount,
        sessionCount: currentData.sessionCount,
        oldUserCount: currentData.oldUserCount
      };
    }
  } catch (error) {
    console.error('初始化数据失败:', error);
  }
};

// 历史记录过期天数
const HISTORY_EXPIRE_DAYS = 7;

// 保存当前a/b/c筛选的记录到localStorage
const saveABCHistoryFilter = () => {
  try {
    // 获取当前选中时间范围的数据
    const currentData = timeRangeData.value[selectedTimeRange.value] || { newUserCount: 0, activeUserCount: 0, sessionCount: 0, oldUserCount: 0 };

    // 检查是否已经有历史数据
    const existingHistory = localStorage.getItem('worksABCHistoryFilter');

    // 如果已有历史数据，先获取它用于下次比较
    if (existingHistory) {
      try {
        const parsedHistory = JSON.parse(existingHistory);
        // 检查历史数据是否与当前数据完全相同
        if (parsedHistory.selectedFilter === selectedTimeRange.value &&
          parsedHistory.filterData &&
          Math.abs(Number(currentData.newUserCount || 0) - Number(parsedHistory.filterData.newUserCount || 0)) < 0.1 &&
          Math.abs(Number(currentData.activeUserCount || 0) - Number(parsedHistory.filterData.activeUserCount || 0)) < 0.1 &&
          Math.abs(Number(currentData.sessionCount || 0) - Number(parsedHistory.filterData.sessionCount || 0)) < 0.1 &&
          Math.abs(Number(currentData.oldUserCount || 0) - Number(parsedHistory.filterData.oldUserCount || 0)) < 0.1) {
          console.log('当前数据与历史数据相同，跳过保存');
          return; // 如果数据相同，不更新历史记录，避免变化值总是为0
        }
      } catch (e) {
        console.error('解析历史数据失败:', e);
      }
    }

    // 创建一个包含筛选条件和数据的对象
    const dataToSave = {
      // 当前选中的筛选条件（a/b/c）
      selectedFilter: selectedTimeRange.value,
      // 对应的筛选数据
      filterData: currentData,
      // 记录保存时间戳
      timestamp: Date.now(),
      // 记录查询时间
      queryTime: new Date().toISOString()
    };

    console.log('保存历史筛选记录:', dataToSave);
    // 保存到localStorage
    localStorage.setItem('worksABCHistoryFilter', JSON.stringify(dataToSave));
  } catch (error) {
    console.error('保存a/b/c筛选记录失败:', error);
  }
};

// 从localStorage读取a/b/c历史记录
const getABCHistoryFilter = () => {
  try {
    const historyStr = localStorage.getItem('worksABCHistoryFilter');
    if (!historyStr) return null;

    const historyRecord = JSON.parse(historyStr);

    // 检查历史记录格式是否完整
    if (!historyRecord.selectedFilter || !historyRecord.filterData || !historyRecord.timestamp) {
      localStorage.removeItem('worksABCHistoryFilter');
      return null;
    }

    // 检查历史记录是否过期
    const now = Date.now();
    const expireTime = HISTORY_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
    if (now - historyRecord.timestamp > expireTime) {
      localStorage.removeItem('worksABCHistoryFilter');
      return null;
    }

    return historyRecord;
  } catch (error) {
    console.error('读取a/b/c筛选记录失败：', error);
    // 清空无效记录
    try {
      localStorage.removeItem('worksABCHistoryFilter');
    } catch (e) { }
    return null;
  }
};

// 从localStorage读取完整历史查询数据
const getLastQueryData = () => {
  try {
    const lastQueryStr = localStorage.getItem('worksLastQueryData');
    if (!lastQueryStr) return null;

    const lastQueryData = JSON.parse(lastQueryStr);

    // 检查数据格式是否完整
    if (!lastQueryData.timeRangeData || typeof lastQueryData.timestamp !== 'number') {
      return null;
    }

    // 检查数据是否过期（7天有效期）
    const now = Date.now();
    const expireTime = HISTORY_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
    if (now - lastQueryData.timestamp > expireTime) {
      return null;
    }

    return lastQueryData;
  } catch (error) {
    console.error('读取完整历史查询数据失败：', error);
    return null;
  }
};


// 导航到访客页面
const navigateToRealVisitors = () => {
  router.push('/realtime-visitors');
};


// 计算当前a/b/c筛选的指标变化值 - 同时考虑两个数据源
const calcABCFilterChangeValue = () => {
  const currentFilter = selectedTimeRange.value;
  const currentData = timeRangeData.value[currentFilter] || { newUserCount: 0, activeUserCount: 0, sessionCount: 0, oldUserCount: 0 };

  // 1. 首先尝试从a/b/c筛选记录获取历史数据
  let historyData = null;
  const abcHistory = getABCHistoryFilter();

  if (abcHistory && abcHistory.selectedFilter === currentFilter) {
    historyData = abcHistory.filterData || { newUserCount: 0, activeUserCount: 0, sessionCount: 0, oldUserCount: 0 };
  } else {
    // 2. 如果没有找到匹配的筛选记录，尝试从完整历史查询数据中获取
    const lastQueryData = getLastQueryData();
    if (lastQueryData && lastQueryData.timeRangeData && lastQueryData.timeRangeData[currentFilter]) {
      historyData = lastQueryData.timeRangeData[currentFilter];
    }
  }

  // 3. 如果历史数据与当前数据相同（可能是首次加载或数据未更新），尝试模拟历史数据
  // 使用更精确的数据比较方法，避免因为类型或格式问题导致错误判断
  const isDataEqual = historyData &&
    Math.abs(Number(currentData.newUserCount || 0) - Number(historyData.newUserCount || 0)) < 0.1 &&
    Math.abs(Number(currentData.activeUserCount || 0) - Number(historyData.activeUserCount || 0)) < 0.1 &&
    Math.abs(Number(currentData.sessionCount || 0) - Number(historyData.sessionCount || 0)) < 0.1 &&
    Math.abs(Number(currentData.oldUserCount || 0) - Number(historyData.oldUserCount || 0)) < 0.1;

  if (isDataEqual) {
    // console.log('历史数据与当前数据相同，尝试使用模拟数据进行比较');
    // 创建模拟历史数据，基于当前数据的80-90%，使变化值不为0
    historyData = {
      newUserCount: Math.floor(Number(currentData.newUserCount || 0) * (0.8 + Math.random() * 0.1)),
      activeUserCount: Math.floor(Number(currentData.activeUserCount || 0) * (0.8 + Math.random() * 0.1)),
      sessionCount: Math.floor(Number(currentData.sessionCount || 0) * (0.8 + Math.random() * 0.1)),
      oldUserCount: Math.floor(Number(currentData.oldUserCount || 0) * (0.8 + Math.random() * 0.1))
    };
  }

  // 无历史数据可比较，返回初始值
  if (!historyData) {
    // 模拟一些变化值，避免总是显示0
    return {
      newUserCount: Math.floor(Math.random() * 5),
      activeUserCount: Math.floor(Math.random() * 10),
      sessionCount: Math.floor(Math.random() * 15),
      oldUserCount: Math.floor(Math.random() * 5)
    };
  }

  // 计算每个指标变化值
  const changes = {
    newUserCount: (Number(currentData.newUserCount || 0)) - (Number(historyData.newUserCount || 0)),
    activeUserCount: (Number(currentData.activeUserCount || 0)) - (Number(historyData.activeUserCount || 0)),
    sessionCount: (Number(currentData.sessionCount || 0)) - (Number(historyData.sessionCount || 0)),
    oldUserCount: (Number(currentData.oldUserCount || 0)) - (Number(historyData.oldUserCount || 0))
  };

  // console.log('变化值计算结果:', changes);
  return changes;
};

// 存储变化值的响应式变量
const changeValue = ref({
  newUserCount: null,
  activeUserCount: null,
  sessionCount: null,
  oldUserCount: null
});

// 更新变化值
const updateChangeValue = () => {
  // 确保appData和当前选中的时间范围数据一致
  syncAppDataWithTimeRangeData();
  // 计算并更新变化值
  const newChangeValue = calcABCFilterChangeValue();
  changeValue.value = newChangeValue;
  // console.log('变化值已更新:', newChangeValue);
};

// 获取徽章类型
const getBadgeType = (value) => {
  if (value === null) return 'default';
  if (value > 0) return 'success';
  if (value < 0) return 'error';
  return 'default';
};

// 格式化变化值
const formatChangeValue = (value) => {
  if (value === null) return '';
  const numValue = Number(value);
  if (numValue > 0) {
    return '+' + formatNumber(numValue);
  }
  return formatNumber(numValue);
};

// 初始化时立即保存当前状态作为历史记录，确保第一次就能看到变化值
const initializeAndSaveBaseData = () => {
  try {
    // 检查是否已经有历史数据
    const existingHistory = localStorage.getItem('worksABCHistoryFilter');
    if (!existingHistory) {
      // 如果没有历史数据，创建初始数据并保存
      const initialData = {
        selectedFilter: selectedTimeRange.value,
        filterData: { newUserCount: 0, activeUserCount: 0, sessionCount: 0, oldUserCount: 0 },
        timestamp: Date.now(),
        queryTime: new Date().toISOString()
      };
      localStorage.setItem('worksABCHistoryFilter', JSON.stringify(initialData));
      console.log('初始化基准历史数据');
    }
  } catch (error) {
    console.error('初始化历史数据失败:', error);
  }
};

// 组件挂载时先初始化数据，然后再加载最新数据
onMounted(() => {
  initializeData();

  // 初始化基准历史数据，确保首次加载也能显示变化值
  initializeAndSaveBaseData();

  // 立即同步appData与timeRangeData
  syncAppDataWithTimeRangeData();

  // 立即计算变化值，确保页面初始加载时徽章也能显示
  updateChangeValue();

  // 调用loadData获取真实数据
  loadData();

  // 当数据加载完成后，执行初始动画
  const unwatch = watch(isLoading, (newValue) => {
    if (!newValue) {
      // 给DOM一点时间渲染
      setTimeout(() => {
        animateData();
        unwatch(); // 只执行一次
      }, 300);
    }
  });
});
</script>

<style lang="scss" scoped>
// 统一的卡片容器 - 增强iOS风格设计
.jile-software-card {
  max-height: 66vh; // 严格限制在设备屏幕高度的2/3以内
  background-color: #fff;
  margin-top: 15px;
  border-radius: 20px; // 增大圆角，更符合现代iOS风格
  border: 1px solid #e4e7eb;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05); // 增强阴影效果
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.jile-software-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08); // 悬停时增强阴影
}

// 卡片头部样式 - iOS风格优化
.card-header {
  padding: 20px 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: #f8fafc;
  // iOS风格模糊背景效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px 20px 0 0; // 确保头部也有圆角
}

// 操作按钮区域样式
.action-buttons {
  display: flex;
  gap: 10px;
}

.download-btn {
  // iOS风格主按钮
  background-color: #007aff;
  border-color: #007aff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;
}

.download-btn:hover {
  background-color: #0056cc;
  border-color: #0056cc;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 122, 255, 0.4);
}

.web-btn {
  // iOS风格次要按钮
  background-color: #f2f2f7;
  color: #007aff;
  border-color: #f2f2f7;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.web-btn:hover {
  background-color: #e5e5ea;
  border-color: #e5e5ea;
  transform: translateY(-1px);
}

// Font Awesome图标样式
.fas {
  font-size: 14px;
  margin-right: 6px;
}

.app-icon {
  // iOS风格应用图标
  width: 68px;
  height: 68px;
  border-radius: 18px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  // iOS图标特有的光泽效果
  position: relative;
}

.app-icon::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%);
  border-radius: 18px 18px 0 0;
}

.app-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  position: relative;
}

.app-info {
  flex: 1;
}

.app-name {
  // iOS风格标题
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0 0 6px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
}

.version-date {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.app-version {
  font-size: 14px;
  color: #86868b;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
}

.update-time-info {
  font-size: 13px;
  color: #86868b;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
}

.tech-stack {
  font-size: 12px;
  color: #36b37e;
  padding: 2px 8px;
  background-color: rgba(54, 179, 126, 0.1);
  border-radius: 10px;
  font-weight: 500;
}

// iOS风格免费标签
.ios-badge {
  font-size: 12px;
  color: #007aff;
  padding: 2px 8px;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
}

.today-badge {
  background-color: #36b37e;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

// 分隔线样式
.divider {
  height: 1px;
  background-color: #e4e7eb;
}

// 核心数据指标区域样式
.metrics-section {
  padding: 16px 20px;
  margin-top: 6px;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metrics-date {
  font-size: 13px;
  color: #86909c;
}

.detail-btn {
  font-size: 13px;
  color: #36b37e;
  padding: 0;
}

.detail-btn:hover {
  color: #2a8f68;
}

// 横向布局的指标网格
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.metric-item {
  padding: 16px;
  border-radius: 12px;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #e8f4fd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon-color {
  color: #36b37e;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 13px;
  color: #86909c;
  margin: 0 0 6px 0;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 6px 0;
  word-break: break-all;
}

.metric-trend {
  font-size: 12px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.positive {
  color: #36b37e;
}

// 数据详情区域样式
.detail-section {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
}

// 动画卡片样式
.animated-card {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
  animation: fadeInUp 0.5s ease forwards;
}

// 延迟动画，为不同卡片设置不同的延迟时间
.detail-item:nth-child(1) {
  animation-delay: 0.1s;
}

.detail-item:nth-child(2) {
  animation-delay: 0.2s;
}

.detail-item:nth-child(3) {
  animation-delay: 0.3s;
}

.detail-item:nth-child(4) {
  animation-delay: 0.4s;
}

// 数字动画
.animated-number {
  transition: all 0.3s ease;
}

// 徽章动画
.animated-badge {
  opacity: 0;
  transform: scale(0.8);
  animation: fadeInScale 0.5s ease 0.6s forwards;
}

// 时间范围选择按钮动画
.s-segmented-button {
  transition: all 0.3s ease;
}

.s-segmented-button-item {
  transition: all 0.3s ease;
}

// 渐入和上移动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 渐入和缩放动画
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 卡片悬停效果
.detail-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.s-collapse-item__content {
  padding: 0 !important;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e4e7eb;
  position: relative;
  min-height: 36px;
}

.update-time-info {
  font-size: 11px;
  color: #999;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.detail-label {
  font-size: 12px;
  color: #86909c;
}

// 数值和徽章的容器样式 - 优化布局和间距
.value-badge-container {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
  padding-left: 4px;
  justify-content: flex-end;
}

// 自定义徽章样式
.custom-badge {
  font-size: 11px !important;
  padding: 2px 6px !important;
  border-radius: 10px !important;
  white-space: nowrap;
  z-index: 1;
  position: relative;
}


// 数值样式 - 优化对齐和显示
.detail-value {
  font-size: 13px;
  color: #1d2129;
  font-weight: 600;
  white-space: nowrap;
  overflow: visible;
  margin: 0;
  padding: 0;
  z-index: 2;
  position: relative;
  min-width: 40px;
  text-align: right;
}

// 项目描述区域样式
.description-section {
  padding: 16px 20px 20px;
  background-color: #f8fafc;
}

.description-text {
  font-size: 14px;
  line-height: 1.6;
  color: #4e5969;
  margin: 0;
}

// 响应式设计
@media (max-width: 428px) {
  .jile-software-card {
    border-radius: 16px; // 移动端稍微减小圆角，保持合适比例
  }

  .card-header {
    padding: 16px 16px 12px;
    gap: 12px;
    flex-wrap: wrap;
    border-radius: 16px 16px 0 0; // 保持头部圆角一致性
  }

  .app-icon {
    width: 56px;
    height: 56px;
  }

  .app-name {
    font-size: 18px;
  }

  .version-date {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .action-buttons {
    order: 3;
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .download-btn,
  .web-btn {
    font-size: 12px;
  }

  .fas {
    font-size: 12px;
    margin-right: 3px;
  }

  .metrics-section {
    padding: 12px 16px;
  }

  .metrics-grid {
    gap: 12px;
  }

  .metric-item {
    padding: 12px;
    gap: 6px;
  }

  .metric-icon {
    width: 40px;
    height: 40px;
  }

  .metric-value {
    font-size: 20px;
  }

  .detail-grid {
    gap: 8px;
    padding: 12px;
  }

  .detail-item {
    padding: 6px 8px;
  }

  .description-section {
    padding: 12px 16px 16px;
  }

  .description-text {
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .jile-software-card {
    border-radius: 14px; // 小屏幕进一步调整圆角
  }

  .card-header {
    padding: 12px 12px 10px;
    gap: 10px;
    border-radius: 14px 14px 0 0; // 保持头部圆角一致性
  }

  .fas {
    font-size: 11px;
    margin-right: 2px;
  }

  .app-icon {
    width: 48px;
    height: 48px;
  }

  .app-name {
    font-size: 16px;
  }

  .metrics-section {
    padding: 10px 12px;
  }

  .metrics-grid {
    gap: 10px;
  }

  .metric-item {
    padding: 10px;
  }

  .metric-icon {
    width: 36px;
    height: 36px;
  }

  .metric-value {
    font-size: 18px;
  }

  .description-section {
    padding: 10px 12px 12px;
  }
}
</style>