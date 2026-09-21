import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimeRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isRealCalendarDate(value: string): boolean {
  if (!isoDateRegex.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const isoDateSchema = z
  .string()
  .refine(isRealCalendarDate, "Date invalide (AAAA-MM-JJ)");

export const isoDateTimeSchema = z
  .string()
  .regex(isoDateTimeRegex, "Horodatage ISO invalide");

export const nonNegativeCentsSchema = z
  .number()
  .int("Le montant doit être un entier (cents)")
  .nonnegative("Le montant ne peut pas être négatif");

export const optionalEmailSchema = z.union([
  z.literal(""),
  z.email("Adresse e-mail invalide"),
]);

export const vendorStatusSchema = z.enum([
  "considering",
  "quoted",
  "booked",
  "paid",
  "declined",
]);

export const vendorCategorySchema = z.enum([
  "venue",
  "photographer",
  "videographer",
  "caterer",
  "florist",
  "music",
  "cake",
  "attire",
  "planner",
  "other",
]);

export const budgetCategorySchema = z.object({
  id: z.string().min(1),
  weddingId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  sortOrder: z.number().int(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const budgetItemSchema = z.object({
  id: z.string().min(1),
  weddingId: z.string().min(1),
  categoryId: z.string().min(1),
  vendorId: z.string().min(1).nullable(),
  name: z.string().trim().min(1).max(160),
  estimatedCents: nonNegativeCentsSchema,
  committedCents: nonNegativeCentsSchema,
  dueOn: isoDateSchema.nullable(),
  notes: z.string().max(2000),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const paymentSchema = z.object({
  id: z.string().min(1),
  weddingId: z.string().min(1),
  budgetItemId: z.string().min(1),
  amountCents: nonNegativeCentsSchema,
  dueOn: isoDateSchema.nullable(),
  paidOn: isoDateSchema.nullable(),
  label: z.string().trim().min(1).max(120),
  notes: z.string().max(2000),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const vendorSchema = z.object({
  id: z.string().min(1),
  weddingId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  category: vendorCategorySchema,
  status: vendorStatusSchema,
  quoteCents: nonNegativeCentsSchema.nullable(),
  depositCents: nonNegativeCentsSchema,
  notes: z.string().max(4000),
  website: z.string().max(500),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const vendorContactSchema = z.object({
  id: z.string().min(1),
  weddingId: z.string().min(1),
  vendorId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  role: z.string().max(120),
  email: optionalEmailSchema,
  phone: z.string().max(40),
  isPrimary: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const financeWorkspaceSchema = z.object({
  schemaVersion: z.literal(1),
  weddingId: z.string().min(1),
  currency: z.literal("CAD"),
  totalBudgetCents: nonNegativeCentsSchema,
  categories: z.array(budgetCategorySchema),
  items: z.array(budgetItemSchema),
  payments: z.array(paymentSchema),
  vendors: z.array(vendorSchema),
  contacts: z.array(vendorContactSchema),
  updatedAt: isoDateTimeSchema,
});

export type FinanceWorkspaceInput = z.infer<typeof financeWorkspaceSchema>;
