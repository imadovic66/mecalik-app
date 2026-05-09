import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import WhatsAppFAB from './components/ui/WhatsAppFAB'
import BookingModal from './components/ui/BookingModal'
import Home from './pages/Home'
import Services from './pages/Services'
import Fleet from './pages/Fleet'
import About from './pages/About'
import QuoteCalculator from './pages/QuoteCalculator'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import CustomerDashboard from './pages/dashboard/CustomerDashboard'
import BookingConfirmation from './pages/dashboard/BookingConfirmation'
import FleetDashboard from './pages/fleet/FleetDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './components/ui/ProtectedRoute'
import PublicRoute from './components/ui/PublicRoute'

// AppShell lives inside <BrowserRouter> so it can call useLocation
function AppShell() {
  const location   = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  const [bookingOpen, setBookingOpen]               = useState(false)
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ service?: string }>).detail
      setPreselectedService(detail?.service || undefined)
      setBookingOpen(true)
    }
    window.addEventListener('openBooking', handler)
    return () => window.removeEventListener('openBooking', handler)
  }, [])

  return (
    <>
      {/* Public navbar + its 64 px top-padding are hidden on /dashboard —
          the dashboard has its own sticky top bar and bottom tab bar */}
      {!isDashboard && <Navbar />}

      <div className={isDashboard ? '' : 'pt-16'}>
        <Routes>
          <Route path="/"        element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/services" element={<PublicRoute><Services /></PublicRoute>} />
          <Route path="/fleet"   element={<PublicRoute><Fleet /></PublicRoute>} />
          <Route path="/about"   element={<PublicRoute><About /></PublicRoute>} />
          <Route path="/devis"   element={<QuoteCalculator />} />
          <Route path="/login"   element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup"  element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/booking/:id" element={<BookingConfirmation />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>
          } />
          <Route path="/fleet-dashboard" element={
            <ProtectedRoute><FleetDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>

        {!isDashboard && <Footer />}
        {!isDashboard && <WhatsAppFAB />}

        <BookingModal
          isOpen={bookingOpen}
          onClose={() => { setBookingOpen(false); setPreselectedService(undefined) }}
          preselectedService={preselectedService}
        />
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
