import { useState, useEffect } from 'react'
import CustomDatePicker from '../Dashboard/components/CustomDatePicker'
import ThemeToggle from './ThemeToggle'
import {
  TIME_SLOTS,
  PROVINCES_AND_DISTRICTS,
  SRI_LANKA_PROVINCES,
  MINISTERIAL_OFFICERS,
  parseInputTimeToMinutes,
  parseTimeToMinutes,
  formatTime,
  generateRefNo
} from '../utils/sriLankaData'

export default function CitizenBookingView({ onNavigateToAdmin, isEmbed = false }) {
  // Officer selection
  const [selectedOfficer, setSelectedOfficer] = useState('Secretary')

  // Schedules and booked slots from backend
  const [scheduleByRole, setScheduleByRole] = useState({})
  const [bookedSlots, setBookedSlots] = useState([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)

  // Form input states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [nic, setNic] = useState('')
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('')
  const [council, setCouncil] = useState('')
  const [gsDivision, setGsDivision] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')

  // UI Dropdowns & validation states
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)

  const [formError, setFormError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [nicError, setNicError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Success Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [copiedRef, setCopiedRef] = useState(false)

  // Fetch public allowed schedule and booked slots
  useEffect(() => {
    const fetchPublicData = async () => {
      setLoadingSchedule(true)
      try {
        const [schedRes, slotsRes] = await Promise.all([
          fetch('/api/schedule'),
          fetch('/api/appointments/booked-slots')
        ])

        if (schedRes.ok) {
          const schedData = await schedRes.json()
          setScheduleByRole(schedData)
        }
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json()
          setBookedSlots(slotsData)
        }
      } catch (err) {
        console.error("Error fetching public schedule:", err)
      } finally {
        setLoadingSchedule(false)
      }
    }
    fetchPublicData()
  }, [])

  // Allowed dates for the currently selected officer
  const allowedDates = scheduleByRole[selectedOfficer] || []

  // When officer changes, clear date and time if previously selected date is not allowed, or if switching to Minister with an afternoon slot
  const handleOfficerChange = (officerRole) => {
    setSelectedOfficer(officerRole)
    const newOfficerDates = scheduleByRole[officerRole] || []
    if (!newOfficerDates.includes(date)) {
      setDate('')
      setTime('')
    } else if (officerRole === 'Minister' && time) {
      const [h] = time.split(':').map(Number)
      if (h >= 13) {
        setTime('')
      }
    }
  }

  // Check if a specific 30-minute time slot is already booked for selectedOfficer on date
  const isSlotBooked = (slotValue) => {
    if (!date) return false
    const slotMinutes = parseInputTimeToMinutes(slotValue)
    return bookedSlots.some(b => {
      if (b.officer !== selectedOfficer || b.date !== date) return false
      const bookedMinutes = parseTimeToMinutes(b.time)
      return Math.abs(bookedMinutes - slotMinutes) < 30
    })
  }

  // Morning slots (09:00 - 12:30)
  const morningSlots = TIME_SLOTS.filter(s => {
    const [h] = s.value.split(':').map(Number)
    return h < 13
  })

  // Afternoon slots (13:00 - 17:00)
  const afternoonSlots = TIME_SLOTS.filter(s => {
    const [h] = s.value.split(':').map(Number)
    return h >= 13
  })

  // Human-readable date label
  const formatDisplayDate = (dStr) => {
    if (!dStr) return ''
    try {
      const d = new Date(dStr + 'T00:00:00')
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    } catch {
      return dStr
    }
  }

  // Calculate available time slots for selected date & officer (30 min conflict gap)
  const getAvailableTimeSlots = () => {
    if (!date) return []

    return TIME_SLOTS.filter(slot => !isSlotBooked(slot.value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setPhoneError('')
    setNicError('')
    setEmailError('')

    // Basic required check
    if (!name.trim() || !phone.trim() || !reason.trim() || !date || !time ||
      !nic.trim() || !district.trim() || !province.trim() || !council.trim() ||
      !address.trim()) {
      setFormError("Please fill in all required fields marked with *.")
      return
    }

    let hasValidationError = false

    // NIC / Passport validation (Sri Lanka format)
    const nicRegex = /^(?:\d{9}[vVxX]|\d{12}|[a-zA-Z]{1,2}\d{6,8})$/
    if (!nicRegex.test(nic.trim())) {
      setNicError("Invalid format. Must be a valid Sri Lankan NIC (e.g. 951234567V or 199512345678) or Passport (e.g. N1234567).")
      hasValidationError = true
    }

    // Sri Lankan Phone validation strictly
    const cleanPhone = phone.replace(/[\s\-()]/g, '')
    const slPhoneRegex = /^(?:0|(?:\+94|0094|94))[1-9]\d{8}$/
    if (!slPhoneRegex.test(cleanPhone)) {
      setPhoneError("Invalid format. Must be a valid Sri Lankan phone number (e.g. 07X XXX XXXX or +94 7X XXX XXXX).")
      hasValidationError = true
    }

    // Optional Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email.trim() && !emailRegex.test(email.trim())) {
      setEmailError("Invalid email format (e.g. name@example.com).")
      hasValidationError = true
    }

    if (hasValidationError) {
      setFormError("Please correct the errors in the form before submitting.")
      return
    }

    // Date availability check - Citizens can only book on official Public Days (Mondays)
    const isMonday = new Date(date + 'T00:00:00').getDay() === 1
    if (!isMonday && !allowedDates.includes(date)) {
      setFormError("Citizen appointments can only be scheduled on official Public Days (Every Monday).")
      return
    }

    // Minister morning session only check
    if (selectedOfficer === 'Minister') {
      const [h] = time.split(':').map(Number)
      if (h >= 13) {
        setFormError("The Hon. Minister is available for public consultations during the morning session only (09:00 AM – 12:30 PM).")
        return
      }
    }

    // Double-booking conflict check
    const newTimeMinutes = parseInputTimeToMinutes(time)
    const conflict = bookedSlots.some(b => {
      if (b.officer !== selectedOfficer || b.date !== date) return false
      const diff = Math.abs(parseTimeToMinutes(b.time) - newTimeMinutes)
      return diff < 30
    })

    if (conflict) {
      setFormError("Scheduling Conflict: Another appointment is already booked at or within 30 minutes of this slot for this officer. Please pick another time.")
      return
    }

    setIsSubmitting(true)

    const refNo = generateRefNo()
    const payload = {
      id: Date.now(),
      meetingType: 'Public Consultation',
      name: name.trim(),
      reason: reason.trim(),
      phone: phone.trim(),
      email: email.trim(),
      date: date,
      time: formatTime(time),
      status: 'Pending',
      refNo: refNo,
      nic: nic.trim(),
      district: district.trim(),
      province: province.trim(),
      council: council.trim(),
      gsDivision: gsDivision.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      officer: selectedOfficer
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        setConfirmedBooking(result)
        // Refresh booked slots in background
        setBookedSlots(prev => [...prev, { date: payload.date, time: payload.time, officer: payload.officer }])
      } else {
        const errData = await response.json()
        setFormError(errData.error || "Failed to book appointment. Please try again.")
      }
    } catch (err) {
      console.error("Booking error:", err)
      setFormError("Network error: Could not reach the server. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setReason('')
    setDate('')
    setTime('')
    setNic('')
    setDistrict('')
    setProvince('')
    setCouncil('')
    setGsDivision('')
    setAddress('')
    setPostalCode('')
    setFormError('')
    setPhoneError('')
    setNicError('')
    setEmailError('')
    setConfirmedBooking(null)
  }

  const copyRefNo = () => {
    if (confirmedBooking?.refNo) {
      navigator.clipboard.writeText(confirmedBooking.refNo)
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2500)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Official Booking Confirmation Receipt
  // ──────────────────────────────────────────────────────────────────────────
  if (confirmedBooking) {
    return (
      <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 animate-in zoom-in-95 duration-200 ${isEmbed ? '' : 'my-8'}`}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 sm:p-8 text-white text-center relative">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Appointment Request Received</h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Your appointment request has been registered in the ministerial registry and is pending administrative review.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* Reference Number Card */}
            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Official Reference Number
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-indigo-650 dark:text-indigo-400 tracking-wider">
                  {confirmedBooking.refNo}
                </span>
              </div>
              <button
                type="button"
                onClick={copyRefNo}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedRef ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Reference</span>
                  </>
                )}
              </button>
            </div>

            {/* Schedule & Office Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Appointment Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Designated Office</span>
                  <strong className="text-slate-850 dark:text-white text-sm font-semibold">{confirmedBooking.officer}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Date & Time</span>
                  <strong className="text-indigo-650 dark:text-indigo-400 text-sm font-semibold">
                    {confirmedBooking.date} at {confirmedBooking.time}
                  </strong>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Citizen Name</span>
                  <span className="text-slate-800 dark:text-white font-medium">{confirmedBooking.name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">NIC / Passport</span>
                  <span className="font-mono text-slate-800 dark:text-white font-medium">{confirmedBooking.nic}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Purpose of Consultation</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{confirmedBooking.reason}</p>
                </div>
              </div>
            </div>

            {/* Notice Alert */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Important Instructions for the Citizen</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-amber-850 dark:text-amber-300">
                <li>An automated SMS notification has been dispatched to <strong>{confirmedBooking.phone}</strong>.</li>
                {confirmedBooking.email && <li>A notification has also been sent to <strong>{confirmedBooking.email}</strong>.</li>}
                <li>Please bring your original <strong>National Identity Card (NIC)</strong> or Passport on the day of the consultation.</li>
                <li>Arrive at the Ministry Reception 10 minutes prior to your scheduled time slot.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print / Save Receipt</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
              >
                Book Another Appointment
              </button>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Public Citizen Booking Form
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300 ${isEmbed ? 'p-2' : ''}`}>

      {/* Top Navbar for Public Portal (Hidden when embedded inside ministry iframe) */}
      {!isEmbed && (
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Ministry of Fisheries,Aquatic and Ocean Resources
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Official Citizen Appointment Portal &bull; Democratic Socialist Republic of Sri Lanka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-700"
                title="Administrative Access for Ministry Officers"
              >
                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Officer Login</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-6">

        {/* Title Header */}
        <div className="text-center space-y-2 mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span>Official Citizen Public Day: Every Monday (මහජන දිනය)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Schedule a Citizen Consultation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Public in-person consultations with the Secretary and Hon. Minister are held exclusively on designated Public Days (Every Monday). Note: The Hon. Minister is available during the morning session only (09:00 AM – 12:30 PM).
          </p>
        </div>

        {/* Booking Card Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-visible">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

            {/* Section 1: Officer Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>1. Select Designated Officer</span>
                <span className="text-[10px] text-slate-400 normal-case font-normal">Choose who you wish to meet</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MINISTERIAL_OFFICERS.map((officer) => {
                  const isSelected = selectedOfficer === officer.role
                  return (
                    <button
                      key={officer.role}
                      type="button"
                      onClick={() => handleOfficerChange(officer.role)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-950/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {officer.badge}
                          </span>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                          {officer.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {officer.description}
                        </p>
                        {officer.scheduleNote && (
                          <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex items-center gap-1 ${
                            officer.morningOnly
                              ? 'text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40'
                              : 'text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/40'
                          }`}>
                            <span>{officer.morningOnly ? '☀️' : '🗓️'}</span>
                            <span>{officer.scheduleNote}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 2: Date & Time Schedule Selection */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <span>2. Consultation Schedule (Public Days Only)</span>
                  <span className="text-[10px] font-normal px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                    Mondays (මහජන දිනය)
                  </span>
                </h3>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {date ? `Selected Date: ${date}` : 'Please pick an upcoming Monday on the calendar'}
                </span>
              </div>

              {/* 2-Column Responsive Layout for Calendar & Time Slots */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800/70">

                {/* Left Column: Interactive Calendar (lg:col-span-6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-black">1</span>
                      Choose Consultation Date *
                    </span>
                    {date && (
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                        {formatDisplayDate(date)}
                      </span>
                    )}
                  </div>

                  {loadingSchedule ? (
                    <div className="text-xs text-slate-400 py-12 text-center">Loading Public Day schedule...</div>
                  ) : (
                    <CustomDatePicker
                      allowedDates={allowedDates}
                      value={date}
                      allowAnyDate={false}
                      onChange={(d) => {
                        setDate(d)
                        setTime('')
                      }}
                    />
                  )}
                </div>

                {/* Right Column: Time Slots (lg:col-span-6) */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex-1">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">2</span>
                        Select 30m Time Slot *
                      </span>
                      {time && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                          {formatTime(time)}
                        </span>
                      )}
                    </div>

                    {!date ? (
                      <div className="py-12 px-4 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Pick an upcoming Monday on the calendar
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                          Available consultation sessions for {selectedOfficer} will appear clearly below.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Morning Sessions */}
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-2">
                            ☀️ Morning Sessions (09:00 AM – 12:30 PM)
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {morningSlots.map(slot => {
                              const booked = isSlotBooked(slot.value)
                              const isSelected = time === slot.value
                              return (
                                <button
                                  key={slot.value}
                                  type="button"
                                  disabled={booked}
                                  onClick={() => setTime(slot.value)}
                                  title={booked ? `${slot.label} is already booked` : `Select ${slot.label}`}
                                  className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-500/30 ring-2 ring-indigo-400 scale-[1.02]'
                                      : booked
                                        ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed opacity-50 border border-transparent'
                                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600'
                                  }`}
                                >
                                  <span>{slot.label}</span>
                                  {booked && <span className="text-[9px] no-underline font-normal text-rose-500 dark:text-rose-400 leading-none mt-0.5">Booked</span>}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Afternoon Sessions */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              🌤️ Afternoon Sessions (01:00 PM – 05:00 PM)
                            </span>
                            {selectedOfficer === 'Minister' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Morning Only for Minister
                              </span>
                            )}
                          </div>

                          {selectedOfficer === 'Minister' ? (
                            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                              <span className="text-base shrink-0 mt-0.5">☀️</span>
                              <div className="leading-relaxed">
                                <strong className="block text-amber-900 dark:text-amber-200 mb-0.5">
                                  Morning Session Only:
                                </strong>
                                The Hon. Minister is available for citizen public consultations exclusively during the <strong>morning session (09:00 AM – 12:30 PM)</strong>. Afternoon hours are allocated to Cabinet, parliamentary, and ministerial executive duties.
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {afternoonSlots.map(slot => {
                                const booked = isSlotBooked(slot.value)
                                const isSelected = time === slot.value
                                return (
                                  <button
                                    key={slot.value}
                                    type="button"
                                    disabled={booked}
                                    onClick={() => setTime(slot.value)}
                                    title={booked ? `${slot.label} is already booked` : `Select ${slot.label}`}
                                    className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-500/30 ring-2 ring-indigo-400 scale-[1.02]'
                                        : booked
                                          ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed opacity-50 border border-transparent'
                                          : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600'
                                    }`}
                                  >
                                    <span>{slot.label}</span>
                                    {booked && <span className="text-[9px] no-underline font-normal text-rose-500 dark:text-rose-400 leading-none mt-0.5">Booked</span>}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Slot Summary Card */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                    {date && time ? (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="text-xs">
                          <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                            Consultation Slot Confirmed
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {formatDisplayDate(date)} at {formatTime(time)} with {selectedOfficer}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <span>⚠️ Please select both a Public Day date and a time slot to proceed.</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Section 3: Citizen Profile & Contact Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                3. Citizen Profile & Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. A. Perera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>

                {/* NIC / Passport */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    NIC / Passport Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 199012345678 or 901234567V"
                    value={nic}
                    onChange={(e) => {
                      setNic(e.target.value)
                      if (nicError) setNicError('')
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      nicError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
                    } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm`}
                  />
                  {nicError && (
                    <p className="text-[11px] text-rose-500 font-medium">{nicError}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Contact Number (Sri Lankan Format) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 077 123 4567 or +94 77 123 4567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (phoneError) setPhoneError('')
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      phoneError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
                    } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm`}
                  />
                  {phoneError ? (
                    <p className="text-[11px] text-rose-500 font-medium">{phoneError}</p>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      SMS appointment updates will be sent to this number.
                    </span>
                  )}
                </div>

                {/* Email Address (Optional) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Email Address <span className="font-normal lowercase text-slate-400 dark:text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. citizen@example.com (optional)"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      emailError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
                    } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm`}
                  />
                  {emailError && (
                    <p className="text-[11px] text-rose-500 font-medium">{emailError}</p>
                  )}
                </div>
              </div>

              {/* Purpose of Visit */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Subject / Reason for Consultation *
                </label>
                <textarea
                  required
                  placeholder="Please describe the matter or public grievance you wish to present..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>
            </div>

            {/* Section 4: Regional & Address Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                4. Regional Administration Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Province Dropdown */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Province *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-between text-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <span>{province || "Select Province..."}</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showProvinceDropdown && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5">
                      {SRI_LANKA_PROVINCES.map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => {
                            setProvince(prov)
                            setDistrict('')
                            setShowProvinceDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            province === prov
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {prov} Province
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* District Dropdown */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Administrative District *
                  </label>
                  <button
                    type="button"
                    disabled={!province}
                    onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-between text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <span>{district || (province ? "Select District..." : "Select province first...")}</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDistrictDropdown && province && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5">
                      {(PROVINCES_AND_DISTRICTS[province] || []).map((dist) => (
                        <button
                          key={dist}
                          type="button"
                          onClick={() => {
                            setDistrict(dist)
                            setShowDistrictDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            district === dist
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {dist}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divisional Secretariat / Council */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Divisional Secretariat / Council *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo Municipal Council or DS Office"
                    value={council}
                    onChange={(e) => setCouncil(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>

                {/* Grama Niladhari Division */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Grama Niladhari (GN) Division
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fort GN Division (optional)"
                    value={gsDivision}
                    onChange={(e) => setGsDivision(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Permanent Address & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Residential Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. No. 45, Temple Road, Colombo"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 00100"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting Appointment Request...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Submit Official Appointment Request</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2.5">
                Appointments are subject to official ministerial calendar approval. A unique tracking reference will be generated upon submission.
              </p>
            </div>

          </form>
        </div>

      </main>

      {/* Footer */}
      {!isEmbed && (
        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>&copy; {new Date().getFullYear()} Ministry of Fisheries,Aquatic and Ocean Resources. All official appointment rights reserved.</p>
        </footer>
      )}

    </div>
  )
}
