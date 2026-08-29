import api from '../../../api/client.js';

// Dashboard
export const getDashboardSummary = () => api.get('/api/booking/dashboard-summary');

// Bookings
export const getBookings = (params) => api.get('/api/booking/bookings', { params });
export const getBookingDetails = (id) => api.get(`/api/booking/bookings/${id}`);
export const checkAvailability = (params) => api.get('/api/booking/bookings/availability', { params });
export const createBooking = (data) => api.post('/api/booking/bookings', data);
export const updateBooking = (id, data) => api.put(`/api/booking/bookings/${id}`, data);
export const cancelBooking = (id, data) => api.delete(`/api/booking/bookings/${id}`, { data });

// Rooms
export const getRooms = (params) => api.get('/api/booking/rooms', { params });
export const getRoomDetails = (id) => api.get(`/api/booking/rooms/${id}`);
export const getRoomSchedule = (id, params) => api.get(`/api/booking/rooms/${id}/schedule`, { params });
export const getRoomStats = () => api.get('/api/booking/rooms/stats');
export const createRoom = (data) => api.post('/api/booking/rooms', data);
export const updateRoom = (id, data) => api.put(`/api/booking/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/api/booking/rooms/${id}`);

// Approvals
export const getPendingApprovals = () => api.get('/api/booking/approvals/pending');
export const getApprovalDashboard = () => api.get('/api/booking/approvals/dashboard');
export const getApprovalStats = () => api.get('/api/booking/approvals/stats');
export const getApprovalHistory = (bookingId) => api.get(`/api/booking/approvals/history/${bookingId}`);
export const approveBooking = (id, data) => api.post(`/api/booking/approvals/${id}/approve`, data);
export const rejectBooking = (id, data) => api.post(`/api/booking/approvals/${id}/reject`, data);

// Notifications
export const getUserNotifications = () => api.get('/api/booking/notifications');
export const getUnreadCount = () => api.get('/api/booking/notifications/unread-count');
export const getNotificationStats = () => api.get('/api/booking/notifications/stats');
export const markNotificationAsRead = (id) => api.put(`/api/booking/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.put('/api/booking/notifications/mark-all-read');
export const deleteNotification = (id) => api.delete(`/api/booking/notifications/${id}`);
