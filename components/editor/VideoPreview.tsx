'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoPreviewProps {
  renderUrl: string | null
  projectId: string
  jobId: string | null
}

interface StatusResponse {
  status: string
  render_url?: string
  progress?: number
}

export function VideoPreview({ renderUrl, projectId, jobId }: VideoPreviewProps) {
  const [polledUrl, setPolledUrl] = useState<string | null>(renderUrl)
  const [status, setStatus] = useState<string>('processing')
  const [progress, setProgress] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setPolledUrl(renderUrl)
  }, [renderUrl])

  useEffect(() => {
    if (polledUrl || !jobId) return

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/status?jobId=${jobId}&projectId=${projectId}`)
        if (!res.ok) return
        const data: StatusResponse = await res.json()
        setStatus(data.status)
        if (data.progress !== undefined) setProgress(data.progress)
        if (data.render_url) {
          setPolledUrl(data.render_url)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        // ignore transient fetch errors
      }
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [jobId, projectId, polledUrl])

  if (polledUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
        <video
          src={polledUrl}
          controls
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  if (jobId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex flex-col items-center gap-2 text-center px-6">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-foreground capitalize">{status}</p>
          {progress > 0 && (
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          )}
          <p className="text-xs text-muted-foreground">Checking every 5 seconds…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/30 rounded-lg border border-dashed border-border">
      <p className="text-sm text-muted-foreground">No video rendered yet</p>
      <p className="text-xs text-muted-foreground">Ask the editor to re-render when you're ready</p>
    </div>
  )
}
