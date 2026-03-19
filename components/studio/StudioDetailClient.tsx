'use client'

import { useState, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SceneCard } from '@/components/studio/SceneCard'
import { SceneEditor } from '@/components/studio/SceneEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Image as ImageIcon, Volume2, Film, MessageSquareCode } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface Project {
  id: string
  title: string
  status: string
  render_url: string | null
}

interface StudioDetailClientProps {
  project: Project
  initialScenes: Scene[]
  userId: string
}

export function StudioDetailClient({ project, initialScenes, userId }: StudioDetailClientProps) {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [editingScene, setEditingScene] = useState<Scene | null>(null)
  const [loadingBroll, setLoadingBroll] = useState(false)
  const [loadingVO, setLoadingVO] = useState(false)
  const [loadingRender, setLoadingRender] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const refreshScenes = useCallback(async () => {
    const { data } = await supabase.from('scenes').select('*').eq('project_id', project.id).order('scene_number')
    if (data) setScenes(data)
  }, [project.id])

  async function fetchBroll() {
    setLoadingBroll(true)
    try {
      const res = await fetch('/api/studio/broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      const data = await res.json()
      toast.success(`B-Roll fetched for ${data.updated} scenes`)
      await refreshScenes()
    } catch { toast.error('B-Roll fetch failed') }
    finally { setLoadingBroll(false) }
  }

  async function generateVoiceovers() {
    setLoadingVO(true)
    try {
      const res = await fetch('/api/studio/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      const data = await res.json()
      toast.success(`Voiceovers generated for ${data.processed} scenes`)
      await refreshScenes()
    } catch { toast.error('Voiceover generation failed') }
    finally { setLoadingVO(false) }
  }

  async function assembleVideo() {
    setLoadingRender(true)
    try {
      const res = await fetch('/api/video/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, mode: 'explainer' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Render job submitted — check back in a few minutes')
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setLoadingRender(false) }
  }

  const voCount = scenes.filter(s => s.voiceover_url).length
  const brollCount = scenes.filter(s => s.broll_url).length

  return (
    <AppShell title={project.title}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline">{project.status}</Badge>
          <span className="text-xs text-muted-foreground">{brollCount}/30 B-Roll · {voCount}/30 VO</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <Button size="sm" variant="outline" onClick={fetchBroll} disabled={loadingBroll}>
              {loadingBroll ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ImageIcon className="w-3 h-3 mr-1" />}
              Fetch B-Roll
            </Button>
            <Button size="sm" variant="outline" onClick={generateVoiceovers} disabled={loadingVO}>
              {loadingVO ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Volume2 className="w-3 h-3 mr-1" />}
              Generate Voiceovers
            </Button>
            <Button size="sm" onClick={assembleVideo} disabled={loadingRender}>
              {loadingRender ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Film className="w-3 h-3 mr-1" />}
              Assemble Video
            </Button>
            <Button size="sm" variant="secondary" onClick={() => router.push(`/editor/${project.id}`)}>
              <MessageSquareCode className="w-3 h-3 mr-1" /> Chat Editor
            </Button>
          </div>
        </div>

        {project.render_url && (
          <div className="rounded-lg overflow-hidden border">
            <video src={project.render_url} controls className="w-full max-h-64" />
          </div>
        )}

        {/* Scene Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {scenes.map(scene => (
            <SceneCard key={scene.id} scene={scene} onEdit={(s: Scene) => { setEditingScene(s) }} />
          ))}
        </div>
      </div>

      <SceneEditor
        scene={editingScene}
        onClose={() => setEditingScene(null)}
        onSaved={refreshScenes}
      />
    </AppShell>
  )
}
