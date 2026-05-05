import { MaterialCategory } from "@prisma/client";
import { toNumber } from "@/lib/formatters";

export type PricingMaterial = {
  category: MaterialCategory;
  spoolWeightG: unknown;
  spoolValue: unknown;
};

export type PricingPrinter = {
  powerWatts: unknown;
  acquisitionCost: unknown;
  usefulLifeHours: unknown;
  monthlyMaintenance: unknown;
};

export type PricingSettings = {
  energyTariff: unknown;
  additionalFixedCostPercent: unknown;
};

export type ProductPricingInput = {
  material: PricingMaterial;
  printer: PricingPrinter;
  settings: PricingSettings;
  pieceWeightG: unknown;
  printTimeHours: unknown;
  extraSupplyCost: unknown;
  laborCost: unknown;
  failurePercent: unknown;
  profitMargin: unknown;
};

export type PricingResult = {
  materialCost: number;
  printingCost: number;
  fixedCost: number;
  subtotalBeforeFailure: number;
  totalCost: number;
  suggestedPrice: number;
};

export function getMaterialGramCost(material: PricingMaterial) {
  const spoolWeightG = toNumber(material.spoolWeightG);
  if (material.category !== MaterialCategory.FILAMENT || spoolWeightG <= 0) {
    return 0;
  }

  return toNumber(material.spoolValue) / spoolWeightG;
}

export function getPrinterHourlyCost(
  printer: PricingPrinter,
  settings: Pick<PricingSettings, "energyTariff">,
) {
  const energyPerHourKwh = toNumber(printer.powerWatts) / 1000;
  const energyCostPerHour = energyPerHourKwh * toNumber(settings.energyTariff);
  const usefulLifeHours = toNumber(printer.usefulLifeHours);
  const depreciationPerHour =
    usefulLifeHours > 0 ? toNumber(printer.acquisitionCost) / usefulLifeHours : 0;
  const maintenancePerHour = toNumber(printer.monthlyMaintenance) / 160;

  return energyCostPerHour + depreciationPerHour + maintenancePerHour;
}

export function calculateProductPricing(input: ProductPricingInput): PricingResult {
  const materialCost = getMaterialGramCost(input.material) * toNumber(input.pieceWeightG);
  const printingCost =
    getPrinterHourlyCost(input.printer, input.settings) * toNumber(input.printTimeHours);
  const subtotal =
    materialCost +
    printingCost +
    toNumber(input.extraSupplyCost) +
    toNumber(input.laborCost);
  const fixedCost = subtotal * (toNumber(input.settings.additionalFixedCostPercent) / 100);
  const subtotalBeforeFailure = subtotal + fixedCost;
  const totalCost = subtotalBeforeFailure * (1 + toNumber(input.failurePercent) / 100);
  const suggestedPrice = totalCost * (1 + toNumber(input.profitMargin) / 100);

  return {
    materialCost,
    printingCost,
    fixedCost,
    subtotalBeforeFailure,
    totalCost,
    suggestedPrice,
  };
}

export function calculateSaleSnapshot(quantity: number, unitSaleValue: number, unitProductionCost: number) {
  const totalValue = quantity * unitSaleValue;
  const totalProductionCost = quantity * unitProductionCost;

  return {
    totalValue,
    unitProductionCost,
    totalProductionCost,
    totalProfit: totalValue - totalProductionCost,
  };
}
