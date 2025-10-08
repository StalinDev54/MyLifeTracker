<template>
    <!-- iOS风格底部弹窗最近播放列表 -->
    <div v-if="visible" class="playlist-bottom-sheet-overlay" @click="handleOverlayClick">
        <div class="playlist-bottom-sheet" :class="{ 'sheet-enter': visible }">
            <!-- 动态背景 - 基于当前歌曲封面的高斯模糊效果 -->
            <div class="dynamic-background" :style="getDynamicBackgroundStyle()"
                v-if="currentPlayingSong && currentPlayingSong.detail.cover"></div>
            <!-- 顶部拖拽指示器 -->
            <div class="drag-indicator-container" @touchstart.passive="handleDragStart" @touchmove.passive="handleDragMove"
                @touchend.passive="handleDragEnd" @mousedown="handleDragStart" @mousemove="handleDragMove"
                @mouseup="handleDragEnd">
                <div class="drag-indicator"></div>
            </div>

            <!-- 对话框头部 -->
            <div class="dialog-header">
                <h2 class="dialog-title">最近播放</h2>
                <div class="song-count">数据来源于网易云</div>
            </div>

            <!-- 播放列表内容 -->
            <div class="playlist-content">
                <div v-if="recentSongs.length === 0" class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <p class="empty-text">暂无最近播放</p>
                    <p class="empty-subtext">播放音乐后将显示在这里</p>
                </div>

                <div v-else class="song-list">
                    <!-- 分页信息 -->

                    <div v-if="totalPages > 1" class="pagination-controls">


                        <div class="pagination-dots">
                            <div v-for="page in Math.min(totalPages, 5)" :key="page" class="pagination-dot"
                                :class="{ 'active': page === currentPage }" @click="changePage(page)">
                            </div>
                        </div>


                    </div>
                    <!-- 歌曲列表 -->
                    <div v-for="(song, index) in currentPageSongs" :key="song.id" class="song-item"
                        :class="{ 'song-playing': song.id === currentPlayingSongId }" @click="handleSongClick(song)">

                        <!-- 当前播放歌曲的动态背景层 -->
                        <div v-if="isCurrentlyPlaying && song.detail.cover && song.id === currentPlayingSongId"
                            class="song-item-dynamic-background" :style="getSongItemDynamicBackgroundStyle(song)"></div>

                        <!-- 歌曲序号 -->
                        <!-- 歌曲序号需要基于当前页计算 -->
                        <div class="song-index">{{ (currentPage - 1) * songsPerPage + index + 1 }}</div>

                        <!-- 歌曲封面 -->
                        <div class="song-cover-wrapper"
                            :class="{ 'cover-playing': song.id === currentPlayingSongId, 'is-playing': song.id === currentPlayingSongId && isCurrentlyPlaying }">
                            <img :src="song.detail.cover" :alt="song.detail.name" class="song-cover"
                                :class="{ 'cover-rotating': song.id === currentPlayingSongId && isCurrentlyPlaying }" />

                            <!-- iOS风格播放指示器 - 当前歌曲时显示，只有playing=true时显示动画 -->
                            <div v-if="song.id === currentPlayingSongId" class="playing-indicator">
                                <div class="visualizer-bars">
                                    <div class="visualizer-bar" v-for="i in 4" :key="i"
                                        :style="{ animationDelay: i * 0.1 + 's' }"
                                        :class="{ 'bar-animated': isCurrentlyPlaying }"></div>
                                </div>
                            </div>
                        </div>

                        <div class="song-details">
                            <div class="song-main-info">
                                <h3 class="song-title" :class="{ 'title-playing': song.id === currentPlayingSongId }">
                                    {{ song.detail.name }}
                                    <!-- 播放状态文本指示器 - 当前歌曲且正在播放时显示 -->

                                </h3>
                                <p class="song-subtitle"
                                    :class="{ 'subtitle-playing': song.id === currentPlayingSongId }">
                                    {{ song.detail.artistNames.join(' • ') }} • {{ song.detail.albumName }}
                                </p>
                            </div>
                            <!-- 听歌相对时间 -->
                            <div class="song-timestamp"
                                :class="{ 'timestamp-playing': song.id === currentPlayingSongId }">
                                {{ formatTimestamp(song.timestamp || song.lastPlayed || Date.now()) }}
                            </div>
                        </div>

                        <!-- 右侧信息区域 -->
                        <div class="song-right-info">
                            <!-- 歌曲时长 -->
                            <div class="song-duration">{{ formatDuration(song.duration) }}</div>

                            <!-- 更多操作按钮 -->
                            <div class="song-more">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <!-- iOS风格分页控制 -->


            <!-- 底部安全区域 -->
            <div class="safe-area-bottom"></div>
        </div>
    </div>

    <!-- 歌曲详情弹窗 -->
    <SongDetailDialog :visible="showSongDetail" :song="selectedSong" @close="showSongDetail = false" />
