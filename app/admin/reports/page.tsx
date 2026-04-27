'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Reportes</h1>
        <p className="text-slate-600 mt-2">
          Genera y descarga reportes de las votaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Reporte General</h3>
          <p className="text-slate-600 mb-4">
            Descarga un reporte completo de todas las sesiones y votaciones
          </p>
          <div className="space-x-2">
            <Button>Descargar PDF</Button>
            <Button variant="outline">Descargar CSV</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Reporte por Sesión</h3>
          <p className="text-slate-600 mb-4">
            Genera reportes específicos por sesión parlamentaria
          </p>
          <Button>Seleccionar Sesión</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Reporte por Moción</h3>
          <p className="text-slate-600 mb-4">
            Detalla los votos individuales de cada moción
          </p>
          <Button>Generar Reporte</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
          <p className="text-slate-600 mb-4">
            Visualiza gráficos y estadísticas de votación
          </p>
          <Button>Ver Estadísticas</Button>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-amber-900 mb-2">En Desarrollo</h3>
        <p className="text-amber-800">
          Los reportes y exportaciones se están implementando. Próximamente
          podrás descargar reportes en PDF y CSV con toda la información de
          votaciones y auditoría.
        </p>
      </div>
    </div>
  );
}
