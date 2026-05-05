"use client";

import { useState } from "react";
import { MaterialCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type MaterialFormProps = {
  action: (formData: FormData) => void;
  material?: {
    id: number;
    name: string;
    category: MaterialCategory;
    manufacturer: string | null;
    type: string | null;
    color: string | null;
    spoolWeightG: number;
    spoolValue: number;
    unitCost: number;
    unit: string | null;
  };
};

export function MaterialForm({ action, material }: MaterialFormProps) {
  const [category, setCategory] = useState<MaterialCategory>(material?.category ?? MaterialCategory.FILAMENT);
  const isFilament = category === MaterialCategory.FILAMENT;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{material ? "Editar material" : "Cadastrar material"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {material ? <input type="hidden" name="id" value={material.id} /> : null}
          <FormField label="Nome" name="name" defaultValue={material?.name} required />
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              id="category"
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value as MaterialCategory)}
            >
              <option value={MaterialCategory.FILAMENT}>Filamentos</option>
              <option value={MaterialCategory.OTHER_SUPPLY}>Outros Insumos</option>
            </Select>
          </div>

          {isFilament ? (
            <>
              <FormField label="Fabricante" name="manufacturer" defaultValue={material?.manufacturer ?? ""} />
              <FormField label="Tipo" name="type" defaultValue={material?.type ?? ""} />
              <FormField label="Cor" name="color" defaultValue={material?.color ?? ""} />
              <FormField
                label="Peso do rolo (g)"
                name="spoolWeightG"
                type="number"
                step="0.01"
                min={0}
                defaultValue={material?.spoolWeightG ?? 0}
                required
              />
              <FormField
                label="Valor do rolo (R$)"
                name="spoolValue"
                type="number"
                step="0.01"
                min={0}
                defaultValue={material?.spoolValue ?? 0}
                required
              />
              <input type="hidden" name="unitCost" value="0" />
              <input type="hidden" name="unit" value="g" />
            </>
          ) : (
            <>
              <input type="hidden" name="manufacturer" value="" />
              <input type="hidden" name="type" value="" />
              <input type="hidden" name="color" value="" />
              <input type="hidden" name="spoolWeightG" value="0" />
              <input type="hidden" name="spoolValue" value="0" />
              <FormField
                label="Custo unitario (R$)"
                name="unitCost"
                type="number"
                step="0.01"
                min={0}
                defaultValue={material?.unitCost ?? 0}
                required
              />
              <FormField label="Unidade" name="unit" defaultValue={material?.unit ?? ""} required />
            </>
          )}

          <div className="md:col-span-2">
            <Button type="submit">{material ? "Atualizar material" : "Salvar material"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
