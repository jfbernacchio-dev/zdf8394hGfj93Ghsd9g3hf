import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';

interface IssueNFSeDialogProps {
  patientId: string;
  patientName: string;
  defaultValue?: number;
  defaultSessions?: number;
}

export default function IssueNFSeDialog({ 
  patientId, 
  patientName, 
  defaultValue, 
  defaultSessions = 1 
}: IssueNFSeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceValue, setServiceValue] = useState(defaultValue?.toString() || '');
  const [sessions, setSessions] = useState(defaultSessions.toString());

  const handleIssueNFSe = async () => {
    // Validações
    const numericValue = Number(serviceValue);
    const numericSessions = Number(sessions);

    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor válido para o serviço.',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(numericSessions) || numericSessions <= 0 || !Number.isInteger(numericSessions)) {
      toast({
        title: 'Sessões inválidas',
        description: 'Informe um número válido de sessões.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('issue-nfse', {
        body: {
          patientId,
          serviceValue: numericValue,
          sessions: numericSessions,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'NFSe em processamento',
          description: 'A nota fiscal está sendo emitida. Consulte o histórico em alguns instantes.',
        });
        setOpen(false);
        
        // Reset form
        setServiceValue(defaultValue?.toString() || '');
        setSessions(defaultSessions.toString());
      } else {
        throw new Error(data.error || 'Erro ao emitir NFSe');
      }
    } catch (error: any) {
      console.error('Error issuing NFSe:', error);
      toast({
        title: 'Erro ao emitir NFSe',
        description: error.message || 'Verifique sua configuração fiscal e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const previewValue = Number(serviceValue) || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Emitir NFSe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Emitir Nota Fiscal de Serviço</DialogTitle>
          <DialogDescription>
            Paciente: <span className="font-medium text-foreground">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="service_value">Valor do Serviço</Label>
            <Input
              id="service_value"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={serviceValue}
              onChange={(e) => setServiceValue(e.target.value)}
            />
            {previewValue > 0 && (
              <p className="text-sm text-muted-foreground">
                Valor: {formatBrazilianCurrency(previewValue)}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sessions">Número de Sessões</Label>
            <Input
              id="sessions"
              type="number"
              min="1"
              step="1"
              placeholder="1"
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Este valor aparecerá na discriminação da nota fiscal
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium mb-1">Informações importantes:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Verifique se sua configuração fiscal está atualizada</li>
              <li>A NFSe será enviada para o e-mail do paciente</li>
              <li>Você pode consultar o histórico em NFSe &gt; Histórico</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleIssueNFSe} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Emitindo...
              </>
            ) : (
              'Emitir NFSe'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
