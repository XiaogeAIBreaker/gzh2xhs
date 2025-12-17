# 架构标准与目录结构规范

## 分层边界
- Presentation：控制器/路由层仅负责协议转换、鉴权与校验，不包含业务逻辑。
- Application：用例编排与事务，面向接口；不得直接依赖基础设施细节。
- Domain：实体/聚合/领域服务，纯函数化与不依赖框架；对外仅暴露接口与事件。
- Infrastructure：ORM/DB/缓存/消息/HTTP 客户端等实现，适配接口并可替换。

## 目录结构（示例）
- 前端（Next.js）：
  - `src/app/`：页面与路由（仅视图与数据绑定）。
  - `src/interfaces/http/`：控制器/中间件（输入/输出与校验）。
  - `src/application/`：用例与服务编排。
  - `src/domain/`：领域模型与规则。
  - `src/infrastructure/`：API 客户端、缓存、持久化适配。
  - `src/shared/`：工具库与通用类型（不可耦合具体业务）。
- Node 服务（Nest/Koa）：
  - `src/presentation/`：控制器/过滤器/拦截器。
  - `src/application/`：用例服务与端口定义。
  - `src/domain/`：实体/聚合/领域服务。
  - `src/infrastructure/`：仓储、ORM、Redis、消息与外部接口适配。
- Python 服务（FastAPI）：
  - `src/pyapp/interfaces/`：路由与入参校验。
  - `src/pyapp/application/`：用例与服务编排。
  - `src/pyapp/domain/`：模型与领域逻辑。
  - `src/pyapp/infrastructure/`：数据库/缓存/外部服务适配。

## 依赖规则
- 同方向依赖：上层依赖下层的抽象（端口/接口），基础设施实现依赖领域与应用定义的端口。
- 禁止环依赖与跨层穿透；通过依赖巡航与 CI 规则强制校验。

## 契约管理
- 对外与跨服务契约以 OpenAPI/JSON Schema 管理；生成客户端/服务端类型。
- 合并请求必须通过契约 Diff 校验与版本策略（`v1`/`v2`）。

## 配置与环境
- 分环境配置（dev/stage/prod），统一 `.env.example` 与加载顺序；禁止在代码内读取未声明的环境变量。

## 可观测性与容错
- 日志、指标与追踪在各层设置统一接口；业务异常分类明确；重试/熔断/隔离策略标准化。

## 迁移与版本化
- 引入兼容层与适配器以平滑迁移；以 Feature Flag 控制功能切换与灰度范围。
