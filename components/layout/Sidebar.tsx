'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Radar, BookOpen, Film, Scissors, Send, MessageSquareCode
} from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'War Room', icon: LayoutDashboard },
  { href: '/scout', label: 'Scout', icon: Radar },
  { href: '/research', label: 'Research', icon: BookOpen },
  { href: '/studio', label: 'Studio', icon: Film },
  { href: '/clips', label: 'Clips', icon: Scissors },
  { href: '/publish', label: 'Publish', icon: Send },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-border">
        <span className="font-bold text-lg tracking-tight text-primary">NeuralVisions</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <Link
          href="/editor"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname.startsWith('/editor')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <MessageSquareCode className="w-4 h-4" />
          Chat Editor
        </Link>
      </div>
    </aside>
  )
}
