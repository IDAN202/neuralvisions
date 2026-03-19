// Kling AI — state-of-the-art video generation (Kling 2.0/3.0)
// Sign up: https://klingai.com — free credits available
// API via fal.ai proxy

const FAL_KEY = process.env.FAL_API_KEY ?? ''

export async function klingGenerateVideo(params: {
  prompt: string
  imageUrl?: string
  duration?: '5' | '10'
  aspectRatio?: '16:9' | '9:16' | '1:1'
}) {
  if (!FAL_KEY) throw new Error('FAL_API_KEY not set')

  const endpoint = params.imageUrl
    ? 'fal-ai/kling-video/v2/master/image-to-video'
    : 'fal-ai/kling-video/v2/master/text-to-video'

  const body: any = {
    prompt: params.prompt,
    duration: params.duration ?? '5',
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
  if (!res.ok) throw new Error(`Kling error: ${res.status} ${await res.text()}`)
  return res.json() // { request_id } — poll for completion
}

export async function klingPollResult(endpoint: string, requestId: string) {
  const res = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}`, {
    headers: { Authorization: `Key ${FAL_KEY}` },
  })
  if (!res.ok) throw new Error(`Kling poll error: ${res.status}`)
  return res.json()
}
