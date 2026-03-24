import api from './index'

export const prescriptionApi = {
    create: (data) =>
        api.post('/prescriptions', data).then((r) => r.data),

    update: (id, data) =>
        api.put(`/prescriptions/${id}`, data).then((r) => r.data),

    remove: (id) =>
        api.delete(`/prescriptions/${id}`).then((r) => r.data),

    getById: (id) =>
        api.get(`/prescriptions/${id}`).then((r) => r.data),

    getByPatient: (patientId) =>
        api.get(`/prescriptions/patient/${patientId}`).then((r) => r.data),

    getPending: () =>
        api.get('/prescriptions/pending').then((r) => r.data),

    getRecentlyPending: (minutes = 120) =>
        api.get('/prescriptions/pending/recent', { params: { minutes } }).then((r) => r.data),

    getRecentlyDispensed: (minutes = 120) =>
        api.get('/prescriptions/dispensed/recent', { params: { minutes } }).then((r) => r.data),

    getByConsultation: (consultationId) =>
        api.get(`/prescriptions/consultation/${consultationId}`).then((r) => r.data).catch((err) => {
            if (err?.response?.status === 404) {
                return { data: null }
            }
            throw err
        }),

    checkAllergies: (id) =>
        api.get(`/prescriptions/${id}/allergy-check`).then((r) => r.data),

    dispense: (id, overrideAllergyConfirmation = false) =>
        api.post(`/prescriptions/${id}/dispense`, { overrideAllergyConfirmation }).then((r) => r.data),
}