</template>

<script>
import SongDetailDialog from './SongDetailDialog.vue';

export default {
    name: 'RecentPlaylistDialog',
    components: {
        SongDetailDialog
    },
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        recentSongs: {
            type: Array,
            default: () => []
        },
        currentPlayingSong: {
            type: Object,
            default: null
        }
    },
    emits: ['close', 'play-song'],
    data() {
        return {
            // 歌曲详情弹窗状态
            showSongDetail: false,
            selectedSong: null,
            // 分页相关状态
            currentPage: 1,
            songsPerPage: 5,
            // 拖拽相关状态
            dragStartY: undefined,
            dragStartTime: undefined
        };
    },
    computed: {
        // 当前歌曲ID（从传入的currentPlayingSong获取）
        currentPlayingSongId() {
            // currentPlayingSong表示当前歌曲（无论是否暂停），只要存在就显示对应状态
            return this.currentPlayingSong ? this.currentPlayingSong.id : null;
        },

        // 当前是否正在播放（只用于动画效果）
        isCurrentlyPlaying() {
            // playing字段只用于判断动画效果，不影响歌曲状态显示
            return this.currentPlayingSong && this.currentPlayingSong.playing === true;
        },

        // 计算当前页显示的歌曲
        currentPageSongs() {
            const startIndex = (this.currentPage - 1) * this.songsPerPage;
            const endIndex = startIndex + this.songsPerPage;
            return this.recentSongs.slice(startIndex, endIndex);
        },

        // 计算总页数
        totalPages() {
            return Math.ceil(this.recentSongs.length / this.songsPerPage);
        }
    },
    watch: {
        visible(newVal) {
            if (newVal) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        },

        // 监听数据变化，调试播放状态
        recentSongs: {
            handler(newVal) {
                // console.log('🎵 RecentPlaylistDialog 数据更新:', {
                //     '总数': newVal.length,
                //     '所有歌曲状态': newVal.map(song => ({
                //         id: song.id,
                //         name: song.detail?.name,
                //         playing: song.playing
                //     }))
                // });
            },
            deep: true,
            immediate: true
        },

        // 监听currentPlayingSong变化
        currentPlayingSong: {
            handler(newVal) {
                // console.log('🎵 RecentPlaylistDialog currentPlayingSong更新:', {
                //     '当前currentPlayingSong': newVal ? {
                //         id: newVal.id,
                //         name: newVal.detail?.name,
                //         playing: newVal.playing
                //     } : null,
                //     '当前歌曲ID': this.currentPlayingSongId,
                //     '是否正在播放': this.isCurrentlyPlaying
                // });
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        // 处理遮罩层点击
        handleOverlayClick(event) {
            if (event.target === event.currentTarget) {
                this.$emit('close');
            }
        },

        // 处理拖拽开始
        handleDragStart(event) {
            // 获取初始位置
            const touch = event.touches ? event.touches[0] : event;
            this.dragStartY = touch.clientY;
            this.dragStartTime = new Date().getTime();

            // 添加事件监听器
            const sheet = document.querySelector('.playlist-bottom-sheet');
            if (sheet) {
                sheet.style.transition = 'none';
            }
        },

        // 处理拖拽移动
        handleDragMove(event) {
            if (this.dragStartY === undefined) return;

            // 获取当前位置
            const touch = event.touches ? event.touches[0] : event;
            const currentY = touch.clientY;
            const deltaY = currentY - this.dragStartY;

            // 只处理向下拖拽
            if (deltaY > 0) {
                const sheet = document.querySelector('.playlist-bottom-sheet');
                if (sheet) {
                    // 计算拖拽进度 (最大拖拽距离为屏幕高度的1/3)
                    const maxDragDistance = window.innerHeight / 3;
                    const dragProgress = Math.min(deltaY / maxDragDistance, 1);

                    // 应用变换
                    sheet.style.transform = `translateY(${deltaY}px)`;
                    sheet.style.opacity = 1 - (dragProgress * 0.5);
                }
            }
        },

        // 处理拖拽结束
        handleDragEnd(event) {
            if (this.dragStartY === undefined) return;

            const touch = event.changedTouches ? event.changedTouches[0] : event;
            const currentY = touch.clientY;
            const deltaY = currentY - this.dragStartY;
            const dragDuration = new Date().getTime() - this.dragStartTime;

            // 重置拖拽起始位置
            this.dragStartY = undefined;
            this.dragStartTime = undefined;

            const sheet = document.querySelector('.playlist-bottom-sheet');
            if (sheet) {
                // 恢复过渡动画
                sheet.style.transition = '';

                // 判断是否应该关闭弹窗
                // 条件1: 拖拽距离超过屏幕高度的1/4
                // 条件2: 拖拽速度足够快 (快速下滑)
                const shouldClose =
                    deltaY > window.innerHeight / 4 ||
                    (deltaY > 50 && dragDuration < 300);

                if (shouldClose) {
                    // 执行关闭动画
                    sheet.style.transform = `translateY(100%)`;
                    sheet.style.opacity = '0';

                    // 延迟关闭弹窗
                    setTimeout(() => {
                        this.$emit('close');
                    }, 300);
                } else {
                    // 恢复原始位置
                    sheet.style.transform = 'translateY(0)';
                    sheet.style.opacity = '1';
                }
            }
        },

        // 格式化时长
        formatDuration(duration) {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        },

        // 格式化时间戳 - 更精确的相对时间显示
        formatTimestamp(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            const diffInHours = Math.floor(diffInMinutes / 60);

            if (diffInSeconds < 60) {
                // 小于1分钟显示"刚刚"
                return '刚刚';
            } else if (diffInMinutes < 60) {
                // 小于1小时显示"X分钟前"
                return `${diffInMinutes}分钟前`;
            } else if (diffInHours < 24) {
                // 小于24小时显示"X小时前"
                return `${diffInHours}小时前`;
            } else {
                // 超过24小时显示"X天前"
                const diffInDays = Math.floor(diffInHours / 24);
                return `${diffInDays}天前`;
            }
        },

        // 处理歌曲点击事件 - 显示歌曲详情并触发播放事件
        handleSongClick(song) {
            // 存储选中的歌曲并显示详情弹窗
            this.selectedSong = { ...song };
            this.showSongDetail = true;
        },

        // 分页控制方法
        changePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                // 滚动到顶部 - 使用nextTick确保DOM已更新
                this.$nextTick(() => {
                    try {
                        // 直接使用document.querySelector定位元素，避免使用this.$el
                        const contentElement = document.querySelector('.playlist-content');
                        if (contentElement) {
                            contentElement.scrollTop = 0;
                        }
                    } catch (error) {
                        console.warn('滚动到顶部时出错:', error);
                        // 静默失败，不影响功能
                    }
                });
            }
        },

        nextPage() {
            this.changePage(this.currentPage + 1);
        },

        prevPage() {
            this.changePage(this.currentPage - 1);
        },

        // 获取动态背景样式 - 基于当前歌曲封面的高斯模糊效果
        getDynamicBackgroundStyle() {
            if (!this.currentPlayingSong || !this.currentPlayingSong.detail.cover) {
                return {};
            }

            const coverUrl = this.currentPlayingSong.detail.cover.replace(/[`']/g, '');

            return {
                backgroundImage: `url("${coverUrl}")`,
                opacity: this.isCurrentlyPlaying ? 0.35 : 0.25
            };
        },

        // 获取歌曲项动态背景样式 - 基于歌曲封面的高斯模糊效果
        getSongItemDynamicBackgroundStyle(song) {
            if (!song.detail.cover) {
                return {};
            }

            const coverUrl = song.detail.cover.replace(/[`']/g, '');

            return {
                backgroundImage: `url("${coverUrl}")`,
                opacity: this.isCurrentlyPlaying ? 0.35 : 0.25
            };
        }


    },

    beforeUnmount() {
        // 清理事件监听器
        document.body.style.overflow = '';

        // 清理可能存在的拖拽状态
        this.dragStartY = undefined;
        this.dragStartTime = undefined;

        // 重置弹窗样式
        const sheet = document.querySelector('.playlist-bottom-sheet');
        if (sheet) {
            sheet.style.transition = '';
            sheet.style.transform = '';
            sheet.style.opacity = '';
        }
    }
};
</script>

<style scoped>
/* 底部弹窗遮罩层 */
.playlist-bottom-sheet-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.4s ease-out;
    touch-action: none;
    /* 防止页面滚动 */
}

