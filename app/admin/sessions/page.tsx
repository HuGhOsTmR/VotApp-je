import { SessionsTable } from '@/components/admin/sessions-table';

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Sesiones</h1>
        <p className="text-slate-600 mt-2">
          Gestiona las sesiones parlamentarias y crea nuevas votaciones
        </p>
      </div>
      <SessionsTable />
    </div>
  );
}
