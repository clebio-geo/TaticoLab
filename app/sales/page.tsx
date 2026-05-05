import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteSale, saveSale } from "@/app/actions";
import { DatabaseRequired } from "@/components/database-required";
import { EmptyState } from "@/components/empty-state";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string; edit?: string }>;
};

export default async function SalesPage({ searchParams }: PageProps) {
  if (!hasDatabaseUrl()) {
    return (
      <>
        <PageHeader title="Vendas" description="Registre vendas e preserve snapshots de custo e lucro." />
        <DatabaseRequired />
      </>
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const editId = Number(params.edit);
  const [sales, editingSale, products] = await Promise.all([
    prisma.sale.findMany({
      where: query
        ? {
            product: {
              name: { contains: query, mode: "insensitive" },
            },
          }
        : undefined,
      include: { product: true },
      orderBy: { id: "desc" },
    }),
    Number.isFinite(editId) && editId > 0 ? prisma.sale.findUnique({ where: { id: editId } }) : null,
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Vendas" description="Registre vendas e preserve snapshots de custo e lucro." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingSale ? "Editar venda" : "Registrar venda"}</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length ? (
              <form action={saveSale} className="grid gap-4">
                {editingSale ? <input type="hidden" name="id" value={editingSale.id} /> : null}
                <div className="grid gap-2">
                  <Label htmlFor="productId">Produto</Label>
                  <Select id="productId" name="productId" defaultValue={editingSale?.productId} required>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({formatCurrency.format(toNumber(product.suggestedPrice))})
                      </option>
                    ))}
                  </Select>
                </div>
                <FormField
                  label="Quantidade"
                  name="quantity"
                  type="number"
                  step="1"
                  min={1}
                  defaultValue={editingSale?.quantity ?? 1}
                  required
                />
                <FormField
                  label="Valor unitario vendido (R$)"
                  name="unitSaleValue"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={toNumber(editingSale?.unitSaleValue)}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit">{editingSale ? "Atualizar venda" : "Registrar venda"}</Button>
                  {editingSale ? (
                    <Button asChild variant="outline">
                      <Link href="/sales">Cancelar</Link>
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : (
              <EmptyState message="Cadastre um produto antes de registrar vendas." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-4 flex gap-2">
              <Input name="q" defaultValue={query} placeholder="Buscar por produto" />
              <Button type="submit" variant="outline">Buscar</Button>
            </form>
            {sales.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-28">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.product.name}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>{formatCurrency.format(toNumber(sale.totalValue))}</TableCell>
                      <TableCell>{formatCurrency.format(toNumber(sale.totalProductionCost))}</TableCell>
                      <TableCell>{formatCurrency.format(toNumber(sale.totalProfit))}</TableCell>
                      <TableCell>{formatDateTime(sale.soldAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild size="icon" variant="outline" title="Editar">
                            <Link href={`/sales?edit=${sale.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <form action={deleteSale}>
                            <input type="hidden" name="id" value={sale.id} />
                            <Button type="submit" size="icon" variant="destructive" title="Excluir">
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
              <EmptyState message="Nenhuma venda registrada." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
