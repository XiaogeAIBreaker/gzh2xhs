import { ERROR_MESSAGES } from '@/constants'
import type { AppState } from '@/types'
import type { AppAction } from './types'

export const defaultAppState: AppState = {
    inputText: '',
    selectedModel: 'deepseek',
    selectedStyle: 'standard',
    isGenerating: false,
    generatedCards: [],
    generatedCopytext: '',
    error: null,
}

/**
 *
 */
export function validateStateUpdate(update: Partial<AppState>): boolean {
    if (update.inputText !== undefined && typeof update.inputText !== 'string') return false
    if (update.selectedModel && !['deepseek', 'nanobanana'].includes(update.selectedModel))
        return false
    if (update.selectedStyle && !['simple', 'standard', 'rich'].includes(update.selectedStyle))
        return false
    return true
}

/**
 *
 */
export function appReducer(state: AppState, action: AppAction): AppState {
    try {
        switch (action.type) {
            case 'INPUT_TEXT_CHANGED':
                return { ...state, inputText: action.payload, error: null }
            case 'MODEL_SELECTED':
                return {
                    ...state,
                    selectedModel: action.payload,
                    error: null,
                    generatedCards: [],
                    generatedCopytext: '',
                }
            case 'STYLE_CHANGED':
                return { ...state, selectedStyle: action.payload }
            case 'GENERATION_STARTED':
                return {
                    ...state,
                    isGenerating: true,
                    error: null,
                    generatedCards: [],
                    generatedCopytext: '',
                }
            case 'GENERATION_COMPLETED':
                return {
                    ...state,
                    isGenerating: false,
                    generatedCards: action.payload.cards,
                    generatedCopytext: action.payload.copytext,
                    error: null,
                }
            case 'GENERATION_FAILED':
                return { ...state, isGenerating: false, error: action.payload }
            case 'GENERATION_RESET':
                return {
                    ...state,
                    isGenerating: false,
                    generatedCards: [],
                    generatedCopytext: '',
                    error: null,
                }
            case 'STATE_UPDATED':
                if (!validateStateUpdate(action.payload)) return { ...state, error: '状态更新失败' }
                return { ...state, ...action.payload }
            case 'SET_INPUT_TEXT':
                return { ...state, inputText: action.payload }
            case 'SET_SELECTED_MODEL':
                return { ...state, selectedModel: action.payload }
            case 'SET_GENERATING':
                return { ...state, isGenerating: action.payload }
            case 'SET_GENERATED_CARDS':
                return { ...state, generatedCards: action.payload }
            case 'SET_GENERATED_COPYTEXT':
                return { ...state, generatedCopytext: action.payload }
            case 'SET_ERROR':
                return { ...state, error: action.payload }
            case 'RESET_GENERATION':
                return {
                    ...state,
                    isGenerating: false,
                    generatedCards: [],
                    generatedCopytext: '',
                    error: null,
                }
            case 'UPDATE_STATE':
                return { ...state, ...action.payload }
            default:
                return state
        }
    } catch (error) {
        return {
            ...state,
            error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        }
    }
}
