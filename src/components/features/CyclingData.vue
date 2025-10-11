<template>
  <h3 style=" 
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0px;
    font-size: 1rem;
    font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  ">
    运动与健康
  </h3>

  <div class="cycling-footer">
    <div class="cycling-date">最后更新于 {{ formatDateTime(cyclingData.start_time) }}</div>
  </div>

  <!-- 点击整个卡片区域触发弹窗 -->
  <mdui-card variant="outlined" class="cycling-card mdui-hoverable" @click="showCyclingList">
    <div class="cycling-card-content">
      <div class="cycling-header">
        <mdui-icon name="directions_bike" class="cycling-icon"></mdui-icon>
        <div class="cycling-header-text">
          <h5 class="cycling-subtitle">近期运动</h5>
          <div class="cycling-title">{{ cyclingData.title }}</div>
        </div>
        <mdui-icon name="chevron_right" class="cycling-arrow"></mdui-icon>
      </div>

      <!-- 轨迹缩略图带蒙版信息 -->
      <div class="cycling-track-preview" v-if="cyclingData.trackThumbnail">
        <img :src="cyclingData.trackThumbnail" :alt="cyclingData.title" class="track-image" />
        <!-- 高斯模糊蒙版 -->
        <div class="track-overlay">
          <div class="track-info">
            <div class="info-item">
              <div class="info-label">距离</div>
              <div class="info-value">{{ formatDistance(cyclingData.distance) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">时长</div>
              <div class="info-value">{{ formatDurationFromSeconds(cyclingData.duration) ||
                formatDuration(cyclingData.start_time, cyclingData.end_time) }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">平均速度</div>
              <div class="info-value">{{ formatSpeed(cyclingData.avg_speed) ||
                calculateSpeed(cyclingData.distance,
                  cyclingData.start_time, cyclingData.end_time) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="cycling-details" v-if="cyclingData.calories || cyclingData.max_speed || cyclingData.elevation_gain">
        <div class="detail-row">
          <div class="detail-item" v-if="cyclingData.calories">
            <mdui-icon name="local_fire_department" class="detail-icon"></mdui-icon>
            <span class="detail-text">{{ Math.round(cyclingData.calories / 1000) }} kcal</span>
            <span class="detail-description">消耗热量</span>
          </div>
          <div class="detail-item" v-if="cyclingData.max_speed">
            <mdui-icon name="speed" class="detail-icon"></mdui-icon>
            <span class="detail-text">{{ formatSpeedFromMS(cyclingData.max_speed) }}</span>
            <span class="detail-description">最大速度</span>
          </div>
          <div class="detail-item" v-if="cyclingData.elevation_gain">
            <mdui-icon name="landscape" class="detail-icon"></mdui-icon>
            <span class="detail-text">{{ cyclingData.elevation_gain }} m</span>
            <span class="detail-description">爬升高度</span>
          </div>
        </div>
      </div>
    </div>
  </mdui-card>

  <!-- 骑行列表弹窗 -->
  <CyclingListDialog :visible="isCyclingListVisible" :cycling-list="cyclingList" @close="hideCyclingList"
    @record-click="handleRecordClick" />

  <!-- 骑行装备弹窗 -->
  <CyclingEquipmentDialog :visible="isEquipmentDialogVisible" @close="hideEquipmentDialog" />
</template>

<script setup>
import { ref, computed } from 'vue';
import { Teleport } from 'vue';
import CyclingListDialog from '../dialogs/CyclingListDialog.vue';
import CyclingEquipmentDialog from '../dialogs/CyclingEquipmentDialog.vue';

const props = defineProps({
  cyclingData: {
    type: Object,
    required: true
  },
  cyclingList: {
    type: Array,
    default: () => []
  }
});

// 控制骑行列表弹窗显示状态
const isCyclingListVisible = ref(false);
// 控制骑行装备弹窗显示状态
const isEquipmentDialogVisible = ref(false);

// 计算骑行列表数据（如果未提供则使用当前记录作为列表）
const cyclingList = computed(() => {
  // 如果传入了骑行列表数据且不为空，则使用传入的数据
  if (props.cyclingList && props.cyclingList.length > 0) {
    return props.cyclingList;
  }
  // 否则使用当前的骑行数据作为列表
  return [props.cyclingData];
});

// 显示骑行列表弹窗
const showCyclingList = () => {
  isCyclingListVisible.value = true;
};

// 隐藏骑行列表弹窗
const hideCyclingList = () => {
  isCyclingListVisible.value = false;
};

// 显示骑行装备弹窗
const showEquipmentDialog = () => {
  isEquipmentDialogVisible.value = true;
};

// 隐藏骑行装备弹窗
const hideEquipmentDialog = () => {
  isEquipmentDialogVisible.value = false;
};

// 处理记录点击事件
const handleRecordClick = (record) => {
  console.log('点击了骑行记录:', record);
  // 在实际应用中，可以在这里处理记录点击事件
  // 比如跳转到详情页面或者显示更多详细信息
  hideCyclingList();

  // 点击记录后显示装备信息
  showEquipmentDialog();
};

// 格式化日期时间显示
const formatDateTime = (timestamp) => {
  if (!timestamp) return '未知时间';

  // 处理毫秒时间戳
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (date >= today) {
    return `今天 ${timeStr}`;
  } else if (date >= yesterday) {
    return `昨天 ${timeStr}`;
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day} ${timeStr}`;
  }
};

// 格式化距离显示 (米转公里)
const formatDistance = (distance) => {
  if (!distance) return '0 km';
  return `${(distance / 1000).toFixed(1)} km`;
};

// 计算骑行时长（从秒数）
const formatDurationFromSeconds = (durationInSeconds) => {
  if (!durationInSeconds) return '';

  const durationMinutes = Math.floor(durationInSeconds / 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
};

// 计算骑行时长（从开始和结束时间戳）
const formatDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '0 min';

  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
};

// 格式化速度显示 (km/h)
const formatSpeed = (speed) => {
  if (speed === undefined || speed === null) return '';
  return `${speed.toFixed(1)} km/h`;
};

// 格式化速度显示 从 m/s 转换为 km/h
const formatSpeedFromMS = (speedMS) => {
  if (speedMS === undefined || speedMS === null) return '';
  const speedKMH = speedMS * 3.6;
  return `${speedKMH.toFixed(1)} km/h`;
};

// 计算平均速度 (km/h) - 后备方法
const calculateSpeed = (distance, startTime, endTime) => {
  if (!distance || !startTime || !endTime) return '0 km/h';

  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  if (durationHours === 0) return '0 km/h';

  const speed = (distance / 1000) / durationHours;
  return `${speed.toFixed(1)} km/h`;
};
</script>

<style scoped>
.cycling-card {
  margin: 16px;
  width: calc(100% - 32px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  /* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); */
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  cursor: pointer;
  /* 添加手指光标表示可点击 */
}

.cycling-card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.cycling-card-content {
  padding: 16px;
}

.cycling-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
}

.cycling-icon {
  color: #4CAF50;
  font-size: 24px;
  margin-right: 12px;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cycling-header-text {
  flex-grow: 1;
  min-width: 0;
}

.cycling-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cycling-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.2;
}

.cycling-date {
  font-size: 12px;
  color: #999;
}

.cycling-arrow {
  color: #999;
  font-size: 18px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.cycling-header:hover .cycling-arrow {
  transform: translateX(4px);
}

/* 轨迹缩略图样式 */
.cycling-track-preview {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  background-color: #f5f5f5;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.cycling-track-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.track-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 高斯模糊蒙版 */
.track-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  display: flex;
  align-items: flex-end;
  padding: 20px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(2px);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.track-info {
  display: flex;
  justify-content: space-around;
  width: 100%;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.info-item {
  text-align: center;
  flex: 1;
}

.info-label {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 4px;
  font-weight: 500;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
}

/* 详细信息样式 */
.cycling-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.detail-row {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: #666;
  position: relative;
}

.detail-icon {
  font-size: 16px;
  color: #4CAF50;
}

.detail-text {
  font-weight: 600;
  color: #333;
}

.detail-description {
  font-size: 0.7rem;
  color: #999;
}

.cycling-footer {
  /* border-top: 1px solid #eee; */
  margin-top: -25px;
  margin-left: 16px;
  /* padding-top: 12px; */
}

.cycling-type {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  line-height: 1.4;
}

/* iOS风格响应式设计 */
@media (max-width: 768px) {
  .cycling-card {
    margin: 12px;
    width: calc(100% - 24px);
    border-radius: 14px;
  }

  .track-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 38%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    display: flex;
    align-items: flex-end;
    padding: 20px;
    backdrop-filter: blur(3.5px);
    -webkit-backdrop-filter: blur(2px);
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }

  .cycling-card-content {
    padding: 14px;
  }

  .info-value {
    font-size: 1rem;
  }

  .cycling-title {
    font-size: 15px;
  }

  .track-overlay {
    padding: 16px;
  }

  .detail-row {
    flex-direction: row;
    align-items: center;
    gap: 6px;
    justify-content: space-around;
  }

  .detail-item {
    flex-direction: column;
    align-items: center;
  }

  .detail-description {
    display: block;
    font-size: 0.7rem;
    margin-top: 2px;
    color: #999;
  }
}

@media (max-width: 360px) {
  .cycling-card {
    margin: 10px;
    width: calc(100% - 20px);
    border-radius: 12px;
  }

  .cycling-card-content {
    padding: 12px;
  }

  .info-value {
    font-size: 0.9rem;
  }

  .info-label {
    font-size: 0.7rem;
  }

  .cycling-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .track-overlay {
    padding: 12px;
  }

  .cycling-title {
    font-size: 14px;
  }

  .cycling-subtitle {
    font-size: 13px;
  }

  .detail-description {
    font-size: 0.6rem;
  }
}
</style>