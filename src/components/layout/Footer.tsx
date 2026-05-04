import { MapPin, Phone, Mail, AtSign } from 'lucide-react'

const serviceLinks = [
  'Lavage Auto',
  'Vidange & Filtres',
  'Batterie',
  'Pneus',
  'Diagnostic',
  'Urgence 24/7',
]

const companyLinks: { label: string; href: string }[] = [
  { label: 'À propos', href: '/about' },
  { label: 'Flottes & Entreprises', href: '/fleet' },
  { label: 'Contact', href: '/contact' },
  { label: 'WhatsApp', href: 'https://wa.me/212667101341' },
]

export default function Footer() {
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
              Le mécanicien certifié qui vient à vous. Casablanca.
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
              <a
                href="tel:+212667101341"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                aria-label="Appeler MecaLIK"
              >
                <Phone size={16} color="rgba(255,255,255,0.55)" />
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
              Entreprise
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
                <MapPin size={16} color="#43BCC9" className="flex-shrink-0 mt-0.5" />
                <span className="text-[rgba(255,255,255,0.45)] text-sm">Casablanca, Maroc</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} color="#43BCC9" className="flex-shrink-0 mt-0.5" />
                <a
                  href="tel:+212667101341"
                  className="text-[rgba(255,255,255,0.45)] text-sm hover:text-white transition-colors"
                >
                  +212 667 101 341
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} color="#43BCC9" className="flex-shrink-0 mt-0.5" />
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
            © 2026 MecaLIK. Tous droits réservés.
          </span>
          <span className="text-[rgba(255,255,255,0.3)] text-xs">
            Casablanca, Maroc
          </span>
        </div>

      </div>
    </footer>
  )
}
