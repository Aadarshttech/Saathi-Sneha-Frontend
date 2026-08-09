import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity, HeartPulse, Pill, Stethoscope, FlaskConical,
  CalendarCheck, ArrowRight, CheckCircle2, Phone,
  PersonStanding, Brain, Ambulance, Users, HelpCircle,
} from 'lucide-react'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Home Care Services | Saathi Sneha Care',
  description: 'Comprehensive home health services in Nepal — nursing visits, chronic disease monitoring, medication management, lab coordination, and more.',
}

// Map service codes to icons
const CODE_ICONS: Record<string, React.ElementType> = {
  wellness_check:               Activity,
  chronic_disease_monitoring:   HeartPulse,
  medication_management:        Pill,
  doctor_consultation:          Stethoscope,
  lab_coordination:             FlaskConical,
  post_hospital_care:           CalendarCheck,
  physiotherapy:                PersonStanding,
  mental_wellness_check:        Brain,
  hospital_escort:              Ambulance,
  caregiver_support:            Users,
}

const CATEGORY_LABELS: Record<string, string> = {
  scheduled:  'Scheduled Services',
  on_demand:  'On-Demand Services',
}

export default async function ServicesPage() {
  const services = [
    { category: 'scheduled', code: 'wellness_check', nameEn: 'Wellness Check', nameNp: 'स्वास्थ्य परीक्षण', descriptionEn: 'Routine physical examinations and vitals monitoring.', requiresNurse: true, requiresProvider: false, isSameDay: false, defaultDurationMin: 45 },
    { category: 'scheduled', code: 'chronic_disease_monitoring', nameEn: 'Chronic Care', nameNp: 'दीर्घकालीन हेरचाह', descriptionEn: 'Continuous monitoring for diabetes, hypertension, etc.', requiresNurse: true, requiresProvider: true, isSameDay: false, defaultDurationMin: 60 },
    { category: 'scheduled', code: 'medication_management', nameEn: 'Medication', nameNp: 'औषधी व्यवस्थापन', descriptionEn: 'Ensuring timely and correct medication intake.', requiresNurse: true, requiresProvider: false, isSameDay: false, defaultDurationMin: 30 },
    { category: 'on_demand', code: 'doctor_consultation', nameEn: 'Doctor Consult', nameNp: 'डाक्टर परामर्श', descriptionEn: 'In-home or virtual consultations with specialists.', requiresNurse: false, requiresProvider: true, isSameDay: true, defaultDurationMin: 45 },
    { category: 'scheduled', code: 'lab_coordination', nameEn: 'Lab Tests', nameNp: 'ल्याब परीक्षण', descriptionEn: 'At-home sample collection and fast results.', requiresNurse: true, requiresProvider: false, isSameDay: true, defaultDurationMin: 30 },
    { category: 'scheduled', code: 'post_hospital_care', nameEn: 'Post-Hospital', nameNp: 'अस्पताल पछिको हेरचाह', descriptionEn: 'Dedicated care after discharge to ensure smooth recovery.', requiresNurse: true, requiresProvider: true, isSameDay: false, defaultDurationMin: 90 },
  ]

  // Group by category
  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    const cat = s.category as string
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-brand-surface border-b border-brand-border py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-semibold text-brand-red uppercase tracking-widest mb-1">What We Offer</p>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">Home Care Services</h1>
          <p className="text-gray-500 text-sm">
            Delivered at your parents&apos; home by trained professionals. {services.length} services available.
          </p>
        </div>
      </section>

      {/* Services by category */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-widest mb-4 pb-2 border-b border-brand-border">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(service => {
                  const Icon = CODE_ICONS[service.code] ?? HelpCircle
                  return (
                    <div key={service.code} className="flex gap-3 p-4 rounded-xl border border-brand-border bg-white hover:border-brand-red hover:shadow-sm transition-all">
                      <div className="w-9 h-9 rounded-lg bg-brand-red/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-brand-red" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-dark text-sm leading-tight">{service.nameEn}</p>
                        {service.nameNp && (
                          <p className="text-[11px] text-gray-400 font-nepali leading-tight">{service.nameNp}</p>
                        )}
                        <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-2">{service.descriptionEn}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {service.requiresNurse    && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">Nurse</span>}
                          {service.requiresProvider && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full border border-purple-100">Doctor</span>}
                          {service.isSameDay        && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full border border-green-100">Same Day</span>}
                          <span className="text-[10px] text-gray-400 px-1.5 py-0.5">{service.defaultDurationMin} min</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No services available yet. Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 bg-brand-dark text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-lg font-bold mb-1">Not sure which service you need?</h2>
          <p className="text-white/70 text-sm mb-4">Our care team will assess your parents&apos; needs and recommend the right combination — for free.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-red text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-red-dark transition-colors text-sm">
              <Phone className="w-4 h-4" /> Book Free Assessment
            </Link>
            <Link href="/plans" className="inline-flex items-center gap-2 border border-white/30 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm">
              See Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
