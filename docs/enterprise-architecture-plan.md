# 13亿用户爆款应用总体架构与技术方案

## 概览与目标

- 业务目标：支撑13亿注册、千万级DAU、核心接口P95<100ms、峰值≥100k RPS、全年可用性≥99.99%。
- 架构原则：分层清晰、事件驱动、读写分离与CQRS、边缘优先、故障隔离与降级、可观测与可回滚。
- 当前栈基线：前端 Next.js 14 + React 18；后端 NestJS 10（apps/api）+ 并行 FastAPI（pyapp）；DDD分层与缓存（Redis/LRU）。参考 `docs/ADR/0001-stack-and-architecture.md` 与 `docs/architecture.md`。

## 系统总览

- 前端：Next.js App Router，SSR/ISR + Edge Functions；CDN/多域名分发；Feature Flag 控制灰度。
- API 层：
    - Gateway/Ingress：全局GSLB + CDN边缘 + API网关（WAF、mTLS、速率限制、IP信誉），统一鉴权与观测。
    - 微服务：认证、用户、画像、内容、Feed、搜索、通知、支付、风控、审核、推荐、A/B测试、实验平台、数据接入。
- 数据层：
    - 事务型：强一致支付/认证选 CockroachDB/TiDB（多活）或 PostgreSQL+Vitess（分片），读写分离。
    - KV缓存：Redis Cluster/Aerospike；热点预计算与多级缓存（边缘/应用/本地LRU）。
    - 分析型：Kafka/Pulsar + Flink 流处理 → ClickHouse/BigQuery/Snowflake；Data Lake(对象存储+Parquet)。
- 流控与弹性：K8s(HPA/KEDA)、拆分队列、优雅降级；按租户/地区/业务域隔离。
- 可观测：OpenTelemetry(Trace/Metrics/Logs)、SLO报表、自动回滚策略。参考 `docs/refactor/灰度与回滚策略.md`。

## 用户系统设计

- 高并发注册/登录：
    - 协议：OAuth2.1/OpenID Connect；Token：短期JWT + Refresh Token；会话固定与一次性token。
    - 多因素：WebAuthn/Passkey + TOTP/SMS；设备绑定、风险分层触发MFA。
    - 接入防护：WAF + BotDefense、IP/设备指纹、基于行为评分的挑战（Puzzle/滑块）。
    - 限流与栅栏：令牌桶 + 并发栅栏；幂等key保护注册与支付。现有中间件参考 `src/shared/lib/rateLimiter.ts` 与 `pyapp/shared/ratelimiter.py`。
    - 代码锚点：
        - 现状鉴权解析：`src/interfaces/http/middleware/auth.ts:5-12`（示例Bearer解析），需升级为OIDC验证与RBAC。
        - 基于策略的访问控制：`src/interfaces/http/middleware/rbac.ts:22-29`，扩展为细粒度ABAC与租户隔离。
- 用户画像与行为：埋点SDK → Kafka → 画像服务构建特征；实时/离线特征入 Feature Store（Redis/ClickHouse）；隐私最小化与可删除。

## 核心功能架构

- 微服务拆分：
    - Auth、User、Profile、Session、Device、Content、Feed、Search、Notification、Payment、Risk、Moderation、Recommendation、Experiment、Analytics-Ingest。
    - 边界契约：REST/gRPC（Protobuf），版本化（v1/v2）；zod/JSON Schema 校验。参考 `docs/refactor/ADR-001_架构重构总决策.md`。
- 数据同步与一致性：
    - CQRS：写路径本地事务 + Outbox；读路径物化视图/缓存。
    - 事件总线：Kafka/Pulsar；Topic按业务域分区；跨区使用MirrorMaker/Geo-Replication。
    - CDC：MySQL/Postgres → Kafka；下游维护缓存一致性与索引更新。
- 容灾与故障转移：
    - 多地域多活（读本地、写亲和）；跨区一致性使用CRDT或业务幂等保证。
    - 统一开关：全局降级与断路器；可回滚发布与一键切流。

## 性能与扩展性

- 全球CDN：多厂商联合（Cloudflare/Akamai/腾讯云/阿里云），Anycast接入；边缘KV缓存热Key；图片/视频转码与HLS/DASH包装。
- 自动伸缩：
    - 前端与边缘：ISR预渲染 + 缓存失效；请求峰值下以静态化/预生成降低后端压力。
    - 后端：HPA按RPS/CPU/延迟；KEDA按队列深度；Worker池分级（高优/低优）。
- 多地域部署：
    - 拓扑：美东/欧中/亚太三活 + 数据驻留策略；GSLB基于地理和端到端RTT。
    - 一致性：写亲和 + Saga；支付类服务强一致数据库；其他最终一致。
- 100k+ RPS达成要点：
    - 接口协议：gRPC/HTTP2；尽量二进制编解码（Protobuf）。
    - 缓存：多级缓存命中率≥95%；ETag/If-None-Match端到端（`docs/architecture.md:21-24`）。
    - 预计算：Feed/推荐离线批 + 在线增量；热榜与个性化分页预拼装。
    - I/O优化：连接池复用、零拷贝、批量接口与合并器；避免跨区链路。

