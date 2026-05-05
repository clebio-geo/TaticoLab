import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deletePrinter, savePrinter } from "@/app/actions";
import { EmptyState } from "@/components/empty-state";
import { DatabaseRequired } from "@/components/database-required";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
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

export default async function PrintersPage({ searchParams }: PageProps) {
  if (!hasDatabaseUrl()) {
    return (
      <>
        <PageHeader title="Impressoras" description="Cadastre equipamentos e custos usados no calculo por hora." />
        <DatabaseRequired />
      </>
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const editId = Number(params.edit);
  const [printers, editingPrinter] = await Promise.all([
    prisma.printer.findMany({
      where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
      include: { _count: { select: { products: true } } },
      orderBy: { id: "desc" },
    }),
    Number.isFinite(editId) && editId > 0 ? prisma.printer.findUnique({ where: { id: editId } }) : null,
  ]);

  return (
    <>
      <PageHeader title="Impressoras" description="Cadastre equipamentos e custos usados no calculo por hora." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingPrinter ? "Editar impressora" : "Cadastrar impressora"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={savePrinter} className="grid gap-4">
              {editingPrinter ? <input type="hidden" name="id" value={editingPrinter.id} /> : null}
              <FormField label="Nome" name="name" defaultValue={editingPrinter?.name} required />
              <FormField
                label="Potencia (W)"
                name="powerWatts"
                type="number"
                step="0.01"
                min={0}
                defaultValue={toNumber(editingPrinter?.powerWatts)}
                required
              />
              <FormField
                label="Custo aquisicao (R$)"
                name="acquisitionCost"
                type="number"
                step="0.01"
                min={0}
                defaultValue={toNumber(editingPrinter?.acquisitionCost)}
                required
              />
              <FormField
                label="Vida util (horas)"
                name="usefulLifeHours"
                type="number"
                step="0.01"
                min={0}
                defaultValue={toNumber(editingPrinter?.usefulLifeHours)}
                required
              />
              <FormField
                label="Manutencao mensal (R$)"
                name="monthlyMaintenance"
                type="number"
                step="0.01"
                min={0}
                defaultValue={toNumber(editingPrinter?.monthlyMaintenance)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit">{editingPrinter ? "Atualizar impressora" : "Salvar impressora"}</Button>
                {editingPrinter ? (
                  <Button asChild variant="outline">
                    <Link href="/printers">Cancelar</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de impressoras</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-4 flex gap-2">
              <Input name="q" defaultValue={query} placeholder="Buscar impressora" />
              <Button type="submit" variant="outline">Buscar</Button>
            </form>
            {printers.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Potencia</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Vida util</TableHead>
                    <TableHead>Manut.</TableHead>
                    <TableHead className="w-28">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">{printer.name}</TableCell>
                      <TableCell>{formatNumber.format(toNumber(printer.powerWatts))} W</TableCell>
                      <TableCell>{formatCurrency.format(toNumber(printer.acquisitionCost))}</TableCell>
                      <TableCell>{formatNumber.format(toNumber(printer.usefulLifeHours))} h</TableCell>
                      <TableCell>{formatCurrency.format(toNumber(printer.monthlyMaintenance))}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild size="icon" variant="outline" title="Editar">
                            <Link href={`/printers?edit=${printer.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <form action={deletePrinter}>
                            <input type="hidden" name="id" value={printer.id} />
                            <Button
                              type="submit"
                              size="icon"
                              variant="destructive"
                              title="Excluir"
                              disabled={printer._count.products > 0}
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
              <EmptyState message="Nenhuma impressora cadastrada." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
