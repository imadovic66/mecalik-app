import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import WhatsAppFAB from './components/ui/WhatsAppFAB'
import BookingModal from './components/ui/BookingModal'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import ProtectedRoute from './components/ui/ProtectedRoute'
import PublicRoute from './components/ui/PublicRoute'
import { trackPageView } from './lib/analytics'

// Pages other than the homepage and sign-in load on demand, so the first visit downloads far less.
const Services = lazy(() => import('./pages/Services'))
const Fleet = lazy(() => import('./pages/Fleet'))
const About = lazy(() => import('./pages/About'))
const CustomerDashboard = lazy(() => import('./pages/dashboard/CustomerDashboard'))
const BookingConfirmation = lazy(() => import('./pages/dashboard/BookingConfirmation'))
const FleetDashboard = lazy(() => import('./pages/fleet/FleetDashboard'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const MyHistory = lazy(() => import('./pages/dashboard/MyHistory'))
const MyProfile = lazy(() => import('./pages/dashboard/MyProfile'))
const MechanicDashboard = lazy(() => import('./pages/mechanic/MechanicDashboard'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const Tarifs = lazy(() => import('./pages/Tarifs'))
const Flottes = lazy(() => import('./pages/Flottes'))
const FAQ = lazy(() => import('./pages/FAQ'))
const TrackBooking = lazy(() => import('./pages/TrackBooking'))
const GaragePage = lazy(() => import('./pages/GaragePage'))
const MyGarage = lazy(() => import('./pages/GaragePage').then(m => ({ default: m.MyGarage })))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))

// AppShell lives inside <BrowserRouter> so it can call useLocation
function AppShell() {
  const location    = useLocation()
  const { i18n }    = useTranslation()

  // Plain (non-Helmet) fallback title for routes with no <SEO> of their own (e.g. /devis,
  // /dashboard). Deliberately NOT rendered via <Helmet>/<SEO>: react-helmet-async does not
  // dedupe tags across sibling <Helmet> instances (only parent/child nesting), so a second
  // always-mounted <SEO> here would leave two <meta name="description"> / <link rel="canonical">
  // elements in the DOM whenever a page also renders its own <SEO> — silently reintroducing the
  // "duplicate canonical" bug this overhaul fixes. document.title has no such downside: the
  // setter updates the document's single title element in place, and a page's own <SEO> mounting
  // later simply takes over cleanly.
  useEffect(() => {
    document.title = i18n.language === 'en'
      ? 'MecaLIK — Mobile Mechanic Casablanca | Your car, your location.'
      : 'MecaLIK — Mécanicien à Domicile Casablanca | Votre voiture, votre lieu.'
  }, [i18n.language])

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  // Keep <html lang> in sync with i18next — covers initial load too, since i18next may
  // initialize straight into 'en' (from localStorage) while the static index.html always
  // ships with lang="fr".
  useEffect(() => {
    document.documentElement.lang = i18n.language || 'fr'
  }, [i18n.language])
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/booking') || location.pathname.startsWith('/fleet-dashboard') || location.pathname.startsWith('/mechanic')

  return (
    <>
      {/* Public navbar + its 64 px top-padding are hidden on /dashboard —
          the dashboard has its own sticky top bar and bottom tab bar */}
      {!isDashboard && <Navbar />}

      <div className={isDashboard ? '' : 'pt-16'}>
        <Suspense fallback={<div style={{ minHeight: '70vh', background: '#080808' }} />}>
        <Routes>
          <Route path="/"         element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/services" element={<PublicRoute><Services /></PublicRoute>} />
          <Route path="/fleet"    element={<PublicRoute><Fleet /></PublicRoute>} />
          <Route path="/a-propos" element={<PublicRoute><About /></PublicRoute>} />
          <Route path="/about"    element={<Navigate to="/a-propos" replace />} />
          <Route path="/comment-ca-marche" element={<PublicRoute><HowItWorksPage /></PublicRoute>} />
          <Route path="/tarifs"   element={<PublicRoute><Tarifs /></PublicRoute>} />
          <Route path="/flottes"  element={<PublicRoute><Flottes /></PublicRoute>} />
          <Route path="/faq"      element={<PublicRoute><FAQ /></PublicRoute>} />
          <Route path="/devis"    element={<Navigate to="/tarifs" replace />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup"   element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/mot-de-passe-oublie" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/nouveau-mot-de-passe" element={<ResetPassword />} />
          <Route path="/booking/:id" element={<BookingConfirmation />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/voitures" element={
            <ProtectedRoute requiredRole="customer"><MyGarage /></ProtectedRoute>
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
          <Route path="/garage/:token" element={<GaragePage />} />
          <Route path="/track/:reference?" element={<TrackBooking />} />
          <Route path="/suivi/:reference?" element={<TrackBooking />} />
          <Route path="/avis/:token" element={<ReviewPage />} />
          <Route path="/mechanic" element={<MechanicDashboard />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
        </Suspense>

        {!isDashboard && <Footer />}
        {!isDashboard && !location.pathname.startsWith('/garage') && <WhatsAppFAB />}

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
