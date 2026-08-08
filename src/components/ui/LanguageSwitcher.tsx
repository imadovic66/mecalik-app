import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher({ style }: { style?: React.CSSProperties }) {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'fr'

  const switchTo = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('mecalik-lang', lang)
    document.documentElement.lang = lang
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '8px',
      overflow: 'hidden',
      flexShrink: 0,
      ...style
    }}>
      {(['fr', 'en'] as const).map((lang, i) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          style={{
            background: current === lang ? 'rgba(255,255,255,0.15)' : 'transparent',
            border: 'none',
            borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.12)' : 'none',
            color: current === lang ? '#ffffff' : 'rgba(255,255,255,0.45)',
            cursor: current === lang ? 'default' : 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '12px',
            fontWeight: current === lang ? 700 : 500,
            letterSpacing: '0.05em',
            padding: '5px 10px',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
