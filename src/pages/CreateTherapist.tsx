import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const therapistSchema = z.object({
  full_name: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14),
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
  const { createTherapist, isAdmin } = useAuth();
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
  });

  const weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ];

  if (!isAdmin) {
    navigate('/');
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

      if (!error) {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
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
