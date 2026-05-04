'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStats } from '@/lib/hooks/use-admin-stats';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, FileText, BarChart3 } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function DashboardCard({ title, value, description, href, icon }: DashboardCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full p-6 hover:shadow-xl transition-all border-0 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
              <CardDescription className="text-sm text-slate-600">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-0 text-slate-600 hover:text-blue-900">
            Ver todos →
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

interface DashboardCardsProps {
  stats: AdminStats;
  loading: boolean;
}

export function DashboardCards({ stats, loading }: DashboardCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard
        title="Sesiones Activas"
        value={stats.activeSessions}
        description="Sesiones en progreso"
        href="/admin/sessions"
        icon={<LayoutDashboard className="w-5 h-5 text-blue-600" />}
      />
      <DashboardCard
        title="Mociones Abiertas"
        value={stats.openMotions}
        description="Votaciones pendientes"
        href="/admin/motions"
        icon={<FileText className="w-5 h-5 text-green-600" />}
      />
      <DashboardCard
        title="Parlamentarios"
        value={stats.totalParliamentarians}
        description="Total registrados"
        href="/admin/parliamentarians"
        icon={<Users className="w-5 h-5 text-orange-600" />}
      />
      <DashboardCard
        title="Usuarios"
        value={stats.totalUsers}
        description="Cuentas del sistema"
        href="/admin/users"
        icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
      />
    </div>
  );
}
