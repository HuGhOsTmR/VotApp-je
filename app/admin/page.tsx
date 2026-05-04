'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useAdminStats } from '@/lib/hooks/use-admin-stats';
import { DashboardCards } from '@/components/admin/dashboard-cards';
import { RecentActivity } from '@/components/admin/recent-activity';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { stats, loading } = useAdminStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Bienvenido, {user?.full_name}
          </h1>
          <p className="text-slate-600">Dashboard Administrativo • {new Date().toLocaleDateString('es-BO')}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/sessions/new">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sesión
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/motions/new">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Moción
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardCards stats={stats} loading={loading} />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Gráfico Votos</h2>
          <div className="bg-white rounded-lg shadow-sm border p-6 h-64 flex items-center justify-center">
            <p className="text-slate-500">Gráfico recharts próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
