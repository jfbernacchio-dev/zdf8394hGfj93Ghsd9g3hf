import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  selectedDate: Date;
  onSuccess: () => void;
  editingAppointment?: any;
}

export const AppointmentDialog = ({
  isOpen,
  onOpenChange,
  userId,
  selectedDate,
  onSuccess,
  editingAppointment
}: AppointmentDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: editingAppointment?.date || format(selectedDate, 'yyyy-MM-dd'),
    start_time: editingAppointment?.start_time || '09:00',
    end_time: editingAppointment?.end_time || '10:00',
    description: editingAppointment?.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast({ title: 'Descrição é obrigatória', variant: 'destructive' });
      return;
    }

    const appointmentData = {
      user_id: userId,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      description: formData.description
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Horário Início</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Horário Fim</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
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
      </DialogContent>
    </Dialog>
  );
};
