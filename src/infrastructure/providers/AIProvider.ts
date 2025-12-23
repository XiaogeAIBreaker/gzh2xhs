import { createAIService } from '@/services'
import type { AIModel } from '@/types'
import type { AIService } from '@/services'

/**
 *
 */
export class AIProvider {
    /**
     *
     */
    getService(model: AIModel): AIService {
        return createAIService(model)
    }
}
