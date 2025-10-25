import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { Patient, Session } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Calendar, DollarSign, Edit } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    value: '',
    attended: true,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = () => {
    const patients = storage.getPatients();
    const found = patients.find(p => p.id === id);
    setPatient(found || null);
    
    const allSessions = storage.getSessions();
    setSessions(allSessions.filter(s => s.patientId === id).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allSessions = storage.getSessions();
    const newSession: Session = {
      id: Date.now().toString(),
      patientId: id!,
      date: formData.date,
      value: parseFloat(formData.value),
      attended: formData.attended,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };
    
    storage.saveSessions([...allSessions, newSession]);
    
    toast({
      title: "Sessão registrada!",
      description: "A sessão foi adicionada com sucesso.",
    });
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      value: '',
      attended: true,
      notes: '',
    });
    setShowForm(false);
    loadData();
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session.id);
  };

  const handleUpdateSession = (sessionId: string, updates: Partial<Session>) => {
    const allSessions = storage.getSessions();
    const updatedSessions = allSessions.map(s => 
      s.id === sessionId ? { ...s, ...updates } : s
    );
    storage.saveSessions(updatedSessions);
    
    toast({
      title: "Sessão atualizada!",
      description: "As alterações foram salvas com sucesso.",
    });
    
    setEditingSession(null);
    loadData();
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-[var(--gradient-soft)]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Paciente não encontrado</p>
        </div>
      </div>
    );
  }

  const totalValue = sessions.filter(s => s.attended).reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/patients')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-8 mb-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-2xl">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
                <p className="text-muted-foreground">{patient.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/patients/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Sessões</p>
                <p className="text-xl font-semibold text-foreground">{sessions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-semibold text-foreground">R$ {totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Sessões</h2>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Sessão
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-6 shadow-[var(--shadow-card)] border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.attended}
                  onCheckedChange={(checked) => setFormData({ ...formData, attended: checked })}
                />
                <Label>Paciente compareceu</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Salvar Sessão
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          {sessions.map(session => (
            <Card key={session.id} className="p-6 shadow-[var(--shadow-card)] border-border">
              {editingSession === session.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        defaultValue={session.date}
                        onChange={(e) => session.date = e.target.value}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={session.value}
                        onChange={(e) => session.value = parseFloat(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={session.attended}
                      onCheckedChange={(checked) => session.attended = checked}
                    />
                    <Label>Paciente compareceu</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      defaultValue={session.notes}
                      onChange={(e) => session.notes = e.target.value}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleUpdateSession(session.id, session)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Salvar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSession(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-foreground">
                        {new Date(session.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.attended 
                          ? 'bg-success/10 text-[hsl(var(--success))]' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {session.attended ? 'Compareceu' : 'Faltou'}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground mb-2">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-semibold text-foreground">
                      R$ {session.value.toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSession(session)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma sessão registrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
