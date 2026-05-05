import { MaterialCategory } from "@prisma/client";
import { z } from "zod";

const requiredText = z.string().trim().min(1, "Campo obrigatorio.");
const positiveNumber = z.coerce.number().positive("Informe um valor maior que zero.");
const nonNegativeNumber = z.coerce.number().min(0, "Informe um valor maior ou igual a zero.");

export const printerSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: requiredText,
  powerWatts: positiveNumber,
  acquisitionCost: nonNegativeNumber,
  usefulLifeHours: nonNegativeNumber,
  monthlyMaintenance: nonNegativeNumber,
});

export const materialSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    name: requiredText,
    category: z.nativeEnum(MaterialCategory),
    manufacturer: z.string().trim().optional(),
    type: z.string().trim().optional(),
    color: z.string().trim().optional(),
    spoolWeightG: z.coerce.number().default(0),
    spoolValue: z.coerce.number().default(0),
    unitCost: z.coerce.number().default(0),
    unit: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.category === MaterialCategory.FILAMENT) {
      if (value.spoolWeightG <= 0) {
        ctx.addIssue({ code: "custom", path: ["spoolWeightG"], message: "Informe o peso do rolo." });
      }
      if (value.spoolValue <= 0) {
        ctx.addIssue({ code: "custom", path: ["spoolValue"], message: "Informe o valor do rolo." });
      }
    } else {
      if (value.unitCost <= 0) {
        ctx.addIssue({ code: "custom", path: ["unitCost"], message: "Informe o custo unitario." });
      }
      if (!value.unit) {
        ctx.addIssue({ code: "custom", path: ["unit"], message: "Informe a unidade." });
      }
    }
  });

export const productSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: requiredText,
  materialId: z.coerce.number().int().positive("Selecione um filamento."),
  printerId: z.coerce.number().int().positive("Selecione uma impressora."),
  pieceWeightG: positiveNumber,
  printTimeHours: positiveNumber,
  extraSupplyCost: nonNegativeNumber,
  laborCost: nonNegativeNumber,
  failurePercent: nonNegativeNumber,
  profitMargin: nonNegativeNumber,
});

export const saleSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive("Selecione um produto."),
  quantity: z.coerce.number().int().positive("Informe uma quantidade maior que zero."),
  unitSaleValue: positiveNumber,
});

export const settingsSchema = z.object({
  energyTariff: positiveNumber,
  additionalFixedCostPercent: nonNegativeNumber,
});
