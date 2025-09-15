import { chromium } from 'playwright'
import sharp from 'sharp'
import { APP_CONSTANTS, ERROR_MESSAGES } from '@/constants'

/**
 * Sharp 处理方法接口
 */
interface SharpMethod {
  name: string
  options: any
  pngOptions?: any
  useIntermediateJpeg?: boolean
}

/**
 * 图片转换配置常量
 */
const IMAGE_CONVERTER_CONFIG = {
  // 渲染配置
  RENDER_TIMEOUT: APP_CONSTANTS.TIMEOUTS.PLAYWRIGHT_RENDER,

  // Sharp 处理方法配置
  SHARP_METHODS: [
    {
      name: 'failOnError_false',
      options: { failOnError: false, limitInputPixels: false },
      pngOptions: { quality: 100, compressionLevel: 6, force: true }
    },
    {
      name: 'density_150',
      options: { failOnError: false, limitInputPixels: false, density: 150 },
      pngOptions: { quality: 100, compressionLevel: 6, force: true }
    },
    {
      name: 'jpeg_intermediate',
      options: { failOnError: false },
      useIntermediateJpeg: true
    },
    {
      name: 'direct_resize',
      options: { failOnError: false },
      pngOptions: { quality: 100, force: true }
    }
  ] as SharpMethod[]
}

/**
 * SVG转PNG - 使用Playwright替代Sharp解决emoji渲染问题
 *
 * @param svgContent SVG内容字符串
 * @returns Promise<Buffer> PNG图片缓冲区
 * @throws Error 当转换失败时抛出错误
 */
export async function convertSvgToPng(svgContent: string): Promise<Buffer> {
  if (!svgContent?.trim()) {
    throw new Error(ERROR_MESSAGES.INVALID_SVG)
  }

  let browser = null
  try {
    console.log('[图片转换] 开始使用Playwright渲染SVG，支持emoji显示')

    // 启动浏览器
    browser = await chromium.launch({
      headless: APP_CONSTANTS.BROWSER_CONFIG.HEADLESS,
      args: [...APP_CONSTANTS.BROWSER_CONFIG.ARGS]
    })

    const page = await browser.newPage()

    // 设置视口大小
    await page.setViewportSize({
      width: APP_CONSTANTS.CARD_SIZE.WIDTH,
      height: APP_CONSTANTS.CARD_SIZE.HEIGHT
    })

    // 创建完整的HTML页面包含SVG
    const htmlContent = createHtmlWrapper(svgContent)

    // 加载HTML内容
    await page.setContent(htmlContent)

    // 等待字体和内容加载完成
    await page.waitForTimeout(IMAGE_CONVERTER_CONFIG.RENDER_TIMEOUT)

    // 截图生成PNG
    const pngBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: APP_CONSTANTS.CARD_SIZE.WIDTH,
        height: APP_CONSTANTS.CARD_SIZE.HEIGHT
      }
    })

    console.log('[图片转换] Playwright渲染完成，emoji正确显示')
    return pngBuffer

  } catch (error) {
    console.error('[图片转换] Playwright SVG转PNG错误:', error)
    throw new Error(`${ERROR_MESSAGES.IMAGE_CONVERSION_FAILED}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`)
  } finally {
    // 确保浏览器资源被正确释放
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.warn('[图片转换] 浏览器关闭时出现警告:', closeError)
      }
    }
  }
}

/**
 * 创建HTML包装器
 *
 * @param svgContent SVG内容
 * @returns 完整的HTML页面字符串
 */
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

/**
 * Base64字符串转PNG Buffer
 *
 * @param base64Data Base64编码的图片数据
 * @returns Promise<Buffer | undefined> PNG图片缓冲区或undefined
 * @throws Error 当转换失败时抛出错误
 */
export async function convertBase64ToPng(base64Data: string): Promise<Buffer | undefined> {
  if (!base64Data?.trim()) {
    throw new Error(ERROR_MESSAGES.BASE64_INVALID)
  }

  console.log('[图片转换] 开始处理Base64数据', { length: base64Data.length })

  try {
    // 清理和验证Base64数据
    const imageBuffer = prepareBase64Buffer(base64Data)

    // 使用多种方法尝试处理图片
    const processMethods = createSharpProcessMethods(imageBuffer)

    // 逐一尝试处理方法
    return await tryProcessMethods(processMethods)

  } catch (error) {
    console.error('[图片转换] Base64转PNG最终错误:', error)
    throw new Error(`${ERROR_MESSAGES.IMAGE_CONVERSION_FAILED}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`)
  }

  return undefined
}

