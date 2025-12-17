export type RequestId = string;
export type UserContext = { id: string; roles: string[] };
export type ApiResponse<T> = { code: string; message?: string; data?: T };
