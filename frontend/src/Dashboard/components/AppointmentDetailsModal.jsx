import React, { useState, useEffect } from 'react'
import { isOfficialMeeting, getOfficialDetails } from '../../utils/sriLankaData'

export default function AppointmentDetailsModal({
  appointment,
  onClose,
  onUpdateStatus,
  onResendNotification,
  isHistory = false,
}) {
  const [currentAppt, setCurrentAppt] = useState(appointment)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationRemark, setCancellationRemark] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionRemark, setCompletionRemark] = useState('')
  const [resendingId, setResendingId] = useState(null)

  useEffect(() => {
    setCurrentAppt(appointment)
    setIsCancelling(false)
    setIsCompleting(false)
    setCancellationRemark('')
    setCompletionRemark('')
  }, [appointment])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!currentAppt) return null

  const isOfficial = isOfficialMeeting(currentAppt)
  const official = getOfficialDetails(currentAppt)
  const todayStr = new Date().toISOString().split('T')[0]

  const handleResend = async (apptId) => {
    if (!onResendNotification) return
    setResendingId(apptId)
    try {
      await onResendNotification(apptId)
    } finally {
      setResendingId(null)
    }
  }

  const handleConfirmAction = async () => {
    if (onUpdateStatus) {
      await onUpdateStatus(currentAppt.id, 'Confirmed')
    }
    setCurrentAppt((prev) => ({ ...prev, status: 'Confirmed' }))
  }

  const handleCompleteAction = async () => {
    if (onUpdateStatus) {
      await onUpdateStatus(currentAppt.id, 'Completed', completionRemark)
    }
    setCurrentAppt((prev) => ({
      ...prev,
      status: 'Completed',
      completionRemark: completionRemark,
    }))
    setIsCompleting(false)
  }

  const handleCancelAction = async () => {
    if (onUpdateStatus) {
      await onUpdateStatus(currentAppt.id, 'Cancelled', cancellationRemark)
    }
    setCurrentAppt((prev) => ({
      ...prev,
      status: 'Cancelled',
      cancellationRemark: cancellationRemark,
    }))
    setIsCancelling(false)
  }

  const statusBadge = (
    <span
      className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
        currentAppt.status === 'Confirmed'
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
          : currentAppt.status === 'Completed'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800'
          : currentAppt.status === 'Pending'
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          currentAppt.status === 'Confirmed'
            ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700'
            : currentAppt.status === 'Completed'
            ? 'bg-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
            : currentAppt.status === 'Pending'
            ? 'bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700'
            : 'bg-rose-500 ring-2 ring-rose-300 dark:ring-rose-700'
        }`}
      />
      {currentAppt.status}
    </span>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 py-6 sm:py-8 bg-slate-900/60 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-5 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isOfficial ? '🏢 Official Meeting Details' : '👤 Citizen Appointment Details'}</span>
              </h3>
              <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800 select-all">
                {currentAppt.refNo}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {isOfficial
                ? 'Internal & Inter-Departmental Ministerial Session Audit View'
                : 'Citizen Representation & Public Consultation Audit View'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer shrink-0"
            title="Close view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-sm text-slate-750 dark:text-slate-355">
          {/* Category Indicator Tag */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Schedule Category
            </span>
            {isOfficial ? (
              <span className="px-3 py-1 rounded-full font-bold text-xs bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 inline-flex items-center gap-1.5 shadow-xs">
                <span>🏢 Official Meeting (Non-Public)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full font-bold text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 inline-flex items-center gap-1.5 shadow-xs">
                <span>👤 Public Consultation Day</span>
              </span>
            )}
          </div>

          {/* Conditional Blocks: Official Meeting vs Public Consultation */}
          {isOfficial ? (
            /* ========================================================
               OFFICIAL MEETING FORM-COMPATIBLE VIEW
               Matching 1. Official Meeting & Delegation Details
               Matching 2. Schedule Date & Time Slot
               ======================================================== */
            <>
              {/* Section 1: Official Meeting & Delegation Details */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/70 dark:border-slate-800/70">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>1. Official Meeting & Delegation Details</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Internal / Delegation</span>
                </div>

                {/* Meeting Subject / Agenda (Top Prominent Banner like in Form) */}
                <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
                    Meeting Subject / Agenda
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                    {official.meetingTitle || currentAppt.reason}
                  </p>
                </div>

                {/* Delegation & Official Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Organization / Ministry / Entity</span>
                    <strong className="font-bold text-indigo-650 dark:text-indigo-400 block text-sm">
                      🏛️ {official.organization}
                    </strong>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Lead Official / Representative</span>
                    <strong className="font-bold text-slate-900 dark:text-white block text-sm">
                      👤 {official.leadOfficial}
                    </strong>
                  </div>

                  <div className="space-y-0.5 sm:col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Official Designation / Title</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {official.designation ? official.designation : <span className="text-slate-400 italic">Not specified</span>}
                    </p>
                  </div>

                  <div className="space-y-0.5 sm:col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Meeting Venue / Location</span>
                    <strong className="font-semibold text-slate-850 dark:text-white block">
                      📍 {official.venue}
                    </strong>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Designated Officer (With)</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {currentAppt.officer}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Official Contact Phone</span>
                    <strong className="font-semibold text-slate-850 dark:text-white block">
                      📞 {official.phone}
                    </strong>
                  </div>

                  <div className="space-y-0.5 sm:col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Official Email</span>
                    <strong className="font-semibold text-slate-850 dark:text-white block break-all">
                      ✉️ {official.email || <span className="text-slate-400 font-normal italic">None provided</span>}
                    </strong>
                  </div>
                </div>

                {/* Agenda Briefing / Meeting Notes from Form */}
                {official.meetingNotes && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Agenda Briefing / Meeting Notes
                    </span>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 text-xs whitespace-pre-wrap">
                      {official.meetingNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Meeting Schedule & Status */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/70 dark:border-slate-800/70">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>2. Schedule Date & Time Slot</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Session Timing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Meeting Date</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-sm">
                      📅 {currentAppt.date}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Time Slot (30m Interval)</span>
                    <strong className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      ⏰ {currentAppt.time}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Session Status</span>
                    {statusBadge}
                  </div>
                </div>

                {/* Session Outcome Remarks (if Completed or Cancelled) */}
                {currentAppt.status === 'Completed' && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="text-blue-600 dark:text-blue-400 font-bold block mb-1">
                      Completion Remark / Session Outcomes
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                      {currentAppt.completionRemark || 'Session marked as completed successfully.'}
                    </p>
                  </div>
                )}

                {currentAppt.status === 'Cancelled' && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="text-rose-600 dark:text-rose-400 font-bold block mb-1">
                      Cancellation Remark / Reason
                    </span>
                    <p className="font-medium text-rose-600 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50 italic">
                      {currentAppt.cancellationRemark || 'Session cancelled.'}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ========================================================
               CITIZEN CONSULTATION FORM-COMPATIBLE VIEW
               Matching 1. Citizen Identification Details
               Matching 2. Address & Regional Details
               Matching 3. Schedule Date & Time Slot
               ======================================================== */
            <>
              {/* Section 1: Citizen Identification Details */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/70 dark:border-slate-800/70">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-200/60 dark:border-slate-800/60 pb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>1. Citizen Identification Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Citizen Full Name</span>
                    <strong className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentAppt.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">National Identity Card (NIC) / Passport</span>
                    <strong className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                      {currentAppt.nic || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Contact Phone Number</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">
                      📞 {currentAppt.phone}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Email Address</span>
                    <strong className="font-semibold break-all text-slate-850 dark:text-white">
                      ✉️ {currentAppt.email || <span className="text-slate-400 font-normal italic">None</span>}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Section 2: Schedule & Consultation Details */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/70 dark:border-slate-800/70">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-200/60 dark:border-slate-800/60 pb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>2. Schedule & Consultation Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Appointment Date</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-sm">
                      📅 {currentAppt.date}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Time Slot</span>
                    <strong className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      ⏰ {currentAppt.time}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Booking Status</span>
                    {statusBadge}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Assigned Officer</span>
                    <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {currentAppt.officer || 'Secretary'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Reason for Public Consultation</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{currentAppt.reason}</p>
                  </div>
                </div>

                {currentAppt.status === 'Completed' && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="text-blue-600 dark:text-blue-400 font-bold block mb-1">
                      Completion Remark / Session Notes
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                      {currentAppt.completionRemark || 'Consultation concluded.'}
                    </p>
                  </div>
                )}

                {currentAppt.status === 'Cancelled' && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="text-rose-600 dark:text-rose-400 font-bold block mb-1">
                      Cancellation Remark / Reason
                    </span>
                    <p className="font-medium text-rose-600 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50 italic">
                      {currentAppt.cancellationRemark || 'Appointment cancelled.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Section 3: Address & Regional Details */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/70 dark:border-slate-800/70">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-200/60 dark:border-slate-800/60 pb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>3. Address & Regional Details</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">GS Division</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">
                      {currentAppt.gsDivision || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">District Secretariat</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">
                      {currentAppt.council || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">District</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">
                      {currentAppt.district || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Province</span>
                    <strong className="font-semibold text-slate-850 dark:text-white">
                      {currentAppt.province || 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Permanent Residential Address</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    📍 {currentAppt.address}
                    {currentAppt.postalCode ? `, Postal Code: ${currentAppt.postalCode}` : ''}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Section: Automated Notifications */}
          <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/70 dark:border-indigo-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Automated Notifications</span>
              </h4>
              {!isHistory && currentAppt.status !== 'Completed' && currentAppt.status !== 'Cancelled' && (
                <button
                  type="button"
                  disabled={resendingId === currentAppt.id}
                  onClick={() => handleResend(currentAppt.id)}
                  className="w-full sm:w-auto px-3 py-1.5 sm:py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
                  title="Dispatch / Resend Live or Simulated Email & SMS"
                >
                  {resendingId === currentAppt.id ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-slate-500 dark:text-slate-400">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-white break-all">
                  {currentAppt.email || 'No email provided'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-slate-500 dark:text-slate-400">SMS:</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {currentAppt.phone || 'No phone provided'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Status Control Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Left Side: Status actions for admin */}
          {currentAppt.status !== 'Cancelled' && currentAppt.status !== 'Completed' && (
            <div className="flex flex-wrap gap-2 flex-1">
              {isCompleting ? (
                <div className="w-full space-y-3 p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-100/60 dark:border-blue-900/40">
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    Mark {isOfficial ? 'Official Meeting' : 'Appointment'} as Completed
                  </div>
                  <textarea
                    placeholder={
                      isOfficial
                        ? 'Enter session discussion notes, decisions taken, or follow-up circulars...'
                        : 'Enter appointment remark / consultation notes...'
                    }
                    value={completionRemark}
                    onChange={(e) => setCompletionRemark(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCompleting(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteAction}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                    >
                      Confirm Completion
                    </button>
                  </div>
                </div>
              ) : isCancelling ? (
                <div className="w-full space-y-3 p-3 bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl border border-rose-100/50 dark:border-rose-950/20">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Are you sure you want to cancel this {isOfficial ? 'official meeting' : 'appointment'}?
                  </div>
                  <textarea
                    placeholder="Enter cancellation remark / reason..."
                    value={cancellationRemark}
                    onChange={(e) => setCancellationRemark(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500 placeholder-slate-400"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelling(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-white bg-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAction}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all shadow-xs"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {currentAppt.status === 'Confirmed' && (
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
                        onClick={() => setIsCancelling(true)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 cursor-pointer transition-all"
                      >
                        Cancel {isOfficial ? 'Meeting' : 'Appointment'}
                      </button>
                    </>
                  )}

                  {currentAppt.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={handleConfirmAction}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Confirm {isOfficial ? 'Meeting' : 'Appointment'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCancelling(true)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-100/80 text-rose-700 border border-rose-200/80 hover:bg-rose-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 cursor-pointer transition-all"
                      >
                        Cancel {isOfficial ? 'Meeting' : 'Appointment'}
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
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-white bg-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-all ml-auto border border-slate-200 dark:border-slate-700"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  )
}
