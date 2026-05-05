import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type Props = {
  children: React.ReactNode
  requiredRole?: 'customer' | 'mechanic' | 'admin' | 'fleet_manager'
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#43BCC9] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />
    if (profile?.role === 'fleet_manager') return <Navigate to="/fleet-dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
