'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap-config'

type Props = {
  children: React.ReactNode
  className?: string
  strength?: number
}

export function MagneticButton({ children, className, strength = 0.35 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const { contextSafe } = useGSAP({ scope: ref })

  const onMove = contextSafe((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * strength
    const dy = (e.clientY - cy) * strength
    gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' })
  })

  const onLeave = contextSafe(() => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  })

  return (
    <div
      ref={ref}
      className={className}
      style={{ display: 'inline-block' }}
      onMouseMove={(e) => onMove(e.nativeEvent)}
      onMouseLeave={() => onLeave()}
    >
      {children}
    </div>
  )
}
