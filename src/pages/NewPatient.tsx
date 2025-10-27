import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birthDate: '',
    frequency: 'weekly' as 'weekly' | 'biweekly',
    sessionDay: 'monday' as string,
    sessionTime: '',
    sessionValue: '',
    startDate: '',
    lgpdConsent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email || '',
          phone: formData.phone || '',
          cpf: formData.cpf,
          birth_date: formData.birthDate || null,
          frequency: formData.frequency || 'weekly',
          session_day: formData.sessionDay || 'monday',
          session_time: formData.sessionTime || '',
          session_value: parseFloat(formData.sessionValue),
          start_date: formData.startDate || null,
          lgpd_consent_date: formData.lgpdConsent ? new Date().toISOString() : null,
          status: 'active',
        })
        .select()
        .single();

      if (patientError) throw patientError;

      let sessionsCount = 0;

      // Only generate sessions if all scheduling data is complete
      if (formData.startDate && formData.sessionDay && formData.sessionTime) {
        const { generateRecurringSessions } = await import('@/lib/sessionUtils');
        const sessionData = generateRecurringSessions(
          formData.startDate,
          formData.sessionDay,
          formData.sessionTime,
          formData.frequency,
          new Date()
        );

        // Create sessions in the database
        const sessionsToInsert = sessionData.map(({ date, status }) => ({
          patient_id: patient.id,
          date,
          status,
          value: parseFloat(formData.sessionValue),
          paid: false,
        }));

        if (sessionsToInsert.length > 0) {
          const { error: sessionsError } = await supabase
            .from('sessions')
            .insert(sessionsToInsert);

          if (sessionsError) throw sessionsError;
          sessionsCount = sessionsToInsert.length;
        }
      }

      toast({
        title: "Paciente cadastrado!",
        description: sessionsCount > 0 
          ? `O paciente foi adicionado com ${sessionsCount} sessões geradas.`
          : "O paciente foi adicionado. Você pode adicionar os dados de agendamento depois.",
      });

      navigate('/patients');
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar paciente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
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
                  type="email"
                  value={formData.email}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  required
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
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionValue">Valor por Sessão (R$)</Label>
              <Input
                id="sessionValue"
                type="number"
                step="0.01"
                required
                value={formData.sessionValue}
                onChange={(e) => setFormData({ ...formData, sessionValue: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="startDate">Data de início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDay">Dia da semana da sessão</Label>
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
                <Label htmlFor="sessionTime">Horário da sessão</Label>
                <Input
                  id="sessionTime"
                  type="time"
                  value={formData.sessionTime}
                  onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                />
              </div>
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
  );
};

export default NewPatient;
