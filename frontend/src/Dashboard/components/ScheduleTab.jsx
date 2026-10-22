import React, { useState } from 'react'

const COMMON_REASONS = [
  "Cabinet Meeting",
  "Parliament Duty / Sitting",
  "Official Overseas Delegation / Mission",
  "Provincial Field Inspection",
  "Public Holiday / Office Closed",
  "Special Ministerial Duty",
  "Medical / Sick Leave",
  "Custom..."
]

export default function ScheduleTab({
  allowedDates = [],
  unavailableDates = [],
  unavailableDatesByRole = {},
  allowedDatesByRole = {},
  onAddDate,
  onRemoveDate,
  onMakeUnavailable,
  onRestoreAvailability,
  currentUser,
  appointments = []
}) {
  // Each administrator is strictly responsible for their own assigned ministerial role only
  const role = currentUser?.role || 'Secretary'

  // Input states for enabling special date
  const [tempDateInput, setTempDateInput] = useState('')

  // Input states for making a date unavailable
  const [unavailDateInput, setUnavailDateInput] = useState('')
  const [reasonPreset, setReasonPreset] = useState(COMMON_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [isSubmittingUnavail, setIsSubmittingUnavail] = useState(false)

  // Current active allowed dates and unavailable dates for this particular officer only
  const roleAllowedDates = allowedDatesByRole[role] || allowedDates || []
  const roleUnavailableDates = unavailableDatesByRole[role] || unavailableDates || []

  // Check how many appointments are on the selected unavailDateInput for this officer
  const affectedAppointments = appointments.filter(a =>
    a.officer === role &&
    a.date === unavailDateInput &&
    (a.status === 'Pending' || a.status === 'Confirmed')
  )

  // Get next upcoming Mondays from allowed dates for quick chips
  const upcomingMondays = roleAllowedDates.filter(d => {
    try {
      return new Date(d + 'T00:00:00').getDay() === 1
    } catch {
      return false
    }
  }).slice(0, 4)

  const handleEnableDate = (e) => {
    e.preventDefault()
    if (!tempDateInput) return

    // Ensure date is at least 24 hours in the future
    const now = new Date()
    const selectedDateTime = new Date(`${tempDateInput}T23:59:59`)
    if (selectedDateTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      alert("Invalid Date: You can only enable dates that are at least 24 hours in the future.")
      return
    }

    if (roleAllowedDates.includes(tempDateInput)) {
      alert("This date is already enabled for your office.")
      return
    }

    if (onAddDate) {
      onAddDate(tempDateInput, role)
    }
    setTempDateInput('')
  }

  const handleMarkUnavailableSubmit = async (e) => {
    e.preventDefault()
    if (!unavailDateInput) return

    const effectiveReason = reasonPreset === "Custom..."
      ? (customReason.trim() || "Officer unavailable")
      : reasonPreset

    if (affectedAppointments.length > 0) {
      const confirmed = window.confirm(
        `Notice: There are ${affectedAppointments.length} existing active appointment(s) booked on ${unavailDateInput}.\n\nMarking this day as unavailable will prevent new bookings on the citizen portal. Are you sure you want to proceed?`
      )
      if (!confirmed) return
    }

    setIsSubmittingUnavail(true)
    try {
      if (onMakeUnavailable) {
        await onMakeUnavailable(role, unavailDateInput, effectiveReason)
      }
      setUnavailDateInput('')
      setCustomReason('')
    } finally {
      setIsSubmittingUnavail(false)
    }
  }

  const handleQuickMakeUnavailable = (date) => {
    setUnavailDateInput(date)
    // Scroll smoothly to unavailability section if needed
    const elem = document.getElementById('unavailability-form-section')
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const formatDisplayDate = (dStr) => {
    if (!dStr) return ''
    try {
      const d = new Date(dStr + 'T00:00:00')
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dStr
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Assigned Officer Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Public Consultation Schedule & Availability</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage official Public Days (Mondays), mark officer unavailability, and set special consultation dates for your office.
          </p>
        </div>

        {/* Dedicated Officer Scope Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 self-start md:self-auto shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              Assigned Ministerial Scope
            </div>
            <div className="text-xs font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5 mt-0.5">
              <span>🏛️</span>
              <span>{role}</span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                Your Office
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Public Days
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {roleAllowedDates.length}
            </div>
          </div>
          <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Unavailable Days (Blocked)
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {roleUnavailableDates.length}
            </div>
          </div>
          <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Default Schedule Policy
            </div>
            <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              Every Monday
            </div>
            <div className="text-[10px] text-slate-400">
              {role === 'Minister' ? '09:00 AM – 12:30 PM (Morning)' : '09:00 AM – 05:00 PM (Full Day)'}
            </div>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* SECTION 1: Make Officer Unavailable on a Default Public Day */}
      <section
        id="unavailability-form-section"
        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/50 shadow-sm space-y-5"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Mark {role} Unavailable for Public Days
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In case the {role} is unable to attend their default Public Day (e.g. due to Cabinet, Parliament, or foreign mission), mark the date unavailable to close citizen bookings for that day.
            </p>
          </div>
        </div>

        {/* Quick select chips for upcoming Mondays */}
        {upcomingMondays.length > 0 && (
          <div className="space-y-1.5 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Quick Pick Upcoming Default Public Days (Mondays):
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {upcomingMondays.map(mDate => (
                <button
                  key={mDate}
                  type="button"
                  onClick={() => setUnavailDateInput(mDate)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    unavailDateInput === mDate
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                  }`}
                >
                  <span>🗓️</span>
                  <span>{formatDisplayDate(mDate)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unavailability Form */}
        <form onSubmit={handleMarkUnavailableSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Date Input */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Date to Mark Unavailable *
              </label>
              <input
                type="date"
                value={unavailDateInput}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={(e) => setUnavailDateInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400 transition-all text-sm"
              />
            </div>

            {/* Reason Preset Dropdown */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Reason for Unavailability
              </label>
              <select
                value={reasonPreset}
                onChange={(e) => setReasonPreset(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400 transition-all text-sm"
              >
                {COMMON_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Custom Reason (if 'Custom...' selected) or Action Button */}
            <div className="md:col-span-4 flex flex-col justify-end">
              {reasonPreset === 'Custom...' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Specify Reason
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="e.g. Budget Debate in Parliament"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400 transition-all text-sm"
                  />
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmittingUnavail || !unavailDateInput}
                  className="w-full py-2.5 px-5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 transition-all cursor-pointer shadow-sm shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>🚫</span>
                  <span>{isSubmittingUnavail ? "Saving..." : `Mark ${role} Unavailable`}</span>
                </button>
              )}
            </div>
          </div>

          {/* If Custom reason is shown, place the submit button below */}
          {reasonPreset === 'Custom...' && (
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmittingUnavail || !unavailDateInput}
                className="py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 transition-all cursor-pointer shadow-sm shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🚫</span>
                <span>{isSubmittingUnavail ? "Saving..." : `Mark ${role} Unavailable`}</span>
              </button>
            </div>
          )}

          {/* Warning if appointments already exist on selected date */}
          {affectedAppointments.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <span className="text-base">⚠️</span>
              <div>
                <strong>Notice:</strong> {affectedAppointments.length} existing appointment(s) already booked for {role} on {unavailDateInput}.
                Marking this day unavailable will prevent new bookings on the public portal. Existing booked appointments can be rescheduled or managed in the Appointments tab.
              </div>
            </div>
          )}
        </form>

        {/* SECTION 2: List of Currently Unavailable Days */}
        <div className="pt-4 border-t border-rose-100 dark:border-rose-950/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <span>🚫 Cancelled / Blocked Public Days for {role} ({roleUnavailableDates.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Citizens cannot book appointments on these dates
            </span>
          </div>

          {roleUnavailableDates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {roleUnavailableDates.map((item) => {
                const dateStr = typeof item === 'string' ? item : item.date
                const reasonStr = typeof item === 'object' ? item.reason : "Officer unavailable"
                return (
                  <div
                    key={dateStr}
                    className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-900 dark:text-rose-200">
                          {formatDisplayDate(dateStr)}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300">
                          Unavailable
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-1 line-clamp-2">
                        {reasonStr || "Officer unavailable"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestoreAvailability && onRestoreAvailability(role, dateStr)}
                      className="w-full mt-1 py-1.5 px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      title="Re-enable this Public Day for bookings"
                    >
                      <span>✓</span>
                      <span>Restore Availability</span>
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 text-center">
              All official Public Days (Mondays) are currently active and open for citizen bookings for {role}.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: Add Special Public Consultation Date (Non-Monday) */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              Add Special Public Consultation Date for {role}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Want to open an extra day for citizen grievance hearings (e.g. special Wednesday or Friday)? Select the date below.
            </p>
          </div>
        </div>

        <form onSubmit={handleEnableDate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="date"
            value={tempDateInput}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            onChange={(e) => setTempDateInput(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all cursor-pointer shadow-sm shadow-indigo-500/10 shrink-0"
          >
            Enable Special Public Day
          </button>
        </form>
      </section>

      {/* SECTION 4: Active Public Consultation Dates List */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              Active Public Consultation Dates for {role} ({roleAllowedDates.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Citizen bookings are currently permitted on the following dates. Click on any Monday to make it unavailable.
            </p>
          </div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60 hidden sm:inline-block">
            Mondays active by default
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {roleAllowedDates.length > 0 ? (
            roleAllowedDates.map(date => {
              const isMonday = new Date(date + 'T00:00:00').getDay() === 1
              return (
                <span
                  key={date}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isMonday
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900 text-purple-700 dark:text-purple-300'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  <span>{date}</span>
                  <span className="text-[9px] font-normal uppercase opacity-75">
                    {isMonday ? '(Mon Public Day)' : '(Special Day)'}
                  </span>
                  {isMonday ? (
                    <button
                      type="button"
                      onClick={() => handleQuickMakeUnavailable(date)}
                      className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-bold cursor-pointer text-xs ml-1 px-1.5 py-0.5 rounded bg-purple-100/60 dark:bg-purple-900/40 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                      title={`Mark ${date} unavailable for ${role}`}
                    >
                      Make Unavailable
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRemoveDate && onRemoveDate(date, role)}
                      className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-bold cursor-pointer text-sm leading-none ml-1"
                      title={`Remove special date ${date}`}
                    >
                      &times;
                    </button>
                  )}
                </span>
              )
            })
          ) : (
            <span className="text-sm text-slate-400 font-medium">
              No active public dates registered for {role}.
            </span>
          )}
        </div>
      </section>
    </div>
  )
}
