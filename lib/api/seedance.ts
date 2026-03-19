// Seedance (ByteDance) — high quality AI video generation
// Access via fal.ai
// Sign up: https://fal.ai

const FAL_KEY = process.env.FAL_API_KEY ?? ''

export async function seedanceGenerateVideo(params: {
  prompt: string
  imageUrl?: string
  duration?: '5' | '10'
  resolution?: '480p' | '720p' | '1080p'
  aspectRatio?: '16:9' | '9:16' | '1:1'
}) {
  if (!FAL_KEY) throw new Error('FAL_API_KEY not set')

  const endpoint = params.imageUrl
    ? 'fal-ai/seedance-v1-pro/image-to-video'
    : 'fal-ai/seedance-v1-pro/text-to-video'

  const body: any = {
    prompt: params.prompt,
    duration: params.duration ?? '5',
    resolution: params.resolution ?? '720p',
    aspect_ratio: params.aspectRatio ?? '16:9',
  }
  if (params.imageUrl) body.image_url = params.imageUrl

  const res = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Seedance error: ${res.status} ${await res.text()}`)
  return res.json()
}
