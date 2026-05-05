import { BarChart3, Boxes, Package, Printer, ReceiptText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardReport } from "@/lib/reports";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { hasDatabaseUrl } from "@/lib/env";
import { DatabaseRequired } from "@/components/database-required";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasDatabaseUrl()) {
    return (
      <>
        <PageHeader title="Dashboard" description="Visao geral financeira e operacional do laboratorio." />
        <DatabaseRequired />
      </>
    );
  }

  const report = await getDashboardReport();

  return (
    <>
      <PageHeader title="Dashboard" description="Visao geral financeira e operacional do laboratorio." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Faturamento" value={formatCurrency.format(report.summary.revenue)} icon={TrendingUp} />
        <Metric title="Custo estimado" value={formatCurrency.format(report.summary.cost)} icon={BarChart3} />
        <Metric title="Lucro estimado" value={formatCurrency.format(report.summary.profit)} icon={ReceiptText} />
        <Metric title="Margem real" value={`${formatPercent.format(report.summary.realMargin)}%`} icon={Package} />
        <Metric title="Vendas" value={String(report.summary.saleCount)} icon={ReceiptText} />
        <Metric title="Ticket medio" value={formatCurrency.format(report.summary.averageTicket)} icon={TrendingUp} />
        <Metric title="Materiais" value={String(report.summary.materialsCount)} icon={Boxes} />
        <Metric title="Impressoras" value={String(report.summary.printersCount)} icon={Printer} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Ranking title="Ranking por faturamento" rows={report.revenueRanking} mode="revenue" />
        <Ranking title="Ranking por lucro" rows={report.profitRanking} mode="profit" />
      </div>
    </>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof TrendingUp }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Ranking({
  title,
  rows,
  mode,
}: {
  title: string;
  rows: Array<{ name: string; quantity?: number; revenue: number; profit: number }>;
  mode: "revenue" | "profit";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              {mode === "revenue" ? <TableHead>Qtd</TableHead> : null}
              <TableHead>Faturamento</TableHead>
              <TableHead>Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={`${title}-${row.name}`}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  {mode === "revenue" ? <TableCell>{row.quantity ?? 0}</TableCell> : null}
                  <TableCell>{formatCurrency.format(row.revenue)}</TableCell>
                  <TableCell>{formatCurrency.format(row.profit)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={mode === "revenue" ? 4 : 3} className="text-muted-foreground">
                  Nenhuma venda registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
