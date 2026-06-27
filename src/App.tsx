import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
import MyCars from './pages/dashboard/MyCars'
import MyHistory from './pages/dashboard/MyHistory'
import MyProfile from './pages/dashboard/MyProfile'
import MechanicDashboard from './pages/mechanic/MechanicDashboard'
import HowItWorksPage from './pages/HowItWorksPage'
import Tarifs from './pages/Tarifs'
import Flottes from './pages/Flottes'
import TrackBooking from './pages/TrackBooking'
import ProtectedRoute from './components/ui/ProtectedRoute'
import PublicRoute from './components/ui/PublicRoute'

// AppShell lives inside <BrowserRouter> so it can call useLocation
function AppShell() {
  const location    = useLocation()
  const { i18n }    = useTranslation()

  useEffect(() => {
    document.title = i18n.language === 'en'
      ? 'MecaLIK — Mobile Mechanic Casablanca | Your car, your location.'
      : 'MecaLIK — Mécanicien à Domicile Casablanca | Votre voiture, votre lieu.'
  }, [i18n.language])
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/booking') || location.pathname.startsWith('/fleet-dashboard') || location.pathname.startsWith('/mechanic')

  return (
    <>
      {/* Public navbar + its 64 px top-padding are hidden on /dashboard —
          the dashboard has its own sticky top bar and bottom tab bar */}
      {!isDashboard && <Navbar />}

      <div className={isDashboard ? '' : 'pt-16'}>
        <Routes>
          <Route path="/"         element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/services" element={<PublicRoute><Services /></PublicRoute>} />
          <Route path="/fleet"    element={<PublicRoute><Fleet /></PublicRoute>} />
          <Route path="/about"    element={<PublicRoute><About /></PublicRoute>} />
          <Route path="/comment-ca-marche" element={<PublicRoute><HowItWorksPage /></PublicRoute>} />
          <Route path="/tarifs"   element={<PublicRoute><Tarifs /></PublicRoute>} />
          <Route path="/flottes"  element={<PublicRoute><Flottes /></PublicRoute>} />
          <Route path="/devis"    element={<QuoteCalculator />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup"   element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/booking/:id" element={<BookingConfirmation />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/voitures" element={
            <ProtectedRoute requiredRole="customer"><MyCars /></ProtectedRoute>
          } />
          <Route path="/dashboard/historique" element={
            <ProtectedRoute requiredRole="customer"><MyHistory /></ProtectedRoute>
          } />
          <Route path="/dashboard/profil" element={
            <ProtectedRoute requiredRole="customer"><MyProfile /></ProtectedRoute>
          } />
          <Route path="/fleet-dashboard" element={
            <ProtectedRoute><FleetDashboard /></ProtectedRoute>
          } />
          <Route path="/track/:reference?" element={<TrackBooking />} />
          <Route path="/suivi/:reference?" element={<TrackBooking />} />
          <Route path="/mechanic" element={<MechanicDashboard />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>

        {!isDashboard && <Footer />}
        {!isDashboard && <WhatsAppFAB />}

        {/* BookingModal is self-contained — listens for openBooking events internally */}
        <BookingModal />
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
