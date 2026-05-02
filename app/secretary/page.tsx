import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserRole } from '@/lib/types';

export default function SecretaryDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, Secretario {user?.full_name}
        </h1>
        <p className="text-xl text-slate-600 mt-2">
          Panel de control para gestión de sesiones, mociones, asistencia y quórum.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sesiones Activas</CardTitle>
            <CardDescription>Próximas sesiones por iniciar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <Button variant="outline" className="mt-4 w-full">
              Ver Sesiones
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mociones Pendientes</CardTitle>
            <CardDescription>Mociones listas para abrir votación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <Button variant="outline" className="mt-4 w-full">
              Gestionar Mociones
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quórum Promedio</CardTitle>
            <CardDescription>Esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">78%</div>
            <Button variant="outline" className="mt-4 w-full">
              Ver Quórum
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Permisos del Secretario</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Crear y gestionar sesiones
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Crear y abrir mociones para votación
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Registrar asistencia
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Control de quórum y resultados
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                No puede gestionar usuarios ni parlamentarios
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

