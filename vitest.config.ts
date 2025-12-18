import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        exclude: ['apps/api/test/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: [
                'src/application/usecases/GenerateCardUseCase.ts',
                'src/interfaces/http/controllers/GenerateController.ts',
                'src/lib/http.ts',
                'src/lib/image-converter.ts',
                'src/lib/logger.ts',
                'src/lib/rateLimiter.ts',
                'src/lib/redis.ts',
                'src/shared/lib/**/*.ts',
                '!src/shared/lib/playwright.ts',
                '!src/shared/lib/redis.ts',
                '!src/shared/lib/image-converter.ts',
                '!src/shared/lib/browser.ts',
                '!src/shared/lib/downloader.ts',
                '!src/services/types.ts',
                'src/config/index.ts',
                'src/container/index.ts',
                'src/constants/index.ts',
                'tests/**/*.ts',
            ],
            exclude: [
                'src/components/**',
                'src/app/**',
                'src/context/**',
                'src/docs/**',
                'src/hooks/**',
                'src/features/**',
                'src/services/**',
            ],
            thresholds: {
                lines: 90,
                statements: 90,
                branches: 84,
                functions: 85,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
})
