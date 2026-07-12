import { api } from "./client";

export const getAudits = (params) => api.get("/audits", params);
export const createAudit = (payload) => api.post("/audits", payload);
export const updateAudit = (id, payload) => api.put(`/audits/${id}`, payload);
export const deleteAudit = (id) => api.del(`/audits/${id}`);
