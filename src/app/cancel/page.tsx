import Link from 'next/link'

export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold mb-2">Payment Cancelled</h1>
        <p className="text-muted mb-6">
          Your payment was cancelled. No charges have been made.
        </p>

        <Link href="/checkout" className="btn-primary inline-block mb-4">
          Try Again
        </Link>

        <div>
          <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
            ← Return to store
          </Link>
        </div>
      </div>
    </main>
  )
}

