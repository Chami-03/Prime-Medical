import api from './index'

export const staffApi = {
    getAll: () =>
        api.get('/staff').then((r) => r.data),

    createStaff: (data) =>
        api.post('/staff', data).then((r) => r.data),

    updateStaff: (userId, data) =>
        api.put(`/staff/${userId}`, data).then((r) => r.data),

    deactivateStaff: (userId) =>
        api.delete(`/staff/${userId}`).then((r) => r.data),
}
