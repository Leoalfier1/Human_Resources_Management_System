// ── Shared constants for PD Program dropdowns ─────────────────────────────
// Used in both Admin Portal (LDPortalPDProgram) and Employee Portal (LDEmployeeProposeProgram)
// so that filter/matching logic in Browse PD Programs, Attendance Monitor, etc. always aligns.

export const TRAINING_CATEGORIES = [
  'School-Based Learning Action Cell (LAC)',
  'Seminar-Workshop',
  'Coaching & Mentoring',
  'Division-Wide Training',
  'Webinar/Online Course',
  'Conference/Symposium',
  'Action Research',
  'ICT Integration Training',
  'Leadership & Management',
  'Other',
];

export const DELIVERY_MODES = [
  'Face-to-Face',
  'Online/Virtual',
  'Blended',
];

/** label → numeric hours for DB storage */
export const DURATION_OPTIONS = [
  { label: 'Half-day (4 hours)',  hours: 4  },
  { label: '1 day (8 hours)',     hours: 8  },
  { label: '2 days (16 hours)',   hours: 16 },
  { label: '3 days (24 hours)',   hours: 24 },
  { label: '5 days (40 hours)',   hours: 40 },
  { label: 'Other',               hours: null },
];

export const PARTICIPANT_TYPES = [
  { value: 'teaching',     label: 'Teaching'          },
  { value: 'non_teaching', label: 'Non-teaching'       },
  { value: 'all',          label: 'Mixed (All staff)'  },
];

/** Map legacy free-text duration strings to matching option labels */
export function normalizeDurationLabel(raw) {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower.includes('24') || lower.includes('3 day')) return '3 days (24 hours)';
  if (lower.includes('16') || lower.includes('2 day')) return '2 days (16 hours)';
  if (lower.includes('40') || lower.includes('5 day')) return '5 days (40 hours)';
  if (lower.includes('8')  || lower.includes('1 day')) return '1 day (8 hours)';
  if (lower.includes('4')  || lower.includes('half'))  return 'Half-day (4 hours)';
  // If it doesn't match a preset, treat as "Other"
  return 'Other';
}

/** Map legacy target_participants strings to participant_type value */
export function normalizeParticipantType(raw) {
  if (!raw) return 'all';
  const lower = raw.toLowerCase();
  if (lower.includes('non-teaching') || lower.includes('non teaching')) return 'non_teaching';
  if (lower.includes('teaching')) return 'teaching';
  return 'all';
}

/** Extract numeric count from legacy "80 Teaching Personnel" strings */
export function extractParticipantCount(raw) {
  if (!raw) return '';
  const match = raw.match(/\d+/);
  return match ? match[0] : '';
}
