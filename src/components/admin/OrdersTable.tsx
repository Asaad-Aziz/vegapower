'use client'

import { useState } from 'react'
import type { Order } from '@/types/database'

interface OrdersTableProps {
  orders: Order[]
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [filter, setFilter] = useState<'all' | 'paid' | 'failed'>('all')

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const totalRevenue = orders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + o.amount_sar, 0)

  const exportCSV = () => {
    const headers = ['Email', 'Amount (SAR)', 'Status', 'Payment ID', 'Date']
    const rows = orders.map((o) => [
      o.buyer_email,
      o.amount_sar.toFixed(2),
      o.status,
      o.moyasar_payment_id,
      new Date(o.created_at).toLocaleString(),
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6">
          <p className="text-sm text-muted mb-1">Total Orders</p>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-muted mb-1">Successful Payments</p>
          <p className="text-3xl font-bold">{orders.filter((o) => o.status === 'paid').length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-muted mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{totalRevenue.toFixed(2)} SAR</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['all', 'paid', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === status
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm">
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-muted">Email</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted">Amount</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-sm">{order.buyer_email}</td>
                    <td className="px-6 py-4 text-sm font-medium">{order.amount_sar.toFixed(2)} SAR</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

