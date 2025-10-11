<template>
    <div class="moments-container">
        <!-- 兴趣与爱好 -->
        <div class="moments-section moments-rounded">
            <h3 class="moments-section-title">兴趣与爱好</h3>
            <div class="moments-platforms-grid">
                <!-- 技术爱好 -->
                <div class="moments-platform-item moments-rounded">
                    <div class="moments-platform-icon-container">
                        <mdui-icon name="code" class="moments-platform-icon"></mdui-icon>
                    </div>
                    <div class="moments-platform-info">
                        <div class="moments-platform-name">Web开发</div>
                        <div class="moments-platform-details">Vue 3 + Vite</div>
                    </div>
                </div>
                <div class="moments-platform-item moments-rounded">
                    <div class="moments-platform-icon-container">
                        <mdui-icon name="android" class="moments-platform-icon"></mdui-icon>
                    </div>
                    <div class="moments-platform-info">
                        <div class="moments-platform-name">应用开发</div>
                        <div class="moments-platform-details">Flutter</div>
                    </div>
                </div>
                <div class="moments-platform-item moments-rounded">
                    <div class="moments-platform-icon-container">
                        <mdui-icon name="terminal" class="moments-platform-icon"></mdui-icon>
                    </div>
                    <div class="moments-platform-info">
                        <div class="moments-platform-name">后端开发</div>
                        <div class="moments-platform-details">Node.js</div>
                    </div>
                </div>

                <!-- 生活爱好 -->
                <div class="moments-platform-item moments-rounded">
                    <div class="moments-platform-icon-container">
                        <mdui-icon name="directions_bike" class="moments-platform-icon"></mdui-icon>
                    </div>
                    <div class="moments-platform-info">
                        <div class="moments-platform-name">骑行</div>
                        <div class="moments-platform-details">周末城市探索</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="moments-divider"></div>

        <!-- 最新动态 -->
        <div class="moments-section moments-rounded">
            <!-- 标题和更多按钮 -->
            <div class="moments-section-header">
                <h3 class="moments-section-title">动态</h3>
                <s-button type="text" @click="goToMoreArticles" class="moments-more-button moments-rounded">
                    更多 <mdui-icon name="more_horiz" size="16"></mdui-icon>
                </s-button>
            </div>

            <div v-if="loading" class="moments-loading-container">
                <!-- 优化后的骨架屏 -->
                <div class="moments-article-card moments-rounded" v-for="i in 3" :key="i">
                    <div class="moments-user-info">
                        <s-skeleton variant="circle" width="36px" height="36px" style="margin-right: 12px;"></s-skeleton>
                        <div class="moments-user-details">
                            <s-skeleton variant="text" width="80px" height="16px" style="margin-bottom: 4px;"></s-skeleton>
                            <s-skeleton variant="text" width="100px" height="12px"></s-skeleton>
                        </div>
                    </div>
                    <div class="moments-article-content">
                        <s-skeleton variant="text" width="100%" height="16px" style="margin-bottom: 8px;"></s-skeleton>
                        <s-skeleton variant="text" width="90%" height="16px" style="margin-bottom: 8px;"></s-skeleton>
                        <s-skeleton variant="text" width="95%" height="16px"></s-skeleton>
                    </div>
                    <div class="moments-article-footer">
                        <s-skeleton variant="text" width="80px" height="20px"></s-skeleton>
                    </div>
                </div>
            </div>

            <div v-else-if="uniqueArticles.length > 0" class="moments-articles-container">
                <div v-for="(article, index) in uniqueArticles" :key="article.cid"
                    class="moments-article-card moments-animate-fade-in moments-rounded"
                    :style="{ animationDelay: `${index * 0.1}s` }">
                    <!-- 头像和昵称 -->
                    <div class="moments-user-info">
                        <div class="moments-avatar">
                            <img src="https://q2.qlogo.cn/headimg_dl?dst_uin=1545433540&spec=100" alt="Avatar"
                                class="moments-avatar-img">
                        </div>
                        <div class="moments-user-details">
                            <div class="moments-username">Cтaлин</div>
                            <div class="moments-post-time">{{ article.month }}{{ article.day }}日 {{ article.year }}
                            </div>
                        </div>
                    </div>

                    <!-- 日期和标题 -->

                    <!-- 完整内容 -->
                    <div class="moments-article-content moments-animate-fade-in">
                        {{ formatContent(article.message) }}
                    </div>

                    <!-- 音乐卡片 -->
                    <div v-if="article.isMusic" @click="goToArticle(article.cid)" class=" moments-music-card
                        moments-animate-slide-up moments-rounded">
                        <div class="moments-music-blur-bg"
                            :style="{ backgroundImage: `url(${getImageUrl(article.imgUrls[0])})` }"></div>
                        <div class="moments-music-content">
                            <div class="moments-music-cover">
                                <img :src="getImageUrl(article.imgUrls[0])" alt="Music cover"
                                    class="moments-music-image moments-rounded">
                                <div class="moments-music-play-overlay">
                                    <mdui-icon name="play_arrow" size="24" class="moments-play-icon"></mdui-icon>
                                </div>
                            </div>
                            <div class="moments-music-info">
                                <div class="moments-music-title">{{ truncateText(article.musicTitle, 50) }}</div>
                                <div class="moments-music-singer">{{ article.musicSinger }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 图片展示 - 只在非音乐类型内容中显示 -->
                    <div v-if="!article.isMusic && article.imgUrls && article.imgUrls.length > 0"
                        class="moments-article-images">
                        <div class="moments-image-grid">
                            <div v-for="(img, imgIndex) in article.imgUrls" :key="imgIndex"
                                class="moments-image-container moments-rounded"
                                @click="openImagePreview(getImageUrl(img))">
                                <img :src="getImageUrl(img)" alt="Article image"
                                    class="moments-article-image moments-animate-zoom-in moments-rounded"
                                    :style="{ animationDelay: `${imgIndex * 0.1}s` }" draggable="false">
                                <div class="moments-image-overlay moments-rounded">
                                    <mdui-icon name="zoom_in" size="20"></mdui-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="moments-article-header">
                        <div v-if="article.location" class="moments-article-location">
                            <mdui-icon name="location_on" size="12" class="moments-location-icon"></mdui-icon>
                            {{ article.location }}
                        </div>
                    </div>

                    <!-- 底部操作区 -->
                    <div class="moments-article-footer">
                        <s-button type="text" @click="goToArticle(article.cid)"
                            class="moments-detail-button moments-rounded">
                            查看全文 <mdui-icon name="chevron_right" size="14"></mdui-icon>
                        </s-button>
                    </div>
                </div>
            </div>

            <div v-else class="moments-no-articles moments-rounded">
                <s-empty>暂无朋友圈动态</s-empty>
            </div>
        </div>
    </div>

    <!-- 图片预览组件 -->
    <div v-show="showPreview" class="moments-image-preview" @click="closeImagePreview">
        <!-- 内容容器 -->
        <div class="moments-preview-content" @click.stop>
            <button class="moments-preview-close" @click="closeImagePreview">
                <mdui-icon name="close" size="24"></mdui-icon>
            </button>
            <img :src="currentPreviewImage" :alt="'预览图片'" class="moments-preview-image" v-if="currentPreviewImage">
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 文章数据
const articles = ref([]);
const loading = ref(false);

// 计算属性，确保显示唯一的文章数据
const uniqueArticles = computed(() => {
    // 使用Map确保cid唯一
    const uniqueMap = new Map();
    articles.value.forEach(article => {
        if (!uniqueMap.has(article.cid)) {
            uniqueMap.set(article.cid, article);
        }
    });
    return Array.from(uniqueMap.values());
});

// 从API获取文章数据
const fetchArticles = async () => {
    // 防止重复加载
    if (loading.value) return;

    loading.value = true;
    try {
        // 从指定API获取数据
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/getlifeabout`);
        if (!response.ok) {
            throw new Error('网络响应错误');
        }
        const jsonData = await response.json();

        // 检查数据是否成功获取
        if (!jsonData.success) {
            throw new Error('数据获取失败');
        }

        // 处理数据，提取年份、月份和日期
        articles.value = jsonData.data.map(item => {
            // 从time字段提取年月日
            const timeParts = item.time.split('-');
            const year = timeParts[1];
            const month = timeParts[2] + '月';
            const day = timeParts[3];

            // 清理图片URL中的空格和引号
            const cleanImgUrls = item.imgUrls.map(url => url.trim().replace(/`/g, '').replace(/"/g, ''));

            return {
                ...item,
                imgUrls: cleanImgUrls,
                year,
                month,
                day
            };
        });
    } catch (error) {
        console.error('获取文章数据失败:', error);
    } finally {
        loading.value = false;
    }
};

