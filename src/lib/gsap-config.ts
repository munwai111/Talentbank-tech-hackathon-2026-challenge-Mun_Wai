'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register all plugins once, globally — prevents tree-shaking from dropping them
gsap.registerPlugin(ScrollTrigger, useGSAP)

// CSS reduced-motion rules can't reach JS-driven animation, so GSAP
// components check this themselves: keep the fade, drop the movement.
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export { gsap, ScrollTrigger, useGSAP }
