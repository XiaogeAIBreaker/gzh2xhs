"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/modules/app.module");
describe('Health', () => {
    it('returns ok true', async () => {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        const server = app.getHttpServer();
        await app.init();
        const res = await (0, supertest_1.default)(server).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        await app.close();
    });
});
//# sourceMappingURL=health.spec.js.map