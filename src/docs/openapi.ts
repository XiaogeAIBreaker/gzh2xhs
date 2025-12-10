export function generateOpenApiDocument(baseUrl: string | undefined) {
  const servers = baseUrl ? [{ url: baseUrl }] : [{ url: 'http://localhost:3000' }]
  return {
    openapi: '3.0.0',
    info: { title: 'gzh2xhs API', version: '1.0.0' },
    servers,
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
                            model: { type: 'string', enum: ['deepseek', 'nanobanana'] },
                            size: { type: 'string', enum: ['1:1', '4:5', '9:16'] },
                          },
                          required: ['id', 'imageUrl', 'template', 'model', 'size'],
                        },
                      },
                      copytext: { type: 'string' },
                      success: { type: 'boolean' },
                    },
                    required: ['cards', 'copytext', 'success'],
                  },
                },
              },
            },
            '400': { description: '参数错误' },
            '429': { description: '触发限流' },
            '500': { description: '服务端错误' },
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
            '400': { description: '没有要导出的卡片' },
            '500': { description: '导出失败' },
          },
        },
      },
    },
  }
}
