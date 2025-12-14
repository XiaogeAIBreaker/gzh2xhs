## 范围与目标
- 在不改变业务功能与现有 API 契约的前提下，全面应用现代 JavaScript（ES6+）语法与工程实践。
- 保留 TypeScript 类型系统与现有目录结构，重点进行：模块化整理、语法现代化、错误处理统一、性能优化（减少不必要 DOM 操作）、测试补强与文档说明。

## 代码结构与模块化
- 维持当前 App Router 架构（`src/app/**`），对 hooks、lib、usecases 的内部职责做轻量级解耦：
  - 将下载相关逻辑集中到可复用的工具（如 `src/shared/lib/downloader.ts`），供 `useExport` 与其他组件使用。
  - 明确浏览器 API 封装层（如 `src/shared/lib/browser.ts`），统一处理 SSR 环境判断与事件绑定，减少组件/Hook中重复的 `window/document` 直接调用。
- 保持 ESM `import/export`，移除潜在的历史 CommonJS（源码中未检出；配置类文件是否统一为 ESM按工具支持另议）。

## 语法现代化（按文件项）
- 使用 `const/let`（全仓库未命中 `var`，无需风险性替换）。
- 箭头函数：源码已广泛使用；保留现状。
- 模板字符串替换拼接：
  - `src/hooks/useHotkeys.ts:8-9` 将 `(e.metaKey || e.ctrlKey ? 'Cmd+' : '') + e.key` 改为 ```${e.metaKey || e.ctrlKey ? 'Cmd+' : ''}${e.key}``` 并抽象组合逻辑为小函数，提高可读性。
  - `src/hooks/useSessionId.ts:19` 将 `Math.random().toString(36).slice(2) + Date.now().toString(36)` 改为 ```${Math.random().toString(36).slice(2)}${Date.now().toString(36)}```。
  - `src/hooks/useSessionId.ts:22-25` 将 `new RegExp('(^| )' + name + '=([^;]+)')` 改为 ``new RegExp(`(^| )${name}=([^;]+)`)``。
  - `src/application/usecases/GenerateCardUseCase.ts:77-81` 将缓存键 `'g:' + ...` 改为模板字符串，形如 ``g:${hash}``，同时将哈希生成封装为明确的局部常量。
  - `src/lib/logger.ts:8` 将 `v.slice(0, 2000) + '…'` 改为模板字符串以统一风格：``${v.slice(0, 2000)}…``。

## 错误处理机制与健壮性
- 统一错误抛出与日志：
  - 在 `GenerateCardUseCase.execute` 中保留现有容错占位图流程（`src/application/usecases/GenerateCardUseCase.ts:58-66`），但在 `catch` 分支记录 `logger.error`（带 `traceId`/`scope`），并区分超时与 AI 失败。
  - `withTimeout`（`src/application/usecases/GenerateCardUseCase.ts:146-155`）与 `withRetry`（`src/application/usecases/GenerateCardUseCase.ts:157-170`）保留策略，增加对 `AbortSignal` 的支持（可选，若后续路由层提供信号），以便更好地取消。
- 在 `useExport`（`src/hooks/useExport.ts:12-41`、`45-61`）中：
  - 标准化错误文案与分层（网络错误/响应错误/浏览器下载失败），并将错误信息统一上报 `updateState`，附加简单错误码以便追踪。

## DOM 操作优化
- SSR 安全封装：
  - `useHotkeys`（`src/hooks/useHotkeys.ts:6-16`）事件绑定时增加 `typeof window !== 'undefined'` 守卫，并在 `useEffect` 清理时确保处理器稳定（`useCallback` 或外部定义）。
  - `useSessionId` 已有 `typeof document === 'undefined'` 防护（`src/hooks/useSessionId.ts:9`），保留并扩展到 Cookie 写入。
- 减少不必要 DOM 操作：
  - `useExport` 下载流程（`src/hooks/useExport.ts:28-36`、`48-56`）复用一次性隐藏 `<a>` 节点（或通过工具函数内部维护），避免每次创建/移除节点；统一释放 `URL.createObjectURL`。

## 代码拆分与功能解耦
- 提炼小型纯函数：
  - `useHotkeys` 将组合键逻辑提炼成 `formatKey(e)`，便于测试与复用。
  - `useSessionId` 将正则匹配与写入逻辑分为 `readSidCookie(name)` / `writeSidCookie(name, value, days)`，便于覆盖测试与替换实现。
  - `GenerateCardUseCase` 的 `makeCacheKey` 改为显式计算哈希与前缀组装两步，便于后续替换缓存前缀策略。

## 注释与文档
- 在重构触达的函数/导出点添加 JSDoc 风格注释（函数意图、参数与返回值说明、边界情况说明）。
- 产出《重构说明文档》，记录主要变更点、性能优化策略与风险控制，附关键代码引用。

## 单元测试计划（Vitest）
- 保留现有测试框架与覆盖率阈值（`vitest.config.ts`）。
- 新增/补强测试（在对应文件顶部使用 `@vitest-environment jsdom` 覆盖环境）：
  - `tests/use-hotkeys.test.ts`：验证 `formatKey(e)` 输出与触发回调；JSDOM 下模拟 `keydown`。
  - `tests/use-session-id.test.ts`：验证 Cookie 读写（含 `SameSite` 与 `expires`），以及 SSR 下返回 `undefined`。
  - `tests/use-export.test.ts`：mock `fetch`/`URL.createObjectURL` 与 `<a>` 点击，验证成功与失败分支、错误信息上报。
  - `tests/generate-usecase.test.ts`：在既有用例基础上，增加缓存键模板字符串的断言（不改变现有断言）。
- 运行并收集覆盖率报告，输出测试结果与关键覆盖率指标截图/摘要。

## 交付物
- 重构后的完整 JS/TS 代码（按上述变更项提交）。
- 如需：更新页面或组件对新增工具模块的引用（Next.js App 内无需手写 HTML 引用；CSS 保持 `src/app/globals.css`）。
- 测试用例与执行结果（文本摘要与 HTML 报告）。
- 《重构说明文档》（主要变更点与优化策略、影响面与回滚策略）。

## 影响面与回滚策略
- 变更均为语义等价的风格与健壮性改进；涉及 DOM 操作的优化在客户端环境下验证通过后再落地。
- 如出现非预期回归，可按文件粒度撤销；新增工具模块为增量，可独立移除。

## 文件级变更清单（附代码引用）
- `src/hooks/useHotkeys.ts:8-16` 模板字符串与 SSR 守卫
- `src/hooks/useSessionId.ts:19`、`22-25` 模板字符串与正则
- `src/application/usecases/GenerateCardUseCase.ts:77-81` 缓存键模板字符串与拆分
- `src/lib/logger.ts:8` 截断拼接统一模板字符串
- `src/hooks/useExport.ts:28-36`、`48-56` 下载流程复用节点与错误处理

---
如确认上述计划，我将按清单逐文件完成重构、补充测试并输出说明文档与测试报告。