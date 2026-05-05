import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type Props = { children: React.ReactNode }

export default function PublicRoute({ children }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#43BCC9', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (user && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    if (profile.role === 'fleet_manager') return <Navigate to="/fleet-dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
