import type { AppState, AIModel, GeneratedCard } from '@/types'

export type AppAction =
    | { type: 'INPUT_TEXT_CHANGED'; payload: string }
    | { type: 'MODEL_SELECTED'; payload: AIModel }
    | { type: 'STYLE_CHANGED'; payload: 'simple' | 'standard' | 'rich' }
    | { type: 'GENERATION_STARTED' }
    | { type: 'GENERATION_COMPLETED'; payload: { cards: GeneratedCard[]; copytext: string } }
    | { type: 'GENERATION_FAILED'; payload: string }
    | { type: 'GENERATION_RESET' }
    | { type: 'STATE_UPDATED'; payload: Partial<AppState> }
    | { type: 'SET_INPUT_TEXT'; payload: string }
    | { type: 'SET_SELECTED_MODEL'; payload: AIModel }
    | { type: 'SET_GENERATING'; payload: boolean }
    | { type: 'SET_GENERATED_CARDS'; payload: GeneratedCard[] }
    | { type: 'SET_GENERATED_COPYTEXT'; payload: string }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET_GENERATION' }
    | { type: 'UPDATE_STATE'; payload: Partial<AppState> }

export interface AppContextType {
    state: AppState
    dispatch: React.Dispatch<AppAction>
    updateState: (updates: Partial<AppState>) => void
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
