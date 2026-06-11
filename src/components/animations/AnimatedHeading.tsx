'use client'

import React, { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap-config'

type Props = {
  children: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  delay?: number
  stagger?: number
  scrollTrigger?: boolean
}

/**
 * Splits text into word spans and animates each word up with perspective.
 * Works for any heading text — pass a plain string as children.
 */
export function AnimatedHeading({
  children,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 0.06,
  scrollTrigger = true,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
  const words = children.split(' ')

  useGSAP(() => {
    if (!ref.current) return
    const spans = ref.current.querySelectorAll<HTMLSpanElement>('.word')
    const reduced = prefersReducedMotion()
    gsap.fromTo(
      spans,
      { opacity: 0, y: reduced ? 0 : 40, rotateX: reduced ? 0 : -20 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.75,
        stagger,
        delay,
        ease: 'back.out(1.4)',
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
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement>}
      className={className}
      style={{ perspective: '800px', perspectiveOrigin: 'center bottom' }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="word inline-block"
          style={{ marginRight: '0.25em', display: 'inline-block' }}
        >
          {word}
        </span>
      ))}
    </Tag>
  )
}
