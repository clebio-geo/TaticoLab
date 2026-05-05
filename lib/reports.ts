import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/formatters";

export async function getDashboardReport() {
  const [saleSummary, productsCount, materialsCount, printersCount, revenueRanking, profitRanking] =
    await Promise.all([
      prisma.sale.aggregate({
        _count: true,
        _sum: {
          totalValue: true,
          totalProductionCost: true,
          totalProfit: true,
        },
      }),
      prisma.product.count(),
      prisma.material.count(),
      prisma.printer.count(),
      prisma.sale.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
          totalValue: true,
          totalProfit: true,
        },
        orderBy: {
          _sum: {
            totalValue: "desc",
          },
        },
        take: 10,
      }),
      prisma.sale.groupBy({
        by: ["productId"],
        _sum: {
          totalValue: true,
          totalProfit: true,
        },
        orderBy: {
          _sum: {
            totalProfit: "desc",
          },
        },
        take: 10,
      }),
    ]);

  const rankingProductIds = Array.from(
    new Set([...revenueRanking.map((item) => item.productId), ...profitRanking.map((item) => item.productId)]),
  );
  const products = await prisma.product.findMany({
    where: { id: { in: rankingProductIds } },
    select: { id: true, name: true },
  });
  const productNames = new Map(products.map((product) => [product.id, product.name]));

  const revenue = toNumber(saleSummary._sum.totalValue);
  const cost = toNumber(saleSummary._sum.totalProductionCost);
  const profit = toNumber(saleSummary._sum.totalProfit);
  const saleCount = saleSummary._count;

  return {
    summary: {
      revenue,
      cost,
      profit,
      saleCount,
      averageTicket: saleCount > 0 ? revenue / saleCount : 0,
      realMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
      productsCount,
      materialsCount,
      printersCount,
    },
    revenueRanking: revenueRanking.map((item) => ({
      productId: item.productId,
      name: productNames.get(item.productId) ?? "Produto removido",
      quantity: item._sum.quantity ?? 0,
      revenue: toNumber(item._sum.totalValue),
      profit: toNumber(item._sum.totalProfit),
    })),
    profitRanking: profitRanking.map((item) => ({
      productId: item.productId,
      name: productNames.get(item.productId) ?? "Produto removido",
      revenue: toNumber(item._sum.totalValue),
      profit: toNumber(item._sum.totalProfit),
    })),
  };
}
