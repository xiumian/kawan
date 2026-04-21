import "dotenv/config";

import { ProductStatus, StockStatus } from "@prisma/client";

import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.callbackLog.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.paymentOrder.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const category = await prisma.category.create({
    data: {
      name: "数字卡密",
      slug: "digital-keys",
      sortOrder: 1,
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        categoryId: category.id,
        name: "Steam Wallet 100",
        slug: "steam-wallet-100",
        summary: "热门游戏礼品卡，支付后秒发卡密。",
        description:
          "适合补充 Steam 钱包余额，单次限购 3 张，支付成功后自动展示卡密。",
        price: 10000,
        status: ProductStatus.ACTIVE,
        purchaseLimitMin: 1,
        purchaseLimitMax: 3,
        stockWarningThreshold: 5,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: category.id,
        name: "Office 365 激活码",
        slug: "office-365-key",
        summary: "办公订阅激活码，适合个人和小团队。",
        description:
          "提供标准激活说明，推荐购买后尽快兑换，支持后台补单与异常追踪。",
        price: 23900,
        status: ProductStatus.ACTIVE,
        purchaseLimitMin: 1,
        purchaseLimitMax: 2,
        stockWarningThreshold: 3,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: category.id,
        name: "Spotify Premium 12M",
        slug: "spotify-premium-12m",
        summary: "长期会员兑换码，面向国际流媒体用户。",
        description:
          "自动发货，附带兑换说明，适合作为长期订阅型数字商品演示样本。",
        price: 15900,
        status: ProductStatus.ACTIVE,
        purchaseLimitMin: 1,
        purchaseLimitMax: 2,
        stockWarningThreshold: 4,
      },
    }),
  ]);

  const stockRows = products.flatMap((product, productIndex) =>
    Array.from({ length: 8 }).map((_, index) => ({
      productId: product.id,
      serialCode: `${product.slug.toUpperCase()}-${index + 1}`,
      secretCode: `CFP${productIndex + 1}${index + 1}X9${1000 + index}`,
      status: StockStatus.AVAILABLE,
      batchLabel: "INIT-20260418",
    })),
  );

  await prisma.stockItem.createMany({
    data: stockRows,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
