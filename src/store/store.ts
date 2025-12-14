import { configureStore } from '@reduxjs/toolkit'
import appReducer from './appSlice'
import { baseApi } from './api'

export const store = configureStore({
    reducer: {
        app: appReducer,
        [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
