import { Suspense } from 'react'
import PaywallPage from '@/components/PaywallPage'

export const metadata = {
  title: 'Vega Power - ابدأ رحلتك الآن',
  description: 'انضم لآلاف المتدربين واحصل على برنامج تدريبي وغذائي مخصص بالذكاء الاصطناعي',
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin" />
    </div>
  )
}

export default function App2Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaywallPage />
    </Suspense>
  )
}
