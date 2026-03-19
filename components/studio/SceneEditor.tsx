'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Scene {
  id: string
  scene_number: number
  narration_text: string | null
  broll_suggestion: string | null
  visual_prompt: string | null
}

interface SceneEditorProps {
  scene: Scene | null
  onClose: () => void
  onSaved: () => void
}

export function SceneEditor({ scene, onClose, onSaved }: SceneEditorProps) {
  const [narration, setNarration] = useState(scene?.narration_text ?? '')
  const [broll, setBroll] = useState(scene?.broll_suggestion ?? '')
  const [visual, setVisual] = useState(scene?.visual_prompt ?? '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function save() {
    if (!scene) return
    setSaving(true)
    const { error } = await supabase.from('scenes').update({
      narration_text: narration,
      broll_suggestion: broll,
      visual_prompt: visual,
    }).eq('id', scene.id)
    setSaving(false)
    if (error) { toast.error('Failed to save'); return }
    toast.success(`Scene ${scene.scene_number} saved`)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={!!scene} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Scene {scene?.scene_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Narration (~30-40 words)</label>
            <Textarea
              value={narration}
              onChange={e => setNarration(e.target.value)}
              rows={4}
              placeholder="What the narrator says for this 12-second scene..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">B-Roll Search Query</label>
            <Input value={broll} onChange={e => setBroll(e.target.value)} placeholder="e.g. football stadium crowd cheering" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">AI Visual Prompt</label>
            <Input value={visual} onChange={e => setVisual(e.target.value)} placeholder="e.g. futuristic AI robot analyzing data, digital art" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
