export const NEPAL_PROVINCES = [
  { value: 'koshi',         label: 'Koshi Province' },
  { value: 'madhesh',       label: 'Madhesh Province' },
  { value: 'bagmati',       label: 'Bagmati Province' },
  { value: 'gandaki',       label: 'Gandaki Province' },
  { value: 'lumbini',       label: 'Lumbini Province' },
  { value: 'karnali',       label: 'Karnali Province' },
  { value: 'sudurpashchim', label: 'Sudurpashchim Province' },
] as const

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export const INSURANCE_SCHEMES = [
  { value: 'none',       label: 'None / Self-Pay' },
  { value: 'nsia',       label: 'NSIA' },
  { value: 'sehat_bima', label: 'Sehat Bima Yojana' },
  { value: 'ssf',        label: 'SSF (Social Security Fund)' },
  { value: 'private',    label: 'Private Insurance' },
] as const

export const VISIT_STATUS_LABELS: Record<string, string> = {
  requested:   'Requested',
  scheduled:   'Scheduled',
  en_route:    'En Route',
  checked_in:  'Checked In',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  missed:      'Missed',
}

export const VISIT_STATUS_COLORS: Record<string, string> = {
  requested:   'bg-pink-100 text-pink-800',
  scheduled:   'bg-blue-100 text-blue-800',
  en_route:    'bg-yellow-100 text-yellow-800',
  checked_in:  'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-gray-100 text-gray-600',
  missed:      'bg-red-100 text-red-800',
}

export const SERVICE_CODE_LABELS: Record<string, string> = {
  wellness_check:              'Wellness Check',
  chronic_disease_monitoring:  'Chronic Disease Monitoring',
  medication_management:       'Medication Management',
  doctor_consultation:         'Doctor Consultation',
  lab_coordination:            'Lab Coordination',
  physiotherapy:               'Physiotherapy',
  post_hospital_care:          'Post-Hospital Care',
  hospital_escort:             'Hospital Escort',
  caregiver_support:           'Caregiver Support',
  mental_wellness_check:       'Mental Wellness Check',
  urgent_nurse_visit:          'Urgent Nurse Visit',
  doctor_on_call:              'Doctor On Call',
  ambulance_coordination:      'Ambulance Coordination',
  hospital_admission_support:  'Hospital Admission Support',
  medicine_delivery:           'Medicine Delivery',
  family_video_update:         'Family Video Update',
}

export const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? 'default-org'

// Direct-chat links — WhatsApp uses the same number listed on the Contact page.
// TODO: replace with the real Facebook Page username/ID and Instagram handle.
export const WHATSAPP_NUMBER        = '9771400000'
export const FACEBOOK_PAGE_USERNAME = 'XXXXX'
export const INSTAGRAM_USERNAME     = 'XXXXX'
