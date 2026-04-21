# chenfenpro Payment Provider Design

## Goal

把当前写死在订单仓储里的 `mockpay` 演示支付链，升级成可切换的支付 provider 架构，并先落一版可接真实通道的 `easypay-compatible` 适配器。目标不是一次做多通道后台，而是把真实上线需要的支付创建、异步回调、验签、幂等和结算页展示路径补齐，同时保留本地可跑的 `mockpay`。

## Scope

本次只覆盖支付适配层和其直接依赖：

- 订单创建时选择和创建支付会话
- 结算页按支付单展示二维码/跳转入口
- `mockpay` 本地确认页继续可用
- 新增 `easypay-compatible` 真实通道适配器
- 异步回调路由从占位 `501` 改成真实验签处理
- `.env` / README / smoke checklist 同步到可上线准备状态

本次不做：

- 后台支付配置管理页面
- 多通道动态切换 UI
- 退款、关单同步、补单后台
- 复杂风控或对账系统

## Current Problem

当前实现把支付逻辑直接写进了 `order.repository.ts`：

- 下单时固定生成 `mockpay` 的 `paymentUrl`
- `PaymentProvider` 枚举只有 `MOCKPAY`
- 结算页直接调用 `buildMockPaymentQr(paymentNo)`
- 回调路由还是 `501`

这意味着一旦接真实通道，订单层、结算页、回调层都要一起改，而且 provider 语义会继续污染业务层。

## Recommended Approach

采用“订单主链保持不动，支付能力下沉到 provider 适配层”的方式：

1. 订单创建继续负责商品校验、库存校验、订单落库
2. 支付会话创建委托给统一 payment service
3. payment service 根据配置选择 provider
4. provider 负责生成 `paymentUrl`、支付单原始报文、回调验签和回调归一化
5. 回调路由只做：
   - 读取原始参数
   - 根据 provider 验签
   - 幂等推进支付状态
   - 驱动原有发货逻辑

这样做的好处是：业务订单、发货、查单不再知道“某个具体支付通道怎么签名”，后续换 provider 只换适配器。

## Provider Model

本次保留两个 provider：

- `MOCKPAY`
  - 默认开发环境 provider
  - 本地二维码和确认页仍可用
  - 不走公网回调
- `EASYPAY_COMPAT`
  - 面向易支付兼容网关
  - 通过配置项拼接支付发起 URL
  - 使用网关回调参数做签名校验

`EASYPAY_COMPAT` 采用“兼容型”命名而不是绑定某个具体站点，是因为这类网关字段和签名习惯高度相似，但域名和商户参数由部署环境决定。

## Data Model Changes

在不打断现有数据库模型的前提下补最少字段：

- `PaymentProvider` 枚举新增 `EASYPAY_COMPAT`
- `PaymentOrder` 新增：
  - `providerTradeNo String?`
    - 保存上游返回或回调中的平台交易号
  - `providerMerchantId String?`
    - 保存本次支付使用的商户号快照，便于排查和审计

现有字段继续沿用：

- `paymentNo`
  - 作为本系统内部支付单号，同时也可作为外部 `out_trade_no`
- `paymentUrl`
  - 结算页和扫码跳转统一使用
- `rawCreateResponse`
  - 保存创建会话原始数据
- `rawCallbackPayload`
  - 保存回调原始报文
- `callbackVerified`
  - 保存验签结果

## Payment Service Boundary

新增统一 payment service，负责以下职责：

- 读取当前启用 provider
- 创建支付会话
- 为结算页生成二维码数据
- 解析并校验异步回调
- 产出归一化回调结果

统一输出结构：

- `provider`
- `paymentUrl`
- `paymentNo`
- `providerTradeNo?`
- `providerMerchantId?`
- `rawCreateResponse?`

统一回调归一化结构：

- `paymentNo`
- `provider`
- `providerTradeNo?`
- `verified`
- `paid`
- `rawPayload`

## Checkout Flow

结算页不再写死 `mockpay` 二维码逻辑，而是改成：

1. 读取订单最新支付单
2. 从支付单中拿到 `paymentUrl`
3. 统一生成二维码图片
4. 同时展示“打开支付页”入口

这样：

- `mockpay` 的二维码仍然指向本地确认页
- `EASYPAY_COMPAT` 的二维码则指向真实网关支付页

结算组件继续轮询订单状态，不感知具体 provider。

## Easypay-Compatible Flow

支付发起：

1. 创建订单后生成内部 `paymentNo`
2. 适配器按网关要求构造请求参数
3. 使用配置中的密钥生成签名
4. 拼接出可访问的支付页 URL
5. 保存原始创建报文和支付 URL

异步回调：

1. 网关回调 `/api/payments/callback`
2. 服务端读取原始参数
3. 校验 `out_trade_no`、金额、商户号和签名
4. 仅当支付成功且未处理过时推进支付单为 `PAID`
5. 调用现有发货逻辑
6. 返回网关要求的成功响应文本

幂等：

- 如果支付单已经是 `PAID`，重复回调只记录日志并返回成功
- 如果验签失败，记录日志并返回失败

## Configuration

新增环境变量分两层：

公共支付配置：

- `PAYMENT_PROVIDER`
  - `mockpay` 或 `easypay_compat`
- `PAYMENT_NOTIFY_PATH`
  - 默认 `/api/payments/callback`

易支付兼容配置：

- `EASYPAY_SUBMIT_URL`
- `EASYPAY_PID`
- `EASYPAY_KEY`
- `EASYPAY_SIGN_TYPE`
- `EASYPAY_RETURN_URL`
- `EASYPAY_NOTIFY_URL`
- `EASYPAY_PAYMENT_TYPE`

默认开发环境仍走 `mockpay`，只有显式改环境变量才启用真实 provider。

## Error Handling

需要明确处理这些失败路径：

- provider 配置缺失
  - 下单返回“支付通道配置不完整”
- 创建支付 URL 失败
  - 订单进入可追踪失败状态并返回错误
- 回调验签失败
  - 不推进订单，只记日志
- 回调金额不一致
  - 不推进订单，只记日志
- 回调成功但发货失败
  - 订单进入 `EXCEPTION`

## Testing Strategy

最少覆盖这些测试：

- `easypay-compatible` 签名生成
- `easypay-compatible` 验签成功/失败
- provider 选择逻辑
- 统一二维码生成逻辑
- 回调归一化与幂等推进
- 现有 `mockpay` 路径不回归

最终还要保留一条烟测：

- 创建订单
- 进入 checkout
- 走支付确认
- 查单拿到卡密

## Launch Boundary

做到这里后，代码层面将具备真实上线能力，但真正上线仍需要外部条件：

- 可用的易支付兼容商户账号
- 正确的商户号和密钥
- 公网 HTTPS 域名
- 网关白名单和回调地址配置
- 生产数据库和备份

也就是说，本次会把“代码和集成位”做到可上线，而不是替你生成第三方商户资质。
