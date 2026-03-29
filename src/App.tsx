import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'
import { SetupBanner } from './components/SetupBanner'
import { AppLayout } from './components/AppLayout'
import { LoadingScreen } from './components/LoadingScreen'
import { HomePage } from './pages/Home'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { ForgotPasswordPage } from './pages/ForgotPassword'
import { ResetPasswordPage } from './pages/ResetPassword'
import { PendingPage } from './pages/Pending'
import { DashboardPage } from './pages/Dashboard'
import { HallBookingPage } from './pages/HallBooking'
import { ParkingPage } from './pages/Parking'
import { ContactsPage } from './pages/Contacts'
import { LandmarksPage } from './pages/Landmarks'
import { MarketplacePage } from './pages/Marketplace'
import { AdminPage } from './pages/Admin'
import { AccountIssuePage } from './pages/AccountIssue'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireMember({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/account-issue" replace />
  if (profile.role === 'pending') return <Navigate to="/pending" replace />
  if (profile.role !== 'member' && profile.role !== 'admin') {
    return <Navigate to="/pending" replace />
  }
  return children
}

function RequirePending({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/account-issue" replace />
  if (profile.role !== 'pending') return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <>
      <SetupBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/account-issue"
          element={
            <RequireAuth>
              <AccountIssuePage />
            </RequireAuth>
          }
        />
        <Route
          path="/pending"
          element={
            <RequireAuth>
              <RequirePending>
                <PendingPage />
              </RequirePending>
            </RequireAuth>
          }
        />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <RequireMember>
                <AppLayout />
              </RequireMember>
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="hall" element={<HallBookingPage />} />
          <Route path="parking" element={<ParkingPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="landmarks" element={<LandmarksPage />} />
          <Route path="market" element={<MarketplacePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
