import { useState, useEffect } from 'react'
import ThemeToggle from "../components/ThemeToggle"
import Sidebar from './components/Sidebar'
import OverviewTab from './components/OverviewTab'
import AppointmentsTab from './components/AppointmentsTab'
import ScheduleTab from './components/ScheduleTab'
import BookTab from './components/BookTab'
import DailyTab from './components/DailyTab'

// Mock initial appointments
const INITIAL_APPOINTMENTS = [
  { id: 1, name: 'Sarah Connor', reason: 'General Consultation', date: '2026-08-15', time: '10:00 AM', status: 'Confirmed', phone: '+1 555-0199', email: 'sarah.c@cyberdyne.com', refNo: 'APPT-5B9C2D', nic: '198412345678', district: 'Colombo', province: 'Western', council: 'Colombo Municipal Council', gsDivision: 'Fort', address: 'Cyberdyne HQ, Colombo', postalCode: '00100', officer: 'Secretary' },
  { id: 2, name: 'John Doe', reason: 'Dental Cleaning', date: '2026-08-15', time: '11:30 AM', status: 'Pending', phone: '+1 555-0143', email: 'john.doe@gmail.com', refNo: 'APPT-9X4E1F', nic: '199098765432', district: 'Kandy', province: 'Central', council: 'Kandy Municipal Council', gsDivision: 'Katugastota', address: '45, Peradeniya Rd, Kandy', postalCode: '20000', officer: 'Deputy Minister' },
  { id: 3, name: 'Bruce Wayne', reason: 'Therapy Session', date: '2026-08-16', time: '03:00 PM', status: 'Confirmed', phone: '+1 555-0100', email: 'bruce@waynecorp.com', refNo: 'APPT-2A7D8K', nic: '197544332211', district: 'Galle', province: 'Southern', council: 'Galle Municipal Council', gsDivision: 'Fort', address: 'Wayne Manor, Galle', postalCode: '80000', officer: 'Minister' },
  { id: 4, name: 'Clark Kent', reason: 'Eye Examination', date: '2026-08-17', time: '09:00 AM', status: 'Cancelled', phone: '+1 555-0112', email: 'clark.k@dailyplanet.com', refNo: 'APPT-3H8J9P', nic: '198088776655', district: 'Gampaha', province: 'Western', council: 'Gampaha Municipal Council', gsDivision: 'Kadawatha', address: '32, Kandy Rd, Kadawatha', postalCode: '11850', officer: 'Secretary', cancellationRemark: 'Urgent assignment at the Daily Planet' },
  { id: 5, name: 'Diana Prince', reason: 'Cardiology Check', date: '2026-08-18', time: '02:00 PM', status: 'Pending', phone: '+1 555-0125', email: 'diana@themyscira.gov', refNo: 'APPT-4Y9L0Q', nic: '198555443322', district: 'Jaffna', province: 'Northern', council: 'Jaffna Municipal Council', gsDivision: 'Nallur', address: 'Temple Rd, Nallur, Jaffna', postalCode: '40000', officer: 'Minister' },
]

