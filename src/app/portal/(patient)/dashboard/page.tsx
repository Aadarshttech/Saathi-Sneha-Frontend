import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import { paymentStatus } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar, Heart, UserPlus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import PatientActionLink from './patient-action-link'

// Confirms a just-completed Stripe checkout directly against Stripe's API, rather than
// relying solely on the webhook (api/billing/stripe/webhook) — webhooks are fragile in
// practice (misconfigured secret, unreachable localhost during dev, delivery delay), so
// this gives an immediate, authoritative fallback right when the user lands back here.
// Safe to call repeatedly: it only ever backfills stripeSubscriptionId if still unset.
async function confirmCheckoutIfNeeded(subscriptionId: string, checkoutSessionId: string, caregiverAccountId: string) {
  const sub = await prisma.patientSubscription.findUnique({
    where:  { id: subscriptionId },
    select: { id: true, stripeSubscriptionId: true, patient: { select: { caregiverAccountId: true } } },
  })
  if (!sub || sub.patient.caregiverAccountId !== caregiverAccountId) return
  if (sub.stripeSubscriptionId) return

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId)
    if (checkoutSession.metadata?.subscriptionId !== subscriptionId) return
    if (checkoutSession.payment_status !== 'paid') return

    const stripeSubscriptionId = typeof checkoutSession.subscription === 'string'
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id
    if (!stripeSubscriptionId) return

    await prisma.patientSubscription.update({
      where: { id: subscriptionId },
      data:  { stripeSubscriptionId, autoRenew: true, status: 'active' },
    })
  } catch (err) {
    console.error('[dashboard] Failed to confirm Stripe checkout session', err)
  }
}

export const metadata: Metadata = { title: 'My Dashboard' }

