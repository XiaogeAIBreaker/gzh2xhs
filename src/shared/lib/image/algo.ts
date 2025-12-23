import { APP_CONSTANTS } from '@/constants'

/**
 *
 */
export function containsEmoji(svgContent: string): boolean {
    return /[\u{1F000}-\u{1FFFF}]/u.test(svgContent)
}

/**
 *
 */
export function createHtmlWrapper(svgContent: string): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: ${APP_CONSTANTS.CARD_SIZE.WIDTH}px; height: ${APP_CONSTANTS.CARD_SIZE.HEIGHT}px; background: white; display: flex; align-items: center; justify-content: center; font-family: "${APP_CONSTANTS.EMOJI_FONTS.join('", "')}", sans-serif; }
      svg { width: ${APP_CONSTANTS.CARD_SIZE.WIDTH}px; height: ${APP_CONSTANTS.CARD_SIZE.HEIGHT}px; }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>`
}

/**
 *
 */
export function getResizeOptions() {
    return { fit: 'contain' as const, background: { r: 255, g: 255, b: 255, alpha: 1 } }
}
