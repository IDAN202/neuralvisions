'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface QueueItem {
  id: string
  entity_type: string
  title: string
  status: string
  created_at: string
}

export function ApprovalQueue({ userId }: { userId: string }) {
  const [items, setItems] = useState<QueueItem[]>([])
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('approval_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setItems(data ?? [])
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('approval_queue_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function approve(item: QueueItem) {
    const table = item.entity_type === 'topic' ? 'topics'
      : item.entity_type === 'research' ? 'research_reports'
      : item.entity_type === 'project' ? 'projects' : 'clips'
    await supabase.from(table).update({ status: 'approved' }).eq('id', item.id)
    toast.success(`${item.entity_type} approved`)
    load()
  }

  async function reject(item: QueueItem) {
    const table = item.entity_type === 'topic' ? 'topics'
      : item.entity_type === 'research' ? 'research_reports'
      : item.entity_type === 'project' ? 'projects' : 'clips'
    await supabase.from(table).update({ status: 'rejected' }).eq('id', item.id)
    toast.error(`${item.entity_type} rejected`)
    load()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          Approval Queue
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">All clear</p>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs mb-1">{item.entity_type}</Badge>
                    <p className="text-sm truncate">{item.title}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-green-500" onClick={() => approve(item)}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" onClick={() => reject(item)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
