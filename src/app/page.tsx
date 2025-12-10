'use client'

import { AppProvider } from '@/context/AppContext'
import { Sidebar } from '@/components/Sidebar'
import { Canvas } from '@/components/Canvas'

export default function Home() {
  return (
    <AppProvider>
      <main className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="flex gap-6 h-[calc(100vh-4rem)]">
            <div className="w-[30%] glass-card rounded-xl shadow-neon overflow-hidden">
              <Sidebar />
            </div>
            <div className="w-[70%] glass-card rounded-xl shadow-neon overflow-hidden glow">
              <Canvas />
            </div>
          </div>
        </div>
      </main>
    </AppProvider>
  )
}
