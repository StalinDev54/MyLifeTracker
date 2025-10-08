// 以生活类语录为核心，大幅扩充日常互动内容
const feedbackMessages = {
  // 生活日常（核心内容，重点扩充）
  daily: [
    // 日常互动
    "你戳了戳对方的小脑袋瓜 🤔",
    "你戳了戳对方并递上一杯咖啡 ☕",
    "你戳了戳对方并说：“今天天气不错哦，适合出门走走” 🌤️",
    "你戳了戳对方并问：“中午吃什么？纠结半天了” 🍚",
    "你戳了戳对方并说：“最近看的这部剧太上头了！” 📺",
    "你戳了戳对方并分享了一首循环了一天的歌 🎵",
    "你戳了戳对方并说：“今天也要元气满满呀！” 💪",
    "你戳了戳对方并打了个招呼：“嗨～好久没聊啦” 👋",
    "你戳了戳对方并说：“盯着屏幕太久了，休息一下吧” 😌",
    "你戳了戳对方并说：“今天过得顺利吗？” 😊",
    "你戳了戳对方并说：“下午茶时间到，要不要一起喝奶茶？” 🥤",
    "你戳了戳对方并说：“昨晚熬夜了，现在好困啊” 😴",
    "你戳了戳对方并问：“周末要不要去新开的商场逛逛？” 🚗",
    "你戳了戳对方并说：“刚看的这本书，结局超意外！” 📖",
    "你戳了戳对方并说：“今天跑了3公里，成就感满满！” 🏃",
    "你戳了戳对方并说：“这个笑话我笑了半天，分享给你” 😆",
    "你戳了戳对方并说：“傍晚的夕阳染红了半边天，超美！” 🌇",
    "你戳了戳对方并问：“晚饭打算自己做还是点外卖？” 🍽️",
    "你戳了戳对方并说：“新上映的那部电影，评分好像很高” 🎬",
    "你戳了戳对方并分享了一张刚拍的云朵照片 ☁️",
    "你戳了戳对方并说：“路过甜品店，买了超好吃的提拉米苏” 🍰",
    "你戳了戳对方并说：“外面突然下雨了，你带伞了吗？” ☔",
    "你戳了戳对方并问：“最近有没有发现好听的新歌？” 🎧",
    "你戳了戳对方并说：“我发现一家川菜馆，味道超正宗！” 🍴",
    "你戳了戳对方并说：“今天步数终于破万了！” 🏃‍♀️",
    "你戳了戳对方并说：“今晚的月亮好亮，还能看到星星” 🌕",
    "你戳了戳对方并说：“这个周末去周边爬山，一起吗？” ⛰️",
    "你戳了戳对方并说：“跟着教程学做了红烧肉，居然成功了！” 👩‍🍳",
    "你戳了戳对方并说：“风好大，出门记得戴围巾” 🧣",
    "你戳了戳对方并问：“下周末有什么计划吗？” 🗓️",
    "你戳了戳对方并说：“楼下遇到一只超乖的小狗，还让摸” 🐶",
    "你戳了戳对方并说：“这个待办APP超好用，帮我治好了拖延症” 📱",
    "你戳了戳对方并说：“收拾了一上午房间，终于清爽了” 🧹",
    "你戳了戳对方并说：“突然好想吃冰淇淋，要不要一起点？” 🍦",
    "你戳了戳对方并说：“今天阴天，感觉整个人都懒洋洋的” ☁️",
    "你戳了戳对方并说：“最近总失眠，有没有助眠小技巧？” 😴",
    "你戳了戳对方并说：“我种的多肉终于长出新叶子了” 🌱",
    "你戳了戳对方并说：“今天试了新发型，感觉怎么样？” 💇",
    "你戳了戳对方并说：“超市的草莓打折，买了一大盒” 🍓",
    "你戳了戳对方并说：“刚学会一首新歌，唱给你听呀” 🎤",
    "你戳了戳对方并说：“这双新鞋子穿着超舒服” 👟",
    "你戳了戳对方并说：“今天去看了画展，有幅画超喜欢” 🎨",
    "你戳了戳对方并说：“发现一家宝藏咖啡馆，环境超棒” ☕",
    "你戳了戳对方并说：“刚看完一场脱口秀，笑到肚子痛” 😆",
    "你戳了戳对方并说：“今天阳光好暖，晒晒太阳真舒服” 🌞",

    // 工作相关（精简保留，作为补充）
    "你戳了戳对方并让他快来修bug 👨‍💻",
    "你戳了戳对方并说：“代码写得怎么样啦？”",
    "你戳了戳对方并发送了一个灵感 💡",
    "你戳了戳对方并说：“测试通过了！🎉”",
    "你戳了戳对方并说：“重构完成，感觉清爽多了” 😌",

    // 幽默调侃
    "你戳了戳对方并说：“你的代码比我头发还少” 🤣",
    "你戳了戳对方并说：“又在摸鱼吗？被我抓到了” 🐟",
    "你戳了戳对方并说：“这个bug比我还倔强” 🐛",
    "你戳了戳对方并说：“你的注释比我的情书还短” 💌",
    "你戳了戳对方并说：“这个bug藏得比私房钱还深” 💰",
  ],

  // 时间相关（作为次要补充，精简内容）
  timeOfDay: [
    { message: "你戳了戳对方并说：“早啊！☕”", range: [6, 12] },
    { message: "你戳了戳对方并说：“午间休息一下吧～😌”", range: [12, 14] },
    { message: "你戳了戳对方并说：“下午好呀！💪”", range: [14, 18] },
    { message: "你戳了戳对方并说：“晚上好～🌙”", range: [18, 22] },
    { message: "你戳了戳对方并说：“该休息啦～😴”", range: [22, 6] },
  ],

  weekday: [
    { message: "你戳了戳对方并说：“新的一周开始啦～”", day: 1 },
    { message: "你戳了戳对方并说：“周中啦，加油！”", day: 3 },
    { message: "你戳了戳对方并说：“快到周末了～”", day: 4 },
    { message: "你戳了戳对方并说：“周末愉快！🎉”", day: 5 },
    { message: "你戳了戳对方并说：“周末最后一天啦～”", day: 0 },
  ],

  // 节日和特殊日子（保留优先级，但内容精简）
  chineseFestivals: [
    { message: "你戳了戳对方并说：“春节快乐！🧧”", date: [1, 22] },
    { message: "你戳了戳对方并说：“元宵节快乐！🏮”", date: [1, 15] },
    { message: "你戳了戳对方并说：“端午安康！🐉”", date: [5, 5] },
    { message: "你戳了戳对方并说：“中秋快乐！🌕”", date: [8, 15] },
    { message: "你戳了戳对方并说：“国庆快乐！🇨🇳”", date: [10, 1] },
  ],

  specialDays: [
    { message: "你戳了戳对方并说：“1024程序员节快乐！💻”", date: [10, 24] },
    { message: "你戳了戳对方并说：“元旦快乐！🎉”", date: [1, 1] },
    { message: "你戳了戳对方并说：“情人节快乐！❤️”", date: [2, 14] },
  ],
};

