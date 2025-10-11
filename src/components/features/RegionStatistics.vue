<template>
  <!-- 骨架屏 -->
  <div v-if="loading" class="region-stats-skeleton">
    <div style="margin: 30px;" v-for="index in 5" :key="`skeleton-${index}`">
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

  <!-- 错误状态 -->
  <div v-else-if="error" class="error-container">
    <p>{{ error }}</p>
    <button @click="fetchRegionData" class="retry-button">重试</button>
  </div>

  <!-- 地域统计内容 -->
  <div v-else class="region-stats-content">
    <!-- 头部信息 -->

    <div class="metrics-header">
      <span style="font-size: medium;" class="metrics-date">总启动</span>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="total-views">
          累计: <span class="total-count animated-number">{{ formatNumber(animatedTotalSessions || totalSessions)
          }}</span>
        </div>
        <div class="time-span">
          {{ timeSpan }}
        </div>
      </div>
    </div>
    <s-divider style="margin-bottom: 5px;">数据来源于百度移动统计</s-divider>

    <!-- 地域统计容器 -->
    <div class="region-stats-container">
      <!-- iOS 风格分页控件 -->
      <div class="pagination-controls" v-if="totalPages > 1">

        <div class="pagination-dots">
          <button v-for="page in totalPages" :key="page" class="pagination-dot"
            :class="{ 'active': currentPage === page }" @click="goToPage(page)"></button>
        </div>


      </div>
      <!-- 详细列表区域 -->
      <div class="region-list-section">
        <div class="list-header">
          <div class="header-item rank">排名</div>
          <div class="header-item region">地区</div>
          <div class="header-item count">启动次数</div>
          <div class="header-item percentage">占比</div>
        </div>

        <div class="region-list">
          <div v-for="item in paginatedData" :key="item.region" class="region-item animated-card"
            :class="{ 'top-region': isTopRegion(item) }">
            <div class="item-data rank">
              <span class="rank-number" :class="getRankClass(item)">
                {{ getActualRank(item) }}
              </span>
            </div>
            <div class="item-data region">
              <span class="region-name">{{ item.region }}</span>
            </div>
            <div class="item-data count">
              <span class="visit-count">
                <span class="count-number animated-number">{{ formatNumber(animatedRegionData[item.region]?.sessionCount
                  || item.sessionCount) }}</span>
                <span class="count-unit">次</span>
              </span>
            </div>
            <div class="item-data percentage">
              <div class="percentage-bar">
                <div class="percentage-fill animated-bar"
                  :style="{ width: (animatedRegionData[item.region]?.percentage || item.percentage) * 3 + '%' }"></div>
              </div>
              <span class="percentage-text animated-number">{{
                formatPercentage(animatedRegionData[item.region]?.percentage || item.percentage) }}</span>
            </div>
          </div>
        </div>


      </div>

    </div>



    <div class="region-chart-section">
      <span style="font-size: medium;margin-top: 18px;" class="metrics-date">地域分布</span>
      <!-- 地图区域 -->
      <div class="chart-container" ref="chinaChart" id="mapArea"></div>
    </div>

  </div>




</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { BAIDU_STAT_CONFIG } from '../../utils/baiduConfig.js';
import * as echarts from 'echarts';
import chinaJson from '../../utils/地图.json';

// 状态管理
const loading = ref(true);
const error = ref('');
const regionData = ref([]); // 完整数据
const totalSessions = ref(0);
const timeSpan = ref('');
const chinaChart = ref(null);
let chartInstance = null;

// 动画相关状态
const animatedTotalSessions = ref(0);
const animatedRegionData = ref({});

// 分页相关状态
const currentPage = ref(1);
const itemsPerPage = ref(7); // 每页固定展示5条数据

// 计算当前页显示的数据
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return regionData.value.slice(startIndex, endIndex);
});

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(regionData.value.length / itemsPerPage.value);
});

// 切换到指定页
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// 获取实际排名（不是当前页的索引）
const getActualRank = (item) => {
  return regionData.value.findIndex(data => data.region === item.region) + 1;
};

