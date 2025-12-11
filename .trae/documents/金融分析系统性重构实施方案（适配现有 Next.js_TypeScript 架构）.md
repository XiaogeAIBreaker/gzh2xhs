## 项目现状总览

- 当前为 Next.js 14 全栈应用（TypeScript/React/Tailwind），前后端同仓；已具备统一日志、埋点、指标、限流、zod 校验与 Vitest 测试、CI 流水线。
- 金融功能尚未成型：仅埋点枚举含支付相关事件，无定价/风险/报表等计算逻辑与专用数值库。
- 适配策略：在不破坏现有 AI/导出等功能的前提下，增设“金融分析域”模块，按分层与可插拔方式集成到现有架构。

## 1. 项目评估阶段

- 模型与算法审计：对拟引入的定价、风险、报表算法建立基准数据集与期望结果；差异度量采用相对/绝对误差（≤1e-8）。
- 数据源质量评估：为外部/内部数据源定义 zod Schema 与质量维度（完整性/时效性/一致性/准确性），产出数据质量评分（0–100）并记录至指标与审计日志。
- 架构技术债识别：评估在控制器、UseCase 与共享库层的耦合度；明确金融域应独立为 `src/domain/finance` 与 `src/application/finance`，通过接口隔离。
- 评估报告：输出现状与风险清单（精度风险、并行计算开销、内存占用、审计存储与访问权限），附改进建议与影响面。

## 2. 重构技术方案

- 模块化设计：新增金融域分层结构
    - `src/domain/finance/instruments`: 股票/债券/衍生品的类型与接口（鉴别联合类型）。
    - `src/domain/finance/pricing`: 债券定价（收益率、久期/凸性）、期权定价（Black-Scholes 起步，后续可扩展）、股票指标（MA、波动率）。
    - `src/domain/finance/risk`: VaR/ES、敏感度（Greeks）、敞口聚合。
    - `src/domain/finance/reporting`: 规范化报表生成（CSV/JSON），与现有导出 `zip` 能力对接。
    - `src/domain/finance/timeseries`: 时间序列工具（去噪、异常检测、重采样、滚动统计）。
    - `src/domain/finance/validation`: 多层数据验证与业务规则校验（zod + 规则引擎）。
- 多层数据验证机制：
    - 输入层：zod Schema 严格类型校验（格式/范围/必填）；
    - 业务规则层：例如债券现金流与期限匹配、期权参数（sigma/r 无负值），异常值检测（3σ/箱线图/孤立森林可扩展）。
    - 计算输出层：结果区间与一致性校验（如价格非负、贴现曲线单调）。
- 分级异常处理框架：
    - 系统级错误（资源不足、依赖故障）→ `jsonError(code='SYSTEM_ERROR')` + 指标计数 + 结构化日志；
    - 业务级警告（数据质量低、边界条件）→ `jsonOk` 携带 `warnings`，可选降级路径；
    - 引入 `FinanceError`、`FinanceWarning` 分类，统一携带 `traceId/sessionId`。
- 时间序列专项优化：
    - 并行计算：建立 `FinanceWorkerPool`（Node `worker_threads`），对长耗时滚动计算/风险蒙特卡罗并行化；
    - 内存管理：块处理（chunking）、TypedArray、共享缓冲区；大数据量采用流式聚合，避免一次性加载。
- 数值计算精度：
    - 引入十进制高精度库（如 `decimal.js`/`big.js`），统一封装 `DecimalUtil`，所有金额/利率/价格计算采用 8 位小数精度控制；
    - 定义 `RoundPolicy`（银行家舍入/向零/向上）与领域专用常量；
    - 在关键路径添加精度断言与差异监控。

## 3. 质量保证措施

- 单元测试：为定价/风险/时间序列/验证模块编写高覆盖度用例，覆盖正常与边界（零息债、极端波动、极短到期等）。
- 回归测试：建立基准数据集（黄金样例），对重构前后（或算法版本）进行结果对比，误差阈值≤1e-8；
- 版本控制与变更管理：沿用 Git 流程，新增“模型版本号/规则版本号”变更记录与审计；
- 持续集成：在现有 CI 中加入静态分析（ESLint/TS）、测试覆盖率门槛（核心≥90%）、性能基准测试（tinybench/benchmark.js），生成 lcov 报告与趋势。

