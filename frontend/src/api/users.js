import { api } from "./client";

export const getUsers = (params) => api.get("/users", params);
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (payload) => api.post("/users", payload);
export const updateUser = (id, payload) => api.put(`/users/${id}`, payload);
export const deleteUser = (id) => api.del(`/users/${id}`);
