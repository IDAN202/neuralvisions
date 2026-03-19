// Make.com (Integromat) — trigger workflows via webhook
// Sign up: https://make.com — 1000 ops/month free
// Create a scenario with a Webhook trigger, copy the webhook URL
// Set MAKE_WEBHOOK_URL in .env.local

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL ?? ''

export async function triggerMakeScenario(payload: {
  action: string
  videoUrl?: string
  caption?: string
  platforms?: string[]
  scheduledAt?: string
  metadata?: Record<string, any>
}) {
  if (!MAKE_WEBHOOK_URL) throw new Error('MAKE_WEBHOOK_URL not set')

  const res = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Make.com webhook error: ${res.status} ${await res.text()}`)
  // Make.com webhooks return plain text "Accepted"
  const text = await res.text()
  return { accepted: true, response: text }
}
