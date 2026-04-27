'use client';

import { useEffect, useState } from 'react';
import { Parliamentarian } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function ParliamentariansTable() {
  const [parliamentarians, setParliamentarians] = useState<Parliamentarian[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchParliamentarians();
  }, []);

  const fetchParliamentarians = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parliamentarians');
      const result = await response.json();

      if (result.success) {
        setParliamentarians(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los parlamentarios',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error fetching parliamentarians:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los parlamentarios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const partyColors: Record<string, string> = {
    MAS: 'bg-red-100 text-red-800',
    UN: 'bg-green-100 text-green-800',
    CC: 'bg-yellow-100 text-yellow-800',
    PDC: 'bg-blue-100 text-blue-800',
    'PAN-BOL': 'bg-purple-100 text-purple-800',
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Parlamentarios</h2>
        <Button>Agregar Parlamentario</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Cargando parlamentarios...</p>
        </div>
      ) : parliamentarians.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">
            No hay parlamentarios registrados
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Partido Político</TableHead>
                <TableHead>Circunscripción</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parliamentarians.map((parliamentarian) => (
                <TableRow key={parliamentarian.id}>
                  <TableCell className="font-medium">
                    {parliamentarian.full_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        partyColors[parliamentarian.political_party] ||
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {parliamentarian.political_party}
                    </Badge>
                  </TableCell>
                  <TableCell>{parliamentarian.circumscription}</TableCell>
                  <TableCell className="text-sm">
                    {parliamentarian.email || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {parliamentarian.phone_number || '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
