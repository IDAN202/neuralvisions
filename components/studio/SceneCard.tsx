'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Volume2 } from 'lucide-react'

interface Scene {
  id: string
  scene_number: number
  narration_text: string | null
  broll_suggestion: string | null
  broll_url: string | null
  voiceover_url: string | null
  visual_prompt: string | null
  status: string
  duration: number
}

interface SceneCardProps {
  scene: Scene
  onEdit: (scene: Scene) => void
}

export function SceneCard({ scene, onEdit }: SceneCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
      <div className="relative h-28 bg-muted">
        {scene.broll_url ? (
          <video src={scene.broll_url} className="w-full h-full object-cover" muted />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No B-Roll
          </div>
        )}
        <Badge className="absolute top-1.5 left-1.5 text-xs">{scene.scene_number}</Badge>
        {scene.voiceover_url && (
          <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full p-0.5">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <CardContent className="pt-2 pb-3 flex flex-col gap-2 flex-1">
        <p className="text-xs leading-snug line-clamp-3 text-foreground">
          {scene.narration_text ?? 'No narration yet'}
        </p>
        {scene.broll_suggestion && (
          <p className="text-xs text-muted-foreground line-clamp-1 italic">{scene.broll_suggestion}</p>
        )}
        <Button size="sm" variant="ghost" className="mt-auto w-full" onClick={() => onEdit(scene)}>
          <Pencil className="w-3 h-3 mr-1" /> Edit
        </Button>
      </CardContent>
    </Card>
  )
}
