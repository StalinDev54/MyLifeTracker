<template>
    <Teleport to="body">
        <transition name="dialog-fade">
            <div v-if="visible" class="listen-together-bottom-sheet-overlay" @click="closeDialog">
                <div class="listen-together-bottom-sheet" :class="{ 'sheet-enter': visible }" @click.stop>
                    <!-- 拖拽指示器 -->
                    <div class="drag-indicator-container" @touchstart.passive="handleDragStart"
                        @touchmove.passive="handleDragMove" @touchend.passive="handleDragEnd"
                        @mousedown="handleDragStart" @mousemove="handleDragMove" @mouseup="handleDragEnd">
                        <div class="drag-indicator"></div>
                    </div>

                    <!-- 弹窗头部 -->
                    <div class="dialog-header">
                        <h2 class="dialog-title">一起听</h2>
                        <div class="header-buttons">
                            <button class="exit-button" @click="exitListenTogether">
                                退出一起听
                            </button>
                        </div>
                    </div>

                    <!-- 动态背景 - 基于当前歌曲封面的高斯模糊效果 -->
                    <div class="dialog-background" :style="getBackgroundStyle()"></div>

                    <div class="dialog-content">
                        <!-- 歌曲封面区域 -->
                        <div class="cover-section">
                            <div class="cover-container" @click="togglePlay">
                                <img :src="currentSong.detail.cover ? currentSong.detail.cover.replace(/[`']/g, '') : ''"
                                    :alt="currentSong.detail.name" class="song-cover"
                                    :class="{ 'cover-rotate': isPlaying }" @load="handleCoverLoad"
                                    @error="handleCoverError" />
                                <!-- 播放状态指示器 -->
                                <div v-if="isPlaying" class="play-indicator">
                                    <div class="indicator-bar" v-for="i in 5" :key="i"
                                        :style="{ animationDelay: i * 0.1 + 's' }"></div>
                                </div>
                                <!-- 暂停时显示的播放按钮 -->
                                <div v-if="!isPlaying" class="play-overlay">
                                    <div class="play-button-overlay">
                                        <i class="fas fa-play"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 歌曲信息区域 -->
                        <div class="song-info-section">
                            <h3 class="song-name">{{ currentSong.detail.name }}</h3>
                            <p class="song-artist">{{ currentSong.detail.artistNames.join(' / ') }}</p>
                            <p class="song-album" v-if="currentSong.detail.albumName">
                                专辑：{{ currentSong.detail.albumName }}
                            </p>
                        </div>

                        <!-- 进度条区域 -->
                        <div class="progress-section">
                            <div class="progress-container">
                                <div class="progress-track" ref="progressTrack" @click="handleProgressClick">
                                    <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                                </div>
                            </div>
                            <div class="time-display">
                                <span class="current-time">{{ formatTime(currentPosition) }}</span>
                                <span class="total-time">{{ formatTime(currentSong.duration) }}</span>
                            </div>
                        </div>

                        <!-- 歌词显示区域 -->
                        <div class="lyrics-section" v-if="currentLyrics.length > 0">
                            <div class="lyrics-container" ref="lyricsContainer">
                                <div v-for="(lyric, index) in displayedLyrics" :key="index"
                                    :class="['lyric-line', { 'current-lyric': index === currentLyricDisplayIndex }]">
                                    {{ lyric.text }}
                                </div>
                            </div>
                        </div>

                        <!-- 播放控制按钮 -->
                        <!-- <div class="controls-section">
                            <div class="control-buttons">
                                <button class="control-button" @click="togglePlay">
                                    <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
                                </button>
                            </div>
                        </div> -->

                    </div>

                    <!-- 底部安全区域 -->
                    <div class="safe-area-bottom"></div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script>
import { fetchLyricsWithCache, parseLRCLyrics, getCurrentLyricIndex, getCurrentLyricText, extractSongId } from '../../utils/lyricApi.js';
import { formatTime, calculateProgressPercentage } from '../../utils/listenTogetherApi.js';

