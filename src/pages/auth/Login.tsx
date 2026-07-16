import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { analytics } from '../../lib/analytics'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setError(t('auth.invalidCredentials'))
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    analytics.login('email', profile?.role ?? 'customer')

    if (profile?.role === 'admin')          navigate('/admin')
    else if (profile?.role === 'fleet_manager') navigate('/fleet-dashboard')
    else if (profile?.role === 'mechanic')  navigate('/mechanic')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(67,188,201,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.jpg" alt="MecaLIK"
              style={{ height: '44px', width: '140px', objectFit: 'cover',
                       objectPosition: 'center', borderRadius: '8px', margin: '0 auto' }} />
          </Link>
          <h1 className="font-heading font-bold text-2xl mt-6 mb-2"
              style={{ color: '#ffffff' }}>{t('auth.login')}</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <div className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.2)]">
              <p className="text-sm" style={{ color: '#FF4444' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                     style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={t('auth.emailPlaceholder')}
                className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-colors"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                     style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none transition-colors"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
              style={{
                background: loading ? 'rgba(67,188,201,0.5)' : '#43BCC9',
                color: '#080808',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? `${t('auth.loginButton')}...` : <><span>{t('auth.loginButton')}</span><ChevronRight size={16} /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className="font-medium hover:underline" style={{ color: '#43BCC9' }}>
                {t('auth.createAccount')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6">
          <Link to="/" style={{ color: 'rgba(255,255,255,0.25)' }}>{t('auth.backToSite')}</Link>
        </p>
      </div>
    </div>
  )
}
