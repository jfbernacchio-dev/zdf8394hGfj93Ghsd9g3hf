import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { Patient, Session } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

const NewPatient = () => {
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
  });

  const getDayOfWeekNumber = (day: string): number => {
    const days = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[day as keyof typeof days];
  };

  const generateFutureSessions = (
    patientId: string, 
    startDate: string, 
    frequency: 'weekly' | 'biweekly', 
    sessionDay: string,
    sessionTime: string
  ) => {
    const sessions: Session[] = [];
    const start = new Date(startDate);
    const targetDay = getDayOfWeekNumber(sessionDay);
    
    // Encontrar a primeira ocorrência do dia da semana a partir da data de início
    let firstSession = new Date(start);
    while (firstSession.getDay() !== targetDay) {
      firstSession.setDate(firstSession.getDate() + 1);
    }
    
    const weeksToGenerate = 52; // 1 ano de sessões
    const interval = frequency === 'weekly' ? 1 : 2;
    
    for (let i = 0; i < weeksToGenerate; i++) {
      const sessionDate = new Date(firstSession);
      sessionDate.setDate(firstSession.getDate() + (i * interval * 7));
      
      sessions.push({
        id: `${patientId}-${sessionDate.toISOString()}`,
        patientId,
        date: sessionDate.toISOString().split('T')[0],
        value: 0,
        attended: true,
        notes: '',
        createdAt: new Date().toISOString(),
      });
    }
    
    return sessions;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const patients = storage.getPatients();
    const newPatient: Patient = {
      id: Date.now().toString(),
      ...formData,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    storage.savePatients([...patients, newPatient]);
    
    // Gerar sessões automáticas
    const existingSessions = storage.getSessions();
    const newSessions = generateFutureSessions(
      newPatient.id, 
      formData.startDate, 
      formData.frequency,
      formData.sessionDay,
      formData.sessionTime
    );
    storage.saveSessions([...existingSessions, ...newSessions]);
    
    toast({
      title: "Paciente cadastrado!",
      description: `${newPatient.name} foi adicionado com sucesso e as sessões foram agendadas.`,
    });
    
    navigate('/patients');
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
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
              Cadastrar Paciente
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewPatient;
