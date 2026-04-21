# chenfenpro 上线前待办清单

更新时间：`2026-04-22`

这份清单对应当前仓库的真实状态，用来把项目从“本地可跑的 MVP”推进到“可上线的第一版”。

## P0：上线阻塞项

- [ ] 把 `NEXT_PUBLIC_SITE_URL` 改成公网 `HTTPS` 域名
- [ ] 替换 `ADMIN_USERNAME`
- [ ] 替换 `ADMIN_PASSWORD`
- [ ] 替换 `ADMIN_SESSION_SECRET`
- [ ] 把 `PAYMENT_PROVIDER` 从 `mockpay` 切到 `easypay_compat`
- [ ] 配置 `EASYPAY_SUBMIT_URL`
- [ ] 配置 `EASYPAY_PID`
- [ ] 配置 `EASYPAY_KEY`
- [ ] 确认支付网关回调地址指向 `/api/payments/callback`
- [ ] 配置 `OPS_CRON_TOKEN`
- [ ] 执行 `npm run launch:check`，结果必须无 `fail`

## P1：支付与交易联调

- [ ] 用真实商户参数创建一笔测试订单
- [ ] 确认结算页展示的二维码能正常拉起支付页
- [ ] 确认异步回调能命中 `/api/payments/callback`
- [ ] 确认验签通过后支付单状态更新为 `PAID`
- [ ] 确认订单状态推进到 `COMPLETED`
- [ ] 确认库存被正确扣减
- [ ] 确认查单页能看到已发货卡密
- [ ] 确认重复回调不会重复发货

## P1：部署与运维

- [ ] 选定生产部署方式：本机、云服务器或容器
- [ ] 确认生产数据库备份策略
- [ ] 确认日志保留位置与轮转方式
- [ ] 配置计划任务定时调用 `POST /api/ops/expire-orders`
- [ ] 验证 `GET /api/health` 与 `GET /api/health?strict=1`
- [ ] 确认站点启用 `HTTPS`

## P2：后台与运营补齐

- [ ] 补商品管理界面，而不只是库存导入
- [ ] 补支付配置管理界面
- [ ] 补站点设置界面
- [ ] 为异常订单补人工处理流程
- [ ] 明确低库存预警处理方式

## P2：工程化补齐

- [ ] 补更完整的端到端烟测，而不只是文档型 checklist
- [ ] 明确 SQLite 是否继续作为生产数据库，或升级到 MySQL
- [ ] 补基础限频能力：下单限频、查单限频
- [ ] 评估是否补 Redis / 队列支撑后续扩展

## 建议上线顺序

1. 先完成 `P0`，让 `launch:check` 通过
2. 再完成真实支付联调，验证完整交易闭环
3. 然后处理部署、备份和计划任务
4. 最后再补后台管理和工程化增强项
