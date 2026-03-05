import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, hasAnyRole } = useAuth()
    const location = useLocation()

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!hasAnyRole(...allowedRoles)) {
            return <Navigate to="/unauthorized" replace />
        }
    }

    return children
}
