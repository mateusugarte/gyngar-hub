import { ContentNav } from './components/content-nav'

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ContentNav />
      <div style={{ flex: 1, overflow: 'auto' }} className="anim-page">
        {children}
      </div>
    </div>
  )
}
