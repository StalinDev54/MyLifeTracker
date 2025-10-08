// 音乐 API 工具函数 - 基于Socket.IO实时推送
import { io } from "socket.io-client";

const MUSIC_API_URL = "https://me.jiclub.site/api/cloudmusic";
let mainSocket = null;
let musicDataCallbacks = new Set();
let currentMusicData = {
  success: false,
  data: [],
  currentPlayingSong: null,
  timestamp: new Date().toISOString(),
  count: 0,
  limit: 15,
};

/**
 * 初始化音乐Socket服务，使用传入的主Socket实例
 * @param {Object} socket 主Socket.IO实例
 */
export const initMusicSocket = (socket) => {
  // 防止重复初始化
  if (mainSocket === socket && socket) {
    console.log("🎵 音乐Socket服务已经初始化");
    return;
  }

  // 断开旧的音乐Socket连接（如果存在）
  disconnectMusicSocket();

  if (!socket) {
    console.error("🎵 初始化音乐Socket服务失败: 无效的Socket实例");
    return;
  }

  mainSocket = socket;
  console.log("🎵 已使用主Socket实例初始化音乐Socket服务");

  // 监听音乐数据更新事件（服务端会主动推送）
  mainSocket.on("cloudmusicUpdate", (musicLogs) => {
    // console.log('🎵 接收到实时音乐数据更新:', musicLogs);
    handleMusicDataUpdate(musicLogs);
  });

  // 连接成功后立即请求初始数据
  fetchInitialMusicData();
};

/**
 * 创建独立的音乐Socket连接（备用方法，主要用于不使用主Socket的情况）
 */
const connectMusicSocket = () => {
  // 如果已经有主Socket实例，则不创建新连接
  if (mainSocket && mainSocket.connected) {
    console.log("🎵 已经有活跃的主Socket连接，使用主Socket连接");
    return mainSocket;
  }

  try {
    // 创建socket连接
    const socket = io("https://me.jiclub.site", {
      path: "/socket.io",
      autoConnect: true,
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      transports: ["polling", "websocket"],
    });

    // 监听连接事件
    socket.on("connect", () => {
      console.log("🎵 音乐Socket.IO连接成功，ID:", socket.id);
      // 连接成功后立即请求初始数据
      fetchInitialMusicData();
    });

    // 监听音乐数据更新事件（服务端会主动推送）
    socket.on("cloudmusicUpdate", (musicLogs) => {
      // console.log('🎵 接收到实时音乐数据更新:', musicLogs);
      handleMusicDataUpdate(musicLogs);
    });

    // 监听断开连接事件
    socket.on("disconnect", (reason) => {
      console.log("🎵 音乐Socket.IO连接断开，原因:", reason);
    });

    // 监听连接错误事件
    socket.on("connect_error", (error) => {
      console.error("🎵 音乐Socket.IO连接错误:", error.message);
    });

    // 监听重连事件
    socket.on("reconnect", (attemptNumber) => {
      console.log(`🎵 音乐Socket.IO重连成功 (第${attemptNumber}次尝试)`);
      // 重连成功后重新获取数据
      fetchInitialMusicData();
    });

    // 设置为主Socket
    mainSocket = socket;
    return socket;
  } catch (error) {
    console.error("🎵 创建音乐Socket.IO连接失败:", error);
    return null;
  }
};

/**
 * 处理音乐数据更新事件
 * @param {Array} musicLogs 音乐日志数据
 */
const handleMusicDataUpdate = (musicLogs) => {
  try {
    if (Array.isArray(musicLogs) && musicLogs.length > 0) {
      // 处理音乐数据
      const processedData = processMusicData(musicLogs);

      // 查找当前歌曲（从列表中找到第一首歌曲作为currentPlayingSong）
      const currentPlayingSong =
        processedData.length > 0 ? processedData[0] : null;

      // 更新当前音乐数据
      currentMusicData = {
        success: true,
        data: processedData,
        currentPlayingSong: currentPlayingSong, // 总是传递第一首歌曲作为当前歌曲
        timestamp: new Date().toISOString(),
        count: processedData.length,
        limit: 15,
      };

      // console.log("🎵 音乐数据已更新:", {
      //   总数: currentMusicData.count,
      //   当前歌曲: currentMusicData.currentPlayingSong?.detail?.name || "无",
      //   播放状态: currentMusicData.currentPlayingSong?.playing || false,
      //   所有歌曲: currentMusicData.data.map((song) => ({
      //     id: song.id,
      //     name: song.detail?.name,
      //     playing: song.playing,
      //   })),
      // });

      // 通知所有注册的回调函数
      musicDataCallbacks.forEach((callback) => {
        try {
          callback(currentMusicData);
        } catch (error) {
          console.error("🎵 执行音乐数据回调失败:", error);
        }
      });
    }
  } catch (error) {
    console.error("🎵 处理音乐数据更新失败:", error);
  }
};

/**
 * 获取初始音乐数据（通过HTTP API）
 */
const fetchInitialMusicData = async () => {
  try {
    const response = await fetch(MUSIC_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      // 处理初始数据
      handleMusicDataUpdate(data.data);
    }
  } catch (error) {
    console.error("🎵 获取初始音乐数据失败:", error);
  }
};

/**
 * 获取音乐播放数据（支持Socket实时更新）
 * @param {Function} callback 可选的回调函数，用于接收实时数据更新
 * @returns {Promise<Object>} 返回包含歌曲列表和当前播放歌曲的数据
 */
