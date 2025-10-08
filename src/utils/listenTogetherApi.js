/**
 * 一起听功能API封装
 * 提供音乐播放URL获取、播放控制、进度同步等功能
 */

/**
 * 获取音乐播放URL
 * @param {string|number} songId - 歌曲ID
 * @returns {Promise<string|null>} 音频播放URL，失败时返回null
 */
export async function fetchMusicUrl(songId) {
  try {
    const apiUrl = `https://api.qijieya.cn/meting/?type=url&id=${songId}`;
    const response = await fetch(apiUrl);

    if (response.ok) {
      // 返回最终的URL（可能是重定向后的URL）
      return response.url;
    } else {
      console.error("获取音频URL失败:", response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error("获取音频URL时发生错误:", error);
    return null;
  }
}

/**
 * 创建音频播放器实例
 * @param {string} audioUrl - 音频URL
 * @returns {HTMLAudioElement} 音频播放器实例
 */
export function createAudioPlayer(audioUrl) {
  const audio = new Audio(audioUrl);
  audio.preload = "metadata";
  return audio;
}

/**
 * 播放音频（处理自动播放策略）
 * @param {HTMLAudioElement} audio - 音频播放器实例
 * @param {boolean} userInteracted - 用户是否已交互
 * @returns {Promise<boolean>} 播放是否成功
 */
export async function playAudio(audio, userInteracted = false) {
  if (!audio) return false;

  try {
    // 如果用户已交互或音频已暂停，则尝试播放
    if (userInteracted || audio.paused) {
      // 只在必要时添加微任务延迟以防止与暂停操作冲突
      if (!audio.paused) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      await audio.play();
      return true;
    } else {
      // 尝试播放但不处理错误（可能在等待用户交互）
      await audio.play().catch(() => {
        // 静默处理错误，因为可能是在等待用户交互
      });
      return true;
    }
  } catch (error) {
    if (error.name === "NotAllowedError") {
      console.warn("自动播放被阻止，等待用户交互");
    } else {
      console.error("播放失败:", error);
    }
    return false;
  }
}

/**
 * 暂停音频播放
 * @param {HTMLAudioElement} audio - 音频播放器实例
 */
export function pauseAudio(audio) {
  if (audio) {
    audio.pause();
  }
}

/**
 * 同步音频播放位置
 * @param {HTMLAudioElement} audio - 音频播放器实例
 * @param {number} targetPosition - 目标播放位置（秒）
 * @param {number} threshold - 同步阈值（秒），默认0.5秒
 */
export function syncAudioPosition(audio, targetPosition, threshold = 0.5) {
  if (audio && Math.abs(audio.currentTime - targetPosition) > threshold) {
    audio.currentTime = targetPosition;
  }
}

/**
 * 格式化时间（秒转为 mm:ss 格式）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * 计算播放进度百分比
 * @param {number} currentPosition - 当前播放位置（秒）
 * @param {number} duration - 音频总时长（秒）
 * @returns {number} 进度百分比（0-100）
 */
export function calculateProgressPercentage(currentPosition, duration) {
  if (!duration || duration <= 0) {
    return 0;
  }
  const percentage = (currentPosition / duration) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}

export default {
  fetchMusicUrl,
  createAudioPlayer,
  playAudio,
  pauseAudio,
  syncAudioPosition,
  formatTime,
  calculateProgressPercentage,
};
