import React, { useState, useEffect } from 'react'

export default function AppointmentsTab({
  appointments,
  onConfirm,
  onDelete,
  onUpdateStatus,
  onResendNotification,
  setActiveTab,
  title = "Appointments Directory",
  subtitle = "Search, filter, and manage booked client sessions.",
  isHistory = false
}) {
  const [selectedDetailedAppt, setSelectedDetailedAppt] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationRemark, setCancellationRemark] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionRemark, setCompletionRemark] = useState('')
  const [resendingId, setResendingId] = useState(null)

  const handleResend = async (apptId) => {
    if (!onResendNotification) return
    setResendingId(apptId)
    try {
      await onResendNotification(apptId)
    } finally {
      setResendingId(null)
    }
  }

  useEffect(() => {
    setIsCancelling(false)
    setIsCompleting(false)
    setCancellationRemark('')
    setCompletionRemark('')
  }, [selectedDetailedAppt])

  const [cancellingAppt, setCancellingAppt] = useState(null)
  const [quickCancelRemark, setQuickCancelRemark] = useState('')
  const [completingAppt, setCompletingAppt] = useState(null)
  const [quickCompleteRemark, setQuickCompleteRemark] = useState('')

  useEffect(() => {
    setQuickCancelRemark('')
  }, [cancellingAppt])

  useEffect(() => {
    setQuickCompleteRemark('')
  }, [completingAppt])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Filtered and sorted appointments:
  // In history view (isHistory === true), display from the latest date to past days (descending).
  // In active view (isHistory === false), display from the nearest upcoming date into the future (ascending).
  const filteredAppointments = appointments
    .filter(appt => {
      const matchesSearch = appt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appt.phone && appt.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (appt.email && appt.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (appt.nic && appt.nic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (appt.district && appt.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (appt.gsDivision && appt.gsDivision.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (appt.address && appt.address.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'All' || appt.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const getMinutes = (timeStr) => {
        if (!timeStr) return 0
        const [time, modifier] = timeStr.split(' ')
        if (!time) return 0
        let [hours, minutes] = time.split(':').map(Number)
        if (modifier === 'PM' && hours < 12) hours += 12
        if (modifier === 'AM' && hours === 12) hours = 0
        return (hours || 0) * 60 + (minutes || 0)
      }

      if (isHistory) {
        // Latest date to past days
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date)
        }
        return getMinutes(b.time) - getMinutes(a.time)
      } else {
        // Active / upcoming: nearest date to future
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }
        return getMinutes(a.time) - getMinutes(b.time)
      }
    })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <button
          onClick={() => setActiveTab('booking')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-500/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
        </button>
      </div>

      {/* Filter and Table Card */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">

        {/* Controls Bar */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Left side: Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
            {/* Search input */}
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search client, reason, contact, NIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex w-full sm:w-auto overflow-x-auto scrollbar-none flex-nowrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
              {['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 text-center whitespace-nowrap px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${statusFilter === status
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop View: Table (hidden on mobile/tablet, shown on lg screens) */}
        <div className="hidden lg:block overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50/20 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/25 transition-colors duration-150">
                    {/* Name */}
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold flex items-center gap-1.5 flex-wrap">
                            <span>{appt.name}</span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono select-all shrink-0">
                              {appt.refNo}
                            </span>
                          </div>
                          <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">{appt.email} / {appt.phone}</div>
                          {appt.nic && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-1.5 items-center">
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold font-mono">NIC: {appt.nic}</span>
                              {appt.gsDivision && <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-semibold">GS: {appt.gsDivision}</span>}
                              {appt.district && <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold">{appt.district}, {appt.province}</span>}
                            </div>
                          )}
                          {appt.address && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 italic max-w-xs truncate" title={`${appt.address}${appt.postalCode ? `, ${appt.postalCode}` : ''}`}>
                              📍 {appt.address}{appt.postalCode ? ` (${appt.postalCode})` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-450 font-medium">
                      {appt.reason}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {appt.date}
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold">
                      {appt.time}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 ${appt.status === 'Confirmed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : appt.status === 'Completed'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : appt.status === 'Pending'
                            ? 'bg-amber-50 text-amber-705 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-755 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${appt.status === 'Confirmed'
                          ? 'bg-emerald-500'
                          : appt.status === 'Completed'
                            ? 'bg-blue-500'
                            : appt.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`} />
                        {appt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                        <button
                          onClick={() => setSelectedDetailedAppt(appt)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-200/80 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/40 transition-all font-bold cursor-pointer text-xs"
                          title="View Complete Details"
                        >
                          View
                        </button>
                        {!isHistory && (
                          <button
                            type="button"
                            disabled={resendingId === appt.id}
                            onClick={() => handleResend(appt.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-100/80 text-sky-700 border border-sky-200/80 hover:bg-sky-200/80 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50 dark:hover:bg-sky-900/40 transition-all font-bold cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1"
                            title="Dispatch / Resend Notification (Email & SMS)"
                          >
                            {resendingId === appt.id ? (
                              <>
                                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Alert</span>
                              </>
                            )}
                          </button>
                        )}
                        {isHistory ? (
                          <div className="flex items-center gap-1.5">
                            {appt.status === 'Confirmed' && (
                              <button
                                onClick={() => setCompletingAppt(appt)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-100/80 text-blue-700 border border-blue-200/80 hover:bg-blue-200/80 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/40 transition-all font-bold cursor-pointer text-xs flex items-center gap-1"
                                title="Mark as Completed"
                              >
                                <span>Complete</span>
                              </button>
                            )}
                            <button
                              onClick={() => onDelete(appt.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
                              title="Delete Appointment"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            {appt.status === 'Pending' && (
                              <button
                                onClick={() => onConfirm(appt.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40 transition-all font-bold cursor-pointer text-xs"
                                title="Confirm Appointment"
                              >
                                Confirm
                              </button>
                            )}
                            {appt.status === 'Confirmed' && (
                              <button
                                onClick={() => setCompletingAppt(appt)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-100/80 text-blue-700 border border-blue-200/80 hover:bg-blue-200/80 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/40 transition-all font-bold cursor-pointer text-xs flex items-center gap-1"
                                title="Mark as Completed"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Complete</span>
                              </button>
                            )}
                            {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                              <button
                                onClick={() => setCancellingAppt(appt)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
                                title="Cancel Appointment"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No appointments matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards List (shown on mobile/tablet, hidden on lg screens) */}
        <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appt) => (
              <div key={appt.id} className="p-5 space-y-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side: Avatar & Name/Reason */}
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{appt.name}</h4>
                        <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {appt.refNo}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{appt.reason}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{appt.email} / {appt.phone}</p>
                      {appt.nic && (
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-1.5 items-center">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold font-mono">NIC: {appt.nic}</span>
                          {appt.gsDivision && <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-semibold">GS: {appt.gsDivision}</span>}
                          {appt.district && <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold">{appt.district}, {appt.province}</span>}
                        </div>
                      )}
                      {appt.address && (
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 italic max-w-[200px] truncate" title={`${appt.address}${appt.postalCode ? `, ${appt.postalCode}` : ''}`}>
                          📍 {appt.address}{appt.postalCode ? ` (${appt.postalCode})` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2 py-0.5 rounded-xl text-[12px] inline-flex items-center gap-1.5 ${appt.status === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950 dark:text-emerald-450'
                    : appt.status === 'Completed'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : appt.status === 'Pending'
                        ? 'bg-amber-100 text-amber-500 dark:bg-amber-950 dark:text-amber-450'
                        : 'bg-rose-100 text-rose-500 dark:bg-rose-950 dark:text-rose-450'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${appt.status === 'Confirmed'
                      ? 'bg-emerald-500'
                      : appt.status === 'Completed'
                        ? 'bg-blue-500'
                        : appt.status === 'Pending'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} />
                    {appt.status}
                  </span>
                </div>

                {/* Bottom details and actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-2 border-t border-slate-105 dark:border-slate-800/40">
                  {/* Date/Time */}
                  <div className="text-slate-500 dark:text-slate-400">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">{appt.date}</p>
                    <p className="text-[10px] mt-0.5">{appt.time}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedDetailedAppt(appt)}
                      className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-200/80 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/40 transition-all font-bold cursor-pointer text-xs"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={resendingId === appt.id}
                      onClick={() => handleResend(appt.id)}
                      className="flex-1 sm:flex-none text-center px-2.5 py-1.5 rounded-lg bg-sky-100/80 text-sky-700 border border-sky-200/80 hover:bg-sky-200/80 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50 dark:hover:bg-sky-900/40 transition-all font-bold cursor-pointer text-xs disabled:opacity-50 flex items-center justify-center gap-1"
                      title="Dispatch / Resend Notification"
                    >
                      {resendingId === appt.id ? (
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      <span>Alert</span>
                    </button>
                    {isHistory ? (
                      <div className="flex items-center gap-2">
                        {appt.status === 'Confirmed' && (
                          <button
                            onClick={() => setCompletingAppt(appt)}
                            className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-blue-100/80 text-blue-700 border border-blue-200/80 hover:bg-blue-200/80 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/40 transition-all font-bold cursor-pointer text-xs"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(appt.id)}
                          className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <>
                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => onConfirm(appt.id)}
                            className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40 transition-all font-bold cursor-pointer text-xs"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status === 'Confirmed' && (
                          <button
                            onClick={() => setCompletingAppt(appt)}
                            className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-blue-100/80 text-blue-700 border border-blue-200/80 hover:bg-blue-200/80 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/40 transition-all font-bold cursor-pointer text-xs"
                          >
                            Complete
                          </button>
                        )}
                        {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                          <button
                            onClick={() => setCancellingAppt(appt)}
                            className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
              No appointments matching the current filters.
            </div>
          )}
        </div>
      </section>

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
                    <span className={`inline-block px-2 py-0.5 rounded font-extrabold text-[9px] mt-0.5 uppercase ${selectedDetailedAppt.status === 'Confirmed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450'
                      : selectedDetailedAppt.status === 'Completed'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450'
                        : selectedDetailedAppt.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455'
                      }`}>
                      {selectedDetailedAppt.status}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <span className="text-slate-400 dark:text-slate-500 block">Reason for Visit</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedDetailedAppt.reason}</p>
                </div>
                {selectedDetailedAppt.status === 'Completed' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-blue-600 dark:text-blue-400 font-bold block">Completion Remark / Session Notes</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-100/70 dark:border-blue-900/40">
                      {selectedDetailedAppt.completionRemark || 'No remark provided.'}
                    </p>
                  </div>
                )}
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
                    <span className="text-slate-400 dark:text-slate-500 block">District Secretariat</span>
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

              {/* Notification & Communication Block */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/70 dark:border-indigo-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    4. Automated Notifications
                  </h4>
                  {!isHistory && (
                    <button
                      type="button"
                      disabled={resendingId === selectedDetailedAppt.id}
                      onClick={() => handleResend(selectedDetailedAppt.id)}
                      className="w-full sm:w-auto px-3 py-1.5 sm:py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
                      title="Dispatch / Resend Live or Simulated Email & SMS"
                    >
                      {resendingId === selectedDetailedAppt.id ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>Dispatch / Resend Notification</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Email Recipient</span>
                    <span className="font-semibold text-slate-800 dark:text-white break-all">{selectedDetailedAppt.email || 'No email provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">SMS Phone Recipient</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{selectedDetailedAppt.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer with Status control actions (Option 2) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Left Side: Status actions for admin */}
              {selectedDetailedAppt.status !== 'Cancelled' && selectedDetailedAppt.status !== 'Completed' && (
                <div className="flex flex-wrap gap-2 flex-1">
                  {isCompleting ? (
                    <div className="w-full space-y-3 p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-100/60 dark:border-blue-900/40">
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Mark Appointment as Completed
                      </div>
                      <textarea
                        placeholder="Enter appointment remark / consultation notes..."
                        value={completionRemark}
                        onChange={(e) => setCompletionRemark(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCompleting(false)}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all"
                        >
                          Go Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateStatus) onUpdateStatus(selectedDetailedAppt.id, 'Completed', completionRemark)
                            setSelectedDetailedAppt({
                              ...selectedDetailedAppt,
                              status: 'Completed',
                              completionRemark: completionRemark
                            })
                            setIsCompleting(false)
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                        >
                          Confirm Completion
                        </button>
                      </div>
                    </div>
                  ) : isCancelling ? (
                    <div className="w-full space-y-3 p-3 bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl border border-rose-100/50 dark:border-rose-950/20">
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Are you sure you want to cancel this appointment?
                      </div>
                      <textarea
                        placeholder="Enter cancellation remark (optional)..."
                        value={cancellationRemark}
                        onChange={(e) => setCancellationRemark(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500 placeholder-slate-400"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCancelling(false)}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all"
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
                            onClick={() => setIsCompleting(true)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Mark as Completed</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateStatus) onUpdateStatus(selectedDetailedAppt.id, 'Pending')
                              setSelectedDetailedAppt({ ...selectedDetailedAppt, status: 'Pending' })
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-100/80 text-amber-700 border border-amber-200/80 hover:bg-amber-200/80 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-900/40 cursor-pointer transition-all"
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
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40 cursor-pointer transition-all"
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
      {/* Quick Cancel Modal */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 py-8 bg-slate-900/60 backdrop-blur-xs transition-opacity overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 my-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Cancel Appointment</span>
                  <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono select-all">
                    {cancellingAppt.refNo}
                  </span>
                </h3>
                <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">
                  Cancel appointment for <strong className="font-semibold text-slate-800 dark:text-slate-200">{cancellingAppt.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setCancellingAppt(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-202 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Please provide an optional cancellation remark. This will be stored for audit purposes.
              </div>
              <textarea
                placeholder="Enter cancellation remark (optional)..."
                value={quickCancelRemark}
                onChange={(e) => setQuickCancelRemark(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500 placeholder-slate-400"
                rows={3}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all ml-auto"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateStatus) onUpdateStatus(cancellingAppt.id, 'Cancelled', quickCancelRemark)
                  setCancellingAppt(null)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quick Complete Modal */}
      {completingAppt && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 py-8 bg-slate-900/60 backdrop-blur-xs transition-opacity overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 my-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Complete Appointment</span>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono select-all">
                    {completingAppt.refNo}
                  </span>
                </h3>
                <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">
                  Mark session as completed for <strong className="font-semibold text-slate-800 dark:text-slate-200">{completingAppt.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setCompletingAppt(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-202 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Please provide an optional remark or consultation notes about this appointment.
              </div>
              <textarea
                placeholder="Enter appointment remark / visit outcome notes..."
                value={quickCompleteRemark}
                onChange={(e) => setQuickCompleteRemark(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                rows={3}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCompletingAppt(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all ml-auto"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateStatus) onUpdateStatus(completingAppt.id, 'Completed', quickCompleteRemark)
                  setCompletingAppt(null)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
              >
                Confirm Completion
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
