/**
 * ============================================================================
 * FASE C2.4 - Clinical Complaint History Component
 * ============================================================================
 * 
 * Componente para exibir histórico de queixas clínicas de um paciente.
 * 
 * Mostra:
 * - Queixa ativa atual (is_active = true)
 * - Queixas anteriores (is_active = false)
 * - Suporte a paginação para muitos registros
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, AlertCircle, Clock, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ClinicalComplaint {
  id: string;
  cid_code: string | null;
  cid_title: string | null;
  cid_group: string | null;
  has_no_diagnosis: boolean | null;
  severity: string | null;
  clinical_notes: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ClinicalComplaintHistoryProps {
  patientId: string;
  currentComplaintId?: string;
  onSelectComplaint?: (complaintId: string) => void;
}

const ITEMS_PER_PAGE = 10;

export default function ClinicalComplaintHistory({
  patientId,
  currentComplaintId,
  onSelectComplaint,
}: ClinicalComplaintHistoryProps) {
  const [complaints, setComplaints] = useState<ClinicalComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadComplaints();
  }, [patientId]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      // Primeiro, contar total de queixas
      const { count } = await supabase
        .from('clinical_complaints')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);

      setTotalCount(count || 0);

      // Carregar queixas (limitar a ITEMS_PER_PAGE se showAll = false)
      const query = supabase
        .from('clinical_complaints')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (!showAll) {
        query.limit(ITEMS_PER_PAGE);
      }

      const { data, error } = await query;

      if (error) throw error;

      setComplaints(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de queixas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando showAll mudar
  useEffect(() => {
    if (showAll) {
      loadComplaints();
    }
  }, [showAll]);

  const activeComplaint = complaints.find(c => c.is_active);
  const inactiveComplaints = complaints.filter(c => !c.is_active);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Queixas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (complaints.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Queixas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma queixa registrada ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Histórico de Queixas</CardTitle>
          <Badge variant="outline">{totalCount} total</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6">
          <div className="space-y-4 pb-4">
            {/* Queixa Ativa */}
            {activeComplaint && (
              <div
                className={`
                  border rounded-lg p-4 bg-primary/5 border-primary/20
                  ${currentComplaintId === activeComplaint.id ? 'ring-2 ring-primary' : ''}
                  ${onSelectComplaint ? 'cursor-pointer hover:bg-primary/10 transition-colors' : ''}
                `}
                onClick={() => onSelectComplaint?.(activeComplaint.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-primary">Ativa</Badge>
                  {activeComplaint.created_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(activeComplaint.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>

                {activeComplaint.cid_code ? (
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {activeComplaint.cid_code}
                      {activeComplaint.severity && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {activeComplaint.severity}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {activeComplaint.cid_title}
                    </div>
                  </div>
                ) : activeComplaint.has_no_diagnosis ? (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Sem diagnóstico formal</div>
                      <div className="text-xs text-muted-foreground">Sessões de autoconhecimento/bem-estar</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Queixa sem CID especificado
                  </div>
                )}

                {activeComplaint.clinical_notes && (
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2 bg-background/50 p-2 rounded">
                    {activeComplaint.clinical_notes}
                  </div>
                )}
              </div>
            )}

            {/* Queixas Anteriores */}
            {inactiveComplaints.length > 0 && (
              <>
                {activeComplaint && <Separator className="my-4" />}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Queixas Anteriores ({inactiveComplaints.length})
                  </h4>
                  {inactiveComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className={`
                        border rounded-lg p-3 bg-muted/30
                        ${currentComplaintId === complaint.id ? 'ring-2 ring-muted-foreground' : ''}
                        ${onSelectComplaint ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                      `}
                      onClick={() => onSelectComplaint?.(complaint.id)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="secondary" className="text-xs">Anterior</Badge>
                        {complaint.created_at && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(complaint.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>

                      {complaint.cid_code ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-xs">
                            {complaint.cid_code}
                            {complaint.severity && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {complaint.severity}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {complaint.cid_title}
                          </div>
                        </div>
                      ) : complaint.has_no_diagnosis ? (
                        <div className="text-xs text-muted-foreground">
                          Sem diagnóstico formal
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          Sem CID especificado
                        </div>
                      )}

                      {complaint.clinical_notes && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {complaint.clinical_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Botão "Carregar Mais" */}
            {!showAll && totalCount > ITEMS_PER_PAGE && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAll(true)}
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Carregar mais ({totalCount - complaints.length} restantes)
              </Button>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
