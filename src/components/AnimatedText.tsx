'use client'

import { useEffect, useState } from 'react'

interface AnimatedTextProps {
  text: string
  delay?: number
  className?: string
}

export function AnimatedText({ text, delay = 0, className = '' }: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false)
  const words = text.split(/(\s+)/)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            transitionDelay: isVisible ? `${i * 0.05}s` : '0s',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(0.5em)',
          }}
        >
          {word}
        </span>
      ))}
    </span>
  )
}
