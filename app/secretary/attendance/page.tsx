import { AttendanceTable } from '@/components/admin/attendance-table';

export default function SecretaryAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asistencia</h1>
        <p className="text-slate-600 mt-1">
          Registra la presencia, ausencia o justificación de parlamentarios por sesión.
        </p>
      </div>
      <AttendanceTable />
    </div>
  );
}
