import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, FileText, AlertCircle } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';

const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [isGeneralInvoiceOpen, setIsGeneralInvoiceOpen] = useState(false);
  const [generalInvoiceText, setGeneralInvoiceText] = useState('');
  const [affectedSessions, setAffectedSessions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
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
  });

  const getPatientStats = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const patientSessions = sessions.filter(s => s.patient_id === patientId && s.status === 'attended');
    const unpaidSessions = patientSessions.filter(s => !s.paid);
    
    // For monthly pricing, calculate by months instead of sessions
    if (patient?.monthly_price) {
      // Group unpaid sessions by month
      const unpaidByMonth = unpaidSessions.reduce((acc, session) => {
        const monthYear = format(parseISO(session.date), 'MM/yyyy');
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(session);
        return acc;
      }, {} as Record<string, any[]>);
      
      const unpaidMonthsCount = Object.keys(unpaidByMonth).length;
      const unpaidValue = unpaidMonthsCount * Number(patient.session_value);
      
      // Group all sessions by month
      const totalByMonth = patientSessions.reduce((acc, session) => {
        const monthYear = format(parseISO(session.date), 'MM/yyyy');
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(session);
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

    // Filter out patients with monthly_price=true or no_nfse=true
    const eligiblePatients: any[] = [];
    const excludedPatients: any[] = [];

    Object.keys(sessionsByPatient).forEach(patientId => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        if (patient.monthly_price || patient.no_nfse) {
          excludedPatients.push(patient);
        } else {
          eligiblePatients.push({ patient, sessions: sessionsByPatient[patientId] });
        }
      }
    });

    // Show confirmation dialog
    const confirmMessage = eligiblePatients.length > 0
      ? `Serão emitidas notas fiscais para ${eligiblePatients.length} paciente(s). ${excludedPatients.length > 0 ? `${excludedPatients.length} paciente(s) serão excluídos (mensais ou sem emissão de nota).` : ''}\n\nDeseja continuar?`
      : `Todos os ${excludedPatients.length} paciente(s) com sessões em aberto estão marcados como mensais ou sem emissão de nota.`;

    if (eligiblePatients.length === 0) {
      // No eligible patients, show text generation option
      setAffectedSessions(allUnpaidSessions);
      generateInvoiceText(sessionsByPatient);
      return;
    }

    if (!confirm(confirmMessage)) {
      // User cancelled, offer text generation
      setAffectedSessions(allUnpaidSessions);
      generateInvoiceText(sessionsByPatient);
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

    loadData();
  };

  const generateInvoiceText = (sessionsByPatient: Record<string, any[]>) => {
    let invoiceText = `FECHAMENTO GERAL DE SESSÕES\n\n`;
    invoiceText += `${'='.repeat(60)}\n\n`;

    Object.entries(sessionsByPatient).forEach(([patientId, patientSessions]) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const totalValue = patientSessions.reduce((sum, s) => sum + Number(s.value), 0);
      const sessionDates = patientSessions.map(s => format(parseISO(s.date), 'dd/MM/yyyy')).join(' ; ');

      invoiceText += `PACIENTE: ${patient.name}\n`;
      invoiceText += `CPF: ${patient.cpf}\n\n`;
      invoiceText += `Profissional: ${userProfile?.full_name || ''}\n`;
      invoiceText += `CPF: ${userProfile?.cpf || ''}\n`;
      invoiceText += `CRP: ${userProfile?.crp || ''}\n\n`;
      invoiceText += `Sessões realizadas nas datas: ${sessionDates}\n`;
      invoiceText += `Quantidade de sessões: ${patientSessions.length}\n`;
      invoiceText += `Valor unitário por sessão: ${formatBrazilianCurrency(patient.session_value)}\n`;
      invoiceText += `Valor total: ${formatBrazilianCurrency(totalValue)}\n\n`;
      invoiceText += `_____________________________\n`;
      invoiceText += `Assinatura do Profissional\n\n`;
      invoiceText += `${'='.repeat(60)}\n\n`;
    });

    const grandTotal = affectedSessions.reduce((sum, s) => sum + Number(s.value), 0);
    invoiceText += `TOTAL GERAL: ${formatBrazilianCurrency(grandTotal)}\n`;
    invoiceText += `Total de pacientes: ${Object.keys(sessionsByPatient).length}\n`;
    invoiceText += `Total de sessões: ${affectedSessions.length}\n`;

    setGeneralInvoiceText(invoiceText);
    setIsGeneralInvoiceOpen(true);
  };

  const markAllSessionsAsPaid = async () => {
    const sessionIds = affectedSessions.map(s => s.id);
    
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
      description: `${sessionIds.length} sessão(ões) marcada(s) como paga(s).` 
    });
    
    setIsGeneralInvoiceOpen(false);
    loadData();
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
            <Button onClick={() => navigate('/patients/new')} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
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
                    <div>
                      <h3 className="font-semibold text-foreground">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
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
                        // For monthly pricing, show number of months
                        const sessionsByMonth = sessions.filter(s => s.patient_id === patient.id && s.status === 'attended' && !s.paid).reduce((acc, session) => {
                          const monthYear = format(parseISO(session.date), 'MM/yyyy');
                          if (!acc[monthYear]) {
                            acc[monthYear] = [];
                          }
                          acc[monthYear].push(session);
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
      </div>
  );
};

export default Patients;
