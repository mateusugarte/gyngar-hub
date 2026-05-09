type Theme = 'dark' | 'light'

const KEY = 'gyngar-theme'

export function initTheme(): void {
  if (typeof window === 'undefined') return
  const saved = localStorage.getItem(KEY) as Theme | null
  const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const theme = saved ?? preferred
  document.documentElement.setAttribute('data-theme', theme)
}

export function toggleTheme(): void {
  if (typeof window === 'undefined') return
  const current = document.documentElement.getAttribute('data-theme') as Theme
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem(KEY, next)
}

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (document.documentElement.getAttribute('data-theme') as Theme) ?? 'dark'
}
