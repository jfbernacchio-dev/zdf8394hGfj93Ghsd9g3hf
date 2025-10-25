import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const { data: patientData } = await supabase.from('patients').select('*').eq('id', id).single();
    const { data: sessionsData } = await supabase.from('sessions').select('*').eq('patient_id', id).order('date', { ascending: false });
    
    setPatient(patientData);
    setSessions(sessionsData || []);
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

  const totalSessions = sessions.filter(s => s.status === 'attended').length;
  const unpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
  const totalValue = sessions.filter(s => s.status === 'attended').reduce((sum, s) => sum + Number(s.value || 0), 0);

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
                <p className="text-xl font-semibold text-foreground">{totalSessions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Sessões em Aberto</p>
                <p className="text-xl font-semibold text-foreground">{unpaidSessions.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <h2 className="text-xl font-semibold mb-4 text-foreground">Histórico de Sessões</h2>
        <div className="space-y-4">
          {sessions.map(session => (
            <Card key={session.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{new Date(session.date).toLocaleDateString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground capitalize">{session.status}</p>
                  {session.notes && <p className="text-sm mt-1">{session.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {Number(session.value).toFixed(2)}</p>
                  {session.paid && <p className="text-xs text-success">Pago</p>}
                </div>
              </div>
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
