import { Injectable } from '@nestjs/common'

@Injectable()
export class OpenapiService {
    async getDocument() {
        return { openapi: '3.0.0', info: { title: 'gzh2xhs', version: '0.1.0' } }
    }
}
