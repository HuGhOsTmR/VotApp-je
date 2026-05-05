'use client';

import { useState, useEffect } from "react";
import { Session } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Clock, Calendar, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function PublicResultsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("session_date", { ascending: false })
        .limit(10);

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error("[public-results] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
          Resultados de Votaciones
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Consulta los resultados completos y nominales de todas las sesiones parlamentarias. Transparencia total.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="max-w-2xl mx-auto text-center p-12">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Sin sesiones disponibles
          </h2>
          <p className="text-slate-600 mb-6">
            Aún no se han creado sesiones parlamentarias o los resultados no están disponibles.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-900 transition-colors">
                      Sesión {session.legislature_number}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      {new Date(session.session_date).toLocaleDateString("es-BO")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Estado:</span>
                    <Badge variant={session.status === "active" ? "default" : "secondary"}>
                      {session.status}
                    </Badge>
                  </div>
                  {session.title && (
                    <p className="text-sm text-slate-700 line-clamp-2">{session.title}</p>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full group-hover:bg-blue-50 transition-colors mt-2">
                    <Link href={`/public/results/${session.slug || session.id}`}>
                      Ver resultados <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-16 text-center">
        <p className="text-slate-500 text-sm">
          © 2026 Brigada Parlamentaria de Cochabamba. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
