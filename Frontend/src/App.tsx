import { useMemo, useState } from 'react'
import { CustomerHomePage } from './pages/CustomerHomePage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import type { LoginResponse } from './types/auth'

function App() {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(() => {
    const raw = localStorage.getItem('currentUser')
    if (!raw) return null
    try {
      return JSON.parse(raw) as LoginResponse
    } catch {
      return null
    }
  })

  const isLoggedIn = useMemo(() => Boolean(currentUser?.accessToken), [currentUser])

  function handleLoginSuccess(user: LoginResponse) {
    setCurrentUser(user)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
  }

  if (!isLoggedIn || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  if (currentUser.role.toLowerCase() === 'admin') {
    return <DashboardPage currentUser={currentUser} onLogout={handleLogout} />
  }

  return <CustomerHomePage currentUser={currentUser} onLogout={handleLogout} />
}

export default App
