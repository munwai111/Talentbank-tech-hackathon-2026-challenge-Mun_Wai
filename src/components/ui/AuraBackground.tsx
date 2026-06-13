'use client'

import { useEffect } from 'react'

export function AuraBackground() {
  useEffect(() => {
    let raf: number
    const track = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--aura-x', `${e.clientX}px`)
        document.documentElement.style.setProperty('--aura-y', `${e.clientY}px`)
      })
    }
    window.addEventListener('mousemove', track, { passive: true })
    return () => {
      window.removeEventListener('mousemove', track)
      cancelAnimationFrame(raf)
    }
  }, [])
  return null
}
