import { useState } from 'react'

// Custom Interactive Calendar datepicker component to render only enabled days
export default function CustomDatePicker({ allowedDates, value, onChange }) {
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
    <div className="w-full max-w-[280px] mx-auto sm:w-[280px]">
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
