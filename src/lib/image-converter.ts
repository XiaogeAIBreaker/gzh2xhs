import { chromium } from 'playwright'
import sharp from 'sharp'
import { APP_CONSTANTS } from '@/constants'

// SVG转PNG - 使用Playwright替代Sharp解决emoji渲染问题
export async function convertSvgToPng(svgContent: string): Promise<Buffer> {
  let browser = null
  try {
    console.log('🎨 使用Playwright渲染SVG，支持emoji显示')

    // 启动浏览器
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // 设置视口大小
    await page.setViewportSize({
      width: APP_CONSTANTS.CARD_SIZE.WIDTH,
      height: APP_CONSTANTS.CARD_SIZE.HEIGHT
    })

    // 创建完整的HTML页面包含SVG
    const htmlContent = `
      <!DOCTYPE html>
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
      </html>
    `

    // 加载HTML内容
    await page.setContent(htmlContent)

    // 等待字体和内容加载完成
    await page.waitForTimeout(1000)

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

    console.log('✅ Playwright渲染完成，emoji应该正确显示')
    return pngBuffer

  } catch (error) {
    console.error('Playwright SVG转PNG错误:', error)
    throw new Error(`SVG转PNG失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Base64字符串转PNG Buffer
export async function convertBase64ToPng(base64Data: string): Promise<Buffer | undefined> {
  console.log('开始处理Base64数据:', base64Data.substring(0, 100) + '...')

  try {
    // 去除data:image/...;base64,前缀（如果存在）
    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
    console.log('清理后的Base64长度:', cleanBase64.length)

    // 验证base64数据
    if (!cleanBase64 || cleanBase64.length < 100) {
      throw new Error('Base64数据太短或无效')
    }

    // 转换为Buffer
    const imageBuffer = Buffer.from(cleanBase64, 'base64')
    console.log('原始图片Buffer大小:', imageBuffer.length, 'bytes')

    // 不检查元数据，直接尝试多种处理方法
    const processMethods = [
      // 方法1: 使用failOnError: false，跳过严格验证
      async () => {
        console.log('尝试方法1: failOnError: false')
        return await sharp(imageBuffer, { failOnError: false, limitInputPixels: false })
          .png({ quality: 100, compressionLevel: 6, force: true })
          .resize(APP_CONSTANTS.CARD_SIZE.WIDTH, APP_CONSTANTS.CARD_SIZE.HEIGHT, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toBuffer()
      },

      // 方法2: 尝试不同的输入格式处理
      async () => {
        console.log('尝试方法2: 强制PNG格式')
        return await sharp(imageBuffer, {
          failOnError: false,
          limitInputPixels: false,
          density: 150
        })
          .png({ quality: 100, compressionLevel: 6, force: true })
          .resize(APP_CONSTANTS.CARD_SIZE.WIDTH, APP_CONSTANTS.CARD_SIZE.HEIGHT, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toBuffer()
      },

      // 方法3: 先确保转换为标准JPEG再转PNG
      async () => {
        console.log('尝试方法3: JPEG中转')
        const jpegBuffer = await sharp(imageBuffer, { failOnError: false })
          .jpeg({ quality: 100 })
          .toBuffer()

        return await sharp(jpegBuffer)
          .png({ quality: 100, compressionLevel: 6, force: true })
          .resize(APP_CONSTANTS.CARD_SIZE.WIDTH, APP_CONSTANTS.CARD_SIZE.HEIGHT, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toBuffer()
      },

      // 方法4: 直接返回原始尺寸调整后的图片
      async () => {
        console.log('尝试方法4: 直接调整尺寸')
        return await sharp(imageBuffer, { failOnError: false })
          .resize(APP_CONSTANTS.CARD_SIZE.WIDTH, APP_CONSTANTS.CARD_SIZE.HEIGHT, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png({ quality: 100, force: true })
          .toBuffer()
      }
    ]

    // 逐一尝试处理方法
    for (let i = 0; i < processMethods.length; i++) {
      try {
        const result = await processMethods[i]()
        console.log(`方法${i + 1}成功！输出PNG大小:`, result.length, 'bytes')
        return result
      } catch (methodError) {
        console.error(`方法${i + 1}失败:`, methodError)
        if (i === processMethods.length - 1) {
          throw methodError
        }
      }
    }

  } catch (error) {
    console.error('Base64转PNG最终错误:', error)
    throw new Error(`Base64转PNG失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return undefined
}

// 创建临时文件URL
export function createTempImageUrl(buffer: Buffer, _filename: string): string {
  // 在实际应用中，这里应该将图片保存到临时目录
  // 并返回可访问的URL，这里简化处理
  const base64 = buffer.toString('base64')
  return `data:image/png;base64,${base64}`
}

// 验证图片质量
export async function validateImageQuality(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata()

    // 检查基本参数
    return (
      metadata.width === APP_CONSTANTS.CARD_SIZE.WIDTH &&
      metadata.height === APP_CONSTANTS.CARD_SIZE.HEIGHT &&
      metadata.format === 'png'
    )
  } catch (error) {
    return false
  }
}