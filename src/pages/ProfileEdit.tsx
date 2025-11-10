import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { LayoutTemplateManager } from '@/components/LayoutTemplateManager';

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const CLINICAL_APPROACHES = [
  'TCC',
  'Psicologia Analítica',
  'Psicanálise',
  'Fenomenologia',
  'Behaviorismo',
];

const ProfileEdit = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Personal data
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [crp, setCrp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sendNfseToTherapist, setSendNfseToTherapist] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Clinical data
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakTime, setBreakTime] = useState(15);
  const [clinicalApproach, setClinicalApproach] = useState<string>('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCpf(profile.cpf || '');
      setCrp(profile.crp || '');
      setPhone(profile.phone || '');
      setSendNfseToTherapist(profile.send_nfse_to_therapist || false);
      setWorkDays(profile.work_days || [1, 2, 3, 4, 5]);
      setWorkStartTime(profile.work_start_time || '08:00');
      setWorkEndTime(profile.work_end_time || '18:00');
      setSlotDuration(profile.slot_duration || 60);
      setBreakTime(profile.break_time || 15);
      setClinicalApproach(profile.clinical_approach || '');
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

  const handleSavePersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          cpf,
          crp,
          phone,
          send_nfse_to_therapist: sendNfseToTherapist,
        })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email,
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        if (newPassword.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres');
        }
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passwordError) throw passwordError;
        setNewPassword('');
        setConfirmPassword('');
      }

      toast({
        title: 'Dados pessoais atualizados',
        description: 'Suas informações foram salvas com sucesso.',
      });
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

  const handleSaveClinicalData = async (e: React.FormEvent) => {
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
        title: 'Dados clínicos atualizados',
        description: 'Suas configurações foram salvas com sucesso.',
      });
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email necessário',
        description: 'Por favor, preencha o email antes de recuperar a senha.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="clinical">Clínica</TabsTrigger>
              <TabsTrigger value="layouts">Templates</TabsTrigger>
            </TabsList>

            {/* Dados Pessoais Tab */}
            <TabsContent value="personal" className="space-y-6 mt-6">
              <form onSubmit={handleSavePersonalData} className="space-y-6">
                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Alterar Senha</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a senha"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleForgotPassword}
                  >
                    Esqueci minha senha
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                  <Checkbox
                    id="sendNfse"
                    checked={sendNfseToTherapist}
                    onCheckedChange={(checked) => setSendNfseToTherapist(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="sendNfse"
                      className="cursor-pointer font-semibold"
                    >
                      Enviar NFSe para terapeuta
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quando ativo, você receberá uma cópia da NFSe emitida para pacientes via email e telefone cadastrados
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

            {/* Clínica Tab */}
            <TabsContent value="clinical" className="space-y-6 mt-6">
              <form onSubmit={handleSaveClinicalData} className="space-y-6">
                <div>
                  <Label htmlFor="clinicalApproach">Abordagem Clínica</Label>
                  <Select value={clinicalApproach} onValueChange={setClinicalApproach}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua abordagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLINICAL_APPROACHES.map((approach) => (
                        <SelectItem key={approach} value={approach}>
                          {approach}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

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

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="break-time">Tempo de Descanso (minutos)</Label>
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
                      Intervalo entre atendimentos para recomposição
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

            {/* Templates Tab */}
            <TabsContent value="layouts" className="space-y-6 mt-6">
              <div>
                <Label className="text-base font-semibold">Templates de Layout</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Exporte seus layouts personalizados ou importe templates compartilhados por outros terapeutas
                </p>
              </div>
              <LayoutTemplateManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEdit;
