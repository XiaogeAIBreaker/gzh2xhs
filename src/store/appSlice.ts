import { createSlice } from '@reduxjs/toolkit'

export interface AppState {
    theme: 'dark' | 'light'
}

const initialState: AppState = {
    theme: 'dark',
}

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setTheme(state, action: { payload: 'dark' | 'light' }) {
            state.theme = action.payload
        },
    },
})

export const { setTheme } = appSlice.actions
export default appSlice.reducer
