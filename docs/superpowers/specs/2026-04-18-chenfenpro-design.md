# chenfenpro Design Spec

**Date:** 2026-04-18
**Status:** Approved for implementation
**Project Type:** 自营虚拟商品综合商城（一期聚焦卡密/CDK 自动发货）

## 1. Product Goal

`chenfenpro` 是一个面向中国大陆用户首发的自营虚拟商品商城。一期只提供 `卡密 / CDK` 类商品，支持游客下单、动态订单二维码支付、支付成功后自动发货、订单查询和后台运营管理。

目标不是做展示站，而是做一个可真实上线、可持续运营、后续可扩展到更多虚拟商品类型的交易闭环。前台入口以“进站即选商品”为第一原则：首页直接展示全部可售商品，详情页承担真实下单职责。

## 2. Confirmed Scope

### In Scope

- 中国大陆首发
- 自营商城
- 卡密 / CDK 商品
- 游客下单
- 第三方支付通道生成本单专属动态二维码
- 支付回调后自动发卡
- 订单查询
- 后台商品、库存、订单、支付配置管理
- 最小风控、幂等和异常处理
- 品牌名固定为 `chenfenpro`
- 前台改版为 `轻首页 + 商品列表主导`
- 首页展示 `全部上架且有库存的商品`
- 首页保留极薄头部：`chenfenpro`、`查单`、`后台`
- 商品详情页作为真实下单页
- 简约现代科技风视觉方向，但收缩为偏商城实用风格

### Out of Scope

- 商户入驻
- 代理分销
- 多币种、多区域站点
- 账号商品、代充商品、人工处理流
- 自动退款接口
- 平台级权限体系
- 多支付通道路由

## 3. Architecture

一期采用 `Next.js 全栈单体 + MySQL + Redis` 的部署模式。对外是单站点应用，对内按业务模块拆分：

- `前台商城模块`
- `订单模块`
- `支付适配模块`
- `发卡模块`
- `后台运营模块`
- `风控与通知模块`

部署形态保持单体，业务边界保持清晰，避免后续二期开新功能时核心交易链路重写。

## 4. Frontend Information Architecture

### Public Pages

- `首页`
  极轻入口页。头部下方直接展示商品列表，不再承担品牌宣传、流程介绍或大段说明职责。
- `商品列表`
  与首页合并。首页默认展示全部上架且有库存的商品，不再单独做精选区、推荐区或首页主推区。
- `商品详情页`
  真实下单页。展示商品名称、简介、价格、库存、购买限制、购买须知和下单表单。
- `收银台 / 支付页`
  展示订单信息、本单专属二维码、支付倒计时和支付状态。
- `订单查询页`
  通过订单号与验证信息查询订单和卡密内容。
- `帮助中心页`
  保留为售后与规则说明页，但不在首页主流程中强调。

### Admin Pages

- `后台登录页`
- `仪表盘`
- `商品管理`
- `库存管理`
- `订单管理`
- `支付配置`
- `站点设置`

## 5. Brand and Visual Direction

站点名称为 `chenfenpro`。视觉方向采用“收缩后的简约现代科技风”，重点是商城可用性，而不是展示型首屏：

- 主色调：石墨黑 / 冷灰 / 冷白
- 强调色：青蓝或电光青，用于操作焦点和状态强调
- 版式：紧凑、直接、以商品列表为中心
- 首页：仅保留薄头部、短标题和商品列表，不做大 Hero
- 商品卡：标准商城卡片，不做厚重玻璃感和长叙事区
- 详情页：商品信息与下单框并列，下单框是视觉重点
- 背景：可保留弱纹理或轻渐变，但不得压过商品信息
- 后台：偏效率型控制台风格，优先信息密度和可操作性

## 5.1 Storefront Simplification Rules

本次前台改版的强约束如下：

- 首页删除大 Hero、大标题叙事块、指标卡、购买流程三栏、运营说明区。
- 首页只保留一个很短的页头，例如 `商品列表` 与一句发货说明。
- 顶部导航只保留：
  - `chenfenpro` 站名
  - `查单`
  - `后台`
- 顶部不单独保留 `首页` 链接，点击站名回首页即可。
- 首页商品卡片必须包含：
  - 商品图或占位图
  - 商品名称
  - 一句简介
  - 价格
  - 库存
  - `查看详情` 按钮
- 首页不直接放下单表单，不做展开购买，不做复杂筛选。
- 页脚缩减到最小，只保留版权或极短信息，不重复头部导航。

## 6. Data Model

### Category

- `id`
- `name`
- `slug`
- `sortOrder`
- `isActive`

### Product

- `id`
- `categoryId`
- `name`
- `slug`
- `summary`
- `description`
- `coverImage`
- `price`
- `status`
- `stockWarningThreshold`
- `purchaseLimitMin`
- `purchaseLimitMax`
- `deliveryType` 固定为 `AUTO_KEY`
- `isFeatured`
- `coverImage` 前台允许为空；为空时首页使用统一占位图

### StockItem

