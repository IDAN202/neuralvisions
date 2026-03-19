// Runway Gen-3 Alpha — professional AI video generation
// Sign up: https://runwayml.com — free credits on signup
// Docs: https://docs.dev.runwayml.com

const RUNWAY_KEY = process.env.RUNWAY_API_KEY ?? ''

export async function runwayGenerateVideo(params: {
  promptText: string
  promptImage?: string // base64 or URL
  duration?: 5 | 10
  ratio?: '1280:720' | '720:1280' | '1104:832'
}) {
  if (!RUNWAY_KEY) throw new Error('RUNWAY_API_KEY not set')

  const body: any = {
    model: 'gen3a_turbo',
    promptText: params.promptText,
    duration: params.duration ?? 5,
    ratio: params.ratio ?? '1280:720',
  }
  if (params.promptImage) body.promptImage = params.promptImage

  const res = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RUNWAY_KEY}`,
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Runway error: ${res.status} ${await res.text()}`)
  return res.json() // returns { id } — poll for completion
}

export async function runwayPollTask(taskId: string) {
  const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${RUNWAY_KEY}`,
      'X-Runway-Version': '2024-11-06',
    },
  })
  if (!res.ok) throw new Error(`Runway poll error: ${res.status}`)
  return res.json() // { status: 'SUCCEEDED'|'FAILED'|'RUNNING', output: [url] }
}
