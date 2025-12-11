import { describe, it, expect } from 'vitest'
import sharp from 'sharp'

const WIDTH = 1080
const HEIGHT = 1440

async function createWhitePngBuffer() {
    return await sharp({
        create: {
            width: WIDTH,
            height: HEIGHT,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
        },
    })
        .png({ quality: 100 })
        .toBuffer()
}

async function getImageConverter() {
    process.env.DEEPSEEK_API_KEY = 'test'
    const mod = await import('@/lib/image-converter')
    return mod
}

describe('image-converter', () => {
    it('convertBase64ToPng should return valid buffer', async () => {
        const { convertBase64ToPng } = await getImageConverter()
        const buf = await createWhitePngBuffer()
        const base64 = buf.toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`
        const result = await convertBase64ToPng(dataUrl)
        expect(result).toBeInstanceOf(Buffer)
        expect(result && result.length).toBeGreaterThan(0)
    })

    it('validateImageQuality should pass for correct size PNG', async () => {
        const { validateImageQuality } = await getImageConverter()
        const buf = await createWhitePngBuffer()
        const ok = await validateImageQuality(buf)
        expect(ok).toBe(true)
    })

    it('createTempImageUrl should return data URL', async () => {
        const { createTempImageUrl } = await getImageConverter()
        const buf = await createWhitePngBuffer()
        const url = createTempImageUrl(buf, 'test.png')
        expect(url.startsWith('data:image/png;base64,')).toBe(true)
    })
})
