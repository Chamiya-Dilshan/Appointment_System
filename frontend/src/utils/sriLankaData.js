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

export const parseInputTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export const parseTimeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (modifier === 'PM' && hours < 12) hours += 12
  if (modifier === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

export const formatTime = (timeStr) => {
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12
  return `${formattedHour}:${minStr} ${ampm}`
}

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

