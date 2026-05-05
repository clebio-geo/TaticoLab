import { MaterialCategory } from "@prisma/client";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteMaterial, saveMaterial } from "@/app/actions";
import { DatabaseRequired } from "@/components/database-required";
import { EmptyState } from "@/components/empty-state";
import { MaterialForm } from "@/components/material-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, toNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string; edit?: string }>;
};

export default async function MaterialsPage({ searchParams }: PageProps) {
  if (!hasDatabaseUrl()) {
    return (
      <>
        <PageHeader title="Materiais" description="Gerencie filamentos e outros insumos do laboratorio." />
        <DatabaseRequired />
      </>
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const editId = Number(params.edit);
  const [materials, editingMaterial] = await Promise.all([
    prisma.material.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { manufacturer: { contains: query, mode: "insensitive" } },
              { type: { contains: query, mode: "insensitive" } },
              { color: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { _count: { select: { products: true } } },
      orderBy: { id: "desc" },
    }),
    Number.isFinite(editId) && editId > 0 ? prisma.material.findUnique({ where: { id: editId } }) : null,
  ]);

  const editable = editingMaterial
    ? {
        ...editingMaterial,
        spoolWeightG: toNumber(editingMaterial.spoolWeightG),
        spoolValue: toNumber(editingMaterial.spoolValue),
        unitCost: toNumber(editingMaterial.unitCost),
      }
    : undefined;

  return (
    <>
      <PageHeader title="Materiais" description="Gerencie filamentos e outros insumos do laboratorio." />
      <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
        <MaterialForm action={saveMaterial} material={editable} />

        <Card>
          <CardHeader>
            <CardTitle>Lista de materiais</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-4 flex gap-2">
              <Input name="q" defaultValue={query} placeholder="Buscar material" />
              <Button type="submit" variant="outline">Buscar</Button>
            </form>
            {materials.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="w-28">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => {
                    const isFilament = material.category === MaterialCategory.FILAMENT;
                    const unitCost = isFilament
                      ? toNumber(material.spoolWeightG) > 0
                        ? toNumber(material.spoolValue) / toNumber(material.spoolWeightG)
                        : 0
                      : toNumber(material.unitCost);
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>
                          <Badge>{isFilament ? "Filamentos" : "Outros Insumos"}</Badge>
                        </TableCell>
                        <TableCell>
                          {[material.manufacturer, material.type, material.color].filter(Boolean).join(" | ") || "-"}
                        </TableCell>
                        <TableCell>
                          {isFilament
                            ? `${formatCurrency.format(unitCost)}/g`
                            : `${formatCurrency.format(unitCost)}/${material.unit ?? "un"}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button asChild size="icon" variant="outline" title="Editar">
                              <Link href={`/materials?edit=${material.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <form action={deleteMaterial}>
                              <input type="hidden" name="id" value={material.id} />
                              <Button
                                type="submit"
                                size="icon"
                                variant="destructive"
                                title="Excluir"
                                disabled={material._count.products > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState message="Nenhum material cadastrado." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
