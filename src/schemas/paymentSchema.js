const { z } = require("zod");

const amountSchema = z.preprocess((value) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return value;
}, z.number().positive("Amount must be greater than 0"));

const initializeCardPaymentSchema = z.object({
  email: z.string().trim().email("Provide a valid email"),
  amount: amountSchema,
  currency: z.string().trim().toUpperCase().optional().default("NGN"),
  callbackUrl: z.string().trim().url("Callback URL must be a valid URL").optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  questionnaireId: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});

const initializeTransferPaymentSchema = z.object({
  email: z.string().trim().email("Provide a valid email"),
  amount: amountSchema,
  currency: z.string().trim().toUpperCase().optional().default("NGN"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().optional(),
  preferredBank: z.string().trim().optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  questionnaireId: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});

const referenceParamsSchema = z.object({
  reference: z.string().trim().min(3, "Reference is required"),
});

module.exports = {
  initializeCardPaymentSchema,
  initializeTransferPaymentSchema,
  referenceParamsSchema,
};
