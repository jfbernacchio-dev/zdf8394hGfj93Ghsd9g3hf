import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConsentReminderProps {
  patientId?: string; // Se fornecido, mostra apenas para este paciente
}

interface PatientWithoutConsent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export const ConsentReminder = ({ patientId }: ConsentReminderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patientsWithoutConsent, setPatientsWithoutConsent] = useState<PatientWithoutConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadPatientsWithoutConsent();
    }
  }, [user, patientId]);

  const loadPatientsWithoutConsent = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('patients')
        .select('id, name, email, phone, privacy_policy_accepted')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or('privacy_policy_accepted.is.null,privacy_policy_accepted.eq.false');

      if (patientId) {
        query = query.eq('id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPatientsWithoutConsent(data || []);
    } catch (error: any) {
      console.error('Error loading patients without consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendConsentEmail = async (patient: PatientWithoutConsent) => {
    // Verificar se o paciente tem pelo menos um canal de comunicação
    const hasEmail = patient.email && patient.email.trim() !== '';
    const hasPhone = patient.phone && patient.phone.trim() !== '';
    
    if (!hasEmail && !hasPhone) {
      toast({
        title: 'Contato não cadastrado',
        description: `O paciente ${patient.name} não possui email nem telefone cadastrado. Adicione pelo menos um contato antes de enviar o termo de consentimento.`,
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-consent-form', {
        body: {
          patientId: patient.id,
          patientEmail: patient.email,
          patientName: patient.name,
        },
      });

      if (error) throw error;

      // Mensagem dinâmica baseada nos canais utilizados
      let description = '';
      if (data?.emailSent && data?.whatsappSent) {
        description = `Termo enviado por email e WhatsApp para ${patient.name}`;
      } else if (data?.emailSent) {
        description = `Termo enviado por email para ${patient.name}`;
      } else if (data?.whatsappSent) {
        description = `Termo enviado por WhatsApp para ${patient.name}`;
      } else {
        description = `Termo enviado para ${patient.name}`;
      }

      toast({
        title: 'Enviado com sucesso!',
        description,
      });

      // Recarregar lista
      await loadPatientsWithoutConsent();
    } catch (error: any) {
      console.error('Error sending consent email:', error);
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar o termo de consentimento.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const sendAllConsentEmails = async () => {
    if (patientsWithoutConsent.length === 0) return;

    const confirmed = confirm(
      `Enviar termo de consentimento para ${patientsWithoutConsent.length} paciente(s)?`
    );

    if (!confirmed) return;

    setSending(true);
    let successCount = 0;
    let errorCount = 0;

    for (const patient of patientsWithoutConsent) {
      // Pular pacientes sem nenhum contato
      const hasEmail = patient.email && patient.email.trim() !== '';
      const hasPhone = patient.phone && patient.phone.trim() !== '';
      
      if (!hasEmail && !hasPhone) {
        errorCount++;
        continue;
      }

      try {
        const { error } = await supabase.functions.invoke('send-consent-form', {
          body: {
            patientId: patient.id,
            patientEmail: patient.email,
            patientName: patient.name,
          },
        });

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    toast({
      title: 'Envio concluído',
      description: `${successCount} email(s) enviado(s) com sucesso. ${errorCount > 0 ? `${errorCount} erro(s).` : ''}`,
    });

    setSending(false);
    await loadPatientsWithoutConsent();
  };

  if (loading) return null;
  if (patientsWithoutConsent.length === 0) return null;

  return (
    <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              {patientId ? 'Documentos Pendentes' : 'Termos de Consentimento Pendentes'}
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-500">
              {patientId
                ? 'Este paciente ainda não aceitou o termo de consentimento e política de privacidade'
                : `${patientsWithoutConsent.length} paciente(s) sem termo de consentimento aceito`}
            </CardDescription>
          </div>
          {!patientId && patientsWithoutConsent.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={sendAllConsentEmails}
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para Todos
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {patientId ? (
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-lg">
            <div>
              <p className="font-medium">{patientsWithoutConsent[0]?.name}</p>
              {(() => {
                const hasEmail = patientsWithoutConsent[0]?.email && patientsWithoutConsent[0]?.email.trim() !== '';
                const hasPhone = patientsWithoutConsent[0]?.phone && patientsWithoutConsent[0]?.phone.trim() !== '';
                
                if (hasEmail && hasPhone) {
                  return <p className="text-sm text-muted-foreground">📧 {patientsWithoutConsent[0]?.email} | 📱 {patientsWithoutConsent[0]?.phone}</p>;
                } else if (hasEmail) {
                  return <p className="text-sm text-muted-foreground">📧 {patientsWithoutConsent[0]?.email}</p>;
                } else if (hasPhone) {
                  return <p className="text-sm text-muted-foreground">📱 {patientsWithoutConsent[0]?.phone}</p>;
                } else {
                  return <p className="text-sm text-red-600 dark:text-red-400">⚠️ Sem email ou telefone cadastrado</p>;
                }
              })()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendConsentEmail(patientsWithoutConsent[0])}
              disabled={sending || (!patientsWithoutConsent[0]?.email && !patientsWithoutConsent[0]?.phone)}
              title={(!patientsWithoutConsent[0]?.email && !patientsWithoutConsent[0]?.phone) ? 'Paciente sem email ou telefone cadastrado' : undefined}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Documentos
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {patientsWithoutConsent.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-lg"
              >
              <div className="flex-1">
                  <p className="font-medium">{patient.name}</p>
                  {(() => {
                    const hasEmail = patient.email && patient.email.trim() !== '';
                    const hasPhone = patient.phone && patient.phone.trim() !== '';
                    
                    if (hasEmail && hasPhone) {
                      return <p className="text-sm text-muted-foreground">📧 {patient.email} | 📱 {patient.phone}</p>;
                    } else if (hasEmail) {
                      return <p className="text-sm text-muted-foreground">📧 {patient.email}</p>;
                    } else if (hasPhone) {
                      return <p className="text-sm text-muted-foreground">📱 {patient.phone}</p>;
                    } else {
                      return <p className="text-sm text-red-600 dark:text-red-400">⚠️ Sem contato</p>;
                    }
                  })()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sendConsentEmail(patient)}
                  disabled={sending || (!patient.email && !patient.phone)}
                  title={(!patient.email && !patient.phone) ? 'Paciente sem email ou telefone cadastrado' : undefined}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