export const fetchMusicData = async (callback = null) => {
  try {
    // 如果提供了回调函数，注册它
    if (typeof callback === "function") {
      musicDataCallbacks.add(callback);
    }

    // 确保Socket连接
    if (!mainSocket || !mainSocket.connected) {
      connectMusicSocket();
    }

    // 如果已有数据，立即返回
    if (currentMusicData.success && currentMusicData.data.length > 0) {
      return { ...currentMusicData };
    }

    // 否则通过HTTP API获取初始数据
    const response = await fetch(MUSIC_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API 返回失败状态");
    }

    // 处理并更新数据
    const processedData = processMusicData(data.data || []);
    const currentPlayingSong =
      processedData.length > 0 ? processedData[0] : null;

    currentMusicData = {
      success: true,
      data: processedData,
      currentPlayingSong: currentPlayingSong, // 第一首歌曲作为当前歌曲
      timestamp: data.timestamp,
      count: data.count || 0,
      limit: data.limit || 15,
    };

    return { ...currentMusicData };
  } catch (error) {
    console.error("🎵 获取音乐数据失败:", error);

    // 返回默认数据作为备用
    return {
      success: false,
      error: error.message,
      data: [],
      currentPlayingSong: null,
      timestamp: new Date().toISOString(),
      count: 0,
      limit: 0,
    };
  }
};

/**
 * 注册音乐数据更新回调函数
 * @param {Function} callback 回调函数
 */
export const onMusicDataUpdate = (callback) => {
  if (typeof callback === "function") {
    musicDataCallbacks.add(callback);

    // 如果已有数据，立即调用回调
    if (currentMusicData.success) {
      callback(currentMusicData);
    }
  }
};

/**
 * 移除音乐数据更新回调函数
 * @param {Function} callback 回调函数
 */
export const offMusicDataUpdate = (callback) => {
  musicDataCallbacks.delete(callback);
};

/**
 * 断开音乐Socket连接
 */
export const disconnectMusicSocket = () => {
  if (mainSocket) {
    mainSocket.off("connect");
    mainSocket.off("cloudmusicUpdate");
    mainSocket.off("disconnect");
    mainSocket.off("connect_error");
    mainSocket.off("reconnect");

    // 注意：如果是使用的主Socket实例，我们不应该断开它，只移除事件监听器
    // 只有独立创建的音乐Socket才需要断开连接
    const isMainSocket = mainSocket.id && mainSocket.connected;
    if (isMainSocket && !mainSocket._isMainSocket) {
      // 只有独立创建的音乐Socket才断开连接
      mainSocket.disconnect();
    }
    
    mainSocket = null;

    // 清空回调函数
    musicDataCallbacks.clear();

    console.log("🎵 音乐Socket.IO连接已断开并清理资源");
  }
};

/**
 * 处理音乐数据，确保数据格式正确
 * @param {Array} musicList 音乐列表
 * @returns {Array} 处理后的音乐列表
 */
export const processMusicData = (musicList) => {
  if (!Array.isArray(musicList)) {
    return [];
  }

  return musicList.map((song) => ({
    available:
      song.available !== false && song.available !== undefined
        ? song.available
        : true,
    id: song.id,
    // 根据记忆规范：播放状态判断必须严格基于playing字段，保持原始playing状态
    playing: song.playing === true,
    position: song.position || 0,
    duration: song.duration || 0,
    detail: {
      name: song.detail?.name || "未知歌曲",
      cover: song.detail?.cover || "",
      albumName: song.detail?.albumName || "未知专辑",
      artistNames: Array.isArray(song.detail?.artistNames)
        ? song.detail.artistNames
        : ["未知艺术家"],
    },
    timestamp: song.timestamp || Date.now(),
    isFavorite: song.isFavorite || false,
  }));
};

/**
 * 获取当前歌曲（从API的currentPlayingSong或列表第一首）
 * @param {Array} musicList 音乐列表
 * @returns {Object|null} 当前歌曲或null
 */
export const getCurrentPlayingSong = (musicList) => {
  if (!Array.isArray(musicList) || musicList.length === 0) {
    return null;
  }

  // 优先返回API提供的currentPlayingSong，如果没有则返回第一首
  // currentPlayingSong表示当前歌曲（无论是否暂停），playing字段只表示播放/暂停状态
  return musicList[0] || null; // 这里简化处理，实际应该从全局状态中获取currentPlayingSong
};

/**
 * 更新歌曲播放状态
 * @param {Array} musicList 音乐列表
 * @param {number} songId 要播放的歌曲ID
 * @param {boolean} isPlaying 是否播放（可选，默认true）
 * @returns {Array} 更新后的音乐列表
 */
export const updatePlayingStatus = (musicList, songId, isPlaying = true) => {
  if (!Array.isArray(musicList)) {
    return [];
  }

  return musicList.map((song) => ({
    ...song,
    // 根据记忆规范：播放状态判断必须严格基于playing字段
    playing: song.id === songId && isPlaying === true,
  }));
};

/**
 * 清除所有歌曲的播放状态
 * @param {Array} musicList 音乐列表
 * @returns {Array} 更新后的音乐列表
 */
export const clearAllPlayingStatus = (musicList) => {
  if (!Array.isArray(musicList)) {
    return [];
  }

  return musicList.map((song) => ({
    ...song,
    playing: false,
  }));
};
