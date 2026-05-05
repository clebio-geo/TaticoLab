import { MaterialCategory } from "@prisma/client";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteProduct, saveProduct } from "@/app/actions";
import { DatabaseRequired } from "@/components/database-required";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, toNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string; edit?: string }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  if (!hasDatabaseUrl()) {
    return (
      <>
        <PageHeader title="Produtos" description="Monte produtos, estime custos e salve o preco sugerido." />
        <DatabaseRequired />
      </>
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const editId = Number(params.edit);
  const [products, editingProduct, materials, printers, settings] = await Promise.all([
    prisma.product.findMany({
      where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
      include: {
        material: true,
        printer: true,
        _count: { select: { sales: true } },
      },
      orderBy: { id: "desc" },
    }),
    Number.isFinite(editId) && editId > 0 ? prisma.product.findUnique({ where: { id: editId } }) : null,
    prisma.material.findMany({
      where: { category: MaterialCategory.FILAMENT },
      orderBy: { name: "asc" },
    }),
    prisma.printer.findMany({ orderBy: { name: "asc" } }),
    prisma.businessSettings.upsert({
      where: { id: 1 },
      create: { id: 1, energyTariff: 1.1, additionalFixedCostPercent: 10 },
      update: {},
    }),
  ]);

  const materialOptions = materials.map((material) => ({
    id: material.id,
    name: material.name,
    manufacturer: material.manufacturer,
    type: material.type,
    color: material.color,
    spoolWeightG: toNumber(material.spoolWeightG),
    spoolValue: toNumber(material.spoolValue),
  }));
  const printerOptions = printers.map((printer) => ({
    id: printer.id,
    name: printer.name,
    powerWatts: toNumber(printer.powerWatts),
    acquisitionCost: toNumber(printer.acquisitionCost),
    usefulLifeHours: toNumber(printer.usefulLifeHours),
    monthlyMaintenance: toNumber(printer.monthlyMaintenance),
  }));
  const editable = editingProduct
    ? {
        id: editingProduct.id,
        name: editingProduct.name,
        materialId: editingProduct.materialId,
        printerId: editingProduct.printerId,
        pieceWeightG: toNumber(editingProduct.pieceWeightG),
        printTimeHours: toNumber(editingProduct.printTimeHours),
        extraSupplyCost: toNumber(editingProduct.extraSupplyCost),
        laborCost: toNumber(editingProduct.laborCost),
        failurePercent: toNumber(editingProduct.failurePercent),
        profitMargin: toNumber(editingProduct.profitMargin),
      }
    : undefined;

  return (
    <>
      <PageHeader title="Produtos" description="Monte produtos, estime custos e salve o preco sugerido." />
      <div className="grid gap-6 2xl:grid-cols-[560px_1fr]">
        {materialOptions.length && printerOptions.length ? (
          <ProductForm
            action={saveProduct}
            materials={materialOptions}
            printers={printerOptions}
            settings={{
              energyTariff: toNumber(settings.energyTariff),
              additionalFixedCostPercent: toNumber(settings.additionalFixedCostPercent),
            }}
            product={editable}
          />
        ) : (
          <EmptyState message="Cadastre ao menos um filamento e uma impressora antes de criar produtos." />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-4 flex gap-2">
              <Input name="q" defaultValue={query} placeholder="Buscar produto" />
              <Button type="submit" variant="outline">Buscar</Button>
            </form>
            {products.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Impressora</TableHead>
                    <TableHead>Preco</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead className="w-28">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.material.name}</TableCell>
                      <TableCell>{product.printer.name}</TableCell>
                      <TableCell>{formatCurrency.format(toNumber(product.suggestedPrice))}</TableCell>
                      <TableCell>{formatNumber.format(toNumber(product.pieceWeightG))} g</TableCell>
                      <TableCell>{formatNumber.format(toNumber(product.printTimeHours))} h</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild size="icon" variant="outline" title="Editar">
                            <Link href={`/products?edit=${product.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={product.id} />
                            <Button
                              type="submit"
                              size="icon"
                              variant="destructive"
                              title="Excluir"
                              disabled={product._count.sales > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState message="Nenhum produto cadastrado." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
