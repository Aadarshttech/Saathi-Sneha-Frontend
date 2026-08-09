import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import { Pill } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Medications' }

export default async function PortalMedicationsPage() {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal')

  const medications = await prisma.patientMedication.findMany({
    where:   { patientId: session.patientId },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    select: {
      id: true, name: true, nameNepali: true, dose: true, frequency: true,
      indication: true, prescriber: true, isActive: true,
      isBeersFlagged: true, beersNote: true, status: true, notes: true,
    },
  })

  const active       = medications.filter(m => m.isActive)
  const discontinued = medications.filter(m => !m.isActive)

  function MedCard({ med }: { med: typeof medications[0] }) {
    return (
      <div className={`bg-white rounded-xl border p-4 ${med.isBeersFlagged ? 'border-orange-300' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900">{med.name}</p>
            {med.nameNepali && <p className="text-xs text-gray-500 mt-0.5">{med.nameNepali}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {med.isBeersFlagged && (
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
                ⚠ Review
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${med.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {med.isActive ? 'Active' : 'Discontinued'}
            </span>
          </div>
        </div>

        <div className="mt-2.5 space-y-1">
          {med.dose && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-20 shrink-0">Dose</span>
              <span className="text-gray-900">{med.dose}</span>
            </div>
          )}
          {med.frequency && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-20 shrink-0">Frequency</span>
              <span className="text-gray-900">{med.frequency}</span>
            </div>
          )}
          {med.indication && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-20 shrink-0">For</span>
              <span className="text-gray-900">{med.indication}</span>
            </div>
          )}
          {med.prescriber && (
            <p className="text-xs text-gray-400 pt-1">Prescribed by {med.prescriber}</p>
          )}
        </div>

        {med.isBeersFlagged && med.beersNote && (
          <div className="mt-2.5 text-xs text-orange-700 bg-orange-50 rounded-lg p-2.5 border border-orange-200">
            {med.beersNote}
          </div>
        )}

        {med.notes && (
          <p className="text-xs text-gray-500 mt-2 italic">{med.notes}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Medications</h1>
        {active.length > 0 && (
          <span className="text-sm text-gray-500">{active.length} active</span>
        )}
      </div>

      {active.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active</p>
          <div className="space-y-3">
            {active.map(m => <MedCard key={m.id} med={m} />)}
          </div>
        </section>
      )}

      {discontinued.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Discontinued</p>
          <div className="space-y-3 opacity-60">
            {discontinued.map(m => <MedCard key={m.id} med={m} />)}
          </div>
        </section>
      )}

      {medications.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Pill className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No medications recorded</p>
          <p className="text-sm mt-1">Your medication list will appear here</p>
        </div>
      )}
    </div>
  )
}
