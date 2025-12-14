/**
 * SSR 环境判断与安全访问浏览器对象的工具。
 */
export function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 安全返回 window（非浏览器环境返回 undefined）。
 */
export function safeWindow(): (Window & typeof globalThis) | undefined {
    return typeof window !== 'undefined' ? window : undefined
}
