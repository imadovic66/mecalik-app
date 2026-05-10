import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function WhatsAppFAB() {
  const { t } = useTranslation()

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center text-white transition-all duration-200"
      style={{
        width: '48px', height: '48px',
        borderRadius: '50%',
        background: '#25D366',
        boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
      }}
    >
      <MessageCircle size={20} />
    </button>
  )
}
