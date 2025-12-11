# 艺术化重构风格指南

## 命名黑/白名单

- 白名单（允许诗意命名）：`src/components/**`, `src/app/**`, `src/services/copytext.ts`
- 黑名单（保持现有命名以避免破坏）：`src/application/**`, `src/domain/**`, `src/lib/**`, `src/interfaces/**`, `src/container/**`, `src/config/**`, `src/types/**`

## 诗意命名法

- 变量：具象名词，例如 `crimsonSunset`, `glassEcho`, `auroraMist`
- 函数：动宾短语，例如 `paintColorGradient()`, `weaveNeonShadows()`, `whisperToast()`

## ASCII 分隔注释模板

```
/*******************************
 * 色彩处理模块
 *******************************/
```

## 间距与网格

- 统一采用 8px 基准（Tailwind 对应 `p-2/p-4/p-6`, `m-2/m-4/m-6`, `gap-2/gap-4`）
- 清理非 8 倍数的间距类（如 `gap-3`）

## 结构节奏

- 黄金分割：核心导出位于文件总行数约 61.8% 位置
- 斐波那契空白：相关块以 1, 1, 2, 3, 5 行空白分组
- if/else 对称：匹配分支保持相同行量与镜像缩进