/* iOS风格底部弹窗 */
.playlist-bottom-sheet {
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15), 0 -1px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateY(100%);
    opacity: 0;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    position: relative;
    z-index: 10000;
    user-select: none;
}

/* 动态背景层 - 基于当前歌曲封面的高斯模糊效果 */
.dynamic-background {
    position: absolute;
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(40px) saturate(1.8) brightness(1.2);
    -webkit-filter: blur(40px) saturate(1.8) brightness(1.2);
    z-index: -1;
    transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0.25;
    transform: scale(1.2);
}

/* 播放时加强背景效果 */
.playlist-bottom-sheet:has(.dynamic-background) {
    background: rgba(255, 255, 255, 0.7);
}

/* 播放时的背景动画效果 */
@keyframes dialogBackgroundPulse {

    0%,
    100% {
        transform: scale(1.2);
        opacity: 0.25;
        filter: blur(40px) saturate(1.8) brightness(1.2);
    }

    50% {
        transform: scale(1.25);
        opacity: 0.3;
        filter: blur(35px) saturate(2) brightness(1.3);
    }
}

.sheet-enter {
    transform: translateY(0);
    opacity: 1;
    animation: slideInFromBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 从下到上的iOS风格弹出动画 */
@keyframes slideInFromBottom {
    0% {
        transform: translateY(100%);
        opacity: 0;
    }

    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

/* 拖拽指示器容器 */
.drag-indicator-container {
    display: flex;
    justify-content: center;
    padding: 12px 0 8px;
    cursor: grab;
    position: relative;
    z-index: 2;
    /* background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); */
}

.drag-indicator-container:active {
    cursor: grabbing;
}

/* 拖拽指示器 */
.drag-indicator {
    width: 44px;
    height: 5px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2.5px;
    transition: all 0.2s ease;
}

.drag-indicator-container:hover .drag-indicator {
    background: rgba(0, 0, 0, 0.4);
    transform: scaleX(1.1);
}

/* 对话框头部 */
.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 24px 16px;
    /* border-bottom: 1px solid rgba(0, 0, 0, 0.08); */
    position: relative;
    z-index: 2;
    /* background: rgba(255, 255, 255, 0.2); */
    /* backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px); */
}

.dialog-title {
    font-size: 20px;
    font-weight: 600;
    color: #000;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    /* text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8); */
}

.song-count {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.4);
    font-weight: 400;
}

