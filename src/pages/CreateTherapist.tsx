import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { formatCPF, sanitizeCPF } from '@/lib/brazilianFormat';

const therapistSchema = z.object({
  full_name: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .max(14, 'CPF inválido')
    .transform(sanitizeCPF) // Sanitize before validation
    .refine((cpf) => cpf.length === 11, 'CPF deve ter 11 dígitos'),
  crp: z.string().min(1, 'CRP é obrigatório'),
  birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const CreateTherapist = () => {
  const navigate = useNavigate();
  const { createTherapist, isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    crp: '',
    birth_date: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [workHours, setWorkHours] = useState({
    work_days: [1, 2, 3, 4, 5], // Segunda a Sexta por padrão
    work_start_time: '08:00',
    work_end_time: '18:00',
    slot_duration: 60,
    break_time: 15,
  });

  // Configurações de autonomia do subordinado
  const [managesOwnPatients, setManagesOwnPatients] = useState(false);
  const [hasFinancialAccess, setHasFinancialAccess] = useState(false);
  const [nfseEmissionMode, setNfseEmissionMode] = useState<'own_company' | 'manager_company'>('own_company');
  const [managerHasCNPJ, setManagerHasCNPJ] = useState(false);

  const weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ];

  useEffect(() => {
    const checkManagerCNPJ = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('nfse_config')
        .select('cnpj')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setManagerHasCNPJ(!!data?.cnpj);
    };
    
    checkManagerCNPJ();
  }, [user?.id]);

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validatedData = therapistSchema.parse(formData);
      
      const { error, userId } = await createTherapist(
        validatedData.email,
        validatedData.password,
        {
          full_name: validatedData.full_name,
          cpf: validatedData.cpf,
          crp: validatedData.crp,
          birth_date: validatedData.birth_date,
        },
        workHours
      );

      if (!error && userId) {
        // Criar configurações de autonomia para o subordinado
        const { error: autonomyError } = await supabase
          .from('subordinate_autonomy_settings')
          .insert({
            subordinate_id: userId,
            manager_id: user!.id,
            manages_own_patients: managesOwnPatients,
            has_financial_access: hasFinancialAccess,
            nfse_emission_mode: nfseEmissionMode
          });

        if (autonomyError) {
          console.error('Erro ao criar configurações de autonomia:', autonomyError);
        }

        navigate('/therapists');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-format CPF as user types
    if (name === 'cpf') {
      const formatted = formatCPF(value);
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/therapists')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Criar Novo Terapeuta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Nome completo"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crp">CRP</Label>
              <Input
                id="crp"
                name="crp"
                value={formData.crp}
                onChange={handleChange}
                placeholder="00/00000"
              />
              {errors.crp && (
                <p className="text-sm text-destructive">{errors.crp}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
            />
            {errors.birth_date && (
              <p className="text-sm text-destructive">{errors.birth_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirme a senha"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="border-t pt-4 mt-6">
            <h3 className="text-lg font-semibold mb-4">Horários de Trabalho</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Dias da Semana</Label>
                <div className="grid grid-cols-2 gap-3">
                  {weekDays.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={workHours.work_days.includes(day.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setWorkHours({
                              ...workHours,
                              work_days: [...workHours.work_days, day.value].sort(),
                            });
                          } else {
                            setWorkHours({
                              ...workHours,
                              work_days: workHours.work_days.filter((d) => d !== day.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`day-${day.value}`} className="cursor-pointer">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_start_time">Horário de Início</Label>
                  <Input
                    id="work_start_time"
                    type="time"
                    value={workHours.work_start_time}
                    onChange={(e) => setWorkHours({ ...workHours, work_start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_end_time">Horário de Fim</Label>
                  <Input
                    id="work_end_time"
                    type="time"
                    value={workHours.work_end_time}
                    onChange={(e) => setWorkHours({ ...workHours, work_end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot_duration">Duração de Cada Sessão (minutos)</Label>
                <Input
                  id="slot_duration"
                  type="number"
                  value={workHours.slot_duration}
                  onChange={(e) => setWorkHours({ ...workHours, slot_duration: parseInt(e.target.value) })}
                  min="30"
                  step="15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="break_time">Tempo de Descanso (minutos)</Label>
                <Input
                  id="break_time"
                  type="number"
                  value={workHours.break_time}
                  onChange={(e) => setWorkHours({ ...workHours, break_time: parseInt(e.target.value) })}
                  min="0"
                  step="5"
                />
                <p className="text-sm text-muted-foreground">
                  Intervalo entre sessões para recomposição. Não conta na taxa de ocupação.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-6">
            <h3 className="text-lg font-semibold mb-4">Configurações de Autonomia</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Defina o nível de autonomia do subordinado em relação aos pacientes e finanças.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="manages_own_patients"
                  checked={managesOwnPatients}
                  onCheckedChange={(checked) => {
                    setManagesOwnPatients(!!checked);
                    // Se desmarcar "gerencia pacientes", automaticamente desmarcar "acesso financeiro"
                    if (!checked) {
                      setHasFinancialAccess(false);
                    }
                  }}
                />
                <div className="space-y-1">
                  <Label htmlFor="manages_own_patients" className="cursor-pointer font-medium">
                    Subordinado gerencia seus próprios pacientes?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Se <strong>marcado</strong>: Você verá apenas a lista básica dos pacientes (sem dados clínicos).<br />
                    Se <strong>desmarcado</strong>: Você terá acesso total aos dados clínicos dos pacientes do subordinado.
                  </p>
                </div>
              </div>

              {managesOwnPatients && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasFinancialAccess"
                      checked={hasFinancialAccess}
                      onCheckedChange={(checked) => setHasFinancialAccess(checked as boolean)}
                    />
                    <Label htmlFor="hasFinancialAccess" className="cursor-pointer">
                      Subordinado faz o controle financeiro?
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Se marcado, subordinado terá acesso à aba Financial e poderá emitir NFSe dos seus próprios pacientes.
                  </p>

                  {hasFinancialAccess && (
                    <div className="mt-4 space-y-3 pl-6 border-l-2">
                      <Label className="text-sm font-medium">Modo de Emissão de NFSe:</Label>
                      <RadioGroup 
                        value={nfseEmissionMode} 
                        onValueChange={(value) => setNfseEmissionMode(value as 'own_company' | 'manager_company')}
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="own_company" id="own_company" />
                          <div className="space-y-1">
                            <Label htmlFor="own_company" className="cursor-pointer font-normal">
                              Empresa Própria
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Subordinado usa seu próprio CNPJ para emitir NFSe
                            </p>
                          </div>
                        </div>
                        
                        {managerHasCNPJ ? (
                          <div className="flex items-start space-x-2">
                            <RadioGroupItem value="manager_company" id="manager_company" />
                            <div className="space-y-1">
                              <Label htmlFor="manager_company" className="cursor-pointer font-normal">
                                Empresa do Full
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Subordinado emite NFSe usando o CNPJ do Full (sessões entram no fechamento do Full)
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2 opacity-50">
                            <RadioGroupItem value="manager_company" id="manager_company" disabled />
                            <div className="space-y-1">
                              <Label htmlFor="manager_company" className="cursor-pointer font-normal">
                                Empresa do Full (Indisponível)
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Você precisa cadastrar seu CNPJ na configuração de NFSe para habilitar esta opção
                              </p>
                            </div>
                          </div>
                        )}
                      </RadioGroup>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Terapeuta'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default CreateTherapist;
