import { getBrowser } from '@/shared/lib/playwright'
import sharp from 'sharp'
import { APP_CONSTANTS, ERROR_MESSAGES } from '@/constants'
import { logger } from '@/lib/logger'
const SAFE_PIXELS = APP_CONSTANTS.CARD_SIZE.WIDTH * APP_CONSTANTS.CARD_SIZE.HEIGHT
const SHARP_TIMEOUT_MS = 5000

interface SharpMethod {
    name: string
    options: any
    pngOptions?: any
    useIntermediateJpeg?: boolean
}

const IMAGE_CONVERTER_CONFIG = {
    RENDER_TIMEOUT: APP_CONSTANTS.TIMEOUTS.PLAYWRIGHT_RENDER,
    SHARP_METHODS: [
        {
            name: 'failOnError_false',
            options: { failOnError: false, limitInputPixels: SAFE_PIXELS },
            pngOptions: { quality: 100, compressionLevel: 6, force: true },
        },
        {
            name: 'density_150',
            options: { failOnError: false, limitInputPixels: SAFE_PIXELS, density: 150 },
            pngOptions: { quality: 100, compressionLevel: 6, force: true },
        },
        {
            name: 'jpeg_intermediate',
            options: { failOnError: false, limitInputPixels: SAFE_PIXELS },
            useIntermediateJpeg: true,
        },
        {
            name: 'direct_resize',
            options: { failOnError: false, limitInputPixels: SAFE_PIXELS },
            pngOptions: { quality: 100, force: true },
        },
    ] as SharpMethod[],
}

const maxConcurrent = parseInt(process.env.IMG_MAX_CONCURRENCY || '2', 10)

class Semaphore {
    private queue: Array<() => void> = []
    private current = 0
    private readonly limit: number
    constructor(limit: number) {
        this.limit = Math.max(1, limit)
    }
    async acquire(): Promise<() => void> {
        if (this.current < this.limit) {
            this.current += 1

            return () => this.release()
        }

        return new Promise<() => void>((resolve) => {
            this.queue.push(() => {
                this.current += 1
                resolve(() => this.release())
            })
        })
    }
    private release() {
        this.current -= 1
        const next = this.queue.shift()
        if (next) next()
    }
}

const screenshotSemaphore = new Semaphore(maxConcurrent)

async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
    const release = await screenshotSemaphore.acquire()

    try {
        return await fn()
    } finally {
        release()
    }
}

function containsEmoji(svgContent: string): boolean {
    // 粗略检测常见 emoji 范围（包含多语言表情符）
    return /[\u{1F000}-\u{1FFFF}]/u.test(svgContent)
}

export async function convertSvgToPng(svgContent: string): Promise<Buffer> {
    if (!svgContent?.trim()) {
        throw new Error(ERROR_MESSAGES.INVALID_SVG)
    }

    const needEmojiSupport = containsEmoji(svgContent)
    let browser: any = null
    let page: any = null

    try {
        if (needEmojiSupport) {
            logger.info('使用 Playwright 渲染以支持 emoji', undefined, 'ImageConverter')
            browser = await getBrowser()
            page = await browser.newPage()
            await page.setViewportSize({
                width: APP_CONSTANTS.CARD_SIZE.WIDTH,
                height: APP_CONSTANTS.CARD_SIZE.HEIGHT,
            })
            const htmlContent = createHtmlWrapper(svgContent)
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })
            const pngBuffer = (await withLimit(() =>
                page.screenshot({
                    type: 'png',
                    fullPage: false,
                    clip: {
                        x: 0,
                        y: 0,
                        width: APP_CONSTANTS.CARD_SIZE.WIDTH,
                        height: APP_CONSTANTS.CARD_SIZE.HEIGHT,
                    },
                }),
            )) as Buffer
            logger.info('Playwright 渲染完成', undefined, 'ImageConverter')

            return pngBuffer
        }

        // 无 emoji 时直接使用 sharp，更快更省内存
        const buffer = Buffer.from(svgContent)
        const png = await withSharpTimeout(
            sharp(buffer)
                .png({ quality: 100 })
                .resize(
                    APP_CONSTANTS.CARD_SIZE.WIDTH,
                    APP_CONSTANTS.CARD_SIZE.HEIGHT,
                    getResizeOptions(),
                )
                .toBuffer(),
        )
        logger.info('Sharp 直接渲染完成', undefined, 'ImageConverter')

        return png
    } catch (error) {
        logger.warn('Playwright渲染失败，尝试Sharp回退', error, 'ImageConverter')
        try {
            const buffer = Buffer.from(svgContent)
            const png = await withSharpTimeout(
                sharp(buffer)
                    .png({ quality: 100 })
                    .resize(
                        APP_CONSTANTS.CARD_SIZE.WIDTH,
                        APP_CONSTANTS.CARD_SIZE.HEIGHT,
                        getResizeOptions(),
                    )
                    .toBuffer(),
            )
            logger.info('Sharp回退渲染成功', undefined, 'ImageConverter')

            return png
        } catch (fallbackError) {
            logger.error('Sharp回退渲染失败', fallbackError, 'ImageConverter')
            throw new Error(
                `${ERROR_MESSAGES.IMAGE_CONVERSION_FAILED}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`,
            )
        }
    } finally {
        try {
            await page?.close()
        } catch {}
    }
}

