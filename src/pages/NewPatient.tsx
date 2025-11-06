import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ArrowLeft, CalendarIcon } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showBreakWarning, setShowBreakWarning] = useState(false);
  const [breakWarningDetails, setBreakWarningDetails] = useState('');
  const [pendingSessionData, setPendingSessionData] = useState<any[]>([]);
  const [pendingPatientData, setPendingPatientData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birthDate: '',
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'twice_weekly',
    sessionDay: 'monday' as string,
    sessionTime: '',
    sessionDay2: 'thursday' as string,
    sessionTime2: '',
    sessionValue: '',
    startDate: '',
    lgpdConsent: false,
    noNfse: false,
    monthlyPrice: false,
    nfseNumberOfInvoices: 1,
    nfseMaxSessionsPerInvoice: 20,
    isMinor: false,
    guardianName: '',
    guardianCpf: '',
    guardianName2: '',
    guardianCpf2: '',
    guardianPhone1: '',
    guardianPhone2: '',
    nfseIssueTo: 'patient' as 'patient' | 'guardian',
    includeMinorText: false,
    hideSecondSessionFromSchedule: false,
    hideFromSchedule: false,
    observations: '',
    useAlternateNfseContact: false,
    nfseAlternateEmail: '',
    nfseAlternatePhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      // Check for duplicate CPF if CPF is provided and noNfse is false
      if (formData.cpf && !formData.noNfse) {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('cpf', formData.cpf)
          .maybeSingle();

        if (existingPatient) {
          toast({
            title: 'CPF já cadastrado',
            description: `Já existe um paciente com este CPF: ${existingPatient.name}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Check for duplicate guardian CPF if minor and guardian CPF provided
      if (formData.isMinor && formData.guardianCpf && formData.nfseIssueTo === 'guardian') {
        const { data: existingGuardian } = await supabase
          .from('patients')
          .select('id, name, guardian_name')
          .eq('user_id', user.id)
          .eq('guardian_cpf', formData.guardianCpf)
          .maybeSingle();

        if (existingGuardian) {
          toast({
            title: 'CPF do responsável já cadastrado',
            description: `Este CPF já está cadastrado para o responsável de: ${existingGuardian.name}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Get user profile to check break time settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('slot_duration, break_time')
        .eq('id', user.id)
        .single();

      const slotDuration = profile?.slot_duration || 60;
      const breakTime = profile?.break_time || 15;
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          cpf: formData.cpf || null,
          birth_date: formData.birthDate || null,
          frequency: formData.frequency || 'weekly',
          session_day: formData.sessionDay || null,
          session_time: formData.sessionTime || null,
          session_day_2: formData.frequency === 'twice_weekly' ? (formData.sessionDay2 || null) : null,
          session_time_2: formData.frequency === 'twice_weekly' ? (formData.sessionTime2 || null) : null,
          session_value: parseFloat(formData.sessionValue),
          start_date: formData.startDate || null,
          lgpd_consent_date: formData.lgpdConsent ? new Date().toISOString() : null,
          no_nfse: formData.noNfse,
          monthly_price: formData.monthlyPrice,
          nfse_number_of_invoices: formData.nfseNumberOfInvoices,
          nfse_max_sessions_per_invoice: formData.nfseMaxSessionsPerInvoice,
          is_minor: formData.isMinor,
          guardian_name: formData.isMinor ? (formData.guardianName || null) : null,
          guardian_cpf: formData.isMinor ? (formData.guardianCpf || null) : null,
          guardian_name_2: formData.isMinor ? (formData.guardianName2 || null) : null,
          guardian_cpf_2: formData.isMinor ? (formData.guardianCpf2 || null) : null,
          guardian_phone_1: formData.isMinor ? (formData.guardianPhone1 || null) : null,
          guardian_phone_2: formData.isMinor ? (formData.guardianPhone2 || null) : null,
          nfse_issue_to: formData.isMinor ? formData.nfseIssueTo : 'patient',
          include_minor_text: formData.isMinor && formData.nfseIssueTo === 'guardian' ? formData.includeMinorText : false,
          hide_second_session_from_schedule: formData.frequency === 'twice_weekly' ? formData.hideSecondSessionFromSchedule : false,
          hide_from_schedule: formData.hideFromSchedule,
          observations: formData.observations || null,
          use_alternate_nfse_contact: formData.useAlternateNfseContact,
          nfse_alternate_email: formData.useAlternateNfseContact ? (formData.nfseAlternateEmail || null) : null,
          nfse_alternate_phone: formData.useAlternateNfseContact ? (formData.nfseAlternatePhone || null) : null,
          status: 'active',
        })
        .select()
        .single();

      if (patientError) throw patientError;

      let sessionsCount = 0;

      // Generate sessions based on frequency
      if (formData.startDate && formData.sessionDay && formData.sessionTime) {
        let sessionData: { date: string; status: string; time?: string }[] = [];
        
        if (formData.frequency === 'twice_weekly' && formData.sessionDay2 && formData.sessionTime2) {
          // Generate 8 weeks of twice-weekly sessions (16 sessions total)
          const { generateTwiceWeeklySessions } = await import('@/lib/sessionUtils');
          sessionData = generateTwiceWeeklySessions(
            formData.startDate,
            formData.sessionDay,
            formData.sessionTime,
            formData.sessionDay2,
            formData.sessionTime2,
            8
          );
        } else if (formData.frequency !== 'twice_weekly') {
          // Generate 8 sessions for weekly/biweekly
          const { generateRecurringSessions } = await import('@/lib/sessionUtils');
          sessionData = generateRecurringSessions(
            formData.startDate,
            formData.sessionDay,
            formData.sessionTime,
            formData.frequency as 'weekly' | 'biweekly',
            8
          );
        }

        // Check for break time conflicts with existing sessions
        let hasBreakConflict = false;
        let conflictDetails = '';
        
        for (const newSession of sessionData) {
          const sessionTime = newSession.time || formData.sessionTime;
          
          // Fetch existing sessions on the same date
          const { data: existingSessions } = await supabase
            .from('sessions')
            .select('*, patients!inner(*)')
            .eq('patients.user_id', user.id)
            .eq('date', newSession.date);
          
          // Check if any session conflicts
          const conflict = existingSessions?.some(s => {
            const otherTime = s.time || s.patients?.session_time;
            if (!otherTime) return false;
            
            const [sessionHour, sessionMin] = sessionTime.split(':').map(Number);
            const [otherHour, otherMin] = otherTime.split(':').map(Number);
            const sessionMinutes = sessionHour * 60 + sessionMin;
            const otherMinutes = otherHour * 60 + otherMin;
            
            const gap = Math.abs(sessionMinutes - otherMinutes);
            if (gap === 0) return false; // Same time
            
            return gap < (slotDuration + breakTime);
          });
          
          if (conflict) {
            hasBreakConflict = true;
            conflictDetails = `Conflito detectado em ${format(new Date(newSession.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })} às ${sessionTime}`;
            break;
          }
        }
        
        if (hasBreakConflict) {
          setBreakWarningDetails(`${conflictDetails}. As sessões precisam de ${breakTime} minutos de descanso entre elas (duração da sessão: ${slotDuration}min).`);
          setPendingSessionData(sessionData);
          setPendingPatientData(patient);
          setShowBreakWarning(true);
          return;
        }

        // Create sessions - use function to allow confirmation override
        await createSessionsForPatient(patient, sessionData);
      }

      navigate('/patients');
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar paciente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createSessionsForPatient = async (patient: any, sessionData: any[]) => {
    let sessionsCount = 0;
    
    if (sessionData.length > 0) {
      const sessionsToInsert = sessionData.map(({ date, status, time, isSecondSession }) => ({
        patient_id: patient.id,
        date,
        status,
        value: parseFloat(formData.sessionValue),
        paid: false,
        time: time || formData.sessionTime,
        show_in_schedule: !formData.hideFromSchedule && !(isSecondSession && formData.hideSecondSessionFromSchedule),
      }));

      const { error: sessionsError } = await supabase
        .from('sessions')
        .insert(sessionsToInsert);

      if (sessionsError) throw sessionsError;
      sessionsCount = sessionsToInsert.length;
    }

    toast({
      title: "Paciente cadastrado!",
      description: sessionsCount > 0 
        ? `O paciente foi adicionado com ${sessionsCount} sessões geradas.`
        : "O paciente foi adicionado. Você pode adicionar os dados de agendamento depois.",
    });
  };

  const confirmWithoutBreak = async () => {
    try {
      await createSessionsForPatient(pendingPatientData, pendingSessionData);
      setShowBreakWarning(false);
      navigate('/patients');
    } catch (error: any) {
      toast({
        title: "Erro ao criar sessões",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Helper to get Brazil date
  const getBrazilDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format time for display (24h format)
  const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    return time; // Already in HH:mm format
  };

  return (
    <>
      <AlertDialog open={showBreakWarning} onOpenChange={setShowBreakWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conflito de Horário Detectado</AlertDialogTitle>
            <AlertDialogDescription>
              {breakWarningDetails}
              <br /><br />
              Deseja continuar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmWithoutBreak}>
              Continuar Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/patients')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Card className="p-8 shadow-[var(--shadow-card)] border-border">
            <h1 className="text-2xl font-bold text-foreground mb-6">Novo Paciente</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useAlternateNfseContact"
                checked={formData.useAlternateNfseContact}
                onChange={(e) => setFormData({ ...formData, useAlternateNfseContact: e.target.checked })}
                className="cursor-pointer"
              />
              <Label htmlFor="useAlternateNfseContact" className="cursor-pointer">
                Encaminhar NFSe para Outro Contato
              </Label>
            </div>

            {formData.useAlternateNfseContact && (
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="nfseAlternateEmail">Email para NFSe</Label>
                  <Input
                    id="nfseAlternateEmail"
                    type="text"
                    value={formData.nfseAlternateEmail}
                    onChange={(e) => setFormData({ ...formData, nfseAlternateEmail: e.target.value })}
                    placeholder="exemplo@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nfseAlternatePhone">Telefone para NFSe</Label>
                  <Input
                    id="nfseAlternatePhone"
                    type="tel"
                    value={formData.nfseAlternatePhone}
                    onChange={(e) => setFormData({ ...formData, nfseAlternatePhone: e.target.value })}
                    placeholder="Telefone alternativo para receber NFSe"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF {!formData.noNfse && (!formData.isMinor || formData.nfseIssueTo === 'patient') ? '*' : ''}
                </Label>
                <Input
                  id="cpf"
                  required={!formData.noNfse && (!formData.isMinor || formData.nfseIssueTo === 'patient')}
                  value={formData.cpf}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    let formatted = value;
                    if (value.length > 3) formatted = value.slice(0, 3) + '.' + value.slice(3);
                    if (value.length > 6) formatted = formatted.slice(0, 7) + '.' + value.slice(6);
                    if (value.length > 9) formatted = formatted.slice(0, 11) + '-' + value.slice(9);
                    setFormData({ ...formData, cpf: formatted });
                  }}
                  maxLength={14}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthDate ? (() => {
                        const [year, month, day] = formData.birthDate.split('-').map(Number);
                        return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
                      })() : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birthDate ? (() => {
                        const [year, month, day] = formData.birthDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setFormData({ 
                            ...formData, 
                            birthDate: `${year}-${month}-${day}`
                          });
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Campos para Paciente Menor de Idade */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMinor"
                  checked={formData.isMinor}
                  onChange={(e) => setFormData({ ...formData, isMinor: e.target.checked })}
                  className="cursor-pointer"
                />
                <Label htmlFor="isMinor" className="cursor-pointer font-semibold">
                  Paciente Menor de Idade
                </Label>
              </div>

              {formData.isMinor && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Para pacientes menores de idade, o email e dados abaixo devem ser do responsável legal.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Nome do Responsável Legal *</Label>
                    <Input
                      id="guardianName"
                      required={formData.isMinor}
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      placeholder="Nome completo do responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianCpf">
                      CPF do Responsável Legal {!formData.noNfse && formData.nfseIssueTo === 'guardian' ? '*' : ''}
                    </Label>
                    <Input
                      id="guardianCpf"
                      required={!formData.noNfse && formData.isMinor && formData.nfseIssueTo === 'guardian'}
                      value={formData.guardianCpf}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        let formatted = value;
                        if (value.length > 3) formatted = value.slice(0, 3) + '.' + value.slice(3);
                        if (value.length > 6) formatted = formatted.slice(0, 7) + '.' + value.slice(6);
                        if (value.length > 9) formatted = formatted.slice(0, 11) + '-' + value.slice(9);
                        setFormData({ ...formData, guardianCpf: formatted });
                      }}
                      maxLength={14}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone1">Telefone do Responsável Legal 1</Label>
                      <Input
                        id="guardianPhone1"
                        value={formData.guardianPhone1}
                        onChange={(e) => setFormData({ ...formData, guardianPhone1: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone2">Telefone do Responsável Legal 2</Label>
                      <Input
                        id="guardianPhone2"
                        value={formData.guardianPhone2}
                        onChange={(e) => setFormData({ ...formData, guardianPhone2: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianName2">Nome do Responsável Legal 2</Label>
                    <Input
                      id="guardianName2"
                      value={formData.guardianName2}
                      onChange={(e) => setFormData({ ...formData, guardianName2: e.target.value })}
                      placeholder="Nome completo do segundo responsável (opcional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianCpf2">CPF do Responsável Legal 2</Label>
                    <Input
                      id="guardianCpf2"
                      value={formData.guardianCpf2}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        let formatted = value;
                        if (value.length > 3) formatted = value.slice(0, 3) + '.' + value.slice(3);
                        if (value.length > 6) formatted = formatted.slice(0, 7) + '.' + value.slice(6);
                        if (value.length > 9) formatted = formatted.slice(0, 11) + '-' + value.slice(9);
                        setFormData({ ...formData, guardianCpf2: formatted });
                      }}
                      maxLength={14}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  {/* NFSe Issue Options */}
                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-sm font-semibold">Emissão de Nota Fiscal</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="nfsePatient"
                          name="nfseIssueTo"
                          value="patient"
                          checked={formData.nfseIssueTo === 'patient'}
                          onChange={(e) => setFormData({ ...formData, nfseIssueTo: 'patient' })}
                          disabled={formData.noNfse}
                          className="cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Label 
                          htmlFor="nfsePatient" 
                          className={cn(
                            "cursor-pointer text-sm",
                            formData.noNfse && "text-muted-foreground"
                          )}
                        >
                          Emitir Nota em Nome do Paciente
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="nfseGuardian"
                          name="nfseIssueTo"
                          value="guardian"
                          checked={formData.nfseIssueTo === 'guardian'}
                          onChange={(e) => setFormData({ ...formData, nfseIssueTo: 'guardian' })}
                          disabled={formData.noNfse}
                           className="cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Label 
                          htmlFor="nfseGuardian" 
                          className={cn(
                            "cursor-pointer text-sm",
                            formData.noNfse && "text-muted-foreground"
                          )}
                        >
                          Emitir Nota em Nome do Responsável
                        </Label>
                      </div>

                      {/* Conditional checkbox for minor text */}
                      {formData.nfseIssueTo === 'guardian' && (
                        <div className="ml-6 mt-2 p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="includeMinorText"
                              checked={formData.includeMinorText}
                              onChange={(e) => setFormData({ ...formData, includeMinorText: e.target.checked })}
                              disabled={formData.noNfse}
                              className="cursor-pointer disabled:cursor-not-allowed"
                            />
                            <Label htmlFor="includeMinorText" className="cursor-pointer text-sm">
                              Adicionar texto sobre atendimento de menor de idade
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            Se marcado, adiciona na NFSe: "referente ao atendimento do menor de idade [nome do paciente]"
                          </p>
                        </div>
                      )}
                    </div>
                    {formData.noNfse && (
                      <p className="text-xs text-muted-foreground italic">
                        ⓘ Opções desabilitadas porque "Não Emitir NF" está marcado
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    ⚠️ O email cadastrado será usado para enviar os termos de consentimento ao responsável.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionValue">
                  {formData.monthlyPrice ? 'Valor Mensal (R$)' : 'Valor por Sessão (R$)'}
                </Label>
                <Input
                  id="sessionValue"
                  type="number"
                  step="0.01"
                  required
                  value={formData.sessionValue}
                  onChange={(e) => setFormData({ ...formData, sessionValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-transparent">.</Label>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="monthlyPrice"
                      checked={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="monthlyPrice" className="cursor-pointer text-sm">Preço Mensal</Label>
                  </div>
                   <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="noNfse"
                      checked={formData.noNfse}
                      onChange={(e) => setFormData({ ...formData, noNfse: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="noNfse" className="cursor-pointer text-sm">Não Emitir NF</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* NFSe Configuration */}
            {!formData.noNfse && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nfseNumberOfInvoices">Número de Notas</Label>
                  <select
                    id="nfseNumberOfInvoices"
                    value={formData.nfseNumberOfInvoices}
                    onChange={(e) => setFormData({ ...formData, nfseNumberOfInvoices: parseInt(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nfseMaxSessionsPerInvoice">Máximo de Sessões/Nota</Label>
                  <select
                    id="nfseMaxSessionsPerInvoice"
                    value={formData.nfseMaxSessionsPerInvoice}
                    onChange={(e) => setFormData({ ...formData, nfseMaxSessionsPerInvoice: parseInt(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência das sessões</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => setFormData({ ...formData, frequency: value as 'weekly' | 'biweekly' | 'twice_weekly' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="twice_weekly">Duas vezes por semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data de início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (() => {
                        const [year, month, day] = formData.startDate.split('-').map(Number);
                        return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
                      })() : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate ? (() => {
                        const [year, month, day] = formData.startDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setFormData({ 
                            ...formData, 
                            startDate: `${year}-${month}-${day}`
                          });
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDay">Dia da semana da sessão {formData.frequency === 'twice_weekly' ? '(1ª)' : ''}</Label>
                <Select 
                  value={formData.sessionDay} 
                  onValueChange={(value) => setFormData({ ...formData, sessionDay: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia da semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Segunda-feira</SelectItem>
                    <SelectItem value="tuesday">Terça-feira</SelectItem>
                    <SelectItem value="wednesday">Quarta-feira</SelectItem>
                    <SelectItem value="thursday">Quinta-feira</SelectItem>
                    <SelectItem value="friday">Sexta-feira</SelectItem>
                    <SelectItem value="saturday">Sábado</SelectItem>
                    <SelectItem value="sunday">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTime">Horário da sessão {formData.frequency === 'twice_weekly' ? '(1ª)' : ''}</Label>
                <Input
                  id="sessionTime"
                  type="time"
                  step="60"
                  value={formData.sessionTime}
                  onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                />
              </div>
            </div>

            {formData.frequency === 'twice_weekly' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionDay2">Dia da semana da sessão (2ª)</Label>
                    <Select 
                      value={formData.sessionDay2} 
                      onValueChange={(value) => setFormData({ ...formData, sessionDay2: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia da semana" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Segunda-feira</SelectItem>
                        <SelectItem value="tuesday">Terça-feira</SelectItem>
                        <SelectItem value="wednesday">Quarta-feira</SelectItem>
                        <SelectItem value="thursday">Quinta-feira</SelectItem>
                        <SelectItem value="friday">Sexta-feira</SelectItem>
                        <SelectItem value="saturday">Sábado</SelectItem>
                        <SelectItem value="sunday">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTime2">Horário da sessão (2ª)</Label>
                    <Input
                      id="sessionTime2"
                      type="time"
                      step="60"
                      value={formData.sessionTime2}
                      onChange={(e) => setFormData({ ...formData, sessionTime2: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                  <input
                    type="checkbox"
                    id="hideSecondSession"
                    checked={formData.hideSecondSessionFromSchedule}
                    onChange={(e) => setFormData({ ...formData, hideSecondSessionFromSchedule: e.target.checked })}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="hideSecondSession" className="cursor-pointer text-sm">
                    Não Registrar na Agenda Segunda Sessão
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground -mt-3 ml-6">
                  Quando marcado, a segunda sessão semanal será gerada no histórico e contabilizada para cobrança, mas não aparecerá na agenda.
                </p>
              </>
            )}

            <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-md">
              <input
                type="checkbox"
                id="hideFromSchedule"
                checked={formData.hideFromSchedule}
                onChange={(e) => setFormData({ ...formData, hideFromSchedule: e.target.checked })}
                className="cursor-pointer mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="hideFromSchedule" className="cursor-pointer text-sm">
                  Nunca Registrar na Agenda
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  (Quando marcado, todas as sessões deste paciente não aparecerão na agenda, mas serão registradas no histórico e para emissão de NFS-e)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations || ''}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observações sobre o paciente..."
                rows={3}
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="lgpdConsent"
                checked={formData.lgpdConsent}
                onChange={(e) => setFormData({ ...formData, lgpdConsent: e.target.checked })}
                className="mt-1"
              />
              <Label htmlFor="lgpdConsent" className="text-sm cursor-pointer">
                Confirmo que o paciente foi informado sobre o tratamento de seus dados pessoais 
                e autorizou o armazenamento conforme a Lei Geral de Proteção de Dados (LGPD).
              </Label>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Cadastrar Paciente
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
};

export default NewPatient;
