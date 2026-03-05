import api from './index'

export const patientApi = {
    register: (data) =>
        api.post('/patients', data).then((r) => r.data),

    search: (query = '') => {
        const q = query == null ? '' : String(query).trim();
        if (!q) {
            // Return a compatible resolved value so callers expecting a promise don't break.
            return Promise.resolve({ success: true, data: [] });
        }
        return api.get('/patients/search', { params: { query: q } }).then((r) => r.data)
    },

    getAll: () =>
        api.get('/patients').then((r) => r.data),

    getById: (id) =>
        api.get(`/patients/${id}`).then((r) => r.data),

    getMyProfile: () =>
        api.get('/patients/me').then((r) => r.data),

    update: (id, data) =>
        api.put(`/patients/${id}`, data).then((r) => r.data),

    delete: (id) =>
        api.delete(`/patients/${id}`).then((r) => r.data),

    addAllergy: (id, allergyData) =>
        api.post(`/patients/${id}/allergies`, allergyData).then((r) => r.data),
}
