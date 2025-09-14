需求梳理
1. 产品定位与价值主张
🎯 产品核心定位
AI驱动的跨平台内容创作助手
专注解决内容创作者在公众号和小红书之间的内容适配问题，通过AI智能转换实现一键生成小红书爆款视觉卡片。
💎 核心价值主张
传统方式: 公众号文案 → 人工改写 → 设计软件制作 → 反复调整 → 发布
   耗时: 2-4小时    专业要求: 文案能力 + 设计能力

AI方式: 公众号文案 → AI智能转换 → 一键生成卡片 → 直接发布  
  耗时: 3分钟      专业要求: 零门槛
一句话价值：让每个内容创作者都能3分钟制作出小红书爆款卡片
🎪 解决的核心痛点
1️⃣ 效率痛点
- 现状：手动改写文案 + 设计制作，单次耗时2-4小时
- 解决：AI自动化处理，3分钟完成全流程
- 价值：效率提升40-80倍
2️⃣ 专业门槛痛点
- 现状：需要文案能力 + 设计能力双重技能
- 解决：AI承担专业工作，用户零门槛使用
- 价值：让非专业用户也能做出专业内容
3️⃣ 平台适配痛点
- 现状：公众号长文与小红书短卡片风格差异巨大
- 解决：AI深度理解两个平台特色，智能适配转换
- 价值：内容复用率提升，降低创作成本
4️⃣ 视觉设计痛点
- 现状：缺乏设计技能，制作的卡片不够吸引人
- 解决：AI生成符合小红书爆款特征的视觉设计
- 价值：内容传播效果显著提升

---
2. 目标用户群体分析
👥 主要用户画像
🎯 核心用户群：个人内容创作者
用户特征：
- 年龄：25-40岁
- 职业：自媒体博主、知识分享者、生活方式博主
- 平台分布：同时运营公众号和小红书
- 内容类型：干货分享、经验总结、生活记录
痛点需求：
- 希望在小红书扩大影响力，但不知道如何适配内容
- 有内容但缺乏视觉设计能力
- 时间有限，希望提高内容复用效率
- 希望内容更符合小红书用户喜好
使用场景：
- 公众号文章发布后，想要在小红书同步推广
- 有爆款内容，希望在小红书上获得更多曝光
- 参加小红书话题活动，需要快速制作卡片
📈 增长用户群：品牌营销人员
用户特征：
- 年龄：23-35岁  
- 职业：品牌方市场营销、代运营公司员工
- 需求：批量制作营销物料，提高投放效率
- 预算：有一定的工具采购预算
痛点需求：
- 需要大量制作小红书营销卡片
- 要求内容专业且符合品牌调性
🎨 潜在用户群：设计师和代运营
用户特征：
- 专业设计师寻求效率工具
- 代运营公司服务多个客户
- 需要标准化的制作流程
价值诉求：
- 提高制作效率，承接更多业务
- 保证输出质量的一致性
- 降低人力成本，提高利润率

---
3. 产品功能体系
- 核心创作功能
- 内容输入（文本编辑器）
- 智能优化（AI文案改写）
- 风格选择（多种预设）
- 卡片生成（AI视觉设计）
- 批量导出（多格式支持）
🎨 核心功能详解
1️⃣ 智能内容优化
功能价值：将公众号长文、短文、用户创意等一键生成小红书爆款卡片
- 输入：公众号文章、长文案、短文案、
- 处理：AI理解内容核心，提取关键信息
- 输出：符合小红书特色的爆款卡片

2️⃣ 多风格视觉设计
功能价值： 让非设计师也能制作专业卡片
设计原则：
- 符合小红书用户审美偏好
- 手机屏幕显示友好（3:4比例）
- 信息层级清晰，重点突出

3️⃣ 一键批量导出

 5.工作台UI大体设计
左边是操作侧边栏，右边是画布，用于展生成的小红书卡片

4. 技术设计与实现细节

## 4.1 MVP功能范围
### 核心功能
- ✅ 内容输入：手动复制公众号文章内容（限制2000字以内）
- ✅ AI模型选择：用户可选择DeepSeek或Nano Banana模型
- ✅ 卡片生成：根据内容自动生成多张小红书卡片
- ✅ 文案生成：同步生成小红书爆款文案
- ✅ 批量导出：一键下载所有生成的PNG图片

### 暂不包含功能（二期考虑）
- ❌ 用户注册登录系统
- ❌ 历史记录和收藏功能
- ❌ 使用次数限制或付费机制
- ❌ 公众号链接自动提取内容
- ❌ 自定义品牌元素（logo、色彩）
- ❌ 移动端响应式设计

## 4.2 技术架构设计
### 前端技术栈
- **框架**: Next.js 14 + React 18 + TypeScript
- **样式**: Tailwind CSS
- **图片处理**: Sharp库（SVG转PNG高质量输出）
- **状态管理**: React Hook（简单状态，无需Redux）

