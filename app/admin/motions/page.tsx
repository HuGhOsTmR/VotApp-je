import { MotionsTable } from '@/components/admin/motions-table';

export default function MotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Mociones</h1>
        <p className="text-slate-600 mt-2">
          Gestiona las mociones y abre nuevas votaciones
        </p>
      </div>
      <MotionsTable />
    </div>
  );
}
