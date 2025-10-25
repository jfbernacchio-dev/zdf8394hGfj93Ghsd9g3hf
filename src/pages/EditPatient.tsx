import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { Patient } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

const EditPatient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    frequency: 'weekly' as 'weekly' | 'biweekly',
    sessionDay: 'monday' as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    sessionTime: '',
    startDate: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    const patients = storage.getPatients();
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setFormData({
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birthDate,
        frequency: patient.frequency,
        sessionDay: patient.sessionDay,
        sessionTime: patient.sessionTime,
        startDate: patient.startDate,
        status: patient.status,
      });
    }
  }, [id]);

  const handleDeactivate = () => {
    if (!confirm('Tem certeza que deseja encerrar este paciente? Todas as sessões futuras serão canceladas.')) {
      return;
    }

    const patients = storage.getPatients();
    const updatedPatients = patients.map(p => 
      p.id === id ? { ...p, status: 'inactive' as const } : p
    );
    storage.savePatients(updatedPatients);

    // Cancelar todas as sessões futuras
    const sessions = storage.getSessions();
    const today = new Date().toISOString().split('T')[0];
    const updatedSessions = sessions.filter(s => 
      s.patientId !== id || s.date < today
    );
    storage.saveSessions(updatedSessions);

    toast({
      title: "Paciente encerrado!",
      description: "Todas as sessões futuras foram canceladas.",
    });

    navigate(`/patients/${id}`);
  };

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja EXCLUIR este paciente? Esta ação não pode ser desfeita e todos os dados serão perdidos.')) {
      return;
    }

    // Remover paciente
    const patients = storage.getPatients();
    const updatedPatients = patients.filter(p => p.id !== id);
    storage.savePatients(updatedPatients);

    // Remover todas as sessões do paciente
    const sessions = storage.getSessions();
    const updatedSessions = sessions.filter(s => s.patientId !== id);
    storage.saveSessions(updatedSessions);

    toast({
      title: "Paciente excluído!",
      description: "O paciente e todos os seus dados foram removidos.",
    });

    navigate('/patients');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const patients = storage.getPatients();
    const updatedPatients = patients.map(p => 
      p.id === id ? { ...p, ...formData } : p
    );
    
    storage.savePatients(updatedPatients);
    
    toast({
      title: "Paciente atualizado!",
      description: "As informações foram salvas com sucesso.",
    });
    
    navigate(`/patients/${id}`);
  };

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
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
              <Label htmlFor="startDate">Data de início</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionDay">Dia da semana da sessão</Label>
              <Select 
                value={formData.sessionDay} 
                onValueChange={(value) => setFormData({ ...formData, sessionDay: value as any })}
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
                required
                value={formData.sessionTime}
                onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
              />
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
      </div>
    </div>
  );
};

export default EditPatient;
