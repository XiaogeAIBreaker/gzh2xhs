import { useApp } from './AppContext'
import type { AppState } from '@/types'

export function useAppSelector<T>(selector: (state: AppState) => T): T {
    const { state } = useApp()
    return selector(state)
}

export function useAppActions() {
    const { actions } = useApp()
    return actions
}
