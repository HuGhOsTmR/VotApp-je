'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Bienvenido, {user?.full_name}
        </h1>
        <p className="text-slate-600">Dashboard Administrativo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Sesiones Activas
          </h3>
          <p className="text-3xl font-bold text-blue-900">--</p>
        </Card>
        <Card className="p-6 bg-white">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Mociones Abiertas
          </h3>
          <p className="text-3xl font-bold text-blue-900">--</p>
        </Card>
        <Card className="p-6 bg-white">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Parlamentarios
          </h3>
          <p className="text-3xl font-bold text-blue-900">--</p>
        </Card>
        <Card className="p-6 bg-white">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Logs de Auditoría
          </h3>
          <p className="text-3xl font-bold text-blue-900">--</p>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-amber-900 mb-2">En Construcción</h3>
        <p className="text-amber-800">
          El dashboard administrativo se está configurando. Por favor, continúa
          explorando el sistema.
        </p>
      </div>
    </div>
  );
}
