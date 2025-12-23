# Python重构项目 - 架构文档

## 项目概述

本文档描述了公众号转小红书卡片生成器的Python重构版本架构。该版本采用企业级开发标准，包括领域驱动设计(DDD)、事件驱动架构、完整的类型注解等先进理念。

## 目录结构

```
refactor_python/
├── src/gzh2xhs_refactor/           # 源代码目录
│   ├── __init__.py                 # 包初始化
│   ├── application/                # 应用层 (用例)
│   │   └── use_cases.py           # 业务用例实现
│   ├── domain/                     # 领域层 (核心业务)
│   │   ├── entities.py            # 领域实体
│   │   └── services.py            # 领域服务
│   ├── infrastructure/             # 基础设施层
│   │   ├── providers/             # 外部服务适配器
│   │   │   └── ai_providers.py    # AI服务适配器
│   │   └── services/              # 技术服务
│   │       └── image_renderer.py  # 图像渲染服务
│   ├── interfaces/                 # 接口层 (API)
│   ├── shared/                     # 共享组件
│   │   ├── types.py               # 类型定义
│   │   ├── events.py              # 事件系统
│   │   ├── errors.py              # 异常处理
│   │   ├── logging.py             # 日志系统
│   │   ├── performance.py         # 性能监控
│   │   └── design_patterns.py     # 设计模式
│   └── main.py                     # 应用入口
├── tests/                          # 测试目录
│   ├── unit/                       # 单元测试
│   ├── integration/                # 集成测试
│   └── performance/                # 性能测试
├── docs/                           # 文档目录
├── scripts/                        # 脚本目录
├── Dockerfile                      # Docker构建文件
├── docker-compose.yml             # Docker Compose配置
├── pyproject.toml                 # 项目配置
├── requirements.txt               # 依赖文件
└── Makefile                       # 构建脚本
```

## 架构原则

### 1. 领域驱动设计 (DDD)

-   **领域层**: 包含核心业务逻辑，独立于技术实现
-   **应用层**: 协调领域对象执行具体用例
-   **基础设施层**: 提供技术实现细节
-   **接口层**: 处理外部交互

### 2. 事件驱动架构

-   领域事件用于解耦模块间依赖
-   事件总线支持发布-订阅模式
-   内置审计和指标收集

### 3. 依赖注入

-   使用工厂模式管理依赖创建
-   支持单例和原型模式
-   配置外部服务适配器

## 核心模块

### 领域层 (Domain)

#### 实体 (Entities)

-   `Card`: 卡片实体，核心业务对象
-   `Template`: 模板实体，设计模板管理
-   `GenerationTask`: 生成任务实体，异步任务跟踪
-   `User`: 用户实体，用户管理

#### 值对象 (Value Objects)

-   `CardId`: 卡片ID，类型安全的标识符
-   `UserId`: 用户ID，用户标识符
-   `ContentText`: 内容文本，验证业务规则
-   `Timestamp`: 时间戳，统一时间处理

#### 领域服务 (Domain Services)

-   `AIService`: AI分析服务，核心业务逻辑
-   `ImageRenderService`: 图像渲染服务
-   `CardGenerationService`: 卡片生成业务服务
-   `CacheService`: 缓存服务
-   `ValidationService`: 验证服务
-   `BusinessRuleService`: 业务规则服务

### 应用层 (Application)

#### 用例 (Use Cases)

-   `GenerateCardUseCase`: 生成卡片用例
-   `ExportCardUseCase`: 导出卡片用例
-   `GetUserCardsUseCase`: 获取用户卡片用例
-   `GetTaskStatusUseCase`: 获取任务状态用例

### 基础设施层 (Infrastructure)

#### 服务适配器

-   `DeepSeekProvider`: DeepSeek AI服务适配器
-   `NanoBananaProvider`: NanoBanana AI服务适配器
-   `PlaywrightRenderer`: Playwright渲染器
-   `PillowRenderer`: Pillow渲染器

### 共享层 (Shared)

#### 事件系统

-   `DomainEvent`: 领域事件基类
-   `EventBus`: 事件总线
-   `EventHandler`: 事件处理器协议
-   内置审计和指标处理器

#### 异常处理

-   `BaseAppError`: 应用异常基类
-   `DomainError`: 领域异常
-   `InfrastructureError`: 基础设施异常
-   `ValidationError`: 验证异常
-   异常映射和全局处理

#### 日志系统

-   结构化日志记录
-   请求上下文追踪
-   敏感信息脱敏
-   性能监控集成

#### 性能监控

-   `MetricsCollector`: 指标收集器
-   `RequestProfiler`: 请求性能分析
-   `ResourceMonitor`: 资源监控器
-   `PerformanceBenchmark`: 性能基准测试

