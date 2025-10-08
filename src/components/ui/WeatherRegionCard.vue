<template>
  <mdui-card class="weather-region-card mdui-hoverable">
    <!-- 卡片头部 -->
    <div class="mdui-card-content weather-region-header">
      <div class="mdui-flex mdui-items-center mdui-justify-between">
        <h3 style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" class="section-title">天气与位置</h3>

        <span class="update-time">最近{{ lastUpdated }}</span>
      </div>
    </div>

    <div class="mdui-divider"></div>

    <!-- 卡片内容 -->
    <div class="mdui-card-content weather-region-content">
      <div class="mdui-flex mdui-flex-wrap">
        <!-- 天气信息 -->
        <div class="weather-container mdui-flex mdui-items-center">
          <i :class="['weather-icon', weatherData.icon ? 'fa' : '', weatherData.icon]"></i>
          <div class="weather-info">
            <div class="weather-main">
              <span class="weather-temp">{{ weatherData.temperature }}°C</span>
              <span class="weather-condition">{{ weatherData.condition }}</span>
            </div>
            <div class="weather-details">





              <mdui-button variant="outlined" size="small" class="social-media-button">
                <i class="fa fa-tint" style="font-size: small;"></i> 能见度 {{ weatherData.humidity }}
              </mdui-button>




              <mdui-button variant="outlined" size="small" class="social-media-button">
                <i class="fa fa-wind" style="font-size: small;"></i>
                {{ weatherData.wind }} {{ weatherData.windSpeed }}
              </mdui-button>

              <mdui-button variant="outlined" size="small" class="social-media-button">
                <i class="fa fa-temperature-half" style="font-size: small;"></i>
                {{ weatherData.tempMin }}°C ~ {{ weatherData.tempMax }}°C
              </mdui-button>


              <mdui-button variant="outlined" v-if="weatherData.airQuality > 0" size="small">
                <i class="fa fa-leaf" style="font-size: small;"></i>
                AQI {{ weatherData.airQuality }}
              </mdui-button>
            </div>
          </div>
        </div>

        <!-- 地域信息 -->
        <div class="region-container mdui-flex-grow-1">
          <div class="region-header mdui-flex mdui-items-center">
            <i class="fa fa-map-marker-alt region-icon"></i>
            <span class="region-title">设备位置</span>
          </div>
          <div class="region-details">
            <div class="region-item">
              <span class="region-label">国家/地区:</span>
              <span class="region-value">{{ regionData.country }}</span>
            </div>
            <div class="region-item">
              <span class="region-label">区域:</span>
              <span class="region-value">{{ regionData.region }}</span>
            </div>
            <div class="region-item">
              <span class="region-label">城市:</span>
              <span class="region-value">{{ regionData.city }}</span>
            </div>
            <div class="region-item" v-if="regionData.timezone">
              <span class="region-label">时区:</span>
              <span class="region-value">{{ regionData.timezone }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </mdui-card>
</template>

<script setup>
import { $ } from 'mdui';
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, defineProps, watch } from 'vue';

// 定义props，接收从父组件传递的IP参数
const props = defineProps({
  ip: {
    type: String,
    default: "",
    required: true
  }
});

// 天气数据
const weatherData = ref({
  temperature: 22,
  condition: '雨',
  location: '北京',
  icon: 'fa-cloud-rain',
  tempMin: 18,
  tempMax: 26,
  humidity: '50%',
  wind: '无',
  windSpeed: '0级',
  visibility: '10km',
  airQuality: 0
});

// 地域数据
const regionData = ref({
  IP: '',
  country: '中国',
  region: '北京',
  city: '北京',
  timezone: 'Asia/Shanghai',
  organization: '',
  address: '中国 北京 北京'
});

// 最后更新时间
const lastUpdated = ref("");

// 当前使用的IP地址
const currentIp = ref(props.ip);

// 监听IP参数的变化，实现响应式更新
watch(() => props.ip, (newIp) => {
  if (newIp && newIp !== currentIp.value) {
    currentIp.value = newIp;
    fetchRegionData(); // 当IP变化时重新获取地域信息
  }
});
// 根据天气状况获取对应的Font Awesome图标
const getWeatherIcon = (weatherCondition) => {
  const condition = weatherCondition.toLowerCase();
  if (condition.includes('晴')) return 'fa-sun';
  if (condition.includes('云') || condition.includes('阴')) return 'fa-cloud';
  if (condition.includes('雨')) return 'fa-cloud-rain';
  if (condition.includes('雪')) return 'fa-snowflake';
  if (condition.includes('雾') || condition.includes('霾')) return 'fa-smog';
  return 'fa-sun';
};

// 格式化时间
const formatTime = (date) => {
  const now = new Date(date);
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `更新于 ${hours}:${minutes}`;
};

// 获取真实天气数据
const fetchWeatherData = async () => {
  try {
    const response = await fetch('https://oiapi.net/api/weather?city=%E8%A1%A1%E9%98%B3');
    const data = await response.json();

    if (data.code === 1 && data.data && data.data.current) {
      const currentData = data.data.current;
      weatherData.value = {
        temperature: parseInt(currentData.temp),
        condition: currentData.weather,
        location: currentData.city,
        icon: getWeatherIcon(currentData.weather),
        tempMin: parseInt(data.data.tempn) || parseInt(currentData.temp) - 3,
        tempMax: parseInt(data.data.temp) || parseInt(currentData.temp) + 3,
        humidity: currentData.humidity || '50%',
        wind: currentData.wind || '无',
        windSpeed: currentData.windSpeed || '0级',
        visibility: currentData.visibility || '10km',
        airQuality: parseInt(currentData.air) || 0,
        upDated: currentData.Date
      };
      lastUpdated.value = formatTime(new Date());
    }
  } catch (error) {
    console.error('获取天气数据失败:', error);
    // 出错时保持原有数据
    lastUpdated.value = formatTime(new Date());
  }
};

