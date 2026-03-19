'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Film, Loader2 } from 'lucide-react'

interface ResearchActionsProps {
  reportId: string
  status: string
  title: string
}

export function ResearchActions({ reportId, status, title }: ResearchActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function approve() {
    await supabase.from('research_reports').update({ status: 'approved' }).eq('id', reportId)
    toast.success('Research approved')
    router.refresh()
  }

  async function reject() {
    await supabase.from('research_reports').update({ status: 'rejected' }).eq('id', reportId)
    toast.error('Research rejected')
    router.refresh()
  }

  async function generateScript() {
    setLoading(true)
    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchId: reportId, title }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Script generated — opening Studio')
      router.push(`/studio/${data.projectId}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {status !== 'approved' && (
        <Button onClick={approve} variant="default">
          <CheckCircle className="w-4 h-4 mr-2" /> Approve
        </Button>
      )}
      {status !== 'rejected' && (
        <Button onClick={reject} variant="destructive">
          <XCircle className="w-4 h-4 mr-2" /> Reject
        </Button>
      )}
      {status === 'approved' && (
        <Button onClick={generateScript} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Film className="w-4 h-4 mr-2" />}
          Generate Script in Studio
        </Button>
      )}
    </div>
  )
}
