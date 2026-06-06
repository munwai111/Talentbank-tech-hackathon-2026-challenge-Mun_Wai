'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap-config'

type Props = {
  children: React.ReactNode
  delay?: number
  y?: number
  duration?: number
  className?: string
  once?: boolean
  scrollTrigger?: boolean
}

export function FadeUp({ children, delay = 0, y = 40, duration = 0.8, className, once = true, scrollTrigger = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        ...(scrollTrigger ? {
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 88%',
            toggleActions: once ? 'play none none none' : 'play reverse play reverse',
          },
        } : {}),
      }
    )
  }, { scope: ref })

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
