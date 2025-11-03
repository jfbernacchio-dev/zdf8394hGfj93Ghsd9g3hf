import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, FileText, AlertCircle, CheckCheck } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { ConsentReminder } from '@/components/ConsentReminder';

const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [isGeneralInvoiceOpen, setIsGeneralInvoiceOpen] = useState(false);
  const [generalInvoiceText, setGeneralInvoiceText] = useState('');
  const [affectedSessions, setAffectedSessions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);
  const [duplicatesReport, setDuplicatesReport] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user!.id);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*');

    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profileData);
    }

    setPatients(patientsData || []);
    setSessions(sessionsData || []);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    
    if (!showOnlyUnpaid) return matchesSearch;
    
    // Se showOnlyUnpaid estiver ativo, filtrar apenas pacientes com sessões não pagas
    const stats = getPatientStats(p.id);
    return matchesSearch && stats.unpaidCount > 0;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const getPatientStats = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const patientSessions = sessions.filter(s => s.patient_id === patientId && s.status === 'attended');
    const unpaidSessions = patientSessions.filter(s => !s.paid);
    
    // For monthly pricing, calculate by months instead of sessions
    if (patient?.monthly_price) {
      // Group unpaid sessions by month - with date validation
      const unpaidByMonth = unpaidSessions.reduce((acc, session) => {
        try {
          if (session.date) {
            const monthYear = format(parseISO(session.date), 'MM/yyyy');
            if (!acc[monthYear]) {
              acc[monthYear] = [];
            }
            acc[monthYear].push(session);
          }
        } catch (error) {
          console.error('Error parsing session date:', session.date, error);
        }
        return acc;
      }, {} as Record<string, any[]>);
      
      const unpaidMonthsCount = Object.keys(unpaidByMonth).length;
      const unpaidValue = unpaidMonthsCount * Number(patient.session_value);
      
      // Group all sessions by month - with date validation
      const totalByMonth = patientSessions.reduce((acc, session) => {
        try {
          if (session.date) {
            const monthYear = format(parseISO(session.date), 'MM/yyyy');
            if (!acc[monthYear]) {
              acc[monthYear] = [];
            }
            acc[monthYear].push(session);
          }
        } catch (error) {
          console.error('Error parsing session date:', session.date, error);
        }
        return acc;
      }, {} as Record<string, any[]>);
      
      const totalMonthsCount = Object.keys(totalByMonth).length;
      const totalValue = totalMonthsCount * Number(patient.session_value);
      
      return { 
        totalSessions: patientSessions.length, 
        totalValue, 
        unpaidCount: unpaidSessions.length, 
        unpaidValue 
      };
    }
    
    // For per-session pricing
    const total = patientSessions.reduce((sum, s) => sum + Number(s.value), 0);
    const unpaid = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
    return { totalSessions: patientSessions.length, totalValue: total, unpaidCount: unpaidSessions.length, unpaidValue: unpaid };
  };

  const generateGeneralInvoice = async () => {
    const allUnpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
    
    if (allUnpaidSessions.length === 0) {
      toast({ 
        title: 'Nenhuma sessão em aberto', 
        description: 'Não há sessões para fechamento geral.',
        variant: 'destructive' 
      });
      return;
    }

    // Group sessions by patient
    const sessionsByPatient: Record<string, any[]> = allUnpaidSessions.reduce((acc, session) => {
      if (!acc[session.patient_id]) {
        acc[session.patient_id] = [];
      }
      acc[session.patient_id].push(session);
      return acc;
    }, {} as Record<string, any[]>);

    // Filter patients by eligibility for NFSe
    const eligiblePatients: any[] = [];
    const textOnlyPatients: any[] = [];

    Object.keys(sessionsByPatient).forEach(patientId => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        if (patient.monthly_price || patient.no_nfse) {
          textOnlyPatients.push({ patient, sessions: sessionsByPatient[patientId] });
        } else {
          eligiblePatients.push({ patient, sessions: sessionsByPatient[patientId] });
        }
      }
    });

    // If no eligible patients for NFSe, show text for all patients
    if (eligiblePatients.length === 0) {
      setAffectedSessions(allUnpaidSessions);
      generateInvoiceText(sessionsByPatient);
      return;
    }

    // Show confirmation dialog for NFSe issuance
    const confirmMessage = `Serão emitidas notas fiscais para ${eligiblePatients.length} paciente(s). ${textOnlyPatients.length > 0 ? `${textOnlyPatients.length} paciente(s) serão excluídos (mensais ou sem emissão de nota).` : ''}\n\nDeseja continuar?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Issue NFSe for eligible patients
    toast({
      title: 'Emitindo notas fiscais',
      description: `Iniciando emissão de ${eligiblePatients.length} nota(s)...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const { patient, sessions: patientSessions } of eligiblePatients) {
      try {
        const sessionIds = patientSessions.map(s => s.id);
        
        const { error } = await supabase.functions.invoke('issue-nfse', {
          body: {
            patientId: patient.id,
            sessionIds,
          },
        });

        if (error) {
          console.error(`Error issuing NFSe for ${patient.name}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error issuing NFSe for ${patient.name}:`, error);
        errorCount++;
      }
    }

    toast({
      title: 'Emissão concluída',
      description: `${successCount} nota(s) emitida(s) com sucesso. ${errorCount > 0 ? `${errorCount} erro(s).` : ''}`,
    });

    // After NFSe issuance, if there are text-only patients, show their invoice
    if (textOnlyPatients.length > 0) {
      const textOnlySessions = textOnlyPatients.flatMap(p => p.sessions);
      const textOnlySessionsByPatient = textOnlyPatients.reduce((acc, { patient, sessions: patientSessions }) => {
        acc[patient.id] = patientSessions;
        return acc;
      }, {} as Record<string, any[]>);
      
      setAffectedSessions(textOnlySessions);
      generateInvoiceText(textOnlySessionsByPatient);
    }

    loadData();
  };

  const generateInvoiceText = (sessionsByPatient: Record<string, any[]>) => {
    let invoiceText = `FECHAMENTO GERAL DE SESSÕES\n\n`;
    invoiceText += `${'='.repeat(60)}\n\n`;
    let grandTotal = 0;

    Object.entries(sessionsByPatient).forEach(([patientId, patientSessions]) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const sessionDates = patientSessions.map(s => format(parseISO(s.date), 'dd/MM/yyyy')).join(' ; ');
      
      let totalValue: number;
      let valueDescription: string;
      
      if (patient.monthly_price) {
        // For monthly pricing, calculate by number of months
        const sessionsByMonth = patientSessions.reduce((acc, session) => {
          const monthYear = format(parseISO(session.date), 'MM/yyyy');
          if (!acc[monthYear]) {
            acc[monthYear] = [];
          }
          acc[monthYear].push(session);
          return acc;
        }, {} as Record<string, any[]>);
        
        const monthsCount = Object.keys(sessionsByMonth).length;
        totalValue = monthsCount * Number(patient.session_value);
        valueDescription = `Valor mensal: ${formatBrazilianCurrency(patient.session_value)}\nNúmero de meses: ${monthsCount}`;
      } else {
        // For per-session pricing
        totalValue = patientSessions.reduce((sum, s) => sum + Number(s.value), 0);
        valueDescription = `Valor unitário por sessão: ${formatBrazilianCurrency(patient.session_value)}`;
      }
      
      grandTotal += totalValue;

      invoiceText += `PACIENTE: ${patient.name}\n`;
      invoiceText += `CPF: ${patient.cpf}\n\n`;
      invoiceText += `Profissional: ${userProfile?.full_name || ''}\n`;
      invoiceText += `CPF: ${userProfile?.cpf || ''}\n`;
      invoiceText += `CRP: ${userProfile?.crp || ''}\n\n`;
      invoiceText += `Sessões realizadas nas datas: ${sessionDates}\n`;
      invoiceText += `Quantidade de sessões: ${patientSessions.length}\n`;
      invoiceText += `${valueDescription}\n`;
      invoiceText += `Valor total: ${formatBrazilianCurrency(totalValue)}\n\n`;
      invoiceText += `_____________________________\n`;
      invoiceText += `Assinatura do Profissional\n\n`;
      invoiceText += `${'='.repeat(60)}\n\n`;
    });

    invoiceText += `TOTAL GERAL: ${formatBrazilianCurrency(grandTotal)}\n`;
    invoiceText += `Total de pacientes: ${Object.keys(sessionsByPatient).length}\n`;
    invoiceText += `Total de sessões: ${affectedSessions.length}\n`;

    setGeneralInvoiceText(invoiceText);
    setIsGeneralInvoiceOpen(true);
  };

  const markAllSessionsAsPaid = async () => {
    const sessionIds = affectedSessions.map(s => s.id);
    const totalValue = affectedSessions.reduce((sum, s) => sum + Number(s.value), 0);
    
    // Save invoice log
    const { error: logError } = await supabase
      .from('invoice_logs')
      .insert({
        user_id: user!.id,
        invoice_text: generalInvoiceText,
        session_ids: sessionIds,
        patient_count: new Set(affectedSessions.map(s => s.patient_id)).size,
        total_sessions: sessionIds.length,
        total_value: totalValue
      });

    if (logError) {
      console.error('Error saving invoice log:', logError);
      toast({ title: 'Erro ao salvar log', variant: 'destructive' });
      return;
    }
    
    const { error } = await supabase
      .from('sessions')
      .update({ paid: true })
      .in('id', sessionIds);

    if (error) {
      toast({ title: 'Erro ao atualizar sessões', variant: 'destructive' });
      return;
    }

    toast({ 
      title: 'Sessões atualizadas!', 
      description: `${sessionIds.length} sessão(ões) marcada(s) como paga(s). Log salvo com sucesso.` 
    });
    
    setIsGeneralInvoiceOpen(false);
    loadData();
  };

  const checkDuplicates = async () => {
    toast({
      title: 'Verificando duplicidades',
      description: 'Analisando todas as sessões...',
    });

    // Fetch all sessions from all patients
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('*, patients!inner(name, user_id)')
      .eq('patients.user_id', user!.id);

    if (!allSessions || allSessions.length === 0) {
      toast({
        title: 'Nenhuma sessão encontrada',
        description: 'Não há sessões para verificar.',
      });
      return;
    }

    // Group sessions by patient_id + date + time
    const sessionsMap = new Map<string, any[]>();

    allSessions.forEach(session => {
      const key = `${session.patient_id}_${session.date}_${session.time}`;
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, []);
      }
      sessionsMap.get(key)!.push(session);
    });

    // Find duplicates (groups with more than 1 session)
    const duplicates: any[] = [];

    sessionsMap.forEach((sessionGroup, key) => {
      if (sessionGroup.length > 1) {
        const [patientId, date, time] = key.split('_');
        const patient = patients.find(p => p.id === patientId);
        
        duplicates.push({
          patientName: patient?.name || 'Desconhecido',
          patientId,
          date,
          time,
          sessions: sessionGroup,
          count: sessionGroup.length,
        });
      }
    });

    setDuplicatesReport(duplicates);
    setIsDuplicatesDialogOpen(true);

    if (duplicates.length === 0) {
      toast({
        title: 'Nenhuma duplicidade encontrada',
        description: 'Todas as sessões estão únicas!',
      });
    } else {
      toast({
        title: 'Duplicidades encontradas',
        description: `${duplicates.length} caso(s) de sessões duplicadas detectado(s).`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">Pacientes</h1>
              <p className="text-sm md:text-base text-muted-foreground">Gerencie seus pacientes</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateGeneralInvoice} variant="outline" className="w-full sm:w-auto">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Fazer Fechamento Geral</span>
              <span className="sm:hidden">Fechamento</span>
            </Button>
            <Button onClick={checkDuplicates} variant="outline" className="w-full sm:w-auto">
              <CheckCheck className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Checar Duplicidades</span>
              <span className="sm:hidden">Duplicidades</span>
            </Button>
            <Button onClick={() => navigate('/patients/new')} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>

        {/* Card de alerta de termos de consentimento pendentes */}
        <div className="mb-6">
          <ConsentReminder />
        </div>

        <Card className="p-4 mb-6 shadow-[var(--shadow-card)] border-border">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showOnlyUnpaid"
                checked={showOnlyUnpaid}
                onChange={(e) => setShowOnlyUnpaid(e.target.checked)}
                className="h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="showOnlyUnpaid"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Mostrar apenas em aberto
              </label>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPatients.map(patient => {
            const stats = getPatientStats(patient.id);
            return (
              <Card key={patient.id} className="p-6 shadow-[var(--shadow-card)] border-border hover:shadow-[var(--shadow-soft)] transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg relative">
                      {patient.name.charAt(0).toUpperCase()}
                      {(!patient.cpf || patient.cpf.trim() === '') && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full flex items-center justify-center" title="CPF não informado">
                          <AlertCircle className="w-3 h-3 text-warning-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{patient.name}</h3>
                        {patient.status === 'inactive' && (
                          <span className="px-2 py-0.5 bg-destructive/10 text-destructive/70 text-xs font-medium rounded">
                            Encerrado
                          </span>
                        )}
                      </div>
                      {patient.email && (
                        <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
                      )}
                      {patient.observations && (
                        <p className="text-xs text-muted-foreground/80 truncate mt-1" title={patient.observations}>
                          {patient.observations}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}/edit`); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sessões:</span>
                    <span className="font-medium text-foreground">{stats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Em Aberto:</span>
                    <span className="font-medium text-warning">
                      {patient.monthly_price ? (() => {
                        // For monthly pricing, show number of months - with date validation
                        const sessionsByMonth = sessions.filter(s => s.patient_id === patient.id && s.status === 'attended' && !s.paid).reduce((acc, session) => {
                          try {
                            if (session.date) {
                              const monthYear = format(parseISO(session.date), 'MM/yyyy');
                              if (!acc[monthYear]) {
                                acc[monthYear] = [];
                              }
                              acc[monthYear].push(session);
                            }
                          } catch (error) {
                            console.error('Error parsing session date:', session.date, error);
                          }
                          return acc;
                        }, {} as Record<string, any[]>);
                        const monthsCount = Object.keys(sessionsByMonth).length;
                        return `${monthsCount} ${monthsCount === 1 ? 'mês' : 'meses'} (${formatBrazilianCurrency(stats.unpaidValue)})`;
                      })() : `${stats.unpaidCount} (${formatBrazilianCurrency(stats.unpaidValue)})`}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum paciente encontrado</p>
          </div>
        )}

        <Dialog open={isGeneralInvoiceOpen} onOpenChange={setIsGeneralInvoiceOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Fechamento Geral de Sessões</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={generalInvoiceText}
                readOnly
                rows={20}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={markAllSessionsAsPaid} className="flex-1">
                  Dar Baixa em Todas as Sessões
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(generalInvoiceText);
                    toast({ title: 'Texto copiado!' });
                  }}
                  className="flex-1"
                >
                  Copiar Texto
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Relatório de Duplicidades */}
        <Dialog open={isDuplicatesDialogOpen} onOpenChange={setIsDuplicatesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Relatório de Sessões Duplicadas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {duplicatesReport.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCheck className="w-12 h-12 mx-auto text-success mb-2" />
                  <p className="text-muted-foreground">Nenhuma duplicidade encontrada!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-warning-foreground">
                      {duplicatesReport.length} caso(s) de duplicidade encontrado(s)
                    </p>
                  </div>
                  
                  {duplicatesReport.map((duplicate, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{duplicate.patientName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Data: {format(parseISO(duplicate.date), 'dd/MM/yyyy')} às {duplicate.time}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-warning/20 text-warning-foreground text-xs font-medium rounded">
                            {duplicate.count}x duplicada
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Sessões duplicadas:</p>
                          {duplicate.sessions.map((session: any) => (
                            <div key={session.id} className="text-xs bg-muted/50 p-2 rounded space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ID da Sessão:</span>
                                <span className="font-mono">{session.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={session.status === 'attended' ? 'text-success' : ''}>
                                  {session.status === 'attended' ? 'Compareceu' : 
                                   session.status === 'missed' ? 'Faltou' : 'Agendado'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Pago:</span>
                                <span>{session.paid ? 'Sim' : 'Não'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor:</span>
                                <span>{formatBrazilianCurrency(session.value)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Ação necessária:</strong> Revise manualmente cada caso e exclua as sessões duplicadas usando o botão de lixeira no detalhe de cada paciente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default Patients;