## 设计模式应用

### 1. 工厂模式 (Factory Pattern)

```python
# AI服务工厂
provider = AIServiceFactory.create_provider("deepseek", api_key, api_url)

# 渲染器工厂
renderer = RendererFactory.create_renderer("playwright")
```

### 2. 策略模式 (Strategy Pattern)

```python
# 定价策略
pricing_context = PricingContext(BasicPricingStrategy())
price = pricing_context.calculate_price(base_price, user_tier, usage_count)
```

### 3. 观察者模式 (Observer Pattern)

```python
# 事件发布
await event_bus.publish(DomainEvent("CardGenerated", data))

# 事件订阅
metrics_observer = MetricsObserver()
event_bus.subscribe("CardGenerated", metrics_observer)
```

### 4. 构建者模式 (Builder Pattern)

```python
# 卡片配置构建
config = (CardConfigurationBuilder()
    .set_template("template_001")
    .set_style("modern")
    .add_color("primary", "#4F46E5")
    .build())
```

### 5. 命令模式 (Command Pattern)

```python
# 命令执行
command = GenerateCardCommand(content, template_id, ai_service)
result = await invoker.execute_command(command)
```

### 6. 单例模式 (Singleton Pattern)

```python
# 配置管理器
config_manager = ConfigManager()
```

## 数据流

### 卡片生成流程

1. **输入验证**: 验证生成请求参数
2. **业务规则检查**: 检查用户配额和权限
3. **缓存检查**: 检查是否存在相同请求的缓存
4. **创建任务**: 创建异步生成任务
5. **事件发布**: 发布卡片生成开始事件
6. **执行生成**:
    - 调用AI服务生成设计规格
    - 生成SVG内容
    - 渲染图像
7. **更新状态**: 更新任务和卡片状态
8. **事件发布**: 发布完成或失败事件
9. **返回结果**: 返回任务ID和预估时间

### 事件驱动流程

1. **领域事件触发**: 业务操作触发领域事件
2. **事件总线分发**: 事件总线分发事件给订阅者
3. **事件处理器执行**: 审计、指标、通知等处理器执行
4. **状态同步**: 相关聚合状态同步更新

## 性能优化

### 1. 异步处理

-   所有I/O操作使用异步方式
-   并发执行独立任务
-   避免阻塞主线程

### 2. 缓存策略

-   多层缓存设计
-   TTL过期机制
-   缓存预热和失效

### 3. 资源管理

-   连接池复用
-   内存池管理
-   对象池模式

### 4. 性能监控

-   实时指标收集
-   性能瓶颈识别
-   自动化性能测试

## 安全考虑

### 1. 输入验证

-   严格的数据验证
-   SQL注入防护
-   XSS攻击防护

### 2. 认证授权

-   JWT令牌认证
-   基于角色的访问控制
-   API密钥管理

### 3. 数据保护

-   敏感数据加密
-   日志脱敏
-   传输加密

### 4. 安全扫描

-   依赖漏洞扫描
-   代码安全分析
-   容器安全检查

## 部署架构

### 1. 容器化部署

-   Docker多阶段构建
-   最小化镜像体积
-   非root用户运行

### 2. 服务网格

-   负载均衡
-   服务发现
-   熔断器模式

### 3. 监控运维

-   健康检查
-   性能监控
-   日志聚合
-   告警通知

## 扩展性设计

### 1. 水平扩展

-   无状态服务设计
-   数据库读写分离
-   缓存集群

### 2. 垂直扩展

-   资源动态调整
-   自动扩容
-   性能调优

### 3. 功能扩展

-   插件化架构
-   微服务拆分
-   API版本管理

## 开发指南

### 1. 代码规范

-   严格遵循PEP 8
-   完整类型注解
-   详细文档字符串

### 2. 测试策略

-   单元测试覆盖率 > 90%
-   集成测试覆盖关键路径
-   性能测试基准对比

### 3. 持续集成

-   自动化构建和测试
-   代码质量门禁
-   安全扫描集成

### 4. 文档维护

-   API文档自动生成
-   架构文档同步更新
-   变更日志记录

## 总结

该Python重构版本采用现代化的架构设计和开发实践，提供了：

-   **可维护性**: 清晰的模块边界和依赖关系
-   **可扩展性**: 插件化架构和微服务支持
-   **可测试性**: 完整的测试覆盖和自动化测试
-   **可监控性**: 全面的指标收集和性能监控
-   **可部署性**: 容器化部署和CI/CD流水线

通过这些设计，系统能够满足企业级应用的要求，同时保持良好的开发体验和运维效率。
