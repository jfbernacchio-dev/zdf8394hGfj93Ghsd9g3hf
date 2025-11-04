import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { format, parseISO } from 'date-fns';

interface IssueNFSeDialogProps {
  patientId: string;
  patientName: string;
}

export default function IssueNFSeDialog({ 
  patientId, 
  patientName, 
}: IssueNFSeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [unpaidSessions, setUnpaidSessions] = useState<any[]>([]);
  const [maxSessionsPerInvoice, setMaxSessionsPerInvoice] = useState(20);

  useEffect(() => {
    if (open) {
      loadUnpaidSessions();
    }
  }, [open]);

  const loadUnpaidSessions = async () => {
    setLoadingSessions(true);
    try {
      // Buscar sessões não pagas e verificar se o paciente não é mensal
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('monthly_price, nfse_max_sessions_per_invoice')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      // Store max sessions per invoice
      setMaxSessionsPerInvoice(patient?.nfse_max_sessions_per_invoice || 20);

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'attended')
        .eq('paid', false)
        .order('date', { ascending: true });

      if (error) throw error;

      setUnpaidSessions(sessions || []);
    } catch (error: any) {
      console.error('Error loading unpaid sessions:', error);
      toast({
        title: 'Erro ao carregar sessões',
        description: 'Não foi possível carregar as sessões não pagas.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleIssueNFSe = async () => {
    console.log('🚀 Iniciando emissão de NFSe...');
    console.log('Sessões não pagas:', unpaidSessions);
    
    if (unpaidSessions.length === 0) {
      toast({
        title: 'Nenhuma sessão em aberto',
        description: 'Não há sessões não pagas para emitir NFSe.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Validate patient has CPF and consent
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('cpf, guardian_cpf, is_minor, nfse_issue_to, include_minor_text, privacy_policy_accepted, email, name')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      // Validate CPF based on who the invoice will be issued to
      const isMinor = patientData?.is_minor || false;
      const issueTo = patientData?.nfse_issue_to || 'patient';
      const includeMinorText = patientData?.include_minor_text || false;

      // If invoice goes to guardian and patient is minor, guardian CPF is required
      if (isMinor && issueTo === 'guardian' && !patientData?.guardian_cpf) {
        toast({
          title: 'CPF do responsável obrigatório',
          description: 'O CPF do responsável é obrigatório quando a nota é emitida em seu nome. Edite o cadastro do paciente.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // If invoice goes to patient (or patient is not minor), patient CPF is required
      // UNLESS it's a minor with include_minor_text (in which case CPF is optional)
      if (!isMinor || issueTo === 'patient') {
        if (!patientData?.cpf) {
          toast({
            title: 'CPF obrigatório',
            description: 'O paciente precisa ter CPF cadastrado para emitir NFSe. Edite o cadastro do paciente primeiro.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Check if patient needs consent - send email in parallel
      let consentEmailSent = false;
      if (!patientData.privacy_policy_accepted) {
        // Send consent form email (non-blocking)
        supabase.functions.invoke('send-consent-form', {
          body: {
            patientId,
            patientEmail: patientData.email,
            patientName: patientData.name,
          },
        }).then(({ error: consentError }) => {
          if (!consentError) {
            toast({
              title: 'Termo de consentimento enviado',
              description: 'O paciente receberá um email com o termo de consentimento junto com a NFSe.',
            });
          }
        });
        consentEmailSent = true;
      }

      const sessionIds = unpaidSessions.map(s => s.id);
      console.log('📋 Session IDs:', sessionIds);
      console.log('🏥 Patient ID:', patientId);
      console.log('📞 Chamando edge function issue-nfse...');
      
      const { data, error } = await supabase.functions.invoke('issue-nfse', {
        body: {
          patientId,
          sessionIds,
        },
      });

      console.log('📦 Resposta da edge function:', data);
      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw error;
      }

      if (data.success) {
        const description = consentEmailSent 
          ? 'A nota fiscal está sendo emitida e o termo de consentimento foi enviado ao paciente.'
          : data.multiple
            ? `${data.message}. As notas fiscais estão sendo processadas. Consulte o histórico em alguns instantes.`
            : 'A nota fiscal está sendo emitida. Consulte o histórico em alguns instantes.';
        
        toast({
          title: data.multiple ? 'NFSes em processamento' : 'NFSe em processamento',
          description,
        });
        setOpen(false);
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

  const totalValue = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
  const numberOfInvoices = Math.ceil(unpaidSessions.length / maxSessionsPerInvoice);
  const willSplitInvoices = numberOfInvoices > 1;

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
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {unpaidSessions.length === 0 ? (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma sessão não paga encontrada
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sessões não pagas:</span>
                      <span className="text-sm font-bold">{unpaidSessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Valor total:</span>
                      <span className="text-sm font-bold">{formatBrazilianCurrency(totalValue)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 bg-muted/50 max-h-[200px] overflow-y-auto">
                    <p className="text-xs font-medium mb-2">Datas das sessões:</p>
                    <div className="space-y-1">
                      {unpaidSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between text-xs">
                          <span>{format(parseISO(session.date), 'dd/MM/yyyy')}</span>
                          <span className="text-muted-foreground">
                            {formatBrazilianCurrency(session.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 bg-muted/50">
                    <p className="text-sm font-medium mb-1">Informações importantes:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      {willSplitInvoices && (
                        <li className="font-semibold text-blue-600">
                          Serão emitidas {numberOfInvoices} notas fiscais (máx. {maxSessionsPerInvoice} sessões por nota)
                        </li>
                      )}
                      <li>Verifique se sua configuração fiscal está atualizada</li>
                      <li>A NFSe será enviada para o e-mail do paciente</li>
                      <li>Você pode consultar o histórico em NFSe &gt; Histórico</li>
                      <li>A descrição incluirá todas as informações necessárias para reembolso</li>
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleIssueNFSe} 
            disabled={loading || loadingSessions || unpaidSessions.length === 0}
          >
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
