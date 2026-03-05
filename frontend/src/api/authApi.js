import api from './index'

export const authApi = {
    register: (data) =>
        api.post('/auth/register', data).then((r) => r.data),

    login: (data) =>
        api.post('/auth/login', data).then((r) => r.data),

    forgotPassword: (email) =>
        api.post('/auth/forgot-password', { email }).then((r) => r.data),

    resetPassword: (token, newPassword, confirmPassword) =>
        api.post('/auth/reset-password', { token, newPassword, confirmPassword }).then((r) => r.data),

    refreshToken: (refreshToken) =>
        api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
}
