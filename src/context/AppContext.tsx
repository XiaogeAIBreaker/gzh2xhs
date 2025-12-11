'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, AIModel, GeneratedCard } from '@/types'
import { ERROR_MESSAGES } from '@/constants'

/**
 * Action 类型定义 - 使用更清晰的命名和结构
 */
type AppAction =
    // 输入相关
    | { type: 'INPUT_TEXT_CHANGED'; payload: string }
    | { type: 'MODEL_SELECTED'; payload: AIModel }
    | { type: 'STYLE_CHANGED'; payload: 'simple' | 'standard' | 'rich' }

    // 生成状态相关
    | { type: 'GENERATION_STARTED' }
    | { type: 'GENERATION_COMPLETED'; payload: { cards: GeneratedCard[]; copytext: string } }
    | { type: 'GENERATION_FAILED'; payload: string }

    // 重置和更新
    | { type: 'GENERATION_RESET' }
    | { type: 'STATE_UPDATED'; payload: Partial<AppState> }

    // 向后兼容的 actions
    | { type: 'SET_INPUT_TEXT'; payload: string }
    | { type: 'SET_SELECTED_MODEL'; payload: AIModel }
    | { type: 'SET_GENERATING'; payload: boolean }
    | { type: 'SET_GENERATED_CARDS'; payload: GeneratedCard[] }
    | { type: 'SET_GENERATED_COPYTEXT'; payload: string }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET_GENERATION' }
    | { type: 'UPDATE_STATE'; payload: Partial<AppState> }

/**
 * 默认应用状态
 */
const defaultAppState: AppState = {
    inputText: '',
    selectedModel: 'deepseek',
    selectedStyle: 'standard',
    isGenerating: false,
    generatedCards: [],
    generatedCopytext: '',
    error: null,
}

/**
 * 验证状态更新
 */
function validateStateUpdate(update: Partial<AppState>): boolean {
    if (update.inputText !== undefined && typeof update.inputText !== 'string') {
        return false
    }

    if (update.selectedModel && !['deepseek', 'nanobanana'].includes(update.selectedModel)) {
        return false
    }

    if (update.selectedStyle && !['simple', 'standard', 'rich'].includes(update.selectedStyle)) {
        return false
    }

    return true
}

/**
 * 应用状态 Reducer
 */
function appReducer(state: AppState, action: AppAction): AppState {
    try {
        switch (action.type) {
            // 新的清晰 Actions
            case 'INPUT_TEXT_CHANGED':
                return { ...state, inputText: action.payload, error: null }

            case 'MODEL_SELECTED':
                return {
                    ...state,
                    selectedModel: action.payload,
                    error: null,
                    // 切换模型时清除之前的结果
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
                return {
                    ...state,
                    isGenerating: false,
                    error: action.payload,
                }

            case 'GENERATION_RESET':
                return {
                    ...state,
                    isGenerating: false,
                    generatedCards: [],
                    generatedCopytext: '',
                    error: null,
                }

            case 'STATE_UPDATED':
                if (!validateStateUpdate(action.payload)) {
                    console.error('[AppContext] 无效的状态更新:', action.payload)
                    return { ...state, error: '状态更新失败' }
                }
                return { ...state, ...action.payload }

            // 向后兼容的 Actions
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
                console.warn('[AppContext] 未知的 Action 类型:', (action as any).type)
                return state
        }
    } catch (error) {
        console.error('[AppContext] Reducer 错误:', error)
        return {
            ...state,
            error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        }
    }
}

/**
 * Context 类型定义
 */
interface AppContextType {
    // 状态
    state: AppState

    // 基础 dispatch
    dispatch: React.Dispatch<AppAction>

    // 便捷方法
    updateState: (updates: Partial<AppState>) => void

    // 语义化的 action creators
    actions: {
        setInputText: (text: string) => void
        selectModel: (model: AIModel) => void
        changeStyle: (style: 'simple' | 'standard' | 'rich') => void
        startGeneration: () => void
        completeGeneration: (cards: GeneratedCard[], copytext: string) => void
        failGeneration: (error: string) => void
        resetGeneration: () => void
    }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

/**
 * Provider 组件属性
 */
interface AppProviderProps {
    children: ReactNode
    /** 初始状态（可选，用于测试） */
    initialState?: Partial<AppState>
}

/**
 * 应用状态 Provider
 */
export function AppProvider({ children, initialState }: AppProviderProps) {
    const [state, dispatch] = useReducer(
        appReducer,
        initialState ? { ...defaultAppState, ...initialState } : defaultAppState,
    )

    // 基础更新方法
    const updateState = (updates: Partial<AppState>) => {
        dispatch({ type: 'STATE_UPDATED', payload: updates })
    }

    // 语义化的 action creators
    const actions = {
        setInputText: (text: string) => {
            dispatch({ type: 'INPUT_TEXT_CHANGED', payload: text })
        },

        selectModel: (model: AIModel) => {
            dispatch({ type: 'MODEL_SELECTED', payload: model })
        },

        changeStyle: (style: 'simple' | 'standard' | 'rich') => {
            dispatch({ type: 'STYLE_CHANGED', payload: style })
        },

        startGeneration: () => {
            dispatch({ type: 'GENERATION_STARTED' })
        },

        completeGeneration: (cards: GeneratedCard[], copytext: string) => {
            dispatch({
                type: 'GENERATION_COMPLETED',
                payload: { cards, copytext },
            })
        },

        failGeneration: (error: string) => {
            dispatch({ type: 'GENERATION_FAILED', payload: error })
        },

        resetGeneration: () => {
            dispatch({ type: 'GENERATION_RESET' })
        },
    }

    const contextValue: AppContextType = {
        state,
        dispatch,
        updateState,
        actions,
    }

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

/**
 * App Context Hook
 *
 * @throws Error 如果在 AppProvider 外使用
 */
export function useApp(): AppContextType {
    const context = useContext(AppContext)

    if (context === undefined) {
        throw new Error('useApp 必须在 AppProvider 内使用')
    }

    return context
}

/**
 * 便捷的状态选择器 Hook
 */
export function useAppSelector<T>(selector: (state: AppState) => T): T {
    const { state } = useApp()
    return selector(state)
}

/**
 * 便捷的 Actions Hook
 */
export function useAppActions() {
    const { actions } = useApp()
    return actions
}
