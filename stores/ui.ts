'use client'

import { create } from 'zustand'

interface UIStore {
  sidebarExpanded: boolean
  setSidebarExpanded: (v: boolean) => void
  notificationCount: number
  setNotificationCount: (n: number) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarExpanded: false,
  setSidebarExpanded: (v) => set({ sidebarExpanded: v }),
  notificationCount: 0,
  setNotificationCount: (n) => set({ notificationCount: n }),
}))
