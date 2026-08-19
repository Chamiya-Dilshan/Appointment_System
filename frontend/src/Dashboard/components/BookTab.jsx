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

    if (!newName.trim() || !newPhone.trim() || !newEmail.trim() || !newReason.trim() || !newDate || !newTime ||
      !newNic.trim() || !newDistrict.trim() || !newProvince.trim() || !newCouncil.trim() ||
      !newGsDivision.trim() || !newAddress.trim()) {
      alert("Please fill in all required fields.")
      return
    }

    // Ensure selected date is within the set of allowed booking dates
    if (!allowedDates.includes(newDate)) {
      alert("Invalid Booking: The selected date is not available for booking.")
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
    setShowDatePicker(false)

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
                  NIC (National Identity Card) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 199512345678 or 951234567V"
                  value={newNic}
                  onChange={(e) => setNewNic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+94 7X XXX XXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
                />
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
              <div className="space-y-1 ">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Province *
                </label>
                <div className="relative">
                  <select
                    required
                    value={newProvince}
                    onChange={(e) => {
                      setNewProvince(e.target.value)
                      setNewDistrict('')
                    }}
                    className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer"
                  >
                    <option value="">Select Province</option>
                    {Object.keys(PROVINCES_AND_DISTRICTS).map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  District *
                </label>
                <div className="relative">
                  <select
                    required
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    disabled={!newProvince}
                    className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!newProvince ? "Select Province First" : "Select District"}
                    </option>
                    {newProvince &&
                      PROVINCES_AND_DISTRICTS[newProvince].map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
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
                  <select
                    required
                    value={newTime}
                    disabled={!newDate}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
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

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-200 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
