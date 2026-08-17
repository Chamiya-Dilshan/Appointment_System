import { useState } from 'react'
import ThemeToggle from './components/ThemeToggle'
import Dashboard from './Dashboard/Dashboard.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    // Mock login verification (allows any username/password)
    if (username.trim() && password.trim()) {
      setIsLoggedIn(true)
    }
  }

  if (isLoggedIn) {
    return <Dashboard onLogout={() => setIsLoggedIn(false)} />
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-300 dark:bg-slate-950 font-sans antialiased p-4 sm:p-6 md:p-8 relative transition-colors duration-300">
      
      {/* Dark Mode Toggle Component */}
      <ThemeToggle className="absolute top-4 right-4" />

      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800/80 overflow-hidden flex flex-col md:flex-row min-h-[500px]">

        {/* Left Column: Welcome */}
        <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950/30 p-8 sm:p-12 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80">
          <div className="space-y-6 max-w-sm">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome to Appointment portal
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                A clean, secure, and user-friendly space to manage your schedules and appointments.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="w-full max-w-sm mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Login
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please enter your credentials to continue.
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
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
