'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ClipCard } from '@/components/clips/ClipCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Film } from 'lucide-react'

interface Clip {
  id: string
  clip_number: number
  start_time: number
  end_time: number
  hook_text: string
  caption: string
  status: string
  render_url?: string | null
}

interface ClipJob {
  id: string
  source_url: string
  status: string
}

interface ClipsReviewClientProps {
  job: ClipJob
  initialClips: Clip[]
}

export function ClipsReviewClient({ job, initialClips }: ClipsReviewClientProps) {
  const [clips, setClips] = useState<Clip[]>(initialClips)
  const [loadingRender, setLoadingRender] = useState(false)
  const supabase = createClient()

  async function handleApprove(id: string) {
    const { error } = await supabase.from('clips').update({ status: 'approved' }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setClips(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
    toast.success('Clip approved')
  }

  async function handleReject(id: string) {
    const { error } = await supabase.from('clips').update({ status: 'rejected' }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setClips(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
    toast.success('Clip rejected')
  }

  async function renderApproved() {
    const approvedIds = clips.filter(c => c.status === 'approved').map(c => c.id)
    if (approvedIds.length === 0) { toast.error('No approved clips to render'); return }

    setLoadingRender(true)
    try {
      const res = await fetch('/api/video/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'clips', clipIds: approvedIds }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Render job submitted — check back in a few minutes')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingRender(false)
    }
  }

  const approvedCount = clips.filter(c => c.status === 'approved').length

  return (
    <AppShell title="Review Clips">
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline">{job.status}</Badge>
          <p className="text-xs text-muted-foreground truncate max-w-sm">{job.source_url}</p>
          <Button
            size="sm"
            className="ml-auto"
            onClick={renderApproved}
            disabled={loadingRender || approvedCount === 0}
          >
            {loadingRender
              ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              : <Film className="w-3 h-3 mr-1" />}
            Render Approved Clips ({approvedCount})
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {clips.map(clip => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
