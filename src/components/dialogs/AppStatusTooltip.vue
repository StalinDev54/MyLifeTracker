<template>
    <div v-if="visible" class="app-status-tooltip-overlay" @click="close">
        <!-- 应用状态信息卡片 -->
        <div class="app-status-card" @click="handleCardClick">
            <!-- 卡片内容 -->
            <div class="app-status-content">
                <!-- 应用图标 -->
                <div
                    :class="['app-icon', { 'has-background': !currentActivity.name || !appIconMap[currentActivity.name] || !isIconPath(appIconMap[currentActivity.name]) }]">
                    <!-- 根据图标类型显示不同的元素 -->
                    <template
                        v-if="currentActivity.name && appIconMap[currentActivity.name] && isIconPath(appIconMap[currentActivity.name])">
                        <img :src="appIconMap[currentActivity.name]" alt="{{ currentActivity.name }}"
                            class="app-icon-img">
                    </template>
                    <template v-else>
                        <mdui-icon :name="currentActivity.icon || 'lock'" size="24" class="app-icon-inner"></mdui-icon>
                    </template>
                </div>

                <!-- 应用信息 -->
                <div class="app-info">
                    <!-- 应用名称 -->
                    <h3 class="app-name">{{ currentActivity.name || '手机未使用' }}</h3>

                    <!-- 应用包名 -->
                    <p v-if="appPackage" class="app-package">{{ appPackage }}</p>

                    <!-- 当前状态/用途描述 -->
                    <p class="app-status-description">{{ (currentActivity.name ?
                        getAppUsageDescription(currentActivity.name) :
                        null) ||
                        appUsageDescription
                        || currentActivity.description || '使用中' }}</p>
                </div>
            </div>

            <!-- 隐藏的使用时长信息（根据需要显示） -->
            <div v-if="showDuration" class="duration-info">
                <span class="duration-label">持续时长:</span>
                <span class="duration-value">{{ currentDuration }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, inject } from 'vue';

// 注入全局应用图标映射
const appIconMap = inject('appIconMap', {});

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: Number,
        default: () => Math.floor(Date.now() / 1000)
    },
    currentActivity: {
        type: Object,
        default: () => ({
            name: '未知应用',
            description: '',
            icon: ''
        })
    },
    appPackage: {
        type: String,
        default: ''
    },
    appUsageDescription: {
        type: String,
        default: ''
    },
    showDuration: {
        type: Boolean,
        default: false
    },
    // 应用使用描述映射（可选，默认使用内置映射）
    appUsageMapping: {
        type: Array,
        default: () => []
    },
    // 首次锁屏记录
    firstLockRecord: {
        type: Object,
        default: null
    },
    // 当前状态（用于判断是否锁屏）
    currentStatus: {
        type: Object,
        default: () => ({ isOnline: true })
    }
});

import { getAppUsageDescription } from '../../utils/appUtils'

// 判断是否为图标文件路径
const isIconPath = (icon) => {
    return typeof icon === 'string' && (icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.svg'));
};

// 导出函数供其他组件使用
defineExpose({
    getAppUsageDescription
});

const emit = defineEmits(['close']);

const currentDuration = ref('0秒');
let durationTimer = null;

// 格式化时长显示
const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}时${minutes}分`;
    } else if (minutes > 0) {
        return `${minutes}分${remainingSeconds > 0 ? `${remainingSeconds}秒` : ''}`;
    } else {
        return `${remainingSeconds}秒`;
    }
};

// 更新使用时长
const updateDuration = () => {
    const now = Math.floor(Date.now() / 1000);
    // 在锁屏状态下且存在firstLockRecord.time时，使用首次锁屏时间计算持续时长
    let startTime = props.startTime;
    if (!props.currentStatus.isOnline && props.firstLockRecord && props.firstLockRecord.time) {
        startTime = props.firstLockRecord.time;
    }
    const durationSeconds = now - startTime;
    currentDuration.value = formatDuration(durationSeconds);
};

// 开始计时器
const startTimer = () => {
    updateDuration();
    if (!durationTimer) {
        durationTimer = setInterval(updateDuration, 1000);
    }
};

// 停止计时器
const stopTimer = () => {
    if (durationTimer) {
        clearInterval(durationTimer);
        durationTimer = null;
    }
};

// 关闭弹窗
const close = () => {
    emit('close');
};

// 处理卡片点击事件，阻止事件冒泡
const handleCardClick = (event) => {
    event.stopPropagation();
};

// 监听visible属性变化
watch(() => props.visible, (newVisible) => {
    if (newVisible) {
        startTimer();
    } else {
        stopTimer();
    }
});

// 组件挂载时启动计时器（如果visible为true）
onMounted(() => {
    if (props.visible) {
        startTimer();
    }
});

// 组件卸载时清理计时器
onUnmounted(() => {
    stopTimer();
});
</script>

<style scoped>
/* iOS风格模态弹窗遮罩层 - 实现外部模糊效果 */
.app-status-tooltip-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    animation: fadeIn 0.3s ease-out;
    overflow: hidden;
}

/* 应用状态信息卡片 - 保持清晰显示在模糊背景之上 */
.app-status-card {
    background-color: #ffffff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.8);
    animation: slideUp 0.3s ease-out;
}

/* 淡入动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* 向上滑动动画 */
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 卡片内容区域 */
.app-status-content {
    display: flex;
    align-items: center;
    width: 100%;
}

/* 应用图标 */
.app-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;
}

.app-icon.has-background {
    background-color: #007aff;
}

.app-icon-inner {
    color: #ffffff;
}

/* 应用图片图标样式 */
.app-icon-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: transparent;
}

/* 应用信息区域 */
.app-info {
    flex: 1;
    min-width: 0;
}

/* 应用名称 */
.app-name {
    margin: 0 0 4px 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1c1c1e;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 应用包名 */
.app-package {
    margin: 0 0 6px 0;
    font-size: 0.75rem;
    color: #6c6c70;
    background-color: #f2f2f7;
    padding: 2px 8px;
    border-radius: 12px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

/* 应用状态/用途描述 */
.app-status-description {
    margin: 0;
    font-size: 0.875rem;
    color: #3a3a3c;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
}

/* 使用时长信息（默认隐藏，根据需要显示） */
.duration-info {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f2f2f7;
    display: flex;
    align-items: center;
}

.duration-label {
    font-size: 0.75rem;
    color: #8e8e93;
    margin-right: 6px;
}

.duration-value {
    font-size: 0.875rem;
    color: #007aff;
    font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 767px) {
    .app-status-card {
        width: 95%;
        max-width: none;
        margin: 0 10px;
    }

    .app-icon {
        width: 50px;
        height: 50px;
    }

    .app-name {
        font-size: 1.125rem;
    }
}
</style>