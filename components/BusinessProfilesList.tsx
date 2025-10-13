'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function BusinessProfilesList() {
  const router = useRouter()

  const handleRedirect = () => {
    router.push('/business-profiles')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={handleRedirect}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Business Profiles</h3>
        <ArrowRight className="h-5 w-5 text-gray-600" />
      </div>

      <div className="flex items-center justify-center h-full">
      </div>
    </div>
  )
}
