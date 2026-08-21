import React, { useState, useEffect } from 'react'

export default function AppointmentsTab({
  appointments,
  onConfirm,
  onDelete,
  onUpdateStatus,
  setActiveTab,
  title = "Appointments Directory",
  subtitle = "Search, filter, and manage booked client sessions.",
  isHistory = false
}) {
  const [selectedDetailedAppt, setSelectedDetailedAppt] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationRemark, setCancellationRemark] = useState('')

  useEffect(() => {
    setIsCancelling(false)
    setCancellationRemark('')
  }, [selectedDetailedAppt])

  const [cancellingAppt, setCancellingAppt] = useState(null)
  const [quickCancelRemark, setQuickCancelRemark] = useState('')

  useEffect(() => {
    setQuickCancelRemark('')
  }, [cancellingAppt])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Filtered and sorted appointments (most recent to future)
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
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
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
              {['All', 'Confirmed', 'Pending', 'Cancelled'].map((status) => (
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
                        : appt.status === 'Pending'
                          ? 'bg-amber-50 text-amber-705 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-755 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${appt.status === 'Confirmed'
                          ? 'bg-emerald-500'
                          : appt.status === 'Pending'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          }`} />
                        {appt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDetailedAppt(appt)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-200/80 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/40 transition-all font-bold cursor-pointer text-xs"
                          title="View Complete Details"
                        >
                          View
                        </button>
                        {isHistory ? (
                          <button
                            onClick={() => onDelete(appt.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
                            title="Delete Appointment"
                          >
                            Delete
                          </button>
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
                            {appt.status !== 'Cancelled' && (
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
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 shrink-0 ${appt.status === 'Confirmed'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : appt.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${appt.status === 'Confirmed'
                      ? 'bg-emerald-500'
                      : appt.status === 'Pending'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                      }`} />
                    {appt.status}
                  </span>
                </div>

                {/* Bottom details and actions */}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-105 dark:border-slate-800/40">
                  {/* Date/Time */}
                  <div className="text-slate-500 dark:text-slate-400">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">{appt.date}</p>
                    <p className="text-[10px] mt-0.5">{appt.time}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDetailedAppt(appt)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-200/80 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/40 transition-all font-bold cursor-pointer text-xs"
                    >
                      View
                    </button>
                    {isHistory ? (
                      <button
                        onClick={() => onDelete(appt.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
                      >
                        Delete
                      </button>
                    ) : (
                      <>
                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => onConfirm(appt.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40 transition-all font-bold cursor-pointer text-xs"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancellingAppt(appt)}
                            className="px-3 py-1.5 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-all font-bold cursor-pointer text-xs"
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

            {/* Modal Footer with Status control actions (Option 2) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Left Side: Status actions for admin (Active/Future only) */}
              {!isHistory && (
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
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-905 text-slate-805 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 placeholder-slate-400"
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
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 placeholder-slate-400"
                rows={3}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateStatus) onUpdateStatus(cancellingAppt.id, 'Cancelled', quickCancelRemark)
                  setCancellingAppt(null)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 cursor-pointer transition-all"
              >
                Confirm Cancellation
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
