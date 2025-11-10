import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { LayoutManager } from '@/components/LayoutManager';

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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakTime, setBreakTime] = useState(15);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setWorkDays(profile.work_days || [1, 2, 3, 4, 5]);
      setWorkStartTime(profile.work_start_time || '08:00');
      setWorkEndTime(profile.work_end_time || '18:00');
      setSlotDuration(profile.slot_duration || 60);
      setBreakTime(profile.break_time || 15);
    }
  }, [profile]);

  const handleWorkDayToggle = (day: number) => {
    setWorkDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas configurações de horário foram salvas com sucesso.',
      });

      navigate(-1);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dias de Trabalho */}
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

            {/* Horário de Início */}
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

            {/* Horário de Término */}
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

            {/* Duração dos Slots */}
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

            {/* Tempo de Descanso */}
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
                Tempo de intervalo entre atendimentos para recomposição. Este tempo não é contabilizado na taxa de ocupação.
              </p>
            </div>

            <Separator className="my-6" />

            {/* Layout Management */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Gerenciar Layouts</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie seus profiles salvos e backups automáticos
                </p>
              </div>
              <LayoutManager />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEdit;