### 后端API设计
- **AI服务**: DeepSeek API + Nano Banana API
- **图片转换**: SVG到PNG转换服务
- **文件处理**: 批量打包下载功能

### 数据存储
- **环境配置**: Turso数据库（存储API密钥等配置）
- **临时文件**: 本地临时存储生成的图片

## 4.3 AI模型处理流程
### DeepSeek处理流程（两阶段prompt）
1. **阶段A**: 内容分析 → 输出结构化JSON（包含模板选择T1-T6、配色方案、内容布局）
2. **阶段B**: JSON数据 → 渲染SVG代码
3. **转换**: SVG → PNG（1080x1440像素，3:4比例）

### Nano Banana处理流程
1. **直接生成**: 文本内容 → base64编码图片数据
2. **解码保存**: base64 → PNG文件

### 模板系统（基于DeepSeek）
- **T1**: 大字钩子（强观点/短句）
- **T2**: 便签笔记（叙事/段落 + 荧光高亮）
- **T3**: 极简标题 + 线稿人设（清单/合集/人设）
- **T4**: 长文封面（插画区 + 字数/时长信息条）
- **T5**: 工具清单信息图（多分组表格/网格）
- **T6**: 手帐贴纸风（月报/成绩单/要点清单）

## 4.4 界面设计规范
### 布局结构
- **左侧操作栏**（宽度约30%）
  - 文本输入区域（支持最大2000字）
  - AI模型选择器（DeepSeek/Nano Banana）
  - 生成按钮
  - 批量导出按钮

- **右侧预览画布**（宽度约70%）
  - 卡片预览网格展示
  - 支持单张卡片放大查看
  - 显示生成的爆款文案

### 交互流程
1. 用户粘贴公众号内容
2. 选择AI模型
3. 点击生成按钮
4. 实时显示生成进度
5. 展示生成结果（多张卡片 + 文案）
6. 支持单张下载或批量打包下载

## 4.5 技术实现细节
### 卡片规格
- **输出尺寸**: 1080x1440像素（小红书标准3:4比例）
- **SVG渲染尺寸**: 1242x1656（按prompt设计文档）
- **图片格式**: PNG（高质量输出）
- **文件大小**: 优化压缩，保证清晰度

### API集成
#### DeepSeek API
- **请求地址**: 官方API endpoint
- **认证方式**: API Key认证
- **请求格式**: 标准OpenAI格式
- **处理逻辑**: 两阶段prompt调用

#### Nano Banana API
- **请求地址**: https://kg-api.cloud/v1/chat/completions
- **请求方式**: POST请求，遵循OpenAI格式
- **模型**: gemini-2.5-flash-image
- **返回格式**: base64编码图片

### 性能优化
- **并发处理**: 多张卡片并行生成
- **缓存策略**: 临时文件缓存，避免重复生成
- **错误处理**: 完善的重试机制和错误提示
- **加载状态**: 友好的加载动画和进度提示

技术栈
网站主框架：NextJS + React + TypeScript + Tailwind CSS

.env.local 文件
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://test-xiaogeaibreaker.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjIwNzM1Mzk2NjMsImlhdCI6MTc1NzIyOTI2MywiaWQiOiIxMjYxMDIxNS0wNzI1LTQ2MDYtYTYwNi01ZmI5MTM4OTFjOTEiLCJyaWQiOiJjYTk0YjhhNy04ODQ4LTRjN2MtYWNiOC1lZjMwNjU4M2FhZTcifQ.nDic9nnikV8ZLpRz_4CvMdx_8V1IY1WwuYnIsxsB5DzI6nIBUjc4e_qyDhaQG8jwXKtTr-zWopsvYOB277IgDg

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production

# Nano Banana AI Service Configuration  
APICORE_AI_KEY=sk-yUPD9rfqfCrhxVzwmadPNlR3dtQ67PqWshJVgYihz8EWWU8D

# DeepSeek AI Service Configuration  
DEEPSEEK_API_KEY=sk-e751f8274df146f48204ebcf73a8d7f6
Nano Banana 请求用法
请求地址：https://kg-api.cloud/v1/chat/completions
请求方式：遵循OpenAI请求方式，用post请求
请求示例：

{
  "model": "gemini-2.5-flash-image",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "请详细描述这张图片的内容，包括主体、背景和整体氛围。"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,{YOUR_BASE64_ENCODED_IMAGE_STRING}"
          }
        }
      ]
    }
  ]
}

返回示例：
{
    "id": "chatcmpl-89Dwc9w2gODZ0o23Vo7wZu7TFXV1W",
    "object": "chat.completion",
    "created": 1756644511,
    "model": "gemini-2.5-flash-image",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Here you go! \n!image"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 112,
        "completion_tokens": 40,
        "total_tokens": 152,
        "prompt_tokens_details": {
            "text_tokens": 105
        },
        "completion_tokens_details": {
            "content_tokens": 40
        }
    }
}


