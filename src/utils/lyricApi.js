/**
 * 歌词 API 工具文件
 * 用于获取和解析网易云音乐歌词
 */

/**
 * 获取歌曲歌词
 * @param {string|number} songId - 歌曲ID
 * @returns {Promise<Object>} 歌词数据
 */
export async function fetchLyrics(songId) {
  if (!songId) {
    throw new Error("歌曲ID不能为空");
  }

  try {
    const response = await fetch(
      `https://163api.qijieya.cn/lyric?id=${songId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data = await response.json();

    // 检查API返回状态
    if (data.code !== 200) {
      throw new Error(`API错误: ${data.code}`);
    }

    return {
      success: true,
      data: data,
      lyrics: parseLRCLyrics(data.lrc?.lyric || ""),
      translatedLyrics: parseLRCLyrics(data.lyric?.tlyric || ""),
      error: null,
    };
  } catch (error) {
    console.error("获取歌词失败:", error);
    return {
      success: false,
      data: null,
      lyrics: [],
      translatedLyrics: [],
      error: error.message,
    };
  }
}

/**
 * 解析 LRC 格式歌词
 * @param {string} lrcText - LRC格式的歌词文本
 * @returns {Array} 解析后的歌词数组
 */
export function parseLRCLyrics(lrcText) {
  if (!lrcText || typeof lrcText !== "string") {
    return [];
  }

  const lyrics = [];
  const lines = lrcText.split("\n");

  for (const line of lines) {
    // 匹配时间标签格式 [mm:ss.xxx]
    const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);

    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      const milliseconds = parseInt(timeMatch[3].padEnd(3, "0"), 10);

      // 计算总秒数
      const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;

      // 提取歌词文本（移除时间标签）
      const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/, "").trim();

      // 过滤空行和元信息行（如作词、作曲信息）
      if (
        text &&
        !text.startsWith("作词") &&
        !text.startsWith("作曲") &&
        !text.startsWith("编曲")
      ) {
        lyrics.push({
          time: totalSeconds,
          text: text,
        });
      }
    }
  }

  // 按时间排序确保正确显示顺序
  return lyrics.sort((a, b) => a.time - b.time);
}

/**
 * 根据当前播放时间获取对应的歌词索引
 * @param {Array} lyrics - 歌词数组
 * @param {number} currentTime - 当前播放时间（秒）
 * @returns {number} 当前歌词索引
 */
export function getCurrentLyricIndex(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0 || currentTime < 0) {
    return 0;
  }

  let index = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      index = i;
    } else {
      break;
    }
  }

  return index;
}

/**
 * 获取当前应该显示的歌词文本
 * @param {Array} lyrics - 歌词数组
 * @param {number} currentTime - 当前播放时间（秒）
 * @returns {string} 当前歌词文本
 */
export function getCurrentLyricText(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0) {
    return "暂无歌词";
  }

  const index = getCurrentLyricIndex(lyrics, currentTime);
  return lyrics[index]?.text || "暂无歌词";
}

/**
 * 合并原文歌词和翻译歌词
 * @param {Array} originalLyrics - 原文歌词
 * @param {Array} translatedLyrics - 翻译歌词
 * @returns {Array} 合并后的歌词数组
 */
export function mergeLyrics(originalLyrics, translatedLyrics) {
  if (!originalLyrics || originalLyrics.length === 0) {
    return translatedLyrics || [];
  }

  if (!translatedLyrics || translatedLyrics.length === 0) {
    return originalLyrics;
  }

  // 创建翻译歌词的时间映射
  const translationMap = new Map();
  translatedLyrics.forEach((lyric) => {
    translationMap.set(lyric.time, lyric.text);
  });

  // 为原文歌词添加翻译
  return originalLyrics.map((lyric) => ({
    ...lyric,
    translation: translationMap.get(lyric.time) || "",
  }));
}

/**
 * 从歌曲数据中提取歌曲ID（适配不同的数据结构）
 * @param {Object} songData - 歌曲数据对象
 * @returns {string|number|null} 歌曲ID
 */
export function extractSongId(songData) {
  if (!songData) {
    return null;
  }

  // 尝试不同的可能字段
  return (
    songData.id ||
    songData.songId ||
    songData.musicId ||
    songData.trackId ||
    null
  );
}

/**
 * 缓存歌词数据到本地存储
 * @param {string|number} songId - 歌曲ID
 * @param {Object} lyricsData - 歌词数据
 */
export function cacheLyrics(songId, lyricsData) {
  if (!songId || !lyricsData) {
    return;
  }

  try {
    const cacheKey = `lyrics_cache_${songId}`;
    const cacheData = {
      ...lyricsData,
      cachedAt: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
    };

    // 检查缓存大小，如果超过限制则清理旧缓存
    const MAX_CACHE_SIZE = 2; // 最多缓存2首歌曲的歌词
    const allKeys = Object.keys(localStorage);
    const lyricKeys = allKeys.filter(key => key.startsWith('lyrics_cache_'));
    
    if (lyricKeys.length >= MAX_CACHE_SIZE) {
      // 找到最旧的缓存项并删除
      let oldestKey = null;
      let oldestTime = Infinity;
      
      lyricKeys.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.cachedAt < oldestTime) {
            oldestTime = item.cachedAt;
            oldestKey = key;
          }
        } catch (e) {
          // 解析失败的缓存项直接删除
          localStorage.removeItem(key);
        }
      });
      
      if (oldestKey) {
        localStorage.removeItem(oldestKey);
      }
    }

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("缓存歌词失败:", error);
  }
}

/**
 * 从本地存储获取缓存的歌词数据
 * @param {string|number} songId - 歌曲ID
 * @returns {Object|null} 缓存的歌词数据或null
 */
export function getCachedLyrics(songId) {
  if (!songId) {
    return null;
  }

  try {
    const cacheKey = `lyrics_cache_${songId}`;
    const cachedData = localStorage.getItem(cacheKey);
    console.log(`🔍 检查缓存键: ${cacheKey}, 数据存在: ${!!cachedData}`);

    if (!cachedData) {
      return null;
    }

    const parsed = JSON.parse(cachedData);
    console.log(`🔍 解析缓存数据:`, parsed);

    // 检查是否过期
    if (parsed.expires && Date.now() > parsed.expires) {
      console.log(`⏰ 缓存过期: ${songId}`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("获取缓存歌词失败:", error);
    return null;
  }
}

/**
 * 正在进行的歌词请求映射，用于防止同时发起相同的请求
 */
const pendingRequests = new Map();

/**
 * 获取歌词（带缓存功能）
 * @param {string|number} songId - 歌曲ID
 * @param {boolean} useCache - 是否使用缓存，默认true
 * @returns {Promise<Object>} 歌词数据
 */
export async function fetchLyricsWithCache(songId, useCache = true) {
  if (!songId) {
    throw new Error("歌曲ID不能为空");
  }

  // 生成请求键
  const requestKey = `${songId}_${useCache}`;

  // 检查是否有相同的请求正在进行中
  if (pendingRequests.has(requestKey)) {
    console.log(`⏳ 复用进行中的请求: ${songId}`);
    return pendingRequests.get(requestKey);
  }

  // 优先尝试从缓存获取
  if (useCache) {
    console.log(`🔍 检查缓存: ${songId}`);
    const cachedLyrics = getCachedLyrics(songId);
    if (cachedLyrics) {
      console.log(`📝 从缓存获取歌词: ${songId}`);
      return cachedLyrics;
    } else {
      console.log(`❌ 缓存未命中: ${songId}`);
    }
  }

  // 创建新的请求Promise
  const requestPromise = fetchLyrics(songId).then(result => {
    // 成功获取歌词后缓存
    if (result.success && useCache) {
      console.log(`💾 缓存歌词: ${songId}`);
      cacheLyrics(songId, result);
    }
    // 清理进行中的请求
    pendingRequests.delete(requestKey);
    return result;
  }).catch(error => {
    // 清理进行中的请求
    pendingRequests.delete(requestKey);
    throw error;
  });

  // 将请求Promise添加到进行中的请求映射中
  pendingRequests.set(requestKey, requestPromise);

  // 从API获取歌词
  console.log(`📝 从API获取歌词: ${songId}`);
  return requestPromise;
}
