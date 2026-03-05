import api from './index'

export const inventoryApi = {
    getAll: (params) =>
        api.get('/inventory', { params }).then((r) => r.data),

    getArchived: () =>
        api.get('/inventory/archived').then((r) => r.data),

    getActivity: () =>
        api.get('/inventory/activity').then((r) => r.data),

    getAlerts: () =>
        api.get('/inventory/alerts').then((r) => r.data),

    getById: (id) =>
        api.get(`/inventory/${id}`).then((r) => r.data),

    getHistory: (id, from, to) =>
        api.get(`/inventory/${id}/history`, { params: { from, to } }).then((r) => r.data),

    add: (data) =>
        api.post('/inventory', data).then((r) => r.data),

    addLegacy: (data) =>
        api.post('/inventory/legacy', data).then((r) => r.data),

    update: (id, data) =>
        api.put(`/inventory/${id}`, data).then((r) => r.data),

    adjustStock: (id, data) =>
        api.post(`/inventory/${id}/adjust`, data).then((r) => r.data),

    getLowStock: () =>
        api.get('/inventory/low-stock').then((r) => r.data),

    search: (keyword) =>
        api.get('/inventory/search', { params: { keyword } }).then((r) => r.data),

    delete: (id, reason) =>
        api.delete(`/inventory/${id}`, { params: { reason } }).then((r) => r.data),

    getExpiring: (beforeDate) => {
        const params = beforeDate ? { beforeDate } : {}
        return api.get('/inventory/expiring', { params }).then((r) => r.data)
    },

    getReport: (type, beforeDate) =>
        api.get('/inventory/reports', { params: { type, beforeDate } }).then((r) => r.data),
}
