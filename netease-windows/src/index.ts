import { CloudmusicDetector } from "./cloudmusic-detector/index.js";
import axios from "axios";
import { DetectorStatus } from "./cloudmusic-detector/types.js";

const detector = new CloudmusicDetector();

// 后端 API 地址
const apiUrl = "https://api.jiclub.site/api/cloudmusic";
const AUTH_KEY = "1545433540";

// 存储上一次上传的状态
let lastUploadedStatus: DetectorStatus | null = null;

// 防抖定时器ID
let uploadDebounceTimer: ReturnType<typeof setTimeout> | null = null;
// 防抖延迟时间（毫秒）
const UPLOAD_DEBOUNCE_DELAY = 1000;

// 比较两个状态是否发生了实质性变化
const hasStatusChanged = (
  prevStatus: DetectorStatus | null,
  currentStatus: DetectorStatus,
  updateType?: "play" | "status" | "position"
): boolean => {
  // 如果是第一次上传，直接返回true
  if (!prevStatus) return true;

  // 如果是play类型的更新（切歌或重新播放），总是认为状态发生了变化
  if (updateType === "play") return true;

  // 检查关键字段是否变化
  if (prevStatus.available !== currentStatus.available) return true;
  if (prevStatus.id !== currentStatus.id) return true;
  if (prevStatus.playing !== currentStatus.playing) return true;
  if (Math.abs(prevStatus.position - currentStatus.position) > 1) return true; // 位置变化超过1秒才视为变化

  return false;
};

// 上传音乐数据到云端
const uploadMusicData = async (updateType?: "play" | "status" | "position") => {
  // 清除之前的防抖定时器
  if (uploadDebounceTimer) {
    clearTimeout(uploadDebounceTimer);
  }

  // 保存调用时的状态和更新类型，用于延迟执行时的比较
  const statusAtCall = detector.status;
  const updateTypeAtCall = updateType;

  // 设置新的防抖定时器
  uploadDebounceTimer = setTimeout(async () => {
    // 获取最新状态
    const status = detector.status;

    if (!status.available) {
      return; // 只有当音乐可用时才上传
    }

    // 检查状态是否发生实质性变化（使用调用时的状态进行比较）
    if (!hasStatusChanged(lastUploadedStatus, statusAtCall, updateTypeAtCall)) {
      return; // 状态没有实质性变化，不上传
    }

    // 构建要上传的音乐数据
    const musicData = {
      available: status.available,
      id: status.id,
      playing: status.playing,
      position: status.position,
      duration: status.duration,
      detail: status.detail,
      timestamp: Date.now(), // 使用当前时间戳确保每次上传都是唯一的
      updateType: updateTypeAtCall, // 标记此次更新的类型
      // 添加一个唯一的请求ID，确保每次请求都是唯一的
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    try {
      const response = await axios.post(apiUrl, musicData, {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Key": AUTH_KEY, // 鉴权头
        },
      });
      console.log("上传成功：", response.data);
      // 更新上一次上传的状态
      lastUploadedStatus = { ...statusAtCall };
    } catch (error) {
      // console.error('上传失败：', error.response?.data || error.message);
    }
  }, UPLOAD_DEBOUNCE_DELAY);
};

const logger = () => {
  if (!detector.status.playing) {
    return;
  }

  // console.log(
  //   `Playing`,
  //   `${`${Math.floor(detector.status.position / 60)}`.padStart(
  //     2,
  //     "0"
  //   )}:${`${Math.round(detector.status.position % 60)}`.padStart(2, "0")}`,
  //   `${Math.round((detector.status.position / detector.status.duration) * 10000) /
  //     100}%`
  // )
};

// 添加单曲循环检测逻辑
let lastSongId = -1;
let lastPosition = 0;
let lastCheckTime = Date.now();

const detectSongRestart = () => {
  const status = detector.status;

  // 只有在歌曲可用且正在播放时才检测
  if (!status.available || !status.playing) {
    return;
  }

  // 如果切换了歌曲，更新lastSongId并重置状态
  if (status.id !== lastSongId) {
    lastSongId = status.id;
    lastPosition = status.position;
    lastCheckTime = Date.now();
    return;
  }

  // 检查是否可能是单曲循环重新开始
  // 条件：当前位置接近歌曲开始，而上次位置接近歌曲结尾
  const now = Date.now();
  if (now - lastCheckTime > 1000) {
    // 至少间隔1秒检查一次
    const position = status.position;
    const duration = status.duration;

    // 如果当前位置接近歌曲开始（前2秒内）且上次位置接近歌曲结尾（最后2秒内）
    if (position <= 2 && lastPosition >= duration - 2 && duration > 4) {
      console.log("检测到单曲循环重新播放");
      // 触发重新播放
      uploadMusicData("play");
    }

    lastPosition = position;
    lastCheckTime = now;
  }
};

detector.start().then(() => {
  // console.log(detector.status);
  uploadMusicData("play"); // 初始启动时上传一次
});

detector.on("play", (songId) => {
  // console.log("Song Id", songId);
  // console.log(detector.status);
  uploadMusicData("play"); // 切歌时上传
});

detector.on("status", (playing) => {
  // 更新playing状态并同时输出完整的detector.status
  // console.log("Song Playing", playing);
  // console.log(detector.status);

  // 当播放状态改变时上传数据
  uploadMusicData("status"); // 播放状态改变时上传
});

detector.on("position", (position) => {
  // console.log("Song Position", position);
  // console.log(detector.status); // 输出更新的status

  // 当播放位置改变时上传数据
  uploadMusicData("position"); // 位置改变时也上传，但会经过状态比较
});

setInterval(logger, 100);
// 添加单曲循环检测
setInterval(detectSongRestart, 500);
