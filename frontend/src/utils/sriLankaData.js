// Standard 30-minute interval time slots from 9:00 AM to 5:00 PM
export const TIME_SLOTS = [
  { value: "09:00", label: "09:00 AM" },
  { value: "09:30", label: "09:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "13:30", label: "01:30 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "14:30", label: "02:30 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "15:30", label: "03:30 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "16:30", label: "04:30 PM" },
  { value: "17:00", label: "05:00 PM" }
]

export const SRI_LANKA_PROVINCES = [
  "Western", "Central", "Southern", "Northern", "Eastern",
  "North Western", "North Central", "Uva", "Sabaragamuwa"
]

export const PROVINCES_AND_DISTRICTS = {
  "Western": ["Colombo", "Gampaha", "Kalutara"],
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern": ["Galle", "Matara", "Hambantota"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  "Eastern": ["Ampara", "Batticaloa", "Trincomalee"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Uva": ["Badulla", "Moneragala"],
  "Sabaragamuwa": ["Kegalle", "Ratnapura"]
}

export const MINISTERIAL_OFFICERS = [
  {
    role: "Secretary",
    title: "Secretary of Ministry",
    description: "Administrative governance, policy inquiries, ministerial circulars & official approvals",
    badge: "Administrative Head",
    scheduleNote: "Public Day: Every Monday (Full Day)",
    morningOnly: false
  },
  {
    role: "Deputy Minister",
    title: "Hon. Deputy Minister",
    description: "Public affairs, district coordination, provincial development & citizen delegations",
    badge: "Ministerial Affairs",
    scheduleNote: "Public Day: Every Monday (Full Day)",
    morningOnly: false
  },
  {
    role: "Minister",
    title: "Hon. Cabinet Minister",
    description: "High-level policy discussions, special representations & executive review sessions",
    badge: "Executive Leadership",
    scheduleNote: "Public Day: Every Monday (Morning Session Only)",
    morningOnly: true
  }
]

export const generateRefNo = () => {
  return 'APT-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const isOfficialMeeting = (appt) => {
  if (!appt) return false
  return (
    appt.meetingType === 'Official Meeting' ||
    (typeof appt.refNo === 'string' && appt.refNo.startsWith('OFF-')) ||
    appt.nic === 'OFFICIAL'
  )
}

export const getOfficialDetails = (appt) => {
  if (!appt) {
    return {
      meetingTitle: '',
      organization: '',
      leadOfficial: '',
      designation: '',
      venue: '',
      phone: '',
      email: '',
      meetingNotes: '',
    }
  }

  let leadOfficial = appt.leadOfficial || ''
  let designation = appt.designation || ''

  if (!leadOfficial && appt.name) {
    const match = appt.name.match(/^(.*?)(?:\s*\((.*?)\))?$/)
    if (match) {
      leadOfficial = match[1]?.trim() || appt.name
      if (!designation && match[2]) {
        designation = match[2]?.trim() || ''
      }
    } else {
      leadOfficial = appt.name
    }
  }

  const organization =
    appt.organization ||
    (appt.council && appt.council !== 'Ministry Office' && appt.council !== 'Ministry Headquarters'
      ? appt.council
      : '') ||
    'Ministry / Internal'

  const venue = appt.venue || appt.address || 'Ministry Headquarters'
  const meetingTitle = appt.meetingTitle || appt.reason || ''
  const meetingNotes =
    appt.meetingNotes ||
    (appt.status !== 'Completed' && appt.status !== 'Cancelled' ? appt.completionRemark : '') ||
    ''

  return {
    meetingTitle,
    organization,
    leadOfficial,
    designation,
    venue,
    phone: appt.phone || '',
    email: appt.email || '',
    meetingNotes,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME & DURATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const DURATION_OPTIONS = [
  { value: 15, label: '15 mins', shortLabel: '15' },
  { value: 30, label: '30 mins (Standard)', shortLabel: '30' },
  { value: 45, label: '45 mins (Extended)', shortLabel: '45' },
  { value: 60, label: '1 hour (60 mins)', shortLabel: '1' },
  { value: 75, label: '1.25 hours (75 mins)', shortLabel: '1.25' },
  { value: 90, label: '1.5 hours (90 mins)', shortLabel: '1.5' },
  { value: 120, label: '2 hours (120 mins)', shortLabel: '2' },
]

// Parse input time string in 24h format (e.g. "14:30") to minutes from midnight
export const parseInputTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

// Parse formatted appointment time string (e.g. "02:30 PM" or "14:30") to minutes from midnight
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const clean = timeStr.trim().toUpperCase()
  if (clean.includes('AM') || clean.includes('PM')) {
    const [time, modifier] = clean.split(/\s+/)
    let [hours, minutes] = time.split(':').map(Number)
    if (modifier === 'PM' && hours < 12) hours += 12
    if (modifier === 'AM' && hours === 12) hours = 0
    return (hours || 0) * 60 + (minutes || 0)
  }
  return parseInputTimeToMinutes(clean)
}

// Convert minutes from midnight to formatted AM/PM time string (e.g. 585 -> "09:45 AM")
export const minutesToFormattedTime = (totalMinutes) => {
  const norm = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(norm / 60)
  const minutes = norm % 60
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  const paddedMinutes = String(minutes).padStart(2, '0')
  return `${String(displayHour).padStart(2, '0')}:${paddedMinutes} ${ampm}`
}

// Convert 24h format time (e.g. "09:00") to 12h AM/PM (e.g. "09:00 AM")
export const formatTime = (timeStr) => {
  if (!timeStr) return ''
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12
  return `${String(formattedHour).padStart(2, '0')}:${minStr} ${ampm}`
}

// Format duration into a clean human label (e.g. 45 -> "45 mins", 60 -> "1 hour")
export const formatDurationLabel = (durationInMinutes) => {
  const mins = parseInt(durationInMinutes, 10) || 30
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// Calculate the full time range for an appointment (e.g. "09:00 AM – 09:45 AM")
export const getAppointmentTimeRange = (timeStr, duration = 30) => {
  if (!timeStr) return ''
  const startMins = parseTimeToMinutes(timeStr)
  const dur = parseInt(duration, 10) || 30
  const endMins = startMins + dur
  return `${formatTime(timeStr)} – ${minutesToFormattedTime(endMins)}`
}

// Check if a candidate time slot interval [slotStart, slotStart + slotDuration)
// overlaps with an appointment [apptStart, apptStart + apptDuration)
export const isSlotOverlappingAppointment = (slotValue, slotDuration = 30, apptTime, apptDuration = 30) => {
  const slotStart = typeof slotValue === 'number'
    ? slotValue
    : (slotValue.includes(' ') ? parseTimeToMinutes(slotValue) : parseInputTimeToMinutes(slotValue))
  const slotEnd = slotStart + (parseInt(slotDuration, 10) || 30)

  const apptStart = typeof apptTime === 'number'
    ? apptTime
    : parseTimeToMinutes(apptTime)
  const apptEnd = apptStart + (parseInt(apptDuration, 10) || 30)

  return slotStart < apptEnd && slotEnd > apptStart
}