export default {
    name: 'ListenTogetherDialog',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        currentSong: {
            type: Object,
            default: () => ({
                id: 0,
                playing: false,
                position: 0,
                duration: 0,
                detail: {
                    name: '',
                    cover: '',
                    albumName: '',
                    artistNames: []
                }
            })
        },
        currentPosition: {
            type: Number,
            default: 0
        },
        isPlaying: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'toggle-play', 'exit', 'update:currentPosition', 'update:isPlaying'],
    data() {
        return {
            currentLyrics: [],
            currentLyricIndex: 0,
            lyricsLoading: false,
            lyricsError: null,
            isCoverLoaded: false,
            isCoverError: false,
            // 拖拽相关状态
            dragStartY: undefined,
            dragStartTime: undefined,
            // 歌词滚动相关状态
            isUserScrolling: false,
            userScrollTimer: null,
            lastLyricScrollTime: 0, // 上次歌词滚动时间
            lastLyricUpdateTime: 0 // 上次歌词更新时间
        };
    },
    computed: {
        progressPercentage() {
            // 确保使用正确的参数顺序：当前位置，总时长
            return calculateProgressPercentage(this.currentPosition, this.currentSong.duration);
        },
        // 计算要显示的歌词列表（当前歌词及其前后各1条）
        displayedLyrics() {
            if (!this.currentLyrics || this.currentLyrics.length === 0) {
                return [];
            }

            const start = Math.max(0, this.currentLyricIndex - 1);
            const end = Math.min(this.currentLyrics.length, this.currentLyricIndex + 2);
            return this.currentLyrics.slice(start, end);
        },
        // 计算当前歌词在显示列表中的索引
        currentLyricDisplayIndex() {
            if (!this.currentLyrics || this.currentLyrics.length === 0) {
                return -1;
            }

            const start = Math.max(0, this.currentLyricIndex - 1);
            return this.currentLyricIndex - start;
        }
    },
    watch: {
        'currentSong.id': {
            handler(newId, oldId) {
                if (newId && newId !== oldId) {
                    this.loadLyricsForSong(this.currentSong);
                }
            },
            immediate: true
        },
        currentPosition: {
            handler(newPosition) {
                // 限制歌词更新频率，避免过于频繁的更新操作
                const now = Date.now();
                if (now - this.lastLyricUpdateTime < 200) { // 200ms内只更新一次
                    return;
                }

                if (this.currentLyrics.length > 0) {
                    this.updateCurrentLyricIndex(newPosition);
                    this.lastLyricUpdateTime = now;
                }
            }
        },
        currentLyricIndex: {
            handler(newIndex, oldIndex) {
                // 当当前歌词索引变化时，滚动到对应位置
                if (newIndex !== oldIndex) {
                    this.$nextTick(() => {
                        this.scrollToCurrentLyric();
                    });
                }
            }
        },
        visible(newVal) {
            if (newVal) {
                document.body.style.overflow = 'hidden';
                // 弹窗显示时滚动到当前歌词
                this.$nextTick(() => {
                    this.scrollToCurrentLyric();
                });
            } else {
                document.body.style.overflow = '';
            }
        }
    },
    methods: {
        closeDialog() {
            this.$emit('close');
        },
        togglePlay() {
            // 切换播放状态时通知父组件
            this.$emit('toggle-play');
        },
        exitListenTogether() {
            this.$emit('exit');
        },
        handleCoverLoad() {
            this.isCoverLoaded = true;
            this.isCoverError = false;
        },
        handleCoverError() {
            this.isCoverLoaded = false;
            this.isCoverError = true;
        },
        getBackgroundStyle() {
            if (!this.currentSong.detail.cover) {
                return {};
            }

            const coverUrl = this.currentSong.detail.cover.replace(/[`']/g, '');
            return {
                backgroundImage: `url("${coverUrl}")`,
                opacity: this.isPlaying ? 0.4 : 0.25
            };
        },
        formatTime(seconds) {
            // 使用从listenTogetherApi导入的formatTime函数
            return formatTime(seconds);
        },
        getCurrentLyricText() {
            if (!this.currentLyrics || this.currentLyrics.length === 0) {
                return this.lyricsLoading ? '正在加载歌词...' : '暂无歌词';
            }

            const currentLyric = this.currentLyrics[this.currentLyricIndex];
            return currentLyric ? currentLyric.text : '暂无歌词';
        },
        updateCurrentLyricIndex(currentPosition) {
            if (!this.currentLyrics || this.currentLyrics.length === 0) {
                return;
            }

            let newIndex = 0;
            let foundExactMatch = false;

            for (let i = 0; i < this.currentLyrics.length; i++) {
                const lyricTime = this.currentLyrics[i].time;

                if (currentPosition >= lyricTime) {
                    newIndex = i;
                    foundExactMatch = true;
                } else {
                    break;
                }
            }

            if (!foundExactMatch && this.currentLyrics[0] && currentPosition >= this.currentLyrics[0].time - 0.5) {
                newIndex = 0;
            }

            if (this.currentLyrics[newIndex + 1]) {
                const nextLyricTime = this.currentLyrics[newIndex + 1].time;
                if (currentPosition + 0.6 >= nextLyricTime) {
                    newIndex = newIndex + 1;
                }
            }

            if (newIndex !== this.currentLyricIndex) {
                this.currentLyricIndex = newIndex;
            }
        },
        async loadLyricsForSong(song) {
            if (!song || !song.id) {
                this.resetLyricsState();
                return;
            }

            const songId = extractSongId(song);
            if (!songId) {
                console.warn('🎵 无法从歌曲数据中提取歌曲ID:', song);
                this.resetLyricsState();
                return;
            }

            this.lyricsLoading = true;
            this.lyricsError = null;

            try {
                // 使用nextTick确保UI更新后再加载歌词，避免阻塞UI
                await this.$nextTick();

                const result = await fetchLyricsWithCache(songId, true);

                if (result.success && result.lyrics && result.lyrics.length > 0) {
                    this.currentLyrics = result.lyrics;
                    this.currentLyricIndex = 0;
                    this.lyricsError = null;

                    if (this.currentPosition > 0) {
                        this.updateCurrentLyricIndex(this.currentPosition);
                    }
                } else {
                    this.currentLyrics = [];
                    this.lyricsError = result.error || '暂无歌词';
                }
            } catch (error) {
                console.error(`🎵 加载歌词失败:`, error);
                this.currentLyrics = [];
                this.lyricsError = '加载歌词失败';
            } finally {
                this.lyricsLoading = false;
            }
        },
        resetLyricsState() {
            this.currentLyricIndex = 0;
            this.currentLyrics = [];
            this.lyricsLoading = false;
            this.lyricsError = null;
        },
        // 滚动到当前歌词位置
        scrollToCurrentLyric() {
            // 限制滚动频率，避免过于频繁的滚动操作
            const now = Date.now();
            if (now - this.lastLyricScrollTime < 200) { // 200ms内只滚动一次
                return;
            }

            if (!this.$refs.lyricsContainer) return;

            const container = this.$refs.lyricsContainer;
            const currentLyricElement = container.querySelector('.current-lyric');

            if (currentLyricElement) {
                // 获取容器和当前歌词元素的尺寸
                const containerHeight = container.clientHeight;
                const lyricHeight = currentLyricElement.clientHeight;

                // 获取当前歌词元素相对于容器的位置
                const lyricTop = currentLyricElement.offsetTop;
                const containerScrollTop = container.scrollTop;

                // 计算使当前歌词居中所需的滚动位置
                const targetScrollTop = lyricTop - (containerHeight / 2) + (lyricHeight / 2);

                // 直接滚动到目标位置（避免平滑滚动可能引起的卡顿）
                container.scrollTo({
                    top: targetScrollTop,
                    behavior: 'auto' // 改为auto以减少卡顿
                });

                // 更新上次滚动时间
                this.lastLyricScrollTime = now;
            }
        },
        // 处理拖拽开始
        handleDragStart(event) {
            // 获取初始位置
            const touch = event.touches ? event.touches[0] : event;
            this.dragStartY = touch.clientY;
            this.dragStartTime = new Date().getTime();

            // 添加事件监听器
            const sheet = document.querySelector('.listen-together-bottom-sheet');
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
                const sheet = document.querySelector('.listen-together-bottom-sheet');
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

            const sheet = document.querySelector('.listen-together-bottom-sheet');
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
        // 处理进度条点击事件
        handleProgressClick(event) {
            console.log('🎵 进度条点击事件触发，当前播放状态:', this.isPlaying);
            console.log('🎵 Socket播放状态:', this.currentSong.playing);

            // 只有当socket播放为暂停时，用户才可以自主拖动进度
            // 注意：这里应该使用socket的播放状态，而不是本地播放状态
            if (this.currentSong.playing) {
                // 添加提示，告知用户只有在暂停时才能拖动进度条
                console.log('🎵 播放进行中，无法手动拖动进度条');
                // 可以考虑添加一个用户提示，比如Snackbar或Toast
                return;
            }

            console.log('🎵 播放已暂停，允许拖动进度条');

            if (!this.$refs.progressTrack) {
                console.log('🎵 无法获取进度条元素引用');
                return;
            }

            const rect = this.$refs.progressTrack.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const trackWidth = rect.width;
            const percentage = clickX / trackWidth;

            console.log('🎵 点击位置信息:', { clickX, trackWidth, percentage });

            // 计算新的播放位置
            const newPosition = percentage * this.currentSong.duration;

            console.log('🎵 计算新的播放位置:', {
                percentage,
                duration: this.currentSong.duration,
                newPosition
            });

            // 发送更新事件
            console.log('🎵 发送位置更新事件');
            this.$emit('update:currentPosition', newPosition);
        }
    },
    beforeUnmount() {
        // 清理事件监听器
        document.body.style.overflow = '';

        // 清理可能存在的拖拽状态
        this.dragStartY = undefined;
        this.dragStartTime = undefined;

        // 重置弹窗样式
        const sheet = document.querySelector('.listen-together-bottom-sheet');
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
.listen-together-bottom-sheet-overlay {
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
.listen-together-bottom-sheet {
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
.dialog-background {
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
    position: relative;
    z-index: 2;
}

.dialog-title {
    font-size: 20px;
    font-weight: 600;
    color: #000;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header-buttons {
    display: flex;
    gap: 8px;
}

.exit-button {
    background: rgba(255, 59, 48, 0.1);
    border: none;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 500;
    color: #ff3b30;
    cursor: pointer;
    transition: all 0.2s ease;
}

.exit-button:hover {
    background: rgba(255, 59, 48, 0.2);
}

.exit-button:active {
    transform: scale(0.95);
}

.dialog-content {
    position: relative;
    z-index: 2;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
    overflow-y: auto;
}

.cover-section {
    display: flex;
    justify-content: center;
    padding: 10px 0;
}

.cover-container {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    cursor: pointer;
}

.song-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.cover-rotate {
    animation: rotate 20s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.play-indicator {
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: end;
    gap: 2px;
    height: 20px;
    padding: 0 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
}

.indicator-bar {
    width: 3px;
    background: #fff;
    border-radius: 2px;
    animation: indicatorPulse 1.2s ease-in-out infinite;
}

.indicator-bar:nth-child(1) {
    height: 30%;
}

.indicator-bar:nth-child(2) {
    height: 60%;
}

.indicator-bar:nth-child(3) {
    height: 100%;
}

.indicator-bar:nth-child(4) {
    height: 70%;
}

.indicator-bar:nth-child(5) {
    height: 40%;
}

@keyframes indicatorPulse {

    0%,
    100% {
        height: 30%;
    }

    25% {
        height: 60%;
    }

    50% {
        height: 100%;
    }

    75% {
        height: 50%;
    }
}

/* 暂停时显示的播放按钮覆盖层 */
.play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    z-index: 10;
}

.play-button-overlay {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.play-button-overlay:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 1);
}

.play-button-overlay:active {
    transform: scale(0.95);
}

.play-button-overlay i {
    font-size: 24px;
    color: #8355ff;
    margin-left: 2px;
}

.song-info-section {
    text-align: center;
    padding: 0 10px;
}

.song-name {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 700;
    color: #000;
    letter-spacing: -0.02em;
    line-height: 1.2;
}

.song-artist {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
}

.song-album {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.5);
}

.progress-section {
    padding: 0 10px;
}

.progress-container {
    width: 100%;
    margin-bottom: 8px;
}

.progress-track {
    position: relative;
    width: 100%;
    height: 5px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #8355ff, #a855f7);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.time-display {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
}

.lyrics-section {
    flex: 1;
    min-height: 90px;
    padding: 0 10px;
    overflow: hidden;
}

.lyrics-container {
    height: 100px;
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
    /* 隐藏滚动条 */
    -ms-overflow-style: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.lyrics-container::-webkit-scrollbar {
    display: none;
    /* 隐藏滚动条 */
}

.lyric-line {
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
    line-height: 1.6;
    padding: 6px 0;
    text-align: center;
    transition: all 0.3s ease;
}

.lyric-line.current-lyric {
    font-size: 18px;
    font-weight: 700;
    color: #8355ff;
    transform: scale(1.05);
}

/* 控制按钮区域 */
.controls-section {
    display: flex;
    justify-content: center;
    padding: 10px 0;
}

.control-buttons {
    display: flex;
    align-items: center;
    gap: 20px;
}

.control-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(131, 85, 255, 0.1);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8355ff;
    font-size: 18px;
}

.control-button:hover {
    background: rgba(131, 85, 255, 0.2);
    transform: scale(1.05);
}

.control-button:active {
    transform: scale(0.95);
}

/* 底部安全区域 */
.safe-area-bottom {
    height: env(safe-area-inset-bottom);
    background: rgba(255, 255, 255, 0.1);
}

/* 动画效果 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dialog-fade-enter-from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
}

.dialog-fade-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
}

/* 响应式设计 */
@media (max-width: 480px) {
    .listen-together-bottom-sheet-overlay {
        padding: 0;
    }

    .listen-together-bottom-sheet {
        border-radius: 20px 20px 0 0;
        max-height: 85vh;
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

    .dialog-content {
        padding: 0 16px 16px;
        gap: 16px;
    }

    .cover-container {
        width: 160px;
        height: 160px;
        border-radius: 50%;
    }

    .song-name {
        font-size: 20px;
    }

    .song-artist {
        font-size: 15px;
    }

    .song-album {
        font-size: 13px;
    }

    .lyric-line {
        font-size: 15px;
    }

    .lyric-line.current-lyric {
        font-size: 17px;
    }

    .control-button {
        width: 45px;
        height: 45px;
        font-size: 16px;
    }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
    .dialog-header {
        padding: 6px 16px 10px;
    }

    .cover-container {
        width: 140px;
        height: 140px;
    }

    .song-name {
        font-size: 18px;
    }

    .song-artist {
        font-size: 14px;
    }

    .lyric-line {
        font-size: 14px;
    }

    .lyric-line.current-lyric {
        font-size: 18px;
        font-weight: 700;
        color: #8355ff;
        transform: scale(1.05);
    }

    .control-button {
        width: 40px;
        height: 40px;
        font-size: 14px;
    }
}
</style>