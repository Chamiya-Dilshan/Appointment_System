import React, { useState, useMemo } from 'react'
import {
  SRI_LANKA_PROVINCES,
  MINISTERIAL_OFFICERS,
  getAppointmentTimeRange,
  formatDurationLabel,
  isOfficialMeeting
} from '../../utils/sriLankaData'
import AppointmentDetailsModal from './AppointmentDetailsModal'

export default function EfficiencyTab({
  appointments = [],
  currentUser,
  setActiveTab,
  onUpdateStatus,
  onUpdateTime,
  onResendNotification
}) {
  // ───────────────────────────────────────────────────────────────────────────
  // Helper: Format Date string YYYY-MM-DD
  // ───────────────────────────────────────────────────────────────────────────
  const getTodayStr = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getRelativeDateStr = (daysOffset) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getStartOfMonthStr = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}-01`
  }

  const getStartOfYearStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-01-01`
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Filter States
  // ───────────────────────────────────────────────────────────────────────────
  // Presets: 'all_time' | 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_30_days' | 'this_year' | 'custom'
  const [datePreset, setDatePreset] = useState('all_time')
  const [customStartDate, setCustomStartDate] = useState(getRelativeDateStr(-30))
  const [customEndDate, setCustomEndDate] = useState(getTodayStr())

  // Metric dimension filters
  const [selectedOfficer, setSelectedOfficer] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // View table sort & pagination
  const [sortField, setSortField] = useState('date') // 'date' | 'status' | 'duration' | 'officer'
  const [sortAsc, setSortAsc] = useState(false)
  const [tablePage, setTablePage] = useState(1)
  const pageSize = 10

  // Modal inspection
  const [inspectedAppt, setInspectedAppt] = useState(null)
  const [copiedSummary, setCopiedSummary] = useState(false)

  // ───────────────────────────────────────────────────────────────────────────
  // Active Date Range Computation
  // ───────────────────────────────────────────────────────────────────────────
  const activeDateRange = useMemo(() => {
    const today = getTodayStr()
    switch (datePreset) {
      case 'today':
        return { start: today, end: today, label: 'Today' }
      case 'yesterday': {
        const yest = getRelativeDateStr(-1)
        return { start: yest, end: yest, label: 'Yesterday' }
      }
      case 'last_7_days':
        return { start: getRelativeDateStr(-6), end: today, label: 'Last 7 Days' }
      case 'this_month':
        return { start: getStartOfMonthStr(), end: today, label: 'This Month' }
      case 'last_30_days':
        return { start: getRelativeDateStr(-29), end: today, label: 'Last 30 Days' }
      case 'this_year':
        return { start: getStartOfYearStr(), end: today, label: 'This Year' }
      case 'custom':
        return {
          start: customStartDate || '',
          end: customEndDate || '',
          label: `Custom (${customStartDate || 'Any'} to ${customEndDate || 'Any'})`
        }
      case 'all_time':
      default:
        return { start: '', end: '', label: 'All Time' }
    }
  }, [datePreset, customStartDate, customEndDate])

  // ───────────────────────────────────────────────────────────────────────────
  // Filtered Appointments
  // ───────────────────────────────────────────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      // Date range filter
      if (activeDateRange.start && appt.date < activeDateRange.start) return false
      if (activeDateRange.end && appt.date > activeDateRange.end) return false

      // Officer filter
      if (selectedOfficer !== 'all' && appt.officer !== selectedOfficer) return false

      // Status filter
      if (selectedStatus !== 'all' && appt.status !== selectedStatus) return false

      // Category filter
      if (selectedCategory !== 'all') {
        const isOfficial = isOfficialMeeting(appt)
        if (selectedCategory === 'Official Meeting' && !isOfficial) return false
        if (selectedCategory === 'Public Consultation' && isOfficial) return false
      }

      // Province filter
      if (selectedProvince !== 'all' && appt.province !== selectedProvince) return false

      // Search query filter (name, refNo, reason, organization, nic)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = (appt.name || '').toLowerCase().includes(q)
        const matchesRef = (appt.refNo || '').toLowerCase().includes(q)
        const matchesReason = (appt.reason || '').toLowerCase().includes(q)
        const matchesOrg = (appt.organization || '').toLowerCase().includes(q)
        const matchesNic = (appt.nic || '').toLowerCase().includes(q)
        if (!matchesName && !matchesRef && !matchesReason && !matchesOrg && !matchesNic) {
          return false
        }
      }

      return true
    })
  }, [
    appointments,
    activeDateRange,
    selectedOfficer,
    selectedStatus,
    selectedCategory,
    selectedProvince,
    searchQuery
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // Key Evaluation Metrics & KPIs
  // ───────────────────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = filteredAppointments.length
    const completed = filteredAppointments.filter(a => a.status === 'Completed').length
    const confirmed = filteredAppointments.filter(a => a.status === 'Confirmed').length
    const pending = filteredAppointments.filter(a => a.status === 'Pending').length
    const cancelled = filteredAppointments.filter(a => a.status === 'Cancelled').length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const confirmedRate = total > 0 ? Math.round((confirmed / total) * 100) : 0
    const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

    // Consultation & meeting duration metrics (default 15 mins)
    const totalMinutes = filteredAppointments.reduce((acc, a) => {
      const dur = parseInt(a.duration, 10) || 15
      return acc + dur
    }, 0)

    const completedMinutes = filteredAppointments
      .filter(a => a.status === 'Completed')
      .reduce((acc, a) => acc + (parseInt(a.duration, 10) || 15), 0)

    const avgDuration = total > 0 ? Math.round(totalMinutes / total) : 15
    const totalHours = (totalMinutes / 60).toFixed(1)
    const completedHours = (completedMinutes / 60).toFixed(1)

    // Efficiency grade rating
    let efficiencyGrade = { label: 'Optimal', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' }
    if (total === 0) {
      efficiencyGrade = { label: 'No Data', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' }
    } else if (completionRate >= 75) {
      efficiencyGrade = { label: 'Optimal Throughput', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' }
    } else if (completionRate >= 50) {
      efficiencyGrade = { label: 'Good Throughput', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' }
    } else if (completionRate >= 25 || confirmedRate >= 50) {
      efficiencyGrade = { label: 'In Progress / Scheduled', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' }
    } else {
      efficiencyGrade = { label: 'Requires Attention', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' }
    }

    return {
      total,
      completed,
      confirmed,
      pending,
      cancelled,
      completionRate,
      confirmedRate,
      pendingRate,
      cancellationRate,
      totalMinutes,
      completedMinutes,
      avgDuration,
      totalHours,
      completedHours,
      efficiencyGrade
    }
  }, [filteredAppointments])

  // ───────────────────────────────────────────────────────────────────────────
  // Officer Breakdown Evaluation
  // ───────────────────────────────────────────────────────────────────────────
  const officerBreakdown = useMemo(() => {
    const officers = ['Secretary', 'Deputy Minister', 'Minister']
    return officers.map(officerName => {
      const list = filteredAppointments.filter(a => a.officer === officerName)
      const count = list.length
      const comp = list.filter(a => a.status === 'Completed').length
      const conf = list.filter(a => a.status === 'Confirmed').length
      const pend = list.filter(a => a.status === 'Pending').length
      const canc = list.filter(a => a.status === 'Cancelled').length
      const rate = count > 0 ? Math.round((comp / count) * 100) : 0
      const mins = list.reduce((acc, a) => acc + (parseInt(a.duration, 10) || 15), 0)
      const hours = (mins / 60).toFixed(1)

      return {
        name: officerName,
        total: count,
        completed: comp,
        confirmed: conf,
        pending: pend,
        cancelled: canc,
        completionRate: rate,
        totalHours: hours,
        totalMins: mins
      }
    })
  }, [filteredAppointments])

  // ───────────────────────────────────────────────────────────────────────────
  // Daily Volume & Status Trend Timeline
  // ───────────────────────────────────────────────────────────────────────────
  const dailyTimeline = useMemo(() => {
    const map = {}
    filteredAppointments.forEach(appt => {
      const d = appt.date || 'Unknown'
      if (!map[d]) {
        map[d] = { date: d, total: 0, completed: 0, confirmed: 0, pending: 0, cancelled: 0 }
      }
      map[d].total += 1
      if (appt.status === 'Completed') map[d].completed += 1
      else if (appt.status === 'Confirmed') map[d].confirmed += 1
      else if (appt.status === 'Pending') map[d].pending += 1
      else if (appt.status === 'Cancelled') map[d].cancelled += 1
    })

    const sortedDays = Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
    // Limit to latest 14 entries for clean display if there are many days
    return sortedDays.slice(-14)
  }, [filteredAppointments])

  const maxDailyCount = useMemo(() => {
    if (dailyTimeline.length === 0) return 1
    return Math.max(...dailyTimeline.map(d => d.total), 1)
  }, [dailyTimeline])

  // ───────────────────────────────────────────────────────────────────────────
  // Meeting Category Breakdown (Public vs Official)
  // ───────────────────────────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const officialList = filteredAppointments.filter(a => isOfficialMeeting(a))
    const publicList = filteredAppointments.filter(a => !isOfficialMeeting(a))

    const getStats = (list) => {
      const total = list.length
      const completed = list.filter(a => a.status === 'Completed').length
      const confirmed = list.filter(a => a.status === 'Confirmed').length
      const pending = list.filter(a => a.status === 'Pending').length
      const cancelled = list.filter(a => a.status === 'Cancelled').length
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0
      const totalMins = list.reduce((acc, a) => acc + (parseInt(a.duration, 10) || 15), 0)
      const avgDur = total > 0 ? Math.round(totalMins / total) : 15
      return { total, completed, confirmed, pending, cancelled, rate, totalMins, avgDur }
    }

    return {
      official: getStats(officialList),
      public: getStats(publicList)
    }
  }, [filteredAppointments])

  // ───────────────────────────────────────────────────────────────────────────
  // Top Provinces Breakdown
  // ───────────────────────────────────────────────────────────────────────────
  const provinceBreakdown = useMemo(() => {
    const map = {}
    filteredAppointments.forEach(a => {
      const p = a.province || 'Unspecified'
      if (p !== 'N/A') {
        map[p] = (map[p] || 0) + 1
      }
    })
    return Object.entries(map)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredAppointments])

  // ───────────────────────────────────────────────────────────────────────────
  // Cancellation Reasons Analysis
  // ───────────────────────────────────────────────────────────────────────────
  const cancellationAnalysis = useMemo(() => {
    const cancelledList = filteredAppointments.filter(a => a.status === 'Cancelled')
    const reasonsMap = {}
    cancelledList.forEach(a => {
      const remark = a.cancellationRemark?.trim() || 'No explicit remark provided'
      reasonsMap[remark] = (reasonsMap[remark] || 0) + 1
    })
    return Object.entries(reasonsMap)
      .map(([remark, count]) => ({ remark, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }, [filteredAppointments])

  // ───────────────────────────────────────────────────────────────────────────
  // Sorted Table List
  // ───────────────────────────────────────────────────────────────────────────
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      let valA = a[sortField] || ''
      let valB = b[sortField] || ''

      if (sortField === 'duration') {
        valA = parseInt(valA, 10) || 15
        valB = parseInt(valB, 10) || 15
        return sortAsc ? valA - valB : valB - valA
      }

      valA = String(valA).toLowerCase()
      valB = String(valB).toLowerCase()
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredAppointments, sortField, sortAsc])

  const totalPages = Math.max(1, Math.ceil(sortedAppointments.length / pageSize))
  const paginatedAppointments = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return sortedAppointments.slice(start, start + pageSize)
  }, [sortedAppointments, tablePage, pageSize])

  // Reset pagination when filters change
  const handleFilterChange = (setter, val) => {
    setter(val)
    setTablePage(1)
  }

  const handleResetFilters = () => {
    setDatePreset('all_time')
    setSelectedOfficer('all')
    setSelectedStatus('all')
    setSelectedCategory('all')
    setSelectedProvince('all')
    setSearchQuery('')
    setTablePage(1)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Export & Copy Helpers
  // ───────────────────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredAppointments.length === 0) {
      alert('No appointments to export for the selected evaluation filter.')
      return
    }

    const headers = [
      'Ref No',
      'Name',
      'Officer',
      'Meeting Category',
      'Date',
      'Time',
      'Duration (Mins)',
      'Status',
      'Province',
      'District',
      'Reason',
      'Remarks'
    ]

    const rows = filteredAppointments.map(a => [
      `"${a.refNo || ''}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.officer || ''}"`,
      `"${isOfficialMeeting(a) ? 'Official Meeting' : 'Public Consultation'}"`,
      `"${a.date || ''}"`,
      `"${a.time || ''}"`,
      a.duration || 15,
      `"${a.status || ''}"`,
      `"${a.province || ''}"`,
      `"${a.district || ''}"`,
      `"${(a.reason || '').replace(/"/g, '""')}"`,
      `"${(a.cancellationRemark || a.completionRemark || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `appointment_efficiency_report_${getTodayStr()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopySummary = () => {
    const summaryText = `
=== MINISTRY APPOINTMENT EFFICIENCY EVALUATION ===
Period: ${activeDateRange.label}
Officer Scope: ${selectedOfficer === 'all' ? 'All Ministerial Officers' : selectedOfficer}
Status Filter: ${selectedStatus === 'all' ? 'All Statuses' : selectedStatus}
Category: ${selectedCategory === 'all' ? 'All Categories' : selectedCategory}
--------------------------------------------------
Total Evaluated Appointments: ${metrics.total}
• Completed:  ${metrics.completed} (${metrics.completionRate}%)
• Confirmed:  ${metrics.confirmed} (${metrics.confirmedRate}%)
• Pending:    ${metrics.pending} (${metrics.pendingRate}%)
• Cancelled:  ${metrics.cancelled} (${metrics.cancellationRate}%)
--------------------------------------------------
Operational Hours Logged:     ${metrics.totalHours} hrs (${metrics.completedHours} hrs completed)
Average Session Duration:     ${metrics.avgDuration} minutes (Default 15m)
Operational Rating:           ${metrics.efficiencyGrade.label}
Report Generated:             ${new Date().toLocaleString()}
`.trim()

    navigator.clipboard.writeText(summaryText)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2500)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section 1: Dashboard Header & Action Bar */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Efficiency & Evaluation Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Overall evaluation of total appointments, status throughput, and operational efficiency metrics.
                {currentUser?.role && (
                  <span className="ml-2 font-bold text-indigo-600 dark:text-indigo-400">
                    • Session: {currentUser.role}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export, Copy & Quick Schedule */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('booking')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Book Appointment</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section 2: Date Period Adjuster & Metric Filter Toolbar */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Evaluation Filters & Date Period Controls
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Reset All Filters
          </button>
        </div>

        {/* Date Period Presets */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            1. Select Evaluation Date Period
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { id: 'all_time', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last_7_days', label: 'Last 7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range...' }
            ].map((preset) => {
              const isSelected = datePreset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleFilterChange(setDatePreset, preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Date Pickers (visible when custom preset or expandable) */}
        {datePreset === 'custom' && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => handleFilterChange(setCustomStartDate, e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => handleFilterChange(setCustomEndDate, e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Secondary Filter Row: Officer, Status, Category, Province, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Officer Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Ministerial Officer
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => handleFilterChange(setSelectedOfficer, e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Officers (3)</option>
              <option value="Secretary">Secretary of Ministry</option>
              <option value="Deputy Minister">Hon. Deputy Minister</option>
              <option value="Minister">Hon. Cabinet Minister</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Appointment Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses (4)</option>
              <option value="Completed">Completed</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending Review</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Meeting Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Meeting Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange(setSelectedCategory, e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Public Consultation">Public Consultation</option>
              <option value="Official Meeting">Official Meeting</option>
            </select>
          </div>

          {/* Province Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Province
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => handleFilterChange(setSelectedProvince, e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Provinces (9)</option>
              {SRI_LANKA_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Search Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, Ref No, Reason..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Current Active Slice Banner */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>
              Evaluating <strong>{metrics.total}</strong> appointments in <strong>{activeDateRange.label}</strong>
              {selectedOfficer !== 'all' ? ` for ${selectedOfficer}` : ''}
              {selectedStatus !== 'all' ? ` (${selectedStatus} only)` : ''}
            </span>
          </div>

          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            Default Session Window: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">15 mins</span>
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section 3: Primary Evaluation KPI Metrics Cards */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Total Appointments */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/30 to-purple-600/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Evaluated
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">sessions</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Across chosen period & filters</span>
          </div>
        </div>

        {/* KPI 2: Completion Rate / Operational Efficiency */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/30 to-teal-600/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Completion Rate
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${metrics.efficiencyGrade.bg} ${metrics.efficiencyGrade.color}`}>
              {metrics.efficiencyGrade.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.completionRate}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              ({metrics.completed} resolved)
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Successfully served & documented</span>
          </div>
        </div>

        {/* KPI 3: Operational Hours Logged */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-600/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Consultation Time Logged
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400">
              {metrics.totalHours}
            </span>
            <span className="text-xs text-purple-500 font-bold">hours</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Avg {metrics.avgDuration}m / appointment</span>
          </div>
        </div>

        {/* KPI 4: Pending Backlog & Cancellation Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/30 to-rose-600/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Active Backlog / Drops
          </p>
          <div className="flex items-baseline gap-3 mt-2">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {metrics.pending}
              </span>
              <span className="text-[10px] text-amber-500 block font-bold">Pending ({metrics.pendingRate}%)</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 text-xl font-light">/</span>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                {metrics.cancelled}
              </span>
              <span className="text-[10px] text-rose-500 block font-bold">Cancelled ({metrics.cancellationRate}%)</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{metrics.confirmed} confirmed on schedule</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section 4: Visual Status Breakdown & Timeline Evaluation Chart */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Progress & Cards (Col 1) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <span>Status Evaluation Distribution</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {metrics.total} Total
            </span>
          </div>

          {/* Segmented Stacked Progress Bar */}
          <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-0.5">
            {metrics.completed > 0 && (
              <div
                style={{ width: `${(metrics.completed / metrics.total) * 100}%` }}
                className="h-full bg-emerald-500 rounded-sm transition-all"
                title={`Completed: ${metrics.completed} (${metrics.completionRate}%)`}
              />
            )}
            {metrics.confirmed > 0 && (
              <div
                style={{ width: `${(metrics.confirmed / metrics.total) * 100}%` }}
                className="h-full bg-blue-500 rounded-sm transition-all"
                title={`Confirmed: ${metrics.confirmed} (${metrics.confirmedRate}%)`}
              />
            )}
            {metrics.pending > 0 && (
              <div
                style={{ width: `${(metrics.pending / metrics.total) * 100}%` }}
                className="h-full bg-amber-500 rounded-sm transition-all"
                title={`Pending: ${metrics.pending} (${metrics.pendingRate}%)`}
              />
            )}
            {metrics.cancelled > 0 && (
              <div
                style={{ width: `${(metrics.cancelled / metrics.total) * 100}%` }}
                className="h-full bg-rose-500 rounded-sm transition-all"
                title={`Cancelled: ${metrics.cancelled} (${metrics.cancellationRate}%)`}
              />
            )}
            {metrics.total === 0 && (
              <div className="h-full w-full bg-slate-300 dark:bg-slate-700 rounded-sm" />
            )}
          </div>

          {/* Status Breakdown Pills */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Completed */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Completed
                </span>
                <span>{metrics.completionRate}%</span>
              </div>
              <p className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                {metrics.completed}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                {metrics.completedHours}h consultation time
              </p>
            </div>

            {/* Confirmed */}
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Confirmed
                </span>
                <span>{metrics.confirmedRate}%</span>
              </div>
              <p className="text-xl font-black text-blue-800 dark:text-blue-200 mt-1">
                {metrics.confirmed}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                Active & on-schedule
              </p>
            </div>

            {/* Pending */}
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Pending
                </span>
                <span>{metrics.pendingRate}%</span>
              </div>
              <p className="text-xl font-black text-amber-800 dark:text-amber-200 mt-1">
                {metrics.pending}
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                Requires ministerial review
              </p>
            </div>

            {/* Cancelled */}
            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Cancelled
                </span>
                <span>{metrics.cancellationRate}%</span>
              </div>
              <p className="text-xl font-black text-rose-800 dark:text-rose-200 mt-1">
                {metrics.cancelled}
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                Expired or user cancelled
              </p>
            </div>
          </div>
        </div>

        {/* Timeline / Daily Volume Activity Chart (Cols 2-3) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span>Timeline Volume & Status Trend</span>
              </h3>
              <p className="text-xs text-slate-400">
                Daily evaluation across the evaluated dates ({dailyTimeline.length} active dates logged).
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Confirmed
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Cancelled
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          {dailyTimeline.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="h-44 sm:h-52 flex items-end gap-2 sm:gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 px-1">
                {dailyTimeline.map((item) => {
                  const heightPercent = Math.max(10, Math.round((item.total / maxDailyCount) * 100))
                  const compPct = (item.completed / item.total) * 100
                  const confPct = (item.confirmed / item.total) * 100
                  const pendPct = (item.pending / item.total) * 100
                  const cancPct = (item.cancelled / item.total) * 100

                  return (
                    <div
                      key={item.date}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold py-1.5 px-2.5 rounded-xl shadow-xl whitespace-nowrap space-y-0.5 border border-slate-700">
                          <p className="font-extrabold text-indigo-400 dark:text-indigo-600">{item.date}</p>
                          <p>Total: {item.total} appointments</p>
                          <p className="text-emerald-400 dark:text-emerald-600">Completed: {item.completed}</p>
                          <p className="text-blue-400 dark:text-blue-600">Confirmed: {item.confirmed}</p>
                          <p className="text-amber-400 dark:text-amber-600">Pending: {item.pending}</p>
                          <p className="text-rose-400 dark:text-rose-600">Cancelled: {item.cancelled}</p>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 dark:bg-white rotate-45 -mt-1" />
                      </div>

                      {/* Daily Count Label above bar */}
                      <span className="text-[10px] font-black text-slate-500 mb-1 opacity-80 group-hover:opacity-100">
                        {item.total}
                      </span>

                      {/* Stacked Vertical Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col-reverse overflow-hidden transition-all duration-300 group-hover:ring-2 group-hover:ring-indigo-400"
                      >
                        {item.completed > 0 && (
                          <div style={{ height: `${compPct}%` }} className="bg-emerald-500 w-full" />
                        )}
                        {item.confirmed > 0 && (
                          <div style={{ height: `${confPct}%` }} className="bg-blue-500 w-full" />
                        )}
                        {item.pending > 0 && (
                          <div style={{ height: `${pendPct}%` }} className="bg-amber-500 w-full" />
                        )}
                        {item.cancelled > 0 && (
                          <div style={{ height: `${cancPct}%` }} className="bg-rose-500 w-full" />
                        )}
                      </div>

                      {/* Date label */}
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 truncate max-w-full">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span>Peak Volume: <strong>{maxDailyCount}</strong> / day</span>
                <span>Hover over bars for daily status drill-down</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No appointments scheduled for the selected evaluation period.
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section 5: Officer Performance & Workload Breakdown */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Ministerial Officer Evaluation Matrix</span>
            </h3>
            <p className="text-xs text-slate-400">
              Comparative throughput, session completion, and consultation duration across the 3 ministerial desks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {officerBreakdown.map((officer) => {
            const officerMeta = MINISTERIAL_OFFICERS.find(o => o.role === officer.name)
            return (
              <div
                key={officer.name}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {officerMeta?.title || officer.name}
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {officerMeta?.badge || officer.name}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-xl text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {officer.total} sessions
                  </span>
                </div>

                {/* Progress bar of officer's completion */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">Completion Efficiency</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{officer.completionRate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${officer.completionRate}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-4 gap-1 text-center pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="p-1.5 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/30">
                    <span className="text-[10px] font-bold text-emerald-600 block">Done</span>
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">{officer.completed}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-100/50 dark:bg-blue-950/30">
                    <span className="text-[10px] font-bold text-blue-600 block">Active</span>
                    <span className="text-xs font-black text-blue-800 dark:text-blue-200">{officer.confirmed}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-100/50 dark:bg-amber-950/30">
                    <span className="text-[10px] font-bold text-amber-600 block">Pend</span>
                    <span className="text-xs font-black text-amber-800 dark:text-amber-200">{officer.pending}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-rose-100/50 dark:bg-rose-950/30">
                    <span className="text-[10px] font-bold text-rose-600 block">Canc</span>
                    <span className="text-xs font-black text-rose-800 dark:text-rose-200">{officer.cancelled}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                  <span>Logged Consultation Time:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{officer.totalHours} hrs</strong>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section 6: Category, Regional, and Root Cause Insights */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Meeting Category Comparison</span>
          </h3>

          <div className="space-y-3">
            {/* Public Consultation */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-800 dark:text-blue-300">
                  Public Citizen Consultations
                </span>
                <span className="text-xs font-black text-blue-600">
                  {categoryBreakdown.public.total}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Completed: {categoryBreakdown.public.completed} ({categoryBreakdown.public.rate}%)</span>
                <span>Avg: {categoryBreakdown.public.avgDur}m</span>
              </div>
            </div>

            {/* Official Meeting */}
            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-800 dark:text-purple-300">
                  Official Inter-Agency Meetings
                </span>
                <span className="text-xs font-black text-purple-600">
                  {categoryBreakdown.official.total}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Completed: {categoryBreakdown.official.completed} ({categoryBreakdown.official.rate}%)</span>
                <span>Avg: {categoryBreakdown.official.avgDur}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Provinces */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Top Regional Representation</span>
          </h3>

          {provinceBreakdown.length > 0 ? (
            <div className="space-y-2.5">
              {provinceBreakdown.map((item, idx) => {
                const pct = metrics.total > 0 ? Math.round((item.count / metrics.total) * 100) : 0
                return (
                  <div key={item.province} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>#{idx + 1} {item.province} Province</span>
                      <span>{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No regional data for current filter.</p>
          )}
        </div>

        {/* Cancellation Insights */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Cancellation Root Causes</span>
          </h3>

          {cancellationAnalysis.length > 0 ? (
            <div className="space-y-2">
              {cancellationAnalysis.map((item) => (
                <div
                  key={item.remark}
                  className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-start justify-between gap-2"
                >
                  <p className="text-xs text-rose-800 dark:text-rose-300 font-medium line-clamp-2">
                    {item.remark}
                  </p>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 shrink-0">
                    {item.count}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              Zero cancellations in the selected evaluation window!
            </p>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Section 7: Filtered Records Data Table */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Evaluated Appointments Audit Log</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {sortedAppointments.length} records
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit and inspect appointments contributing to the metrics above.
            </p>
          </div>

          {/* Quick Sort Field selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="date">Date</option>
              <option value="status">Status</option>
              <option value="duration">Duration</option>
              <option value="officer">Officer</option>
            </select>
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              title={sortAsc ? 'Ascending' : 'Descending'}
            >
              {sortAsc ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Ref & Subject</th>
                <th className="py-3 px-4">Officer & Scope</th>
                <th className="py-3 px-4">Date & Time Range</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {paginatedAppointments.length > 0 ? (
                paginatedAppointments.map((appt) => {
                  const isOfficial = isOfficialMeeting(appt)
                  const dur = parseInt(appt.duration, 10) || 15

                  const statusBadges = {
                    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                    Confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                    Cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }

                  return (
                    <tr
                      key={appt.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Ref & Subject */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                            {appt.refNo}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            isOfficial ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {isOfficial ? 'Official' : 'Citizen'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                          {appt.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">
                          {appt.reason}
                        </p>
                      </td>

                      {/* Officer & Location */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {appt.officer}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {appt.district ? `${appt.district}, ${appt.province}` : (appt.venue || 'Ministry')}
                        </span>
                      </td>

                      {/* Date & Time Range */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">
                          {appt.date}
                        </span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {getAppointmentTimeRange(appt.time, dur)}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                          {formatDurationLabel(dur)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusBadges[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                          {appt.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectedAppt(appt)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No appointment records match the active evaluation filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <strong>{tablePage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={tablePage === 1}
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={tablePage === totalPages}
                onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Detail Modal Inspection */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {inspectedAppt && (
        <AppointmentDetailsModal
          appointment={inspectedAppt}
          onClose={() => setInspectedAppt(null)}
          onUpdateStatus={onUpdateStatus}
          onUpdateTime={onUpdateTime}
          onResendNotification={onResendNotification}
        />
      )}
    </div>
  )
}
