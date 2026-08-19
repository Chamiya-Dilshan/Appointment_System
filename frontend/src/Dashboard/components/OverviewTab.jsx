import React from 'react'

export default function OverviewTab({ appointments, setActiveTab }) {
  // Get today's local date string (YYYY-MM-DD)
  const todayStr = (() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  // Filter appointments specifically for today (that particular date)
  const todayAppointmentsFiltered = appointments.filter(appt => appt.date === todayStr)

  // Calculate statistics for today's appointments only
  const totalAppts = todayAppointmentsFiltered.length
  const confirmedAppts = todayAppointmentsFiltered.filter(a => a.status === 'Confirmed').length
  const pendingAppts = todayAppointmentsFiltered.filter(a => a.status === 'Pending').length
  const cancelledAppts = todayAppointmentsFiltered.filter(a => a.status === 'Cancelled').length

  // Get appointments scheduled for today (that particular date, sorted chronologically)
  const todayAppointments = [...todayAppointmentsFiltered].sort((a, b) => {
    const getMinutes = (timeStr) => {
      const [time, modifier] = timeStr.split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      if (modifier === 'PM' && hours < 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }
    return getMinutes(a.time) - getMinutes(b.time)
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Real-time metrics and portal activities overview.</p>
      </div>

      {/* Statistics Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Booked</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold">{totalAppts}</span>
            <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">appointments</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Full scheduled list</span>
          </div>
        </div>

        {/* Stat 2: Confirmed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Confirmed</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{confirmedAppts}</span>
            <span className="text-xs text-emerald-500 font-medium">active</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ready for service</span>
          </div>
        </div>

        {/* Stat 3: Pending */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Review</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{pendingAppts}</span>
            <span className="text-xs text-amber-500 font-medium">awaiting</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Requires confirmation</span>
          </div>
        </div>

        {/* Stat 4: Cancelled */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-300" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cancelled</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{cancelledAppts}</span>
            <span className="text-xs text-rose-500 font-medium">dismissed</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Voided appointments</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule Agenda */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold tracking-tight">Today's Appointments</h3>
            <button
              onClick={() => setActiveTab('appointments')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="relative border-l border-slate-100 dark:border-slate-800 pl-5 ml-2.5 space-y-6">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appt) => {
                const statusColors = {
                  Confirmed: 'bg-emerald-500 text-emerald-500',
                  Pending: 'bg-amber-500 text-amber-500',
                  Cancelled: 'bg-rose-500 text-rose-500'
                }
                const dotColor = statusColors[appt.status] || 'bg-slate-400 text-slate-450'

                return (
                  <div key={appt.id} className="relative group">
                    {/* Circle timeline indicator */}
                    <span className={`absolute -left-7.5 top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 ${dotColor.split(' ')[0]} flex items-center justify-center`} />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{appt.name}</span>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold select-all">
                          {appt.refNo}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] ml-auto ${
                          appt.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450'
                            : appt.status === 'Pending'
                              ? 'bg-amber-50 text-amber-755 dark:bg-amber-950/30 dark:text-amber-450'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Booked for <strong className="font-semibold">{appt.reason}</strong> on {appt.date} at {appt.time}.
                      </p>
                      {appt.gsDivision && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Location: {appt.gsDivision}, {appt.district}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-4">No appointments scheduled for today ({todayStr}).</div>
            )}
          </div>
        </div>

        {/* Quick Insights & Actions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold tracking-tight">Quick System Insights</h3>
            
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold">24H Booking Lead Time</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">System enforces 24-hour advance bookings minimum.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold">Auto-Notification Dispatch</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Confirmations automatically trigger email & SMS alerts.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('booking')}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Client Appointment
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
