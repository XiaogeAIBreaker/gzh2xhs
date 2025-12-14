/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { useHotkeys } from '@/hooks/useHotkeys'

function TestComp({ onCmdK }: { onCmdK: () => void }) {
    useHotkeys({ 'Cmd+k': onCmdK })
    return React.createElement('div')
}

describe('useHotkeys', () => {
    it('fires callback on Cmd+k', async () => {
        const fn = vi.fn()
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)
        root.render(React.createElement(TestComp, { onCmdK: fn }))

        const ev = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
        window.dispatchEvent(ev)
        expect(fn).toHaveBeenCalledTimes(1)
        root.unmount()
        document.body.removeChild(container)
    })
})
