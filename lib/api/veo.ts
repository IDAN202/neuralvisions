// Veo 2 (Google) — cinematic AI video generation
// Access via fal.ai or Vertex AI
// Sign up: https://fal.ai

const FAL_KEY = process.env.FAL_API_KEY ?? ''

export async function veoGenerateVideo(params: {
  prompt: string
  imageUrl?: string
  duration?: number // seconds
  aspectRatio?: '16:9' | '9:16'
}) {
  if (!FAL_KEY) throw new Error('FAL_API_KEY not set')

  const body: any = {
    prompt: params.prompt,
    duration: params.duration ?? 8,
    aspect_ratio: params.aspectRatio ?? '16:9',
  }
  if (params.imageUrl) body.image_url = params.imageUrl

  const res = await fetch('https://queue.fal.run/fal-ai/veo2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Veo2 error: ${res.status} ${await res.text()}`)
  return res.json()
}