// 记录最近使用的语录，避免短时间内重复
let recentMessages = [];
const MAX_RECENT = 15; // 增加记录数量，减少重复概率

// 记录已使用过的特殊类别
let usedCategories = new Set();

// 辅助函数：从候选列表中选择一条未在最近使用记录中的语录
const selectUniqueMessage = (candidates) => {
  // 过滤掉最近使用过的语录
  const available = candidates.filter((msg) => !recentMessages.includes(msg));

  let selected;
  if (available.length > 0) {
    // 随机选择未使用过的
    selected = available[Math.floor(Math.random() * available.length)];
  } else {
    // 所有候选都用过了，重置最近记录
    recentMessages = [];
    selected = candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 更新最近使用记录
  recentMessages.push(selected);
  if (recentMessages.length > MAX_RECENT) {
    recentMessages.shift(); // 移除最早的记录
  }

  return selected;
};

// 辅助函数：获取当前时间信息
const getCurrentTimeInfo = () => {
  const now = new Date();
  return {
    hour: now.getHours(),
    day: now.getDay(),
    month: now.getMonth() + 1,
    date: now.getDate(),
  };
};

// 时间相关匹配函数（精简版）
const getTimeOfDayMessage = () => {
  const { hour } = getCurrentTimeInfo();
  return feedbackMessages.timeOfDay
    .filter((item) => {
      const [start, end] = item.range;
      return start > end
        ? hour >= start || hour < end
        : hour >= start && hour < end;
    })
    .map((item) => item.message);
};

const getWeekdayMessage = () => {
  const { day } = getCurrentTimeInfo();
  return feedbackMessages.weekday
    .filter((item) => item.day === day)
    .map((item) => item.message);
};

// 节日和特殊日子匹配函数
const getFestivalMessage = () => {
  const { month, date } = getCurrentTimeInfo();
  return feedbackMessages.chineseFestivals
    .filter((item) => item.date[0] === month && item.date[1] === date)
    .map((item) => item.message);
};

const getSpecialDayMessage = () => {
  const { month, date } = getCurrentTimeInfo();
  return feedbackMessages.specialDays
    .filter((item) => item.date[0] === month && item.date[1] === date)
    .map((item) => item.message);
};

// 核心逻辑：优先展示生活类语录
export const getRandomFeedback = () => {
  // 特殊日子仍保持最高优先级，但只显示一次
  if (!usedCategories.has("festival")) {
    const festivalMessages = getFestivalMessage();
    if (festivalMessages.length > 0) {
      usedCategories.add("festival");
      return selectUniqueMessage(festivalMessages);
    }
  }

  if (!usedCategories.has("specialDay")) {
    const specialDayMessages = getSpecialDayMessage();
    if (specialDayMessages.length > 0) {
      usedCategories.add("specialDay");
      return selectUniqueMessage(specialDayMessages);
    }
  }

  // 主要展示生活类语录（占比最高）
  // 先尝试从生活类中选择未使用过的
  const dailyAvailable = feedbackMessages.daily.filter(
    (msg) => !recentMessages.includes(msg)
  );
  if (dailyAvailable.length > 0) {
    return selectUniqueMessage(feedbackMessages.daily);
  }

  // 当生活类语录暂时没有新内容时，才使用时间相关内容
  const timeOfDayMessages = getTimeOfDayMessage();
  const weekdayMessages = getWeekdayMessage();
  const timeRelatedMessages = [...timeOfDayMessages, ...weekdayMessages];

  if (timeRelatedMessages.length > 0) {
    return selectUniqueMessage(timeRelatedMessages);
  }

  // 最终后备：生活类语录（此时已重置最近记录）
  return selectUniqueMessage(feedbackMessages.daily);
};

// 导出原数组供其他用途
export { feedbackMessages };
