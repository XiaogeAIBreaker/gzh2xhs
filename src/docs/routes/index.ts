export const paths = {
    '/api/auth/register': {
        post: {
            summary: '用户注册',
            description: '创建新用户（内存仓储示例）',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: { email: { type: 'string' }, password: { type: 'string' } },
                            required: ['email', 'password'],
                        },
                    },
                },
            },
            responses: { '200': { description: '注册成功', content: { 'application/json': {} } } },
        },
    },
    '/api/auth/login': {
        post: {
            summary: '用户登录',
            description: '返回令牌（与现有 RBAC 令牌兼容）',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: { email: { type: 'string' }, password: { type: 'string' } },
                            required: ['email', 'password'],
                        },
                    },
                },
            },
            responses: { '200': { description: '登录成功', content: { 'application/json': {} } } },
        },
    },
    '/api/auth/me': {
        get: {
            summary: '当前用户信息',
            description: '返回登录用户资料',
            responses: { '200': { description: '用户信息', content: { 'application/json': {} } } },
        },
    },
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
                                style: { type: 'string', enum: ['simple', 'standard', 'rich'] },
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
                    headers: {
                        ETag: { description: '响应实体标识', schema: { type: 'string' } },
                        'Cache-Control': { description: '缓存控制', schema: { type: 'string' } },
                    },
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
                    headers: {
                        ETag: { description: '响应实体标识', schema: { type: 'string' } },
                        'Cache-Control': { description: '缓存控制', schema: { type: 'string' } },
                        'Content-Disposition': {
                            description: '下载文件名',
                            schema: { type: 'string' },
                        },
                    },
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
    '/api/data': {
        get: {
            summary: '数据查询',
            description: '分页/搜索查询',
            parameters: [
                { name: 'type', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
                { name: 'size', in: 'query', required: false, schema: { type: 'integer' } },
            ],
            responses: { '200': { description: '查询结果', content: { 'application/json': {} } } },
        },
        post: {
            summary: '创建数据',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object' } } },
            },
            responses: { '200': { description: '创建成功', content: { 'application/json': {} } } },
        },
        put: {
            summary: '更新数据',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object' } } },
            },
            responses: { '200': { description: '更新成功', content: { 'application/json': {} } } },
        },
        delete: {
            summary: '删除数据',
            parameters: [
                { name: 'type', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
            ],
            responses: { '200': { description: '删除结果', content: { 'application/json': {} } } },
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
                            properties: { name: { type: 'string' }, props: { type: 'object' } },
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
                                properties: { latency: { type: 'object' } },
                                required: ['latency'],
                            },
                        },
                    },
                },
            },
        },
    },
    '/api/logs': {
        get: {
            summary: '操作日志查询',
            description: '只读检索操作日志（受 RBAC 控制）',
            parameters: [
                { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
            ],
            responses: { '200': { description: '日志列表', content: { 'application/json': {} } } },
        },
    },
    '/api/openapi': {
        get: {
            summary: 'OpenAPI 文档',
            description: '返回当前服务的 OpenAPI 文档',
            responses: { '200': { description: '文档 JSON', content: { 'application/json': {} } } },
        },
    },
    '/api/finance/pricing': {
        post: {
            summary: '金融定价接口',
            description: '债券/期权/股票指标定价，使用 action 指示具体计算',
            parameters: [
                {
                    name: 'action',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', enum: ['bond', 'option', 'equity'] },
                },
            ],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object' } } },
            },
            responses: {
                '200': { description: '定价结果', content: { 'application/json': {} } },
                '400': {
                    description: '参数错误',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                        },
                    },
                },
                '403': {
                    description: '访问被拒绝',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                        },
                    },
                },
            },
        },
    },
    '/api/finance/risk': {
        post: {
            summary: '金融风险接口',
            description: 'VaR/敞口/久期/Greeks 计算，使用 action 指示具体计算',
            parameters: [
                {
                    name: 'action',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', enum: ['var', 'exposure', 'duration', 'greeks'] },
                },
            ],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object' } } },
            },
            responses: {
                '200': { description: '风险结果', content: { 'application/json': {} } },
                '400': {
                    description: '参数错误',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                        },
                    },
                },
                '403': {
                    description: '访问被拒绝',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                        },
                    },
                },
            },
        },
    },
    '/api/finance/report': {
        post: {
            summary: '金融报表接口',
            description: '生成定价 CSV 报表',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object' } } },
            },
            responses: {
                '200': { description: '报表生成成功', content: { 'application/json': {} } },
                '400': {
                    description: '参数错误',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                        },
                    },
                },
                '403': {
                    description: '访问被拒绝',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                        },
                    },
                },
            },
        },
    },
}
