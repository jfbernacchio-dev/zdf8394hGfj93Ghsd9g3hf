import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';

interface InvoiceLog {
  id: string;
  created_at: string;
  invoice_text: string;
  patient_count: number;
  total_sessions: number;
  total_value: number;
}

const InvoiceLogs = () => {
  const [logs, setLogs] = useState<InvoiceLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<InvoiceLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from('invoice_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao carregar logs',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setLogs(data || []);
  };

  const openLogDialog = (log: InvoiceLog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
          Histórico de Fechamentos
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Consulte os fechamentos gerais realizados
        </p>
      </div>

      {logs.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum fechamento registrado ainda</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {logs.map((log) => (
            <Card
              key={log.id}
              className="p-6 hover:shadow-[var(--shadow-soft)] transition-shadow cursor-pointer"
              onClick={() => openLogDialog(log)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Pacientes</p>
                      <p className="text-lg font-semibold text-foreground">{log.patient_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sessões</p>
                      <p className="text-lg font-semibold text-foreground">{log.total_sessions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatBrazilianCurrency(log.total_value)}
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Fechamento de{' '}
              {selectedLog &&
                format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm")}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                  <p className="text-lg font-semibold">{selectedLog.patient_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sessões</p>
                  <p className="text-lg font-semibold">{selectedLog.total_sessions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-semibold">
                    {formatBrazilianCurrency(selectedLog.total_value)}
                  </p>
                </div>
              </div>
              <Textarea
                value={selectedLog.invoice_text}
                readOnly
                rows={20}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(selectedLog.invoice_text);
                  toast({ title: 'Texto copiado!' });
                }}
                className="w-full"
              >
                Copiar Texto
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceLogs;
