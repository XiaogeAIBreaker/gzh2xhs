import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/application/usecases/GenerateCardUseCase.ts',
        'src/interfaces/http/controllers/GenerateController.ts',
        'src/lib/**/*.ts',
        '!src/lib/prompts.ts',
        'src/shared/lib/**/*.ts',
        '!src/shared/lib/playwright.ts',
        '!src/shared/lib/redis.ts',
        '!src/shared/lib/image-converter.ts',
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
        'src/shared/lib/rateLimiter.ts',
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        branches: 80,
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
