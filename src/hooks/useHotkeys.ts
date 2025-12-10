'use client'

import { useEffect } from 'react'

export function useHotkeys(map: Record<string, () => void>) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = (e.metaKey || e.ctrlKey ? 'Cmd+' : '') + e.key
      if (map[key]) {
        e.preventDefault()
        map[key]()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [map])
}

