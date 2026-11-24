/** Landing page of the reset email: the link signs the user in for this purpose, then they choose a new password. */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import SEO from '../../components/SEO'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState<'wait' | 'ok' | 'invalid'>('wait')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    // The client reads the token from the link automatically; wait for the session it creates.
    const linkError = new URLSearchParams(window.location.hash.slice(1)).get('error_description')
      || new URLSearchParams(window.location.search).get('error_description')
    if (linkError) { setReady('invalid'); return }
    let settled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) { settled = true; setReady('ok') }
    })
    supabase.auth.getSession().then(({ data }) => { if (data.session) { settled = true; setReady('ok') } })
    const t = setTimeout(() => { if (!settled) setReady('invalid') }, 4000)
    return () => { subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pw.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.')
    if (pw !== pw2) return setError('Les deux mots de passe ne sont pas identiques.')
    setSaving(true)
    const { data, error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) {
      setError(/same|different/i.test(error.message) ? "Choisissez un mot de passe différent de l'ancien." : 'Impossible de modifier le mot de passe. Redemandez un lien.')
      return
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    setDone(prof?.role ?? 'customer')
  }

  const goOn = () => {
    if (done === 'admin') navigate('/admin')
    else if (done === 'mechanic') navigate('/mechanic')
    else if (done === 'fleet_manager') navigate('/fleet-dashboard')
    else navigate('/dashboard')
  }

  const input = { background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <SEO title="Nouveau mot de passe | MecaLIK" description="Choisissez un nouveau mot de passe." path="/nouveau-mot-de-passe" noindex />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><img src="/logo.jpg" alt="MecaLIK" style={{ height: '44px', width: '140px', objectFit: 'cover', objectPosition: 'center', borderRadius: '8px', margin: '0 auto' }} /></Link>
          <h1 className="font-heading font-bold text-2xl mt-6 mb-2" style={{ color: '#ffffff' }}>Nouveau mot de passe</h1>
        </div>
        <div className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8">
          {ready === 'wait' && <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Vérification du lien…</p>}

          {ready === 'invalid' && (
            <div className="text-center">
              <p className="text-sm" style={{ color: '#FF6B6B' }}>Ce lien est invalide ou a expiré.</p>
              <Link to="/mot-de-passe-oublie" className="inline-block mt-4 text-sm font-medium hover:underline" style={{ color: '#43BCC9' }}>Demander un nouveau lien</Link>
            </div>
          )}

          {ready === 'ok' && done && (
            <div className="text-center">
              <div style={{ fontSize: '36px' }}>✅</div>
              <p className="text-sm mt-3" style={{ color: '#ffffff' }}>Mot de passe modifié.</p>
              {done === 'mechanic' && (
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Vous pouvez maintenant vous connecter dans l'application MecaLIK avec ce nouveau mot de passe.</p>
              )}
              <button onClick={goOn} className="w-full py-4 rounded-full font-bold text-sm mt-5" style={{ background: '#43BCC9', color: '#080808' }}>Continuer</button>
            </div>
          )}

          {ready === 'ok' && !done && (
            <form onSubmit={save} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.2)]"><p className="text-sm" style={{ color: '#FF4444' }}>{error}</p></div>
              )}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Nouveau mot de passe</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} required autoFocus minLength={6} autoComplete="new-password"
                    className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none" style={input} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Confirmer</label>
                <input type={show ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} required minLength={6} autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none" style={input} />
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: saving ? 'rgba(67,188,201,0.5)' : '#43BCC9', color: '#080808' }}>
                {saving ? 'Enregistrement…' : <><span>Enregistrer</span><ChevronRight size={16} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
