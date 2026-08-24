import React, { useState, useEffect } from 'react'

export default function DailyTab({ appointments, onConfirm, onDelete, onUpdateStatus }) {
  // Get today's local date string (YYYY-MM-DD)
  const todayStr = (() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  // Default to today's date in local time YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const [selectedDetailedAppt, setSelectedDetailedAppt] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationRemark, setCancellationRemark] = useState('')

  useEffect(() => {
    setIsCancelling(false)
    setCancellationRemark('')
  }, [selectedDetailedAppt])

  // State to control display limit of active booking dates
  const [showAllDates, setShowAllDates] = useState(false)

  // Get list of unique dates that have appointments, sorted chronologically
  const activeDates = Array.from(new Set(appointments.map(appt => appt.date))).sort()

  // Filter appointments for the selected day
  const dailyAppointments = appointments
    .filter(appt => appt.date === selectedDate)
    .sort((a, b) => {
      const getMinutes = (timeStr) => {
        const [time, modifier] = timeStr.split(' ')
        let [hours, minutes] = time.split(':').map(Number)
        if (modifier === 'PM' && hours < 12) hours += 12
        if (modifier === 'AM' && hours === 12) hours = 0
        return hours * 60 + minutes
      }
      return getMinutes(a.time) - getMinutes(b.time)
    })

  // Calculate day-specific statistics
  const totalDaily = dailyAppointments.length
  const confirmedDaily = dailyAppointments.filter(a => a.status === 'Confirmed').length
  const pendingDaily = dailyAppointments.filter(a => a.status === 'Pending').length
  const cancelledDaily = dailyAppointments.filter(a => a.status === 'Cancelled').length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Tab Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Daily Agenda</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">View and manage appointments for a specific day.</p>
      </div>

      {/* Date Selector & Active Dates Summary */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-extrabold tracking-tight">Select Agenda Date</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose any date to see scheduled sessions.</p>
          </div>

          <div className="w-full md:w-auto min-w-[200px]">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm font-semibold cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Filter: Days with active bookings */}
        {activeDates.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Booking Dates
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {(showAllDates ? activeDates : activeDates.slice(0, 6)).map(date => {
                const count = appointments.filter(a => a.date === date).length
                const isSelected = selectedDate === date
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected
                      ? 'bg-indigo-650 text-black shadow-sm dark:text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-455 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <span>{date}</span>
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                      {count}
                    </span>
                  </button>
                )
              })}

              {/* Show All / Show Less Toggle Button */}
              {activeDates.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllDates(!showAllDates)}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-indigo-655 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all cursor-pointer shrink-0"
                >
                  {showAllDates ? 'Show Less ▲' : `Show More (${activeDates.length - 6}) ▼`}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Grid: Daily Stats & List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Side: Daily stats breakdown */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Day Summary ({selectedDate})
            </h4>

            <div className="space-y-3">
              {/* Total */}
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Booked</span>
                <span className="text-sm font-extrabold">{totalDaily}</span>
              </div>

              {/* Confirmed */}
              <div className="flex justify-between items-center py-1 border-t border-slate-50 dark:border-slate-800/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Confirmed</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{confirmedDaily}</span>
              </div>

              {/* Pending */}
              <div className="flex justify-between items-center py-1 border-t border-slate-50 dark:border-slate-800/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending</span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{pendingDaily}</span>
              </div>

              {/* Cancelled */}
              <div className="flex justify-between items-center py-1 border-t border-slate-50 dark:border-slate-800/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Cancelled</span>
                <span className="text-sm font-extrabold text-rose-650 dark:text-rose-400">{cancelledDaily}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Timeline Agenda list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold tracking-tight">Timeline Schedule</h3>

            <div className="relative border-l border-slate-100 dark:border-slate-800 pl-5 ml-2.5 space-y-6">
              {dailyAppointments.length > 0 ? (
                dailyAppointments.map((appt) => {
                  const isPending = appt.status === 'Pending'
                  const isConfirmed = appt.status === 'Confirmed'

                  const dotColor = isConfirmed
                    ? 'bg-emerald-500'
                    : isPending
                      ? 'bg-amber-500'
                      : 'bg-rose-500'

                  return (
                    <div key={appt.id} className="relative group">
                      {/* Timeline circle */}
                      <span className={`absolute -left-7.5 top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 ${dotColor} flex items-center justify-center`} />

                      {/* Content Card */}
                      <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 transition-colors space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">{appt.name}</span>
                            <span className="text-[9px] bg-white dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold select-all shrink-0">
                              {appt.refNo}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg shrink-0">
                            {appt.time}
                          </span>
                        </div>

                        <div className="text-xs text-slate-650 dark:text-slate-400 space-y-1.5">
                          <p>
                            Reason: <strong className="font-semibold text-slate-850 dark:text-slate-200">{appt.reason}</strong>
                          </p>
                          <div className="text-[10px] text-slate-455 dark:text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span>Phone: {appt.phone}</span>
                            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                            <span className="break-all">Email: {appt.email}</span>
                          </div>
                          {appt.nic && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-1.5 items-center">
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold font-mono">NIC: {appt.nic}</span>
                              {appt.gsDivision && <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-semibold">GS: {appt.gsDivision}</span>}
                              {appt.district && <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold">{appt.district}, {appt.province}</span>}
                            </div>
                          )}
                        </div>

                        {/* Inline Management Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                          <span className={`w-fit px-2 py-0.5 rounded-xl text-[12px] inline-flex items-center gap-1.5 ${isConfirmed
                            ? 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950 dark:text-emerald-450'
                            : isPending
                              ? 'bg-amber-100 text-amber-500 dark:bg-amber-950 dark:text-amber-450'
                              : 'bg-rose-100 text-rose-500 dark:bg-rose-950 dark:text-rose-450'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'}`} />
                            {appt.status}
                          </span>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                            <button
                              onClick={() => setSelectedDetailedAppt(appt)}
                              className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-200/80 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/40 transition-all font-bold cursor-pointer text-xs"
                            >
                              View
                            </button>
                            {isPending && (
                              <button
                                onClick={() => onConfirm(appt.id)}
                                className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-455 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40 transition-all font-bold cursor-pointer text-xs"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              onClick={() => onDelete(appt.id)}
                              className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-12 text-center">
                  📅 No appointments scheduled for this date ({selectedDate}).
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Details Modal */}
      {selectedDetailedAppt && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 py-8 bg-slate-900/60 backdrop-blur-xs transition-opacity overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 my-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Appointment Details</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono select-all">
                    {selectedDetailedAppt.refNo}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Audit log view of past scheduled slot.</p>
              </div>
              <button
                onClick={() => setSelectedDetailedAppt(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-sm text-slate-750 dark:text-slate-355">

              {/* Client Info Block */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/80 dark:border-slate-800/80">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">1. Client Profile</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Full Name</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">NIC (Identity Card)</span>
                    <strong className="font-semibold font-mono text-slate-850 dark:text-white">{selectedDetailedAppt.nic || 'N/A'}</strong>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400 dark:text-slate-500 block">Contact Number</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.phone}</strong>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400 dark:text-slate-500 block">Email Address</span>
                    <strong className="font-semibold break-all text-slate-850 dark:text-white">{selectedDetailedAppt.email}</strong>
                  </div>
                </div>
              </div>

              {/* Schedule Info Block */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/80 dark:border-slate-800/80">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">2. Schedule Details</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Date</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Time Slot</span>
                    <strong className="font-semibold text-indigo-650 dark:text-indigo-400">{selectedDetailedAppt.time}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Booking Status</span>
                    <span className={`px-2 py-0.5 rounded-xl text-[12px] inline-flex items-center gap-1.5 ${selectedDetailedAppt.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950 dark:text-emerald-450'
                        : selectedDetailedAppt.status === 'Pending'
                          ? 'bg-amber-100 text-amber-500 dark:bg-amber-950 dark:text-amber-450'
                          : 'bg-rose-100 text-rose-500 dark:bg-rose-950 dark:text-rose-450'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedDetailedAppt.status === 'Confirmed'
                        ? 'bg-emerald-500'
                        : selectedDetailedAppt.status === 'Pending'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                        }`} />
                      {selectedDetailedAppt.status}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs flex justify-between gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Assigned Officer</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.officer || 'N/A'}</strong>
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-400 dark:text-slate-500 block">Reason for Visit</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedDetailedAppt.reason}</p>
                  </div>
                </div>
                {selectedDetailedAppt.status === 'Cancelled' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-slate-400 dark:text-slate-500 block">Cancellation Remark</span>
                    <p className="font-medium text-rose-600 dark:text-rose-400 mt-0.5 bg-rose-50/50 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-100/50 dark:border-rose-950/20 italic">
                      {selectedDetailedAppt.cancellationRemark || 'No remark provided.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Location Block */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/80 dark:border-slate-800/80">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">3. Address & Regional Info</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">GS Division</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.gsDivision || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Local Council</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.council || 'N/A'}</strong>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400 dark:text-slate-500 block">District</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.district || 'N/A'}</strong>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400 dark:text-slate-500 block">Province</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">{selectedDetailedAppt.province || 'N/A'}</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <span className="text-slate-400 dark:text-slate-500 block">Address & Postal Code</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    📍 {selectedDetailedAppt.address}{selectedDetailedAppt.postalCode ? ` (${selectedDetailedAppt.postalCode})` : ''}
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer with Status control actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Left Side: Status actions for admin (Active/Future only) */}
              {selectedDetailedAppt.date >= todayStr && (
                <div className="flex flex-wrap gap-2 flex-1">
                  {isCancelling ? (
                    <div className="w-full space-y-3 p-3 bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl border border-rose-100/50 dark:border-rose-950/20">
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Are you sure you want to cancel this appointment?
                      </div>
                      <textarea
                        placeholder="Enter cancellation remark (optional)..."
                        value={cancellationRemark}
                        onChange={(e) => setCancellationRemark(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-905 text-slate-850 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 placeholder-slate-400"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCancelling(false)}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100/80 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-205 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer transition-all"
                        >
                          Go Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateStatus) onUpdateStatus(selectedDetailedAppt.id, 'Cancelled', cancellationRemark)
                            setSelectedDetailedAppt({
                              ...selectedDetailedAppt,
                              status: 'Cancelled',
                              cancellationRemark: cancellationRemark
                            })
                            setIsCancelling(false)
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 cursor-pointer transition-all"
                        >
                          Confirm Cancellation
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedDetailedAppt.status === 'Confirmed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateStatus) onUpdateStatus(selectedDetailedAppt.id, 'Pending')
                              setSelectedDetailedAppt({ ...selectedDetailedAppt, status: 'Pending' })
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-100/80 text-amber-700 border border-amber-200/80 hover:bg-amber-200/80 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/50 dark:hover:bg-amber-900/40 cursor-pointer transition-all"
                          >
                            Revert to Pending
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCancelling(true)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 cursor-pointer transition-all"
                          >
                            Cancel Appointment
                          </button>
                        </>
                      )}

                      {selectedDetailedAppt.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateStatus) onUpdateStatus(selectedDetailedAppt.id, 'Confirmed')
                              setSelectedDetailedAppt({ ...selectedDetailedAppt, status: 'Confirmed' })
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40 cursor-pointer transition-all"
                          >
                            Confirm Appointment
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCancelling(true)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 cursor-pointer transition-all"
                          >
                            Cancel Appointment
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Right Side: Close button */}
              <button
                type="button"
                onClick={() => setSelectedDetailedAppt(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all ml-auto"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
