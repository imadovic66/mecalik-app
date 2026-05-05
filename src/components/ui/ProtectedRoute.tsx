import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type Props = {
  children: React.ReactNode
  requiredRole?: 'customer' | 'mechanic' | 'admin' | 'fleet_manager'
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth()

  // Always show spinner while loading — never redirect during load
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#43BCC9] border-t-transparent animate-spin" />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  // Only redirect if loading is complete and no user
  if (!loading && !user) {
    return <Navigate to="/login" replace />
  }

  // Role check — only after profile is loaded
  if (requiredRole && profile && profile.role !== requiredRole) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    if (profile.role === 'fleet_manager') return <Navigate to="/fleet-dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
