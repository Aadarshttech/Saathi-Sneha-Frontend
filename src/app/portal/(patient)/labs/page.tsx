import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { FlaskConical } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lab Results' }

const FLAG_BADGE: Record<string, string> = {
  normal:   'bg-green-100 text-green-700',
  high:     'bg-yellow-100 text-yellow-800',
  low:      'bg-blue-100 text-blue-800',
  critical: 'bg-red-100 text-red-700',
  pending:  'bg-gray-100 text-gray-600',
}

export default async function PortalLabsPage() {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal')

  const labs = await prisma.patientLabResult.findMany({
    where:   { patientId: session.patientId },
    orderBy: [{ panelDate: 'desc' }, { createdAt: 'desc' }],
    take:    150,
    select: {
      id: true, panelDate: true, category: true, testName: true,
      result: true, unit: true, referenceMin: true, referenceMax: true,
      flag: true, priorResult: true, trend: true, notes: true,
    },
  })

  const grouped: Record<string, typeof labs> = {}
  for (const lab of labs) {
    const key = new Date(lab.panelDate).toISOString().slice(0, 10)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(lab)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Lab Results</h1>
        {labs.length > 0 && <span className="text-sm text-gray-500">{labs.length} total</span>}
      </div>

      {Object.entries(grouped).map(([dateKey, results]) => (
        <div key={dateKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="font-semibold text-gray-900">{format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}</p>
            <span className="text-xs text-gray-500">{results.length} test{results.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {results.map(lab => (
              <div key={lab.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lab.testName}</p>
                    {lab.category && (
                      <p className="text-xs text-gray-400 capitalize mt-0.5">
                        {lab.category.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {lab.result}{lab.unit ? ` ${lab.unit}` : ''}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${FLAG_BADGE[lab.flag ?? 'normal'] ?? FLAG_BADGE.normal}`}>
                      {lab.flag ?? 'normal'}
                    </span>
                  </div>
                </div>
                {(lab.referenceMin || lab.referenceMax) && (
                  <p className="text-xs text-gray-400 mt-1">
                    Normal range: {lab.referenceMin ?? '–'} – {lab.referenceMax ?? '–'}{lab.unit ? ` ${lab.unit}` : ''}
                  </p>
                )}
                {lab.priorResult && (
                  <p className="text-xs text-gray-400">
                    Previous: {lab.priorResult}{lab.unit ? ` ${lab.unit}` : ''}
                    {lab.trend ? ` (${lab.trend})` : ''}
                  </p>
                )}
                {lab.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">{lab.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {labs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No lab results yet</p>
          <p className="text-sm mt-1">Your results will appear here after each panel</p>
        </div>
      )}
    </div>
  )
}
