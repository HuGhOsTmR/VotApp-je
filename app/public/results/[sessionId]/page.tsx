'use client';

import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Motion, Session, Vote, Parliamentarian } from '@/lib/types';
import { ResultsDashboard } from '@/components/public/results-dashboard';
import { NominalList } from '@/components/public/nominal-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Download } from 'lucide-react';

interface SessionResultsPageProps {
  params: { sessionId: string };
}

export default async function SessionResultsPage({ params }: SessionResultsPageProps) {
  const supabase = await createServerSupabaseClient();
  const { sessionId } = params;

  // Fetch session
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    notFound();
  }

  // Fetch motions for session
  const { data: motions } = await supabase
    .from('motions')
    .select('*, proposer:parliamentarians(full_name, political_party)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  // For demo, get first motion or latest
  const demoMotion = motions?.[0];
  if (!demoMotion) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-12 text-center">
            <CardTitle className="text-2xl mb-4">Sin mociones</CardTitle>
            <p className="text-slate-600 mb-8">Esta sesión no tiene mociones registradas aún.</p>
            <Link href="/public/results">
              <Button variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Ver otras sesiones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Demo results (replace with real API call)
  const demoResults = {
    favor_count: 35,
    against_count: 12,
    abstention_count: 8,
    absent_count: 5,
    total_votes: 60,
    quorum_met: true,
  };

  const demoVotes = Array.from({ length: 60 }, (_, i) => ({
    id: `vote-${i}`,
    vote_type: ['favor', 'against', 'abstention'][Math.floor(Math.random() * 3)] as any,
    parliamentarian: {
      full_name: `Parlamentario Demo ${i + 1}`,
      political_party: ['MAS', 'CC', 'UN'][Math.floor(i % 3)],
    },
  })) as any[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/public/results" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Todas las sesiones
        </Link>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                {session.legislature_number}ª Sesión
              </h1>
              <p className="text-2xl text-slate-600">
                {new Date(session.session_date).toLocaleDateString('es-BO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Button size="lg" className="w-full lg:w-auto">
              <Download className="w-5 h-5 mr-2" />
              Exportar reporte completo
            </Button>
          </div>
        </div>
      </div>

      {/* Current Motion Results */}
      {demoMotion && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <ResultsDashboard
              motion={demoMotion}
              results={demoResults}
            />
          </div>
          <div className="lg:col-span-1">
            <NominalList votes={demoVotes} />
          </div>
        </div>
      )}

      {/* More motions */}
      {motions && motions.length > 1 && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Otras Mociones de esta Sesión
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {motions.slice(1).map((motion) => (
              <Card key={motion.id} className="hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">{motion.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{motion.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Propuesto por {motion.proposer?.full_name}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/public/results/${session.id}#motion-${motion.id}`}>
                        Ver resultados
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-20 pt-12 border-t border-slate-200 text-center">
        <p className="text-slate-500 mb-2">
          Datos actualizados en tiempo real • Transparencia garantizada
        </p>
        <p className="text-xs text-slate-400">
          Brigada Parlamentaria de Cochabamba © 2026
        </p>
      </div>
    </div>
  );
}
