import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAccess } from '@/lib/auditLog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useToast } from '@/hooks/use-toast';
import { addWeeks, parseISO, getDay, format } from 'date-fns';

const EditPatient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
  
  // Helper to get Brazil date using native timezone conversion
  const getBrazilDate = () => {
    return new Date().toLocaleString('en-CA', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split(',')[0]; // Returns 'YYYY-MM-DD'
  };
  
  const [changeFromDate, setChangeFromDate] = useState(getBrazilDate());

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    const { data } = await supabase.from('patients').select('*').eq('id', id).single();
    if (data) {
      // Log admin access
      await logAdminAccess('edit_patient', undefined, id, 'Admin accessed patient edit page');

      const patientData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        birth_date: data.birth_date,
        frequency: data.frequency,
        session_day: data.session_day,
        session_time: data.session_time,
        session_day_2: data.session_day_2,
        session_time_2: data.session_time_2,
        session_value: data.session_value,
        start_date: data.start_date,
        status: data.status,
        lgpd_consent_date: data.lgpd_consent_date,
        no_nfse: data.no_nfse || false,
        monthly_price: data.monthly_price || false,
        nfse_number_of_invoices: data.nfse_number_of_invoices || 1,
        nfse_max_sessions_per_invoice: data.nfse_max_sessions_per_invoice || 20,
        is_minor: data.is_minor || false,
        guardian_name: data.guardian_name || '',
        guardian_cpf: data.guardian_cpf || '',
        nfse_issue_to: data.nfse_issue_to || 'patient',
        include_minor_text: data.include_minor_text || false,
        hide_second_session_from_schedule: data.hide_second_session_from_schedule || false,
        hide_from_schedule: data.hide_from_schedule || false,
        observations: data.observations || '',
      };
      setFormData(patientData);
      setOriginalData(patientData);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Tem certeza que deseja encerrar este paciente? Todas as sessões futuras serão canceladas.')) {
      return;
    }

    await supabase.from('patients').update({ status: 'inactive' }).eq('id', id);
    
    const today = getBrazilDate();
    await supabase.from('sessions').delete().eq('patient_id', id).gte('date', today);

    toast({
      title: "Paciente encerrado!",
      description: "Todas as sessões futuras foram canceladas.",
    });

    navigate('/patients');
  };

  const handleReactivate = async () => {
    if (!confirm('Tem certeza que deseja reativar este paciente?')) return;
    
    const { error } = await supabase
      .from('patients')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao reativar paciente', variant: 'destructive' });
      return;
    }

    toast({ title: 'Paciente reativado com sucesso' });
    loadPatient();
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja EXCLUIR este paciente? Esta ação não pode ser desfeita e todos os dados serão perdidos.')) {
      return;
    }

    try {
      // Delete all related data first
      await supabase.from('sessions').delete().eq('patient_id', id);
      await supabase.from('session_history').delete().eq('patient_id', id);
      await supabase.from('patient_files').delete().eq('patient_id', id);
      await supabase.from('nfse_issued').delete().eq('patient_id', id);
      
      // Finally delete the patient
      const { error } = await supabase.from('patients').delete().eq('id', id);
      
      if (error) throw error;

      toast({
        title: "Paciente excluído!",
        description: "O paciente e todos os seus dados foram removidos.",
      });

      navigate('/patients');
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if session day, time, or start date changed
    const dayChanged = formData.session_day !== originalData.session_day;
    const timeChanged = formData.session_time !== originalData.session_time;
    const startDateChanged = formData.start_date !== originalData.start_date;
    
    if (dayChanged || timeChanged) {
      setIsChangeDialogOpen(true);
      return;
    }
    
    // If only start date changed, regenerate sessions from new start date
    if (startDateChanged) {
      await updatePatientWithNewStartDate();
      return;
    }
    
    await updatePatient();
  };

  const updatePatientWithNewStartDate = async () => {
    // First update the patient data
    await updatePatient();
    
    // Then regenerate all sessions from the new start date
    const today = getBrazilDate();
    
    // Delete all existing sessions
    await supabase
      .from('sessions')
      .delete()
      .eq('patient_id', id);
    
    // Generate new sessions from start date
    const { generateRecurringSessions } = await import('@/lib/sessionUtils');
    
    const sessions = generateRecurringSessions(
      formData.start_date,
      formData.session_day,
      formData.session_time,
      formData.frequency as 'weekly' | 'biweekly',
      20 // Generate 20 sessions
    );
    
    // Insert new sessions
    const sessionsToInsert = sessions.map(session => ({
      patient_id: id,
      date: session.date,
      status: session.status,
      value: formData.session_value,
      paid: false,
      time: formData.session_time,
    }));
    
    await supabase.from('sessions').insert(sessionsToInsert);
    
    toast({
      title: "Paciente atualizado!",
      description: "A data de início foi alterada e as sessões foram regeneradas.",
    });
    
    navigate('/patients');
  };

  const updatePatient = async () => {
    const hideFromScheduleChanged = formData.hide_from_schedule !== originalData.hide_from_schedule;
    
    const { error } = await supabase.from('patients').update({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cpf: formData.cpf || null,
      birth_date: formData.birth_date,
      frequency: formData.frequency,
      session_day: formData.session_day,
      session_time: formData.session_time,
      session_day_2: formData.frequency === 'twice_weekly' ? (formData.session_day_2 || null) : null,
      session_time_2: formData.frequency === 'twice_weekly' ? (formData.session_time_2 || null) : null,
      session_value: formData.session_value,
      start_date: formData.start_date,
      lgpd_consent_date: formData.lgpd_consent_date,
      no_nfse: formData.no_nfse,
      monthly_price: formData.monthly_price,
      nfse_number_of_invoices: formData.nfse_number_of_invoices,
      nfse_max_sessions_per_invoice: formData.nfse_max_sessions_per_invoice,
      is_minor: formData.is_minor,
      guardian_name: formData.is_minor ? (formData.guardian_name || null) : null,
      guardian_cpf: formData.is_minor ? (formData.guardian_cpf || null) : null,
      nfse_issue_to: formData.is_minor ? formData.nfse_issue_to : 'patient',
      include_minor_text: formData.is_minor && formData.nfse_issue_to === 'guardian' ? formData.include_minor_text : false,
      hide_second_session_from_schedule: formData.frequency === 'twice_weekly' ? formData.hide_second_session_from_schedule : false,
      hide_from_schedule: formData.hide_from_schedule,
      observations: formData.observations || null,
    }).eq('id', id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Update all future scheduled sessions if hide_from_schedule changed
    if (hideFromScheduleChanged) {
      const today = getBrazilDate();
      
      const { data: futureSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('patient_id', id)
        .gte('date', today);
      
      if (futureSessions && futureSessions.length > 0) {
        await supabase
          .from('sessions')
          .update({ show_in_schedule: !formData.hide_from_schedule })
          .in('id', futureSessions.map(s => s.id));
      }
    }
    
    // If frequency is twice_weekly, update all existing scheduled sessions for the second session day
    if (formData.frequency === 'twice_weekly' && formData.session_time_2) {
      // Map day names to day of week for matching
      const dayOfWeekMap: { [key: string]: number } = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
      };
      
      const secondDayOfWeek = dayOfWeekMap[formData.session_day_2?.toLowerCase() || ''];
      
      // Get all scheduled sessions for this patient
      const { data: allSessions } = await supabase
        .from('sessions')
        .select('id, date, time')
        .eq('patient_id', id)
        .in('status', ['scheduled', 'attended']);
      
      if (allSessions) {
        // Filter sessions that match the second session day and time
        const secondSessionIds = allSessions
          .filter(session => {
            const sessionDate = new Date(session.date + 'T00:00:00');
            const sessionDayOfWeek = sessionDate.getDay();
            return sessionDayOfWeek === secondDayOfWeek && session.time === formData.session_time_2;
          })
          .map(s => s.id);
        
        // Update show_in_schedule for these sessions
        if (secondSessionIds.length > 0) {
          await supabase
            .from('sessions')
            .update({ show_in_schedule: !formData.hide_second_session_from_schedule })
            .in('id', secondSessionIds);
          
          toast({
            title: "Paciente atualizado!",
            description: `As informações foram salvas e ${secondSessionIds.length} sessões foram ${formData.hide_second_session_from_schedule ? 'ocultadas da' : 'reexibidas na'} agenda.`,
          });
        } else {
          toast({
            title: "Paciente atualizado!",
            description: "As informações foram salvas com sucesso.",
          });
        }
      }
    } else {
      toast({
        title: "Paciente atualizado!",
        description: "As informações foram salvas com sucesso.",
      });
    }
    
    navigate('/patients');
  };

  const updateFutureSessions = async () => {
    // Get all future sessions from the specified date
    const { data: futureSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', id)
      .gte('date', changeFromDate)
      .order('date', { ascending: true });

    if (!futureSessions || futureSessions.length === 0) {
      await updatePatient();
      return;
    }

    // Delete old future sessions
    await supabase
      .from('sessions')
      .delete()
      .eq('patient_id', id)
      .gte('date', changeFromDate);

    // Calculate new dates based on new session day and frequency
    const dayOfWeekMap: { [key: string]: number } = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };

    const targetDay = dayOfWeekMap[formData.session_day.toLowerCase()];
    let currentDate = parseISO(changeFromDate);
    
    // Adjust to the target day of week
    const currentDay = getDay(currentDate);
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) daysToAdd += 7;
    currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Create new sessions with updated dates
    const newSessions = [];
    for (let i = 0; i < futureSessions.length; i++) {
      const sessionDateStr = format(currentDate, 'yyyy-MM-dd');
      
      newSessions.push({
        patient_id: id,
        date: sessionDateStr,
        status: 'scheduled',
        value: formData.session_value,
        paid: false,
        notes: futureSessions[i].notes
      });

      // Move to next session date
      const weeksToAdd = formData.frequency === 'weekly' ? 1 : 2;
      currentDate = addWeeks(currentDate, weeksToAdd);
    }

    await supabase.from('sessions').insert(newSessions);
    await updatePatient();
    setIsChangeDialogOpen(false);
  };

  if (!formData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/patients/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-8 shadow-[var(--shadow-card)] border-border">
          <h1 className="text-2xl font-bold text-foreground mb-6">Editar Paciente</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">
                CPF {!formData.is_minor || formData.nfse_issue_to === 'patient' ? '*' : ''}
              </Label>
              <Input
                id="cpf"
                required={!formData.is_minor || formData.nfse_issue_to === 'patient'}
                value={formData.cpf || ''}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_value">
                  {formData.monthly_price ? 'Valor Mensal (R$)' : 'Valor por Sessão (R$)'}
                </Label>
                <Input
                  id="session_value"
                  type="number"
                  step="0.01"
                  value={formData.session_value}
                  onChange={(e) => setFormData({ ...formData, session_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-transparent">.</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="monthlyPrice"
                      checked={formData.monthly_price}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          monthly_price: checked,
                          no_nfse: checked ? true : formData.no_nfse
                        });
                      }}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="monthlyPrice" className="cursor-pointer text-sm">Preço Mensal</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="noNfse"
                      checked={formData.no_nfse}
                      onChange={(e) => setFormData({ ...formData, no_nfse: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="noNfse" className="cursor-pointer text-sm">Não Emitir NF</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* NFSe Configuration */}
            {!formData.no_nfse && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nfseNumberOfInvoices">Número de Notas</Label>
                  <select
                    id="nfseNumberOfInvoices"
                    value={formData.nfse_number_of_invoices}
                    onChange={(e) => setFormData({ ...formData, nfse_number_of_invoices: parseInt(e.target.value) })}
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
                    value={formData.nfse_max_sessions_per_invoice}
                    onChange={(e) => setFormData({ ...formData, nfse_max_sessions_per_invoice: parseInt(e.target.value) })}
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

            {/* Campos para Paciente Menor de Idade */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMinor"
                  checked={formData.is_minor}
                  onChange={(e) => setFormData({ ...formData, is_minor: e.target.checked })}
                  className="cursor-pointer"
                />
                <Label htmlFor="isMinor" className="cursor-pointer font-semibold">
                  Paciente Menor de Idade
                </Label>
              </div>

              {formData.is_minor && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Para pacientes menores de idade, o email e dados abaixo devem ser do responsável legal.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Nome do Responsável Legal *</Label>
                    <Input
                      id="guardianName"
                      required={formData.is_minor}
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      placeholder="Nome completo do responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianCpf">
                      CPF do Responsável Legal {formData.nfse_issue_to === 'guardian' ? '*' : ''}
                    </Label>
                    <Input
                      id="guardianCpf"
                      required={formData.is_minor && formData.nfse_issue_to === 'guardian'}
                      value={formData.guardian_cpf}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        let formatted = value;
                        if (value.length > 3) formatted = value.slice(0, 3) + '.' + value.slice(3);
                        if (value.length > 6) formatted = formatted.slice(0, 7) + '.' + value.slice(6);
                        if (value.length > 9) formatted = formatted.slice(0, 11) + '-' + value.slice(9);
                        setFormData({ ...formData, guardian_cpf: formatted });
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
                          checked={formData.nfse_issue_to === 'patient'}
                          onChange={(e) => setFormData({ ...formData, nfse_issue_to: 'patient' })}
                          disabled={formData.no_nfse}
                          className="cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Label 
                          htmlFor="nfsePatient" 
                          className={cn(
                            "cursor-pointer text-sm",
                            formData.no_nfse && "text-muted-foreground"
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
                          checked={formData.nfse_issue_to === 'guardian'}
                          onChange={(e) => setFormData({ ...formData, nfse_issue_to: 'guardian' })}
                          disabled={formData.no_nfse}
                          className="cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Label 
                          htmlFor="nfseGuardian" 
                          className={cn(
                            "cursor-pointer text-sm",
                            formData.no_nfse && "text-muted-foreground"
                          )}
                        >
                          Emitir Nota em Nome do Responsável
                        </Label>
                      </div>

                      {/* Conditional checkbox for minor text */}
                      {formData.nfse_issue_to === 'guardian' && (
                        <div className="ml-6 mt-2 p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="includeMinorText"
                              checked={formData.include_minor_text}
                              onChange={(e) => setFormData({ ...formData, include_minor_text: e.target.checked })}
                              disabled={formData.no_nfse}
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
                    {formData.no_nfse && (
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
              <Label htmlFor="start_date">Data de início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_day">Dia da semana da sessão {formData.frequency === 'twice_weekly' ? '(1ª)' : ''}</Label>
                <Select 
                  value={formData.session_day} 
                  onValueChange={(value) => setFormData({ ...formData, session_day: value })}
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
                <Label htmlFor="session_time">Horário da sessão {formData.frequency === 'twice_weekly' ? '(1ª)' : ''}</Label>
                <Input
                  id="session_time"
                  type="time"
                  value={formData.session_time}
                  onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                />
              </div>
            </div>

            {formData.frequency === 'twice_weekly' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_day_2">Dia da semana da sessão (2ª)</Label>
                    <Select 
                      value={formData.session_day_2 || 'thursday'} 
                      onValueChange={(value) => setFormData({ ...formData, session_day_2: value })}
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
                    <Label htmlFor="session_time_2">Horário da sessão (2ª)</Label>
                    <Input
                      id="session_time_2"
                      type="time"
                      value={formData.session_time_2 || ''}
                      onChange={(e) => setFormData({ ...formData, session_time_2: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                  <input
                    type="checkbox"
                    id="hideSecondSession"
                    checked={formData.hide_second_session_from_schedule}
                    onChange={(e) => setFormData({ ...formData, hide_second_session_from_schedule: e.target.checked })}
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
                checked={formData.hide_from_schedule}
                onChange={(e) => setFormData({ ...formData, hide_from_schedule: e.target.checked })}
                className="cursor-pointer mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="hideFromSchedule" className="cursor-pointer text-sm">
                  Nunca Registrar na Agenda
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  (Quando marcado, todas as sessões futuras deste paciente não aparecerão na agenda, mas serão registradas no histórico e para emissão de NFS-e)
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
                checked={!!formData.lgpd_consent_date}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  lgpd_consent_date: e.target.checked ? new Date().toISOString() : null 
                })}
                className="mt-1"
              />
              <Label htmlFor="lgpdConsent" className="text-sm cursor-pointer">
                Confirmo que o paciente foi informado sobre o tratamento de seus dados pessoais 
                e autorizou o armazenamento conforme a Lei Geral de Proteção de Dados (LGPD).
                {formData.lgpd_consent_date && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Consentimento registrado em: {new Date(formData.lgpd_consent_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </Label>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Salvar Alterações
            </Button>

            <div className="flex gap-4 pt-6 border-t mt-6">
              {formData.status === 'inactive' ? (
                <Button 
                  type="button" 
                  variant="default" 
                  className="flex-1"
                  onClick={handleReactivate}
                >
                  Reativar Paciente
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleDeactivate}
                >
                  Encerrar Paciente
                </Button>
              )}
              <Button 
                type="button" 
                variant="destructive" 
                className="flex-1"
                onClick={handleDelete}
              >
                Excluir Paciente
              </Button>
            </div>
          </form>
        </Card>

        <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aplicar Mudança de Horário/Dia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Você alterou o dia da semana ou horário da sessão. A partir de qual data deseja aplicar essa mudança?
              </p>
              <div>
                <Label htmlFor="changeFromDate">Aplicar mudanças a partir de:</Label>
                <Input
                  id="changeFromDate"
                  type="date"
                  value={changeFromDate}
                  onChange={(e) => setChangeFromDate(e.target.value)}
                  min={getBrazilDate()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updateFutureSessions} className="flex-1">
                  Aplicar Mudanças
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    await updatePatient();
                    setIsChangeDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  Salvar Sem Alterar Sessões
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
};

export default EditPatient;
