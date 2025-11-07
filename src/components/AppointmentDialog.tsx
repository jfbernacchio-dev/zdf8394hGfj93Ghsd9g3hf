import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

interface AppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  selectedDate: Date;
  onSuccess: () => void;
  editingAppointment?: any;
}

// Schema de validação para compromissos
const appointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" }),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, { message: "Horário de início inválido (use formato HH:mm)" }).refine((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
  }, { message: "Horário de início inválido" }),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, { message: "Horário de fim inválido (use formato HH:mm)" }).refine((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
  }, { message: "Horário de fim inválido" }),
  description: z.string().trim().min(1, { message: "Descrição é obrigatória" }).max(500, { message: "Descrição deve ter no máximo 500 caracteres" })
});

export const AppointmentDialog = ({
  isOpen,
  onOpenChange,
  userId,
  selectedDate,
  onSuccess,
  editingAppointment
}: AppointmentDialogProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    date: editingAppointment?.date || format(selectedDate, 'yyyy-MM-dd'),
    start_time: editingAppointment?.start_time || '09:00',
    end_time: editingAppointment?.end_time || '10:00',
    description: editingAppointment?.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar dados do formulário
    try {
      appointmentSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ 
          title: 'Erro de validação', 
          description: error.errors[0].message,
          variant: 'destructive' 
        });
        return;
      }
    }

    // Validar que horário de fim é após horário de início
    const [startHours, startMinutes] = formData.start_time.split(':').map(Number);
    const [endHours, endMinutes] = formData.end_time.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      toast({ 
        title: 'Erro de validação', 
        description: 'O horário de fim deve ser posterior ao horário de início',
        variant: 'destructive' 
      });
      return;
    }

    const appointmentData = {
      user_id: userId,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      description: formData.description.trim()
    };

    if (editingAppointment) {
      const { error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', editingAppointment.id);

      if (error) {
        toast({ title: 'Erro ao atualizar compromisso', variant: 'destructive' });
        return;
      }
      toast({ title: 'Compromisso atualizado com sucesso!' });
    } else {
      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) {
        toast({ title: 'Erro ao criar compromisso', variant: 'destructive' });
        return;
      }
      toast({ title: 'Compromisso criado com sucesso!' });
    }

    onOpenChange(false);
    resetForm();
    onSuccess();
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;
    
    if (!confirm('Tem certeza que deseja excluir este compromisso?')) return;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', editingAppointment.id);

    if (error) {
      toast({ title: 'Erro ao excluir compromisso', variant: 'destructive' });
      return;
    }

    toast({ title: 'Compromisso excluído com sucesso!' });
    onOpenChange(false);
    resetForm();
    onSuccess();
  };

  const resetForm = () => {
    setFormData({
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '10:00',
      description: ''
    });
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.date ? format(new Date(formData.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                }
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Horário Início</Label>
          <Input
            type="time"
            step="900"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
            placeholder="HH:mm"
          />
          <p className="text-xs text-muted-foreground mt-1">Formato 24h</p>
        </div>
        <div>
          <Label>Horário Fim</Label>
          <Input
            type="time"
            step="900"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
            placeholder="HH:mm"
          />
          <p className="text-xs text-muted-foreground mt-1">Formato 24h</p>
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Consulta médica, Reunião com escola..."
          required
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-between">
        {editingAppointment && (
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            {editingAppointment ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>
              {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {formContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
