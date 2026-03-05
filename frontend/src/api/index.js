import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
})

// ── Request interceptor: attach Bearer token ──────────────────
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401, unwrap ApiResponse ─────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.clear()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
