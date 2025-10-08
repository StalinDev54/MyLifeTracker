<template>
  <div class="qq-card-wrapper">
    <!-- 骨架屏幕 - 数据加载完成前显示 -->
    <mdui-card class="qq-card" v-if="!qqInfo">
      <div style="padding: 16px;">
        <div style="display: flex; align-items: center">
          <s-skeleton style="width: 64px; height: 64px; border-radius: 50%"></s-skeleton>
          <div style="flex-grow: 1; margin-left: 12px">
            <div style="display: flex; align-items: center;">
              <s-skeleton style="width: 120px;"></s-skeleton>
              <s-skeleton style="width: 50px; margin-left: 8px;"></s-skeleton>
            </div>
            <s-skeleton style="margin-top: 8px;"></s-skeleton>
            <s-skeleton style="margin-top: 8px; width: 80%"></s-skeleton>
          </div>
        </div>
      </div>
    </mdui-card>

    <!-- 真实内容 - 数据加载完成后显示 -->
    <mdui-card class="qq-card" v-else>
      <!-- 头像和基本信息区域 - 紧凑布局 -->
      <div class="avatar-section">
        <img :src="qqInfo.headImg" alt="QQ头像" class="user-avatar" v-if="qqInfo.headImg">
        <div class="basic-info">
          <div class="name-section">
            <h4 class="user-name">{{ qqInfo.nick }}</h4>
            <span class="level-badge">Lv.{{ qqInfo.level }}</span>
          </div>
          <p class="user-account">
            QQ: {{ qqInfo.uin }}
            <span class="gender-icon" v-if="qqInfo.sex">
              {{ getGenderIcon(qqInfo.sex) }}
            </span>
          </p>
        </div>
      </div>

      <!-- 个性签名区域 -->
      <div class="sign-section" v-if="qqInfo.sign">
        <p class="user-sign">{{ qqInfo.sign }}</p>
      </div>
      <div class="sign-section" v-else="qqInfo.sign">
        <p class="user-sign">你独留我思维混淆却仍有神志</p>
      </div>

      <!-- 注册信息区域 -->
      <div class="register-info" v-if="qqInfo.registerTimerString">
        <p><mdui-icon name="stars" size="14"></mdui-icon> {{ qqInfo.status }}</p>
      </div>

      <div class="register-info" v-if="qqInfo.registerTimerString">
        <p><mdui-icon name="schedule" size="14"></mdui-icon> 注册时间: {{ qqInfo.registerTimerString }}</p>
      </div>
    </mdui-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 数据状态
const qqInfo = ref(null);

// 用户ID配置
const qqUin = '1545433540';

// 获取性别图标
const getGenderIcon = (sex) => {
  if (sex === '男' || sex === 'male') return '♂';
  if (sex === '女' || sex === 'female') return '♀';
  return '';
};

// 获取QQ信息
const fetchQQInfo = async () => {
  try {
    // 使用环境变量来区分开发和生产环境
    let apiUrl = '';

    // 检查是否在开发环境
    // console.log('是否在开发环境:', import.meta.env.DEV);
    // console.log('代理配置基础URL:', import.meta.env.BASE_URL);

    if (import.meta.env.DEV) {
      // 开发环境使用代理路径
      apiUrl = `/api/qq?key=oiapi-32f6121f-1271-d3d7-f402-d5781e70f338&uin=${qqUin}`;
    } else {
      // 生产环境可以直接使用目标API地址或其他配置
      apiUrl = `https://oiapi.net/API/QQMemberInfo/?key=oiapi-32f6121f-1271-d3d7-f402-d5781e70f338&uin=${qqUin}`;
    }

    // console.log('发起请求的URL:', apiUrl);
    // console.log('当前页面URL:', window.location.href);

    const response = await fetch(apiUrl);
    // console.log('响应状态码:', response.status);
    // console.log('响应URL:', response.url);

    const data = await response.json();

    // 根据API实际返回格式处理数据
    if (data && data.code === 1 && data.data) {
      // 处理头像URL - 从cover字段中提取并去除多余的反引号和空格
      const headImg = data.data.cover ? data.data.cover.replace(/[`\s]/g, '') : '';

      qqInfo.value = {
        nick: data.data.name || '未知用户',
        level: data.data.level || 0,
        headImg: headImg,
        uin: data.data.uin || '',
        sex: data.data.sex || '',
        status: data.data.status || '',
        register: data.data.register || '',
        registerTime: data.data.registerTimer || 0,
        registerTimerString: data.data.registerTimerString || '',
        sign: data.data.sign || '',
        business: data.data.business || []
      };
    } else {
      console.warn('QQ信息API返回格式不符合预期:', data);
      // 使用备用数据 - 模拟截图中的数据
      qqInfo.value = {
        nick: '黎幺幺',
        level: 48,
        headImg: 'https://picsum.photos/200/200', // 模拟头像
        uin: '1815641834',
        sex: '女',
        status: '在线',
        registerTimerString: '8年 241天 2小时 30分钟 19秒',
        sign: '好运锦鲤',
        business: []
      };
    }
  } catch (err) {
    console.error('获取QQ信息失败:', err);
    // 出错时使用备用数据
    qqInfo.value = {
      nick: '黎幺幺',
      level: 48,
      headImg: 'https://picsum.photos/200/200', // 模拟头像
      uin: '1815641834',
      sex: '女',
      status: '在线',
      registerTimerString: '8年 241天 2小时 30分钟 19秒',
      sign: '好运锦鲤',
      business: []
    };
  }
};

// 组件挂载时获取数据
onMounted(async () => {
  await fetchQQInfo();
});
</script>

<style lang="scss" scoped>
.qq-card-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto;
}

.qq-card {
  width: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 400px; // 适配手机宽度
  border-radius: 12px; // 圆角设计
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1); // 轻微阴影
  background: #ffffff;
  border: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.user-avatar {
  width: 64px; // 适中的头像大小
  height: 64px;
  border-radius: 50%;
  border: 2px solid #f0f0f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.basic-info {
  flex: 1;
  min-width: 0;
}

.name-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #333;
  line-height: 1.2;
}

.level-badge {
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
}

.user-account {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.gender-icon {
  margin-left: 6px;
  font-size: 14px;
}

/* 骨架屏样式 */
s-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.sign-section {
  padding: 0 16px 16px 16px;
}

.user-sign {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.6;
  word-break: break-all;
}

.register-info {
  padding: 0 16px 12px 16px;
}

.register-info p {
  font-size: 13px;
  color: #888;
  margin: 0;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>