// 获取地域信息数据
const fetchRegionData = async () => {
  try {
    // 使用oiapi.net的IP地理位置API
    const apiUrl = currentIp.value
      ? `https://oiapi.net/api/Ip?ip=${currentIp.value}`
      : 'https://oiapi.net/api/Ip?ip=59.51.114.208';

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.code === 1 && data.data) {
        // 映射oiapi.net返回的数据到组件需要的格式
        regionData.value = {
          IP: data.data.IP,
          country: data.data.country,
          region: data.data.region,
          city: data.data.city,
          timezone: data.data.timezone,
          organization: data.data.organization,
          address: data.data.address
        };

        // 发送事件通知其他组件地域数据已更新
        window.dispatchEvent(new CustomEvent('regionDataUpdated', {
          detail: {
            city: data.data.city,
            country: data.data.country,
            region: data.data.region
          }
        }));

        // 保存到localStorage供其他组件使用
        try {
          localStorage.setItem('regionData', JSON.stringify({
            city: data.data.city,
            country: data.data.country,
            region: data.data.region,
            lastUpdated: Date.now()
          }));
        } catch (storageError) {
          console.warn('无法保存地域数据到localStorage:', storageError);
        }

        return;
      } else {
        console.warn('oiapi.net返回非成功状态:', data);
      }
    } catch (error) {
      console.warn('oiapi.net请求失败，使用备选数据:', error);
    }

    // API请求失败时使用默认数据
    regionData.value = {
      IP: currentIp.value || '127.0.0.1',
      country: '中国',
      region: '北京市',
      city: '北京市',
      timezone: 'Asia/Shanghai',
      organization: '本地网络',
      address: '中国 北京市 北京市'
    };
  } catch (error) {
    console.error('获取地域数据失败:', error);
    // 确保始终有默认数据
    regionData.value = {
      IP: currentIp.value || '127.0.0.1',
      country: '中国',
      region: '北京市',
      city: '北京市',
      timezone: 'Asia/Shanghai',
      organization: '本地网络',
      address: '中国 北京市 北京市'
    };
  }
};

// 是否已加载过数据的标志
const isLoaded = ref(false);
// 定时器引用
let weatherUpdateTimer = null;

// 组件挂载时获取数据
onMounted(() => {
  // 只有在第一次加载时获取数据
  if (!isLoaded.value) {
    fetchWeatherData();
    fetchRegionData();
    isLoaded.value = true;
  }

  // 每30分钟更新一次天气数据
  weatherUpdateTimer = setInterval(fetchWeatherData, 30 * 60 * 1000);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (weatherUpdateTimer) {
    clearInterval(weatherUpdateTimer);
    weatherUpdateTimer = null;
  }
});

// 组件被激活时（从缓存中恢复）
onActivated(() => {
  // 当组件从缓存中恢复时，可以在这里做一些处理
  // fetchRegionData();
  // 例如检查数据是否过期，如果需要可以更新
});

// 组件被停用时（被缓存）
onDeactivated(() => {
  // 当组件被缓存时，可以在这里做一些清理工作
  // 但保留定时器，确保数据仍能定时更新
});
</script>

<style lang="scss" scoped>
.weather-region-card {
  width: 100%;
  transition: all 0.3s ease;
}

.weather-region-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.weather-region-content {
  padding: 16px;
}

/* 天气模块样式 */
.weather-container {
  gap: 8px;
  animation: fadeIn 0.3s ease-in-out;
  margin-bottom: 16px;
}

.weather-icon {
  font-size: 24px;
  color: #2196F3;
  min-width: 24px;
  text-align: center;
  display: inline-block;
}

.weather-info {
  display: flex;
  flex-direction: column;
}

.weather-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.weather-temp {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.weather-condition {
  font-size: 0.875rem;
  color: #666;
}

.weather-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.weather-detail-item {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.7rem;
  color: #757575;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 2px 6px;
  border-radius: 12px;
}

.weather-detail-item .mdui-icon {
  font-size: 0.65rem;
  color: #9E9E9E;
}

/* 地域模块样式 */
.region-container {
  width: 100%;
}

.region-header {
  margin-bottom: 12px;
}

.region-icon {
  color: #2196F3;
  margin-right: 6px;
}

.region-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}

.region-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.region-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.region-label {
  font-size: 0.75rem;
  color: #666;
}

.region-value {
  font-size: 0.75rem;
  color: #333;
  font-weight: 500;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 360px) {

  .weather-region-header,
  .weather-region-content {
    padding: 12px;
  }

  .weather-icon {
    font-size: 20px;
  }

  .weather-temp {
    font-size: 0.875rem;
  }

  .weather-condition {
    font-size: 0.75rem;
  }

  .weather-details {
    gap: 6px;
  }

  .weather-detail-item {
    font-size: 0.65rem;
    padding: 2px 4px;
  }

  .region-item {
    padding: 3px 0;
  }

  .region-label,
  .region-value {
    font-size: 0.7rem;
  }
}

@media (min-width: 601px) {
  .weather-region-content .mdui-flex {
    flex-wrap: nowrap;
  }

  .weather-container {
    margin-bottom: 0;
    margin-right: 24px;
  }

  .region-container {
    width: auto;
    flex-grow: 1;
  }
}

/* 通用样式 */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.update-time {
  font-size: 0.75rem;
  color: #999;
}

.mdui-card-content {
  padding: 16px;
}

.mdui-icon {
  vertical-align: middle;
  font-size: inherit;
}
</style>