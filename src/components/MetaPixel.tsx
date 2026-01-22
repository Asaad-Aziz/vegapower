'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { FB_PIXEL_ID, pageview } from '@/lib/meta-pixel'

export default function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    // Debug: Log pixel status
    console.log('Meta Pixel ID:', FB_PIXEL_ID ? 'Configured' : 'NOT CONFIGURED')
    
    // Track pageview on route change
    if (FB_PIXEL_ID) {
      pageview()
    }
  }, [pathname])

  if (!FB_PIXEL_ID) {
    console.warn('Meta Pixel: NEXT_PUBLIC_META_PIXEL_ID environment variable is not set')
    return null
  }

  return (
    <>
      {/* Meta Pixel Code */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Meta Pixel NoScript Fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
