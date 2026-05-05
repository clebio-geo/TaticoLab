import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DatabaseRequired() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Banco de dados nao configurado</CardTitle>
        <CardDescription>Configure o Supabase Postgres antes de usar os dados do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Crie um arquivo `.env.local` com `DATABASE_URL` e `DIRECT_URL`, usando `.env.example` como referencia.</p>
        <p>Depois rode `npm.cmd run prisma:migrate` e `npm.cmd run db:seed` para criar as tabelas e configuracoes iniciais.</p>
      </CardContent>
    </Card>
  );
}
