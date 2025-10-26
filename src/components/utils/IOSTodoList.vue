<template>
    <div class="ios-todo-container">
        <div class="ios-todo-card">
            <!-- 切换按钮 -->
            <div class="ios-toggle-container">
                <div class="ios-toggle-option" :class="{ active: currentView === 'hitokoto' }"
                    @click="switchToHitokoto">
                    一言
                </div>
                <div class="ios-toggle-option" :class="{ active: currentView === 'focus' }" @click="switchToFocus">
                    专注
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="ios-content-area">
                <!-- 一言内容 -->
                <div v-if="currentView === 'hitokoto'" class="ios-hitokoto-content">
                    <div class="ios-hitokoto-card" @click="refreshHitokoto">
                        <div class="ios-hitokoto-content-inner">
                            <div class="ios-hitokoto-quote">
                                <mdui-icon name="format_quote" class="quote-icon"></mdui-icon>
                            </div>
                            <p class="ios-hitokoto-text" @click="copyHitokoto(hitokoto.text, $event)">
                                {{ hitokoto.text || '加载中...' }}
                                <span class="copy-indicator" v-if="showCopyTip">{{ copyTipText }}</span>
                            </p>
                            <p class="ios-hitokoto-source">
                                — {{ hitokoto.from || '' }}
                            </p>
                        </div>
                        <div class="ios-hitokoto-indicator"></div>
                    </div>
                </div>

                <!-- 专注任务内容 -->
                <div v-else class="ios-focus-content">
                    <!-- 合并的专注任务版块 -->
                    <div v-if="(focusTasks.inProgress.length > 0 || focusTasks.pending.length > 0)"
                        class="ios-focus-section">
                        <div class="ios-focus-section-title">{{ focusSectionTitle }}</div>
                        <div class="ios-focus-list-container" @scroll="handleFocusScroll" ref="focusListContainer">
                            <!-- 进行中的任务 -->
                            <div v-for="(task, index) in focusTasks.inProgress" :key="'in-progress-' + task.id"
                                class="ios-focus-item in-progress">
                                <div class="ios-focus-item-content">
                                    <mdui-icon name="play_circle" class="focus-icon in-progress-icon"></mdui-icon>
                                    <div class="ios-focus-item-text">{{ task.name }}</div>
                                </div>
                                <div class="ios-focus-item-meta">
                                    <span v-if="task.startTime" class="focus-elapsed">
                                        {{ formatElapsedDuration(task.startTime) }}
                                    </span>
                                    <span v-else class="focus-elapsed">
                                        刚刚开始
                                    </span>
                                </div>
                            </div>

                            <!-- 待办任务 -->
                            <div v-for="(task, index) in focusTasks.pending" :key="'pending-' + task.id"
                                class="ios-focus-item pending">
                                <div class="ios-focus-item-content">
                                    <mdui-icon name="hourglass_empty" class="focus-icon pending-icon"></mdui-icon>
                                    <div class="ios-focus-item-text">{{ task.name }}</div>
                                </div>
                                <div class="ios-focus-item-meta">
                                    <span class="focus-duration">{{ formatDuration(task.estimatedDuration) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div v-if="focusTasks.inProgress.length === 0 && focusTasks.pending.length === 0"
                        class="ios-empty-state">
                        <mdui-icon name="task" class="empty-icon"></mdui-icon>
                        <p>暂无专注任务</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue';
import { snackbar } from 'mdui/functions/snackbar.js';
import { Snackbar } from 'mdui';

// 当前视图状态
const currentView = ref('hitokoto'); // 'hitokoto' 或 'focus'

// 一言数据
const hitokoto = ref({
    text: '',
    from: ''
});

// 复制提示相关
const showCopyTip = ref(false);
const copyTipText = ref('');
let copyTipTimer = null;

// 专注任务数据
const focusTasks = ref({
    inProgress: [],
    pending: []
});

// 专注任务列表容器引用
const focusListContainer = ref(null);

// 当前显示的标题
const focusSectionTitle = ref('专注任务');

// 切换到一言视图
const switchToHitokoto = () => {
    currentView.value = 'hitokoto';
};

// 切换到专注任务视图
const switchToFocus = () => {
    currentView.value = 'focus';
    // 获取最新的专注任务数据
    fetchFocusTasks();
    // 重置标题
    updateFocusSectionTitle();
};

// 格式化时长显示
const formatDuration = (minutes) => {
    if (!minutes) return '0分钟';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}小时${remainingMinutes}分钟`;
    } else {
        return `${remainingMinutes}分钟`;
    }
};

// 格式化进行时长显示
const formatElapsedDuration = (startTime) => {
    if (!startTime) return '刚刚开始';

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟`;
    } else {
        return `${seconds}秒`;
    }
};

