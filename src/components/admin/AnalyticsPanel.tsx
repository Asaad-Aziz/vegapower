'use client'

import type { AnalyticsEvent } from '@/types/database'

interface AnalyticsPanelProps {
  events: AnalyticsEvent[]
}

export default function AnalyticsPanel({ events }: AnalyticsPanelProps) {
  const pageViews = events.filter((e) => e.type === 'page_view').length
  const buyClicks = events.filter((e) => e.type === 'buy_click').length
  const purchases = events.filter((e) => e.type === 'purchase').length

  // Conversion rate: purchases / page views
  const conversionRate = pageViews > 0 ? ((purchases / pageViews) * 100).toFixed(1) : '0'
  
  // Click-to-purchase rate
  const clickToPurchase = buyClicks > 0 ? ((purchases / buyClicks) * 100).toFixed(1) : '0'

  // Get events from last 7 days
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentEvents = events.filter((e) => new Date(e.created_at) >= sevenDaysAgo)

  // Daily breakdown
  const dailyStats: Record<string, { views: number; clicks: number; purchases: number }> = {}
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyStats[dateKey] = { views: 0, clicks: 0, purchases: 0 }
  }

  recentEvents.forEach((event) => {
    const dateKey = new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (dailyStats[dateKey]) {
      if (event.type === 'page_view') dailyStats[dateKey].views++
      if (event.type === 'buy_click') dailyStats[dateKey].clicks++
      if (event.type === 'purchase') dailyStats[dateKey].purchases++
    }
  })

  const maxViews = Math.max(...Object.values(dailyStats).map((d) => d.views), 1)

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Page Views</p>
          <p className="text-3xl font-bold">{pageViews}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Buy Clicks</p>
          <p className="text-3xl font-bold">{buyClicks}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Purchases</p>
          <p className="text-3xl font-bold">{purchases}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-neutral-500 mb-1">Conversion Rate</p>
          <p className="text-3xl font-bold">{conversionRate}%</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-6">Conversion Funnel</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Page Views</span>
              <span className="text-sm text-neutral-500">{pageViews}</span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Buy Clicks</span>
              <span className="text-sm text-neutral-500">
                {buyClicks} ({pageViews > 0 ? ((buyClicks / pageViews) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-500 rounded-full"
                style={{ width: `${pageViews > 0 ? (buyClicks / pageViews) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Purchases</span>
              <span className="text-sm text-neutral-500">
                {purchases} ({clickToPurchase}% of clicks)
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full"
                style={{ width: `${pageViews > 0 ? (purchases / pageViews) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-6">Last 7 Days</h2>
        <div className="space-y-3">
          {Object.entries(dailyStats).map(([date, stats]) => (
            <div key={date} className="flex items-center gap-4">
              <span className="text-sm text-neutral-500 w-16">{date}</span>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-6 bg-neutral-200 rounded"
                  style={{ width: `${(stats.views / maxViews) * 100}%`, minWidth: stats.views > 0 ? '4px' : '0' }}
                  title={`${stats.views} views`}
                />
                <span className="text-xs text-neutral-500">{stats.views} views</span>
              </div>
              <div className="flex gap-4 text-xs text-neutral-500">
                <span>{stats.clicks} clicks</span>
                <span className="font-medium text-foreground">{stats.purchases} sales</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-center text-sm text-neutral-500">
        <p>Analytics are tracked automatically when visitors view your store.</p>
      </div>
    </div>
  )
}

