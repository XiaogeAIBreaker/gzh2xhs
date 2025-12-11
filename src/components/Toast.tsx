'use client'

import { useEffect, useRef, useState } from 'react'

type ToastItem = { id: number; message: string; type?: 'success' | 'error' | 'info' }

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toastRef = useRef<HTMLDivElement>(null)
  const toastTimerRef = useRef<number>(0)
  const toastCloseTimerRef = useRef<number>(0)
  const toastCloseDelay = 1000
  const toastCloseTimerDelay = 3000
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)
  console.log('toastCloseDelay', toastCloseDelay)
  console.log('toastCloseTimerDelay', toastCloseTimerDelay)

  useEffect(() => {
    function onToast(e: CustomEvent<ToastItem>) {
      setToasts((list) => [...list, { ...e.detail, id: Date.now() }])
      setTimeout(() => {
        setToasts((list) => list.slice(1))
      }, toastCloseTimerDelay)
    }
    window.addEventListener('app:toast' as any, onToast as any)
    return () => window.removeEventListener('app:toast' as any, onToast as any)
  }, [])

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass-card rounded-lg px-4 py-2 text-sm shadow-neon ${
            t.type === 'success'
              ? 'border-green-400/40 text-green-300'
              : t.type === 'error'
                ? 'border-red-400/40 text-red-300'
                : 'border-white/10 text-white/90'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function showToast(message: string, type?: ToastItem['type']) {
  const event = new CustomEvent('app:toast', { detail: { message, type } })
  window.dispatchEvent(event)
}