// 处理专注任务滚动事件
const handleFocusScroll = () => {
    updateFocusSectionTitle();
};

// 更新专注任务标题
const updateFocusSectionTitle = () => {
    if (!focusListContainer.value) return;

    const container = focusListContainer.value;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // 如果滚动到顶部，显示第一个任务的类型
    if (scrollTop === 0 && (focusTasks.value.inProgress.length > 0 || focusTasks.value.pending.length > 0)) {
        if (focusTasks.value.inProgress.length > 0) {
            focusSectionTitle.value = '进行中';
        } else {
            focusSectionTitle.value = '待办';
        }
        return;
    }

    // 如果滚动到底部，显示最后一个任务的类型
    if (scrollTop + clientHeight >= scrollHeight && (focusTasks.value.inProgress.length > 0 || focusTasks.value.pending.length > 0)) {
        if (focusTasks.value.pending.length > 0) {
            focusSectionTitle.value = '待办';
        } else {
            focusSectionTitle.value = '进行中';
        }
        return;
    }

    // 默认显示"专注任务"
    focusSectionTitle.value = '待办';
};

// 获取专注任务数据
const fetchFocusTasks = async () => {
    try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/focus-tasks`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                focusTasks.value = {
                    inProgress: data.data.inProgress || [],
                    pending: data.data.pending || []
                };
            } else {
                throw new Error(data.error || 'API返回错误');
            }
        } else {
            throw new Error(`HTTP错误: ${response.status}`);
        }
    } catch (error) {
        console.error('获取专注任务数据失败:', error);
    }

    // 更新标题
    setTimeout(() => {
        updateFocusSectionTitle();
    }, 100);
};

// 复制一言内容
const copyHitokoto = async (text, event) => {
    // 阻止事件冒泡，防止触发父元素的刷新功能
    if (event) {
        event.stopPropagation();
    }
    try {
        if (!text || text === '加载中...' || text === '刷新中...') return;

        // 检查是否支持 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // 降级方案：使用传统的 execCommand
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }

        // 显示复制成功提示
        showCopyTip.value = true;
        copyTipText.value = '已复制！';

        // 清除之前的定时器
        if (copyTipTimer) {
            clearTimeout(copyTipTimer);
        }

        // 2秒后隐藏提示
        copyTipTimer = setTimeout(() => {
            showCopyTip.value = false;
        }, 2000);
    } catch (error) {
        console.error('复制失败:', error);

        // 显示复制失败提示
        showCopyTip.value = true;
        copyTipText.value = '复制失败';

        // 清除之前的定时器
        if (copyTipTimer) {
            clearTimeout(copyTipTimer);
        }

        // 2秒后隐藏提示
        copyTipTimer = setTimeout(() => {
            showCopyTip.value = false;
        }, 2000);
    }
};

// 获取一言数据
const fetchHitokoto = async () => {
    try {
        const response = await fetch('https://v1.hitokoto.cn/?encode=json');
        const data = await response.json();
        hitokoto.value = {
            text: data.hitokoto,
            from: data.from || data.from_who || '未知'
        };
    } catch (error) {
        console.error('获取一言数据失败:', error);
        hitokoto.value = {
            text: '人生若只如初见，何事秋风悲画扇。',
            from: '纳兰性德《木兰花·拟古决绝词柬友》'
        };
    }
};

// 刷新一言
const refreshHitokoto = () => {
    hitokoto.value.text = '刷新中...';
    fetchHitokoto();
};

// 组件挂载时获取一言数据和专注任务
onMounted(() => {
    fetchHitokoto();
    fetchFocusTasks();

    // 定期更新进行中的任务时间
    setInterval(() => {
        if (currentView.value === 'focus' && focusTasks.value.inProgress.length > 0) {
            // 触发重新渲染以更新时间显示
            focusTasks.value = { ...focusTasks.value };
        }
    }, 1000);
});

</script>

<style scoped>
/* iOS风格待办事项容器样式 */
.ios-todo-container {
    padding: 12px;
    display: flex;
    justify-content: center;
}

.ios-todo-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 16px 20px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    display: inline-block;
    min-width: 100%
}

.ios-todo-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.ios-todo-card:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
}

/* 切换按钮容器 */
.ios-toggle-container {
    display: flex;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 16px;
    padding: 4px;
    margin-bottom: 4px;
}

.ios-toggle-option {
    flex: 1;
    text-align: center;
    padding: 8px 12px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    color: #666;
}

.ios-toggle-option.active {
    background: #007AFF;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

/* 内容区域 */
.ios-content-area {
    min-height: 100%;
}

/* 一言内容样式 */
.ios-hitokoto-content-inner {
    position: relative;
    z-index: 1;
}

.ios-hitokoto-quote {
    position: absolute;
    top: -8px;
    left: -8px;
    opacity: 0.1;
    font-size: 48px;
    color: #007AFF;
    z-index: 0;
}

.quote-icon {
    font-size: 48px;
}

.ios-hitokoto-text {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    text-align: center;
    padding: 8px 0;
    position: relative;
    z-index: 1;
    cursor: pointer;
}

/* 复制提示样式 */
.copy-indicator {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    background: rgba(0, 122, 255, 0.9);
    color: white;
    font-size: 11px;
    border-radius: 10px;
    animation: fadeIn 0.3s ease;
}

.ios-hitokoto-source {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #8E8E93;
    text-align: right;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.ios-hitokoto-indicator {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 2px;
    transition: background 0.3s ease;
}

.ios-hitokoto-card:hover .ios-hitokoto-indicator {
    background: rgba(0, 122, 255, 0.2);
}

/* 专注任务内容样式 */
.ios-focus-section {
    min-width: 100%;
    margin-bottom: 10px;
}

.ios-focus-section-title {
    font-size: 13px;
    font-weight: 600;
    color: #8E8E93;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.ios-focus-list-container {
    max-height: 125px;
    /* 限制最大高度，大约显示2条任务 */
    min-width: 100%;
    overflow-y: auto;
    padding-right: 8px;
    /* 为滚动条留出空间 */
}

/* iOS风格滚动条样式 */
.ios-focus-list-container::-webkit-scrollbar {
    width: 6px;
}

.ios-focus-list-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
}

.ios-focus-list-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

.ios-focus-list-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
}

.ios-focus-item {
    display: flex;
    align-items: center;
    padding: 12px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transition: background-color 0.3s ease;
}

.ios-focus-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
}

.ios-focus-item-content {
    display: flex;
    align-items: center;
    flex: 1;
}

.focus-icon {
    font-size: 20px;
    margin-right: 12px;
}

.in-progress-icon {
    color: #34C759;
}

.pending-icon {
    color: #FF9500;
}

.ios-focus-item-text {
    font-size: 15px;
    color: #333;
    word-break: break-word;
    flex: 1;
}

.ios-focus-item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.focus-elapsed {
    font-size: 13px;
    color: #34C759;
    font-weight: 500;
}

.focus-duration {
    font-size: 13px;
    color: #8E8E93;
}

/* 空状态 */
.ios-empty-state {
    text-align: center;
    padding: 16px 0;
    color: #8E8E93;
}

.empty-icon {
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: 12px;
}

/* 动画效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>