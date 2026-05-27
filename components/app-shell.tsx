'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Video, Users, Radar,
  MessageCircle, Settings, Bell, Sun, Moon,
  LogOut, ChevronDown, X, CheckCheck,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { toggleTheme, getTheme } from '@/lib/theme'
import { signOutAction } from '@/app/actions/auth'
import { markNotificationRead, markAllNotificationsRead } from '@/app/actions/notifications'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/content',     icon: Video,            label: 'Conteúdo'   },
  { href: '/leads',       icon: Users,            label: 'Leads'      },
  { href: '/prospection', icon: Radar,            label: 'Prospecção' },
  { href: '/agent',       icon: MessageCircle,    label: 'Agente IA'  },
] as const

interface Notification {
  id: string
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  created_at: string
  link_destino?: string | null
}

interface AppShellProps {
  user: User
  children: React.ReactNode
  notifications?: Notification[]
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function AppShell({ user, children, notifications = [] }: AppShellProps) {
  const [expanded, setExpanded] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => typeof window !== 'undefined' ? getTheme() : 'dark'
  )
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications)
  const pathname = usePathname()
  const router = useRouter()

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const unread = localNotifications.filter(n => !n.lida).length

  // Sync when server-side props update (e.g. on navigation)
  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  // Supabase Realtime — listen for new notifications
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification
          setLocalNotifications(prev => [n, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user.id])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleToggleTheme = () => {
    toggleTheme()
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  async function handleNotificationClick(n: Notification) {
    setShowNotifications(false)
    if (!n.lida) {
      setLocalNotifications(prev =>
        prev.map(x => x.id === n.id ? { ...x, lida: true } : x)
      )
      await markNotificationRead(n.id)
    }
    if (n.link_destino) router.push(n.link_destino)
  }

  async function handleMarkAllRead() {
    setLocalNotifications(prev => prev.map(n => ({ ...n, lida: true })))
    await markAllNotificationsRead()
  }

  const displayName = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'usuário'

  const initials = (user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()

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
          transition: 'width 220ms ease-out',
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
              transition: 'transform 200ms ease-out',
            }}
          >
            <span className="font-sans font-medium text-sm" style={{ color: 'var(--bg-base)' }}>
              G
            </span>
          </div>
          {expanded && (
            <span
              className="ml-3 font-sans font-medium text-sm whitespace-nowrap"
              style={{ color: 'var(--text-primary)', opacity: expanded ? 1 : 0, transition: 'opacity 150ms ease-out' }}
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
              <Link key={href} href={href} className="btn-press">
                <div
                  style={{
                    display: 'flex', alignItems: 'center',
                    height: '40px', borderRadius: '8px', padding: '0 10px',
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                    position: 'relative',
                    transition: 'background 150ms ease-out',
                    gap: '10px',
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: 'absolute', left: 0,
                        top: '50%', transform: 'translateY(-50%)',
                        width: '3px', height: '18px', borderRadius: '0 2px 2px 0',
                        background: 'var(--accent)',
                      }}
                    />
                  )}
                  <Icon
                    size={17}
                    style={{
                      color: active ? 'var(--accent-text)' : 'var(--text-disabled)',
                      flexShrink: 0,
                      transition: 'color 150ms ease-out',
                    }}
                  />
                  {expanded && (
                    <span
                      className="text-[13px] whitespace-nowrap font-sans"
                      style={{
                        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                        transition: 'color 150ms ease-out',
                      }}
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
          <Link href="/settings" className="btn-press">
            <div
              style={{
                display: 'flex', alignItems: 'center',
                height: '40px', borderRadius: '8px', padding: '0 10px',
                background: pathname === '/settings' ? 'var(--accent-subtle)' : 'transparent',
                transition: 'background 150ms ease-out',
                gap: '10px',
              }}
            >
              <Settings
                size={17}
                style={{
                  color: pathname === '/settings' ? 'var(--accent-text)' : 'var(--text-disabled)',
                  flexShrink: 0,
                }}
              />
              {expanded && (
                <span
                  className="text-[13px] whitespace-nowrap font-sans"
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
            height: '52px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center',
            padding: '0 20px', gap: '10px',
            background: 'var(--bg-base)',
            flexShrink: 0,
          }}
        >
          <div className="flex-1">
            <span className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
              {getGreeting()},{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{displayName}</span>
            </span>
          </div>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Notificações"
            >
              <Bell size={17} style={{ color: unread > 0 ? 'var(--accent-text)' : 'var(--text-secondary)' }} />
              {unread > 0 && (
                <span
                  style={{
                    position: 'absolute', top: '2px', right: '2px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: 'var(--accent)', color: 'var(--bg-base)',
                    fontSize: '8px', fontFamily: 'Space Mono, monospace',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="anim-dropdown"
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '320px', maxHeight: '400px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-visible)',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  zIndex: 100,
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Dropdown header */}
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-secondary)' }}>
                    Notificações {unread > 0 ? `(${unread} novas)` : ''}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {unread > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        title="Marcar todas como lidas"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <CheckCheck size={13} style={{ color: 'var(--accent-text)' }} />
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                      <X size={13} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  </div>
                </div>

                {localNotifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>Sem notificações</p>
                  </div>
                ) : (
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {localNotifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: n.lida ? 'transparent' : 'var(--accent-subtle)',
                          cursor: 'pointer', border: 'none',
                          borderBottomColor: 'var(--border-subtle)',
                          borderBottomWidth: '1px',
                          borderBottomStyle: 'solid',
                          transition: 'background 120ms ease-out',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          {!n.lida && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '5px' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <p className="font-sans text-[13px]" style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>{n.titulo}</p>
                            <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>{n.mensagem}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={handleToggleTheme}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
            aria-label="Alternar tema"
          >
            {theme === 'dark'
              ? <Sun size={17} style={{ color: 'var(--text-secondary)' }} />
              : <Moon size={17} style={{ color: 'var(--text-secondary)' }} />
            }
          </button>

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '4px 8px 4px 4px',
                cursor: 'pointer',
                transition: 'border-color 150ms ease-out',
              }}
              aria-label="Menu do usuário"
            >
              <div
                style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="font-mono text-[10px]" style={{ color: 'var(--accent-text)' }}>
                  {initials}
                </span>
              </div>
              <span className="font-sans text-[13px]" style={{ color: 'var(--text-primary)' }}>{displayName}</span>
              <ChevronDown
                size={13}
                style={{
                  color: 'var(--text-secondary)',
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease-out',
                }}
              />
            </button>

            {showUserMenu && (
              <div
                className="anim-dropdown"
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  width: '180px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-visible)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px',
                    textDecoration: 'none',
                    transition: 'background 120ms ease-out',
                  }}
                  className="hover:bg-[var(--bg-surface-raised)]"
                >
                  <Settings size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span className="font-sans text-[13px]" style={{ color: 'var(--text-primary)' }}>Configurações</span>
                </Link>
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 8px' }} />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      transition: 'background 120ms ease-out',
                    }}
                    className="hover:bg-[var(--bg-surface-raised)]"
                  >
                    <LogOut size={14} style={{ color: 'var(--danger)' }} />
                    <span className="font-sans text-[13px]" style={{ color: 'var(--danger)' }}>Sair</span>
                  </button>
                </form>
              </div>
            )}
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