/* 播放列表内容 */
.playlist-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    margin-top: -4px;
    /* 消除与dialog-header之间的缝隙 */
    overscroll-behavior: contain;
    /* 防止过度滚动 */
    position: relative;
    z-index: 2;
}

/* 空状态 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    animation: fadeIn 0.5s ease-out;
}

/* 分页信息 */
.pagination-info {
    text-align: center;
    padding: 8px 0;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.4);
    font-weight: 500;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
}

/* 分页控制 */
.pagination-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    gap: 20px;
    /* background: rgba(255, 255, 255, 0.3); */
    /* backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px); */
    /* border-top: 1px solid rgba(0, 0, 0, 0.08); */
}

/* 分页按钮 */
.pagination-button {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.7);
    color: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pagination-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.9);
    color: rgba(0, 0, 0, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.pagination-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
}

/* 分页指示器 */
.pagination-dots {
    display: flex;
    align-items: center;
    gap: 6px;
}

.pagination-dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
}

.pagination-dot:hover {
    background: rgba(0, 0, 0, 0.3);
    transform: scale(1.2);
}

.pagination-dot.active {
    background: rgba(0, 0, 0, 0.6);
    width: 20px;
    border-radius: 4px;
}

.empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-text {
    font-size: 16px;
    color: rgba(0, 0, 0, 0.5);
    margin: 0 0 4px 0;
    font-weight: 500;
}

