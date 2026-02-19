'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AffiliateCode, AffiliatePayout } from '@/types/database'

interface AffiliatesPanelProps {
  affiliates: AffiliateCode[]
  payouts: AffiliatePayout[]
  affiliateOrders: { discount_code: string | null; amount_sar: number; status: string }[]
}

type View = 'list' | 'create' | 'detail'

export default function AffiliatesPanel({ affiliates, payouts, affiliateOrders }: AffiliatesPanelProps) {
  const router = useRouter()
  const [view, setView] = useState<View>('list')
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateCode | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Create form state
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newDiscount, setNewDiscount] = useState('10')
  const [newCommission, setNewCommission] = useState('10')

  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [payoutSaving, setPayoutSaving] = useState(false)

  const paidOrders = affiliateOrders.filter((o) => o.status === 'paid' && o.discount_code)

  function getCodeStats(code: string) {
    const orders = paidOrders.filter((o) => o.discount_code === code)
    const revenue = orders.reduce((sum, o) => sum + Number(o.amount_sar), 0)
    return { sales: orders.length, revenue }
  }

  function getCodePayouts(affiliateId: string) {
    return payouts.filter((p) => p.affiliate_code_id === affiliateId)
  }

  function getTotalPaidOut(affiliateId: string) {
    return getCodePayouts(affiliateId).reduce((sum, p) => sum + Number(p.amount_sar), 0)
  }

  const totalAffiliateRevenue = paidOrders.reduce((sum, o) => sum + Number(o.amount_sar), 0)
  const totalCommissionsOwed = affiliates.reduce((sum, aff) => {
    const { revenue } = getCodeStats(aff.code)
    return sum + revenue * (aff.commission_percentage / 100)
  }, 0)
  const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.amount_sar), 0)

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      setError('Code and name are required')
      return
    }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          affiliate_name: newName,
          discount_percentage: parseFloat(newDiscount) || 10,
          commission_percentage: parseFloat(newCommission) || 10,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to create')
        return
      }
      setNewCode('')
      setNewName('')
      setNewDiscount('10')
      setNewCommission('10')
      setView('list')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (aff: AffiliateCode) => {
    try {
      await fetch(`/api/admin/affiliates?id=${aff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !aff.is_active }),
      })
      router.refresh()
    } catch {
      // silent fail
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this affiliate code? This cannot be undone.')) return
    try {
      await fetch(`/api/admin/affiliates?id=${id}`, { method: 'DELETE' })
      if (selectedAffiliate?.id === id) {
        setSelectedAffiliate(null)
        setView('list')
      }
      router.refresh()
    } catch {
      // silent fail
    }
  }

  const handleRecordPayout = async () => {
    if (!selectedAffiliate || !payoutAmount || parseFloat(payoutAmount) <= 0) return
    setPayoutSaving(true)
    try {
      const res = await fetch('/api/admin/affiliates/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_code_id: selectedAffiliate.id,
          amount_sar: parseFloat(payoutAmount),
          note: payoutNote || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPayoutAmount('')
        setPayoutNote('')
        router.refresh()
      }
    } catch {
      // silent fail
    } finally {
      setPayoutSaving(false)
    }
  }

  const getShareLink = (token: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}/affiliate?token=${token}`
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getShareLink(token))
  }

  // === DETAIL VIEW ===
  if (view === 'detail' && selectedAffiliate) {
    const stats = getCodeStats(selectedAffiliate.code)
    const commission = stats.revenue * (selectedAffiliate.commission_percentage / 100)
    const paidOut = getTotalPaidOut(selectedAffiliate.id)
    const pending = commission - paidOut
    const codePayouts = getCodePayouts(selectedAffiliate.id)

    return (
      <div className="space-y-6">
        <button
          onClick={() => { setView('list'); setSelectedAffiliate(null) }}
          className="text-sm text-neutral-500 hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← Back to Affiliates
        </button>

        {/* Affiliate Header */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{selectedAffiliate.affiliate_name}</h2>
              <p className="text-neutral-500 text-sm mt-1">
                Code: <span className="font-mono font-bold text-foreground">{selectedAffiliate.code}</span>
                {' · '}
                {selectedAffiliate.discount_percentage}% discount · {selectedAffiliate.commission_percentage}% commission
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                selectedAffiliate.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {selectedAffiliate.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Share Link */}
          <div className="flex items-center gap-2 bg-neutral-50 rounded-lg p-3">
            <input
              type="text"
              readOnly
              value={getShareLink(selectedAffiliate.access_token)}
              className="flex-1 bg-transparent text-sm text-neutral-600 outline-none font-mono"
            />
            <button
              onClick={() => copyLink(selectedAffiliate.access_token)}
              className="px-3 py-1.5 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="glass-card p-5">
            <p className="text-sm text-neutral-500 mb-1">Total Sales</p>
            <p className="text-2xl font-bold">{stats.sales}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-neutral-500 mb-1">Revenue Generated</p>
            <p className="text-2xl font-bold">{stats.revenue.toFixed(2)} SAR</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-neutral-500 mb-1">Commission Earned</p>
            <p className="text-2xl font-bold">{commission.toFixed(2)} SAR</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-neutral-500 mb-1">Pending Balance</p>
            <p className={`text-2xl font-bold ${pending > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {pending.toFixed(2)} SAR
            </p>
          </div>
        </div>

        {/* Record Payout */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Record Payout</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm text-neutral-500 mb-1">Amount (SAR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
                className="input-field"
              />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="block text-sm text-neutral-500 mb-1">Note (optional)</label>
              <input
                type="text"
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
                placeholder="e.g. Bank transfer Feb 2026"
                className="input-field"
              />
            </div>
            <button
              onClick={handleRecordPayout}
              disabled={payoutSaving || !payoutAmount || parseFloat(payoutAmount) <= 0}
              className="btn-primary text-sm"
            >
              {payoutSaving ? 'Saving...' : 'Record Payout'}
            </button>
          </div>
        </div>

        {/* Payout History */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <h3 className="font-semibold">Payout History ({codePayouts.length})</h3>
          </div>
          {codePayouts.length === 0 ? (
            <p className="p-6 text-center text-neutral-500 text-sm">No payouts recorded yet</p>
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
                  {codePayouts.map((p) => (
                    <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="px-6 py-3 text-sm">
                        {new Date(p.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium">{Number(p.amount_sar).toFixed(2)} SAR</td>
                      <td className="px-6 py-3 text-sm text-neutral-500">{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // === CREATE VIEW ===
  if (view === 'create') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => { setView('list'); setError('') }}
          className="text-sm text-neutral-500 hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← Back to Affiliates
        </button>

        <div className="glass-card p-6 max-w-lg">
          <h2 className="text-lg font-semibold mb-6">Create Affiliate Code</h2>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. AHMED10"
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Affiliate Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ahmed Al-Qahtani"
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount %</label>
                <input
                  type="number"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  min="0"
                  max="100"
                  className="input-field"
                />
                <p className="text-xs text-neutral-400 mt-1">Discount for buyers using this code</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Commission %</label>
                <input
                  type="number"
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  min="0"
                  max="100"
                  className="input-field"
                />
                <p className="text-xs text-neutral-400 mt-1">Affiliate earns from each sale</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Creating...' : 'Create Code'}
            </button>
            <button onClick={() => { setView('list'); setError('') }} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === LIST VIEW ===
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Active Affiliates</p>
          <p className="text-3xl font-bold">{affiliates.filter((a) => a.is_active).length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Affiliate Revenue</p>
          <p className="text-3xl font-bold">{totalAffiliateRevenue.toFixed(0)} SAR</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Total Commissions</p>
          <p className="text-3xl font-bold">{totalCommissionsOwed.toFixed(0)} SAR</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Total Paid Out</p>
          <p className="text-3xl font-bold">{totalPaidOut.toFixed(0)} SAR</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">All Affiliate Codes ({affiliates.length})</h2>
        <button onClick={() => setView('create')} className="btn-primary text-sm">
          + New Affiliate Code
        </button>
      </div>

      {/* Affiliate Codes List */}
      {affiliates.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-neutral-500 mb-4">No affiliate codes yet. Create your first one!</p>
          <button onClick={() => setView('create')} className="btn-primary text-sm">
            + New Affiliate Code
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Affiliate</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Code</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Discount</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Sales</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Revenue</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Commission</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => {
                  const stats = getCodeStats(aff.code)
                  const commission = stats.revenue * (aff.commission_percentage / 100)
                  const paidOut = getTotalPaidOut(aff.id)

                  return (
                    <tr key={aff.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setSelectedAffiliate(aff); setView('detail') }}
                          className="font-medium text-sm hover:underline text-left"
                        >
                          {aff.affiliate_name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded">{aff.code}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">{aff.discount_percentage}%</td>
                      <td className="px-6 py-4 text-sm font-medium">{stats.sales}</td>
                      <td className="px-6 py-4 text-sm">{stats.revenue.toFixed(0)} SAR</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-medium">{commission.toFixed(0)}</span>
                        <span className="text-neutral-400"> / {paidOut.toFixed(0)} paid</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(aff)}
                          className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                            aff.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {aff.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedAffiliate(aff); setView('detail') }}
                            className="text-xs text-neutral-500 hover:text-foreground transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => copyLink(aff.access_token)}
                            className="text-xs text-neutral-500 hover:text-foreground transition-colors"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => handleDelete(aff.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
