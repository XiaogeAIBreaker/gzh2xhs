import JSZip from 'jszip'
import { convertBase64ToPng } from '@/lib/image-converter'
import { ERROR_MESSAGES } from '@/constants'

export type ExportInput = {
    images: Array<{ dataUrl: string; id?: string | undefined }>
    namePrefix?: string | undefined
}

/**
 *
 */
export class ExportImagesUseCase {
    /**
     *
     */
    async execute(input: ExportInput): Promise<Buffer> {
        const { images, namePrefix } = input
        const zip = new JSZip()
        for (const [i, item] of images.entries()) {
            try {
                const pngBuffer = await convertBase64ToPng(item.dataUrl)
                if (!pngBuffer) throw new Error(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED)
                const fileName = `${namePrefix || '小红书卡片'}_${i + 1}.png`
                zip.file(fileName, pngBuffer)
            } catch {
                const placeholder = Buffer.from(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                    'base64',
                )
                const fileName = `${namePrefix || '小红书卡片'}_${i + 1}.png`
                zip.file(fileName, placeholder)
            }
        }
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
        return zipBuffer
    }
}
