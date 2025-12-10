'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // no-op
  }, [error])

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">发生错误</h2>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-black px-3 py-2 text-white hover:bg-gray-800"
      >
        重试
      </button>
    </div>
  )
}
