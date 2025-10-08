<template>
    <div class="social-media-container">
        <!-- 固定在AppBar下方的标签栏 -->
        <div class="media-tabs" :class="{ 'animate-fade-in': isVisible }">
            <div class="tab-content">
                <s-tab v-model.lazy="select"
                    style="justify-content: left;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <s-tab-item value="B站">
                        <div slot="text">B站</div>
                    </s-tab-item>
                    <s-tab-item selected="true" value="网易">
                        <div slot="text">网易云</div>
                    </s-tab-item>
                    <s-tab-item value="QQ">
                        <div slot="text">QQ</div>
                    </s-tab-item>
                </s-tab>
            </div>
        </div>

        <!-- 社交卡片区域 - 固定在顶栏下方 -->
        <div class="fixed-card-content">
            <!-- 信息卡片区域 -->
            <div class="cards-container" :class="{ 'animate-slide-up-1': isVisible }">
                <!-- 根据选中的标签显示对应的媒体卡片 -->
                <QQInfoCard v-if="select === 'QQ'" />
                <BilibiliInfoCard v-if="select === 'B站'" />
                <NeteaseCloudMusicCard v-if="select === '网易'" />
            </div>

            <div class="section-header" :class="{ 'animate-slide-up-2': isVisible }">
                <s-avatar>
                    <s-icon name="home"></s-icon>
                    <s-badge slot="badge">99</s-badge>
                </s-avatar>
                <s-avatar src="https://soberjs.com/images/avatar.jpg">
                    <s-badge slot="badge">8</s-badge>
                </s-avatar>
                <!-- 根据选中的Tab显示对应的跳转按钮 -->
                <s-button v-if="select === 'B站'" type="primary" style="margin-left: 10px;" @click="handleBilibiliClick">
                    ...
                </s-button>
                <s-button v-else-if="select === '网易'" type="primary" style="margin-left: 10px;"
                    @click="handleNeteaseClick">
                    ...
                </s-button>
                <mdui-divider class="section-divider"></mdui-divider>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import QQInfoCard from '../ui/QQInfoCard.vue';
import BilibiliInfoCard from '../ui/BilibiliInfoCard.vue';
import NeteaseCloudMusicCard from '../ui/NeteaseCloudMusicCard.vue';

// 当前选中的标签
const select = ref('B站');

// 动画控制变量
const isVisible = ref(false);

// 处理B站按钮点击事件
const handleBilibiliClick = () => {
    window.open('https://space.bilibili.com/213203496', '_blank');
};

// 处理网易云音乐按钮点击事件
const handleNeteaseClick = () => {
    window.open('https://music.163.com/#/artist?id=53408795&userid=557642378', '_blank');
};

// 存储各媒体平台的核心数据（与信息卡片展示的数据一致）
// 提供静态初始数据，不再包含随机模拟
const mediaData = ref({
    qq: {
        status: '在线', // 在线状态
        level: 42 // 等级
    },
    bilibili: {
        videoNum: 128, // 视频数
        followNum: 356, // 关注数
        fansNum: 2890, // 粉丝数
        likeNum: 15600, // 获赞数
        vipStatus: 2 // 会员状态
    },
    netease: {
        listenSongs: 12540, // 累计听歌数
        followers: 156, // 粉丝数
        follows: 234, // 关注数
        playlistCount: 32, // 歌单数
        vipType: 3 // 会员类型
    }
});

// 组件挂载时的操作
onMounted(() => {
    // console.log('组件已挂载，使用静态数据展示');
    // 延迟一点时间触发动画，确保DOM已经渲染完成
    setTimeout(() => {
        isVisible.value = true;
    }, 50);
});
</script>

<style lang="scss" scoped>
// 组件特定样式，不影响全局
.social-media-container * {
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
}

// 动画定义
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.social-media-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    touch-action: none;
    -webkit-overflow-scrolling: none;
    display: flex;
    flex-direction: column;
    background-color: white;
    z-index: 10;
}

// // 确保App.vue中的全局样式不会影响到社交页面
// :global(.main-content) {
//     padding: 0 !important;
//     min-height: 0 !important;
//     // max-width: 100% !important;
// }

// :global(.router-view-content[data-route="/social-media"]) {
//     .main-content {
//         padding: 0 !important;
//     }
// }

.social-media-container {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    overflow: hidden !important; // 禁止容器内滚动
    touch-action: none !important; // 禁止触摸滚动
    -webkit-overflow-scrolling: none !important; // 禁止iOS上的弹性滚动
    display: flex !important;
    flex-direction: column !important;
    background-color: white !important;
    z-index: 10 !important;

    // 固定在顶栏下方的内容区域
    .fixed-card-content {
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
        padding: 16px;
        padding-top: 130px; // 增加与顶栏之间的间隙
        box-sizing: border-box;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    // 确保滚动容器不会被创建
    * {
        &::-webkit-scrollbar {
            display: none; // 隐藏滚动条
        }

        scrollbar-width: none; // Firefox
    }

    .section-header {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    .section-divider {
        margin-top: 8px;
        width: 100%;
    }
}

/* 媒体标签区域样式 - 固定在AppBar下方 */
.media-tabs {
    position: fixed;
    top: 50px; // 位于AppBar下方
    left: 0;
    right: 0;
    background-color: white;
    z-index: 90; // 低于AppBar的z-index
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 8px 16px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
}

.social-icons-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    background-color: #f5f5f5;
    border-radius: 8px;
}

.social-icons {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.social-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: transform 0.2s;
}

.social-icon:hover {
    transform: scale(1.1);
}

.bilibili-icon {
    background-color: #FB7299;
}

.netease-icon {
    background-color: #C3232A;
}

.qq-icon {
    background-color: #12B7F5;
}

.header-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.tab-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.tab-content {
    width: 100%;
    max-width: 600px;
}

/* 信息卡片容器样式 */
.cards-container {
    width: 100%;
    max-width: 600px;
    margin-bottom: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .fixed-card-content {
        padding: 12px;
        padding-top: 120px; // 在小屏幕上增加与顶栏之间的间隙
    }

    .social-icons-header {
        padding: 10px 12px;
    }

    .tab-title {
        font-size: 18px;
    }

    .social-icon {
        width: 20px;
        height: 20px;
    }

    .media-tabs {
        padding: 6px 12px;
    }
}

/* 动画类样式 - 页面进入效果 */
.animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
}

.animate-slide-up-1 {
    animation: slideUp 0.7s ease-out forwards 0.2s;
    opacity: 0;
}

.animate-slide-up-2 {
    animation: slideUp 0.7s ease-out forwards 0.4s;
    opacity: 0;
}

/* 为卡片内的元素添加额外的缩放动画效果 */
.cards-container>* {
    animation: scaleIn 0.6s ease-out forwards 0.3s;
    opacity: 0;
}
</style>