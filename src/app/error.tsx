'use client'
import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        logger.error(
            'page_error',
            { message: error.message, stack: (error as any).stack, digest: (error as any).digest },
            'ui',
        )
    }, [error])

    return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
            <div className="max-w-md w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h1 className="text-lg font-semibold text-neutral-900">页面出现错误</h1>
                <p className="mt-2 text-sm text-neutral-600">{error.message}</p>
                <div className="mt-4 flex gap-3">
                    <button
                        className="inline-flex items-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                        onClick={() => reset()}
                    >
                        重试
                    </button>
                    <button
                        className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        onClick={() => (window.location.href = '/')}
                    >
                        返回首页
                    </button>
                </div>
            </div>
        </div>
    )
}
