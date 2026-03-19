// Buffer API — schedule posts to Instagram, Facebook, Twitter
// Sign up: https://buffer.com — free tier available
// Get access token: https://buffer.com/developers/api

const BUFFER_TOKEN = process.env.BUFFER_ACCESS_TOKEN ?? ''

export async function bufferGetProfiles() {
  const res = await fetch('https://api.bufferapp.com/1/profiles.json', {
    headers: { Authorization: `Bearer ${BUFFER_TOKEN}` },
  })
  if (!res.ok) throw new Error(`Buffer error: ${res.status}`)
  return res.json()
}

export async function bufferSchedulePost(params: {
  profileIds: string[]
  text: string
  mediaLink?: string
  scheduledAt?: string // Unix timestamp as string
}) {
  const body = new URLSearchParams()
  params.profileIds.forEach(id => body.append('profile_ids[]', id))
  body.append('text', params.text)
  if (params.mediaLink) body.append('media[link]', params.mediaLink)
  if (params.scheduledAt) {
    body.append('scheduled_at', params.scheduledAt)
    body.append('now', 'false')
  } else {
    body.append('now', 'true')
  }

  const res = await fetch('https://api.bufferapp.com/1/updates/create.json', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BUFFER_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`Buffer schedule error: ${res.status} ${await res.text()}`)
  return res.json()
}
