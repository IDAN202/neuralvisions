// Luma Dream Machine — AI video generation with free credits
// Sign up: https://lumalabs.ai — free credits on signup
// API via fal.ai proxy

const FAL_KEY = process.env.FAL_API_KEY ?? ''

export async function lumaGenerateVideo(params: {
  prompt: string
  imageUrl?: string
  loop?: boolean
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
}) {
  if (!FAL_KEY) throw new Error('FAL_API_KEY not set')

  const body: any = {
    prompt: params.prompt,
    loop: params.loop ?? false,
    aspect_ratio: params.aspectRatio ?? '16:9',
  }
  if (params.imageUrl) body.keyframes = { frame0: { type: 'image', url: params.imageUrl } }

  const res = await fetch('https://queue.fal.run/fal-ai/luma-dream-machine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Luma error: ${res.status} ${await res.text()}`)
  return res.json()
}
