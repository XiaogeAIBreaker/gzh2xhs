import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getApiBaseUrl } from '../utils/apiBase'

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: getApiBaseUrl(),
        prepareHeaders: (headers) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            if (token) headers.set('authorization', `Bearer ${token}`)
            return headers
        },
    }),
    endpoints: () => ({}),
})
