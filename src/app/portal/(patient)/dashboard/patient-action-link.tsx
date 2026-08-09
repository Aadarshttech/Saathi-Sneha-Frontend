'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PatientActionLinkProps {
  patientId: string
  href: string
  label: string
}

// Switches the session's active patient (if this card isn't the currently-selected
// one) before navigating, since most portal pages (checkout, visit request, etc.)
// only ever act on whichever patient is currently selected in the session.
export default function PatientActionLink({ patientId, href, label }: PatientActionLinkProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/portal/select-patient', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ patientId }),
      })
      if (res.ok) router.push(href)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-semibold text-brand-red hover:underline disabled:opacity-60 mt-1"
    >
      {loading ? 'Loading…' : label}
    </button>
  )
}
