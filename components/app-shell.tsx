'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Video, Users, Radar,
  MessageCircle, Settings, Bell, Sun, Moon,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { toggleTheme, getTheme } from '@/lib/theme'

const NAV_ITEMS = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/content',     icon: Video,            label: 'Conteúdo'   },
  { href: '/leads',       icon: Users,            label: 'Leads'      },
  { href: '/prospection', icon: Radar,            label: 'Prospecção' },
  { href: '/agent',       icon: MessageCircle,    label: 'Agente IA'  },
] as const

interface AppShellProps {
  user: User
  children: React.ReactNode
  notificationCount?: number
}

export function AppShell({ user, children, notificationCount = 0 }: AppShellProps) {
  const [expanded, setExpanded] = useState(false)
  // Lazy init: inline script no layout.tsx já aplica data-theme antes do React hidratar
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => typeof window !== 'undefined' ? getTheme() : 'dark'
  )
  const pathname = usePathname()

  const handleToggleTheme = () => {
    toggleTheme()
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const displayName = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'usuário'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        style={{
          width: expanded ? '220px' : '56px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          transition: 'width 200ms ease-out',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 shrink-0">
          <div
            style={{
              width: '30px', height: '30px', borderRadius: '10px',
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <span className="font-sans font-medium text-sm" style={{ color: 'var(--bg-base)' }}>
              G
            </span>
          </div>
          {expanded && (
            <span
              className="ml-3 font-sans font-medium text-sm whitespace-nowrap"
              style={{ color: 'var(--text-primary)' }}
            >
              Gyngar.hub
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-2 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center',
                    height: '40px', borderRadius: '8px', padding: '0 8px',
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                    position: 'relative',
                    transition: 'background 150ms ease-out',
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: 'absolute', left: 0,
                        top: '50%', transform: 'translateY(-50%)',
                        width: '4px', height: '4px', borderRadius: '50%',
                        background: 'var(--accent)',
                      }}
                    />
                  )}
                  <Icon
                    size={18}
                    style={{
                      color: active ? 'var(--accent-text)' : 'var(--text-disabled)',
                      flexShrink: 0,
                    }}
                  />
                  {expanded && (
                    <span
                      className="ml-3 text-sm whitespace-nowrap font-sans"
                      style={{ color: active ? 'var(--accent-text)' : 'var(--text-secondary)' }}
                    >
                      {label}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Settings */}
        <div className="px-2 pb-4">
          <Link href="/settings">
            <div
              style={{
                display: 'flex', alignItems: 'center',
                height: '40px', borderRadius: '8px', padding: '0 8px',
                background: pathname === '/settings' ? 'var(--accent-subtle)' : 'transparent',
                transition: 'background 150ms ease-out',
              }}
            >
              <Settings
                size={18}
                style={{
                  color: pathname === '/settings' ? 'var(--accent-text)' : 'var(--text-disabled)',
                  flexShrink: 0,
                }}
              />
              {expanded && (
                <span
                  className="ml-3 text-sm whitespace-nowrap font-sans"
                  style={{ color: pathname === '/settings' ? 'var(--accent-text)' : 'var(--text-secondary)' }}
                >
                  Configurações
                </span>
              )}
            </div>
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header
          style={{
            height: '56px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: '12px',
            background: 'var(--bg-base)',
            flexShrink: 0,
          }}
        >
          <div className="flex-1">
            <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>
              Bom dia, {displayName}
            </span>
          </div>

          {/* Notification bell */}
          <button
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            aria-label="Notificações"
          >
            <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
            {notificationCount > 0 && (
              <span
                style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: '9px', fontFamily: 'Space Mono, monospace',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={handleToggleTheme}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            aria-label="Alternar tema"
          >
            {theme === 'dark'
              ? <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
              : <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
            }
          </button>

          {/* Avatar */}
          <div
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span className="font-mono text-[11px]" style={{ color: 'var(--accent-text)' }}>
              {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
