"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/modules/app.module");
describe('Generate', () => {
    it('requires access for card_generate', async () => {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        const server = app.getHttpServer();
        await app.init();
        const unauth = await (0, supertest_1.default)(server).post('/generate').send({ title: 't', content: 'c' });
        expect([401, 403]).toContain(unauth.status);
        const ok = await (0, supertest_1.default)(server)
            .post('/generate')
            .set('authorization', 'Bearer admin-token')
            .send({ title: 't', content: 'c' });
        expect(ok.status).toBe(201);
        await app.close();
    });
});
//# sourceMappingURL=generate.spec.js.map