/**
 * 准备Base64缓冲区
 */
function prepareBase64Buffer(base64Data: string): Buffer {
  // 去除data:image/...;base64,前缀（如果存在）
  const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '')

  // 验证base64数据
  if (!cleanBase64 || cleanBase64.length < 100) {
    throw new Error(ERROR_MESSAGES.BASE64_INVALID)
  }

  // 转换为Buffer
  const imageBuffer = Buffer.from(cleanBase64, 'base64')
  console.log('[图片转换] Base64转换完成', { bufferSize: imageBuffer.length })

  return imageBuffer
}

/**
 * 创建Sharp处理方法数组
 */
function createSharpProcessMethods(imageBuffer: Buffer): Array<() => Promise<Buffer>> {
  return IMAGE_CONVERTER_CONFIG.SHARP_METHODS.map((method: SharpMethod, index) => {
    return async (): Promise<Buffer> => {
      console.log(`[图片转换] 尝试方法${index + 1}: ${method.name}`)

      if (method.useIntermediateJpeg) {
        // JPEG中转方法
        const jpegBuffer = await sharp(imageBuffer, method.options)
          .jpeg({ quality: 100 })
          .toBuffer()

        return await sharp(jpegBuffer)
          .png({ quality: 100, compressionLevel: 6, force: true })
          .resize(APP_CONSTANTS.CARD_SIZE.WIDTH, APP_CONSTANTS.CARD_SIZE.HEIGHT, getResizeOptions())
          .toBuffer()
      } else {
        // 直接处理方法
        let pipeline = sharp(imageBuffer, method.options)

        if (method.pngOptions) {
          pipeline = pipeline.png(method.pngOptions)
        }

        return await pipeline
          .resize(APP_CONSTANTS.CARD_SIZE.WIDTH, APP_CONSTANTS.CARD_SIZE.HEIGHT, getResizeOptions())
          .toBuffer()
      }
    }
  })
}

/**
 * 获取resize选项
 */
function getResizeOptions() {
  return {
    fit: 'contain' as const,
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  }
}

/**
 * 尝试多种处理方法
 */
async function tryProcessMethods(methods: Array<() => Promise<Buffer>>): Promise<Buffer> {
  for (let i = 0; i < methods.length; i++) {
    try {
      const result = await methods[i]()
      console.log(`[图片转换] 方法${i + 1}成功！输出PNG大小:`, result.length, 'bytes')
      return result
    } catch (methodError) {
      console.error(`[图片转换] 方法${i + 1}失败:`, methodError)
      if (i === methods.length - 1) {
        throw methodError
      }
    }
  }

  // 理论上不会到达这里，但为了类型安全
  throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
}

/**
 * 创建临时图片URL
 *
 * @param buffer 图片缓冲区
 * @param _filename 文件名（保留参数，便于未来扩展）
 * @returns Data URL格式的图片地址
 */
export function createTempImageUrl(buffer: Buffer, _filename: string): string {
  if (!buffer || buffer.length === 0) {
    throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
  }

  try {
    const base64 = buffer.toString('base64')
    console.log('[图片转换] 创建临时URL', { bufferSize: buffer.length, base64Length: base64.length })
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error('[图片转换] 创建临时URL失败:', error)
    throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
  }
}

/**
 * 验证图片质量
 *
 * @param buffer 图片缓冲区
 * @returns Promise<boolean> 验证结果
 */
export async function validateImageQuality(buffer: Buffer): Promise<boolean> {
  if (!buffer || buffer.length === 0) {
    console.warn('[图片转换] 验证失败：空缓冲区')
    return false
  }

  try {
    const metadata = await sharp(buffer).metadata()
    const isValid = (
      metadata.width === APP_CONSTANTS.CARD_SIZE.WIDTH &&
      metadata.height === APP_CONSTANTS.CARD_SIZE.HEIGHT &&
      metadata.format === 'png'
    )

    console.log('[图片转换] 图片质量验证', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      isValid
    })

    return isValid
  } catch (error) {
    console.error('[图片转换] 图片质量验证失败:', error)
    return false
  }
}