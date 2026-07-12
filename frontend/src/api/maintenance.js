import { api } from "./client";

export const getMaintenance = () => api.get("/maintenance");
export const createMaintenance = (payload) => api.post("/maintenance", payload);
export const updateMaintenance = (id, payload) => api.put(`/maintenance/${id}`, payload);
export const completeMaintenance = (id, payload) => api.put(`/maintenance/complete/${id}`, payload);
export const deleteMaintenance = (id) => api.del(`/maintenance/${id}`);