.empty-subtext {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.4);
    margin: 0;
}

/* 歌曲列表 */
.song-list {
    padding: 4px;
}

/* 歌曲项动态背景层 - 基于歌曲封面的高斯模糊效果 */
.song-item-dynamic-background {
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(25px) saturate(1.6) brightness(1.2);
    -webkit-filter: blur(25px) saturate(1.6) brightness(1.2);
    z-index: -1;
    transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0.25;
    transform: scale(1.1);
    border-radius: 20px;
}

/* 播放时加强歌曲项背景效果 */
.song-playing .song-item-dynamic-background {
    opacity: 0.35;
    filter: blur(20px) saturate(1.8) brightness(1.3);
    -webkit-filter: blur(20px) saturate(1.8) brightness(1.3);
    animation: songItemBackgroundPulse 3s ease-in-out infinite;
}

@keyframes songItemBackgroundPulse {

    0%,
    100% {
        transform: scale(1.1);
        opacity: 0.35;
        filter: blur(20px) saturate(1.8) brightness(1.3);
    }

    50% {
        transform: scale(1.15);
        opacity: 0.45;
        filter: blur(18px) saturate(2) brightness(1.4);
    }
}

/* 歌曲序号 */
.song-index {
    width: 32px;
    text-align: center;
    font-size: 15px;
    color: rgba(0, 0, 0, 0.5);
    font-weight: 600;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.04);
    height: 24px;
    min-width: 32px;
    transition: all 0.3s ease;
}

.song-playing .song-index {
    background: rgba(255, 255, 255, 0.3);
    color: rgba(0, 0, 0, 0.9);
    font-weight: 800;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 歌曲封面 */
.song-cover-wrapper {
    position: relative;
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    background: rgba(255, 255, 255, 0.1);
}

/* 当前歌曲的封面容器动画（只有playing时才有动画） */
.cover-playing {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(255, 255, 255, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.4);
}

.cover-playing.is-playing {
    /* animation: coverPlayingPulse 2s ease-in-out infinite; */
}

@keyframes coverPlayingPulse {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(255, 255, 255, 0.3);
    }

    50% {
        transform: scale(1.05);
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.2), 0 6px 20px rgba(255, 255, 255, 0.4);
    }
}

.song-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.song-item:hover .song-cover {
    transform: scale(1.05);
}


@keyframes coverRotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* iOS风格播放指示器 */
.playing-indicator {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 6px;
    padding: 3px 4px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    animation: indicatorFadeIn 0.5s ease-out;
}

.visualizer-bars {
    display: flex;
    align-items: end;
    gap: 1.5px;
    height: 12px;
    width: 16px;
}

