import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { format, addWeeks, parseISO, getDay } from 'date-fns';

const EditPatient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
  const [changeFromDate, setChangeFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    const { data } = await supabase.from('patients').select('*').eq('id', id).single();
    if (data) {
      const patientData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        birth_date: data.birth_date,
        frequency: data.frequency,
        session_day: data.session_day,
        session_time: data.session_time,
        session_value: data.session_value,
        start_date: data.start_date,
        status: data.status,
        lgpd_consent_date: data.lgpd_consent_date,
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
    
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('sessions').delete().eq('patient_id', id).gte('date', today);

    toast({
      title: "Paciente encerrado!",
      description: "Todas as sessões futuras foram canceladas.",
    });

    navigate('/patients');
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja EXCLUIR este paciente? Esta ação não pode ser desfeita e todos os dados serão perdidos.')) {
      return;
    }

    await supabase.from('patients').delete().eq('id', id);

    toast({
      title: "Paciente excluído!",
      description: "O paciente e todos os seus dados foram removidos.",
    });

    navigate('/patients');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if session day or time changed
    const dayChanged = formData.session_day !== originalData.session_day;
    const timeChanged = formData.session_time !== originalData.session_time;
    
    if (dayChanged || timeChanged) {
      setIsChangeDialogOpen(true);
      return;
    }
    
    await updatePatient();
  };

  const updatePatient = async () => {
    const { error } = await supabase.from('patients').update({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cpf: formData.cpf,
      birth_date: formData.birth_date,
      frequency: formData.frequency,
      session_day: formData.session_day,
      session_time: formData.session_time,
      session_value: formData.session_value,
      start_date: formData.start_date,
      lgpd_consent_date: formData.lgpd_consent_date,
    }).eq('id', id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Paciente atualizado!",
      description: "As informações foram salvas com sucesso.",
    });
    
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
      <div className="min-h-screen bg-[var(--gradient-soft)]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
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
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                required
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                required
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_value">Valor por Sessão (R$)</Label>
              <Input
                id="session_value"
                type="number"
                step="0.01"
                required
                value={formData.session_value}
                onChange={(e) => setFormData({ ...formData, session_value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência das sessões</Label>
              <Select 
                value={formData.frequency} 
                onValueChange={(value) => setFormData({ ...formData, frequency: value as 'weekly' | 'biweekly' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Data de início</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_day">Dia da semana da sessão</Label>
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
              <Label htmlFor="session_time">Horário da sessão</Label>
              <Input
                id="session_time"
                type="time"
                required
                value={formData.session_time}
                onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
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
              {formData.status === 'active' && (
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
                <Label>Aplicar mudanças a partir de:</Label>
                <Input
                  type="date"
                  value={changeFromDate}
                  onChange={(e) => setChangeFromDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
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
    </div>
  );
};

export default EditPatient;
