import { api } from "./client";

export const getActivity = (params) => api.get("/activity", params);
export const getActivityByUser = (id) => api.get(`/activity/user/${id}`);
export const getActivityByModule = (mod) => api.get(`/activity/module/${mod}`);
