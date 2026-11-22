import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RoleGuard({ roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="full-screen-state">Memeriksa sesi…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />
  return <Outlet />
}
