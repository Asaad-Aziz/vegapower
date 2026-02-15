'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { SNAP_PIXEL_ID, snapPageView } from '@/lib/snapchat-pixel'

export default function SnapPixel() {
  const pathname = usePathname()

  useEffect(() => {
    if (SNAP_PIXEL_ID) {
      snapPageView()
    }
  }, [pathname])

  if (!SNAP_PIXEL_ID) return null

  return (
    <Script
      id="snap-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
          {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
          a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
          r.src=n;var u=t.getElementsByTagName(s)[0];
          u.parentNode.insertBefore(r,u);})(window,document,
          'https://sc-static.net/scevent.min.js');
          snaptr('init', '${SNAP_PIXEL_ID}', {});
          snaptr('track', 'PAGE_VIEW');
        `,
      }}
    />
  )
}
