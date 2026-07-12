import { api } from "./client";

export const getAssets = () => api.get("/assets");
export const getAsset = (id) => api.get(`/assets/${id}`);
export const createAsset = (payload) => api.post("/assets", payload);
export const updateAsset = (id, payload) => api.put(`/assets/${id}`, payload);
export const deleteAsset = (id) => api.del(`/assets/${id}`);
export const searchAssets = (search) => api.get("/assets/search", { search });
export const filterAssets = (params) => api.get("/assets/filter", params);
export const getAssetHistory = (id) => api.get(`/assets/history/${id}`);
