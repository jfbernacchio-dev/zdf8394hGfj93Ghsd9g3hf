import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  access_type: string;
  access_reason: string | null;
  admin_id: string;
  created_at: string;
}

interface LogReview {
  id: string;
  review_period_start: string;
  review_period_end: string;
  logs_reviewed: number;
  findings: string | null;
  actions_taken: string | null;
  created_at: string;
}

export default function LogReview() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [reviews, setReviews] = useState<LogReview[]>([]);
  const [findings, setFindings] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // SECURITY: Revisão de logs de auditoria é funcionalidade EXCLUSIVAMENTE administrativa (compliance)
    // e não deve ser controlada pelo sistema de permissões operacionais.
    // Apenas o admin (dono do sistema) tem acesso.
    if (!isAdmin) {
      toast.error('Acesso negado');
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    setLoading(true);
    
    // Load recent audit logs
    const { data: logsData } = await supabase
      .from('admin_access_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Load previous reviews
    const { data: reviewsData } = await supabase
      .from('log_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setLogs(logsData || []);
    setReviews(reviewsData || []);
    setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    setSubmitting(true);

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);

    const { error } = await supabase
      .from('log_reviews')
      .insert([{
        reviewed_by: user.id,
        review_period_start: periodStart.toISOString().split('T')[0],
        review_period_end: periodEnd.toISOString().split('T')[0],
        logs_reviewed: logs.length,
        findings,
        actions_taken: actionsTaken,
      }]);

    if (error) {
      toast.error('Erro ao salvar revisão');
      setSubmitting(false);
      return;
    }

    toast.success('Revisão registrada com sucesso');
    setFindings('');
    setActionsTaken('');
    loadData();
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Revisão de Logs</h1>
          <p className="text-muted-foreground">Análise periódica dos logs de acesso administrativo</p>
        </div>
      </div>

      {/* Current Review */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Revisão</CardTitle>
          <CardDescription>
            Revise os {logs.length} logs de acesso dos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Achados / Observações
            </label>
            <Textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Descreva quaisquer achados ou observações relevantes..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Ações Tomadas
            </label>
            <Textarea
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="Descreva as ações tomadas em resposta aos achados..."
              rows={4}
            />
          </div>

          <Button onClick={handleSubmitReview} disabled={submitting}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Registrar Revisão
          </Button>
        </CardContent>
      </Card>

      {/* Recent Logs Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Logs Recentes (últimos 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo de Acesso</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 20).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.access_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.access_reason || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Previous Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Revisões Anteriores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma revisão anterior registrada
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        Período: {format(new Date(review.review_period_start), 'dd/MM/yyyy')} - {format(new Date(review.review_period_end), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.logs_reviewed} logs revisados
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {format(new Date(review.created_at), 'dd/MM/yyyy')}
                    </Badge>
                  </div>
                  {review.findings && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Achados:</p>
                      <p className="text-sm text-muted-foreground">{review.findings}</p>
                    </div>
                  )}
                  {review.actions_taken && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Ações Tomadas:</p>
                      <p className="text-sm text-muted-foreground">{review.actions_taken}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
