import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import { format, differenceInYears } from 'date-fns'
import { User } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

const INSURANCE_LABELS: Record<string, string> = {
  none:       'None / Self-Pay',
  nsia:       'NSIA',
  sehat_bima: 'Sehat Bima Yojana',
  ssf:        'SSF (Social Security Fund)',
  private:    'Private Insurance',
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

export default async function PortalProfilePage() {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal')

  const patient = await prisma.patient.findUnique({
    where:   { id: session.patientId },
    include: { familyMembers: { orderBy: { isPrimaryContact: 'desc' } } },
  })

  if (!patient) redirect('/portal')

  const age = differenceInYears(new Date(), new Date(patient.dateOfBirth))

  return (
    <div className="space-y-5">
      {/* Avatar + header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-red text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {patient.firstName[0]}{patient.lastName[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
          {patient.firstNameNepali && (
            <p className="text-gray-500">{patient.firstNameNepali} {patient.lastNameNepali ?? ''}</p>
          )}
          <p className="text-sm text-gray-500 mt-0.5">
            {age} years old &bull; MRN: {patient.mrn}
          </p>
        </div>
      </div>

      {/* Personal */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-2">Personal Information</h2>
        <InfoRow label="Date of Birth"   value={format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')} />
        <InfoRow label="Gender"          value={patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : null} />
        <InfoRow label="Phone"           value={patient.phone ?? null} />
        <InfoRow label="Alternate Phone" value={patient.altPhone ?? null} />
        <InfoRow label="Email"           value={patient.email ?? null} />
        <InfoRow label="Blood Group"     value={patient.bloodGroup ?? null} />
        <InfoRow label="National ID"     value={patient.nationalId ?? null} />
        <InfoRow label="Language"        value={patient.primaryLanguage === 'ne' ? 'Nepali' : patient.primaryLanguage === 'en' ? 'English' : patient.primaryLanguage} />
      </div>

      {/* Address */}
      {(patient.province || patient.district || patient.municipality) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Address</h2>
          <InfoRow label="Province"     value={patient.province ?? null} />
          <InfoRow label="District"     value={patient.district ?? null} />
          <InfoRow label="Municipality" value={patient.municipality ?? null} />
          <InfoRow label="Ward No."     value={patient.wardNo != null ? String(patient.wardNo) : null} />
          <InfoRow label="Tole"         value={patient.tole ?? null} />
          <InfoRow label="Street"       value={patient.streetAddress ?? null} />
          <InfoRow label="Landmark"     value={patient.landmark ?? null} />
        </div>
      )}

      {/* Medical */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Medical Information</h2>
        {patient.chronicConditions.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-gray-500 mb-2">Chronic Conditions</p>
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions.map((c, i) => (
                <span key={i} className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-full border border-red-100">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
        {patient.allergies.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-gray-500 mb-2">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((a, i) => (
                <span key={i} className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                  ⚠ {a}
                </span>
              ))}
            </div>
          </div>
        )}
        <InfoRow label="Insurance"   value={INSURANCE_LABELS[patient.insuranceScheme] ?? patient.insuranceScheme} />
        <InfoRow label="Policy No."  value={patient.insurancePolicyNo ?? null} />
        <InfoRow label="Ins. Expiry" value={patient.insuranceExpiry ? format(new Date(patient.insuranceExpiry), 'MMM d, yyyy') : null} />
      </div>

      {/* Emergency contact */}
      {patient.emergencyContactName && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Emergency Contact</h2>
          <InfoRow label="Name"         value={patient.emergencyContactName} />
          <InfoRow label="Relationship" value={patient.emergencyContactRelation ?? null} />
          <InfoRow label="Phone"        value={patient.emergencyContactPhone ?? null} />
        </div>
      )}

      {/* Family members */}
      {patient.familyMembers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">
            Family Members ({patient.familyMembers.length})
          </h2>
          <div className="space-y-3">
            {patient.familyMembers.map(fm => (
              <div key={fm.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {fm.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{fm.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {fm.relationship}
                    {fm.country ? ` • ${fm.country}` : ''}
                    {fm.phone ? ` • ${fm.phone}` : ''}
                  </p>
                </div>
                {fm.isPrimaryContact && (
                  <span className="shrink-0 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">
                    Emergency
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {patient.familyMembers.length === 0 && !patient.emergencyContactName && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
          <User className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No emergency contact or family members on file</p>
        </div>
      )}
    </div>
  )
}
