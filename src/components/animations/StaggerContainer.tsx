'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap-config'

type Props = {
  children: React.ReactNode
  className?: string
  stagger?: number
  delay?: number
  y?: number
  duration?: number
  /** CSS selector for children to animate. Defaults to direct children */
  childSelector?: string
  scrollTrigger?: boolean
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
  delay = 0,
  y = 30,
  duration = 0.7,
  childSelector = ':scope > *',
  scrollTrigger = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const items = ref.current.querySelectorAll(childSelector)
    if (!items.length) return

    gsap.fromTo(
      items,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        ...(scrollTrigger
          ? {
              scrollTrigger: {
                trigger: ref.current,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            }
          : {}),
      }
    )
  }, { scope: ref })

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
