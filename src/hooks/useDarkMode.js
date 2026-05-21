import { useState, useEffect } from 'react'

const KEY = 'prick_theme'

export function useDarkMode() {
  // Default: dark (negro) — toggle adds 'light' class
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(KEY)
    if (stored !== null) return stored === 'dark'
    return true // always start dark
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark]
}
