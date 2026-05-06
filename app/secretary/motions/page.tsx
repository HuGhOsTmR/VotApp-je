import { MotionsTable } from '@/components/admin/motions-table';

export default function SecretaryMotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mociones</h1>
        <p className="text-slate-600 mt-1">
          Crea, edita, abre y cierra mociones parlamentarias.
        </p>
      </div>
      <MotionsTable />
    </div>
  );
}
