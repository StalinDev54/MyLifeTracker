const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const https = require("https");
const fs = require("fs");
const fsPromises = fs.promises;
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const { JSDOM } = require("jsdom");

// 初始化Express应用
const app = express();
const server = http.createServer(app);

// ==================== 1. 统一CORS配置 ====================
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://me.jiclub.site",
  "http://8.134.68.39:3000",
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ==================== 2. 核心配置 ====================
const PORT = 3000;
let onlineUsers = 0;
const BAIDU_STAT_TOKEN =
  "121.7b81645d64c75f66adbee204986c78ee.YQKxoK2R3PI9JZ5cERFAPAR_1wP0LWicpPR3rB5.79LeNA";
const websiteRoot = "/www/wwwroot/me.jiclub.site";
const jsDirectory = "/www/wwwroot/node";
const DATA_FILE = path.join(__dirname, "lifelogs.json");
const CLOUDMUSIC_DATA_FILE = path.join(__dirname, "cloudmusic_logs.json");
const SECRET_KEY = "1545433540";
const SCRAPE_TARGET_URL =
  "https://jiclub.site/archives.php?user=36b175225d6773fc1a739acdd8834664";
let writeQueue = Promise.resolve();
const CLOUDMUSIC_LOG_LIMIT = 15;

// ==================== 3. 初始化检查 ====================
function checkCriticalFiles() {
  if (!fs.existsSync(websiteRoot)) {
    console.error(`【错误】网站主目录不存在 - ${websiteRoot}`);
  } else {
    console.log(`【初始化】网站主目录存在：${websiteRoot}`);
  }

  const indexFilePath = path.join(websiteRoot, "index.html");
  if (!fs.existsSync(indexFilePath)) {
    console.error(`【错误】index.html文件不存在 - ${indexFilePath}`);
  } else {
    console.log(`【初始化】index.html文件存在：${indexFilePath}`);
  }

  if (!fs.existsSync(CLOUDMUSIC_DATA_FILE)) {
    fs.writeFileSync(CLOUDMUSIC_DATA_FILE, "[]", "utf8");
    console.log(
      `【初始化】云音乐日志文件不存在，已创建：${CLOUDMUSIC_DATA_FILE}`
    );
  } else {
    console.log(`【初始化】云音乐日志文件存在：${CLOUDMUSIC_DATA_FILE}`);
  }
}
checkCriticalFiles();

// ==================== 4. 中间件配置 ====================
app.use(express.json({ limit: "10kb" }));

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Auth-Key");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.options("*", (req, res) => {
  res.sendStatus(204);
});

// B站API代理配置 - 用户信息卡片API
app.use(
  "/x/web-interface/card",
  createProxyMiddleware({
    target: "https://api.bilibili.com",
    changeOrigin: true,
    pathRewrite: {
      "^/x/web-interface/card": "/x/web-interface/card",
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
      );
      proxyReq.setHeader("Referer", "https://www.bilibili.com/");
      proxyReq.setHeader("Accept", "application/json, text/plain, */*");
    },
    logLevel: "debug",
  })
);

// B站图片资源代理配置
app.use(
  "/bilibili-img",
  createProxyMiddleware({
    target: "https://i0.hdslb.com",
    changeOrigin: true,
    pathRewrite: {
      "^/bilibili-img": "",
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
      );
      proxyReq.setHeader("Referer", "https://www.bilibili.com/");
    },
    logLevel: "debug",
  })
);

// 备用B站图片资源代理配置 - i1子域名
app.use(
  "/bilibili-img-i1",
  createProxyMiddleware({
    target: "https://i1.hdslb.com",
    changeOrigin: true,
    pathRewrite: {
      "^/bilibili-img-i1": "",
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
      );
      proxyReq.setHeader("Referer", "https://www.bilibili.com/");
    },
    logLevel: "debug",
  })
);

