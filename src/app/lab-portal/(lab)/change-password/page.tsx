import type { Metadata } from 'next'
import ChangePasswordForm from '@/components/shared/change-password-form'

export const metadata: Metadata = { title: 'Change Password' }

export default function LabChangePasswordPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Change Password</h1>
        <p className="text-sm text-gray-500 mt-1">Update your login password.</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
