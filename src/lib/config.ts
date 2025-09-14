// API配置
export const config = {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY!,
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
  },
  nanobanana: {
    apiKey: process.env.APICORE_AI_KEY!,
    apiUrl: process.env.NANOBANANA_API_URL || 'https://kg-api.cloud/v1/chat/completions',
    model: 'gpt-5-chat-latest',
  },
  turso: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
}

// 应用常量 - 已移至 src/constants/index.ts
import { APP_CONSTANTS } from '@/constants'

export const constants = {
  maxTextLength: APP_CONSTANTS.MAX_TEXT_LENGTH,
  cardSize: {
    width: APP_CONSTANTS.CARD_SIZE.WIDTH,
    height: APP_CONSTANTS.CARD_SIZE.HEIGHT,
  },
  svgSize: {
    width: APP_CONSTANTS.SVG_SIZE.WIDTH,
    height: APP_CONSTANTS.SVG_SIZE.HEIGHT,
  },
}