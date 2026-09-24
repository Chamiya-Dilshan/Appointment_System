import { useState, useEffect } from 'react'

/**
 * Custom Interactive Calendar DatePicker
 * Supports both Citizen Mode (Public Days only, default Mondays)
 * and Admin Mode (Unrestricted date selection for official meetings on any day).
 */
export default function CustomDatePicker({
  allowedDates = [],
  value,
  onChange,
  allowAnyDate = false,
  allowToday = false,
  className = ""
}) {
  const minDateStr = (() => {
    const d = new Date()
    if (!allowToday) {
      d.setDate(d.getDate() + 1)
    }
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parsed = new Date(value + 'T00:00:00')
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  })

  // Synchronise calendar view whenever an external value is updated
  useEffect(() => {
    if (value) {
      const parsed = new Date(value + 'T00:00:00')
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed)
      }
    }
  }, [value])

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

  const handleTodayJump = () => {
    setCurrentDate(new Date())
  }

  const days = []
  // Fill empty slots for previous month padding days
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8 sm:w-10 sm:h-10" />)
  }

  // Fill actual calendar days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    // Monday is day index 1 (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    const isMonday = dayDate.getDay() === 1
    const isPublicDay = isMonday || allowedDates.includes(dateStr)
    const isPast = dateStr < minDateStr

    // If allowAnyDate (Admin), any future date is selectable.
    // If not allowAnyDate (Citizen), only Public Days (Mondays) in future are selectable.
    const isSelectable = !isPast && (allowAnyDate || isPublicDay)
    const isSelected = value === dateStr

    let btnStyle = ""
    if (isSelected) {
      btnStyle = "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/40 ring-2 ring-indigo-400 scale-105 z-10"
    } else if (isSelectable) {
      if (isPublicDay) {
        btnStyle = "bg-purple-100/80 text-purple-800 dark:bg-purple-950/70 dark:text-purple-200 font-extrabold hover:bg-purple-200 dark:hover:bg-purple-900/90 cursor-pointer ring-1 ring-purple-300 dark:ring-purple-700/60 shadow-xs"
      } else {
        // Regular official meeting day (Admin selectable)
        btnStyle = "bg-slate-100/90 text-slate-800 dark:bg-slate-800/90 dark:text-slate-200 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
      }
    } else {
      // Disabled day
      btnStyle = "text-slate-300 dark:text-slate-650 cursor-not-allowed opacity-35 select-none line-through decoration-slate-300/80 dark:decoration-slate-650"
    }

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={!isSelectable}
        onClick={() => isSelectable && onChange(dateStr)}
        title={
          isPast
            ? "Past date"
            : isPublicDay
              ? "Official Public Consultation Day (Monday)"
              : allowAnyDate
                ? "Official Working Day (Selectable for Official Meetings)"
                : "Closed for public bookings. Citizen consultations are on Mondays only."
        }
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex flex-col items-center justify-center transition-all relative group cursor-pointer ${btnStyle}`}
      >
        <span>{d}</span>
        {isPublicDay && !isSelected && !isPast && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 absolute bottom-1"></span>
        )}
      </button>
    )
  }

  return (
    <div className={`w-full select-none ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleTodayJump}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors ml-1 cursor-pointer"
            title="Jump to current month"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer text-sm font-bold transition-colors flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
            title="Previous Month"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer text-sm font-bold transition-colors flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
            title="Next Month"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
        <span>Su</span>
        <span className="text-purple-600 dark:text-purple-400 font-black">Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 justify-items-center mb-3">
        {days}
      </div>

      {/* Legend Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
            <span className="font-bold text-purple-700 dark:text-purple-300">Public Day (Mon)</span>
          </div>
          {allowAnyDate && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="font-medium text-slate-600 dark:text-slate-400">Working Day</span>
            </div>
          )}
        </div>
        <div>
          {allowAnyDate ? (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Admin: Any Date Open
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
              Mondays Only
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

