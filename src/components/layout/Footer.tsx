import { MapPin, Phone, Mail, AtSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SERVICE_IDS = ['lavage', 'vidange', 'batterie', 'pneus', 'diagnostic', 'urgence'] as const

const companyLinksBase = [
  { labelKey: 'landing.footerAbout',  href: '/a-propos' },
  { labelKey: 'landing.footerFleets', href: '/fleet' },
  { labelKey: 'landing.footerFaq',    href: '/faq' },
  { labelKey: 'landing.footerContact2', href: '/contact' },
  { labelKey: null, label: 'WhatsApp', href: 'https://wa.me/212777348065' },
] as const

export default function Footer() {
  const { t } = useTranslation()
  const serviceLinks = SERVICE_IDS.map(id => t(`services.${id}`))
  const companyLinks = companyLinksBase.map(item =>
    item.labelKey ? { label: t(item.labelKey), href: item.href } : { label: item.label, href: item.href }
  )
  return (
    <footer
      className="px-6 pt-16 pb-8"
      style={{
        background: '#080808',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Column 1 — Brand */}
          <div>
            <img
              src="/logo.jpg"
              alt="MecaLIK"
              style={{
                height: '44px',
                width: '140px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
            <p className="text-[rgba(255,255,255,0.4)] text-sm mt-4 max-w-xs leading-relaxed">
              {t('landing.footerTagline')} Casablanca.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://instagram.com/mecalik.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                aria-label="Instagram MecaLIK"
              >
                <AtSign size={16} color="rgba(255,255,255,0.55)" />
              </a>
            </div>
          </div>

          {/* Column 2 — Services */}
          <div>
            <p className="font-heading font-semibold text-white text-sm uppercase tracking-wider mb-5">
              Services
            </p>
            <ul className="flex flex-col gap-3">
              {serviceLinks.map((label) => (
                <li key={label}>
                  <span className="text-[rgba(255,255,255,0.45)] text-sm hover:text-white transition-colors cursor-pointer">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <p className="font-heading font-semibold text-white text-sm uppercase tracking-wider mb-5">
              {t('landing.footerEntreprise')}
            </p>
            <ul className="flex flex-col gap-3">
              {companyLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-[rgba(255,255,255,0.45)] text-sm hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact */}
          <div>
            <p className="font-heading font-semibold text-white text-sm uppercase tracking-wider mb-5">
              Contact
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <MapPin size={16} color="var(--mk-action)" className="flex-shrink-0 mt-0.5" />
                <span className="text-[rgba(255,255,255,0.45)] text-sm">{t('landing.footerLocation')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} color="var(--mk-action)" className="flex-shrink-0 mt-0.5" />
                <span className="text-[rgba(255,255,255,0.45)] text-sm">
                  +212 777 348 065
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} color="var(--mk-action)" className="flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:contact@mecalik.com"
                  className="text-[rgba(255,255,255,0.45)] text-sm hover:text-white transition-colors"
                >
                  contact@mecalik.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-[rgba(255,255,255,0.3)] text-xs">
            © 2026 MecaLIK. {t('landing.footerRights')}
          </span>
          <span className="text-[rgba(255,255,255,0.3)] text-xs">
            {t('landing.footerLocation')}
          </span>
        </div>

      </div>
    </footer>
  )
}
