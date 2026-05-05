import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { DatabaseRequired } from "@/components/database-required";
import { hasDatabaseUrl } from "@/lib/env";
import { getDashboardReport } from "@/lib/reports";
import { formatCurrency, formatPercent } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <>
        <PageHeader title="Relatorios" description="Resumo gerencial do negocio de impressao 3D." />
        <DatabaseRequired />
      </>
    );
  }

  const report = await getDashboardReport();
  const mostProfitable = report.profitRanking[0];

  return (
    <>
      <PageHeader title="Relatorios" description="Resumo gerencial do negocio de impressao 3D." />
      <Card>
        <CardHeader>
          <CardTitle>Relatorio gerencial</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-7">
            {[
              `Faturamento total: ${formatCurrency.format(report.summary.revenue)}`,
              `Custo total estimado das vendas: ${formatCurrency.format(report.summary.cost)}`,
              `Lucro estimado total: ${formatCurrency.format(report.summary.profit)}`,
              `Quantidade de vendas registradas: ${report.summary.saleCount}`,
              `Ticket medio por venda: ${formatCurrency.format(report.summary.averageTicket)}`,
              `Margem real estimada: ${formatPercent.format(report.summary.realMargin)}%`,
              "",
              `Produtos cadastrados: ${report.summary.productsCount}`,
              `Materiais cadastrados: ${report.summary.materialsCount}`,
              `Impressoras cadastradas: ${report.summary.printersCount}`,
              "",
              mostProfitable
                ? `Produto mais lucrativo: ${mostProfitable.name} | Lucro acumulado: ${formatCurrency.format(mostProfitable.profit)}`
                : "Produto mais lucrativo: ainda nao ha vendas registradas.",
              "",
              "RANKING DE PRODUTOS POR FATURAMENTO:",
              ...(report.revenueRanking.length
                ? report.revenueRanking.map(
                    (item, index) =>
                      `${index + 1}. ${item.name} | Qtd: ${item.quantity} | Faturamento: ${formatCurrency.format(
                        item.revenue,
                      )} | Lucro: ${formatCurrency.format(item.profit)}`,
                  )
                : ["Nenhuma venda registrada ainda."]),
              "",
              "RANKING DE PRODUTOS POR LUCRO:",
              ...(report.profitRanking.length
                ? report.profitRanking.map(
                    (item, index) =>
                      `${index + 1}. ${item.name} | Lucro: ${formatCurrency.format(
                        item.profit,
                      )} | Faturamento: ${formatCurrency.format(item.revenue)}`,
                  )
                : ["Nenhuma venda registrada ainda."]),
            ].join("\n")}
          </pre>
        </CardContent>
      </Card>
    </>
  );
}
