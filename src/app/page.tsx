'use client'

import { AppProvider } from '@/context/AppContext'
import { Sidebar } from '@/components/Sidebar'
import { Canvas } from '@/components/Canvas'

export default function Home() {
  return (
    <AppProvider>
      <main className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* 左侧操作栏 - 30% */}
          <div className="w-[30%] bg-white border-r border-gray-200 shadow-sm">
            <Sidebar />
          </div>

          {/* 右侧画布 - 70% */}
          <div className="w-[70%] bg-gray-50">
            <Canvas />
          </div>
        </div>
      </main>
    </AppProvider>
  )
}