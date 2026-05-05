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
import FleetDashboard from './pages/fleet/FleetDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './components/ui/ProtectedRoute'

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
      <div className="pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
