export function generateOpenApiDocument(baseUrl: string | undefined) {
    const servers = baseUrl ? [{ url: baseUrl }] : [{ url: 'http://localhost:3000' }]
    return {
        openapi: '3.0.0',
        info: { title: 'gzh2xhs API', version: '1.0.0' },
        servers,
        components: {
            schemas: {
                ApiErrorResponse: {
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
                },
            },
        },
        paths: {
            '/api/generate': {
                post: {
                    summary: '根据输入文本与模型生成卡片以及文案',
                    description: '生成卡片与文案',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        text: { type: 'string' },
                                        model: { type: 'string', enum: ['deepseek', 'nanobanana'] },
                                        style: {
                                            type: 'string',
                                            enum: ['simple', 'standard', 'rich'],
                                        },
                                        size: { type: 'string', enum: ['1:1', '4:5', '9:16'] },
                                    },
                                    required: ['text', 'model'],
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: '生成成功',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            cards: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string' },
                                                        imageUrl: { type: 'string' },
                                                        template: { type: 'string' },
                                                        model: {
                                                            type: 'string',
                                                            enum: ['deepseek', 'nanobanana'],
                                                        },
                                                        size: {
                                                            type: 'string',
                                                            enum: ['1:1', '4:5', '9:16'],
                                                        },
                                                    },
                                                    required: [
                                                        'id',
                                                        'imageUrl',
                                                        'template',
                                                        'model',
                                                        'size',
                                                    ],
                                                },
                                            },
                                            copytext: { type: 'string' },
                                            success: { type: 'boolean' },
                                            links: {
                                                type: 'object',
                                                properties: {
                                                    self: { type: 'string' },
                                                    export: { type: 'string' },
                                                    kpi: { type: 'string' },
                                                },
                                            },
                                        },
                                        required: ['cards', 'copytext', 'success'],
                                    },
                                },
                            },
                        },
                        '400': {
                            description: '参数错误',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                        '403': {
                            description: 'CSRF 校验失败',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                        '429': {
                            description: '触发限流',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                        '500': {
                            description: '服务端错误',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                    },
                },
            },
            '/api/export': {
                post: {
                    summary: '接收图片数据并打包为 zip 返回',
                    description: '批量导出卡片为压缩包',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        images: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    dataUrl: { type: 'string' },
                                                    id: { type: 'string' },
                                                },
                                                required: ['dataUrl'],
                                            },
                                        },
                                        namePrefix: { type: 'string' },
                                    },
                                    required: ['images'],
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'zip 文件返回',
                            content: { 'application/zip': {} },
                        },
                        '400': {
                            description: '没有要导出的卡片',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                        '403': {
                            description: 'CSRF 校验失败',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                        '500': {
                            description: '导出失败',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                    },
                },
            },
            '/api/track': {
                post: {
                    summary: '事件上报',
                    description: '服务端埋点事件上报接口',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        props: { type: 'object' },
                                    },
                                    required: ['name'],
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: '上报成功',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: { success: { type: 'boolean' } },
                                        required: ['success'],
                                    },
                                },
                            },
                        },
                        '400': {
                            description: '参数错误',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                        '403': {
                            description: 'CSRF 校验失败',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                        '500': {
                            description: '服务端错误',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                                },
                            },
                        },
                    },
                },
            },
            '/api/kpi': {
                get: {
                    summary: 'KPI 指标摘要',
                    description: '返回生成接口的延迟分布摘要',
                    responses: {
                        '200': {
                            description: '指标摘要',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            latency: { type: 'object' },
                                        },
                                        required: ['latency'],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/openapi': {
                get: {
                    summary: 'OpenAPI 文档',
                    description: '返回当前服务的 OpenAPI 文档',
                    responses: {
                        '200': { description: '文档 JSON', content: { 'application/json': {} } },
                    },
                },
            },
        },
    }
}
