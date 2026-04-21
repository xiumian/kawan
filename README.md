# chenfenpro

`chenfenpro` 是一个面向中国大陆首发的一期自营虚拟商品商城，当前聚焦 `卡密 / CDK 自动发货`。项目目标不是展示站，而是打通“浏览商品 -> 创建订单 -> 扫码支付 -> 自动发货 -> 查单”的最小真实交易闭环。

## 项目状态

当前仓库已经完成本地可跑通的 MVP：

- 首页直接展示可售商品列表
- 商品详情页承担真实下单入口
- 支持游客下单
- 为每笔订单生成独立支付会话和二维码
- 支持 `mockpay` 本地演示支付
- 支持 `easypay-compatible` 真实支付适配层
- 支付成功后自动发货
- 支持订单查询
- 提供后台登录、库存导入和订单面板
- 提供健康检查、上线检查和超时关单接口
- 提供 `Dockerfile` 与 `docker-compose.yml`

> 默认配置仍以本地演示环境为主：`SQLite + mockpay`。真正上线前仍需切换真实支付参数、HTTPS 域名和生产凭证。

## 技术栈

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Prisma
- SQLite
- Vitest

## 核心流程

1. 用户在首页直接浏览全部可售商品
2. 进入商品详情页提交数量和联系方式
3. 系统创建订单与支付单
4. 结算页展示本单专属二维码
5. 支付成功后触发回调验签
6. 系统自动锁定库存并发卡
7. 用户通过结算页或查单页查看发货结果

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 创建环境变量

```bash
copy .env.example .env
```

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

默认支付相关配置：

- `PAYMENT_PROVIDER="mockpay"`：本地默认演示通道
- 切换真实通道时改成 `easypay_compat`
- 同时填写 `EASYPAY_SUBMIT_URL`、`EASYPAY_PID`、`EASYPAY_KEY` 等参数

## 默认后台账号

- 用户名：`admin`
- 密码：`chenfenpro123`

生产前必须替换默认后台账号、密码和会话密钥。

## 验证命令

```bash
npm run test
npm run lint
npm run build
npm run launch:check
```

## 运行与运维接口

- `GET /api/health`
  返回应用存活状态和上线准备度
- `GET /api/health?strict=1`
  当存在上线阻塞项时返回 `503`
- `POST /api/ops/expire-orders`
  用于计划任务批量关闭超时未支付订单
  请求头必须带 `x-cron-token: <OPS_CRON_TOKEN>`

## 正式上线前仍缺什么

当前仓库还不能直接当生产环境启用，至少还要补齐：

- `NEXT_PUBLIC_SITE_URL` 改成公网 HTTPS 域名
- 替换后台默认账号、密码和 `ADMIN_SESSION_SECRET`
- 把支付通道从 `mockpay` 切到 `easypay-compatible`
- 配齐 `EASYPAY_*` 商户参数
- 配置 `OPS_CRON_TOKEN`

详细清单见 [docs/launch/2026-04-22-go-live-checklist.md](docs/launch/2026-04-22-go-live-checklist.md)。

## Docker 部署

仓库根目录已提供：

- `Dockerfile`
- `docker-compose.yml`

使用前先把 compose 里的示例环境变量改成真实值，然后执行：

```bash
docker compose up -d --build
```

当前 compose 会把 SQLite 数据持久化到命名卷，并在容器启动时自动执行 `npm run db:push`。
