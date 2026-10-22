import { useState, useEffect } from 'react'

/**
 * Custom Interactive Calendar DatePicker
 * Supports both Citizen Mode (Public Days only, default Mondays, excluding unavailable days)
 * and Admin Mode (Unrestricted date selection for official meetings on any day).
 */
export default function CustomDatePicker({
  allowedDates = [],
  unavailableDates = [],
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

  // Normalize unavailable dates
  const unavailDateList = unavailableDates.map(u => (typeof u === 'string' ? u : u?.date)).filter(Boolean)
  const unavailMap = {}
  unavailableDates.forEach(u => {
    if (typeof u === 'string') {
      unavailMap[u] = "Officer unavailable"
    } else if (u && u.date) {
      unavailMap[u.date] = u.reason || "Officer unavailable"
    }
  })

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

    const isMonday = dayDate.getDay() === 1
    const isExplicitlyUnavailable = unavailDateList.includes(dateStr)

    // A public day is in allowedDates (or default Monday if allowedDates not loaded yet),
    // provided it is NOT explicitly marked unavailable!
    const isPublicDay = !isExplicitlyUnavailable && (
      allowedDates.length > 0 ? allowedDates.includes(dateStr) : isMonday
    )
    const isPast = dateStr < minDateStr

    // If allowAnyDate (Admin), any future date is selectable (though we highlight unavailable days)
    // If citizen mode (!allowAnyDate), only available Public Days in future are selectable.
    const isSelectable = !isPast && (allowAnyDate || isPublicDay)
    const isSelected = value === dateStr

    let btnStyle = ""
    if (isSelected) {
      btnStyle = "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/40 ring-2 ring-indigo-400 scale-105 z-10"
    } else if (isExplicitlyUnavailable && !allowAnyDate) {
      // Specifically marked unavailable by admin (Citizen view)
      btnStyle = "bg-rose-50/70 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 line-through decoration-rose-400/80 cursor-not-allowed border border-rose-200/60 dark:border-rose-900/40 relative font-bold"
    } else if (isSelectable) {
      if (isPublicDay) {
        btnStyle = "bg-purple-100/80 text-purple-800 dark:bg-purple-950/70 dark:text-purple-200 font-extrabold hover:bg-purple-200 dark:hover:bg-purple-900/90 cursor-pointer ring-1 ring-purple-300 dark:ring-purple-700/60 shadow-xs"
      } else if (isExplicitlyUnavailable && allowAnyDate) {
        // Admin view on unavailable public day (selectable for internal meetings if needed, with warning styling)
        btnStyle = "bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer border border-rose-300 dark:border-rose-800 shadow-xs"
      } else {
        // Regular official meeting day (Admin selectable)
        btnStyle = "bg-slate-100/90 text-slate-800 dark:bg-slate-800/90 dark:text-slate-200 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
      }
    } else {
      // Disabled day
      btnStyle = "text-slate-300 dark:text-slate-650 cursor-not-allowed opacity-35 select-none line-through decoration-slate-300/80 dark:decoration-slate-650"
    }

    const unavailReason = unavailMap[dateStr] || "Officer unavailable"
    const tooltipText = isPast
      ? "Past date"
      : isExplicitlyUnavailable
        ? `Officer is unavailable on this date (${unavailReason}). Public consultation cancelled.`
        : isPublicDay
          ? "Official Public Consultation Day (Available)"
          : allowAnyDate
            ? "Official Working Day (Selectable for Official Meetings)"
            : "Closed for public bookings. Citizen consultations are on Public Days (Mondays) only."

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={!isSelectable}
        onClick={() => isSelectable && onChange(dateStr)}
        title={tooltipText}
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex flex-col items-center justify-center transition-all relative group cursor-pointer ${btnStyle}`}
      >
        <span>{d}</span>
        {isPublicDay && !isSelected && !isPast && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 absolute bottom-1"></span>
        )}
        {isExplicitlyUnavailable && !isSelected && !isPast && (
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute bottom-1" title={`Unavailable: ${unavailReason}`}></span>
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
            title="Previous month"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer text-sm font-bold transition-colors flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
            title="Next month"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Weekday Header Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, index) => (
          <div
            key={d}
            className={`text-[10px] font-black uppercase tracking-wider ${
              index === 1 ? 'text-purple-600 dark:text-purple-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 justify-items-center">
        {days}
      </div>

      {/* Calendar Legend */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
          <span>Public Day (Mondays)</span>
        </div>
        {unavailDateList.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">Officer Unavailable</span>
          </div>
        )}
        {allowAnyDate && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-slate-200 dark:bg-slate-700"></span>
            <span>Official Working Day</span>
          </div>
        )}
      </div>
    </div>
  )
}
