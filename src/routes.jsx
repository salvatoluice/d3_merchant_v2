import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom';
import SignupPage from './pages/auth/SignUp'
import LoginPage from './pages/auth/Login'
import ServicesPage from './pages/services/Service'
import OfferPage from './pages/offers/Offers'
import CreateStore from './pages/stores/CreateStore'
// import Calendar from './pages/Calendar'
import Page404 from './pages/Page404'
import ServiceBookings from './pages/bookings/ServiceBookings'
import OfferBookings from './pages/bookings/OfferBookings'
import BookingDetails from './pages/bookings/BookingDetailsModal.jsx'
import StaffManagement from './pages/staff/StaffManagement'
import Socials from './pages/socials/Socials'
import Reviews from './pages/reviews/Reviews'
import AccountPage from './pages/account/Account'
import Dashboard from './pages/dashboard/Dashboard'
import DynamicFormPage from './pages/services/DynamicFormPage'
import Analytics from './pages/analytics/Analytics'
import BillingPage from './pages/account/Billings'
import Invoice from './pages/clients'
// import clients from './pages/account/Invoice'
import MerchantChatInterface from './pages/dashboard/MerchantChatInterface';
import ClientsPage from './pages/clients';
import ServiceRequests from './pages/servicereq/serviceRequests';
import BookingView from './pages/bookings/BookingView'; 

// In your dashboard


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/accounts/sign-up" element={<SignupPage />} />
      <Route path="/accounts/sign-in" element={<LoginPage />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/dashboard/chat' element={<MerchantChatInterface />} />
      <Route path="/dashboard/services" element={<ServicesPage />} />
      <Route path='/dashboard/dynamic-form/:id' element={<DynamicFormPage />} />
      <Route path='/dashboard/analytics' element={<Analytics />} />
      <Route path='/dashboard/offers' element={<OfferPage />} />
      {/* <Route path='/dashboard/calendar' element={<Calendar />} /> */}
      <Route path='/stores/create' element={<CreateStore />} />
      <Route path="/dashboard/service-bookings" element={<ServiceBookings />} />
      <Route path="/dashboard/offer-bookings" element={<OfferBookings />} />
      <Route path="/dashboard/bookings/:id/view" element={<BookingDetails />} />
      <Route path='/dashboard/staff' element={<StaffManagement />} />
      <Route path='/dashboard/socials' element={<Socials />} />
      <Route path="/dashboard/reviews" element={<Reviews />} />
      <Route path="/dashboard/billing" element={<BillingPage />} />
      <Route path="/dashboard/invoice" element={<Invoice />} />
      <Route path="/dashboard/account" element={<AccountPage />} />
      <Route path="/Clients" element={<ClientsPage />} />
      <Route path="/dashboard/serviceRequests" element={<ServiceRequests />} />
      <Route path="/dashboard/bookings/:id/view" element={<BookingView />} />
      <Route path="*" element={<Page404 />} />
    </Routes>
  )
}

export default AppRoutes