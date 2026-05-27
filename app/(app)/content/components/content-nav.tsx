'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/content',           label: 'Visão Geral', exact: true },
  { href: '/content/calendar',  label: 'Calendário',  exact: false },
  { href: '/content/ideas',     label: 'Ideias',      exact: false },
  { href: '/content/planning',  label: 'Planejamento', exact: false },
  { href: '/content/icp',       label: 'ICP',          exact: false },
  { href: '/content/objectives', label: 'Objetivos',  exact: false },
]

export function ContentNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        display: 'flex',
        gap: '2px',
        padding: '0 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        flexShrink: 0,
      }}
    >
      {TABS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="font-mono text-[9px] uppercase tracking-[0.08em]"
            style={{
              padding: '10px 14px',
              color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
              textDecoration: 'none',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'color 150ms ease-out, border-color 150ms ease-out',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
