# 收入与成本模型

## 收入

- 指标：MRR/ARR、AOV、ARPU/ARPPU、复购率、退款率
- 维度：产品线/渠道/客户类型/地区/AB变体
- 事件：order_created、order_paid、refund；字段：amount、currency、plan、channel、campaign

## 成本

- 固定：人力、云资源、存储/带宽、工具订阅
- 可变：AI调用、图片转换、短信/邮件、支付通道费
- 事件映射：每次调用记录`unit_cost×qty=amount`

## 单客经济

- CAC=获客成本/新客数
- LTV=ARPU×生命周期（月）×毛利率
- 回本周期=CAC/每月毛利

## 目标

- LTV≥3×CAC；回本≤3个月；退款率≤2%；毛利率≥70%
