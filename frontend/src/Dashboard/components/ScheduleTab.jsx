import React, { useState } from 'react'

export default function ScheduleTab({ allowedDates, onAddDate, onRemoveDate }) {
  const [tempDateInput, setTempDateInput] = useState('')

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

    if (allowedDates.includes(tempDateInput)) {
      alert("This date is already enabled.")
      return
    }

    onAddDate(tempDateInput)
    setTempDateInput('')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Public Consultation Schedule Setup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage official Public Days (Mondays) and special public consultation dates for citizen bookings.
        </p>
      </div>

      {/* Public Day Guidelines Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Citizen Public Day Policy */}
        <div className="p-5 rounded-3xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/60 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200">
              Official Citizen Public Day (Every Monday)
            </h4>
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-300/80 leading-relaxed">
            By ministerial guideline, <strong>Every Monday</strong> is designated as Public Day (මහජන දිනය / பொதுமக்கள் தினம்) for the Hon. Minister and Secretary. Upcoming Mondays are automatically active on the public booking portal.
          </p>
          <div className="pt-1 text-[11px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5">
            <span>☀️</span>
            <span>Hon. Minister: <strong>Morning Session Only</strong> (09:00 AM – 12:30 PM) | Secretary: Full Day</span>
          </div>
        </div>

        {/* Card 2: Official Non-Public Meetings */}
        <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
              Official Meetings (Any Working Day)
            </h4>
          </div>
          <p className="text-xs text-indigo-800 dark:text-indigo-300/80 leading-relaxed">
            Internal sessions, inter-ministry delegations, and executive meetings are <strong>not restricted to Public Days</strong>. Administrators can schedule them on any calendar date in the <em>Book Appointment</em> tab.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-sm font-extrabold tracking-tight">Add Special Public Consultation Date</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Want to open an extra day for citizen grievance hearings (e.g. special Wednesday or Friday public day)? Select the date below to enable public citizen bookings on that day.
        </p>

        {/* Date Form Input */}
        <form onSubmit={handleEnableDate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
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

        {/* Active Allowed Dates List */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Public Consultation Dates ({allowedDates.length})
            </label>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
              Mondays are automatically included
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowedDates.length > 0 ? (
              allowedDates.map(date => {
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
                    <button
                      type="button"
                      onClick={() => onRemoveDate(date)}
                      className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-bold cursor-pointer text-sm leading-none ml-1"
                      title={`Remove ${date}`}
                    >
                      &times;
                    </button>
                  </span>
                )
              })
            ) : (
              <span className="text-sm text-slate-400 font-medium">
                Mondays are active by default. No additional special dates registered.
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
