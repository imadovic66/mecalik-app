import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (!form.email.trim()) {
      setError('Email requis.')
      return
    }

    setLoading(true)

    console.log('Attempting signup with:', {
      email: form.email.trim(),
      passwordLength: form.password.length,
      fullName: form.fullName,
    })

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
      options: {
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
        },
      },
    })

    console.log('Signup response:', { data, error: signUpError })

    if (signUpError) {
      console.error('Signup error details:', signUpError)
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (signInError) {
        console.error('Auto signin error:', signInError)
        setError(signInError.message)
        setLoading(false)
        return
      }
      navigate('/dashboard')
    } else {
      setError('Compte créé. Vérifiez votre email pour confirmer.')
      setLoading(false)
    }
  }

  const textFields: { key: keyof typeof form; label: string; type: string; placeholder: string }[] = [
    { key: 'fullName', label: 'Nom complet', type: 'text', placeholder: 'Votre nom complet' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'vous@example.com' },
    { key: 'phone', label: 'Téléphone', type: 'tel', placeholder: '06 XX XX XX XX' },
  ]

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12">
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
              style={{ color: '#ffffff' }}>Créer un compte</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Rejoignez MecaLIK — c&apos;est gratuit
          </p>
        </div>

        <div className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.2)]">
              <p className="text-sm" style={{ color: '#FF4444' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            {textFields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                       style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  required
                  placeholder={field.placeholder}
                  className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-colors"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            ))}

            {(['password', 'confirmPassword'] as const).map(key => (
              <div key={key}>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                       style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {key === 'password' ? 'Mot de passe' : 'Confirmer le mot de passe'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none"
                    style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  {key === 'password' && (
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

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
              {loading ? 'Création...' : <><span>Créer mon compte</span><ChevronRight size={16} /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Déjà un compte ?{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: '#43BCC9' }}>
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6">
          <Link to="/" style={{ color: 'rgba(255,255,255,0.25)' }}>← Retour au site</Link>
        </p>
      </div>
    </div>
  )
}
