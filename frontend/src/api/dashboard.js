import { api } from "./client";

export const getStats = () => api.get("/dashboard/stats");
export const getRecentAssets = (limit) => api.get("/dashboard/recent-assets", { limit });
export const getActivityFeed = (limit) => api.get("/dashboard/activity", { limit });
export const getCharts = () => api.get("/dashboard/charts");
