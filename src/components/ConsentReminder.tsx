import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Send, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConsentReminderProps {
  patientId?: string; // Se fornecido, mostra apenas para este paciente
}

interface PatientWithoutConsent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_minor: boolean | null;
  guardian_name: string | null;
  guardian_phone_1: string | null;
}

interface PendingToken {
  created_at: string;
  patient_id: string;
}

export const ConsentReminder = ({ patientId }: ConsentReminderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patientsWithoutConsent, setPatientsWithoutConsent] = useState<PatientWithoutConsent[]>([]);
  const [patientsAwaitingResponse, setPatientsAwaitingResponse] = useState<PatientWithoutConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingToken, setPendingToken] = useState<PendingToken | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatientsWithoutConsent();
      if (patientId) {
        loadPendingToken();
      }
    }
  }, [user, patientId]);

  const loadPendingToken = async () => {
    if (!patientId) return;
    
    setLoadingToken(true);
    try {
      const { data } = await supabase
        .from('consent_submissions')
        .select('created_at, patient_id')
        .eq('patient_id', patientId)
        .is('accepted_at', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();
      
      setPendingToken(data || null);
    } catch (error) {
      console.error('Error loading pending token:', error);
      setPendingToken(null);
    } finally {
      setLoadingToken(false);
    }
  };

  const loadPatientsWithoutConsent = async () => {
    if (!user) return;

    try {
      // Se for individual, buscar apenas esse paciente específico
      // Se não for, buscar todos os pacientes ativos que não aceitaram
      let query = supabase
        .from('patients')
        .select('id, name, email, phone, privacy_policy_accepted, is_minor, guardian_name, guardian_phone_1')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Para PatientDetail individual, buscar o paciente específico sem filtro de aceitação
      if (!patientId) {
        query = query.or('privacy_policy_accepted.is.null,privacy_policy_accepted.eq.false');
      } else {
        query = query.eq('id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filtrar pacientes verificando aceitação real (consent_submissions com accepted_at)
      const patientsToShow: PatientWithoutConsent[] = [];
      const patientsAwaiting: PatientWithoutConsent[] = [];
      
      for (const patient of data || []) {
        // Verificar se tem aceitação válida (accepted_at não null)
        const { data: acceptedSubmission } = await supabase
          .from('consent_submissions')
          .select('id, accepted_at')
          .eq('patient_id', patient.id)
          .not('accepted_at', 'is', null)
          .maybeSingle();

        // Se já aceitou, pular este paciente
        if (acceptedSubmission) continue;

        // Verificar se tem token pendente (sem accepted_at)
        const { data: pendingTokenData } = await supabase
          .from('consent_submissions')
          .select('id, created_at')
          .eq('patient_id', patient.id)
          .is('accepted_at', null)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();
        
        // Se tiver token pendente, adicionar à lista de aguardando resposta
        if (pendingTokenData) {
          patientsAwaiting.push(patient);
        } else {
          // Se não tiver token pendente e não aceitou, adicionar à lista de sem consentimento
          patientsToShow.push(patient);
        }
      }

      setPatientsWithoutConsent(patientsToShow);
      setPatientsAwaitingResponse(patientsAwaiting);
    } catch (error: any) {
      console.error('Error loading patients without consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelConsentLink = async () => {
    if (!patientId) return;

    const confirmed = confirm('Tem certeza que deseja cancelar o link de consentimento? O paciente não poderá mais usar o link atual.');
    if (!confirmed) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('consent_submissions')
        .delete()
        .eq('patient_id', patientId)
        .is('accepted_at', null);

      if (error) throw error;

      toast({
        title: 'Link cancelado',
        description: 'O link de consentimento foi cancelado com sucesso.',
      });

      // Recarregar lista e token pendente
      await loadPatientsWithoutConsent();
      await loadPendingToken();
    } catch (error: any) {
      console.error('Error canceling consent link:', error);
      toast({
        title: 'Erro ao cancelar',
        description: error.message || 'Não foi possível cancelar o link.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const sendConsentEmail = async (patient: PatientWithoutConsent, isResend: boolean = false) => {
    // Verificar se o paciente tem pelo menos um canal de comunicação
    // Para menores, priorizar telefone do responsável
    const contactPhone = patient.is_minor && patient.guardian_phone_1 ? patient.guardian_phone_1 : patient.phone;
    const hasEmail = patient.email && patient.email.trim() !== '';
    const hasPhone = contactPhone && contactPhone.trim() !== '';
    
    if (!hasEmail && !hasPhone) {
      const errorMsg = patient.is_minor 
        ? `O responsável do paciente ${patient.name} não possui email nem telefone cadastrado. Adicione pelo menos um contato antes de enviar o termo de consentimento.`
        : `O paciente ${patient.name} não possui email nem telefone cadastrado. Adicione pelo menos um contato antes de enviar o termo de consentimento.`;
      toast({
        title: 'Contato não cadastrado',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-consent-form', {
        body: {
          patientId: patient.id,
          cancelPrevious: isResend,
        },
      });

      if (error) throw error;

      // Mensagem dinâmica baseada nos canais utilizados
      let description = '';
      if (data?.emailSent && data?.whatsappSent) {
        description = isResend 
          ? `Novo termo enviado por email e WhatsApp para ${patient.name} (link anterior cancelado)`
          : `Termo enviado por email e WhatsApp para ${patient.name}`;
      } else if (data?.emailSent) {
        description = isResend 
          ? `Novo termo enviado por email para ${patient.name} (link anterior cancelado)`
          : `Termo enviado por email para ${patient.name}`;
      } else if (data?.whatsappSent) {
        description = isResend 
          ? `Novo termo enviado por WhatsApp para ${patient.name} (link anterior cancelado)`
          : `Termo enviado por WhatsApp para ${patient.name}`;
      } else {
        description = isResend 
          ? `Novo termo enviado para ${patient.name} (link anterior cancelado)`
          : `Termo enviado para ${patient.name}`;
      }

      toast({
        title: isResend ? 'Termo reenviado!' : 'Enviado com sucesso!',
        description,
      });

      // Recarregar lista e token pendente
      await loadPatientsWithoutConsent();
      if (patientId) {
        await loadPendingToken();
      }
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
      // Para menores, priorizar telefone do responsável
      const contactPhone = patient.is_minor && patient.guardian_phone_1 ? patient.guardian_phone_1 : patient.phone;
      const hasEmail = patient.email && patient.email.trim() !== '';
      const hasPhone = contactPhone && contactPhone.trim() !== '';
      
      if (!hasEmail && !hasPhone) {
        errorCount++;
        continue;
      }

      try {
        const { error } = await supabase.functions.invoke('send-consent-form', {
          body: {
            patientId: patient.id,
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

  const resendAllConsentEmails = async () => {
    if (patientsAwaitingResponse.length === 0) return;

    const confirmed = confirm(
      `Reenviar termo de consentimento para ${patientsAwaitingResponse.length} paciente(s) aguardando resposta? Os links anteriores serão cancelados.`
    );

    if (!confirmed) return;

    setSending(true);
    let successCount = 0;
    let errorCount = 0;

    for (const patient of patientsAwaitingResponse) {
      // Pular pacientes sem nenhum contato
      // Para menores, priorizar telefone do responsável
      const contactPhone = patient.is_minor && patient.guardian_phone_1 ? patient.guardian_phone_1 : patient.phone;
      const hasEmail = patient.email && patient.email.trim() !== '';
      const hasPhone = contactPhone && contactPhone.trim() !== '';
      
      if (!hasEmail && !hasPhone) {
        errorCount++;
        continue;
      }

      try {
        const { error } = await supabase.functions.invoke('send-consent-form', {
          body: {
            patientId: patient.id,
            cancelPrevious: true,
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
      title: 'Reenvio concluído',
      description: `${successCount} termo(s) reenviado(s) com sucesso. ${errorCount > 0 ? `${errorCount} erro(s).` : ''}`,
    });

    setSending(false);
    await loadPatientsWithoutConsent();
  };

  // Se for individual, verificar token pendente primeiro
  if (patientId) {
    if (loading || loadingToken) return null;
    
    // Se tem token pendente, mostrar card azul de aguardando resposta
    if (pendingToken) {
      const sentDate = new Date(pendingToken.created_at);
      const daysAgo = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Shield className="w-5 h-5" />
                  Termo de Consentimento - Aguardando Resposta
                </CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-500">
                  Termo enviado há {daysAgo} {daysAgo === 1 ? 'dia' : 'dias'}. Aguardando aceitação do paciente/responsável.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelConsentLink}
                  disabled={sending}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  title="Cancelar link de consentimento"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Cancelar Link'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const patientData = patientsWithoutConsent[0] || patientsAwaitingResponse[0];
                    if (patientData) {
                      sendConsentEmail(patientData, true);
                    }
                  }}
                  disabled={sending}
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  title="Cancelar link anterior e reenviar novo termo"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Reenviar Termo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      );
    }
    
    // Se não tem token pendente, verificar se precisa enviar
    if (patientsWithoutConsent.length === 0) return null;
    
    return (
      <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                Documentos Pendentes
              </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-500">
                Este paciente ainda não aceitou o termo de consentimento e política de privacidade
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-lg">
            <div>
              <p className="font-medium">{patientsWithoutConsent[0]?.name}</p>
              {(() => {
                const patient = patientsWithoutConsent[0];
                if (!patient) return null;
                
                // Para menores, priorizar telefone do responsável
                const contactPhone = patient.is_minor && patient.guardian_phone_1 
                  ? patient.guardian_phone_1 
                  : patient.phone;
                
                const recipientName = patient.is_minor && patient.guardian_name 
                  ? patient.guardian_name 
                  : patient.name;
                
                const hasEmail = patient.email && patient.email.trim() !== '';
                const hasPhone = contactPhone && contactPhone.trim() !== '';
                
                if (hasEmail && hasPhone) {
                  return (
                    <div>
                      <p className="text-sm text-muted-foreground">📧 {patient.email} | 📱 {contactPhone}</p>
                      {patient.is_minor && patient.guardian_name && (
                        <p className="text-xs text-muted-foreground">Será enviado para: {recipientName}</p>
                      )}
                    </div>
                  );
                } else if (hasEmail) {
                  return (
                    <div>
                      <p className="text-sm text-muted-foreground">📧 {patient.email}</p>
                      {patient.is_minor && patient.guardian_name && (
                        <p className="text-xs text-muted-foreground">Será enviado para: {recipientName}</p>
                      )}
                    </div>
                  );
                } else if (hasPhone) {
                  return (
                    <div>
                      <p className="text-sm text-muted-foreground">📱 {contactPhone}</p>
                      {patient.is_minor && patient.guardian_name && (
                        <p className="text-xs text-muted-foreground">Será enviado para: {recipientName}</p>
                      )}
                    </div>
                  );
                } else {
                  return <p className="text-sm text-red-600 dark:text-red-400">⚠️ Sem email ou telefone cadastrado</p>;
                }
              })()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendConsentEmail(patientsWithoutConsent[0])}
              disabled={sending || (!patientsWithoutConsent[0]?.email && !(patientsWithoutConsent[0]?.is_minor && patientsWithoutConsent[0]?.guardian_phone_1 ? patientsWithoutConsent[0]?.guardian_phone_1 : patientsWithoutConsent[0]?.phone))}
              title={(!patientsWithoutConsent[0]?.email && !(patientsWithoutConsent[0]?.is_minor && patientsWithoutConsent[0]?.guardian_phone_1 ? patientsWithoutConsent[0]?.guardian_phone_1 : patientsWithoutConsent[0]?.phone)) ? 'Paciente sem email ou telefone cadastrado' : undefined}
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
        </CardContent>
      </Card>
    );
  }

  // Lista geral de pacientes sem consentimento
  if (loading) return null;
  if (patientsWithoutConsent.length === 0 && patientsAwaitingResponse.length === 0) return null;

  return (
    <>
      {/* Card azul para pacientes aguardando resposta */}
      {patientsAwaitingResponse.length > 0 && (
        <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20 mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Shield className="w-5 h-5" />
                  Aguardando Resposta dos Termos de Consentimento
                </CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-500">
                  {patientsAwaitingResponse.length} paciente(s) com termo enviado aguardando aceitação
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resendAllConsentEmails}
                disabled={sending}
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Reenviar para Todos
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {patientsAwaitingResponse.map((patient) => (
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
                    onClick={() => sendConsentEmail(patient, true)}
                    disabled={sending || (!patient.email && !patient.phone)}
                    title={(!patient.email && !patient.phone) ? 'Paciente sem email ou telefone cadastrado' : 'Reenviar termo'}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card vermelho para pacientes sem termo enviado */}
      {patientsWithoutConsent.length > 0 && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              Termos de Consentimento Pendentes
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-500">
              {patientsWithoutConsent.length} paciente(s) sem termo de consentimento aceito
            </CardDescription>
          </div>
          {patientsWithoutConsent.length > 0 && (
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
        {(
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
      )}
    </>
  );
};
