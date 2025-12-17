"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
exports.withContext = withContext;
exports.logRequest = logRequest;
exports.logResponse = logResponse;
function createLogger(_options = {}) {
    const base = (level) => (obj) => {
        try {
            // 输出结构化 JSON，便于采集
            // @ts-ignore
            console[level](JSON.stringify({ level, ts: Date.now(), ...obj }));
        }
        catch {
            // 退化输出
            // @ts-ignore
            console[level](obj);
        }
    };
    return { info: base('info'), warn: base('warn'), error: base('error') };
}
function withContext(logger, ctx) {
    const child = (bindings) => {
        const base = (level) => (obj) => {
            logger[level]({ ...bindings, ...obj });
        };
        return { info: base('info'), warn: base('warn'), error: base('error'), child };
    };
    return child({ rid: ctx.rid, scope: ctx.scope });
}
function logRequest(logger, info) {
    logger.info({ event: 'http_request', method: info.method, path: info.path, rid: info.rid });
}
function logResponse(logger, info) {
    logger.info({ event: 'http_response', status: info.status, duration_ms: info.durationMs, rid: info.rid, path: info.path });
}
//# sourceMappingURL=index.js.map