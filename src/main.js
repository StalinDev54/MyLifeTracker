// 导入核心依赖
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { setColorScheme } from "mdui/functions/setColorScheme.js";
import { createScheme } from "sober-theme";

// 导入UI组件库
import "sober";
import "mdui/mdui.css";
import "mdui";
import "mdui/components/icon.js";

// 导入样式
import "./style.css";
import "@fortawesome/fontawesome-free/css/all.css";

// 修正路径：添加 /css/ 子目录
import "@material-icons/font/css/all.css"; // Filled 风格（正确路径）

// 创建应用实例
const app = createApp(App);

// 设置颜色方案
setColorScheme("#0061a4");

// 使用 Vue Router
app.use(router);

// 挂载应用
app.mount("#app");