// 备用B站图片资源代理配置 - i2子域名
app.use(
  "/bilibili-img-i2",
  createProxyMiddleware({
    target: "https://i2.hdslb.com",
    changeOrigin: true,
    pathRewrite: {
      "^/bilibili-img-i2": "",
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
      );
      proxyReq.setHeader("Referer", "https://www.bilibili.com/");
    },
    logLevel: "debug",
  })
);

// 静态资源服务
app.use(express.static(websiteRoot));
app.use("/js", express.static(jsDirectory));
app.use(
  "/socket.io",
  express.static(
    path.join(__dirname, "node_modules", "socket.io", "client-dist")
  )
);

// 百度统计安全代理
app.post("/baidu-stat/proxy", async (req, res) => {
  try {
    console.log(`【百度统计代理】收到安全请求：/baidu-stat/proxy`);

    const {
      key,
      method,
      "start-date": startDate,
      "end-date": endDate,
      metrics,
      gran,
      "max-results": maxResults,
      ...otherParams
    } = req.body;

    const requiredParams = ["key", "method"];
    const missingParams = requiredParams.filter((param) => !req.body[param]);
    if (missingParams.length > 0) {
      return res.status(400).json({
        error: "参数缺失",
        detail: `缺少必要业务参数：${missingParams.join(", ")}`,
      });
    }

    const apiUrl = new URL(
      "https://openapi.baidu.com/rest/2.0/mtj/svc/app/getDataByKey"
    );
    apiUrl.searchParams.append("access_token", BAIDU_STAT_TOKEN);
    apiUrl.searchParams.append("key", key);
    apiUrl.searchParams.append("method", method);
    if (startDate) apiUrl.searchParams.append("start-date", startDate);
    if (endDate) apiUrl.searchParams.append("end-date", endDate);
    if (metrics) apiUrl.searchParams.append("metrics", metrics);
    if (gran) apiUrl.searchParams.append("gran", gran);
    if (maxResults) apiUrl.searchParams.append("max-results", maxResults);
    Object.keys(otherParams).forEach((param) => {
      apiUrl.searchParams.append(param, otherParams[param]);
    });

    console.log(
      `【百度统计代理】转发请求：${apiUrl.origin}${apiUrl.pathname}?key=${key}&method=${method}...`
    );

    const response = await axios.get(apiUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Referer: "http://me.jiclub.site/",
        Accept: "application/json, text/plain, */*",
        "Cache-Control": "no-cache",
      },
      timeout: 60000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
      }),
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(`【百度统计代理】请求失败：${error.message}`);
    res.status(500).json({
      error: "百度统计代理错误",
      detail: error.response?.data || "无法连接到百度统计API",
    });
  }
});

// ==================== 5. 根路径处理 ====================
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "后端服务运行正常（3000端口）",
    availableAPIs: {
      onlineUsers: "GET /api/online-users（获取在线人数）",
      scrapeLife: "GET /getlifeabout（爬取动态数据）",
      getLogs: "GET /getStalin（获取设备日志）",
      addLog: "POST /postStalin（添加设备日志，需鉴权）",
      getCloudmusicLogs: "GET /api/cloudmusic（获取音乐播放日志，默认15条）",
      addCloudmusicLog:
        "POST /api/cloudmusic（添加音乐播放日志，需鉴权，支持任意参数）",
      baiduStat: "POST /baidu-stat/proxy（安全获取百度统计数据）",
    },
    socketIO:
      "已启用（实时事件：onlineUsersUpdate, logsUpdate, cloudmusicUpdate）",
    note: "百度统计API已通过后端代理隐藏Token；音乐日志默认保留最新15条，支持任意参数上传",
  });
});

// ==================== 6. Socket.IO 实时通信 ====================
io.on("connection", async (socket) => {
  onlineUsers++;
  console.log(`【在线统计】用户连接，当前在线：${onlineUsers}`);
  io.emit("onlineUsersUpdate", onlineUsers);

  try {
    const latestDeviceLogs = await readData();
    const latestMusicLogs = await readCloudmusicData();
    socket.emit("logsUpdate", latestDeviceLogs);
    socket.emit("cloudmusicUpdate", latestMusicLogs);
    console.log(
      `【Socket推送】客户端初始化：设备日志${latestDeviceLogs.length}条，音乐日志${latestMusicLogs.length}条`
    );
  } catch (error) {
    console.error(`【Socket推送】初始化失败：${error.message}`);
  }

  socket.on("disconnect", () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    console.log(`【在线统计】用户断开，当前在线：${onlineUsers}`);
    io.emit("onlineUsersUpdate", onlineUsers);
  });
});

