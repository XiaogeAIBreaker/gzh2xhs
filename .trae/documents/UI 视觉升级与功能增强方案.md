## 目标
- 将界面升级为更具未来感与质感的沉浸式体验（霓虹、玻璃拟态、视差、光效）。
- 增强互动与反馈（微交互、动效、加载与状态可视化）。
- 扩充核心功能（模板库、批量与多尺寸导出、轻量编辑器、分享/收藏/历史、快捷键与命令面板）。

## 现状与技术栈
- 框架：Next.js 14（App Router）+ React 18 + TypeScript。
- 样式：TailwindCSS，已定义自定义动画与全局宇宙背景。
- 页面结构：`src/app/page.tsx` 左侧 `Sidebar` 输入控制，右侧 `Canvas` 展示（组件详见 `src/components/*`）。
- 后端接口：`/api/generate` 生成卡片与文案；`/api/export` 打包导出 ZIP。

## 视觉升级
- 全局主题与质感：
  - 玻璃拟态容器（毛玻璃+高斯模糊+渐变边框）。
  - 霓虹发光与动感渐变（多层阴影与色散光，渐变描边）。
  - 噪声/颗粒质感覆盖，提升现实感与层次。
  - 深色霓虹主题与浅色光泽主题可切换（`ThemeToggle`）。
- 背景层强化：
  - `CosmicBackground` 增加多层视差（恒星、极光、网格）与鼠标/滚动驱动的轻微位移。
  - 引入柔性光束与镜面高光（CSS mask + radial-gradient）。
- 布局与导航：
  - 顶栏 `Navbar`（Logo、主题切换、命令面板入口、快捷操作）。
  - 底部工具条（进度、导出、帮助）。

## 动效与微交互
- 引入 `framer-motion`（轻量、组合方便）：
  - 页面级过渡与首屏入场（淡入+缩放+轻微旋转）。
  - 组件级微交互：按钮按压回弹、分段控制器滑块弹簧、卡片悬浮浮动。
- 卡片 3D 交互：
  - `CardPreview` 加入 3D 倾斜与镜面高光（鼠标跟随），全屏查看带背景模糊与动效。
- 加载与反馈：
  - 统一 `OrbitLoader` 为多态加载器（粒子环/流光），状态切换具备过渡。
- 无障碍与可关闭动效：
  - `usePrefersReducedMotion`，为用户减少动效提供尊重选项。

## 功能增强
- 模板库与主题：
  - `TemplateGallery`：按风格/用途分类（极简/商务/科技/生活），带预览与说明。
  - 自定义主题色、品牌色与字体选择；模板与主题与生成参数联动。
- 导出增强：
  - 多尺寸导出（1:1、4:5、9:16），批量文件命名优化（含模型/模板/时间戳）。
  - 单张快速导出与复制到剪贴板；Web Share API 分享支持。
- 生成流程：
  - 批量生成（选择 N 个模板一次生成）；前端队列与进度条（分步骤显示）。
  - 生成历史与收藏（`localStorage` 持久），可一键复用。
- 轻量编辑器：
  - `CardEditor`：支持拖拽微调文案块位置、字号/行距、贴纸与图标叠加。
- 生产力增强：
  - 快捷键（`Cmd+Enter` 生成、`E` 编辑、`D` 下载、`/` 打开命令面板）。
  - 命令面板 `CommandPalette`（搜索操作：生成、导出、切换模板/主题）。
  - 通知系统 `Toast`（成功/失败/进度）。

## 技术改动与实现要点
- 依赖新增：
  - `framer-motion`（动效与过渡）。
  - `lucide-react`（高质量图标，用于导航/按钮/状态）。
- Tailwind 扩展：
  - `tailwind.config.ts` 增加阴影/光晕/渐变/动画（spring-like timing）。
  - 自定义工具类：渐变边框、玻璃拟态容器、噪声遮罩。
- API 扩展（向后兼容）：
  - `POST /api/generate` 支持 `template`、`theme`、`size` 可选参数，响应附带用于导出命名的元数据。
  - `POST /api/export` 支持多尺寸导出与更丰富命名。
- 组件新增：
  - `Navbar.tsx`、`ThemeToggle.tsx`、`CommandPalette.tsx`、`Toast.tsx`、`TemplateGallery.tsx`、`CardEditor.tsx`。
- 组件改造：
  - `Sidebar.tsx`：增加模板/主题/尺寸选择、批量生成入口、快捷键提示。
  - `Canvas.tsx`：支持队列与多尺寸预览、空状态与骨架屏。
  - `CardPreview.tsx`：3D 倾斜、镜面高光、全屏查看增强。
  - `GlowButton.tsx`：涟漪与霓虹态、加载过渡统一化。
  - `CosmicBackground.tsx`：多层视差与光束效果。
- Hooks：
  - `useHotkeys`、`useToasts`、`usePrefersReducedMotion`、`useParallax`。

## 文件级改动清单（示例）
- 修改：`src/app/page.tsx`、`src/components/Sidebar.tsx`、`src/components/Canvas.tsx`、`src/components/CardPreview.tsx`、`src/components/GlowButton.tsx`、`src/components/CosmicBackground.tsx`、`tailwind.config.ts`、`src/app/globals.css`。
- 新增：`src/components/Navbar.tsx`、`src/components/ThemeToggle.tsx`、`src/components/CommandPalette.tsx`、`src/components/Toast.tsx`、`src/components/TemplateGallery.tsx`、`src/components/CardEditor.tsx`、`src/hooks/*`。
- API：`src/app/api/generate/route.ts`、`src/app/api/export/route.ts` 向后兼容拓展参数与命名。

## 验证与质量保障
- 单元测试：核心逻辑与 hooks（Vitest）。
- 端到端：关键用户路径（Playwright）——生成、编辑、批量导出、分享。
- 性能监测：Lighthouse 指标与首屏渲染；动效降级策略（减少动效时关闭复杂动画）。
- 可用性：键盘导航、焦点可见性、ARIA 标记与无障碍检验。

## 迭代节奏
- 阶段 1（视觉与动效）：主题、背景、微交互与导航（约 1–2 天）。
- 阶段 2（功能）：模板库、多尺寸导出、命令面板与快捷键（约 1–2 天）。
- 阶段 3（编辑器与历史）：轻量编辑器、收藏/历史、分享（约 1–2 天）。

——请确认是否按该方案推进；确认后我将开始实现并逐步交付可验证的改动与预览。