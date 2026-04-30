'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type SetupStep = 'migrate' | 'seed' | 'demo-users';
type StepStatus = 'idle' | 'loading' | 'success' | 'error';

interface StepState {
  status: StepStatus;
  message: string;
}

export default function SetupPage() {
  const { toast } = useToast();
  const [steps, setSteps] = useState<Record<SetupStep, StepState>>({
    migrate: { status: 'idle', message: 'Crear estructura de base de datos' },
    seed: { status: 'idle', message: 'Cargar datos iniciales' },
    'demo-users': { status: 'idle', message: 'Crear usuarios de demostración' },
  });

  const executeStep = async (step: SetupStep) => {
    setSteps((prev) => ({
      ...prev,
      [step]: { ...prev[step], status: 'loading' },
    }));

    try {
      const response = await fetch(`/api/admin/setup/${step}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSteps((prev) => ({
          ...prev,
          [step]: { status: 'success', message: data.message },
        }));

        toast({
          title: 'Éxito',
          description: data.message,
        });
      } else {
        setSteps((prev) => ({
          ...prev,
          [step]: { status: 'error', message: data.error || 'Error desconocido' },
        }));

        toast({
          title: 'Error',
          description: data.error || 'No se pudo ejecutar el paso',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
      setSteps((prev) => ({
        ...prev,
        [step]: { status: 'error', message: errorMessage },
      }));

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getStepColor = (status: StepStatus) => {
    switch (status) {
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      case 'loading':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-slate-300 bg-white';
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'loading':
        return '⋯';
      default:
        return '○';
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Configuración Inicial del Sistema
        </h1>
        <p className="text-slate-600">
          Ejecuta estos pasos en orden para configurar la base de datos y crear los usuarios de demostración.
        </p>
      </div>

      <div className="space-y-4">
        {/* Paso 1: Migrar */}
        <Card
          className={`p-6 border-2 transition-all ${getStepColor(
            steps.migrate.status
          )}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-slate-600">
                  {getStatusIcon(steps.migrate.status)}
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Paso 1: Crear Base de Datos
                </h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Crea todas las tablas necesarias (usuarios, parlamentarios, sesiones, votaciones, auditoría, etc.)
              </p>
              {steps.migrate.message && (
                <p
                  className={`text-sm ${
                    steps.migrate.status === 'error'
                      ? 'text-red-700'
                      : steps.migrate.status === 'success'
                        ? 'text-green-700'
                        : 'text-slate-600'
                  }`}
                >
                  {steps.migrate.message}
                </p>
              )}
            </div>
            <Button
              onClick={() => executeStep('migrate')}
              disabled={steps.migrate.status === 'loading'}
              className="ml-4"
            >
              {steps.migrate.status === 'loading' ? 'Creando...' : 'Ejecutar'}
            </Button>
          </div>
        </Card>

        {/* Paso 2: Seed */}
        <Card
          className={`p-6 border-2 transition-all ${getStepColor(
            steps.seed.status
          )}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-slate-600">
                  {getStatusIcon(steps.seed.status)}
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Paso 2: Cargar Datos Iniciales
                </h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Inserta 20 parlamentarios de ejemplo, 3 partidos políticos y una sesión de prueba.
              </p>
              {steps.seed.message && (
                <p
                  className={`text-sm ${
                    steps.seed.status === 'error'
                      ? 'text-red-700'
                      : steps.seed.status === 'success'
                        ? 'text-green-700'
                        : 'text-slate-600'
                  }`}
                >
                  {steps.seed.message}
                </p>
              )}
            </div>
            <Button
              onClick={() => executeStep('seed')}
              disabled={
                steps.seed.status === 'loading' ||
                steps.migrate.status !== 'success'
              }
              className="ml-4"
            >
              {steps.seed.status === 'loading' ? 'Cargando...' : 'Ejecutar'}
            </Button>
          </div>
        </Card>

        {/* Paso 3: Demo Users */}
        <Card
          className={`p-6 border-2 transition-all ${getStepColor(
            steps['demo-users'].status
          )}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-slate-600">
                  {getStatusIcon(steps['demo-users'].status)}
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Paso 3: Crear Usuarios Demo
                </h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Crea 4 usuarios para probar: Admin, 2 Parlamentarios y 1 Observador
              </p>
              <div className="space-y-2 text-sm font-mono text-slate-700 mb-4 bg-slate-100 p-3 rounded">
                <div>admin@diputados.bo | Admin123!@#</div>
                <div>parlamentario1@diputados.bo | Parl123!@#</div>
                <div>parlamentario2@diputados.bo | Parl123!@#</div>
                <div>observador@diputados.bo | Obs123!@#</div>
              </div>
              {steps['demo-users'].message && (
                <p
                  className={`text-sm ${
                    steps['demo-users'].status === 'error'
                      ? 'text-red-700'
                      : steps['demo-users'].status === 'success'
                        ? 'text-green-700'
                        : 'text-slate-600'
                  }`}
                >
                  {steps['demo-users'].message}
                </p>
              )}
            </div>
            <Button
              onClick={() => executeStep('demo-users')}
              disabled={
                steps['demo-users'].status === 'loading' ||
                steps.seed.status !== 'success'
              }
              className="ml-4"
            >
              {steps['demo-users'].status === 'loading' ? 'Creando...' : 'Ejecutar'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Resultado Final */}
      {steps.migrate.status === 'success' &&
        steps.seed.status === 'success' &&
        steps['demo-users'].status === 'success' && (
          <Card className="mt-8 p-6 bg-green-50 border-2 border-green-300">
            <h3 className="text-xl font-bold text-green-900 mb-4">
              ✓ Configuración Completada
            </h3>
            <p className="text-green-800 mb-4">
              Tu sistema está listo para usar. Ahora puedes:
            </p>
            <ol className="list-decimal list-inside text-green-800 space-y-2">
              <li>Ir a /auth/login</li>
              <li>Ingresar con cualquiera de los usuarios demo</li>
              <li>Explorar los dashboards según el rol</li>
              <li>Reportar cualquier problema encontrado</li>
            </ol>
          </Card>
        )}
    </div>
  );
}
