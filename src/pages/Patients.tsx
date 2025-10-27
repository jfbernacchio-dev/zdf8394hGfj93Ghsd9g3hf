import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, FileText } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [showScheduled, setShowScheduled] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);
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

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    if (period === 'lastMonth') {
      // Último Mês: dia 01 ao 31 do mês anterior
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === 'last2Months') {
      // Últimos 2 Meses: do dia 01 do mês anterior até o dia 31 do mês atual
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      // 'all' - sem filtro de data
      start = new Date(0); // Início dos tempos
      end = new Date(9999, 11, 31); // Fim dos tempos
    }

    return { start, end };
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPatientStats = (patientId: string) => {
    const { start, end } = getDateRange();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let patientSessions = sessions.filter(s => s.patient_id === patientId);

    // Aplicar filtro "Mostrar Agendadas"
    if (showScheduled) {
      patientSessions = patientSessions.filter(s => {
        const sessionDate = parseISO(s.date);
        return sessionDate > now && s.status === 'scheduled';
      });
    } else {
      // Aplicar filtro de período apenas se não estiver mostrando agendadas
      patientSessions = patientSessions.filter(s => {
        const sessionDate = parseISO(s.date);
        return sessionDate >= start && sessionDate <= end && s.status === 'attended';
      });

      // Aplicar filtro "Mostrar A Pagar"
      if (showUnpaid) {
        patientSessions = patientSessions.filter(s => !s.paid);
      }
    }

    const unpaidSessions = patientSessions.filter(s => !s.paid);
    const total = patientSessions.reduce((sum, s) => sum + Number(s.value), 0);
    const unpaid = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
    return { totalSessions: patientSessions.length, totalValue: total, unpaidCount: unpaidSessions.length, unpaidValue: unpaid };
  };

  const generateGeneralInvoice = () => {
    const allUnpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
    
    if (allUnpaidSessions.length === 0) {
      toast({ 
        title: 'Nenhuma sessão em aberto', 
        description: 'Não há sessões para fechamento geral.',
        variant: 'destructive' 
      });
      return;
    }

    setAffectedSessions(allUnpaidSessions);
    
    // Group sessions by patient
    const sessionsByPatient: Record<string, any[]> = allUnpaidSessions.reduce((acc, session) => {
      if (!acc[session.patient_id]) {
        acc[session.patient_id] = [];
      }
      acc[session.patient_id].push(session);
      return acc;
    }, {} as Record<string, any[]>);

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
      invoiceText += `Valor unitário por sessão: R$ ${Number(patient.session_value).toFixed(2)}\n`;
      invoiceText += `Valor total: R$ ${totalValue.toFixed(2)}\n\n`;
      invoiceText += `_____________________________\n`;
      invoiceText += `Assinatura do Profissional\n\n`;
      invoiceText += `${'='.repeat(60)}\n\n`;
    });

    const grandTotal = allUnpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
    invoiceText += `TOTAL GERAL: R$ ${grandTotal.toFixed(2)}\n`;
    invoiceText += `Total de pacientes: ${Object.keys(sessionsByPatient).length}\n`;
    invoiceText += `Total de sessões: ${allUnpaidSessions.length}\n`;

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
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  <SelectItem value="lastMonth">Último Mês</SelectItem>
                  <SelectItem value="last2Months">Últimos 2 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filtros</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="showScheduled" 
                  checked={showScheduled} 
                  onCheckedChange={(checked) => {
                    setShowScheduled(!!checked);
                    if (checked) setShowUnpaid(false);
                  }}
                />
                <label
                  htmlFor="showScheduled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Mostrar Agendadas
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="invisible">Filtros</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="showUnpaid" 
                  checked={showUnpaid} 
                  onCheckedChange={(checked) => {
                    setShowUnpaid(!!checked);
                    if (checked) setShowScheduled(false);
                  }}
                />
                <label
                  htmlFor="showUnpaid"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Mostrar A Pagar
                </label>
              </div>
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg">
                      {patient.name.charAt(0).toUpperCase()}
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
                    <span className="font-medium text-warning">{stats.unpaidCount} (R$ {stats.unpaidValue.toFixed(2)})</span>
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