const SERVICE_LABELS: Record<string, string> = {
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

// Re-enable once a lab-results consent flow exists for parents. See labs render block below.
// const FLAG_BADGE: Record<string, string> = {
//   normal:   'bg-green-100 text-green-700',
//   high:     'bg-yellow-100 text-yellow-800',
//   low:      'bg-blue-100 text-blue-800',
//   critical: 'bg-red-100 text-red-700',
// }

export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams: { stripe_sub_success?: string; sub?: string; session_id?: string }
}) {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal')

  if (searchParams.stripe_sub_success === '1' && searchParams.sub && searchParams.session_id) {
    await confirmCheckoutIfNeeded(searchParams.sub, searchParams.session_id, session.caregiverAccountId)
  }

  const now = new Date()

  const patients = await prisma.patient.findMany({
    where:   { caregiverAccountId: session.caregiverAccountId, orgId: DEFAULT_ORG_ID, isActive: true },
    select: {
      id: true, firstName: true, lastName: true, bloodGroup: true,
      chronicConditions: true,
      primaryNurse:  { select: { firstName: true, lastName: true } },
      primaryDoctor: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (patients.length === 0) redirect('/portal')

  const parents = await Promise.all(patients.map(async patient => {
    const [nextVisit, latestVital, subscription /*, medCount, recentLabs */] = await Promise.all([
      prisma.visit.findFirst({
        where: { patientId: patient.id, scheduledAt: { gte: now }, status: { in: ['requested', 'scheduled', 'en_route', 'checked_in'] } },
        orderBy: { scheduledAt: 'asc' },
        select: {
          scheduledAt: true, scheduledEnd: true, serviceCode: true, status: true,
          nurse: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.vital.findFirst({
        where:   { patientId: patient.id },
        orderBy: { recordedAt: 'desc' },
        select: {
          recordedAt: true, bloodPressureSys: true, bloodPressureDia: true,
          heartRate: true, temperature: true, oxygenSaturation: true, weight: true,
        },
      }),
      prisma.patientSubscription.findFirst({
        where:   { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
        select:  { id: true, status: true, stripeSubscriptionId: true, plan: { select: { name: true } } },
      }),
      // Medications — hidden on the dashboard for now, may require the parent's own consent to display.
      // prisma.patientMedication.count({ where: { patientId: patient.id, isActive: true } }),
      // Lab results — same as above, hidden pending a consent flow.
      // prisma.patientLabResult.findMany({
      //   where:   { patientId: patient.id },
      //   orderBy: [{ panelDate: 'desc' }, { createdAt: 'desc' }],
      //   take:    4,
      //   select:  { id: true, testName: true, result: true, unit: true, flag: true, panelDate: true },
      // }),
    ])
    return { ...patient, nextVisit, latestVital, subscription }
  }))

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Care Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(now, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link
          href="/portal/add-parent"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Another Parent</span>
          <span className="sm:hidden">Add Parent</span>
        </Link>
      </div>

      {parents.map((patient, idx) => (
        <div key={patient.id} className={idx > 0 ? 'pt-8 border-t border-gray-200 space-y-5' : 'space-y-5'}>
          {/* Parent header */}
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-gray-900">{patient.firstName}&apos;s Profile</h2>
            {patient.bloodGroup && (
              <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-semibold rounded-full border border-red-200">
                {patient.bloodGroup}
              </span>
            )}
          </div>

          {/* Quick cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Next visit */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Calendar className="w-4 h-4 text-brand-red" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Visit</span>
              </div>
              {patient.nextVisit ? (
                <>
                  {patient.nextVisit.status === 'requested' && (
                    <span className="inline-flex mb-1.5 px-2 py-0.5 text-xs rounded-full font-medium bg-pink-100 text-pink-700">
                      Pending Confirmation from Provider
                    </span>
                  )}
                  <p className="font-semibold text-gray-900">{format(new Date(patient.nextVisit.scheduledAt), 'EEE, MMM d')}</p>
                  <p className="text-sm text-gray-600">{format(new Date(patient.nextVisit.scheduledAt), 'h:mm a')}</p>
                  {patient.nextVisit.nurse && (
                    <p className="text-xs text-gray-500 mt-1">
                      {patient.nextVisit.nurse.firstName} {patient.nextVisit.nurse.lastName}
                    </p>
                  )}
                  {patient.nextVisit.serviceCode && (
                    <p className="text-xs text-brand-red mt-0.5">
                      {SERVICE_LABELS[patient.nextVisit.serviceCode] ?? patient.nextVisit.serviceCode}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">No upcoming visits</p>
              )}
              <div>
                <PatientActionLink patientId={patient.id} href="/portal/visits/request" label="Request a Visit →" />
              </div>
            </div>

            {/* Care plan */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Heart className="w-4 h-4 text-brand-red" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Care Plan</span>
              </div>
              {patient.subscription && <p className="font-semibold text-gray-900">{patient.subscription.plan?.name}</p>}
              {(() => {
                const ps = paymentStatus(patient.subscription)
                const colors: Record<typeof ps.variant, string> = {
                  success: 'bg-green-100 text-green-700',
                  warning: 'bg-yellow-100 text-yellow-700',
                  danger:  'bg-red-100 text-red-700',
                  muted:   'bg-gray-100 text-gray-600',
                }
                return (
                  <>
                    <span className={`inline-flex mt-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${colors[ps.variant]}`}>
                      {ps.label}
                    </span>
                    <div>
                      {!patient.subscription ? (
                        <PatientActionLink patientId={patient.id} href="/portal/plans" label="Choose a Plan →" />
                      ) : (ps.variant === 'warning' || ps.variant === 'danger') && (
                        <PatientActionLink
                          patientId={patient.id}
                          href={`/portal/plans/checkout?subscriptionId=${patient.subscription.id}`}
                          label="Retry Payment →"
                        />
                      )}
                    </div>
                  </>
                )
              })()}
            </div>

            {/*
            Medications quick-card — hidden for now, may require the parent's own consent to display.
            Re-enable by: 1) uncommenting the medCount query above, 2) uncommenting this card,
            3) switching the grid back to sm:grid-cols-3.
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Pill className="w-4 h-4 text-brand-red" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medications</span>
              </div>
              <p className="font-semibold text-gray-900">{patient.medCount} active</p>
              <Link href="/portal/medications" className="inline-flex items-center gap-1 text-xs text-brand-red hover:underline mt-1.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            */}
          </div>

          {/* Latest vitals */}
          {patient.latestVital && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Latest Vitals</h3>
                <span className="text-xs text-gray-400">{format(new Date(patient.latestVital.recordedAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {patient.latestVital.bloodPressureSys && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Blood Pressure</p>
                    <p className="font-bold text-gray-900">{patient.latestVital.bloodPressureSys}/{patient.latestVital.bloodPressureDia}</p>
                    <p className="text-[10px] text-gray-400">mmHg</p>
                  </div>
                )}
                {patient.latestVital.heartRate && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Heart Rate</p>
                    <p className="font-bold text-gray-900">{patient.latestVital.heartRate}</p>
                    <p className="text-[10px] text-gray-400">bpm</p>
                  </div>
                )}
                {patient.latestVital.temperature != null && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Temperature</p>
                    <p className="font-bold text-gray-900">{Number(patient.latestVital.temperature).toFixed(1)}</p>
                    <p className="text-[10px] text-gray-400">°C</p>
                  </div>
                )}
                {patient.latestVital.oxygenSaturation != null && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Oxygen</p>
                    <p className="font-bold text-gray-900">{Number(patient.latestVital.oxygenSaturation).toFixed(0)}%</p>
                    <p className="text-[10px] text-gray-400">SpO₂</p>
                  </div>
                )}
                {patient.latestVital.weight != null && (
                  <div className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Weight</p>
                    <p className="font-bold text-gray-900">{Number(patient.latestVital.weight).toFixed(1)}</p>
                    <p className="text-[10px] text-gray-400">kg</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/*
          Recent lab results — hidden for now, may require the parent's own consent to display.
          Re-enable by uncommenting the recentLabs query above and this block.
          {patient.recentLabs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-brand-red" />
                  <h3 className="font-medium text-gray-900">Recent Lab Results</h3>
                </div>
                <Link href="/portal/labs" className="inline-flex items-center gap-1 text-xs text-brand-red hover:underline">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-0">
                {patient.recentLabs.map(lab => (
                  <div key={lab.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-900">{lab.testName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {lab.result}{lab.unit ? ` ${lab.unit}` : ''}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${FLAG_BADGE[lab.flag ?? 'normal'] ?? FLAG_BADGE.normal}`}>
                        {lab.flag ?? 'normal'}
                      </span>
                      <span className="text-xs text-gray-400 hidden sm:inline">{format(new Date(lab.panelDate), 'MMM d')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          */}

          {/* Care team */}
          {(patient.primaryNurse || patient.primaryDoctor) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Care Team</h3>
              <div className="flex flex-wrap gap-3">
                {patient.primaryNurse && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-sm font-bold">
                      {patient.primaryNurse.firstName[0]}{patient.primaryNurse.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.primaryNurse.firstName} {patient.primaryNurse.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Primary Nurse</p>
                    </div>
                  </div>
                )}
                {patient.primaryDoctor && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-sm font-bold">
                      {patient.primaryDoctor.firstName[0]}{patient.primaryDoctor.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {patient.primaryDoctor.firstName} {patient.primaryDoctor.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Primary Doctor</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conditions */}
          {patient.chronicConditions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Chronic Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {patient.chronicConditions.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full border border-red-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
