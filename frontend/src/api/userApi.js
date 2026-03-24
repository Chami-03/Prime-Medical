import api from './index'

export const userApi = {
    getDoctors: () =>
        api.get('/users/doctors').then((r) => r.data),

    getMyProfile: () =>
        api.get('/users/me/profile').then((r) => r.data),

    updateMyProfile: (data) =>
        api.put('/users/me/profile', data).then((r) => r.data),

    uploadMyProfilePhoto: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api
            .post('/users/me/profile-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((r) => r.data)
    },
}
