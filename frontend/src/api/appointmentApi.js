import api from './index'

export const appointmentApi = {
    book: (data) =>
        api.post('/appointments', data).then((r) => r.data),

    getAll: (params = {}) =>
        api.get('/appointments', { params }).then((r) => r.data),

    getById: (id) =>
        api.get(`/appointments/${id}`).then((r) => r.data),

    getAuditTimeline: (id) =>
        api.get(`/appointments/${id}/audit-timeline`).then((r) => r.data),

    getAvailableSlots: (doctorId, date) =>
        api.get('/appointments/available-slots', { params: { doctorId, date } }).then((r) => r.data),

    getCalendar: (doctorId, date) =>
        api.get('/appointments/calendar', { params: { doctorId, date } }).then((r) => r.data),

    getMyCalendar: (date) =>
        api.get('/appointments/my-calendar', { params: { date } }).then((r) => r.data),

    getMyUpcoming: (startDate, endDate) =>
        api.get('/appointments/my-upcoming', { params: { startDate, endDate } }).then((r) => r.data),

    cancel: (id, reason) =>
        api.put(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),

    updateStatus: (id, status) =>
        api.put(`/appointments/${id}/status`, { status }).then((r) => r.data),

    reschedule: (id, newTime) =>
        api.put(`/appointments/${id}/reschedule`, { newTime }).then((r) => r.data),

    deletePermanent: (id) =>
        api.delete(`/appointments/${id}`).then((r) => r.data),

    remove: (id) =>
        api.delete(`/appointments/${id}`).then((r) => r.data),
}
