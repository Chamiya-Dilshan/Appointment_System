import { useState, useEffect } from 'react'
import ThemeToggle from './components/ThemeToggle'
import Dashboard from './Dashboard/Dashboard.jsx'
import CitizenBookingView from './components/CitizenBookingView'

// Mock 3 authorized administrative users with ministerial roles
const USERS = {
  secretary: { username: 'secretary', name: 'Secretary of Ministry', role: 'Secretary' },
  deputy_minister: { username: 'deputy_minister', name: 'Deputy Minister', role: 'Deputy Minister' },
  minister: { username: 'minister', name: 'Hon. Minister', role: 'Minister' }
}

function App() {
  const getIsAdminPath = () => {
    const pathname = window.location.pathname
    const searchParams = new URLSearchParams(window.location.search)
    return pathname.startsWith('/admin') || searchParams.get('view') === 'admin'
  }

  const getIsEmbed = () => {
    const searchParams = new URLSearchParams(window.location.search)
    return searchParams.get('embed') === 'true'
  }

  const [isAdminRoute, setIsAdminRoute] = useState(getIsAdminPath)
  const isEmbed = getIsEmbed()

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('currentUser') !== null
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  // Listen to browser navigation back/forward between / and /admin
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(getIsAdminPath())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin')
    setIsAdminRoute(true)
  }

  const navigateToCitizen = () => {
    window.history.pushState({}, '', '/')
    setIsAdminRoute(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
        setIsLoggedIn(true)
        localStorage.setItem('currentUser', JSON.stringify(data))
        if (data.token) {
          localStorage.setItem('authToken', data.token)
        }
      } else if (response.status === 429) {
        const errorData = await response.json()
        alert(errorData.message || "Too many failed attempts. Rate limit reached, please try again in a few minutes.")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Invalid Credentials")
      }
    } catch (err) {
      console.error("Login error:", err)
      alert("Cannot connect to the backend server. Please make sure the backend is running on port 5000.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    setCurrentUser(null)
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
  }

  // 1. If user is on the root path (/), render the Public Citizen Booking View
  if (!isAdminRoute) {
    return <CitizenBookingView onNavigateToAdmin={navigateToAdmin} isEmbed={isEmbed} />
  }

  // 2. If user is on /admin and authenticated, render the Admin Dashboard
  if (isLoggedIn) {
    return (
      <Dashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateToCitizen={navigateToCitizen}
      />
    )
  }

  // 3. If user is on /admin and unauthenticated, render the Staff Login Portal
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-300 dark:bg-slate-950 font-sans antialiased p-4 sm:p-6 md:p-8 relative transition-colors duration-300">

      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800/80 overflow-hidden flex flex-col md:flex-row min-h-[500px] relative">

        {/* Dark Mode Toggle Component inside card */}
        <ThemeToggle className="absolute top-4 right-4 z-50" />

        {/* Left Column: Welcome */}
        <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950/30 p-8 sm:p-12 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80">
          <div className="space-y-6 max-w-sm">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Officer Portal
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Authorized administrative login for Ministry Officials, Secretary, and Ministers.
              </p>
            </div>

            <button
              type="button"
              onClick={navigateToCitizen}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
            >
              <span>&larr;</span>
              <span>Return to Public Citizen Booking Portal</span>
            </button>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="w-full max-w-sm mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Admin Login
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please enter your credentials to access the ministerial registry.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label htmlFor="user-name" className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Username
                </label>
                <input
                  id="user-name"
                  type="text"
                  required
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-sky-400/40 focus:border-blue-500 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-800 transition-all duration-150 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="user-pass" className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                </div>
                <input
                  id="user-pass"
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-sky-400/40 focus:border-blue-500 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-800 transition-all duration-150 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/40 focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer transition-all duration-150 mt-2 shadow-sm"
              >
                Login
              </button>
            </form>

            {/* Quick Logins for the 3 Ministerial Roles */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Authorized Admin Logins</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(USERS).map(u => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => {
                      setUsername(u.username)
                      setPassword('password123')
                    }}
                    className="p-2.5 rounded-xl border border-slate-205 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-950/40 text-xs flex items-center justify-between cursor-pointer transition-all hover:border-slate-350 dark:hover:border-slate-750"
                  >
                    <div>
                      <strong className="text-slate-800 dark:text-slate-205 block font-semibold">{u.name}</strong>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">User: {u.username}</span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded shrink-0">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