// 判断是否是前三名
const isTopRegion = (item) => {
  const actualRank = getActualRank(item);
  return actualRank <= 3;
};

// 获取排名样式
const getRankClass = (item) => {
  const actualRank = getActualRank(item);
  if (actualRank === 1) return 'rank-gold';
  if (actualRank === 2) return 'rank-silver';
  if (actualRank === 3) return 'rank-bronze';
  return '';
};

// 初始化地图
const initMap = () => {
  if (!chinaChart.value || regionData.value.length === 0) return;

  // 销毁已存在的图表实例
  if (chartInstance && typeof chartInstance === 'object' && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy();
    chartInstance = null;
  }

  // 初始化图表实例
  chartInstance = echarts.init(chinaChart.value);

  // 注册地图
  echarts.registerMap('china', chinaJson);

  // 准备地区名称映射 - 确保统计数据中的地区名称与地图数据匹配
  const regionNameMap = {
    '广东': '广东省',
    '河南': '河南省',
    '山东': '山东省',
    '江苏': '江苏省',
    '湖南': '湖南省',
    '四川': '四川省',
    '河北': '河北省',
    '广西': '广西壮族自治区',
    '湖北': '湖北省',
    '安徽': '安徽省',
    '江西': '江西省',
    '北京': '北京市',
    '浙江': '浙江省',
    '福建': '福建省',
    '陕西': '陕西省',
    '辽宁': '辽宁省',
    '山西': '山西省',
    '重庆': '重庆市',
    '贵州': '贵州省',
    '云南': '云南省',
    '上海': '上海市',
    '黑龙江': '黑龙江省',
    '内蒙古': '内蒙古自治区',
    '新疆': '新疆维吾尔自治区',
    '甘肃': '甘肃省',
    '吉林': '吉林省',
    '天津': '天津市',
    '海南': '海南省',
    '宁夏': '宁夏回族自治区',
    '青海': '青海省',
    '香港': '香港特别行政区',
    '西藏': '西藏自治区',
    '台湾': '台湾省',
    '澳门': '澳门特别行政区'
  };

  // 准备地图数据 - 使用完整的地区名称进行匹配
  const mapData = regionData.value.map(item => ({
    name: regionNameMap[item.region] || item.region, // 使用映射后的完整名称，如果没有映射则使用原名称
    value: item.sessionCount,
    percentage: item.percentage,
    shortName: item.region // 保存简称用于tooltip显示
  }));

  // 设置图表配置
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        // 使用shortName显示地区简称，这样更简洁明了
        const displayName = params.data.shortName || params.name;
        return `${displayName}<br/>启动次数: ${formatNumber(params.value)}次<br/>占比: ${formatPercentage(params.data.percentage)}`;
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...regionData.value.map(item => item.sessionCount)),
      text: ['高', '低'],
      realtime: false,
      calculable: true,
      inRange: {
        color: ['#e5eeff', '#1a53ff']
      },
      textStyle: {
        color: '#666',
        fontSize: 10
      },
      // 减小视觉映射条的大小
      itemWidth: 15,
      itemHeight: 60
    },
    geo: {
      map: 'china',
      roam: false,
      scaleLimit: {
        min: 1,
        max: 2
      },
      zoom: 1.2,
      itemStyle: {
        areaColor: '#e5eeff',
        borderColor: '#1a53ff'
      },
      emphasis: {
        itemStyle: {
          areaColor: '#f8734f'
        },
        label: {
          show: true,
          color: '#333',
          fontSize: 12
        }
      },
      select: {
        itemStyle: {
          areaColor: '#1a53fe'
        }
      },
      label: {
        show: false,
        color: '#333',
        align: 'center',
        fontSize: 10
      }
    },
    series: [
      {
        name: '启动次数',
        type: 'map',
        map: 'china',
        geoIndex: 0,
        data: mapData
      }
    ],
    animation: true,
    animationDuration: 1000
  };

  // 设置图表配置
  chartInstance.setOption(option);

  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
};



