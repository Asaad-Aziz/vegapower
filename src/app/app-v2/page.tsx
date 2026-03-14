import { Suspense } from 'react'
import AppOnboardingV2 from '@/components/AppOnboardingV2'

export const metadata = {
  title: 'Vega Power App - اشترك الآن',
  description: 'اشترك في تطبيق فيقا باور واحصل على برامج تدريبية مخصصة',
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin" />
    </div>
  )
}

export default function AppV2Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppOnboardingV2 />
    </Suspense>
  )
}
