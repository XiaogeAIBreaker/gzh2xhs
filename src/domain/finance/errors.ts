/**
 *
 */
export class FinanceError extends Error {
    code: string
    /**
     *
     */
    constructor(code: string, message: string) {
        super(message)
        this.code = code
    }
}

/**
 *
 */
export class FinanceWarning {
    code: string
    message: string
    /**
     *
     */
    constructor(code: string, message: string) {
        this.code = code
        this.message = message
    }
}
