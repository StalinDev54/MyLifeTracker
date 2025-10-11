<script setup>
import { ref, computed, onMounted, onUnmounted, watch, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ListenTogetherFloatingButton from './components/features/ListenTogetherFloatingButton.vue'
import { onMusicDataUpdate, getCurrentPlayingSong } from './utils/musicApi.js'

const router = useRouter()
const route = useRoute()
const listenTogetherFloatingButton = ref(null)

// 音乐播放状态
const currentPlayingSong = ref({
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

const currentPlayingPosition = ref(0)
const isMusicPlaying = ref(false)
const progressUpdateTimer = ref(null)

// 创建应用名称到图标路径的映射 - 使用Vite支持的资源引用方式
const appIconMap = {
  'Clash Meta for Android': new URL('./assets/APPicons/Clash Meta for Android_2.10.1.Meta.png', import.meta.url).href,
  'Edge': new URL('./assets/APPicons/Edge_139.0.3405.102.png', import.meta.url).href,
  'Flamingo': new URL('./assets/APPicons/Flamingo_1.0.0.png', import.meta.url).href,
  'Fusion App': new URL('./assets/APPicons/Fusion App_1.1.3.png', import.meta.url).href,
  'FusionApp 64bit': new URL('./assets/APPicons/FusionApp 64bit_2.0.0-beta8.7.2.png', import.meta.url).href,
  'FusionApp': new URL('./assets/APPicons/FusionApp_2.0.0-beta8.7.2.png', import.meta.url).href,
  'MT管理器': new URL('./assets/APPicons/MT管理器_2.18.1.png', import.meta.url).href,
  'QQ': new URL('./assets/APPicons/QQ_9.2.10.png', import.meta.url).href,
  'QQ邮箱': new URL('./assets/APPicons/QQ邮箱_7.0.4.png', import.meta.url).href,
  'Shizuku': new URL('./assets/APPicons/Shizuku_13.5.4.r1049.0e53409.png', import.meta.url).href,
  'Telegram': new URL('./assets/APPicons/Telegram_11.13.2.png', import.meta.url).href,
  'Via': new URL('./assets/APPicons/Via_6.6.0.png', import.meta.url).href,
  'WPS Office': new URL('./assets/APPicons/WPS Office_18.8.8.png', import.meta.url).href,
  '一个木函': new URL('./assets/APPicons/一个木函_7.17.20-normal.png', import.meta.url).href,
  '不背单词': new URL('./assets/APPicons/不背单词_5.9.12.png', import.meta.url).href,
  '行者': new URL('./assets/APPicons/行者_3.26.0.png', import.meta.url).href,
  '中国建设银行': new URL('./assets/APPicons/中国建设银行_8.7.2.png', import.meta.url).href,
  '云储': new URL('./assets/APPicons/云储_4.1.0.r84.3d162cb.png', import.meta.url).href,
  '任推邦': new URL('./assets/APPicons/任推邦_3.3.272.png', import.meta.url).href,
  '优学院': new URL('./assets/APPicons/优学院_1.9.68.png', import.meta.url).href,
  '学习通': new URL('./assets/APPicons/学习通_6.6.3.png', import.meta.url).href,
  '千鸟物联': new URL('./assets/APPicons/千鸟物联_6.5.6.png', import.meta.url).href,
  '哔哩哔哩': new URL('./assets/APPicons/哔哩哔哩_8.60.0.png', import.meta.url).href,
  '夸克': new URL('./assets/APPicons/夸克_7.15.5.900.png', import.meta.url).href,
  '小猿搜题': new URL('./assets/APPicons/小猿搜题_11.77.1.png', import.meta.url).href,
  '小米运动健康': new URL('./assets/APPicons/小米运动健康_3.45.0.png', import.meta.url).href,
  '小红书': new URL('./assets/APPicons/小红书_8.69.5.png', import.meta.url).href,
  '微信': new URL('./assets/APPicons/微信_8.0.62.png', import.meta.url).href,
  '抖音': new URL('./assets/APPicons/抖音_35.7.0.png', import.meta.url).href,
  '拼多多': new URL('./assets/APPicons/拼多多_7.73.0.png', import.meta.url).href,
  '支付宝': new URL('./assets/APPicons/支付宝_10.7.76.8100.png', import.meta.url).href,
  '极乐': new URL('./assets/APPicons/极乐_17.0.png', import.meta.url).href,
  '校园热水': new URL('./assets/APPicons/校园热水_6.1.2.png', import.meta.url).href,
  '湖工教务': new URL('./assets/APPicons/湖工教务_1.0.1.png', import.meta.url).href,
  '百度移动统计': new URL('./assets/APPicons/百度移动统计_2.4.png', import.meta.url).href,
  '知到': new URL('./assets/APPicons/知到_5.1.6.png', import.meta.url).href,
  '网易云音乐': new URL('./assets/APPicons/网易云音乐_9.3.70.png', import.meta.url).href,
  '美团': new URL('./assets/APPicons/美团_12.41.403.png', import.meta.url).href,
  '葫芦侠': new URL('./assets/APPicons/葫芦侠_4.3.1.7.1.png', import.meta.url).href,
  '豆包': new URL('./assets/APPicons/豆包_10.1.0.png', import.meta.url).href,
  '货拉拉': new URL('./assets/APPicons/货拉拉_7.1.64.png', import.meta.url).href,
  '运动世界校园': new URL('./assets/APPicons/运动世界校园_7.1.0.png', import.meta.url).href,
  '铁路12306': new URL('./assets/APPicons/铁路12306_5.9.4.5.png', import.meta.url).href,
  '饿了么': new URL('./assets/APPicons/饿了么_11.26.68.png', import.meta.url).href,
  '高德地图': new URL('./assets/APPicons/高德地图_16.00.0.2027.png', import.meta.url).href
}

// 提供全局可用的应用图标映射
provide('appIconMap', appIconMap)

// 返回上一页的方法
const handleBack = () => {
  router.back()
}

// 打开GitHub页面
const openGithubPage = () => {
  window.open('https://github.com/StalinDev54/MyLifeTracker', '_blank')
}

// 导航栏项目与路由的映射关系
const navigationMap = {
  'media': '/',
  'works': '/works',
  'dynamic': '/recent-activities',
  'statistics': '/statistics'
}

// 路由标题映射
const routeTitles = {
  '/': '状态',
  '/works': '项目',
  '/recent-activities': '动态',
  '/social-media': '媒体',
  '/statistics': '应用数据',
  '/realtime-visitors': '实时访客',
  '/visitor-stats': '实时访客'
}

// 当前标题
const currentTitle = computed(() => {
  return routeTitles[route.path] || '未知'
})

// 当前路由对应的导航栏值
const currentRouteValue = computed(() => {
  return Object.keys(navigationMap).find(key => navigationMap[key] === route.path) || 'media'
})

// 处理导航栏变化
const handleNavigationChange = (event) => {
  const routePath = navigationMap[event.target.value]
  if (routePath) {
    router.push(routePath)
  }
}

// 根据Socket推送数据的时间戳计算实时播放进度
const calculateCorrectProgress = () => {
  if (!currentPlayingSong.value || !currentPlayingSong.value.timestamp) {
    return;
  }

  try {
    // 如果音乐正在播放，基于Socket推送的进度位置 + 时间差来计算当前实时进度
    if (isMusicPlaying.value) {
      // 获取当前系统时间
      const currentSystemTime = Date.now();

      // 计算从Socket推送时间戳到现在的时间差（保持毫秒级精度）
      const timeDifferenceMs = currentSystemTime - currentPlayingSong.value.timestamp;
      // 转换为秒，但保留小数部分以提高精度
      const timeDifference = timeDifferenceMs / 1000;

      // 添加一个小的补偿值来抵消可能的网络延迟
      const delayCompensation = 0.2; // 200ms的补偿，可根据实际情况调整
      const calculatedPosition = currentPlayingSong.value.position + timeDifference + delayCompensation;

      // 确保进度不会超过歌曲总时长或小于0
      const correctPosition = Math.min(Math.max(calculatedPosition, 0), currentPlayingSong.value.duration);

      // 更新当前播放进度（只在差异较大时更新）
      if (Math.abs(correctPosition - currentPlayingPosition.value) > 0.5) {
        currentPlayingPosition.value = correctPosition;
      }
    } else {
      // 如果音乐暂停，直接使用Socket推送的进度位置
      if (currentPlayingSong.value.position !== undefined) {
        // 只在差异较大时更新
        if (Math.abs(currentPlayingSong.value.position - currentPlayingPosition.value) > 0.5) {
          currentPlayingPosition.value = currentPlayingSong.value.position;
        }
      }
    }
  } catch (error) {
    console.error('🎵 计算进度时发生错误:', error);
  }
}

// 启动进度条更新定时器
const startProgressUpdate = () => {
  // 清除现有定时器
  if (progressUpdateTimer.value) {
    clearInterval(progressUpdateTimer.value);
  }

  // 初始化时基于Socket数据计算实时进度
  calculateCorrectProgress();

  // 只有在音乐播放时才启动定时器更新进度
  if (isMusicPlaying.value) {
    // 使用较低的更新频率（500ms）以减少性能消耗
    progressUpdateTimer.value = setInterval(() => {
      if (currentPlayingSong.value && currentPlayingSong.value.timestamp) {
        // 基于Socket推送的数据和时间戳重新计算实时进度
        calculateCorrectProgress();
      }
    }, 500); // 从200ms调整为500ms，减少CPU使用
  }
}

// 监听音乐数据更新
const handleMusicDataUpdate = (result) => {
  if (result.currentPlayingSong) {
    console.log('🎵 Socket音乐数据更新，播放状态:', result.currentPlayingSong.playing, '歌曲ID:', result.currentPlayingSong.id);

    // 检查歌曲ID是否发生变化
    if (currentPlayingSong.value.id !== result.currentPlayingSong.id) {
      console.log('🎵 歌曲ID发生变化，从', currentPlayingSong.value.id, '变为', result.currentPlayingSong.id);
    }

    const oldPlayingState = isMusicPlaying.value;
    currentPlayingSong.value = result.currentPlayingSong
    isMusicPlaying.value = result.currentPlayingSong.playing || false

    // 更新播放位置 - 始终使用最新的位置数据以确保重新打开时能同步到最新进度
    if (result.currentPlayingSong.position !== undefined) {
      // 总是更新位置，确保退出一起听后位置也保持最新
      currentPlayingPosition.value = result.currentPlayingSong.position || 0
    }

    // 如果播放状态发生变化，重新启动进度更新定时器
    if (oldPlayingState !== isMusicPlaying.value) {
      startProgressUpdate();
    }
  }
}

// 更新当前播放位置的方法
const updateCurrentPosition = (position) => {
  // 只有当差异较大时才更新，避免频繁更新
  if (Math.abs(position - currentPlayingPosition.value) > 0.5) {
    currentPlayingPosition.value = position;
  }
}

// 更新播放状态的方法
const updateIsPlaying = (playing) => {
  isMusicPlaying.value = playing;
}

// 组件挂载时注册音乐数据监听器
onMounted(() => {
  // 注册音乐数据实时更新回调
  onMusicDataUpdate(handleMusicDataUpdate)

  // 初始化时获取当前播放歌曲
  const currentSong = getCurrentPlayingSong()
  if (currentSong) {
    currentPlayingSong.value = currentSong
    currentPlayingPosition.value = currentSong.position || 0
    isMusicPlaying.value = currentSong.playing || false

    // 启动进度更新定时器
    startProgressUpdate();
  }

  // 如果没有匹配的路由，重定向到首页
  if (!Object.values(navigationMap).includes(route.path)) {
    router.push('/')
  }

  // 监听一起听退出事件
  window.addEventListener('listen-together-exit', destroyListenTogetherInstance);
  // 监听一起听显示事件
  window.addEventListener('listen-together-show', showListenTogetherFloatingButton);
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (progressUpdateTimer.value) {
    clearInterval(progressUpdateTimer.value);
  }

  // 移除一起听退出事件监听器
  window.removeEventListener('listen-together-exit', destroyListenTogetherInstance);
  // 移除一起听显示事件监听器
  window.removeEventListener('listen-together-show', showListenTogetherFloatingButton);
})

// 监听路由变化，同步导航栏状态
watch(
  () => route.path,
  () => {
    // 路由变化时会自动更新 currentRouteValue 和 currentTitle
  }
)

// 隐藏一起听悬浮按钮的方法
const hideListenTogetherFloatingButton = () => {
  // 通过ref调用ListenTogetherFloatingButton组件的handleExitAndDispatch方法
  if (listenTogetherFloatingButton.value) {
    listenTogetherFloatingButton.value.handleExitAndDispatch();
  }
}

// 显示一起听悬浮按钮的方法
const showListenTogetherFloatingButton = () => {
  // 通过ref调用ListenTogetherFloatingButton组件的showDialog方法
  // 只有用户主动点击时才显示
  if (listenTogetherFloatingButton.value) {
    listenTogetherFloatingButton.value.showDialog();
  }
}

// 销毁一起听播放实例的方法
const destroyListenTogetherInstance = () => {
  // 不要停止音乐播放，保持播放状态
  // isMusicPlaying.value = false;

  // 不清除进度更新定时器，保持进度实时同步
  // if (progressUpdateTimer.value) {
  //   clearInterval(progressUpdateTimer.value);
  //   progressUpdateTimer.value = null;
  // }

  console.log('销毁一起听播放实例');
}

</script>

<template>
  <s-appbar class="app-bar">
    <!-- 根据路由显示不同的左侧按钮 -->


    <template v-if="route.path === '/realtime-visitors'">
      <s-icon-button @click="handleBack" slot="navigation">
        <s-icon name="arrow_back"></s-icon>
      </s-icon-button>
    </template>


    <template v-else>
      <s-icon-button slot="navigation">
        <s-icon name="menu"></s-icon>

      </s-icon-button>
      <div @click="openGithubPage" style="
    display: flex;        /* 启用 flex 布局 */
    flex-direction: column; /* 子元素纵向排列（垂直方向） */
    align-items: center;  /* 子元素水平居中（图标和文字左右对齐） */
    ">
        <i class=" fab fa-github"></i> <!-- GitHub 图标 -->
        <p style="font-size: small; font-style: oblique; margin: 0;">Github</p> <!-- 文字（清除默认margin避免多余间距） -->
      </div>

    </template>
    <!--标题-->
    <div slot="headline">
      <!-- 社交媒体页面显示固定标题 -->
      <span v-if="route.path === '/social-media'">媒体</span>
      <!-- 其他页面显示动态标题 -->
      <span v-else>{{ currentTitle }}</span>
    </div>
  </s-appbar>

  <!-- 主内容区域 -->
  <main class="main-content">
    <!-- 使用 KeepAlive 包裹 router-view，以保持组件状态 -->
    <router-view v-slot="{ Component }">

      <div class="router-view-content" :data-route="route.path">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </div>

    </router-view>
    <!-- 底部导航栏，在实时媒体页面不显示 -->
    <mdui-navigation-bar v-if="route.path !== '/social-media' && route.path !== '/realtime-visitors'"
      scroll-behavior="hide" :value="currentRouteValue" scroll-threshold="30" scroll-target=".main-content"
      @change="handleNavigationChange" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;">
      <mdui-navigation-bar-item style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" icon="forum"
        value="media">状态</mdui-navigation-bar-item>

      <mdui-navigation-bar-item style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"
        icon="dynamic_feed" value="dynamic">动态</mdui-navigation-bar-item>
      <mdui-navigation-bar-item style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" icon="work"
        value="works">项目</mdui-navigation-bar-item>
      <mdui-navigation-bar-item style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" icon="bar_chart"
        value="statistics">数据</mdui-navigation-bar-item>
    </mdui-navigation-bar>

    <!-- 悬浮的一起听按钮 -->
    <ListenTogetherFloatingButton ref="listenTogetherFloatingButton" :current-song="currentPlayingSong"
      :current-position="currentPlayingPosition" :is-playing="isMusicPlaying"
      @update:currentPosition="updateCurrentPosition" @update:isPlaying="updateIsPlaying" />
  </main>
</template>
