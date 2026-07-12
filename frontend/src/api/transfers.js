import { api } from "./client";

export const getTransfers = () => api.get("/transfers");
export const createTransfer = (payload) => api.post("/transfers", payload);
export const approveTransfer = (id) => api.put(`/transfers/approve/${id}`);
export const rejectTransfer = (id) => api.put(`/transfers/reject/${id}`);
