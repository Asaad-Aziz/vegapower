'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface AffiliateData {
  affiliate_name: string
  code: string
  discount_percentage: number
  commission_percentage: number
  total_sales: number
  total_revenue: number
  total_commission: number
  total_paid_out: number
  pending_balance: number
  recent_orders: { amount_sar: number; created_at: string }[]
  payouts: { amount_sar: number; note: string | null; created_at: string }[]
}

function AffiliateDashboardContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [data, setData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid affiliate link')
      setLoading(false)
      return
    }

    fetch(`/api/affiliate?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invalid link')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Could not load affiliate data. Please check your link.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <p className="text-lg font-medium text-red-600 mb-2">Access Error</p>
          <p className="text-neutral-500 text-sm">{error || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-neutral-500 mb-1">Affiliate Dashboard</p>
          <h1 className="text-2xl font-bold">{data.affiliate_name}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Code: <span className="font-mono font-bold text-foreground">{data.code}</span>
            {' · '}
            {data.discount_percentage}% buyer discount · {data.commission_percentage}% your commission
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="glass-card p-5">
            <p className="text-xs text-neutral-500 mb-1">Total Sales</p>
            <p className="text-2xl font-bold">{data.total_sales}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-neutral-500 mb-1">Revenue Generated</p>
            <p className="text-2xl font-bold">{data.total_revenue.toFixed(0)} <span className="text-sm font-normal">SAR</span></p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-neutral-500 mb-1">Your Commission</p>
            <p className="text-2xl font-bold text-green-600">{data.total_commission.toFixed(2)} <span className="text-sm font-normal">SAR</span></p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-neutral-500 mb-1">Pending Balance</p>
            <p className={`text-2xl font-bold ${data.pending_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {data.pending_balance.toFixed(2)} <span className="text-sm font-normal">SAR</span>
            </p>
          </div>
        </div>

        {/* Paid Out Summary */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Total Paid Out</p>
              <p className="text-xl font-bold">{data.total_paid_out.toFixed(2)} SAR</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">Commission Rate</p>
              <p className="text-xl font-bold">{data.commission_percentage}%</p>
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <h2 className="font-semibold">Payout History</h2>
          </div>
          {data.payouts.length === 0 ? (
            <p className="p-6 text-center text-neutral-500 text-sm">No payouts yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Date</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Amount</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map((p, i) => (
                    <tr key={i} className="border-b border-neutral-50">
                      <td className="px-6 py-3 text-sm">
                        {new Date(p.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-green-600">{Number(p.amount_sar).toFixed(2)} SAR</td>
                      <td className="px-6 py-3 text-sm text-neutral-500">{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <h2 className="font-semibold">Recent Sales ({data.recent_orders.length})</h2>
          </div>
          {data.recent_orders.length === 0 ? (
            <p className="p-6 text-center text-neutral-500 text-sm">No sales yet — share your code to start earning!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Date</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Sale Amount</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Your Earning</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((order, i) => (
                    <tr key={i} className="border-b border-neutral-50">
                      <td className="px-6 py-3 text-sm">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3 text-sm">{Number(order.amount_sar).toFixed(2)} SAR</td>
                      <td className="px-6 py-3 text-sm font-medium text-green-600">
                        {(Number(order.amount_sar) * (data.commission_percentage / 100)).toFixed(2)} SAR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-neutral-400 pb-8">
          Stats update in real-time. Contact your partner for payout inquiries.
        </p>
      </main>
    </div>
  )
}

export default function AffiliateDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    }>
      <AffiliateDashboardContent />
    </Suspense>
  )
}
