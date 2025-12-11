import { z } from 'zod'
import { APP_CONSTANTS, ERROR_MESSAGES } from '@/constants'

export const GenerateRequestSchema = z.object({
  text: z
    .string()
    .min(1, ERROR_MESSAGES.EMPTY_INPUT)
    .max(APP_CONSTANTS.MAX_TEXT_LENGTH, ERROR_MESSAGES.TEXT_TOO_LONG),
  model: z.enum(['deepseek', 'nanobanana']),
  style: z.enum(['simple', 'standard', 'rich']).optional(),
  size: z.enum(['1:1', '4:5', '9:16']).optional(),
})

export type GenerateRequestDto = z.infer<typeof GenerateRequestSchema>

export const ExportRequestSchema = z.object({
  images: z
    .array(z.object({ dataUrl: z.string().min(1), id: z.string().optional() }))
    .min(1, '没有要导出的卡片'),
  namePrefix: z.string().optional(),
})

export type ExportRequestDto = z.infer<typeof ExportRequestSchema>
