import { z } from "zod";

export const createOrderSchema = z
  .object({
    productId: z.string().min(1, "商品不存在"),
    quantity: z.coerce.number().int().min(1).max(10),
    customerEmail: z.string().trim().email().optional().or(z.literal("")),
    customerPhone: z
      .string()
      .trim()
      .regex(/^1\d{10}$/, "手机号格式错误")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (!value.customerEmail && !value.customerPhone) {
      context.addIssue({
        code: "custom",
        message: "邮箱和手机号至少填写一项",
        path: ["customerEmail"],
      });
    }
  });

export const lookupOrderSchema = z.object({
  orderNo: z.string().trim().min(1, "订单号不能为空"),
  verification: z.string().trim().min(1, "请填写邮箱或手机号后四位"),
});

export const confirmMockPaymentSchema = z.object({
  paymentNo: z.string().trim().min(1, "支付单号不能为空"),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "用户名不能为空"),
  password: z.string().trim().min(1, "密码不能为空"),
});

export const stockImportSchema = z.object({
  productId: z.string().trim().min(1, "请选择商品"),
  batchLabel: z.string().trim().min(1, "请填写批次号"),
  content: z.string().trim().min(1, "库存内容不能为空"),
});
