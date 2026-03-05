import api from './index'

export const queueApi = {
    checkIn: (data) =>
        api.post('/queue/check-in', data).then((r) => r.data),

    getToday: () =>
        api.get('/queue/today').then((r) => r.data),

    callNext: (id) =>
        api.put(`/queue/${id}/call-next`).then((r) => r.data),

    complete: (id) =>
        api.put(`/queue/${id}/complete`).then((r) => r.data),

    markNoShow: (id) =>
        api.put(`/queue/${id}/no-show`).then((r) => r.data),

    recordVitals: (id, data) =>
        api.post(`/queue/${id}/vitals`, data).then((r) => r.data),
}
