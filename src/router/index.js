import { createRouter, createWebHashHistory } from "vue-router";

// 导入组件
import ProfileView from "../views/ProfileView.vue";
import RecentActivitiesView from "../views/RecentActivitiesView.vue";
import WorksView from "../components/features/Works.vue";
import RegionStatisticsView from "../components/features/Statstic.vue";
import SociaMediaView from "../components/features/SociaMedia.vue";
import RealtimeVisitors from "../components/features/RealtimeVisitors.vue";
import TodoView from "../views/TodoView.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "profile",
      component: ProfileView,
    },
    {
      path: "/recent-activities",
      name: "recent-activities",
      component: RecentActivitiesView,
    },
    {
      path: "/works",
      name: "works",
      component: WorksView,
    },
    {
      path: "/statistics",
      name: "statistics",
      component: RegionStatisticsView,
    },
    {
      path: "/realtime-visitors",
      name: "realtime-visitors",
      component: RealtimeVisitors,
    },
    {
      path: "/social-media",
      name: "social-media",
      component: SociaMediaView,
    },
    {
      path: "/todo",
      name: "todo",
      component: TodoView,
    },
  ],
  // 确保每次路由跳转后滚动到页面顶部
  scrollBehavior(to, from, savedPosition) {
    // 总是滚动到顶部，不考虑保存的位置
    return { top: 0, left: 0, behavior: 'smooth' };
  },
});

export default router;
