import api from './index'

export const consultationApi = {
    start: (data) =>
        api.post('/consultations', data).then((r) => r.data),

    recordVitals: (id, data) =>
        api.post(`/consultations/${id}/vitals`, data).then((r) => r.data),

    updateNotes: (id, data) =>
        api.put(`/consultations/${id}/notes`, data).then((r) => r.data),

    updateBloodCheckup: (id, data) =>
        api.put(`/consultations/${id}/blood-checkup`, data).then((r) => r.data),

    end: (id) =>
        api.post(`/consultations/${id}/end`).then((r) => r.data),

    getById: (id) =>
        api.get(`/consultations/${id}`).then((r) => r.data),

    getPatientHistory: (patientId) =>
        api.get(`/consultations/patient/${patientId}`).then((r) => r.data),

    getPendingBloodCheckups: () =>
        api.get('/consultations/blood-checkup/pending').then((r) => r.data),

    getCompletedBloodCheckups: () =>
        api.get('/consultations/blood-checkup/completed').then((r) => r.data),
}
