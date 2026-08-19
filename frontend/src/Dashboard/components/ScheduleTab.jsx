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
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Booking Schedule Setup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure which specific dates are open for client scheduling slots.</p>
      </div>

      {/* Main Settings Card */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-extrabold tracking-tight">Enable Booking Dates</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select a date to open scheduling slots. Clients will only be allowed to book appointments on dates enabled here.
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
            Enable Date
          </button>
        </form>

        {/* Active Allowed Dates List */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Active Scheduling Dates ({allowedDates.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {allowedDates.length > 0 ? (
              allowedDates.map(date => (
                <span
                  key={date}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-sm font-bold text-indigo-600 dark:text-indigo-400 animate-in zoom-in-95 duration-150"
                >
                  <span>{date}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveDate(date)}
                    className="hover:text-rose-600 dark:hover:text-rose-455 transition-colors font-bold cursor-pointer text-sm leading-none"
                    title={`Remove ${date}`}
                  >
                    &times;
                  </button>
                </span>
              ))
            ) : (
              <span className="text-sm text-rose-500 font-medium">
                ⚠️ No dates currently active. Users will not be able to schedule appointments.
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
