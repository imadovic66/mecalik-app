import { MessageCircle } from 'lucide-react'
import { WHATSAPP_URL } from '../../lib/constants'

/** Floating WhatsApp bubble — opens a chat with MecaLIK (pre-filled message). */
export default function WhatsAppFAB() {
  const href = `${WHATSAPP_URL}?text=${encodeURIComponent('Bonjour MecaLIK, ')}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp MecaLIK"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center text-white transition-transform duration-200 hover:scale-105"
      style={{
        width: '56px', height: '56px',
        borderRadius: '50%',
        background: '#25D366',
        boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
      }}
    >
      <MessageCircle size={24} />
    </a>
  )
}
