import api from './index'

export const billingApi = {
    generate: (data) =>
        api.post('/bills', data).then((r) => r.data),

    getById: (id) =>
        api.get(`/bills/${id}`).then((r) => r.data),

    processPayment: (id, data) =>
        api.post(`/bills/${id}/payments`, data).then((r) => r.data),

    getByPatient: (patientId) =>
        api.get(`/bills/patient/${patientId}`).then((r) => r.data),
}
