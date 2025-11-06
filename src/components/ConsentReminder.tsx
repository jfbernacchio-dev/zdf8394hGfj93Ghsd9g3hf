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
  email: string;
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
        .select('id, name, email, privacy_policy_accepted')
        .eq('user_id', user.id)
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
    // Verificar se o paciente tem email
    if (!patient.email || patient.email.trim() === '') {
      toast({
        title: 'Email não cadastrado',
        description: `O paciente ${patient.name} não possui email cadastrado. Adicione um email antes de enviar o termo de consentimento.`,
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-consent-form', {
        body: {
          patientId: patient.id,
          patientEmail: patient.email,
          patientName: patient.name,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email enviado!',
        description: `Termo de consentimento enviado para ${patient.name}`,
      });

      // Recarregar lista
      await loadPatientsWithoutConsent();
    } catch (error: any) {
      console.error('Error sending consent email:', error);
      toast({
        title: 'Erro ao enviar email',
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
      // Pular pacientes sem email
      if (!patient.email || patient.email.trim() === '') {
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
              {patientsWithoutConsent[0]?.email ? (
                <p className="text-sm text-muted-foreground">{patientsWithoutConsent[0]?.email}</p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">⚠️ Email não cadastrado - adicione um email para enviar os documentos</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendConsentEmail(patientsWithoutConsent[0])}
              disabled={sending || !patientsWithoutConsent[0]?.email}
              title={!patientsWithoutConsent[0]?.email ? 'Paciente sem email cadastrado' : undefined}
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
                  {patient.email ? (
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                  ) : (
                    <p className="text-sm text-red-600 dark:text-red-400">⚠️ Email não cadastrado</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sendConsentEmail(patient)}
                  disabled={sending || !patient.email}
                  title={!patient.email ? 'Paciente sem email cadastrado' : undefined}
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
