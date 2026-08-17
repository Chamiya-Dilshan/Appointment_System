import { useState, useEffect } from 'react'

export default function ThemeToggle({ className = '' }) {
  const [isDark, setIsDark] = useState(false)

  // Sync state with DOM and localStorage on mount
  useEffect(() => {
    const isDarkTheme = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
      className={`px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors shadow-sm cursor-pointer z-50 flex items-center gap-2 text-sm font-semibold select-none ${className}`}
    >
      {isDark ? (
        <>
          {/* Sun Icon (Light Theme Switcher) */}
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <span>Light Mode</span>
        </>
      ) : (
        <>
          {/* Moon Icon (Dark Theme Switcher) */}
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span>Dark Mode</span>
        </>
      )}
    </button>
  )
}
