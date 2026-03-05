import api from './index'

export const userApi = {
    getDoctors: () =>
        api.get('/users/doctors').then((r) => r.data),
}
