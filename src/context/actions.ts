import type { AppContextType } from './types'
import type { GeneratedCard, AIModel } from '@/types'

/**
 *
 */
export function createActions(dispatch: AppContextType['dispatch']) {
    return {
        setInputText: (text: string) => dispatch({ type: 'INPUT_TEXT_CHANGED', payload: text }),
        selectModel: (model: AIModel) => dispatch({ type: 'MODEL_SELECTED', payload: model }),
        changeStyle: (style: 'simple' | 'standard' | 'rich') =>
            dispatch({ type: 'STYLE_CHANGED', payload: style }),
        startGeneration: () => dispatch({ type: 'GENERATION_STARTED' }),
        completeGeneration: (cards: GeneratedCard[], copytext: string) =>
            dispatch({ type: 'GENERATION_COMPLETED', payload: { cards, copytext } }),
        failGeneration: (error: string) => dispatch({ type: 'GENERATION_FAILED', payload: error }),
        resetGeneration: () => dispatch({ type: 'GENERATION_RESET' }),
    }
}
