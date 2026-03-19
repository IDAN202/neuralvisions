const env = process.env.SHOTSTACK_ENV ?? 'stage'
const apiKey = process.env.SHOTSTACK_API_KEY

export async function submitRender(edit: object): Promise<string> {
  if (!apiKey) throw new Error('SHOTSTACK_API_KEY not set')

  const res = await fetch(`https://api.shotstack.io/${env}/render`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(edit),
  })

  if (!res.ok) throw new Error(`Shotstack render error: ${res.status}`)

  const data = await res.json()
  return data.response.id as string
}

export async function getRenderStatus(jobId: string): Promise<{ status: string; url?: string }> {
  if (!apiKey) throw new Error('SHOTSTACK_API_KEY not set')

  const res = await fetch(`https://api.shotstack.io/${env}/render/${jobId}`, {
    headers: { 'x-api-key': apiKey },
  })

  if (!res.ok) throw new Error(`Shotstack status error: ${res.status}`)

  const data = await res.json()
  const { status, url } = data.response

  return { status, ...(url ? { url } : {}) }
}
