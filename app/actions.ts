"use server";

import { MaterialCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateProductPricing, calculateSaleSnapshot } from "@/lib/pricing";
import { materialSchema, printerSchema, productSchema, saleSchema, settingsSchema } from "@/lib/validation";

function data(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function getSettings() {
  return prisma.businessSettings.upsert({
    where: { id: 1 },
    create: { id: 1, energyTariff: 1.1, additionalFixedCostPercent: 10 },
    update: {},
  });
}

async function getProductPricing(productId: number) {
  const [settings, product] = await Promise.all([
    getSettings(),
    prisma.product.findUnique({
      where: { id: productId },
      include: { material: true, printer: true },
    }),
  ]);

  if (!product) {
    throw new Error("Produto nao encontrado.");
  }

  return calculateProductPricing({
    material: product.material,
    printer: product.printer,
    settings,
    pieceWeightG: product.pieceWeightG,
    printTimeHours: product.printTimeHours,
    extraSupplyCost: product.extraSupplyCost,
    laborCost: product.laborCost,
    failurePercent: product.failurePercent,
    profitMargin: product.profitMargin,
  });
}

async function recalculateProduct(productId: number) {
  const pricing = await getProductPricing(productId);
  await prisma.product.update({
    where: { id: productId },
    data: { suggestedPrice: pricing.suggestedPrice },
  });
}

async function recalculateProducts(where: { materialId?: number; printerId?: number } = {}) {
  const products = await prisma.product.findMany({ where, select: { id: true } });
  for (const product of products) {
    await recalculateProduct(product.id);
  }
}

function refreshAll() {
  revalidatePath("/dashboard");
  revalidatePath("/printers");
  revalidatePath("/materials");
  revalidatePath("/products");
  revalidatePath("/sales");
  revalidatePath("/reports");
  revalidatePath("/settings");
}

export async function savePrinter(formData: FormData) {
  const parsed = printerSchema.parse(data(formData));
  const values = {
    name: parsed.name,
    powerWatts: parsed.powerWatts,
    acquisitionCost: parsed.acquisitionCost,
    usefulLifeHours: parsed.usefulLifeHours,
    monthlyMaintenance: parsed.monthlyMaintenance,
  };

  if (parsed.id) {
    await prisma.printer.update({ where: { id: parsed.id }, data: values });
    await recalculateProducts({ printerId: parsed.id });
  } else {
    await prisma.printer.create({ data: values });
  }

  refreshAll();
  redirect("/printers");
}

export async function deletePrinter(formData: FormData) {
  const id = Number(formData.get("id"));
  const linkedProducts = await prisma.product.count({ where: { printerId: id } });
  if (linkedProducts > 0) {
    throw new Error("Esta impressora esta vinculada a produtos.");
  }

  await prisma.printer.delete({ where: { id } });
  refreshAll();
  redirect("/printers");
}

export async function saveMaterial(formData: FormData) {
  const parsed = materialSchema.parse(data(formData));
  const isFilament = parsed.category === MaterialCategory.FILAMENT;
  const values = {
    name: parsed.name,
    category: parsed.category,
    manufacturer: isFilament ? parsed.manufacturer || null : null,
    type: isFilament ? parsed.type || null : null,
    color: isFilament ? parsed.color || null : null,
    spoolWeightG: isFilament ? parsed.spoolWeightG : 0,
    spoolValue: isFilament ? parsed.spoolValue : 0,
    unitCost: isFilament ? 0 : parsed.unitCost,
    unit: isFilament ? "g" : parsed.unit || null,
  };

  if (parsed.id) {
    await prisma.material.update({ where: { id: parsed.id }, data: values });
    await recalculateProducts({ materialId: parsed.id });
  } else {
    await prisma.material.create({ data: values });
  }

  refreshAll();
  redirect("/materials");
}

export async function deleteMaterial(formData: FormData) {
  const id = Number(formData.get("id"));
  const linkedProducts = await prisma.product.count({ where: { materialId: id } });
  if (linkedProducts > 0) {
    throw new Error("Este material esta vinculado a produtos.");
  }

  await prisma.material.delete({ where: { id } });
  refreshAll();
  redirect("/materials");
}

export async function saveProduct(formData: FormData) {
  const parsed = productSchema.parse(data(formData));
  const [settings, material, printer] = await Promise.all([
    getSettings(),
    prisma.material.findUnique({ where: { id: parsed.materialId } }),
    prisma.printer.findUnique({ where: { id: parsed.printerId } }),
  ]);

  if (!material || material.category !== MaterialCategory.FILAMENT) {
    throw new Error("Selecione um filamento valido.");
  }
  if (!printer) {
    throw new Error("Selecione uma impressora valida.");
  }

  const pricing = calculateProductPricing({
    material,
    printer,
    settings,
    pieceWeightG: parsed.pieceWeightG,
    printTimeHours: parsed.printTimeHours,
    extraSupplyCost: parsed.extraSupplyCost,
    laborCost: parsed.laborCost,
    failurePercent: parsed.failurePercent,
    profitMargin: parsed.profitMargin,
  });

  const values = {
    name: parsed.name,
    materialId: parsed.materialId,
    printerId: parsed.printerId,
    pieceWeightG: parsed.pieceWeightG,
    printTimeHours: parsed.printTimeHours,
    extraSupplyCost: parsed.extraSupplyCost,
    laborCost: parsed.laborCost,
    failurePercent: parsed.failurePercent,
    profitMargin: parsed.profitMargin,
    suggestedPrice: pricing.suggestedPrice,
  };

  if (parsed.id) {
    await prisma.product.update({ where: { id: parsed.id }, data: values });
  } else {
    await prisma.product.create({ data: values });
  }

  refreshAll();
  redirect("/products");
}

export async function deleteProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  const linkedSales = await prisma.sale.count({ where: { productId: id } });
  if (linkedSales > 0) {
    throw new Error("Este produto possui vendas registradas.");
  }

  await prisma.product.delete({ where: { id } });
  refreshAll();
  redirect("/products");
}

export async function saveSale(formData: FormData) {
  const parsed = saleSchema.parse(data(formData));
  const product = await prisma.product.findUnique({ where: { id: parsed.productId } });
  if (!product) {
    throw new Error("Produto nao encontrado.");
  }

  const pricing = await getProductPricing(product.id);
  const snapshot = calculateSaleSnapshot(parsed.quantity, parsed.unitSaleValue, pricing.totalCost);
  const values = {
    productId: parsed.productId,
    quantity: parsed.quantity,
    unitSaleValue: parsed.unitSaleValue,
    totalValue: snapshot.totalValue,
    unitProductionCost: snapshot.unitProductionCost,
    totalProductionCost: snapshot.totalProductionCost,
    totalProfit: snapshot.totalProfit,
  };

  if (parsed.id) {
    await prisma.sale.update({ where: { id: parsed.id }, data: values });
  } else {
    await prisma.sale.create({ data: values });
  }

  refreshAll();
  redirect("/sales");
}

export async function deleteSale(formData: FormData) {
  const id = Number(formData.get("id"));
  await prisma.sale.delete({ where: { id } });
  refreshAll();
  redirect("/sales");
}

export async function saveSettings(formData: FormData) {
  const parsed = settingsSchema.parse(data(formData));
  await prisma.businessSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      energyTariff: parsed.energyTariff,
      additionalFixedCostPercent: parsed.additionalFixedCostPercent,
    },
    update: {
      energyTariff: parsed.energyTariff,
      additionalFixedCostPercent: parsed.additionalFixedCostPercent,
    },
  });
  await recalculateProducts();
  refreshAll();
  redirect("/settings");
}
