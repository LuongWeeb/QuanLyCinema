import { useRecoilValue } from 'recoil'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminAuditoriumsPage } from './pages/admin/AdminAuditoriumsPage'
import { AdminMoviesPage } from './pages/admin/AdminMoviesPage'
import { AdminPendingReservationsPage } from './pages/admin/AdminPendingReservationsPage'
import { AdminRevenueReportPage } from './pages/admin/AdminRevenueReportPage'
import { AdminShowtimesPage } from './pages/admin/AdminShowtimesPage'
import { DashboardHome } from './pages/admin/DashboardHome'
import { CustomerHomePage } from './pages/CustomerHomePage'
import { LoginPage } from './pages/LoginPage'
import { MovieBookingPage } from './pages/MovieBookingPage'
import { MyTicketsPage } from './pages/MyTicketsPage'
import { isStaffOrAdminSelector } from './state/recoil/auth'
import type { LoginResponse } from './types/auth'

function AdminStaffRoutes({
  currentUser,
  onLogout,
}: {
  currentUser: LoginResponse
  onLogout: () => void
}) {
  const navigate = useNavigate()
  return (
    <Routes>
      <Route path="/" element={<AdminLayout currentUser={currentUser} onLogout={onLogout} />}>
        <Route index element={<DashboardHome />} />
        <Route path="phim" element={<AdminMoviesPage />} />
        <Route path="phong" element={<AdminAuditoriumsPage />} />
        <Route path="lich-chieu" element={<AdminShowtimesPage />} />
        <Route path="don-cho-duyet" element={<AdminPendingReservationsPage />} />
        <Route path="bao-cao" element={<AdminRevenueReportPage />} />
      </Route>
      <Route
        path="/ban-ve"
        element={
          <CustomerHomePage
            currentUser={currentUser}
            onLogout={onLogout}
            routeBase="/ban-ve"
            staffCounterMode
            onBackToAdmin={() => navigate('/')}
          />
        }
      />
      <Route
        path="/ban-ve/phim/:movieId"
        element={
          <MovieBookingPage
            currentUser={currentUser}
            onLogout={onLogout}
            routeBase="/ban-ve"
            staffCounterMode
            onBackToAdmin={() => navigate('/')}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  const { currentUser, isLoggedIn, logout } = useAuth()
  const useAdminPanel = useRecoilValue(isStaffOrAdminSelector)

  if (!isLoggedIn || !currentUser) {
    return <LoginPage />
  }

  if (useAdminPanel) {
    return <AdminStaffRoutes currentUser={currentUser} onLogout={logout} />
  }

  return (
    <Routes>
      <Route path="/" element={<CustomerHomePage currentUser={currentUser} onLogout={logout} />} />
      <Route
        path="/phim/:movieId"
        element={<MovieBookingPage currentUser={currentUser} onLogout={logout} />}
      />
      <Route path="/ve-cua-toi" element={<MyTicketsPage currentUser={currentUser} onLogout={logout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
