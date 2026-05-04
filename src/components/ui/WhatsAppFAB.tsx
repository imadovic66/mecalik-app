import { MessageCircle } from 'lucide-react'

export default function WhatsAppFAB() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 text-white font-semibold px-5 py-3.5 rounded-full transition-all duration-200"
      style={{
        background: '#25D366',
        boxShadow: '0 8px 32px rgba(37,211,102,0.4)',
      }}
    >
      <MessageCircle size={20} className="flex-shrink-0" />
      <span className="text-sm">Devis rapide</span>
    </button>
  )
}
