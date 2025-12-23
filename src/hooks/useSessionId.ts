'use client'

/**
 *
 */
export function useSessionId() {
    const sid = ensureSessionId()
    return sid
}

function ensureSessionId() {
    if (typeof document === 'undefined') return undefined
    const key = 'sid'
    const existing = getCookie(key)
    if (existing) return existing
    const newId = genId()
    setCookie(key, newId, 365)
    return newId
}

/**
 * 生成会话ID（随机前缀 + 时间戳后缀）。
 */
function genId() {
    return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/**
 * 读取指定 Cookie 值。
 */
function getCookie(name: string) {
    const m = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
    return m && m[2] ? decodeURIComponent(m[2]) : undefined
}

/**
 * 写入 Cookie，带过期与安全属性。
 */
function setCookie(name: string, value: string, days: number) {
    if (typeof document === 'undefined') return
    const d = new Date()
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`
}
