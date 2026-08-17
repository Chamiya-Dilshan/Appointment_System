import { useState } from 'react'
import ThemeToggle from "../components/ThemeToggle"

// Mock initial appointments
const INITIAL_APPOINTMENTS = [
  { id: 1, name: 'Sarah Connor', reason: 'General Consultation', date: '2026-08-15', time: '10:00 AM', status: 'Confirmed', phone: '+1 555-0199', email: 'sarah.c@cyberdyne.com', refNo: 'APPT-5B9C2D', nic: '198412345678', district: 'Colombo', province: 'Western', council: 'Colombo Municipal Council', gsDivision: 'Fort', address: 'Cyberdyne HQ, Colombo', postalCode: '00100' },
  { id: 2, name: 'John Doe', reason: 'Dental Cleaning', date: '2026-08-15', time: '11:30 AM', status: 'Pending', phone: '+1 555-0143', email: 'john.doe@gmail.com', refNo: 'APPT-9X4E1F', nic: '199098765432', district: 'Kandy', province: 'Central', council: 'Kandy Municipal Council', gsDivision: 'Katugastota', address: '45, Peradeniya Rd, Kandy', postalCode: '20000' },
  { id: 3, name: 'Bruce Wayne', reason: 'Therapy Session', date: '2026-08-16', time: '03:00 PM', status: 'Confirmed', phone: '+1 555-0100', email: 'bruce@waynecorp.com', refNo: 'APPT-2A7D8K', nic: '197544332211', district: 'Galle', province: 'Southern', council: 'Galle Municipal Council', gsDivision: 'Fort', address: 'Wayne Manor, Galle', postalCode: '80000' },
  { id: 4, name: 'Clark Kent', reason: 'Eye Examination', date: '2026-08-17', time: '09:00 AM', status: 'Cancelled', phone: '+1 555-0112', email: 'clark.k@dailyplanet.com', refNo: 'APPT-3H8J9P', nic: '198088776655', district: 'Gampaha', province: 'Western', council: 'Gampaha Municipal Council', gsDivision: 'Kadawatha', address: '32, Kandy Rd, Kadawatha', postalCode: '11850' },
  { id: 5, name: 'Diana Prince', reason: 'Cardiology Check', date: '2026-08-18', time: '02:00 PM', status: 'Pending', phone: '+1 555-0125', email: 'diana@themyscira.gov', refNo: 'APPT-4Y9L0Q', nic: '198555443322', district: 'Jaffna', province: 'Northern', council: 'Jaffna Municipal Council', gsDivision: 'Nallur', address: 'Temple Rd, Nallur, Jaffna', postalCode: '40000' },
]

// Standard 30-minute interval time slots from 9:00 AM to 5:00 PM
const TIME_SLOTS = [
  { value: "09:00", label: "09:00 AM" },
  { value: "09:30", label: "09:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "13:30", label: "01:30 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "14:30", label: "02:30 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "15:30", label: "03:30 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "16:30", label: "04:30 PM" },
  { value: "17:00", label: "05:00 PM" }
]