// ==================== 7. 业务路由 ====================
// 7.1 获取在线人数API
app.get("/api/online-users", (req, res) => {
  res.json({
    onlineUsers,
    timestamp: new Date().toISOString(),
  });
});

// 7.2 云音乐播放日志API
// 7.2.1 POST - 添加/更新音乐日志（支持任意参数，仅鉴权）
app.post("/api/cloudmusic", async (req, res) => {
  try {
    // 1. 仅保留鉴权
    const authKey = req.headers["x-auth-key"];
    if (authKey !== SECRET_KEY) {
      console.warn(`【音乐日志】POST鉴权失败 - 来源：${req.ip}`);
      return res.status(403).json({
        success: false,
        error: "禁止访问",
        detail: "鉴权密钥错误（X-Auth-Key不匹配）",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. 完全放宽参数：直接接收请求体，不做任何字段/类型校验
    const newMusicLog = {
      ...req.body,
      // 自动添加时间戳（若客户端未传）
      timestamp: req.body.timestamp || Math.floor(Date.now() / 1000),
    };

    // 3. 读取现有日志，兼容“无id字段”场景
    let musicLogs = await readCloudmusicData();
    const sameSongIndex = newMusicLog.id
      ? musicLogs.findIndex((log) => log.id === newMusicLog.id)
      : -1;

    if (sameSongIndex !== -1) {
      // 有id且存在同id日志：覆盖旧记录
      musicLogs.splice(sameSongIndex, 1);
      musicLogs.unshift(newMusicLog);
      console.log(
        `【音乐日志】更新 - 含id: ${newMusicLog.id}（参数：${Object.keys(
          newMusicLog
        ).join(", ")}）`
      );
    } else {
      // 无id或无同id日志：新增记录
      musicLogs.unshift(newMusicLog);
      console.log(
        `【音乐日志】新增 - 无id或新id（参数：${Object.keys(newMusicLog).join(
          ", "
        )}）`
      );
    }

    // 4. 写入日志（限制15条）
    await writeCloudmusicData(musicLogs);

    // 5. 实时推送更新
    const updatedMusicLogs = await readCloudmusicData();
    io.emit("cloudmusicUpdate", updatedMusicLogs);

    // 6. 返回结果
    res.status(201).json({
      success: true,
      message: sameSongIndex !== -1 ? "音乐日志更新成功" : "音乐日志新增成功",
      data: newMusicLog,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`【音乐日志】POST错误：${error.message}`);
    res.status(500).json({
      success: false,
      error: "服务器内部错误",
      detail: "处理音乐日志失败",
      timestamp: new Date().toISOString(),
    });
  }
});

// 7.2.2 GET - 获取音乐播放日志
app.get("/api/cloudmusic", async (req, res) => {
  try {
    console.log(`【音乐日志】GET请求 - 来源：${req.ip}`);
    const musicLogs = await readCloudmusicData();
    const currentPlayingSong =
      musicLogs.find((log) => log.playing === true) || null;

    res.status(200).json({
      success: true,
      count: musicLogs.length,
      limit: CLOUDMUSIC_LOG_LIMIT,
      data: musicLogs,
      currentPlayingSong: currentPlayingSong,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`【音乐日志】GET错误：${error.message}`);
    res.status(500).json({
      success: false,
      error: "服务器内部错误",
      detail: "读取音乐日志失败",
      timestamp: new Date().toISOString(),
    });
  }
});

// 7.3 爬取动态数据API
app.get("/getlifeabout", async (req, res) => {
  try {
    console.log(`【接口请求】GET /getlifeabout - 来源：${req.ip}`);
    const scrapedData = await scrapeLifeData();
    res.status(200).json({
      success: true,
      count: scrapedData.length,
      data: scrapedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "爬取数据失败",
      detail: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 7.4 设备日志相关API
app.get("/getStalin", async (req, res) => {
  try {
    console.log(`【接口请求】GET /getStalin - 来源：${req.ip}`);
    const logs = await readData();
    res.status(200).json(logs);
  } catch (error) {
    console.error(`【接口错误】GET /getStalin：${error.message}`);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

app.post("/postStalin", async (req, res) => {
  try {
    const authKey = req.headers["x-auth-key"];
    if (authKey !== SECRET_KEY) {
      console.warn(`【接口鉴权失败】POST /postStalin - 来源：${req.ip}`);
      return res.status(403).json({ error: "禁止访问（鉴权失败）" });
    }

    const newLogEntry = req.body;
    if (
      !newLogEntry ||
      typeof newLogEntry !== "object" ||
      !newLogEntry.device
    ) {
      return res
        .status(400)
        .json({ error: "无效的日志格式（需包含device字段）" });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    let logs = await readData();
    let responseEntry;

    const sameDeviceLogs = logs.filter(
      (log) => log.device === newLogEntry.device
    );
    const latestSameDeviceLog =
      sameDeviceLogs.length > 0 ? sameDeviceLogs[0] : null;
    const isStatusSwitch = latestSameDeviceLog
      ? latestSameDeviceLog.status !== newLogEntry.status
      : false;

    let firstLockRecord = null;

    if (isStatusSwitch) {
      if (newLogEntry.status === false) {
        firstLockRecord = {
          device: newLogEntry.device,
          status: false,
          battery: newLogEntry.battery,
          is_charging: newLogEntry.is_charging,
          time: newLogEntry.time || currentTime,
          ip: newLogEntry.ip || req.ip,
        };
        console.log(`【首次锁屏】设备: ${newLogEntry.device}，已记录完整信息`);
      }

      const newEntry = {
        device: newLogEntry.device,
        status: newLogEntry.status,
        battery: newLogEntry.battery,
        is_charging: newLogEntry.is_charging,
        time: newLogEntry.time || currentTime,
        ip: newLogEntry.ip || req.ip,
        ...(newLogEntry.app_name && { app_name: newLogEntry.app_name }),
        ...(newLogEntry.app_package && {
          app_package: newLogEntry.app_package,
        }),
        firstLockRecord: firstLockRecord,
      };

      if (newLogEntry.status === true) {
        newEntry.firstLockRecord = null;
      }

      logs.unshift(newEntry);
      responseEntry = newEntry;
    } else {
      if (newLogEntry.status === true) {
        const newEntry = {
          device: newLogEntry.device,
          status: true,
          battery: newLogEntry.battery,
          is_charging: newLogEntry.is_charging,
          time: newLogEntry.time || currentTime,
          ip: newLogEntry.ip || req.ip,
          app_name: newLogEntry.app_name,
          app_package: newLogEntry.app_package,
          firstLockRecord: null,
        };
        logs.unshift(newEntry);
        responseEntry = newEntry;
      } else {
        const targetLogIndex = logs.findIndex(
          (log) => log.device === newLogEntry.device && log.status === false
        );

        if (targetLogIndex !== -1) {
          logs[targetLogIndex] = {
            device: newLogEntry.device,
            status: false,
            battery: newLogEntry.battery,
            is_charging: newLogEntry.is_charging,
            time: newLogEntry.time || currentTime,
            ip: newLogEntry.ip || req.ip,
            firstLockRecord: logs[targetLogIndex].firstLockRecord,
          };
          responseEntry = logs[targetLogIndex];
          console.log(
            `【锁屏更新】设备: ${newLogEntry.device}，保留首次锁屏记录`
          );
        } else {
          firstLockRecord = {
            device: newLogEntry.device,
            status: false,
            battery: newLogEntry.battery,
            is_charging: newLogEntry.is_charging,
            time: newLogEntry.time || currentTime,
            ip: newLogEntry.ip || req.ip,
          };

          const newEntry = {
            device: newLogEntry.device,
            status: false,
            battery: newLogEntry.battery,
            is_charging: newLogEntry.is_charging,
            time: newLogEntry.time || currentTime,
            ip: newLogEntry.ip || req.ip,
            firstLockRecord: firstLockRecord,
          };
          logs.unshift(newEntry);
          responseEntry = newEntry;
        }
      }
    }

    if (logs.length > 30) logs = logs.slice(0, 30);
    await writeData(logs);

    try {
      const updatedLogs = await readData();
      io.emit("logsUpdate", updatedLogs);
    } catch (pushError) {
      console.error(`【Socket推送失败】${pushError.message}`);
    }

    res.status(201).json(responseEntry);
  } catch (error) {
    console.error(`【接口错误】${error.message}`);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// ==================== 8. SPA路由兼容 ====================
app.get("*", (req, res) => {
  const indexPath = path.join(websiteRoot, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>404 - 页面未找到</h1>
      <p>无法找到文件: ${indexPath}</p>
      <p>请检查网站根目录配置是否正确</p>
    `);
  }
});

// ==================== 9. 工具函数 ====================
// 9.1 设备日志工具函数
async function ensureDataFile() {
  try {
    await fsPromises.access(DATA_FILE);
  } catch (err) {
    await fsPromises.writeFile(DATA_FILE, "[]", "utf8");
    console.log(`【数据文件】初始化新的设备日志文件：${DATA_FILE}`);
  }
}

async function readData() {
  await ensureDataFile();
  try {
    const data = await fsPromises.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    console.error(`【数据文件】设备日志读取失败，重置为空数组：${e.message}`);
    await fsPromises.writeFile(DATA_FILE, "[]");
    return [];
  }
}

async function writeData(data) {
  writeQueue = writeQueue
    .then(async () => {
      await fsPromises.writeFile(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
      );
    })
    .catch((err) => {
      console.error(`【数据文件】设备日志写入失败：${err.message}`);
      throw err;
    });
  return writeQueue;
}

// 9.2 云音乐日志工具函数
async function ensureCloudmusicDataFile() {
  try {
    await fsPromises.access(CLOUDMUSIC_DATA_FILE);
  } catch (err) {
    await fsPromises.writeFile(CLOUDMUSIC_DATA_FILE, "[]", "utf8");
    console.log(
      `【数据文件】初始化新的云音乐日志文件：${CLOUDMUSIC_DATA_FILE}`
    );
  }
}

async function readCloudmusicData() {
  await ensureCloudmusicDataFile();
  try {
    const data = await fsPromises.readFile(CLOUDMUSIC_DATA_FILE, "utf8");
    const logs = JSON.parse(data);
    return logs
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, CLOUDMUSIC_LOG_LIMIT);
  } catch (e) {
    console.error(`【数据文件】云音乐日志读取失败，重置为空数组：${e.message}`);
    await fsPromises.writeFile(CLOUDMUSIC_DATA_FILE, "[]");
    return [];
  }
}

async function writeCloudmusicData(data) {
  const limitedLogs = data
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, CLOUDMUSIC_LOG_LIMIT);
  writeQueue = writeQueue
    .then(async () => {
      await fsPromises.writeFile(
        CLOUDMUSIC_DATA_FILE,
        JSON.stringify(limitedLogs, null, 2),
        "utf8"
      );
    })
    .catch((err) => {
      console.error(`【数据文件】云音乐日志写入失败：${err.message}`);
      throw err;
    });
  return writeQueue;
}

// 9.3 爬取函数
async function scrapeLifeData() {
  const results = [];
  try {
    const { data: html } = await axios.get(SCRAPE_TARGET_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Referer: "https://jiclub.site/",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const contentContainer = document.querySelector(".sh-homecontent");

    if (!contentContainer) {
      throw new Error("未找到核心内容容器 .sh-homecontent");
    }

    const recordItems = contentContainer.querySelectorAll(
      ".sh-homecontent-lie"
    );
    recordItems.forEach((item) => {
      const timeEl = item.querySelector(".sh-homecontent-left-time");
      const time = timeEl
        ? timeEl.getAttribute("lang") || timeEl.textContent.trim()
        : "";

      const imgUrls = [];
      const imgContainer = item.querySelector(".homecontent-right-tw-img");
      if (imgContainer) {
        imgContainer.querySelectorAll("img").forEach((img) => {
          const imgUrl =
            img.getAttribute("data-src")?.trim() ||
            img.getAttribute("src")?.trim();
          if (imgUrl) imgUrls.push(imgUrl);
        });
      }

      const locationEl = item.querySelector(".sh-homecontent-left-time-dw");
      const location = locationEl ? locationEl.textContent.trim() : "";

      const messageEl = item.querySelector(".homecontent-right-nr-text");
      const message = messageEl ? messageEl.textContent.trim() : "";

      let isMusic = false;
      let musicTitle = "";
      let musicSinger = "";
      const musicTitleEl = item.querySelector(
        ".sh-homecontent-right-lie-music-title"
      );

      if (musicTitleEl) {
        isMusic = true;
        musicTitle = musicTitleEl.textContent.trim();
        const musicSingerEl = item.querySelector(
          ".homecontent-right-nr-text-music-p"
        );
        musicSinger = musicSingerEl ? musicSingerEl.textContent.trim() : "";
      }

      let cid = null;
      const cidContainer = item.querySelector(".sh-homecontent-right-wk");
      if (cidContainer?.firstElementChild) {
        const onClickAttr =
          cidContainer.firstElementChild.getAttribute("onClick") || "";
        const cidMatch = onClickAttr.match(/cid=([^&']+)/);
        if (cidMatch?.[1]) cid = cidMatch[1];
      }

      const recordData = isMusic
        ? {
            message: musicTitle,
            isMusic: true,
            musicTitle: message,
            musicSinger,
            imgUrls,
            time,
            location,
            cid,
          }
        : {
            message,
            imgUrls,
            time,
            location,
            isMusic: false,
            cid,
          };

      results.push(recordData);
    });

    return results.slice(0, 5);
  } catch (error) {
    console.error(`【爬取】过程出错：${error.message}`);
    if (error.response) {
      console.error(`【爬取】目标响应状态码：${error.response.status}`);
    }
    throw error;
  }
}

// ==================== 10. 服务器启动 ====================
(async () => {
  try {
    await ensureDataFile();
    await ensureCloudmusicDataFile();
    server.listen(PORT, () => {
      console.log(`\n【服务器启动成功】`);
      console.log(`- 绑定地址：0.0.0.0:${PORT}（所有网卡可访问）`);
      console.log(`- 允许跨域的前端地址：${ALLOWED_ORIGINS.join(", ")}`);
      console.log(`- 根路径（/）：返回服务状态，不跳转网站`);
      console.log(
        `- 在线人数API：GET http://8.134.68.39:${PORT}/api/online-users`
      );
      console.log(
        `- 云音乐日志API：GET/POST http://8.134.68.39:${PORT}/api/cloudmusic（默认15条，支持任意参数）`
      );
      console.log(
        `- 百度统计安全代理：POST http://8.134.68.39:${PORT}/baidu-stat/proxy`
      );
      console.log(
        `- 实时通信：已启用Socket.IO（支持onlineUsersUpdate, logsUpdate, cloudmusicUpdate）`
      );
    });
  } catch (error) {
    console.error(`【服务器启动失败】：${error.message}`);
    process.exit(1);
  }
})();

// ==================== 11. 错误处理 ====================
app.on("error", (error) => {
  console.error(`【服务器运行错误】：${error.message}`);
});

process.on("unhandledRejection", (error) => {
  console.error(`【未处理Promise拒绝】：${error.message}`);
});

process.on("SIGTERM", () => {
  console.log(`\n【服务器关闭】收到关闭信号，正在清理资源...`);
  server.close(() => {
    console.log(`服务器已优雅关闭`);
    process.exit(0);
  });
});
