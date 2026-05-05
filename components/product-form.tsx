"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";

type ProductFormProps = {
  action: (formData: FormData) => void;
  settings: {
    energyTariff: number;
    additionalFixedCostPercent: number;
  };
  materials: Array<{
    id: number;
    name: string;
    manufacturer: string | null;
    type: string | null;
    color: string | null;
    spoolWeightG: number;
    spoolValue: number;
  }>;
  printers: Array<{
    id: number;
    name: string;
    powerWatts: number;
    acquisitionCost: number;
    usefulLifeHours: number;
    monthlyMaintenance: number;
  }>;
  product?: {
    id: number;
    name: string;
    materialId: number;
    printerId: number;
    pieceWeightG: number;
    printTimeHours: number;
    extraSupplyCost: number;
    laborCost: number;
    failurePercent: number;
    profitMargin: number;
  };
};

export function ProductForm({ action, settings, materials, printers, product }: ProductFormProps) {
  const [materialId, setMaterialId] = useState(product?.materialId ?? materials[0]?.id ?? 0);
  const [printerId, setPrinterId] = useState(product?.printerId ?? printers[0]?.id ?? 0);
  const [pieceWeightG, setPieceWeightG] = useState(product?.pieceWeightG ?? 0);
  const [printTimeHours, setPrintTimeHours] = useState(product?.printTimeHours ?? 0);
  const [extraSupplyCost, setExtraSupplyCost] = useState(product?.extraSupplyCost ?? 0);
  const [laborCost, setLaborCost] = useState(product?.laborCost ?? 0);
  const [failurePercent, setFailurePercent] = useState(product?.failurePercent ?? 5);
  const [profitMargin, setProfitMargin] = useState(product?.profitMargin ?? 30);

  const preview = useMemo(() => {
    const material = materials.find((item) => item.id === materialId);
    const printer = printers.find((item) => item.id === printerId);
    if (!material || !printer) {
      return { totalCost: 0, suggestedPrice: 0 };
    }

    const materialGramCost = material.spoolWeightG > 0 ? material.spoolValue / material.spoolWeightG : 0;
    const materialCost = materialGramCost * pieceWeightG;
    const energyCost = (printer.powerWatts / 1000) * settings.energyTariff;
    const depreciation = printer.usefulLifeHours > 0 ? printer.acquisitionCost / printer.usefulLifeHours : 0;
    const maintenance = printer.monthlyMaintenance / 160;
    const printingCost = (energyCost + depreciation + maintenance) * printTimeHours;
    const subtotal = materialCost + printingCost + extraSupplyCost + laborCost;
    const withFixedCosts = subtotal + subtotal * (settings.additionalFixedCostPercent / 100);
    const totalCost = withFixedCosts * (1 + failurePercent / 100);
    const suggestedPrice = totalCost * (1 + profitMargin / 100);

    return { totalCost, suggestedPrice };
  }, [
    materialId,
    printerId,
    pieceWeightG,
    printTimeHours,
    extraSupplyCost,
    laborCost,
    failurePercent,
    profitMargin,
    materials,
    printers,
    settings,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Editar produto" : "Cadastrar produto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <FormField label="Nome do produto" name="name" defaultValue={product?.name} required />
          <div className="grid gap-2">
            <Label htmlFor="materialId">Filamento</Label>
            <Select
              id="materialId"
              name="materialId"
              value={materialId}
              onChange={(event) => setMaterialId(Number(event.target.value))}
              required
            >
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                  {[material.manufacturer, material.type, material.color].filter(Boolean).length
                    ? ` (${[material.manufacturer, material.type, material.color].filter(Boolean).join(" | ")})`
                    : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="printerId">Impressora</Label>
            <Select
              id="printerId"
              name="printerId"
              value={printerId}
              onChange={(event) => setPrinterId(Number(event.target.value))}
              required
            >
              {printers.map((printer) => (
                <option key={printer.id} value={printer.id}>
                  {printer.name}
                </option>
              ))}
            </Select>
          </div>
          <NumberField label="Peso da peca (g)" name="pieceWeightG" value={pieceWeightG} setValue={setPieceWeightG} />
          <NumberField label="Tempo de impressao (h)" name="printTimeHours" value={printTimeHours} setValue={setPrintTimeHours} />
          <NumberField label="Insumos extras (R$)" name="extraSupplyCost" value={extraSupplyCost} setValue={setExtraSupplyCost} />
          <NumberField label="Mao de obra (R$)" name="laborCost" value={laborCost} setValue={setLaborCost} />
          <NumberField label="% perda/falha" name="failurePercent" value={failurePercent} setValue={setFailurePercent} />
          <NumberField label="% margem de lucro" name="profitMargin" value={profitMargin} setValue={setProfitMargin} />
          <div className="rounded-md border bg-muted/40 p-4 md:col-span-2">
            <div className="text-sm text-muted-foreground">Previa de calculo</div>
            <div className="mt-1 text-lg font-semibold">
              Preco sugerido: {formatCurrency.format(preview.suggestedPrice)}
            </div>
            <div className="text-sm text-muted-foreground">Custo total: {formatCurrency.format(preview.totalCost)}</div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">{product ? "Atualizar produto" : "Salvar produto"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  name,
  value,
  setValue,
}: {
  label: string;
  name: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        type="number"
        step="0.01"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => setValue(Number(event.target.value))}
        required
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
