'use client'

import { useState, useCallback } from 'react'
import { VideoPreview } from '@/components/editor/VideoPreview'
import { ChatThread } from '@/components/editor/ChatThread'
import { ChatInput } from '@/components/editor/ChatInput'

interface Message {
  id: string
  role: string
  content: string
  action_type?: string | null
}

interface Project {
  id: string
  title: string
  render_url: string | null
  render_job_id: string | null
}

interface EditorClientProps {
  project: Project
  sessionId: string
  initialMessages: Message[]
}

export function EditorClient({ project, sessionId, initialMessages }: EditorClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [renderUrl, setRenderUrl] = useState<string | null>(project.render_url)
  const [jobId, setJobId] = useState<string | null>(project.render_job_id)

  const handleSend = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)

    try {
      const res = await fetch('/api/editor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          projectId: project.id,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error('Request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
      }

      // Re-fetch latest message from server to get action_type
      const latestRes = await fetch(
        `/api/editor/messages?sessionId=${sessionId}&limit=1`
      ).catch(() => null)

      let action_type: string | null = null
      if (latestRes?.ok) {
        const latest = await latestRes.json().catch(() => null)
        action_type = latest?.action_type ?? null

        // If a re_render was triggered, refresh job/render state
        if (action_type === 're_render') {
          setJobId(project.render_job_id)
          setRenderUrl(null)
        }
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        action_type,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsStreaming(false)
    }
  }, [sessionId, project.id, project.render_job_id])

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left pane — video preview (40%) */}
      <div className="w-[40%] shrink-0">
        <VideoPreview
          renderUrl={renderUrl}
          projectId={project.id}
          jobId={jobId}
        />
      </div>

      {/* Right pane — chat (60%) */}
      <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden bg-background">
        <ChatThread messages={messages} isStreaming={isStreaming} />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
