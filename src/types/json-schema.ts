export const GenerateRequestJsonSchema = {
    type: 'object',
    properties: {
        text: { type: 'string' },
        model: { type: 'string', enum: ['deepseek', 'nanobanana'] },
        style: { type: 'string', enum: ['simple', 'standard', 'rich'] },
        size: { type: 'string', enum: ['1:1', '4:5', '9:16'] },
    },
    required: ['text', 'model'],
} as const

export const ExportRequestJsonSchema = {
    type: 'object',
    properties: {
        images: {
            type: 'array',
            items: {
                type: 'object',
                properties: { dataUrl: { type: 'string' }, id: { type: 'string' } },
                required: ['dataUrl'],
            },
            minItems: 1,
        },
        namePrefix: { type: 'string' },
    },
    required: ['images'],
} as const
