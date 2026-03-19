'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

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

interface ClipCardProps {
  clip: Clip
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
  rendering: 'secondary',
  done: 'default',
}

export function ClipCard({ clip, onApprove, onReject }: ClipCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <CardContent className="pt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">Clip {clip.clip_number}</Badge>
          <Badge variant={statusVariant[clip.status] ?? 'outline'}>{clip.status}</Badge>
        </div>

        <p className="font-bold text-sm leading-snug">{clip.hook_text}</p>
        <p className="text-xs text-muted-foreground">{clip.caption}</p>
        <p className="text-xs text-muted-foreground font-mono">
          {formatTime(clip.start_time)} → {formatTime(clip.end_time)}
        </p>

        {clip.render_url && (
          <video src={clip.render_url} controls className="w-full rounded-md border" />
        )}

        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onApprove(clip.id)}
            disabled={clip.status === 'approved'}
          >
            <CheckCircle className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => onReject(clip.id)}
            disabled={clip.status === 'rejected'}
          >
            <XCircle className="w-3 h-3 mr-1" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
