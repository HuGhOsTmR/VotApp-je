import { ParliamentariansTable } from '@/components/admin/parliamentarians-table';

export default function ParliamentariansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Parlamentarios</h1>
        <p className="text-slate-600 mt-2">
          Gestiona el registro de parlamentarios de la Brigada Parlamentaria
        </p>
      </div>
      <ParliamentariansTable />
    </div>
  );
}
