import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionsTable } from '@/components/admin/sessions-table';
import Link from 'next/link';

export default function SecretarySessionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sesiones Parlamentarias
          </h1>
          <p className="text-slate-600 mt-1">
            Gestiona las sesiones y verifica quórum. Solo secretaria/admin.
          </p>
        </div>
        <Link href="/secretary/sessions/new">
          <Button>Nueva Sesión</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sesiones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionsTable />
        </CardContent>
      </Card>
    </div>
  );
}

