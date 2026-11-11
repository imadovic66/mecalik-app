import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SEO from '../components/SEO'

const FAQ_KEYS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function FAQ() {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(1)

  const items = FAQ_KEYS.map(n => ({
    n,
    question: t(`faq.q${n}`),
    answer: t(`faq.a${n}`),
  }))

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://mecalik.com/' },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://mecalik.com/faq' },
    ],
  }

  return (
    <main style={{ background: '#0A0A0A', color: 'white', fontFamily: 'Outfit, sans-serif', minHeight: '100vh', paddingTop: '80px' }}>
      <SEO
        title="Questions Fréquentes — FAQ | MecaLIK Casablanca"
        description="Toutes les réponses à vos questions sur MecaLIK : fonctionnement, zones couvertes, prix, paiement, garantie, techniciens certifiés. Consultez notre FAQ."
        path="/faq"
        jsonLd={[faqPageSchema, breadcrumbSchema]}
      />

      {/* Hero */}
      <section style={{ padding: '80px 5% 48px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: 'var(--mk-action-faint)',
          border: '1px solid var(--mk-action-dim)', borderRadius: '100px',
          padding: '6px 16px', marginBottom: '24px', fontSize: '12px',
          color: 'var(--mk-action)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          FAQ
        </div>
        <h1 style={{ fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>
          {t('faq.pageTitle')}
        </h1>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          {t('faq.pageSubtitle')}
        </p>
      </section>

      {/* Accordion */}
      <section style={{ padding: '0 5% 100px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(({ n, question, answer }) => {
            const isOpen = openIndex === n
            return (
              <div
                key={n}
                style={{
                  background: '#0F0F0F',
                  border: isOpen ? '1px solid var(--mk-action-dim)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : n)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '16px', padding: '20px 24px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    fontSize: '15px', fontWeight: 600,
                    color: isOpen ? 'var(--mk-action)' : 'white',
                  }}>
                    {question}
                  </span>
                  <ChevronDown
                    size={18}
                    color={isOpen ? 'var(--mk-action)' : 'rgba(255,255,255,0.4)'}
                    style={{
                      flexShrink: 0,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 24px 22px', fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                    {answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '48px', padding: '32px', borderRadius: '16px', textAlign: 'center',
          background: 'var(--mk-action-faint)', border: '1px solid var(--mk-action-dim)',
        }}>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {t('faq.ctaTitle')}
          </p>
          <a
            href="https://wa.me/212777348065"
            style={{
              display: 'inline-block', background: 'var(--mk-action)', color: '#0A0A0A',
              padding: '12px 28px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            WhatsApp
          </a>
        </div>
      </section>
    </main>
  )
}
