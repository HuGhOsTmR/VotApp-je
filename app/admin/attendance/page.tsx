import { AttendanceTable } from '@/components/admin/attendance-table';

export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Asistencia</h1>
        <p className="text-slate-600 mt-2">
          Gestiona los registros de asistencia y quórum por sesión parlamentaria.
        </p>
      </div>
      <AttendanceTable />
    </div>
  );
}
