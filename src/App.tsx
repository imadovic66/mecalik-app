import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import WhatsAppFAB from './components/ui/WhatsAppFAB'
import BookingModal from './components/ui/BookingModal'
import Home from './pages/Home'
import Services from './pages/Services'
import Fleet from './pages/Fleet'
import About from './pages/About'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import CustomerDashboard from './pages/dashboard/CustomerDashboard'
import BookingConfirmation from './pages/dashboard/BookingConfirmation'
import FleetDashboard from './pages/fleet/FleetDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './components/ui/ProtectedRoute'
import PublicRoute from './components/ui/PublicRoute'

function App() {
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    const handler = () => setBookingOpen(true)
    window.addEventListener('openBooking', handler)
    return () => window.removeEventListener('openBooking', handler)
  }, [])

  return (
    <BrowserRouter>
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/services" element={<PublicRoute><Services /></PublicRoute>} />
          <Route path="/fleet" element={<PublicRoute><Fleet /></PublicRoute>} />
          <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
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
        <Footer />
        <WhatsAppFAB />
        <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      </div>
    </BrowserRouter>
  )
}

export default App