// 跳转到原网站文章页面
const goToArticle = (cid) => {
    window.open(`https://jiclub.site/view.php?cid=${cid}`, '_blank');
};

// 跳转到更多文章页面
const goToMoreArticles = () => {
    window.open('https://jiclub.site/archives.php?user=36b175225d6773fc1a739acdd8834664', '_blank');
};

// 在新标签页中打开图片
const openImageInNewTab = (url) => {
    window.open(url, '_blank');
};

// 图片预览相关状态
const showPreview = ref(false);
const currentPreviewImage = ref('');

// 打开图片预览
const openImagePreview = (url) => {
    currentPreviewImage.value = url;
    showPreview.value = true;
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
};

// 关闭图片预览
const closeImagePreview = () => {
    showPreview.value = false;
    // 恢复页面滚动
    document.body.style.overflow = 'auto';
};

// 点击预览区域外部关闭预览功能已通过直接绑定closeImagePreview实现

// 格式化内容，处理换行符并保留格式
const formatContent = (content) => {
    // 对于诗歌和有特殊格式的内容，保留换行
    if (content.includes('\n')) {
        return content;
    }
    // 对于长文本，在适当位置添加换行
    if (content.length > 50) {
        return content.match(/.{1,50}\s|.+$/g).join('\n');
    }
    return content;
};

