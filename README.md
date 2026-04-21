# chenfenpro

`chenfenpro` 是一个面向中国大陆首发的一期自营虚拟商品商城。当前实现聚焦 `卡密 / CDK 自动发货`，首页直接展示商品列表，详情页是实际下单入口，支持游客下单、可切换支付 provider、订单查询和后台库存管理。

## 当前能力

- 首页直接商品列表
- 商品详情页下单入口
- 游客下单
- 每单独立生成二维码支付会话
- `mockpay` 本地支付演示通道
- `easypay-compatible` 真实支付适配接口
- 支付后自动发货
- 订单查询
- 后台登录
- 后台库存导入与订单面板
- 上线前置检查脚本
- 健康检查与定时关单接口
- Docker / Docker Compose 部署资产

## 技术栈

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Prisma
- SQLite
- Vitest

> 当前仓库默认用 SQLite + `mockpay` 跑通本地真实流程。生产环境可以把支付 provider 切到 `easypay-compatible`，但你仍然需要自己的商户号、密钥和公网回调地址。

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 创建环境变量

```bash
copy .env.example .env
```

支付相关默认值：

- `PAYMENT_PROVIDER="mockpay"`：本地默认演示通道
- 要切真实通道时，改成 `easypay_compat`
- 同时填写 `EASYPAY_SUBMIT_URL`、`EASYPAY_PID`、`EASYPAY_KEY` 等参数

3. 初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. 启动开发环境

```bash
npm run dev
```

## 默认后台账号

- 用户名：`admin`
- 密码：`chenfenpro123`

生产前必须改掉以上默认值。

## 测试

```bash
npm run test
npm run lint
npm run launch:check
```

## 支付通道说明

- 开发环境默认使用 `mockpay`
- 生产环境可以切换到 `easypay-compatible`
- 异步回调入口默认是 `/api/payments/callback`
- 真正上线前必须准备：
  - 商户号
  - 商户密钥
  - 公网 HTTPS 域名
  - 回调地址配置

## 运行与运维接口

- `GET /api/health`
  返回应用存活状态和上线准备度
- `GET /api/health?strict=1`
  当存在上线阻塞项时返回 `503`
- `POST /api/ops/expire-orders`
  用于计划任务批量关闭超时未支付订单
  请求头必须带 `x-cron-token: <OPS_CRON_TOKEN>`

## 正式上线前检查

```bash
npm run launch:check
```

这条命令会直接检查：

- `NEXT_PUBLIC_SITE_URL` 是否为公网 HTTPS
- 后台账号和会话密钥是否仍是默认值
- 支付通道是否仍是 `mockpay`
- `easypay-compatible` 商户参数是否完整
- 是否配置了 `OPS_CRON_TOKEN`

## Docker 部署

仓库根目录已提供：

- `Dockerfile`
- `docker-compose.yml`

使用前先把 compose 里的示例环境变量改成你的真实值，然后执行：

```bash
docker compose up -d --build
```

当前 compose 会把 SQLite 数据持久化到命名卷，并在容器启动时自动执行 `npm run db:push`。
