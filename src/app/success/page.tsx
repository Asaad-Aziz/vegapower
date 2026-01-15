import { Suspense } from 'react'
import SuccessContent from './SuccessContent'

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
            <h1 className="text-xl font-semibold mb-2">Loading...</h1>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
