import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user!.id);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*');

    setPatients(patientsData || []);
    setSessions(sessionsData || []);
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPatientStats = (patientId: string) => {
    const patientSessions = sessions.filter(s => s.patient_id === patientId && s.status === 'attended');
    const unpaidSessions = patientSessions.filter(s => !s.paid);
    const total = patientSessions.reduce((sum, s) => sum + Number(s.value), 0);
    const unpaid = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
    return { totalSessions: patientSessions.length, totalValue: total, unpaidCount: unpaidSessions.length, unpaidValue: unpaid };
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Pacientes</h1>
            <p className="text-muted-foreground">Gerencie seus pacientes</p>
          </div>
          <Button onClick={() => navigate('/patients/new')} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>

        <Card className="p-4 mb-6 shadow-[var(--shadow-card)] border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => {
            const stats = getPatientStats(patient.id);
            return (
              <Card key={patient.id} className="p-6 shadow-[var(--shadow-card)] border-border hover:shadow-[var(--shadow-soft)] transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}/edit`); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sessões:</span>
                    <span className="font-medium text-foreground">{stats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Em Aberto:</span>
                    <span className="font-medium text-warning">{stats.unpaidCount} (R$ {stats.unpaidValue.toFixed(2)})</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum paciente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