// 格式化数字显示 - 显示完整数据
const formatNumber = (num) => {
  // 始终返回完整的数字，添加千位分隔符以便阅读
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 数字增长动画函数
const animateNumber = (start, end, duration = 1500) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const valueRange = end - start;

    const updateValue = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      // 使用缓动函数使动画更自然
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(start + valueRange * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        resolve(end);
      }

      return currentValue;
    };

    updateValue();
  });
};

// 启动所有动画
const startAnimations = async () => {
  await nextTick();

  // 动画累计启动次数
  if (totalSessions.value > 0) {
    let currentValue = 0;
    const animationDuration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      currentValue = Math.floor(totalSessions.value * easeProgress);
      animatedTotalSessions.value = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // 动画地区数据
  regionData.value.forEach(async (item) => {
    if (!animatedRegionData.value[item.region]) {
      animatedRegionData.value[item.region] = { sessionCount: 0, percentage: 0 };
    }

    // 动画sessionCount
    let currentCount = 0;
    const countDuration = 1500 + Math.random() * 500; // 每个地区动画时间略有不同
    const countStartTime = Date.now();

    const animateCount = () => {
      const elapsed = Date.now() - countStartTime;
      const progress = Math.min(elapsed / countDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      currentCount = Math.floor(item.sessionCount * easeProgress);
      animatedRegionData.value[item.region].sessionCount = currentCount;

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    animateCount();

    // 动画百分比
    let currentPercentage = 0;
    const percentageDuration = 1500 + Math.random() * 500;
    const percentageStartTime = Date.now();

    const animatePercentage = () => {
      const elapsed = Date.now() - percentageStartTime;
      const progress = Math.min(elapsed / percentageDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      currentPercentage = item.percentage * easeProgress;
      animatedRegionData.value[item.region].percentage = currentPercentage;

      if (progress < 1) {
        requestAnimationFrame(animatePercentage);
      }
    };

    animatePercentage();
  });
};

// 格式化百分比显示
const formatPercentage = (percentage) => {
  // 确保百分比显示为两位小数，更加清晰准确
  return Number(percentage).toFixed(2) + '%';
};

// 获取地域统计数据
const fetchRegionData = async () => {
  loading.value = true;
  error.value = '';

  try {
    // 生成只包含日期部分的截止日期，时间固定为235959
    const startDate = '20200901000000';
    const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '235959';

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
        method: 'region/f',
        'start-date': startDate,
        'end-date': endDate,
        metrics: 'session_count_district',
        gran: 5
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const rawData = await response.json();
    parseRegionData(rawData);
  } catch (err) {
    error.value = `获取地域数据失败: ${err.message || '未知错误'}`;
    console.error('地域统计API请求错误:', err);
  } finally {
    loading.value = false;
    // 初始化地图
    setTimeout(() => {
      initMap();
    }, 100);
  }
};

// 解析地域统计数据
const parseRegionData = (rawData) => {
  if (!rawData || !rawData.result) {
    error.value = '地域数据格式错误';
    return;
  }

  const result = rawData.result;
  const districts = result.items[0]; // 地区数据
  const stats = result.items[1]; // 统计数据

  // 设置时间范围
  if (result.timeSpan && result.timeSpan.length > 0) {
    timeSpan.value = result.timeSpan[0];
  }

  // 设置总访问量
  if (result.sum && result.sum.length > 0 && result.sum[0].length > 0) {
    totalSessions.value = result.sum[0][0];
  }

  // 解析地区统计数据
  const parsedData = [];

  // 确保数据长度一致
  const maxLength = Math.min(
    districts.length,
    stats.length
  );

  for (let i = 0; i < maxLength; i++) {
    if (districts[i] && districts[i][0] && stats[i]) {
      parsedData.push({
        region: districts[i][0],
        sessionCount: stats[i][0],
        percentage: stats[i][1] || 0
      });
    }
  }

  regionData.value = parsedData;

  // 数据加载完成后启动动画
  nextTick(() => {
    startAnimations();
  });
};

// 提供模拟地域数据
const provideMockRegionData = () => {
  // 基于用户提供的数据创建模拟数据
  const mockData = {
    "result": {
      "timeSpan": ["2020/09/05 - 2025/09/03"],
      "fields": ["district_title", "session_count_district", "ratio_session_count_district"],
      "total": 34,
      "sum": [[1431747, "--"], []],
      "pageSum": [],
      "items": [
        ["广东", "河南", "山东", "江苏", "湖南", "四川", "河北", "广西", "湖北", "安徽", "江西", "北京", "浙江", "福建", "陕西", "辽宁", "山西", "重庆", "贵州", "云南", "上海", "黑龙江", "内蒙古", "新疆", "甘肃", "吉林", "天津", "海南", "宁夏", "青海", "香港", "西藏", "台湾", "澳门"].map(item => [item]),
        [
          [214538, 14.98], [102217, 7.14], [93107, 6.5], [82210, 5.74], [64671, 4.52],
          [63971, 4.47], [61057, 4.26], [60538, 4.23], [57881, 4.04], [56021, 3.91],
          [55259, 3.86], [53988, 3.77], [52828, 3.69], [44783, 3.13], [40414, 2.82],
          [35347, 2.47], [31864, 2.23], [30552, 2.13], [28913, 2.02], [27057, 1.89],
          [26554, 1.85], [21842, 1.53], [20502, 1.43], [20452, 1.43], [18643, 1.3],
          [17332, 1.21], [16377, 1.14], [9660, 0.67], [6302, 0.44], [4346, 0.3],
          [2809, 0.2], [1935, 0.14], [1794, 0.13], [214, 0.01]
        ],
        [],
        []
      ]
    }
  };

  parseRegionData(mockData);
};

// 组件挂载时获取数据
onMounted(() => {
  // 延迟加载，确保Chart.js已加载
  setTimeout(() => {
    fetchRegionData();
  }, 300);
});

// 组件卸载时销毁图表
onBeforeUnmount(() => {
  // 确保chartInstance是一个有效的ECharts实例且具有destroy方法
  if (chartInstance && typeof chartInstance === 'object' && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy();
    chartInstance = null; // 销毁后重置为null
  }
});
</script>

<style scoped>
/* 地域统计容器 - 响应式设计 */
.region-stats-content {
  padding: 16px;
  margin-top: 15px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

/* 头部信息 */
.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.metrics-date {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.total-views {
  font-size: 14px;
  color: #606266;
}

.total-count {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.time-span {
  font-size: 12px;
  color: #909399;
  background-color: #f4f4f5;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 前三名排名样式 */
.rank-number.rank-gold {
  background-color: #ffd700;
  color: #ffffff;
  font-weight: bold;
}

.rank-number.rank-silver {
  background-color: #c0c0c0;
  color: #ffffff;
  font-weight: bold;
}

.rank-number.rank-bronze {
  background-color: #cd7f32;
  color: #ffffff;
  font-weight: bold;
}

/* 启动次数显示样式 */
.count-number {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.count-unit {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

/* 骨架屏样式 */
.region-stats-skeleton {
  padding: 16px 20px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.region-stats-skeleton-item {
  margin-bottom: 16px;
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

/* 地域统计布局 */
.region-stats-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 地图区域 - 响应式设计 */
.region-chart-section {
  background-color: #fafafa;
  margin-top: 5px;
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.chart-container {
  height: 500px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

/* 列表区域 - 响应式设计 */
.region-list-section {
  background-color: #fafafa;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* 列表头部 - 响应式设计 */
.list-header {
  display: flex;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f2f5;
  font-weight: 600;
  color: #606266;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
  min-width: 300px;
}

.header-item {
  display: flex;
  align-items: center;
}

.header-item.rank {
  width: 60px;
  justify-content: center;
  flex-shrink: 0;
}

.header-item.region {
  flex: 1;
  padding-left: 20px;
  min-width: 60px;
}

.header-item.count {
  width: 120px;
  justify-content: center;
  flex-shrink: 0;
}

.header-item.percentage {
  width: 280px;
  /* 增加宽度以突出比例 */
  flex-shrink: 0;
}

/* 地区列表 - 响应式设计 */
.region-list {
  height: 300px;
  /* 固定高度，不允许滑动 */
  position: relative;
  width: 100%;
  overflow: hidden;
  min-width: 300px;
}

/* iOS风格分页控件 */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -2px;
  padding: 15px 0;
  background: #f8f8f8;
  border-radius: 10px;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 10px;
  color: #333;
  font-size: 16px;
}

.pagination-btn:hover:not(:disabled) {
  background: #e0e0e0;
  transform: scale(1.05);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pagination-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-dot {
  width: 8px;
  height: 8px;
  border: none;
  background: #ccc;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-dot:hover {
  background: #999;
  transform: scale(1.2);
}

.pagination-dot.active {
  background: #007aff;
  /* iOS蓝色 */
  width: 24px;
  border-radius: 4px;
  transform: scale(1);
}

/* 添加箭头图标样式 */
.pagination-btn i {
  font-style: normal;
}

.pagination-btn i:before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-left: 2px solid currentColor;
  border-top: 2px solid currentColor;
  transform: rotate(-45deg);
}

.pagination-btn:nth-child(3) i:before {
  transform: rotate(135deg);
}

.region-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.2s ease;
}

.region-item:hover {
  background-color: #f8f9fa;
}

.region-item.top-region {
  background-color: #f0f9ff;
}

.region-item.top-region:nth-child(1) {
  background-color: #fff7e6;
}

.region-item.top-region:nth-child(2) {
  background-color: #f0f7ff;
}

.region-item.top-region:nth-child(3) {
  background-color: #f0fff4;
}

.item-data {
  display: flex;
  align-items: center;
}

.item-data.rank {
  width: 60px;
  justify-content: center;
}

.rank-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #e6f7ff;
  color: #409eff;
  font-weight: 600;
  font-size: 12px;
}

.item-data.region {
  flex: 1;
  padding-left: 20px;
}

.region-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.item-data.count {
  width: 120px;
  justify-content: center;
}

.visit-count {
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.item-data.percentage {
  width: 280px;
  /* 增加宽度以突出比例 */
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.percentage-bar {
  flex: 1;
  height: 10px;
  /* 增加高度以突出显示 */
  background-color: #e5e5ea;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.percentage-fill {
  height: 100%;
  background: linear-gradient(90deg, #007aff 0%, #0056b3 100%);
  transition: width 0.8s ease-out, background-color 0.3s ease;
  border-radius: 5px;
  box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);
}

.percentage-text {
  width: 70px;
  font-size: 14px;
  color: #007aff;
  text-align: right;
  font-weight: 700;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

/* 滚动条样式 */
.region-list::-webkit-scrollbar {
  width: 6px;
}

.region-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.region-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.region-list::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 响应式设计 - 优化大屏显示 */
@media (min-width: 1200px) {
  .region-stats-content {
    padding: 24px;
    max-width: 1400px;
    margin: 15px auto;
  }
}

/* 响应式设计 - 平板及以下设备 */
@media (max-width: 768px) {
  .metrics-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .chart-container {
    height: 280px;
    min-width: 300px;
  }

  .list-header {
    font-size: 12px;
    min-width: 300px;
  }

  .header-item.rank {
    width: 40px;
  }

  .header-item.count {
    width: 80px;
  }

  .header-item.percentage {
    width: 120px;
  }

  .item-data.rank {
    width: 40px;
  }

  .item-data.count {
    width: 80px;
  }

  .item-data.percentage {
    width: 120px;
  }

  /* 在移动设备上同时显示百分比条和百分比文本 */
  .percentage-text {
    display: block;
    font-size: 12px;
    min-width: 50px;
  }

  .percentage-bar {
    display: block;
    flex: 1;
  }

  /* 调整分页控件在小屏幕上的显示 */
  .pagination-controls {
    padding: 10px 0;
  }

  .pagination-dots {
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .region-stats-content {
    /* padding: 12px 16px; */
  }

  .region-chart-section {
    padding: 16px;
  }

  .chart-container {
    height: 240px;
  }

  .region-item {
    padding: 10px 12px;
  }

  .region-name {
    font-size: 13px;
  }

  .visit-count {
    font-size: 13px;
  }
}
</style>