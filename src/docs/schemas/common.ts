export const ApiErrorResponse = {
    type: 'object',
    properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        fields: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
        },
        traceId: { type: 'string' },
    },
    required: ['code', 'message'],
}
