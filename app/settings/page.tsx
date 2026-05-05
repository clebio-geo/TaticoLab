import { saveSettings } from "@/app/actions";
import { DatabaseRequired } from "@/components/database-required";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <>
        <PageHeader title="Configuracoes" description="Defina parametros globais usados nos calculos de preco." />
        <DatabaseRequired />
      </>
    );
  }

  const settings = await prisma.businessSettings.upsert({
    where: { id: 1 },
    create: { id: 1, energyTariff: 1.1, additionalFixedCostPercent: 10 },
    update: {},
  });

  return (
    <>
      <PageHeader title="Configuracoes" description="Defina parametros globais usados nos calculos de preco." />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Custos gerais</CardTitle>
          <CardDescription>Salvar recalcula os precos sugeridos dos produtos existentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSettings} className="grid gap-4">
            <FormField
              label="Tarifa de energia (R$/kWh)"
              name="energyTariff"
              type="number"
              step="0.0001"
              min={0}
              defaultValue={toNumber(settings.energyTariff)}
              required
            />
            <FormField
              label="Custos fixos adicionais (%)"
              name="additionalFixedCostPercent"
              type="number"
              step="0.01"
              min={0}
              defaultValue={toNumber(settings.additionalFixedCostPercent)}
              required
            />
            <Button type="submit">Salvar configuracoes</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
