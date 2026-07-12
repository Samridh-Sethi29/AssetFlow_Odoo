import { api } from "./client";

export const getAllocations = () => api.get("/allocations");
export const allocateAsset = (payload) => api.post("/allocations", payload);
export const returnAsset = (id, payload) => api.put(`/allocations/return/${id}`, payload);
export const getAllocationHistory = () => api.get("/allocations/history");
export const getEmployeeAllocations = (employeeId) =>
  api.get(`/allocations/employee/${employeeId}`);
