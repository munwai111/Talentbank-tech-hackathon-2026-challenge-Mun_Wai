'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Avoid hydration mismatch — render nothing until client resolves theme
  if (!mounted) return <div className={size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'} />

  const isDark = resolvedTheme === 'dark'
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        inline-flex items-center justify-center rounded-lg transition-all duration-200
        ${size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'}
        text-muted-foreground hover:text-foreground
        bg-transparent hover:bg-accent
        border border-transparent hover:border-border
        ${className}
      `}
    >
      {isDark
        ? <Sun size={iconSize} strokeWidth={1.75} />
        : <Moon size={iconSize} strokeWidth={1.75} />
      }
    </button>
  )
}
