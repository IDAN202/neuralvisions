'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: string
  title: string
  status: string
  created_at: string
}

export function RecentActivity({ userId }: { userId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [topics, research, projects, clips] = await Promise.all([
        supabase.from('topics').select('id, title, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('research_reports').select('id, title, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('projects').select('id, title, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('clip_jobs').select('id, source_url, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      ])

      const all: ActivityItem[] = [
        ...(topics.data ?? []).map(t => ({ ...t, type: 'topic' })),
        ...(research.data ?? []).map(r => ({ ...r, type: 'research' })),
        ...(projects.data ?? []).map(p => ({ ...p, type: 'project' })),
        ...(clips.data ?? []).map(c => ({ id: c.id, title: c.source_url, status: c.status, created_at: c.created_at, type: 'clip' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15)

      setItems(all)
    }
    load()
  }, [userId])

  const statusColor: Record<string, string> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    done: 'default',
    draft: 'outline',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={(statusColor[item.status] ?? 'outline') as any} className="text-xs shrink-0">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
