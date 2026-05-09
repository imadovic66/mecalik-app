import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Edit3, Check, X, Phone, Mail, User,
  Bell, MessageCircle, Globe, FileText, Shield,
  LogOut, ChevronRight, Copy, Home,
  Clock as ClockIcon, Car as CarIcon
} from 'lucide-react'

export default function MyProfile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [editing, setEditing]           = useState(false)
  const [name, setName]                 = useState('')
  const [phone, setPhone]               = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [copied, setCopied]             = useState(false)
  const [notifWhatsapp, setNotifWhatsapp] = useState(true)
  const [notifSMS, setNotifSMS]         = useState(false)

  // silence unused warnings
  void saved
  void Globe

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: name,
      phone,
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const cancelEdit = () => {
    setName(profile?.full_name || '')
    setPhone(profile?.phone || '')
    setEditing(false)
  }

  const copyReferral = () => {
    const code = (profile as Record<string, unknown>)?.referral_code as string
      || user?.id?.substring(0, 8).toUpperCase()
      || 'MECALIK'
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = (name || user?.email || 'U')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : ''

  const referralCode = (profile as Record<string, unknown>)?.referral_code as string
    || user?.id?.substring(0, 8).toUpperCase()
    || 'MECALIK'

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: '#0A0A0A',
        minHeight: '100vh', position: 'relative', paddingBottom: '90px',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}>

        {/* ═══ TOP BAR ═══ */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button onClick={() => navigate('/dashboard')} style={{
            width: '36px', height: '36px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <ArrowLeft size={15} color="rgba(255,255,255,0.7)" />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em',
            }}>
              Mon profil
            </div>
          </div>

          {!editing ? (
            <button onClick={() => setEditing(true)} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)',
              padding: '7px 12px', borderRadius: '10px',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}>
              <Edit3 size={12} /> Modifier
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={cancelEdit} style={{
                width: '32px', height: '32px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <X size={14} color="rgba(255,255,255,0.6)" />
              </button>
              <button onClick={saveProfile} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: saving ? 'rgba(255,255,255,0.06)' : '#43BCC9',
                border: 'none',
                color: saving ? 'rgba(255,255,255,0.3)' : '#0A0A0A',
                padding: '7px 14px', borderRadius: '10px',
                fontSize: '12px', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                <Check size={12} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: '24px 18px' }}>

          {/* AVATAR + NAME */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: '28px',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #43BCC9 0%, #2A8B95 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 700, color: 'white',
              fontFamily: 'Space Grotesk, sans-serif',
              marginBottom: '14px',
              boxShadow: '0 0 0 4px rgba(67,188,201,0.15)',
            }}>
              {initials}
            </div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '20px', fontWeight: 600, color: 'white',
              letterSpacing: '-0.015em', marginBottom: '4px',
            }}>
              {name || 'Votre nom'}
            </div>
            {memberSince && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                Membre depuis {memberSince}
              </div>
            )}
          </div>

          {/* PERSONAL INFO */}
          <SectionLabel>Informations personnelles</SectionLabel>
          <div style={{
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
          }}>
            <ProfileRow
              icon={<User size={14} color="rgba(255,255,255,0.45)" />}
              label="Nom complet"
              value={name}
              editing={editing}
              editable
              onChange={setName}
              placeholder="Votre nom"
            />
            <ProfileRow
              icon={<Phone size={14} color="rgba(255,255,255,0.45)" />}
              label="Téléphone"
              value={phone}
              editing={editing}
              editable
              onChange={setPhone}
              placeholder="06 XX XX XX XX"
              type="tel"
            />
            <ProfileRow
              icon={<Mail size={14} color="rgba(255,255,255,0.45)" />}
              label="Email"
              value={user?.email || ''}
              editing={false}
              editable={false}
              onChange={() => {}}
              last
            />
          </div>

          {/* REFERRAL */}
          <SectionLabel>Parrainage</SectionLabel>
          <div style={{
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                Votre code de parrainage
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '18px', fontWeight: 700, color: 'white', letterSpacing: '0.1em',
              }}>
                {referralCode}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                Partagez et gagnez des avantages
              </div>
            </div>
            <button onClick={copyReferral} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: copied ? 'rgba(0,221,136,0.1)' : 'rgba(255,255,255,0.05)',
              border: copied ? '1px solid rgba(0,221,136,0.2)' : '1px solid rgba(255,255,255,0.08)',
              color: copied ? '#00DD88' : 'rgba(255,255,255,0.7)',
              padding: '8px 14px', borderRadius: '10px',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s', flexShrink: 0,
            }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>

          {/* NOTIFICATIONS */}
          <SectionLabel>Notifications</SectionLabel>
          <div style={{
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
          }}>
            <ToggleRow
              icon={<MessageCircle size={14} color="rgba(255,255,255,0.45)" />}
              label="Notifications WhatsApp"
              sublabel="Confirmations et mises à jour"
              value={notifWhatsapp}
              onChange={setNotifWhatsapp}
            />
            <ToggleRow
              icon={<Bell size={14} color="rgba(255,255,255,0.45)" />}
              label="Notifications SMS"
              sublabel="Rappels de rendez-vous"
              value={notifSMS}
              onChange={setNotifSMS}
              last
            />
          </div>

          {/* SUPPORT */}
          <SectionLabel>Aide & Support</SectionLabel>
          <div style={{
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
          }}>
            <LinkRow
              icon={<MessageCircle size={14} color="rgba(255,255,255,0.45)" />}
              label="Contacter le support"
              sublabel="WhatsApp · Réponse en 5 min"
              onClick={() => window.open('https://wa.me/212777348065', '_blank')}
            />
            <LinkRow
              icon={<FileText size={14} color="rgba(255,255,255,0.45)" />}
              label="Conditions générales"
              onClick={() => {}}
            />
            <LinkRow
              icon={<Shield size={14} color="rgba(255,255,255,0.45)" />}
              label="Politique de confidentialité"
              onClick={() => {}}
              last
            />
          </div>

          {/* APP INFO */}
          <div style={{
            textAlign: 'center', padding: '8px 0 16px',
            fontSize: '11px', color: 'rgba(255,255,255,0.2)',
          }}>
            MecaLIK · Version 1.0.0
          </div>

          {/* LOGOUT */}
          <button onClick={handleSignOut} style={{
            width: '100%', padding: '14px',
            background: 'rgba(255,68,68,0.06)',
            border: '1px solid rgba(255,68,68,0.15)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            color: '#FF4444', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>

        {/* ═══ BOTTOM TAB BAR ═══ */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 18px 22px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', zIndex: 50,
        }}>
          {([
            { Icon: Home,      label: 'Accueil',      active: false, onClick: () => navigate('/dashboard')           },
            { Icon: ClockIcon, label: 'Historique',   active: false, onClick: () => navigate('/dashboard/historique') },
            { Icon: CarIcon,   label: 'Mes voitures', active: false, onClick: () => navigate('/dashboard/voitures')  },
            { Icon: User,      label: 'Profil',       active: true,  onClick: undefined                              },
          ] as const).map(({ Icon, label, active, onClick }, i) => (
            <button key={i} onClick={onClick} style={{
              background: 'transparent', border: 'none',
              cursor: onClick ? 'pointer' : 'default',
              display: 'flex', justifyContent: 'center',
            }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: active ? '6px 14px' : '4px',
                borderRadius: '10px',
                background: active ? 'rgba(67,188,201,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <Icon size={20} color={active ? '#43BCC9' : 'rgba(255,255,255,0.4)'} />
                <span style={{
                  fontSize: '10px', fontWeight: active ? 600 : 400,
                  color: active ? '#43BCC9' : 'rgba(255,255,255,0.4)',
                }}>
                  {label}
                </span>
              </div>
            </button>
          ))}
        </div>

        <style>{`::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 600,
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: '10px', paddingLeft: '4px',
    }}>
      {children}
    </div>
  )
}

function ProfileRow({
  icon, label, value, editing, editable, onChange, placeholder, type = 'text', last = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  editing: boolean
  editable: boolean
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  last?: boolean
}) {
  const showInput = editing && editable

  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{ flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '10px', color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px',
        }}>
          {label}
        </div>
        {showInput ? (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(67,188,201,0.4)',
              color: 'white', fontSize: '14px', outline: 'none',
              width: '100%', paddingBottom: '2px', fontFamily: 'inherit',
            }}
          />
        ) : (
          <div style={{
            fontSize: '14px',
            color: value ? 'white' : 'rgba(255,255,255,0.3)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {value || placeholder || '—'}
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  icon, label, sublabel, value, onChange, last = false,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  value: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', color: 'white', marginBottom: sublabel ? '2px' : '0' }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{sublabel}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '44px', height: '24px', borderRadius: '12px',
          background: value ? '#43BCC9' : 'rgba(255,255,255,0.1)',
          border: 'none', cursor: 'pointer',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '3px',
          left: value ? '23px' : '3px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'white', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}

function LinkRow({
  icon, label, sublabel, onClick, last = false,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onClick: () => void
  last?: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 16px',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', gap: '12px',
        cursor: 'pointer',
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', color: 'white', marginBottom: sublabel ? '2px' : '0' }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{sublabel}</div>
        )}
      </div>
      <ChevronRight size={15} color="rgba(255,255,255,0.3)" />
    </div>
  )
}