// Custom Interactive Calendar datepicker component to render only enabled days
function CustomDatePicker({ allowedDates, value, onChange }) {
  const tomorrowStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  const filteredAllowedDates = allowedDates.filter(d => d >= tomorrowStr)

  const [currentDate, setCurrentDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00')
    if (filteredAllowedDates.length > 0) return new Date(filteredAllowedDates[0] + 'T00:00:00')
    return new Date()
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const days = []
  // Fill empty slots for previous month padding days
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />)
  }

  // Fill actual calendar days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isAllowed = filteredAllowedDates.includes(dateStr)
    const isSelected = value === dateStr

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={!isAllowed}
        onClick={() => onChange(dateStr)}
        className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-all ${isSelected
          ? 'bg-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-500/30'
          : isAllowed
            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer'
            : 'invisible pointer-events-none'
          }`}
      >
        {isAllowed ? d : ''}
      </button>
    )
  }

  return (
    <div className="w-[280px]">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer text-sm font-bold leading-none"
        >
          &larr;
        </button>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer text-sm font-bold leading-none"
        >
          &rarr;
        </button>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 justify-items-center">
        {days}
      </div>
    </div>
  )
}

export default function Dashboard({ onLogout }) {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Allowed Dates configuration set (set of dates that can be booked)
  const [allowedDates, setAllowedDates] = useState(['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-20'])
  const [tempDateInput, setTempDateInput] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

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

  // New appointment form state
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newStatus, setNewStatus] = useState('Pending')
  const [newNic, setNewNic] = useState('')
  const [newDistrict, setNewDistrict] = useState('')
  const [newProvince, setNewProvince] = useState('')
  const [newCouncil, setNewCouncil] = useState('')
  const [newGsDivision, setNewGsDivision] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newPostalCode, setNewPostalCode] = useState('')

  // Calculate statistics
  const totalAppts = appointments.length
  const confirmedAppts = appointments.filter(a => a.status === 'Confirmed').length
  const pendingAppts = appointments.filter(a => a.status === 'Pending').length
  const cancelledAppts = appointments.filter(a => a.status === 'Cancelled').length

  // Filtered appointments
  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = appt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appt.phone && appt.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appt.email && appt.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appt.nic && appt.nic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appt.district && appt.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appt.gsDivision && appt.gsDivision.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appt.address && appt.address.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'All' || appt.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Helper to generate a unique random booking Reference Number
  const generateRefNo = () => {
    return 'APPT-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Parse input time string in 24h format (e.g. "14:30") to minutes from midnight
  const parseInputTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Parse formatted appointment time string (e.g. "02:30 PM") to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    const [time, modifier] = timeStr.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (modifier === 'PM' && hours < 12) hours += 12
    if (modifier === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  // Get all available 30-minute time slots for the selected date
  const getAvailableTimeSlots = () => {
    if (!newDate) return []

    return TIME_SLOTS.filter(slot => {
      // 1. Conflict check (less than 30 mins difference with any existing appointment on that date)
      const slotMinutes = parseInputTimeToMinutes(slot.value)
      const hasConflict = appointments.some(appt => {
        if (appt.date !== newDate || appt.status === 'Cancelled') return false
        const apptMinutes = parseTimeToMinutes(appt.time)
        const diff = Math.abs(apptMinutes - slotMinutes)
        return diff < 30
      })
      if (hasConflict) return false

      // 2. Lead time check (must be booked at least 24 hours in advance)
      const now = new Date()
      const selectedDateTime = new Date(`${newDate}T${slot.value}`)
      const diffHours = (selectedDateTime - now) / (1000 * 60 * 60)
      if (diffHours < 24) return false

      return true
    })
  }

  // Handle adding new appointment
  const handleAddAppointment = (e) => {
    e.preventDefault()
    if (!newName.trim() || !newPhone.trim() || !newEmail.trim() || !newReason.trim() || !newDate || !newTime ||
      !newNic.trim() || !newDistrict.trim() || !newProvince.trim() || !newCouncil.trim() ||
      !newGsDivision.trim() || !newAddress.trim() || !newPostalCode.trim()) return

    // Ensure selected date is within the set of allowed booking dates
    if (!allowedDates.includes(newDate)) {
      alert("Invalid Booking: The selected date is not available for booking.")
      return
    }

    // Ensure booking is made at least 24 hours in advance
    const now = new Date()
    const selectedDateTime = new Date(`${newDate}T${newTime}`)
    const diffHours = (selectedDateTime - now) / (1000 * 60 * 60)
    if (diffHours < 24) {
      alert("Invalid Booking: Appointments must be booked at least 24 hours in advance.")
      return
    }

    // Double booking & 30 minutes gap check
    const newTimeMinutes = parseInputTimeToMinutes(newTime)
    const timeConflict = appointments.some(appt => {
      // Ignore checks for cancelled appointments
      if (appt.date !== newDate || appt.status === 'Cancelled') return false

      const apptMinutes = parseTimeToMinutes(appt.time)
      const diff = Math.abs(apptMinutes - newTimeMinutes)
      return diff < 30
    })

    if (timeConflict) {
      alert("Scheduling Conflict: Another appointment is already booked at or within 30 minutes of this slot on the same day.")
      return
    }

    const refNo = generateRefNo()
    const newAppt = {
      id: Date.now(),
      name: newName,
      reason: newReason,
      phone: newPhone,
      email: newEmail,
      date: newDate,
      time: formatTime(newTime),
      status: newStatus,
      refNo: refNo,
      nic: newNic,
      district: newDistrict,
      province: newProvince,
      council: newCouncil,
      gsDivision: newGsDivision,
      address: newAddress,
      postalCode: newPostalCode
    }

    // Auto trigger notification toast if confirmed immediately
    if (newStatus === 'Confirmed') {
      triggerNotification(newAppt)
    }

    setAppointments([newAppt, ...appointments])

    // Reset form
    setNewName('')
    setNewPhone('')
    setNewEmail('')
    setNewReason('')
    setNewDate('')
    setNewTime('')
    setNewNic('')
    setNewDistrict('')
    setNewProvince('')
    setNewCouncil('')
    setNewGsDivision('')
    setNewAddress('')
    setNewPostalCode('')
    setNewStatus('Pending')
    setIsModalOpen(false)
    setShowDatePicker(false)
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

  // Helper to format time to AM/PM standard
  const formatTime = (timeStr) => {
    const [hourStr, minStr] = timeStr.split(':')
    const hour = parseInt(hourStr)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minStr} ${ampm}`
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-12">

      {/* Premium Dashboard Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Appointment Portal
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Admin Control Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* User profile / Logout Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Admin User</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">active session</p>
            </div>

            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 shadow-sm cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Panel */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

        {/* Statistics Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1: Total */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-300 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Booked</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold">{totalAppts}</span>
              <span className="text-sm text-indigo-500 dark:text-indigo-400 font-medium">appointments</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Full scheduled list</span>
            </div>
          </div>

          {/* Stat 2: Confirmed */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-300 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Confirmed</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{confirmedAppts}</span>
              <span className="text-sm text-emerald-500 font-medium">active</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Ready for service</span>
            </div>
          </div>

          {/* Stat 3: Pending */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-300 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Review</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{pendingAppts}</span>
              <span className="text-sm text-amber-500 font-medium">awaiting</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Requires confirmation</span>
            </div>
          </div>

          {/* Stat 4: Cancelled */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-300 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cancelled</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{cancelledAppts}</span>
              <span className="text-sm text-rose-500 font-medium">dismissed</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Voided appointments</span>
            </div>
          </div>
        </section>

        {/* Booking Rules Settings (Enable specific set of dates for user scheduling) */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-sm font-extrabold tracking-tight">Manage Available Booking Dates</h2>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Specify which dates are enabled for user bookings. Click on a date to remove it from the allowed set.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <input
              type="date"
              value={tempDateInput}
              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              onChange={(e) => setTempDateInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!tempDateInput) return

                // Ensure date is at least 24 hours in the future
                const now = new Date()
                const selectedDateTime = new Date(`${tempDateInput}T23:59:59`)
                if (selectedDateTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
                  alert("Invalid Date: You can only enable dates that are at least 24 hours in the future.")
                  return
                }

                if (allowedDates.includes(tempDateInput)) {
                  alert("This date is already enabled.")
                  return
                }
                setAllowedDates([...allowedDates, tempDateInput].sort())
                setTempDateInput('')
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all cursor-pointer shadow-sm shadow-indigo-500/10"
            >
              Enable Date
            </button>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Booking Calendar Dates ({allowedDates.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {allowedDates.map(date => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-sm font-bold text-indigo-600 dark:text-indigo-400"
                >
                  <span>{date}</span>
                  <button
                    type="button"
                    onClick={() => setAllowedDates(allowedDates.filter(d => d !== date))}
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-bold cursor-pointer text-sm leading-none"
                    title={`Remove ${date}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
              {allowedDates.length === 0 && (
                <span className="text-sm text-rose-500 font-medium">No dates currently available. Users cannot book appointments.</span>
              )}
            </div>
          </div>
        </section>

        {/* Filter and Table Card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">

          {/* Controls Bar */}
          <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Left side: Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
              {/* Search input */}
              <div className="relative flex-1">
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search client or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
                {['All', 'Confirmed', 'Pending', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${statusFilter === status
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Action Button */}
            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-505 dark:hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Appointment
              </button>
            </div>
          </div>

          {/* Desktop View: Table (hidden on mobile/tablet, shown on lg screens) */}
          <div className="hidden lg:block overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50/20 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{appt.name}</span>
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono select-all shrink-0">
                                {appt.refNo}
                              </span>
                            </div>
                            <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">{appt.email} / {appt.phone}</div>
                            {appt.nic && (
                              <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-1.5 items-center">
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold font-mono">NIC: {appt.nic}</span>
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-semibold">GS: {appt.gsDivision}</span>
                                <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold">{appt.district}, {appt.province}</span>
                              </div>
                            )}
                            {appt.address && (
                              <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 italic max-w-xs truncate" title={`${appt.address}, ${appt.postalCode}`}>
                                📍 {appt.address} ({appt.postalCode})
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                        {appt.reason}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {appt.date}
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold">
                        {appt.time}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 ${appt.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : appt.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${appt.status === 'Confirmed'
                            ? 'bg-emerald-500'
                            : appt.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            }`} />
                          {appt.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {appt.status === 'Pending' && (
                            <button
                              onClick={() => handleConfirmAppointment(appt.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all font-bold cursor-pointer"
                              title="Confirm Appointment"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-all font-bold cursor-pointer"
                            title="Delete Appointment"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No appointments matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Cards List (shown on mobile/tablet, hidden on lg screens) */}
          <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt) => (
                <div key={appt.id} className="p-5 space-y-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side: Avatar & Name/Reason */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-extrabold uppercase text-sm">
                        {appt.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{appt.name}</h4>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {appt.refNo}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{appt.reason}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{appt.email} / {appt.phone}</p>
                        {appt.nic && (
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-1.5 items-center">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold font-mono">NIC: {appt.nic}</span>
                            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-semibold">GS: {appt.gsDivision}</span>
                            <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold">{appt.district}, {appt.province}</span>
                          </div>
                        )}
                        {appt.address && (
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 italic max-w-[200px] truncate" title={`${appt.address}, ${appt.postalCode}`}>
                            📍 {appt.address} ({appt.postalCode})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 shrink-0 ${appt.status === 'Confirmed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : appt.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${appt.status === 'Confirmed'
                        ? 'bg-emerald-500'
                        : appt.status === 'Pending'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                        }`} />
                      {appt.status}
                    </span>
                  </div>

                  {/* Bottom details and actions */}
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 dark:border-slate-800/40">
                    {/* Date/Time */}
                    <div className="text-slate-500 dark:text-slate-400">
                      <p className="font-medium text-slate-600 dark:text-slate-300">{appt.date}</p>
                      <p className="text-[10px] mt-0.5">{appt.time}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {appt.status === 'Pending' && (
                        <button
                          onClick={() => handleConfirmAppointment(appt.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-all font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                No appointments matching the current filters.
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Modern Dialog Modal for Adding Appointment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity overflow-y-auto">

          <div className="w-full max-w-md my-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xl p-6 relative overflow-visible animate-in fade-in zoom-in-95 duration-150">

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Book New Appointment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="space-y-4">
              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              {/* NIC */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  NIC (National Identity Card)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 199512345678 or 951234567V"
                  value={newNic}
                  onChange={(e) => setNewNic(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              {/* Contact Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Contact No
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+94  7X XXX XXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Reason Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Reason for Visit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Consultation, Routine checkup"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              {/* Regional Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Province */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Province
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Western"
                    value={newProvince}
                    onChange={(e) => setNewProvince(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
                {/* District */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    District
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
                {/* Council */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Local Council
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Municipal Council / Sabha"
                    value={newCouncil}
                    onChange={(e) => setNewCouncil(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
                {/* GS Division */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    GS Division (Grama Niladhari)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo Fort"
                    value={newGsDivision}
                    onChange={(e) => setNewGsDivision(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter street address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Postal Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 00100"
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              {/* Date selection with floating custom Calendar Picker */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    required
                    placeholder="Click to select available date"
                    value={newDate}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {showDatePicker && (
                  <div className="absolute left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <CustomDatePicker
                      allowedDates={allowedDates}
                      value={newDate}
                      onChange={(date) => {
                        setNewDate(date)
                        setNewTime('') // Reset selected time when date changes
                        setShowDatePicker(false)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Time selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Time Slot
                </label>
                <select
                  required
                  value={newTime}
                  disabled={!newDate}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!newDate ? (
                    <option value="">Please select a date first</option>
                  ) : getAvailableTimeSlots().length === 0 ? (
                    <option value="">No time slots available for this date</option>
                  ) : (
                    <>
                      <option value="">Choose a time slot</option>
                      {getAvailableTimeSlots().map(slot => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Initial Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Status
                </label>
                <div className="flex gap-4 mt-1">
                  {['Pending', 'Confirmed'].map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="newStatus"
                        value={status}
                        checked={newStatus === status}
                        onChange={() => setNewStatus(status)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-50 dark:hover:bg-white dark:text-slate-950 transition-colors cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Toast Notification for confirming dispatching simulated Email / SMS confirmation alerts */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-200 animate-in slide-in-from-bottom-5 fade-in duration-200 flex items-start gap-3">
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
            <div className="mt-2 text-[9px] bg-slate-800 dark:bg-slate-100 text-slate-300 dark:text-slate-600 px-2 py-0.5 rounded font-mono inline-block">
              Ref: {toast.refNo}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