## 合规与安全

- 隐私与合规：GDPR/CCPA/PIPL；数据最小化、目的限制、保留策略、可导出与删除；数据驻留与跨境评估。
- 内容审核与风控：
    - 审核策略：关键词/向量检索 + ML分类；人工仲裁与申诉通道；证据留存。
    - 风控引擎：规则 + 模型（特征来自行为画像）；实时拦截与事后复核。
- 金融与支付安全：PCI DSS、3DS2、FDS（欺诈检测）、对账与结算；幂等与可追溯。
- 执行手册参考：`docs/security/安全加固执行手册.md`（WAF、mTLS、KMS、审计、渗透）。

## 运营支撑

- 实时大数据平台：Kafka→Flink→ClickHouse（近实时看板）；离线 Spark/Presto→仓库；质量校验与数据血缘。
- A/B测试与灰度：
    - 分流：用户/设备/会话维度；多臂老虎机/贝叶斯优化；统计显著性校验。
    - 交付：Argo Rollouts/Flagger 渐进发布；一键回滚与演练（`docs/refactor/灰度与回滚策略.md`）。
- 智能推荐：
    - 特征：实时埋点→Feature Store；召回（向量/协同过滤）+ 排序（DNN/GBDT）；冷启动与多目标优化。
    - 反馈闭环：在线学习与模型监控；偏差与漂移告警。

## 技术指标与SLO

- 可用性：全局 99.99%（月容许停机≈4.38分钟）；核心链路多活与故障隔离。
- 延迟：核心接口 P95<100ms、P99<200ms；跨区接口单独SLO与降级预案。
- 吞吐：≥100k RPS（峰值×3备战）；容量规划与压测基线（`docs/perf-baseline.md`）。
- 错误预算：按服务定义；自动回滚触发阈值（延迟/错误率）。

## 数据模型与存储建议

- 事务表：users、sessions、devices、auth_factors、payments、orders、audit_logs。
- 索引与分片：按用户ID/地域分片；热点行搬迁；归档冷数据至对象存储。
- 搜索与向量：OpenSearch/Elasticsearch；向量检索用于内容与推荐召回。
- 出站一致性：Outbox+CDC；消费者幂等与Exactly-Once近似（事务+去重）。

## DevOps与部署

- K8s与服务网格：Istio/Linkerd mTLS与策略；Namespace按业务域；资源配额与Pod优先级。
- 部署管道：CI（lint/test/安全扫描）→ CD（分批/金丝雀/自动回滚）；Helm Charts 已有（`deploy/helm/*`），按环境覆盖values。
- 配置与密钥：集中配置服务；KMS托管密钥；不在仓库存储任何秘密。
- 观测落地：OpenTelemetry→Prometheus/Loki/Tempo 或云厂商观测；SLO仪表盘与告警联动。

## 容灾与备份

- 拓扑：三地域主备；跨云备份（WORM与加密）；定期演练与RTO/RPO记录。
- 故障转移：健康检查+权重调整；写亲和迁移策略；队列与缓存清理。

## 风险与权衡

- 多活复杂性：一致性成本与跨区写代价；建议关键交易限定单区强一致，其余最终一致。
- 供应商锁定：多CDN/多云抽象层增加维护成本；以核心链路为优先。
- 成本控制：FinOps与按需伸缩；热点与冷数据分层存储。

## 分阶段落地计划

- Phase 0 基线：观测/限流/缓存端到端、压测与指标建档（`docs/baseline.md`；`scripts/perf/basic-bench.mjs`）。
- Phase 1 架构：Gateway/WAF、OIDC与MFA上线、CQRS与Outbox、Kafka总线、Redis Cluster、Helm多环境。
- Phase 2 全球化：多地域多活、GSLB与CDN多厂商、数据驻留、内容审核与风控闭环、A/B平台、推荐召回与排序。
- Phase 3 优化：协议gRPC化、边缘计算增强、成本与能效优化、自动回滚完善、SRE演练制度化。

## 与现有代码库的映射

- NestJS入口与拦截器：`apps/api/src/main.ts:9-33`（全局校验、审计与指标），可扩展接入网关与mTLS。
- HTTP接口与中间件：`src/interfaces/http/*`（auth/rbac/validation），作为统一控制点扩展OIDC与RBAC/ABAC。
- 缓存与限流：`src/shared/lib/cache.ts`、`src/shared/lib/rateLimiter.ts`、`apps/api/src/shared/cache/*`；统一Redis Cluster并按业务域封装。
- 部署与编排：`deploy/helm/*`（web/api charts）；按多环境覆盖与分批策略落地。

## 成功度量与验收

- 验收清单：可用性SLO达标、P95延迟达标、错误预算在限、压测≥100k RPS、自动回滚演练通过、合规审计通过。
- 报表：按周/按版本导出性能与稳定性对比，建立趋势与回归预警。
