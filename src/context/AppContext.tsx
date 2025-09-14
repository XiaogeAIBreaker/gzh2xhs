'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, AIModel, GeneratedCard } from '@/types'

// Actions
type AppAction =
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'SET_SELECTED_MODEL'; payload: AIModel }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_GENERATED_CARDS'; payload: GeneratedCard[] }
  | { type: 'SET_GENERATED_COPYTEXT'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_GENERATION' }
  | { type: 'UPDATE_STATE'; payload: Partial<AppState> }

// Initial state
const initialState: AppState = {
  inputText: '',
  selectedModel: 'deepseek',
  isGenerating: false,
  generatedCards: [],
  generatedCopytext: '',
  error: null,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
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
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  updateState: (updates: Partial<AppState>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const updateState = (updates: Partial<AppState>) => {
    dispatch({ type: 'UPDATE_STATE', payload: updates })
  }

  return (
    <AppContext.Provider value={{ state, dispatch, updateState }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}