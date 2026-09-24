import React, { useState } from 'react'
import CustomDatePicker from './CustomDatePicker'

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

const PROVINCES_AND_DISTRICTS = {
  "Western": ["Colombo", "Gampaha", "Kalutara"],
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern": ["Galle", "Matara", "Hambantota"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "Eastern": ["Ampara", "Batticaloa", "Trincomalee"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Uva": ["Badulla", "Moneragala"],
  "Sabaragamuwa": ["Kegalle", "Ratnapura"]
}

const VENUE_OPTIONS = [
  "Hon. Minister's Office & Boardroom",
  "Secretary's Conference Room",
  "Main Ministry Auditorium (3rd Floor)",
  "Executive Committee Room A",
  "Executive Committee Room B",
  "Virtual Video Conference (Zoom / Teams)"
]

export default function BookTab({ appointments, allowedDates, onAddAppointment, setActiveTab, currentUser }) {
  // Category switch: 'Official Meeting' (Default for Admin) vs 'Public Consultation'
  const [meetingCategory, setMeetingCategory] = useState('Official Meeting')

  // Common scheduling state
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newStatus, setNewStatus] = useState('Confirmed')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')

  // Official Meeting specific states
  const [meetingTitle, setMeetingTitle] = useState('')
  const [organization, setOrganization] = useState('')
  const [leadOfficial, setLeadOfficial] = useState('')
  const [designation, setDesignation] = useState('')
  const [venue, setVenue] = useState(VENUE_OPTIONS[0])
  const [customVenue, setCustomVenue] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  // Citizen Consultation specific states
  const [newName, setNewName] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newNic, setNewNic] = useState('')
  const [newDistrict, setNewDistrict] = useState('')
  const [newProvince, setNewProvince] = useState('')
  const [newCouncil, setNewCouncil] = useState('')
  const [newGsDivision, setNewGsDivision] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newPostalCode, setNewPostalCode] = useState('')

  // UI Dropdowns
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [showVenueDropdown, setShowVenueDropdown] = useState(false)

  // Validation errors
  const [formError, setFormError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [nicError, setNicError] = useState('')
  const [emailError, setEmailError] = useState('')

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

  // Check if a specific 30-minute time slot is already booked on newDate
  const isSlotBooked = (slotValue) => {
    if (!newDate) return false
    const slotMinutes = parseInputTimeToMinutes(slotValue)
    return appointments.some(appt => {
      if (appt.date !== newDate || appt.status === 'Cancelled') return false
      const apptMinutes = parseTimeToMinutes(appt.time)
      return Math.abs(apptMinutes - slotMinutes) < 30
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

  // Get available 30-minute time slots for selected date (conflict check)
  const getAvailableTimeSlots = () => {
    if (!newDate) return []

    return TIME_SLOTS.filter(slot => !isSlotBooked(slot.value))
  }

  // Helper to format time to AM/PM standard
  const formatTime = (timeStr) => {
    const [hourStr, minStr] = timeStr.split(':')
    const hour = parseInt(hourStr, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minStr} ${ampm}`
  }

  // Helper to generate a unique random Reference Number
  const generateRefNo = () => {
    const prefix = meetingCategory === 'Official Meeting' ? 'OFF-' : 'APPT-'
    return prefix + Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    setPhoneError('')
    setNicError('')
    setEmailError('')

    let hasValidationError = false

    // Date and time required for all
    if (!newDate) {
      setFormError("Please select a date on the calendar.")
      return
    }
    if (!newTime) {
      setFormError("Please select a time slot.")
      return
    }

    // Phone format check
    const cleanPhone = newPhone.replace(/[\s\-()]/g, '')
    const phoneRegex = /^(?:0|(?:\+94|0094|94))[1-9]\d{8}$/
    const intlPhoneRegex = /^\+?[0-9]{8,15}$/
    if (!phoneRegex.test(cleanPhone) && !intlPhoneRegex.test(cleanPhone)) {
      setPhoneError("Invalid format. Enter a valid contact phone number (e.g. 07X XXX XXXX or +94 7X XXX XXXX).")
      hasValidationError = true
    }

    // Optional email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (newEmail.trim() && !emailRegex.test(newEmail.trim())) {
      setEmailError("Invalid email format (e.g. official@gov.lk).")
      hasValidationError = true
    }

    // Category specific validations
    if (meetingCategory === 'Official Meeting') {
      if (!meetingTitle.trim() || !organization.trim() || !leadOfficial.trim()) {
        setFormError("Please fill in the Meeting Subject, Organization / Entity, and Lead Official Name.")
        return
      }
    } else {
      // Citizen Consultation validation
      if (!newName.trim() || !newReason.trim() || !newNic.trim() || !newDistrict.trim() ||
          !newProvince.trim() || !newCouncil.trim() || !newAddress.trim()) {
        setFormError("Please fill in all required citizen details.")
        return
      }

      const nicRegex = /^(?:\d{9}[vVxX]|\d{12}|[a-zA-Z]{1,2}\d{6,8})$/
      if (!nicRegex.test(newNic.trim())) {
        setNicError("Invalid format. Must be a valid Sri Lankan NIC (e.g. 951234567V or 199512345678) or Passport.")
        hasValidationError = true
      }
    }

    if (hasValidationError) {
      setFormError("Please correct the validation errors before submitting.")
      return
    }

    // Minister morning session only check for Public Consultations
    if ((currentUser?.role || 'Secretary') === 'Minister' && meetingCategory === 'Public Consultation') {
      const [h] = newTime.split(':').map(Number)
      if (h >= 13) {
        setFormError("The Hon. Minister is available for citizen public consultations during the morning session only (09:00 AM – 12:30 PM).")
        return
      }
    }

    // Conflict check (30 min buffer)
    const newTimeMinutes = parseInputTimeToMinutes(newTime)
    const timeConflict = appointments.some(appt => {
      if (appt.date !== newDate || appt.status === 'Cancelled') return false
      const apptMinutes = parseTimeToMinutes(appt.time)
      const diff = Math.abs(apptMinutes - newTimeMinutes)
      return diff < 30
    })

    if (timeConflict) {
      setFormError("Scheduling Conflict: Another appointment or meeting is already scheduled at or within 30 minutes of this slot on the same day.")
      return
    }

    const refNo = generateRefNo()
    const selectedVenue = venue === "Other Custom Venue" ? (customVenue.trim() || "Ministry Headquarters") : venue

    const newAppt = {
      id: Date.now(),
      meetingType: meetingCategory,
      name: meetingCategory === 'Official Meeting'
        ? (designation.trim() ? `${leadOfficial.trim()} (${designation.trim()})` : leadOfficial.trim())
        : newName.trim(),
      leadOfficial: meetingCategory === 'Official Meeting' ? leadOfficial.trim() : undefined,
      designation: meetingCategory === 'Official Meeting' ? designation.trim() : undefined,
      meetingTitle: meetingCategory === 'Official Meeting' ? meetingTitle.trim() : undefined,
      organization: meetingCategory === 'Official Meeting' ? organization.trim() : '',
      venue: meetingCategory === 'Official Meeting' ? selectedVenue : 'Ministry Premises',
      reason: meetingCategory === 'Official Meeting' ? meetingTitle.trim() : newReason.trim(),
      meetingNotes: meetingCategory === 'Official Meeting' && meetingNotes.trim() ? meetingNotes.trim() : undefined,
      phone: newPhone.trim(),
      email: newEmail.trim(),
      date: newDate,
      time: formatTime(newTime),
      status: newStatus,
      refNo: refNo,
      nic: meetingCategory === 'Official Meeting' ? 'OFFICIAL' : newNic.trim(),
      district: meetingCategory === 'Official Meeting' ? 'N/A' : newDistrict.trim(),
      province: meetingCategory === 'Official Meeting' ? 'N/A' : newProvince.trim(),
      council: meetingCategory === 'Official Meeting' ? (organization.trim() || 'Ministry Office') : newCouncil.trim(),
      gsDivision: meetingCategory === 'Official Meeting' ? '' : newGsDivision.trim(),
      address: meetingCategory === 'Official Meeting' ? selectedVenue : newAddress.trim(),
      postalCode: meetingCategory === 'Official Meeting' ? '00100' : newPostalCode.trim(),
      officer: currentUser?.role || 'Secretary',
      completionRemark: meetingCategory === 'Official Meeting' && meetingNotes.trim() ? meetingNotes.trim() : undefined
    }

    onAddAppointment(newAppt)

    // Reset form states
    setMeetingTitle('')
    setOrganization('')
    setLeadOfficial('')
    setDesignation('')
    setMeetingNotes('')
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
    setNewStatus('Confirmed')
    setFormError('')
    setPhoneError('')
    setNicError('')
    setEmailError('')
    setShowDatePicker(false)
    setShowProvinceDropdown(false)
    setShowDistrictDropdown(false)
    setShowTimeDropdown(false)
    setShowVenueDropdown(false)

    // Switch to appointments listing tab
    setActiveTab('appointments')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Schedule New Appointment / Meeting</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Admins can schedule official meetings on any date or record public citizen consultations.
          </p>
        </div>

        {/* Ministerial Officer Indicator */}
        <div className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 w-fit">
          Office: {currentUser?.role || 'Secretary'}
        </div>
      </div>

      {/* Main Booking Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-visible">

        {/* Top Category Selector Tabs */}
        <div className="p-4 sm:p-6 pb-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 rounded-t-3xl">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Select Appointment Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl pb-5">
            {/* Option 1: Official Meeting */}
            <button
              type="button"
              onClick={() => {
                setMeetingCategory('Official Meeting')
                setNewStatus('Confirmed')
                setFormError('')
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                meetingCategory === 'Official Meeting'
                  ? 'border-indigo-600 bg-white dark:bg-slate-900 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-950/40'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                meetingCategory === 'Official Meeting'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">Official Meeting</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Any Day
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Inter-Ministry, delegations, policy & VIP reviews
                </p>
              </div>
            </button>

            {/* Option 2: Citizen Consultation */}
            <button
              type="button"
              onClick={() => {
                setMeetingCategory('Public Consultation')
                setNewStatus('Pending')
                setFormError('')
                if ((currentUser?.role || 'Secretary') === 'Minister' && newTime) {
                  const [h] = newTime.split(':').map(Number)
                  if (h >= 13) {
                    setNewTime('')
                  }
                }
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                meetingCategory === 'Public Consultation'
                  ? 'border-indigo-600 bg-white dark:bg-slate-900 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-950/40'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                meetingCategory === 'Public Consultation'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">Public Consultation</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Citizen
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Walk-in citizen case or direct public grievance
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

          {/* Banner explaining flexibility for admin */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              {meetingCategory === 'Official Meeting' ? (
                <span>
                  <strong>Administrative Schedule Privilege:</strong> Official meetings can be assigned to <strong>any calendar date</strong> (not limited to public consultation days). Citizen NIC and regional demographic fields are not required for official delegations.
                </span>
              ) : (
                <span>
                  <strong>Manual Citizen Registration:</strong> Administrators can register citizen appointments on public consultation days (Mondays) or assign special dispensation dates as needed.
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Meeting / Client Details */}
          {meetingCategory === 'Official Meeting' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>1. Official Meeting & Delegation Details</span>
                <span className="text-[10px] text-slate-400 normal-case font-normal">Internal & Inter-Departmental Sessions</span>
              </h3>

              {/* Agenda / Subject */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Meeting Subject / Agenda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilateral Discussions on Deep-Sea Fisheries Policy with Treasury"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm font-medium"
                />
              </div>

              {/* Organization & Lead Official */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Organization / Ministry / Entity *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ministry of Finance / Dept. of Coast Conservation"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Lead Official / Representative *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. M. Wickramasinghe"
                    value={leadOfficial}
                    onChange={(e) => setLeadOfficial(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Designation & Venue */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Official Designation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Additional Director General / Lead Consultant"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Meeting Venue / Location *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVenueDropdown(!showVenueDropdown)}
                      className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-between text-sm cursor-pointer"
                    >
                      <span className="truncate">{venue}</span>
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showVenueDropdown && (
                      <div className="absolute left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 space-y-1">
                        {VENUE_OPTIONS.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setVenue(v)
                              setShowVenueDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                              venue === v ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Phone & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Official Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 011 243 5678 or 077 123 4567"
                    value={newPhone}
                    onChange={(e) => {
                      setNewPhone(e.target.value)
                      if (phoneError) setPhoneError('')
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      phoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm`}
                  />
                  {phoneError && <p className="text-[11px] text-rose-500">{phoneError}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Official Email <span className="lowercase font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. delegate@ministry.gov.lk"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  />
                  {emailError && <p className="text-[11px] text-rose-500">{emailError}</p>}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Agenda Briefing / Meeting Notes <span className="lowercase font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Reference circulars, delegation attendee list, or discussion points..."
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm resize-none"
                />
              </div>
            </div>
          ) : (
            /* Citizen Profile & Regional Address */
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  1. Citizen Identification Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Citizen Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      National Identity Card (NIC) / Passport *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 199512345678 or 951234567V"
                      value={newNic}
                      onChange={(e) => {
                        setNewNic(e.target.value)
                        if (nicError) setNicError('')
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        nicError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm`}
                    />
                    {nicError && <p className="text-[11px] text-rose-500">{nicError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 077 123 4567"
                      value={newPhone}
                      onChange={(e) => {
                        setNewPhone(e.target.value)
                        if (phoneError) setPhoneError('')
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        phoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm`}
                    />
                    {phoneError && <p className="text-[11px] text-rose-500">{phoneError}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Email Address <span className="lowercase font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. citizen@example.com"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value)
                        if (emailError) setEmailError('')
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                    {emailError && <p className="text-[11px] text-rose-500">{emailError}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Reason for Consultation / Matter *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Briefly state the grievance, inquiry, or appeal"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  />
                </div>
              </div>

              {/* Regional Address Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  2. Regional Location & Address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Province *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProvinceDropdown(!showProvinceDropdown)
                          setShowDistrictDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm flex justify-between items-center"
                      >
                        <span className="truncate">{newProvince || "Select Province"}</span>
                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showProvinceDropdown && (
                        <div className="absolute left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-60 overflow-y-auto space-y-1">
                          {Object.keys(PROVINCES_AND_DISTRICTS).map((prov) => (
                            <button
                              key={prov}
                              type="button"
                              onClick={() => {
                                setNewProvince(prov)
                                setNewDistrict('')
                                setShowProvinceDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                newProvince === prov ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {prov}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      District *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={!newProvince}
                        onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
                        className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm flex justify-between items-center disabled:opacity-50"
                      >
                        <span className="truncate">{newDistrict || "Select District"}</span>
                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showDistrictDropdown && newProvince && (
                        <div className="absolute left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-60 overflow-y-auto space-y-1">
                          {PROVINCES_AND_DISTRICTS[newProvince]?.map((dist) => (
                            <button
                              key={dist}
                              type="button"
                              onClick={() => {
                                setNewDistrict(dist)
                                setShowDistrictDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                newDistrict === dist ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {dist}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Local Council / Pradeshiya Sabha *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Colombo MC"
                      value={newCouncil}
                      onChange={(e) => setNewCouncil(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      GS Division
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fort (Optional)"
                      value={newGsDivision}
                      onChange={(e) => setNewGsDivision(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Permanent Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Residential address details"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 00100"
                      value={newPostalCode}
                      onChange={(e) => setNewPostalCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Schedule Date, Time & Initial Status */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <span>3. Schedule Date & Time Slot</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {meetingCategory === 'Official Meeting' ? 'Any Working Day' : 'Mondays (Public Day)'}
                </span>
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {newDate ? `Selected Date: ${newDate}` : 'Please pick a date on the calendar'}
              </span>
            </div>

            {/* 2-Column Responsive Layout for Calendar & Time Slots */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800/70">

              {/* Left Column: Interactive Calendar (lg:col-span-6) */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">1</span>
                    Select Meeting Date *
                  </span>
                  {newDate && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {formatDisplayDate(newDate)}
                    </span>
                  )}
                </div>
                <CustomDatePicker
                  allowedDates={allowedDates}
                  value={newDate}
                  allowAnyDate={true}
                  allowToday={true}
                  onChange={(date) => {
                    setNewDate(date)
                    setNewTime('')
                  }}
                />
              </div>

              {/* Right Column: Time Slots & Initial Status (lg:col-span-6) */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex-1">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">2</span>
                      Select Time Slot (30m Interval) *
                    </span>
                    {newTime && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                        {formatTime(newTime)}
                      </span>
                    )}
                  </div>

                  {!newDate ? (
                    <div className="py-12 px-4 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Pick a date on the calendar to view slots
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                        All open morning and afternoon sessions will appear clearly below.
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
                            const isSelected = newTime === slot.value
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={booked}
                                onClick={() => setNewTime(slot.value)}
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
                          {meetingCategory === 'Public Consultation' && (currentUser?.role || 'Secretary') === 'Minister' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Morning Only for Minister
                            </span>
                          )}
                        </div>

                        {meetingCategory === 'Public Consultation' && (currentUser?.role || 'Secretary') === 'Minister' ? (
                          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                            <span className="text-base shrink-0 mt-0.5">☀️</span>
                            <div className="leading-relaxed">
                              <strong className="block text-amber-900 dark:text-amber-200 mb-0.5">
                                Morning Session Only:
                              </strong>
                              The Hon. Minister conducts public grievance sessions during the <strong>morning session only (09:00 AM – 12:30 PM)</strong>. To schedule afternoon meetings, switch the category above to <strong>Official Meeting</strong>.
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {afternoonSlots.map(slot => {
                              const booked = isSlotBooked(slot.value)
                              const isSelected = newTime === slot.value
                              return (
                                <button
                                  key={slot.value}
                                  type="button"
                                  disabled={booked}
                                  onClick={() => setNewTime(slot.value)}
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

                {/* Selected Slot Summary & Initial Status */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
                  {newDate && newTime ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                          Selected Slot Confirmed
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {formatDisplayDate(newDate)} at {formatTime(newTime)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <span>⚠️ Please select both a date and a time slot to continue.</span>
                    </div>
                  )}

                  {/* Initial Status Selector */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Initial Status *
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewStatus('Confirmed')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          newStatus === 'Confirmed'
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                            : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Confirmed
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewStatus('Pending')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          newStatus === 'Pending'
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                            : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                        Pending
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in shake">
              ⚠️ {formError}
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Session will be assigned to: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.role || 'Secretary'}</strong>
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{meetingCategory === 'Official Meeting' ? 'Schedule Official Meeting' : 'Register Citizen Appointment'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
