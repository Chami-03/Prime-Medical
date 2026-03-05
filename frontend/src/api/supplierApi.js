import api from './index'

export const supplierApi = {
    getAll: (search) =>
        api.get('/suppliers', { params: search ? { search } : {} }).then((r) => r.data),

    getById: (id) =>
        api.get(`/suppliers/${id}`).then((r) => r.data),

    create: (data) =>
        api.post('/suppliers', data).then((r) => r.data),

    update: (id, data) =>
        api.put(`/suppliers/${id}`, data).then((r) => r.data),

    delete: (id) =>
        api.delete(`/suppliers/${id}`).then((r) => r.data),
}
