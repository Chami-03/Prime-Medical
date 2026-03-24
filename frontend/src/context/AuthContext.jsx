import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/authApi'

const AuthContext = createContext(null)

function normalizeRoles(userLike) {
    if (!userLike) return []

    const candidates = [
        userLike.roles,
        userLike.role,
        userLike.authorities,
        userLike.data?.roles,
        userLike.data?.role,
        userLike.data?.authorities,
    ]

    for (const value of candidates) {
        if (Array.isArray(value)) return value
        if (typeof value === 'string' && value.trim()) {
            if (value.includes(',')) {
                return value
                    .split(',')
                    .map((r) => r.trim())
                    .filter(Boolean)
            }
            return [value]
        }
    }

    return []
}

function normalizeUser(raw) {
    if (!raw) return null
    const normalized = { ...raw }

    if (!normalized.id && normalized.userId) {
        normalized.id = normalized.userId
    }

    normalized.roles = normalizeRoles(normalized)
    return normalized
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = sessionStorage.getItem('user')
            if (!stored) return null
            const parsed = JSON.parse(stored)
            const normalized = normalizeUser(parsed)
            if (normalized) {
                sessionStorage.setItem('user', JSON.stringify(normalized))
            }
            return normalized
        } catch {
            return null
        }
    })

    const login = useCallback(async (email, password) => {
        const res = await authApi.login({ email, password })
        const data = res?.data ?? res

        const userData = normalizeUser(data)

        sessionStorage.setItem('accessToken', data.accessToken)
        sessionStorage.setItem('refreshToken', data.refreshToken)
        sessionStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return userData
    }, [])

    const logout = useCallback(() => {
        sessionStorage.clear()
        setUser(null)
        window.location.href = '/login'
    }, [])

    const hasRole = useCallback(
        (role) => {
            if (!user) return false
            const roles = normalizeRoles(user)
            const normalizedRole = role.toUpperCase().replace('ROLE_', '')
            return roles.some((r) => {
                const normalizedUserRole = String(r).toUpperCase().replace('ROLE_', '')
                return normalizedUserRole === normalizedRole
            })
        },
        [user]
    )

    const hasAnyRole = useCallback(
        (...roles) => roles.some((r) => hasRole(r)),
        [hasRole]
    )

    const syncUserProfile = useCallback((profile) => {
        const existing = user || {}
        const nextUser = normalizeUser({
            ...existing,
            ...profile,
            userId: profile?.id ?? existing.userId ?? existing.id,
            id: profile?.id ?? existing.id,
            fullName:
                profile?.fullName
                    || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim()
                    || existing.fullName,
            roles: profile?.roles || existing.roles,
        })
        sessionStorage.setItem('user', JSON.stringify(nextUser))
        setUser(nextUser)
        return nextUser
    }, [user])

    return (
        <AuthContext.Provider value={{ user, login, logout, hasRole, hasAnyRole, syncUserProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

export function RoleProtected({ children, allowedRoles }) {
    const { hasAnyRole } = useAuth()
    if (allowedRoles && !hasAnyRole(...allowedRoles)) return null
    return children
}