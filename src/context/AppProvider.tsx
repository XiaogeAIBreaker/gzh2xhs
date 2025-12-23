'use client'
import { createContext, useContext, useReducer, ReactNode } from 'react'
import type { AppContextType } from './types'
import { appReducer, defaultAppState } from './reducer'
import { createActions } from './actions'

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
    children: ReactNode
    initialState?: Partial<import('@/types').AppState>
}

/**
 *
 */
export function AppProvider({ children, initialState }: AppProviderProps) {
    const [state, dispatch] = useReducer(
        appReducer,
        initialState ? { ...defaultAppState, ...initialState } : defaultAppState,
    )
    const updateState = (updates: Partial<import('@/types').AppState>) => {
        dispatch({ type: 'STATE_UPDATED', payload: updates })
    }
    const actions = createActions(dispatch)
    const contextValue: AppContextType = { state, dispatch, updateState, actions }
    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

/**
 *
 */
export function useApp(): AppContextType {
    const context = useContext(AppContext)
    if (context === undefined) throw new Error('useApp 必须在 AppProvider 内使用')
    return context
}
