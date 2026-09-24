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
  { id: 1, name: 'Sarah Connor', reason: 'General Consultation', date: '2026-08-24', time: '10:00 AM', status: 'Confirmed', phone: '+1 555-0199', email: 'sarah.c@cyberdyne.com', refNo: 'APPT-5B9C2D', nic: '198412345678', district: 'Colombo', province: 'Western', council: 'Colombo Municipal Council', gsDivision: 'Fort', address: 'Cyberdyne HQ, Colombo', postalCode: '00100', officer: 'Secretary' },
  { id: 2, name: 'John Doe', reason: 'Dental Cleaning', date: '2026-08-24', time: '11:30 AM', status: 'Pending', phone: '+1 555-0143', email: 'john.doe@gmail.com', refNo: 'APPT-9X4E1F', nic: '199098765432', district: 'Kandy', province: 'Central', council: 'Kandy Municipal Council', gsDivision: 'Katugastota', address: '45, Peradeniya Rd, Kandy', postalCode: '20000', officer: 'Secretary' },
  { id: 3, name: 'Bruce Wayne', reason: 'Therapy Session', date: '2026-08-25', time: '03:00 PM', status: 'Confirmed', phone: '+1 555-0100', email: 'bruce@waynecorp.com', refNo: 'APPT-2A7D8K', nic: '197544332211', district: 'Galle', province: 'Southern', council: 'Galle Municipal Council', gsDivision: 'Fort', address: 'Wayne Manor, Galle', postalCode: '80000', officer: 'Secretary' },
  { id: 4, name: 'Clark Kent', reason: 'Eye Examination', date: '2026-08-23', time: '09:00 AM', status: 'Cancelled', phone: '+1 555-0112', email: 'clark.k@dailyplanet.com', refNo: 'APPT-3H8J9P', nic: '198088776655', district: 'Gampaha', province: 'Western', council: 'Gampaha Municipal Council', gsDivision: 'Kadawatha', address: '32, Kandy Rd, Kadawatha', postalCode: '11850', officer: 'Secretary', cancellationRemark: 'Urgent assignment at the Daily Planet' },
  { id: 5, name: 'Diana Prince', reason: 'Cardiology Check', date: '2026-08-25', time: '02:00 PM', status: 'Pending', phone: '+1 555-0125', email: 'diana@themyscira.gov', refNo: 'APPT-4Y9L0Q', nic: '198555443322', district: 'Jaffna', province: 'Northern', council: 'Jaffna Municipal Council', gsDivision: 'Nallur', address: 'Temple Rd, Nallur, Jaffna', postalCode: '40000', officer: 'Secretary' },
  // Deputy Minister Initial Appointments
  { id: 6, name: 'Arthur Dent', reason: 'Sandwich Making consultation', date: '2026-08-27', time: '09:30 AM', status: 'Confirmed', phone: '+44 7700 900077', email: 'arthur.dent@prefect.com', refNo: 'APPT-6F8G9H', nic: '197943210987', district: 'Colombo', province: 'Western', council: 'Colombo Municipal Council', gsDivision: 'Kollupitiya', address: '12, Galle Rd, Colombo', postalCode: '00300', officer: 'Deputy Minister' },
  { id: 7, name: 'Tricia McMillan', reason: 'Astrophysics Discussion', date: '2026-08-28', time: '11:00 AM', status: 'Pending', phone: '+44 7700 900088', email: 'trillian@heartofgold.org', refNo: 'APPT-7I9J0K', nic: '198112345098', district: 'Kandy', province: 'Central', council: 'Kandy Municipal Council', gsDivision: 'Peradeniya', address: 'Royal Botanic Gardens, Kandy', postalCode: '20400', officer: 'Deputy Minister' },
  // Minister Initial Appointments
  { id: 8, name: 'Ford Prefect', reason: 'Guide Entry Updates', date: '2026-08-28', time: '02:00 PM', status: 'Confirmed', phone: '+1 555-4242', email: 'ford@hitchhikers.guide', refNo: 'APPT-8L0M1N', nic: '197822446688', district: 'Galle', province: 'Southern', council: 'Galle Municipal Council', gsDivision: 'Fort', address: 'Light House Street, Galle Fort', postalCode: '80000', officer: 'Minister' },
  { id: 9, name: 'Zaphod Beeblebrox', reason: 'Ego Boost Interview', date: '2026-08-31', time: '04:00 PM', status: 'Pending', phone: '+1 555-9999', email: 'president@galaxy.gov', refNo: 'APPT-9O1P2Q', nic: '197011335577', district: 'Jaffna', province: 'Northern', council: 'Jaffna Municipal Council', gsDivision: 'Chunnakam', address: 'Kankesanthurai Rd, Jaffna', postalCode: '40000', officer: 'Minister' }
]

