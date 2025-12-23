'use client'

import { motion } from 'framer-motion'
import NeonHeading from '@/components/NeonHeading'
import ParallaxHero from '@/components/ParallaxHero'
import HoverTiltCard from '@/components/HoverTiltCard'
import FrostedPanel from '@/components/FrostedPanel'
import ParticlesBackground from '@/components/ParticlesBackground'
import { Rocket, Cpu, Sparkles, Zap } from 'lucide-react'

/**
 *
 */
export default function ExperiencePage() {
    return (
        <main className="relative min-h-screen">
            <div className="container mx-auto px-6 py-10">
                <section className="relative mb-16">
                    <ParallaxHero>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <NeonHeading
                                title="宇宙级酷炫体验"
                                subtitle="现代视觉 · 视差滚动 · 微交互"
                            />
                            <div className="mt-6 flex items-center gap-3">
                                <button className="btn-glow rounded-lg bg-white/10 px-5 py-3 text-sm hover:bg-white/15">
                                    立即体验
                                </button>
                                <button className="glass-card rounded-lg px-5 py-3 text-sm">
                                    了解设计
                                </button>
                            </div>
                        </div>
                    </ParallaxHero>
                    <div className="pointer-events-none absolute inset-0">
                        <ParticlesBackground enabled={false} />
                    </div>
                </section>

                <section className="mb-16">
                    <motion.div
                        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <HoverTiltCard>
                            <FrostedPanel className="h-full p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <Sparkles className="text-neon" size={18} />
                                    <span className="font-medium">动态背景与渐变流动</span>
                                </div>
                                <p className="text-sm opacity-80">
                                    极光/星空/网格层叠，流动渐变与轻微视差，营造沉浸氛围。
                                </p>
                            </FrostedPanel>
                        </HoverTiltCard>
                        <HoverTiltCard>
                            <FrostedPanel className="h-full p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <Zap className="text-neon" size={18} />
                                    <span className="font-medium">微交互与悬停细节</span>
                                </div>
                                <p className="text-sm opacity-80">
                                    卡片随鼠标倾斜与高光、按钮涟漪与磁吸，细腻且克制。
                                </p>
                            </FrostedPanel>
                        </HoverTiltCard>
                        <HoverTiltCard>
                            <FrostedPanel className="h-full p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <Cpu className="text-neon" size={18} />
                                    <span className="font-medium">滚动视差与分层</span>
                                </div>
                                <p className="text-sm opacity-80">
                                    多层元素按不同速率与透明度变化，滚动过程平滑自然。
                                </p>
                            </FrostedPanel>
                        </HoverTiltCard>
                    </motion.div>
                </section>

                <section className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <FrostedPanel className="p-8">
                            <div className="flex flex-col items-center gap-8 lg:flex-row">
                                <div className="flex-1">
                                    <NeonHeading
                                        title="统一风格与强烈层次"
                                        subtitle="玻璃拟态 · 霓虹光效 · 流式排版"
                                    />
                                    <p className="mt-4 text-sm opacity-80">
                                        为桌面与移动端提供一致的视觉语言，色彩与光影统一，强调科技感与现代性。
                                    </p>
                                </div>
                                <div className="grid flex-1 grid-cols-2 gap-4">
                                    <HoverTiltCard>
                                        <div className="shine-overlay glass-card flex h-full items-center justify-center rounded-lg p-6">
                                            <Rocket className="text-neon" size={28} />
                                        </div>
                                    </HoverTiltCard>
                                    <HoverTiltCard>
                                        <div className="shine-overlay glass-card flex h-full items-center justify-center rounded-lg p-6">
                                            <Sparkles className="text-accent" size={28} />
                                        </div>
                                    </HoverTiltCard>
                                </div>
                            </div>
                        </FrostedPanel>
                    </motion.div>
                </section>

                <section>
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <div className="glass-card inline-flex items-center gap-3 rounded-xl px-6 py-4 shadow-neon">
                            <Rocket size={18} className="text-neon" />
                            <span className="text-sm">准备好进入下一代视觉体验</span>
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button className="btn-glow rounded-lg bg-white/10 px-6 py-3 text-sm hover:bg-white/15">
                                开始探索
                            </button>
                            <button className="glass-card rounded-lg px-6 py-3 text-sm">
                                更多示例
                            </button>
                        </div>
                    </motion.div>
                </section>
            </div>
        </main>
    )
}