- `id`
- `productId`
- `serialCode`
- `secretCode`
- `status`：`AVAILABLE | LOCKED | SOLD | INVALID`
- `batchLabel`
- `soldAt`
- `orderId`

### Order

- `id`
- `orderNo`
- `productId`
- `quantity`
- `amount`
- `currency`
- `customerEmail`
- `customerPhone`
- `status`
- `expiresAt`
- `paidAt`
- `completedAt`
- `cancelledAt`
- `failureReason`

### PaymentOrder

- `id`
- `orderId`
- `provider`
- `providerOrderNo`
- `qrCodeUrl`
- `paymentUrl`
- `amount`
- `status`
- `rawCreateResponse`
- `rawCallbackPayload`
- `callbackVerified`
- `paidAt`

### Delivery

- `id`
- `orderId`
- `deliveryCode`
- `status`
- `deliveredAt`
- `payloadSnapshot`

### CallbackLog

- `id`
- `paymentOrderId`
- `provider`
- `payload`
- `verified`
- `processed`
- `result`
- `createdAt`

### AdminUser

- `id`
- `username`
- `passwordHash`
- `role`
- `lastLoginAt`

### AuditLog

- `id`
- `adminUserId`
- `action`
- `targetType`
- `targetId`
- `detail`
- `createdAt`

## 7. Order State Machine

订单状态固定为：

- `PENDING_PAYMENT`
- `PAYMENT_PROCESSING`
- `PAID_PENDING_DELIVERY`
- `COMPLETED`
- `CANCELLED`
- `EXCEPTION`

支付状态固定为：

- `CREATED`
- `WAITING`
- `PAID`
- `FAILED`
- `EXPIRED`

库存状态固定为：

- `AVAILABLE`
- `LOCKED`
- `SOLD`
- `INVALID`

## 8. Core Transaction Flow

1. 用户在首页浏览全部可售商品。
2. 用户点击 `查看详情` 进入商品详情页。
3. 用户在商品详情页提交购买数量与联系方式。
4. 系统校验商品可售、数量范围和基础限频。
5. 系统创建 `Order` 与 `PaymentOrder`。
6. 支付适配模块向第三方通道申请本单二维码。
7. 前端收银台展示二维码并轮询订单状态。
8. 第三方支付成功后回调服务端。
9. 服务端验签、记录回调日志、执行幂等保护。
10. 订单进入 `PAID_PENDING_DELIVERY`。
11. 发卡模块在事务中锁定对应数量库存，写入 `Delivery`。
12. 发货成功后订单进入 `COMPLETED`。
13. 用户通过支付页跳转或订单查询页查看已发卡密。

## 9. Error Handling and Recovery

- 重复回调只处理一次，其余仅记日志。
- 支付超时自动关闭订单并更新支付状态。
- 发卡事务失败时订单进入 `EXCEPTION`，后台可手动补发。
- 任何情况下不允许同一库存重复出售。
- 查单接口需限频，避免撞库和穷举订单号。

## 10. Risk Control

- IP / 邮箱 / 手机号维度的下单限频
- 查单接口限频
- 管理后台强制鉴权
- 支付回调签名校验
- 幂等键保护
- 订单过期自动任务
- 低库存预警
- 后台关键操作审计

## 11. Real-World Deployment Constraints

- 个人主体首发，不假设企业直连官方支付接口。
- 动态二维码依赖第三方收款服务，但系统必须抽象支付适配层，便于未来替换。
- 必须具备域名、备案、HTTPS、日志和数据备份能力。
- 商品和文案需保持合规，避免高风险灰产表达。
- 已自动发货的卡密商品原则上不支持无理由退款，但系统需支持异常单人工处理。

## 12. Initial Technical Stack

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `Prisma`
- `MySQL`
- `Redis`
- `Zod`
- `BullMQ` 或等价异步任务方案

## 13. Project Structure

- `src/app`：页面与路由
- `src/modules/catalog`：商品展示逻辑
- `src/modules/order`：下单、状态、查单
- `src/modules/payment`：支付创建与回调
- `src/modules/delivery`：自动发卡
- `src/modules/admin`：后台管理
- `src/modules/risk`：限流与风控
- `src/lib`：数据库、Redis、日志、通用方法
- `prisma`：数据模型与迁移

## 14. Implementation Milestones

### Milestone 1

完成前台改版：首页变为轻入口商品列表页，详情页收缩为高转化下单页。

### Milestone 2

完成数据库建模、种子数据和前后台读写。

### Milestone 3

完成下单、支付创建、支付状态轮询、订单查询。

### Milestone 4

完成回调验签、自动发卡、后台订单和库存管理。

### Milestone 5

补齐限流、异常处理、审计、部署配置和文档。

## 15. Acceptance Criteria

- 用户打开首页即可看到全部在售商品
- 用户可从首页进入详情页并创建订单
- 支付页可展示本单二维码与倒计时
- 系统可模拟或接入真实支付回调并完成自动发卡
- 用户可查询订单并查看发货结果
- 后台可管理商品、库存和订单
- 回调具备验签、幂等和日志记录
- 项目具备基础部署能力和环境变量配置