export default function Dashboard({ currentUser, onLogout, onNavigateToCitizen }) {
  const [appointments, setAppointments] = useState([])
  const [allowedDatesByRole, setAllowedDatesByRole] = useState({
    'Secretary': [],
    'Deputy Minister': [],
    'Minister': []
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || currentUser?.token
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const handleAuthError = (status) => {
    if (status === 401) {
      alert("Your session has expired or is unauthorized. Please log in again.")
      if (onLogout) onLogout()
    }
  }

  // Load appointments and allowed dates from backend API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken') || currentUser?.token
        const [apptsRes, scheduleRes] = await Promise.all([
          fetch('/api/appointments', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          }),
          fetch('/api/schedule')
        ])

        if (apptsRes.ok) {
          const appts = await apptsRes.json()
          setAppointments(appts)
        } else if (apptsRes.status === 401) {
          handleAuthError(401)
        } else {
          console.error("Failed to load appointments from backend")
        }

        if (scheduleRes.ok) {
          const schedule = await scheduleRes.json()
          setAllowedDatesByRole(schedule)
        } else {
          console.error("Failed to load schedule from backend")
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      }
    }
    fetchData()
  }, [])

  const currentRole = currentUser?.role || 'Secretary'
  const allowedDates = allowedDatesByRole[currentRole] || []

  // Navigation active tab: 'overview' | 'appointments' | 'schedule' | 'booking'
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Toast notifications for simulated/live Email & SMS confirmations
  const [toast, setToast] = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)

  const triggerNotification = (appt, type = 'confirmed', meta = {}) => {
    if (!appt) return
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId)
    }
    setToast({
      ...appt,
      type,
      meta,
    })
    const timer = setTimeout(() => {
      setToast(null)
      setToastTimeoutId(null)
    }, 6500)
    setToastTimeoutId(timer)
  }

  // Clear toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
    }
  }, [toastTimeoutId])

  // Handle adding new appointment (constructed by BookTab)
  const handleAddAppointment = async (newAppt) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newAppt)
      })
      if (response.ok) {
        const createdAppt = await response.json()
        triggerNotification(createdAppt, createdAppt.status === 'Confirmed' ? 'confirmed' : 'booked')
        setAppointments([createdAppt, ...appointments])
      } else {
        const errData = await response.json()
        alert("Failed to book appointment: " + (errData.error || "Server error"))
      }
    } catch (err) {
      console.error("Booking error:", err)
      alert("Network error: Could not reach the server to book the appointment.")
    }
  }

  // Handle canceling/deleting appointment
  const handleDeleteAppointment = async (id) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (response.status === 401) {
        handleAuthError(401)
        return
      }
      if (response.ok) {
        setAppointments(appointments.filter(appt => appt.id !== id))
      } else {
        const errData = await response.json()
        alert("Failed to delete appointment: " + (errData.error || "Server error"))
      }
    } catch (err) {
      console.error("Delete error:", err)
      alert("Network error: Could not reach the server to delete the appointment.")
    }
  }

  // Handle status toggle / confirm appointment
  const handleConfirmAppointment = async (id) => {
    try {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'Confirmed' })
      })
      if (response.status === 401) {
        handleAuthError(401)
        return
      }
      if (response.ok) {
        const updatedAppt = await response.json()
        triggerNotification(updatedAppt, 'confirmed')
        setAppointments(appointments.map(appt => appt.id === id ? updatedAppt : appt))
      } else {
        const errData = await response.json()
        alert("Failed to confirm appointment: " + (errData.error || "Server error"))
      }
    } catch (err) {
      console.error("Confirm error:", err)
      alert("Network error: Could not reach the server to confirm the appointment.")
    }
  }

  // Handle status updates from Details Modal & Action buttons
  const handleUpdateStatus = async (id, newStatus, remark = '') => {
    try {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          cancellationRemark: newStatus === 'Cancelled' ? remark : undefined,
          completionRemark: newStatus === 'Completed' ? remark : undefined,
          remark: remark
        })
      })
      if (response.status === 401) {
        handleAuthError(401)
        return
      }
      if (response.ok) {
        const updatedAppt = await response.json()
        if (newStatus === 'Confirmed') {
          triggerNotification(updatedAppt, 'confirmed')
        } else if (newStatus === 'Cancelled') {
          triggerNotification(updatedAppt, 'cancelled')
        } else if (newStatus === 'Completed') {
          triggerNotification(updatedAppt, 'completed')
        } else if (newStatus === 'Pending') {
          triggerNotification(updatedAppt, 'reverted')
        }
        setAppointments(appointments.map(appt => appt.id === id ? updatedAppt : appt))
      } else {
        const errData = await response.json()
        alert("Failed to update status: " + (errData.error || "Server error"))
      }
    } catch (err) {
      console.error("Update status error:", err)
      alert("Network error: Could not reach the server to update the appointment status.")
    }
  }

  // Handle manual notification re-dispatch / trigger
  const handleResendNotification = async (id) => {
    try {
      const response = await fetch(`/api/appointments/${id}/resend-notification`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (response.status === 401) {
        handleAuthError(401)
        return { success: false, error: "Unauthorized" }
      }
      const data = await response.json()
      if (response.ok) {
        const appt = data.appointment || appointments.find(a => a.id === id)
        triggerNotification(appt, 'resent', data)
        return { success: true, message: data.message }
      } else {
        alert("Failed to dispatch notification: " + (data.error || "Server error"))
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error("Resend notification error:", err)
      alert("Network error: Could not connect to the server.")
      return { success: false, error: err.message }
    }
  }

  const handleAddDate = async (date) => {
    const currentRole = currentUser?.role || 'Secretary'
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: currentRole, date: date })
      })
      if (response.status === 401) {
        handleAuthError(401)
        return
      }
      if (response.ok) {
        setAllowedDatesByRole(prev => ({
          ...prev,
          [currentRole]: [...(prev[currentRole] || []), date].sort()
        }))
      } else {
        const errData = await response.json()
        alert("Failed to add date: " + (errData.error || "Server error"))
      }
    } catch (err) {
      console.error("Add date error:", err)
      alert("Network error: Could not reach the server to add date.")
    }
  }

  const handleRemoveDate = async (date) => {
    const currentRole = currentUser?.role || 'Secretary'
    try {
      const response = await fetch(`/api/schedule?role=${encodeURIComponent(currentRole)}&date=${encodeURIComponent(date)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (response.status === 401) {
        handleAuthError(401)
        return
      }
      if (response.ok) {
        setAllowedDatesByRole(prev => ({
          ...prev,
          [currentRole]: (prev[currentRole] || []).filter(d => d !== date)
        }))
      } else {
        const errData = await response.json()
        alert("Failed to remove date: " + (errData.error || "Server error"))
      }
    } catch (err) {
      console.error("Remove date error:", err)
      alert("Network error: Could not reach the server to remove date.")
    }
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

  // Partition appointments into active/upcoming and past history:
  // Active appointments retain confirmed and pending sessions until manually completed or cancelled
  const activeAppointments = processedAppointments.filter(a => a.status !== 'Completed' && (a.status !== 'Cancelled' || a.date >= todayStr))
  const pastAppointments = processedAppointments
    .filter(a => a.status === 'Completed' || a.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))

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
            onResendNotification={handleResendNotification}
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
            onResendNotification={handleResendNotification}
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
            onUpdateStatus={handleUpdateStatus}
            onResendNotification={handleResendNotification}
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
        onNavigateToCitizen={onNavigateToCitizen}
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

      {/* Global Toast / Pop-up Notification */}
      {toast && (() => {
        const type = toast.type || 'confirmed'
        let title = 'Notifications Dispatched'
        let bgIconClass = 'bg-emerald-500 text-white'
        let statusText = 'Confirmation email and SMS alert dispatched.'

        if (type === 'booked') {
          title = 'Booking Request Received'
          bgIconClass = 'bg-indigo-600 text-white'
          statusText = 'Official booking acknowledgment sent.'
        } else if (type === 'confirmed') {
          title = 'Appointment Confirmed'
          bgIconClass = 'bg-emerald-500 text-white'
          statusText = 'Official confirmation letter & SMS dispatched.'
        } else if (type === 'completed') {
          title = 'Appointment Completed'
          bgIconClass = 'bg-blue-600 text-white'
          statusText = 'Appointment marked as completed and session notes recorded.'
        } else if (type === 'cancelled') {
          title = 'Cancellation Dispatched'
          bgIconClass = 'bg-rose-500 text-white'
          statusText = 'Cancellation notice & SMS dispatched.'
        } else if (type === 'resent') {
          title = 'Notification Re-Dispatched'
          bgIconClass = 'bg-sky-500 text-white'
          statusText = 'Notification re-sent successfully.'
        } else if (type === 'reverted') {
          title = 'Status Changed to Pending'
          bgIconClass = 'bg-amber-500 text-white'
          statusText = 'Schedule status updated in ministerial registry.'
        }

        return (
          <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-55 bg-slate-900/60 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none flex items-center justify-center md:items-start md:justify-start p-4 md:p-0 transition-all duration-300">
            <div className="relative bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-6 md:p-4 rounded-3xl md:rounded-2xl shadow-2xl border border-slate-800/80 dark:border-slate-200/80 max-w-sm w-full md:w-auto flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-3 animate-in zoom-in-95 md:zoom-in-100 md:slide-in-from-bottom-5 duration-200">
              {/* Close Button */}
              <button
                onClick={() => setToast(null)}
                className="absolute top-3 right-3 md:top-2 md:right-2 p-1.5 rounded-lg text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
                title="Dismiss Notification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Status Icon */}
              <div className={`w-10 h-10 md:w-8 md:h-8 rounded-full ${bgIconClass} flex items-center justify-center shrink-0 shadow-sm`}>
                {type === 'cancelled' ? (
                  <svg className="w-5 h-5 md:w-4.5 md:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : type === 'resent' ? (
                  <svg className="w-5 h-5 md:w-4.5 md:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 md:w-4.5 md:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 space-y-1.5 md:space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="font-extrabold text-base md:text-sm tracking-tight">{title}</h5>
                </div>
                <p className="text-xs md:text-[10px] opacity-80 leading-normal">
                  {statusText} Dispatched to <strong>{toast.phone || 'No phone'}</strong> and <strong>{toast.email || 'No email'}</strong>.
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] md:text-[9px] bg-slate-800 dark:bg-slate-100 text-slate-300 dark:text-slate-700 px-2 py-0.5 rounded font-mono">
                    Ref: {toast.refNo}
                  </span>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 dark:text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">
                    Auto-Dispatched
                  </span>
                </div>

                {/* Got It Button (Mobile Only) */}
                <button
                  onClick={() => setToast(null)}
                  className="mt-4 w-full md:hidden py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
