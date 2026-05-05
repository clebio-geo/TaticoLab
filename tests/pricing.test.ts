import { MaterialCategory } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  calculateProductPricing,
  calculateSaleSnapshot,
  getMaterialGramCost,
  getPrinterHourlyCost,
} from "@/lib/pricing";

const material = {
  category: MaterialCategory.FILAMENT,
  spoolWeightG: 1000,
  spoolValue: 120,
};

const printer = {
  powerWatts: 200,
  acquisitionCost: 2000,
  usefulLifeHours: 4000,
  monthlyMaintenance: 80,
};

const settings = {
  energyTariff: 1.1,
  additionalFixedCostPercent: 10,
};

describe("pricing", () => {
  it("calculates filament gram cost", () => {
    expect(getMaterialGramCost(material)).toBeCloseTo(0.12);
  });

  it("returns zero gram cost for non-filament supplies", () => {
    expect(
      getMaterialGramCost({
        category: MaterialCategory.OTHER_SUPPLY,
        spoolWeightG: 1000,
        spoolValue: 120,
      }),
    ).toBe(0);
  });

  it("calculates printer hourly cost", () => {
    expect(getPrinterHourlyCost(printer, settings)).toBeCloseTo(1.22);
  });

  it("calculates suggested price with fixed costs, failure and margin", () => {
    const result = calculateProductPricing({
      material,
      printer,
      settings,
      pieceWeightG: 50,
      printTimeHours: 2,
      extraSupplyCost: 3,
      laborCost: 10,
      failurePercent: 5,
      profitMargin: 30,
    });

    expect(result.totalCost).toBeCloseTo(24.7632);
    expect(result.suggestedPrice).toBeCloseTo(32.19216);
  });

  it("calculates sale cost and profit snapshots", () => {
    expect(calculateSaleSnapshot(3, 50, 20)).toEqual({
      totalValue: 150,
      unitProductionCost: 20,
      totalProductionCost: 60,
      totalProfit: 90,
    });
  });
});