.visualizer-bar {
    flex: 1;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(255, 255, 255, 0.9));
    border-radius: 1px;
    min-height: 2px;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
    /* 只有在播放状态下才显示动画 */
}

.visualizer-bar.bar-animated {
    animation: visualizerPulse 1.4s ease-in-out infinite;
}

.visualizer-bar:nth-child(1) {
    animation-delay: 0s;
}

.visualizer-bar:nth-child(2) {
    animation-delay: 0.1s;
}

.visualizer-bar:nth-child(3) {
    animation-delay: 0.2s;
}

.visualizer-bar:nth-child(4) {
    animation-delay: 0.3s;
}

@keyframes visualizerPulse {

    0%,
    100% {
        height: 25%;
        opacity: 0.7;
    }

    25% {
        height: 70%;
        opacity: 1;
    }

    50% {
        height: 100%;
        opacity: 1;
    }

    75% {
        height: 45%;
        opacity: 0.8;
    }
}

@keyframes indicatorFadeIn {
    from {
        opacity: 0;
        transform: scale(0.8);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* 歌曲详情 */
.song-details {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.song-main-info {
    flex: 1;
    min-width: 0;
}

.song-title {
    font-size: 16px;
    font-weight: 500;
    color: #000;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 播放状态下的歌曲标题 */
.title-playing {
    color: rgba(0, 0, 0, 0.95);
    font-weight: 700;
    /* text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8), 0 0 10px rgba(255, 255, 255, 0.5); */
}

/* 播放状态文本指示器 */
.playing-text-indicator {
    display: inline-block;
    margin-left: 6px;
    color: rgba(0, 0, 0, 0.9);
    animation: musicNote 1.5s ease-in-out infinite;
    font-size: 14px;
    text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
}

@keyframes musicNote {

    0%,
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 0.8;
    }

    50% {
        transform: scale(1.1) rotate(10deg);
        opacity: 1;
    }
}

.song-subtitle {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.6);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 播放状态下的副标题 */
.subtitle-playing {
    color: rgba(0, 0, 0, 0.8);
    font-weight: 600;
    /* text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7); */
}

/* 右侧信息区域 */
.song-right-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    min-width: 80px;
}

/* 歌曲时长 */
.song-duration {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.5);
    font-weight: 500;
    text-align: right;
    font-variant-numeric: tabular-nums;
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 8px;
    border-radius: 12px;
    min-width: 45px;
    transition: all 0.3s ease;
}

.song-playing .song-duration {
    color: rgba(0, 0, 0, 0.8);
    background: rgba(255, 255, 255, 0.25);
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 听歌相对时间 */
.song-timestamp {
    font-size: 16px;
    color: rgba(0, 0, 0, 0.4);
    font-weight: 400;
    text-align: left;
    padding: 1px 6px;
    /* background: rgba(0, 0, 0, 0.03); */
    border-radius: 16px;
    white-space: nowrap;
    transition: all 0.3s ease;
}

.timestamp-playing {
    color: rgba(0, 0, 0, 0.75);
    /* background: rgba(255, 255, 255, 0.25); */
    font-weight: 600;
    /* text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5); */
    /* border: 1px solid rgba(255, 255, 255, 0.2); */
}

/* 更多操作按钮 */
.song-more {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    color: rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.02);
}

.song-more:hover {
    background: rgba(0, 0, 0, 0.08);
    color: rgba(0, 0, 0, 0.7);
    transform: scale(1.05);
}

.song-more:active {
    transform: scale(0.95);
}

.song-playing .song-more {
    color: rgba(0, 0, 0, 0.8);
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.song-playing .song-more:hover {
    background: rgba(255, 255, 255, 0.35);
    color: rgba(0, 0, 0, 0.95);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 歌曲项点击效果 */
.song-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    margin-bottom: 4px;
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    animation: fadeIn 0.5s ease-out;
    gap: 12px;
    min-height: 76px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 播放状态下的歌曲项 */
.song-playing {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
    /* 增强对比度确保文字清晰 */
    color: rgba(0, 0, 0, 0.9);
}

.song-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0);
    transition: background 0.2s ease;
    pointer-events: none;
    z-index: 1;
}

.song-item:hover::before {
    background: rgba(255, 255, 255, 0.15);
}

.song-item:active::before {
    background: rgba(255, 255, 255, 0.2);
}

/* 当前播放栏 */
.now-playing-bar {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.3s ease;
    animation: slideInFromBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.now-playing-bar:hover {
    background: rgba(255, 255, 255, 0.4);
}

.now-playing {
    background: linear-gradient(90deg, rgba(255, 105, 180, 0.15), rgba(255, 105, 180, 0.1));
}

.now-playing-cover {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    margin-right: 12px;
}

.now-playing-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.now-playing-info {
    flex: 1;
    min-width: 0;
}

.now-playing-title {
    font-size: 15px;
    font-weight: 600;
    color: #000;
    margin: 0 0 2px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.now-playing-artist {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.6);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.now-playing-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.control-button {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.5);
    color: #000;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

/* 混入动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 滚动条样式 */
.playlist-content::-webkit-scrollbar {
    width: 6px;
}

.playlist-content::-webkit-scrollbar-track {
    background: transparent;
}

.playlist-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
}

.playlist-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
}

/* 移动端优化 */
@media (max-width: 768px) {
    .playlist-bottom-sheet {
        max-height: 80vh;
        border-radius: 20px 20px 0 0;
    }

    .drag-indicator {
        width: 40px;
        height: 4px;
    }

    .dialog-header {
        padding: 6px 20px 12px;
    }

    .dialog-title {
        font-size: 19px;
    }

    .song-item {
        padding: 10px 12px;
        gap: 10px;
        min-height: 70px;
    }

    .song-index {
        width: 28px;
        min-width: 28px;
        height: 22px;
        font-size: 14px;
    }

    .song-cover-wrapper {
        width: 52px;
        height: 52px;
    }

    .song-timestamp {
        font-size: 13px;
    }

    .song-duration {
        font-size: 12px;
        min-width: 42px;
    }

    .song-right-info {
        min-width: 70px;
    }

    .now-playing-bar {
        padding: 10px 12px;
    }

    /* 分页控制移动端优化 */
    .pagination-controls {
        padding: 10px 16px;
        gap: 16px;
    }

    .pagination-button {
        width: 36px;
        height: 36px;
        border-radius: 18px;
    }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
    .dialog-header {
        padding: 6px 16px 10px;
    }

    .song-item {
        padding: 8px 10px;
        gap: 8px;
        min-height: 64px;
    }

    .song-index {
        width: 26px;
        min-width: 26px;
        height: 20px;
        font-size: 13px;
    }

    .song-cover-wrapper {
        width: 48px;
        height: 48px;
    }

    .song-title {
        font-size: 15px;
    }

    .song-subtitle {
        font-size: 12px;
    }

    .song-timestamp {
        font-size: 12px;
    }

    .song-duration {
        font-size: 11px;
        min-width: 38px;
        padding: 1px 6px;
    }

    .song-right-info {
        min-width: 60px;
    }

    .song-more {
        width: 28px;
        height: 28px;
        border-radius: 14px;
    }

    .now-playing-controls {
        gap: 8px;
    }

    .control-button {
        width: 32px;
        height: 32px;
        border-radius: 16px;
    }

    .play-pause-button {
        width: 36px;
        height: 36px;
        border-radius: 18px;
    }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
    .playlist-bottom-sheet {
        border: 2px solid #000;
    }

    .drag-indicator {
        background: #000;
    }

    .song-item:hover::before {
        background: rgba(0, 0, 0, 0.1);
    }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
    .playlist-bottom-sheet {
        transition: none;
    }

    .song-cover {
        transition: none;
    }

    /* 禁用播放状态动画 */
    .cover-rotating,
    .visualizer-bar,
    .playing-text-indicator {
        animation: none !important;
    }

    .cover-playing {
        animation: none !important;
        box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
    }

    .playing-indicator {
        animation: none !important;
    }
}
</style>