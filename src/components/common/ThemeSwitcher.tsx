'use client'

import { useThemeStore } from '@/store/themeStore'
import Button from '@/components/ui/Button'

export default function ThemeSwitcher() {
  const { mode, setMode } = useThemeStore()

  const handleToggle = () => {
    if (mode === 'light') setMode('dark')
    else if (mode === 'dark') setMode('auto')
    else setMode('light')
  }

  return (
    <Button onClick={handleToggle} variant="secondary">
      Current mode: {mode}
    </Button>
  )
}