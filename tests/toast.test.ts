import { describe, it, expect } from 'vitest'
import { whisperToast } from '@/components/Toast'

describe('Toast event', () => {
    it('dispatches app:toast with payload', () => {
        const target = new EventTarget()
        ;(globalThis as any).window = {
            addEventListener: target.addEventListener.bind(target),
            removeEventListener: target.removeEventListener.bind(target),
            dispatchEvent: target.dispatchEvent.bind(target),
        }
        class CE extends Event {
            detail: any
            constructor(type: string, params?: any) {
                super(type)
                this.detail = params?.detail
            }
        }
        ;(globalThis as any).CustomEvent = CE
        let received: any = null

        const handler = (e: any) => {
            received = e.detail
        }

        // @ts-ignore
        window.addEventListener('app:toast', handler)
        whisperToast('hello', 'info')
        // @ts-ignore
        window.removeEventListener('app:toast', handler)
        expect(received).toEqual({ message: 'hello', type: 'info' })
    })
})
