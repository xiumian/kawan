import { ProductStatus, StockStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatPriceCny } from "@/modules/site/brand-config";

export async function getStorefrontProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      stockItems: {
        some: {
          status: StockStatus.AVAILABLE,
        },
      },
    },
    include: {
      category: true,
      _count: {
        select: {
          stockItems: {
            where: {
              status: StockStatus.AVAILABLE,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return products.map(mapStorefrontProduct);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      _count: {
        select: {
          stockItems: {
            where: {
              status: StockStatus.AVAILABLE,
            },
          },
        },
      },
    },
  });

  if (!product || product.status !== ProductStatus.ACTIVE) {
    return null;
  }

  return mapStorefrontProduct(product);
}

export function mapStorefrontProduct(product: {
  id: string;
  name: string;
  slug: string;
  summary?: string;
  description?: string;
  price: number;
  isFeatured?: boolean;
  purchaseLimitMin?: number;
  purchaseLimitMax?: number;
  category?: { name: string; slug: string };
  _count: { stockItems: number };
}) {
  return {
    ...product,
    priceLabel: formatPriceCny(product.price),
    stockLabel: `库存 ${product._count.stockItems}`,
    availableStock: product._count.stockItems,
  };
}
