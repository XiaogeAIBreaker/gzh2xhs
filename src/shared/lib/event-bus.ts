type Handler = (event: { type: string; payload: any; ts: number }) => void

const subscribers: Record<string, Set<Handler>> = {}

export function publish(type: string, payload: any) {
    const event = { type, payload, ts: Date.now() }
    const subs = subscribers[type]
    if (!subs) return
    for (const h of subs) {
        try {
            h(event)
        } catch {}
    }
}

export function subscribe(type: string, handler: Handler) {
    if (!subscribers[type]) subscribers[type] = new Set<Handler>()
    subscribers[type].add(handler)
    return () => subscribers[type].delete(handler)
}

// 生产环境建议替换为 Kafka/Pulsar 客户端
// 主题建议：user.created、content.published、payment.succeeded 等