## 4. 交付成果

- 可维护的金融域代码库与模块划分文档（依赖/接口/异常/性能特性）。
- 测试覆盖率报告（核心逻辑 ≥90%）与基准测试结果（计算速度提升与内存占用指标）。
- 架构设计文档与技术决策记录（数值库选择、并行策略、校验规则来源与审计策略）。
- 用户手册与 API 文档（OpenAPI 端点：定价/风险/报表、请求/响应示例与错误语义）。

## 5. 金融专业要求落实

- 监管合规：
    - Basel III：风险加总、资本要求度量、压力测试流程化与证据留存；
    - MiFID II：计算可追溯、审计日志（订单/模型版本/参数）、结果透明与披露；
    - 数据治理：字段血缘、只读审计、访问控制（RBAC）与脱敏策略。
- 精度保障：统一 8 位小数，领域单位/换算一致，关键报表设精度断言与告警。
- 审计日志：追加写入（append-only）结构化日志，含 `actor/action/timestamp/inputs/outputs/hash/modelVersion`；与 `traceId` 关联。
- 多工具支持：通过鉴别联合类型覆盖股票、债券、衍生品；为各工具建立独立校验与计算管线。
- 计算过程追踪：返回可选 `ComputationTrace`（步骤/参数/中间值），便于验证与排查；对外接口受 RBAC 与敏感字段屏蔽。

## 与现有架构的集成点

- 控制器层：新增 `src/interfaces/http/controllers/finance/*`（PricingController、RiskController、ReportingController），统一 `zod.safeParse` 与 `jsonOk/jsonError`；
- API 路由：`src/app/api/finance/pricing/route.ts`、`risk/route.ts`、`report/route.ts`，承载 OpenAPI 文档生成；
- UseCase 层：`src/application/finance/*` 组织计算编排、并行与缓存策略，对接共享库 `metrics.ts`、`cache.ts`、`rateLimiter.ts`；
- 共享库拓展：新增 `decimal.ts`（精度）、`audit.ts`（审计）、`timeseries.ts`（高效滚动与异常检测），沿用 `logger.ts` 与指标体系；
- 中间件与安全：在 `middleware.ts` 保留/扩展 `traceId/experiment` 头；在 `rbac.ts` 新增金融端点角色权限；
- 前端：在表单与状态管理 `src/context/AppContext.tsx` 增加金融分析视图与轻量前端校验；关键交互接入埋点。

## 数据与验证细节

- Schema 示例：`BondSchema`（票面、票息、到期、日计数规则）、`OptionSchema`（S/K/T/r/σ/类型）、`EquitySchema`（价格序列与分红策略）；
- 业务规则：现金流匹配、期限一致性、日计数合法性、异常值（3σ/箱线图）与交易日校验；
- 结果校验：价格非负、收益率区间、波动率范围与曲线单调性；
- 质量评分：按维度打分与加权，低于阈值触发 `warnings` 并允许降级策略（如使用备用曲线或最近有效窗口）。

## 性能与并行化

- 工作池：`FinanceWorkerPool` 支持任务编排、批处理与超时/重试；长耗时任务监控指标（队列长度、等待/执行耗时）。
- 内存优化：流水线化（生成器/迭代器）、TypedArray、分块聚合；避免 JSON 大对象重复拷贝。

## 测试与基准

- 单元/属性测试：对数值稳定性与边界进行属性测试（快速检查不变量）。
- 回归基线：固定随机种子与基准输入，产出黄金结果文件；CI 比对并生成差异报告。
- 性能基线：对核心算法（贴现、波动率、VaR 蒙特卡罗）建立 qps/latency/内存占用曲线。

## 文档与开放接口

- OpenAPI：为 `pricing/risk/report` 生成规范与示例；
- 架构文档：模块关系、依赖、异常、审计与数据血缘；
- 用户手册：参数说明、精度策略、警告语义与追踪开关。

## 风险与依赖

- 第三方数值库选择与许可合规；
- 并行计算对资源占用与冷启动的影响；
- 审计日志存储成本与访问控制；
- 回归阈值设定与业务接受度。

——以上方案与现有仓库完全兼容，可按模块逐步落地，确保在引入金融分析能力时维持现有功能稳定与合规。
