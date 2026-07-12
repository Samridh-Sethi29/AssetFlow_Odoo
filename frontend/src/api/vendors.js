import { api } from "./client";

export const getVendors = () => api.get("/vendors");
export const getVendor = (id) => api.get(`/vendors/${id}`);
export const createVendor = (payload) => api.post("/vendors", payload);
export const updateVendor = (id, payload) => api.put(`/vendors/${id}`, payload);
export const deleteVendor = (id) => api.del(`/vendors/${id}`);
