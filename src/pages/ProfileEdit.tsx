import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { AccessManagement } from '@/components/AccessManagement';

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const ProfileEdit = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Dados Pessoais
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [crp, setCrp] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sendNfseToTherapist, setSendNfseToTherapist] = useState(false);
  
  // Dados Clínicos
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakTime, setBreakTime] = useState(15);
  const [clinicalApproach, setClinicalApproach] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCpf(profile.cpf || '');
      setCrp(profile.crp || '');
      setPhone(profile.phone || '');
      setBirthDate(profile.birth_date || '');
      setSendNfseToTherapist(profile.send_nfse_to_therapist || false);
      setClinicalApproach(profile.clinical_approach || '');
      
      setWorkDays(profile.work_days || [1, 2, 3, 4, 5]);
      setWorkStartTime(profile.work_start_time || '08:00');
      setWorkEndTime(profile.work_end_time || '18:00');
      setSlotDuration(profile.slot_duration || 60);
      setBreakTime(profile.break_time || 15);
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handleWorkDayToggle = (day: number) => {
    setWorkDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSubmitPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          cpf,
          crp,
          phone,
          birth_date: birthDate,
          send_nfse_to_therapist: sendNfseToTherapist,
        })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Atualizar email se mudou
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });
        if (emailError) throw emailError;
      }

      // Atualizar senha se fornecida
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passwordError) throw passwordError;
      }

      toast({
        title: 'Dados atualizados',
        description: 'Seus dados pessoais foram salvos com sucesso.',
      });

      setNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClinical = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          work_days: workDays,
          work_start_time: workStartTime,
          work_end_time: workEndTime,
          slot_duration: slotDuration,
          break_time: breakTime,
          clinical_approach: clinicalApproach,
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: 'Configurações atualizadas',
        description: 'Suas configurações clínicas foram salvas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="clinical">Clínica</TabsTrigger>
              {isAdmin && <TabsTrigger value="access">Configurações</TabsTrigger>}
            </TabsList>

            <TabsContent value="personal">
              <form onSubmit={handleSubmitPersonal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full-name">Nome Completo</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="crp">CRP</Label>
                    <Input
                      id="crp"
                      value={crp}
                      onChange={(e) => setCrp(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="birth-date">Data de Nascimento</Label>
                    <Input
                      id="birth-date"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-password">Nova Senha (deixe em branco para não alterar)</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-nfse"
                    checked={sendNfseToTherapist}
                    onCheckedChange={(checked) => setSendNfseToTherapist(checked as boolean)}
                  />
                  <Label htmlFor="send-nfse" className="cursor-pointer">
                    Enviar NFSe para terapeuta (cópia no email e telefone)
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="clinical">
              <form onSubmit={handleSubmitClinical} className="space-y-6">
                <div>
                  <Label>Abordagem Clínica</Label>
                  <Select value={clinicalApproach} onValueChange={setClinicalApproach}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a abordagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TCC">Terapia Cognitivo-Comportamental (TCC)</SelectItem>
                      <SelectItem value="Psicologia Analítica">Psicologia Analítica</SelectItem>
                      <SelectItem value="Psicanálise">Psicanálise</SelectItem>
                      <SelectItem value="Fenomenologia">Fenomenologia</SelectItem>
                      <SelectItem value="Behaviorismo">Behaviorismo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-3 block">Dias de Trabalho</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {WEEKDAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={workDays.includes(day.value)}
                          onCheckedChange={() => handleWorkDayToggle(day.value)}
                        />
                        <Label
                          htmlFor={`day-${day.value}`}
                          className="cursor-pointer"
                        >
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Horário de Início</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="end-time">Horário de Término</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slot-duration">Duração de Cada Sessão (minutos)</Label>
                    <Input
                      id="slot-duration"
                      type="number"
                      min="15"
                      step="15"
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="break-time">Tempo de Descanso Entre Sessões (minutos)</Label>
                    <Input
                      id="break-time"
                      type="number"
                      min="0"
                      step="5"
                      value={breakTime}
                      onChange={(e) => setBreakTime(Number(e.target.value))}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Tempo de intervalo entre atendimentos para recomposição.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="access">
                <AccessManagement />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEdit;
