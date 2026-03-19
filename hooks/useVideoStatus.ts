import { useEffect, useRef, useState } from 'react'

interface UseVideoStatusOptions {
  jobId: string | null
  projectId: string
}

interface UseVideoStatusResult {
  status: string
  url: string | null
  isPolling: boolean
}

export function useVideoStatus({ jobId, projectId }: UseVideoStatusOptions): UseVideoStatusResult {
  const [status, setStatus] = useState<string>('queued')
  const [url, setUrl] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState<boolean>(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/video/status?jobId=${jobId}&projectId=${projectId}`)
        if (!res.ok) return
        const data = await res.json()
        setStatus(data.status)
        if (data.url) setUrl(data.url)

        if (data.status === 'done' || data.status === 'failed') {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setIsPolling(false)
        }
      } catch {
        // silently retry on network errors
      }
    }

    setIsPolling(true)
    poll()
    intervalRef.current = setInterval(poll, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
    }
  }, [jobId, projectId])

  return { status, url, isPolling }
}
