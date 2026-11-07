/** "Mot de passe oublié" — sends a reset link by email. Also used by the mobile app (opens this page). */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import SEO from '../../components/SEO'
import { ChevronRight } from 'lucide-react'

export const RESET_PATH = '/nouveau-mot-de-passe'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}${RESET_PATH}`,
    })
    setLoading(false)
    // Same message whether or not the address has an account (don't reveal who is registered)
    if (error && /rate|limit|security purposes/i.test(error.message)) {
      setError('Trop de demandes. Patientez quelques minutes puis réessayez.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <SEO title="Mot de passe oublié | MecaLIK" description="Réinitialisez votre mot de passe MecaLIK." path="/mot-de-passe-oublie" noindex />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.jpg" alt="MecaLIK" style={{ height: '44px', width: '140px', objectFit: 'cover', objectPosition: 'center', borderRadius: '8px', margin: '0 auto' }} />
          </Link>
          <h1 className="font-heading font-bold text-2xl mt-6 mb-2" style={{ color: '#ffffff' }}>Mot de passe oublié</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Entrez l'email de votre compte. Nous vous envoyons un lien pour choisir un nouveau mot de passe.
          </p>
        </div>

        <div className="bg-[#0F0F0F] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div style={{ fontSize: '36px' }}>📩</div>
              <p className="text-sm mt-3" style={{ color: '#ffffff', lineHeight: 1.6 }}>
                Si un compte existe pour <b>{email.trim()}</b>, un email vient d'être envoyé avec un lien de réinitialisation.
              </p>
              <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Pensez à vérifier le dossier <b>Spam</b>. Le lien est valable une heure. Ouvrez-le sur le téléphone ou l'ordinateur de votre choix.
              </p>
              <button onClick={() => setSent(false)} className="text-sm mt-5 hover:underline" style={{ color: '#43BCC9' }}>Renvoyer / changer d'email</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.2)]">
                  <p className="text-sm" style={{ color: '#FF4444' }}>{error}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="vous@exemple.com"
                  className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: loading ? 'rgba(67,188,201,0.5)' : '#43BCC9', color: '#080808', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Envoi…' : <><span>Recevoir le lien</span><ChevronRight size={16} /></>}
              </button>
            </form>
          )}
          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
            <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: '#43BCC9' }}>← Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
