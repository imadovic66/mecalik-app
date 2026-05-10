import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language

  const toggle = () => {
    const next = current === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(next)
    localStorage.setItem('mecalik-lang', next)
  }

  return (
    <button
      onClick={toggle}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        padding: '4px 10px',
        letterSpacing: '0.03em',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        flexShrink: 0,
      }}
      title={current === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      {current === 'fr' ? 'FR → EN' : 'EN → FR'}
    </button>
  )
}
