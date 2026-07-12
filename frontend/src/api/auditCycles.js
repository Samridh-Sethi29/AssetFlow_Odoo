import { api } from "./client";

export const getAuditCycles = () => api.get("/audit-cycles");
export const createAuditCycle = (payload) => api.post("/audit-cycles", payload);
export const updateAuditItem = (cycleId, payload) => api.put(`/audit-cycles/item/${cycleId}`, payload);
export const closeAuditCycle = (cycleId) => api.put(`/audit-cycles/close/${cycleId}`);
