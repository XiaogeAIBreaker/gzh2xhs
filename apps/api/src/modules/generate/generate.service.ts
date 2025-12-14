import { Injectable } from '@nestjs/common'

@Injectable()
export class GenerateService {
    async generate(input: { title: string; content: string; style?: string }) {
        // TODO: 调用现有共享生成逻辑（packages/shared 或迁移 src/services/*）
        return {
            title: input.title,
            previewUrl: `/preview/${encodeURIComponent(input.title)}`,
        }
    }
}
