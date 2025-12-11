import { logger } from '@/lib/logger'
import { getClientIp } from '@/lib/http'

export type EventName =
  | 'page_view'
  | 'click_generate'
  | 'generate_success'
  | 'generate_fail'
  | 'export_zip'
  | 'export_fail'
  | 'signup'
  | 'pay_success'
  | 'refund'

export type EventProps = {
  user_id?: string
  session_id?: string
  ip?: string
  referrer?: string
  campaign?: string
  device?: string
  geo?: string
  variant?: string
  model?: string
  reason?: string
  amount?: number
  currency?: string
}

export function trackServer(
  req: Request & {
    headers: Headers
    cookies?: { get: (key: string) => { value: string } | undefined }
  },
  name: EventName,
  props: EventProps = {}
) {
  const ip = props.ip || getClientIp(req)
  const variant =
    props.variant ||
    req.headers.get('x-experiment-variant') ||
    req.cookies?.get('ab_variant')?.value ||
    undefined
  const rec = {
    ts: new Date().toISOString(),
    name,
    props: { ...props, ip, variant },
  }
  logger.info('event', rec, 'analytics')
  return rec
}

export function trackClient(name: EventName, props: EventProps = {}) {
  void fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, props }),
    keepalive: true,
  })
}
