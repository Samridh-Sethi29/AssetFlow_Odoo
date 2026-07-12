import { api } from "./client";

export const getBookings = () => api.get("/bookings");
export const createBooking = (payload) => api.post("/bookings", payload);
export const approveBooking = (id) => api.put(`/bookings/approve/${id}`);
export const rejectBooking = (id) => api.put(`/bookings/reject/${id}`);
export const deleteBooking = (id) => api.del(`/bookings/${id}`);