function createHtmlWrapper(svgContent: string): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${APP_CONSTANTS.CARD_SIZE.WIDTH}px;
        height: ${APP_CONSTANTS.CARD_SIZE.HEIGHT}px;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "${APP_CONSTANTS.EMOJI_FONTS.join('", "')}", sans-serif;
      }
      svg {
        width: ${APP_CONSTANTS.CARD_SIZE.WIDTH}px;
        height: ${APP_CONSTANTS.CARD_SIZE.HEIGHT}px;
      }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>`
}

export async function convertBase64ToPng(base64Data: string): Promise<Buffer | undefined> {
    if (!base64Data?.trim()) {
        throw new Error(ERROR_MESSAGES.BASE64_INVALID)
    }

    logger.info('开始处理Base64数据', { length: base64Data.length }, 'ImageConverter')
    try {
        const imageBuffer = prepareBase64Buffer(base64Data)
        const processMethods = createSharpProcessMethods(imageBuffer)

        return await tryProcessMethods(processMethods)
    } catch (error) {
        logger.error('Base64转PNG最终错误', error, 'ImageConverter')
        throw new Error(
            `${ERROR_MESSAGES.IMAGE_CONVERSION_FAILED}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`,
        )
    }

    return undefined
}

function prepareBase64Buffer(base64Data: string): Buffer {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '')

    if (!cleanBase64 || cleanBase64.length < 100) {
        throw new Error(ERROR_MESSAGES.BASE64_INVALID)
    }

    const imageBuffer = Buffer.from(cleanBase64, 'base64')
    logger.info('Base64转换完成', { bufferSize: imageBuffer.length }, 'ImageConverter')

    return imageBuffer
}

function createSharpProcessMethods(imageBuffer: Buffer): Array<() => Promise<Buffer>> {
    return IMAGE_CONVERTER_CONFIG.SHARP_METHODS.map((method: SharpMethod, index) => {
        return async (): Promise<Buffer> => {
            logger.debug(`尝试方法${index + 1}: ${method.name}`, undefined, 'ImageConverter')
            if (method.useIntermediateJpeg) {
                const jpegBuffer = await withSharpTimeout(
                    sharp(imageBuffer, method.options).jpeg({ quality: 100 }).toBuffer(),
                )

                return await withSharpTimeout(
                    sharp(jpegBuffer)
                        .png({ quality: 100, compressionLevel: 6, force: true })
                        .resize(
                            APP_CONSTANTS.CARD_SIZE.WIDTH,
                            APP_CONSTANTS.CARD_SIZE.HEIGHT,
                            getResizeOptions(),
                        )
                        .toBuffer(),
                )
            } else {
                let pipeline = sharp(imageBuffer, method.options)

                if (method.pngOptions) {
                    pipeline = pipeline.png(method.pngOptions)
                }

                return await withSharpTimeout(
                    pipeline
                        .resize(
                            APP_CONSTANTS.CARD_SIZE.WIDTH,
                            APP_CONSTANTS.CARD_SIZE.HEIGHT,
                            getResizeOptions(),
                        )
                        .toBuffer(),
                )
            }
        }
    })
}

function getResizeOptions() {
    return {
        fit: 'contain' as const,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
    }
}

async function tryProcessMethods(methods: Array<() => Promise<Buffer>>): Promise<Buffer> {
    let idx = 0

    for (const fn of methods) {
        try {
            const result = await fn()
            logger.info(`方法${idx + 1}成功`, { outputBytes: result.length }, 'ImageConverter')

            return result
        } catch (methodError) {
            logger.error(`方法${idx + 1}失败`, methodError, 'ImageConverter')
            if (idx === methods.length - 1) {
                throw methodError
            }
        }

        idx += 1
    }

    throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
}

export function createTempImageUrl(buffer: Buffer, _filename: string): string {
    if (!buffer || buffer.length === 0) {
        throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
    }

    try {
        const base64 = buffer.toString('base64')
        logger.debug(
            '创建临时URL',
            { bufferSize: buffer.length, base64Length: base64.length },
            'ImageConverter',
        )

        return `data:image/png;base64,${base64}`
    } catch (error) {
        logger.error('创建临时URL失败', error, 'ImageConverter')
        throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
    }
}

export async function createPlaceholderPngBuffer(): Promise<Buffer> {
    return await sharp({
        create: {
            width: APP_CONSTANTS.CARD_SIZE.WIDTH,
            height: APP_CONSTANTS.CARD_SIZE.HEIGHT,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
        },
    })
        .png({ quality: 100 })
        .toBuffer()
}

export async function validateImageQuality(buffer: Buffer): Promise<boolean> {
    if (!buffer || buffer.length === 0) {
        logger.warn('验证失败：空缓冲区', undefined, 'ImageConverter')

        return false
    }

    try {
        const metadata = await sharp(buffer).metadata()
        const isValid =
            metadata.width === APP_CONSTANTS.CARD_SIZE.WIDTH &&
            metadata.height === APP_CONSTANTS.CARD_SIZE.HEIGHT &&
            metadata.format === 'png'
        logger.info('图片质量验证', {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            isValid,
        })

        return isValid
    } catch (error) {
        logger.error('图片质量验证失败', error, 'ImageConverter')

        return false
    }
}

async function withSharpTimeout<T>(p: Promise<T>): Promise<T> {
    return Promise.race([
        p,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('SHARP_TIMEOUT')), SHARP_TIMEOUT_MS),
        ),
    ])
}