export default function Dashboard({ currentUser, onLogout }) {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS)
  const [allowedDates, setAllowedDates] = useState(['2026-08-20', '2026-08-21', '2026-08-25', '2026-08-29', '2026-08-30'])

  // Navigation active tab: 'overview' | 'appointments' | 'schedule' | 'booking'
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Toast notifications for simulated Email / SMS confirmations
  const [toast, setToast] = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)

  const triggerNotification = (appt) => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId)
    }
    setToast(appt)
    const timer = setTimeout(() => {
      setToast(null)
      setToastTimeoutId(null)
    }, 6000)
    setToastTimeoutId(timer)
  }

  // Clear toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
    }
  }, [toastTimeoutId])

  // Handle adding new appointment (constructed by BookTab)
  const handleAddAppointment = (newAppt) => {
    // Auto trigger notification toast if confirmed immediately
    if (newAppt.status === 'Confirmed') {
      triggerNotification(newAppt)
    }
    setAppointments([newAppt, ...appointments])
  }

  // Handle canceling/deleting appointment
  const handleDeleteAppointment = (id) => {
    setAppointments(appointments.filter(appt => appt.id !== id))
  }

  // Handle status toggle / confirm appointment
  const handleConfirmAppointment = (id) => {
    setAppointments(appointments.map(appt => {
      if (appt.id === id) {
        triggerNotification(appt)
        return { ...appt, status: 'Confirmed' }
      }
      return appt
    }))
  }

  // Handle status updates from Details Modal (Option 2)
  const handleUpdateStatus = (id, newStatus, remark = '') => {
    setAppointments(prev => prev.map(appt => {
      if (appt.id === id) {
        if (newStatus === 'Confirmed' && appt.status !== 'Confirmed') {
          triggerNotification(appt)
        }
        return {
          ...appt,
          status: newStatus,
          cancellationRemark: newStatus === 'Cancelled' ? remark : undefined
        }
      }
      return appt
    }))
  }

  const handleAddDate = (date) => {
    setAllowedDates([...allowedDates, date].sort())
  }

  const handleRemoveDate = (date) => {
    setAllowedDates(allowedDates.filter(d => d !== date))
  }

  // Get today's local date string (YYYY-MM-DD)
  const todayStr = (() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  // Filter appointments for the current user's authorized ministerial role
  const authorizedAppointments = appointments.filter(appt => {
    if (currentUser && currentUser.role) {
      return appt.officer === currentUser.role
    }
    return true
  })

  // Auto-cancel past pending appointments dynamically
  const processedAppointments = authorizedAppointments.map(appt => {
    if (appt.date < todayStr && appt.status === 'Pending') {
      return { ...appt, status: 'Cancelled' }
    }
    return appt
  })

  // Partition appointments into active/upcoming and past history
  const activeAppointments = processedAppointments.filter(a => a.date >= todayStr)
  const pastAppointments = processedAppointments.filter(a => a.date < todayStr)

  // Get count of pending active appointments for sidebar badge
  const pendingCount = activeAppointments.filter(a => a.status === 'Pending').length

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab appointments={processedAppointments} setActiveTab={setActiveTab} />
      case 'appointments':
        return (
          <AppointmentsTab
            appointments={activeAppointments}
            onConfirm={handleConfirmAppointment}
            onDelete={handleDeleteAppointment}
            onUpdateStatus={handleUpdateStatus}
            setActiveTab={setActiveTab}
            title="Active Appointments"
            subtitle="Search, filter, and manage today's and upcoming client sessions."
          />
        )
      case 'history':
        return (
          <AppointmentsTab
            appointments={pastAppointments}
            onConfirm={handleConfirmAppointment}
            onDelete={handleDeleteAppointment}
            onUpdateStatus={handleUpdateStatus}
            setActiveTab={setActiveTab}
            title="Appointment History"
            subtitle="Browse and audit completed or past scheduled sessions."
            isHistory={true}
          />
        )
      case 'schedule':
        return (
          <ScheduleTab
            allowedDates={allowedDates}
            onAddDate={handleAddDate}
            onRemoveDate={handleRemoveDate}
          />
        )
      case 'booking':
        return (
          <BookTab
            appointments={processedAppointments}
            allowedDates={allowedDates}
            onAddAppointment={handleAddAppointment}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
          />
        )
      case 'daily':
        return (
          <DailyTab
            appointments={processedAppointments}
            onConfirm={handleConfirmAppointment}
            onDelete={handleDeleteAppointment}
          />
        )
      default:
        return <OverviewTab appointments={processedAppointments} setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Main Header (Responsive navbar) */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-xs">

          {/* Mobile menu and title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                A
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">System Portal</span>
            </div>

            {/* Desktop breadcrumb title info */}
            <div className="hidden md:block">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                System Portal
              </span>
              <h1 className="text-sm font-bold text-slate-450 dark:text-slate-500 flex items-center gap-1.5 capitalize">
                <span>admin control</span>
                <span>/</span>
                <span className="text-slate-450 dark:text-slate-500 font-bold">{activeTab}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />

            {/* Quick stats / profile bar for desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.username} Session</p>
                <p className="text-[9px] text-emerald-500 font-extrabold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-bold text-xs uppercase select-none">
                {currentUser?.name
                  ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                  : 'AD'
                }
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body content container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-16">
          {renderTabContent()}
        </main>
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800/80 dark:border-slate-200/80 animate-in slide-in-from-bottom-5 fade-in duration-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 mt-0.5">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-sm">Simulated Notifications Sent</h5>
            <p className="text-[10px] opacity-80 leading-normal">
              An SMS has been dispatched to <strong>{toast.phone}</strong> and a confirmation email sent to <strong>{toast.email}</strong>.
            </p>
            <div className="mt-2 text-[9px] bg-slate-800 dark:bg-slate-100 text-slate-350 dark:text-slate-600 px-2 py-0.5 rounded font-mono inline-block">
              Ref: {toast.refNo}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
