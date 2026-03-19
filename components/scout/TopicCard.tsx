'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, ExternalLink } from 'lucide-react'

interface Topic {
  title: string
  summary: string
  source_url: string
  source: string
  thumbnail: string | null
  score: number
}

interface TopicCardProps {
  topic: Topic
  onApprove: (topic: Topic) => void
  approved?: boolean
}

export function TopicCard({ topic, onApprove, approved }: TopicCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {topic.thumbnail && (
        <div className="relative h-36 w-full bg-muted">
          <Image src={topic.thumbnail} alt={topic.title} fill className="object-cover" unoptimized />
        </div>
      )}
      <CardContent className="pt-3 pb-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs shrink-0">{topic.source}</Badge>
          <span className="text-xs text-muted-foreground">Score: {topic.score}</span>
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">{topic.title}</p>
        {topic.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{topic.summary}</p>
        )}
        <div className="flex gap-2 mt-auto pt-2">
          <Button
            size="sm"
            className="flex-1"
            variant={approved ? 'secondary' : 'default'}
            onClick={() => onApprove(topic)}
            disabled={approved}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            {approved ? 'Approved' : 'Approve'}
          </Button>
          <a href={topic.source_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
