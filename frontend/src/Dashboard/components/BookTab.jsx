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

export default function BookTab({ appointments, allowedDates, onAddAppointment, setActiveTab, currentUser }) {
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
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [formError, setFormError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [nicError, setNicError] = useState('')

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

      return true
    })
  }

  // Helper to format time to AM/PM standard
  const formatTime = (timeStr) => {
    const [hourStr, minStr] = timeStr.split(':')
    const hour = parseInt(hourStr)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minStr} ${ampm}`
  }

  // Helper to generate a unique random booking Reference Number
  const generateRefNo = () => {
    return 'APPT-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    setPhoneError('')
    setNicError('')

    if (!newName.trim() || !newPhone.trim() || !newEmail.trim() || !newReason.trim() || !newDate || !newTime ||
      !newNic.trim() || !newDistrict.trim() || !newProvince.trim() || !newCouncil.trim() ||
      !newGsDivision.trim() || !newAddress.trim()) {
      setFormError("Please fill in all required fields.")
      return
    }

    // Validate NIC / Passport and Phone formats simultaneously to display all errors at once
    let hasValidationError = false

    const nicRegex = /^(?:\d{9}[vVxX]|\d{12}|[a-zA-Z]{1,2}\d{6,8})$/
    if (!nicRegex.test(newNic.trim())) {
      setNicError("Invalid format. Must be a valid Sri Lankan NIC (e.g. 951234567V or 199512345678) or Passport (e.g. N1234567).")
      hasValidationError = true
    }

    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
    if (!phoneRegex.test(newPhone.trim())) {
      setPhoneError("Invalid format.")
      hasValidationError = true
    }

    if (hasValidationError) {
      setFormError("Please correct the validation errors in the form before submitting.")
      return
    }

    // Ensure selected date is within the set of allowed booking dates
    if (!allowedDates.includes(newDate)) {
      setFormError("Invalid Booking: The selected date is not available for booking.")
      return
    }

    // Double booking & 30 minutes gap check
    const newTimeMinutes = parseInputTimeToMinutes(newTime)
    const timeConflict = appointments.some(appt => {
      if (appt.date !== newDate || appt.status === 'Cancelled') return false
      const apptMinutes = parseTimeToMinutes(appt.time)
      const diff = Math.abs(apptMinutes - newTimeMinutes)
      return diff < 30
    })

    if (timeConflict) {
      setFormError("Scheduling Conflict: Another appointment is already booked at or within 30 minutes of this slot on the same day.")
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
      postalCode: newPostalCode,
      officer: currentUser?.role || 'Secretary'
    }

    onAddAppointment(newAppt)

    // Reset form states
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
    setFormError('')
    setPhoneError('')
    setNicError('')
    setShowDatePicker(false)
    setShowProvinceDropdown(false)
    setShowDistrictDropdown(false)
    setShowTimeDropdown(false)

    // Switch to appointments listing tab
    setActiveTab('appointments')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Book Appointment</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Fill in the form below to register a new scheduling slot.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

          {/* Section 1: Client Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Client Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter client's full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  NIC / Passport Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 951234567V or N1234567"
                  value={newNic}
                  onChange={(e) => {
                    setNewNic(e.target.value)
                    if (nicError) {
                      const nicRegex = /^(?:\d{9}[vVxX]|\d{12}|[a-zA-Z]{1,2}\d{6,8})$/
                      if (nicRegex.test(e.target.value.trim()) || e.target.value.trim() === '') {
                        setNicError('')
                      }
                    }
                  }}
                  pattern="^(?:\d{9}[vVxX]|\d{12}|[a-zA-Z]{1,2}\d{6,8})$"
                  title="Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits) or Passport (1-2 letters + 6-8 digits)"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm ${
                    nicError
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400'
                  }`}
                />
                {nicError && (
                  <p className="text-[11px] text-red-550 dark:text-red-400 font-bold animate-in fade-in duration-200 mt-1">
                    {nicError}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +94 7X XXX XXXX or any format"
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value)
                    if (phoneError) {
                      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
                      if (phoneRegex.test(e.target.value.trim()) || e.target.value.trim() === '') {
                        setPhoneError('')
                      }
                    }
                  }}
                  pattern="^\+?[0-9\s\-()]{7,20}$"
                  title="Please enter a valid phone number)"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm ${
                    phoneError
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400'
                  }`}
                />
                {phoneError && (
                  <p className="text-[11px] text-red-550 dark:text-red-400 font-bold animate-in fade-in duration-200 mt-1">
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Reason for Visit *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dental cleaning / General checkup / Therapy session"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
              />
            </div>
          </div>

          {/* Section 2: Regional Details & Address */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              2. Regional & Address Details
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
                      setShowTimeDropdown(false)
                      setShowDatePicker(false)
                    }}
                    className="w-full text-left px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer font-semibold flex justify-between items-center"
                  >
                    <span className="truncate">{newProvince || "Select Province"}</span>
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProvinceDropdown && (
                    <div className="absolute left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-60 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
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
                            newProvince === prov
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                              : 'text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
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
                    onClick={() => {
                      setShowDistrictDropdown(!showDistrictDropdown)
                      setShowProvinceDropdown(false)
                      setShowTimeDropdown(false)
                      setShowDatePicker(false)
                    }}
                    className="w-full text-left px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer font-semibold flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {!newProvince ? "Select Province First" : newDistrict || "Select District"}
                    </span>
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {newProvince && showDistrictDropdown && (
                    <div className="absolute left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-60 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {PROVINCES_AND_DISTRICTS[newProvince].map((dist) => (
                        <button
                          key={dist}
                          type="button"
                          onClick={() => {
                            setNewDistrict(dist)
                            setShowDistrictDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            newDistrict === dist
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                              : 'text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
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
                  Local Council *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Municipal Council"
                  value={newCouncil}
                  onChange={(e) => setNewCouncil(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  GS Division *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Colombo Fort"
                  value={newGsDivision}
                  onChange={(e) => setNewGsDivision(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full street address details"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
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
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schedule Slot */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              3. Booking Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Date selection with floating custom Calendar Picker */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Date *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    required
                    placeholder="Click to select allowed booking date"
                    value={newDate}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {showDatePicker && (
                  <div className="mt-3 bg-slate-50 dark:bg-slate-950/30 p-4 border border-slate-150 dark:border-slate-800 rounded-2xl w-fit mx-auto sm:mx-0 animate-in fade-in slide-in-from-top-1 duration-150">
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
                  Available Time Slot *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={!newDate}
                    onClick={() => {
                      setShowTimeDropdown(!showTimeDropdown)
                      setShowProvinceDropdown(false)
                      setShowDistrictDropdown(false)
                      setShowDatePicker(false)
                    }}
                    className="w-full text-left px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer font-semibold flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {!newDate
                        ? "Please select a date first"
                        : newTime
                          ? formatTime(newTime)
                          : "Choose a time slot"
                      }
                    </span>
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {newDate && showTimeDropdown && (
                    <div className="absolute left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-60 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {getAvailableTimeSlots().length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                          No time slots available for this date
                        </div>
                      ) : (
                        getAvailableTimeSlots().map(slot => (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => {
                              setNewTime(slot.value)
                              setShowTimeDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              newTime === slot.value
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                                : 'text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment With (Read-only Confirmation) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Appointment With
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={currentUser?.name || 'Secretary to the Ministry'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed select-none"
                />
              </div>

            </div>

            {/* Initial Status */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Initial Booking Status
              </label>
              <div className="flex gap-6 mt-1">
                {['Pending', 'Confirmed'].map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="newStatus"
                      value={status}
                      checked={newStatus === status}
                      onChange={() => setNewStatus(status)}
                      className="text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* General Form Error Alert */}
          {formError && (
            <div className="p-4 rounded-2xl bg-red-550/10 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <svg className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all ml-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white transition-colors cursor-pointer shadow-sm shadow-indigo-500/10"
            >
              Submit Booking
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