// 截断文本并添加省略号
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// 获取正确的图片URL，只处理相对路径
const getImageUrl = (url) => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    // 只处理以./开头的相对路径，其他URL保持不变
    if (trimmedUrl.startsWith('./')) {
        return `https://jiclub.site/${trimmedUrl.substring(2)}`;
    }
    return trimmedUrl;
};

// 组件挂载时的操作
onMounted(() => {
    fetchArticles();

    // 监听Esc键关闭预览
    const handleEscKey = (e) => {
        if (e.key === 'Escape' && showPreview.value) {
            closeImagePreview();
        }
    };

    window.addEventListener('keydown', handleEscKey);

    // 保存引用以便在卸载时清理
    window.__imagePreviewEscHandler = handleEscKey;
});

// 组件卸载时的清理操作
onUnmounted(() => {
    // 恢复页面滚动
    document.body.style.overflow = 'auto';

    // 移除键盘事件监听
    if (window.__imagePreviewEscHandler) {
        window.removeEventListener('keydown', window.__imagePreviewEscHandler);
        delete window.__imagePreviewEscHandler;
    }
});
</script>

<style lang="scss" scoped>
/* 微信朋友圈风格的基础样式 */
.moments-container {
    // background-color: #f0f0f0;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    border-radius: 16px;
    overflow: hidden;
}

/* 平台信息样式 */
.moments-section {
    padding: 16px 0;
}

.moments-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 16px;
}

.moments-section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
}

.moments-platforms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
}

.moments-platform-item {
    padding: 12px;
    background-color: #fff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.moments-platform-item:active {
    background-color: #f5f5f5;
    transform: scale(0.98);
    transition: transform 0.1s ease;
}

.moments-platform-icon-container {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
}

.moments-platform-icon {
    color: #666;
    font-size: 20px;
}

.moments-platform-info {
    flex-grow: 1;
}

.moments-platform-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 2px;
}

.moments-platform-details {
    font-size: 0.75rem;
    color: #999;
}

.moments-divider {
    height: 8px;
    // background-color: #f0f0f0;
    margin: 0;
}

/* 朋友圈样式 */
.moments-articles-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 0 12px;
}

