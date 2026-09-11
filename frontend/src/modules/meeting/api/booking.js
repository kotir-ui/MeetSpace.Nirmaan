import api from '../../../api/client.js';

// Dashboard
export const getDashboardSummary = () => api.get('/booking/dashboard-summary');

// Bookings
export const getBookings = (params) => api.get('/booking/bookings', { params });
export const getBookingDetails = (id) => api.get(`/booking/bookings/${id}`);
export const checkAvailability = (params) => api.get('/booking/bookings/availability', { params });
export const createBooking = (data) => api.post('/booking/bookings', data);
export const updateBooking = (id, data) => api.put(`/booking/bookings/${id}`, data);
export const cancelBooking = (id, data) => api.delete(`/booking/bookings/${id}`, { data });
export const extendBooking = (id, data) => api.post(`/booking/bookings/${id}/extend`, data);

// Rooms
export const getPublicRoomCount = () => api.get('/booking/rooms/public-count');
export const getPublicRooms = () => api.get('/booking/rooms/public');
export const getRooms = (params) => api.get('/booking/rooms', { params });
export const getAvailableAlternates = (params) => api.get('/booking/rooms/available-alternates', { params });
export const getRoomDetails = (id) => api.get(`/booking/rooms/${id}`);
export const getRoomSchedule = (id, params) => api.get(`/booking/rooms/${id}/schedule`, { params });
export const getRoomStats = () => api.get('/booking/rooms/stats');
export const createRoom = (data) => api.post('/booking/rooms', data);
export const updateRoom = (id, data) => api.put(`/booking/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/booking/rooms/${id}`);

// Approvals
export const getPendingApprovals = () => api.get('/booking/approvals/pending');
export const getApprovalDashboard = () => api.get('/booking/approvals/dashboard');
export const getApprovalStats = () => api.get('/booking/approvals/stats');
export const getApprovalHistory = (bookingId) => api.get(`/booking/approvals/history/${bookingId}`);
export const approveBooking = (id, data) => api.post(`/booking/approvals/${id}/approve`, data);
export const rejectBooking = (id, data) => api.post(`/booking/approvals/${id}/reject`, data);

// Notifications
export const getUserNotifications = () => api.get('/booking/notifications');
export const getUnreadCount = () => api.get('/booking/notifications/unread-count');
export const getNotificationStats = () => api.get('/booking/notifications/stats');
export const markNotificationAsRead = (id) => api.put(`/booking/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.put('/booking/notifications/mark-all-read');
export const deleteNotification = (id) => api.delete(`/booking/notifications/${id}`);
export const sendTestEmail = (data) => api.post('/booking/notifications/send-test-email', data);