.moments-article-card {
    background-color: #fff;
    padding: 16px;
    transition: all 0.3s ease;
    position: relative;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 用户信息 */
.moments-user-info {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.moments-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 12px;
    flex-shrink: 0;
    background-color: #f0f0f0;
}

.moments-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.moments-user-details {
    flex-grow: 1;
}

.moments-username {
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 2px;
}

.moments-post-time {
    font-size: 0.7rem;
    color: #999;
}

/* 动画效果 */
.moments-animate-fade-in {
    animation: momentsFadeIn 0.5s ease-out;
}

.moments-animate-slide-up {
    animation: momentsSlideUp 0.5s ease-out;
}

.moments-animate-zoom-in {
    animation: momentsZoomIn 0.4s ease-out;
}

@keyframes momentsFadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes momentsSlideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes momentsZoomIn {
    from {
        opacity: 0;
        transform: scale(0.98);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* 日期和标题区域 */
.moments-article-header {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
}

.moments-article-location {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #999;
}

.moments-location-icon {
    margin-right: 6px;
    color: #4876FF;
    font-size: 14px;
    /* 与文字大小更协调 */
}

/* 音乐卡片样式 */
.moments-music-card {
    border-radius: 16px;
    overflow: hidden;
    margin: 12px 0;
    position: relative;
    height: 96px;
    transition: all 0.3s ease;
}

/* 高斯模糊背景 */
.moments-music-blur-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: blur(10px);
    -webkit-filter: blur(10px);
    z-index: 0;
    transform: scale(1.1);
    /* 稍微放大背景以消除边缘模糊不足 */
}

.moments-music-content {
    position: relative;
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 1;
    height: 100%;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.moments-music-cover {
    position: relative;
    width: 64px;
    height: 64px;
    margin-right: 16px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
}

.moments-music-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.moments-music-play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.moments-music-cover:hover .moments-music-play-overlay {
    opacity: 1;
}

.moments-play-icon {
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.moments-music-info {
    flex-grow: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.moments-music-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    line-height: 1.4;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.moments-music-singer {
    font-size: 0.775rem;
    color: #666;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 图片预览样式 */
.moments-image-preview {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    background-color: rgba(0, 0, 0, 0.6);
    /* 使用更柔和的黑色背景 */
    cursor: pointer;
}

/* 内容容器 */
.moments-preview-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.moments-preview-image {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: momentsZoomIn 0.3s ease-out;
    object-fit: contain;
    /* 确保图片完全显示，不被裁剪 */
}

.moments-preview-close {
    position: fixed;
    /* 使用fixed定位确保在视口固定位置 */
    top: 20px;
    right: 20px;
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
    z-index: 10000;
    /* 确保关闭按钮在预览窗口上层 */
}

.moments-preview-close:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

/* 确保在所有屏幕尺寸下都能正确显示 */
@media (max-width: 768px) {
    .moments-image-preview {
        padding: 10px;
    }

    .moments-preview-image {
        max-height: 90vh;
    }
}

/* 图片展示样式 */
.moments-article-images {
    margin: 12px 0;
}

.moments-image-grid {
    display: grid;
    gap: 8px;
    transition: all 0.3s ease;
}

/* 不同数量图片的布局方案 */
.moments-image-grid {
    /* 默认网格布局 - 4列 */
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
}

/* 1张图片的布局 */
.moments-article-images:has(.moments-image-container:nth-child(1):last-child) .moments-image-grid {
    grid-template-columns: 1fr;
}

.moments-article-images:has(.moments-image-container:nth-child(1):last-child) .moments-image-container {
    aspect-ratio: 16/9;
    max-height: 300px;
}

/* 2张图片的布局 */
.moments-article-images:has(.moments-image-container:nth-child(2):last-child) .moments-image-grid {
    grid-template-columns: repeat(2, 1fr);
}

.moments-article-images:has(.moments-image-container:nth-child(2):last-child) .moments-image-container {
    aspect-ratio: 4/3;
}

/* 3张或更多图片的布局 */
.moments-image-grid {
    /* 3张或更多时采用方形网格 */
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
}

/* 4张图片的特殊布局 (2x2) */
.moments-article-images:has(.moments-image-container:nth-child(4):last-child) .moments-image-grid {
    grid-template-columns: repeat(2, 1fr);
}

.moments-image-container {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 1/1;
    transition: all 0.3s ease;
    cursor: pointer;
}

.moments-image-container:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
}

.moments-article-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
}

.moments-image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.moments-image-container:active .moments-image-overlay {
    opacity: 1;
}

.moments-image-overlay mdui-icon {
    color: white;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    padding: 3px;
    vertical-align: middle;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* 内容样式 */
.moments-article-content {
    font-size: 0.875rem;
    color: #333;
    line-height: 1.6;
    margin-bottom: 10px;
    white-space: pre-wrap;
    word-break: break-word;
}

/* 底部操作区 */
.moments-article-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
    margin-top: 8px;
}

.moments-actions {
    display: flex;
    gap: 20px;
}

.moments-action-button {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #999;
    transition: all 0.2s ease;
    padding: 4px 8px;
    border-radius: 4px;
}

.moments-action-button:active {
    background-color: #f0f0f0;
}

.moments-action-icon {
    margin-right: 6px;
    font-size: 14px;
    /* 与文字大小更协调 */
}

.moments-more-button,
.moments-detail-button {
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    color: #666;
    font-weight: normal;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
}

.moments-more-button mdui-icon,
.moments-detail-button mdui-icon {
    margin-left: 4px;
    font-size: 14px;
    /* 与文字大小更协调 */
}

.moments-more-button:active,
.moments-detail-button:active {
    color: #333;
    background-color: #f0f0f0;
}

/* 加载和空状态 */
.moments-loading-container {
    margin-top: 20px;
}

.moments-no-articles {
    margin-top: 40px;
    text-align: center;
    padding: 60px 0;
}

/* 微信朋友圈风格响应式设计 */
@media (max-width: 768px) {
    .moments-container {
        padding: 0;
        border-radius: 16px;
    }

    .moments-section {
        padding: 12px;
    }

    .moments-platforms-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }

    .moments-article-card {
        padding: 14px;
        width: 100%;
        height: auto;
        border-radius: 14px;
    }

    /* 响应式图片网格 - 默认布局 */
    .moments-image-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
        gap: 6px;
    }

    /* 1张图片的响应式布局 */
    .moments-article-images:has(.moments-image-container:nth-child(1):last-child) .moments-image-grid {
        grid-template-columns: 1fr;
    }

    .moments-article-images:has(.moments-image-container:nth-child(1):last-child) .moments-image-container {
        aspect-ratio: 16/9;
        max-height: 250px;
    }

    /* 2张图片的响应式布局 */
    .moments-article-images:has(.moments-image-container:nth-child(2):last-child) .moments-image-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    /* 4张图片的响应式布局 */
    .moments-article-images:has(.moments-image-container:nth-child(4):last-child) .moments-image-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .moments-music-card {
        height: 88px;
        border-radius: 14px;
    }

    .moments-music-content {
        border-radius: 14px;
        padding: 12px;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
    }

    .moments-music-cover {
        width: 56px;
        height: 56px;
        margin-right: 12px;
        border-radius: 10px;
    }

    .moments-music-title {
        font-size: 0.85rem;
    }

    .moments-music-singer {
        font-size: 0.75rem;
    }

    .moments-play-icon {
        font-size: 20px;
        padding: 3px;
    }
}

/* 更小屏幕的适配 */
@media (max-width: 360px) {
    .moments-article-card {
        border-radius: 12px;
        padding: 12px;
    }

    /* 更小屏幕的图片网格布局 */
    .moments-image-grid {
        grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
        gap: 4px;
    }

    /* 1张图片的极小屏幕布局 */
    .moments-article-images:has(.moments-image-container:nth-child(1):last-child) .moments-image-container {
        max-height: 200px;
    }

    .moments-music-card {
        border-radius: 12px;
        height: 80px;
    }

    .moments-music-content {
        border-radius: 12px;
        padding: 10px;
    }

    .moments-music-cover {
        width: 50px;
        height: 50px;
        border-radius: 8px;
    }
}
</style>
