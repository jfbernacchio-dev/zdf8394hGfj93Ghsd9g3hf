import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Therapist {
  id: string;
  full_name: string;
  email: string;
  crp: string;
  patient_count: number;
  upcoming_sessions: number;
  missed_sessions: number;
}

const TherapistManagement = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchTherapists();
  }, [isAdmin, navigate, user]);

  const fetchTherapists = async () => {
    if (!user) return;

    try {
      // Get therapists created by this admin
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('created_by', user.id);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setTherapists([]);
        setLoading(false);
        return;
      }

      const therapistIds = profiles.map(p => p.id);
      
      // Get patient counts
      const { data: patientCounts } = await supabase
        .from('patients')
        .select('user_id')
        .in('user_id', therapistIds);

      // Get all patients for these therapists
      const { data: allPatients } = await supabase
        .from('patients')
        .select('id, user_id')
        .in('user_id', therapistIds);

      const patientIds = allPatients?.map(p => p.id) || [];

      // Get session stats
      const { data: sessions } = await supabase
        .from('sessions')
        .select('patient_id, status')
        .in('patient_id', patientIds);

      // Combine data - we'll need to get emails from auth users table using RPC or edge function
      const therapistsData: Therapist[] = profiles.map((profile) => {
        const therapistPatients = allPatients?.filter(p => p.user_id === profile.id) || [];
        const therapistPatientIds = therapistPatients.map(p => p.id);
        const therapistSessions = sessions?.filter(s => therapistPatientIds.includes(s.patient_id)) || [];

        const patientCount = therapistPatients.length;
        const upcomingSessions = therapistSessions.filter(s => s.status === 'scheduled').length;
        const missedSessions = therapistSessions.filter(s => s.status === 'missed').length;

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: '', // Email will be fetched separately
          crp: profile.crp,
          patient_count: patientCount,
          upcoming_sessions: upcomingSessions,
          missed_sessions: missedSessions,
        };
      });

      setTherapists(therapistsData);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Terapeutas</h1>
          <p className="text-muted-foreground">Gerencie e monitore seus terapeutas</p>
        </div>
        <Button onClick={() => navigate('/create-therapist')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Terapeuta
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <Card className="p-6">
              <p>Carregando...</p>
            </Card>
          ) : therapists.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum terapeuta cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro terapeuta
              </p>
              <Button onClick={() => navigate('/create-therapist')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Terapeuta
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {therapists.map((therapist) => (
                <Card key={therapist.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{therapist.full_name}</h3>
                      <Badge variant="outline" className="mt-2">CRP: {therapist.crp}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                      <div className="text-center">
                        <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <p className="text-2xl font-bold">{therapist.patient_count}</p>
                        <p className="text-xs text-muted-foreground">Pacientes</p>
                      </div>
                      <div className="text-center">
                        <Calendar className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                        <p className="text-2xl font-bold">{therapist.upcoming_sessions}</p>
                        <p className="text-xs text-muted-foreground">Agendadas</p>
                      </div>
                      <div className="text-center">
                        <AlertCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
                        <p className="text-2xl font-bold">{therapist.missed_sessions}</p>
                        <p className="text-xs text-muted-foreground">Faltas</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-primary">{therapists.length}</p>
                <p className="text-sm text-muted-foreground">Total de Terapeutas</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-blue-500">
                  {therapists.reduce((acc, t) => acc + t.patient_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total de Pacientes</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-green-500">
                  {therapists.reduce((acc, t) => acc + t.upcoming_sessions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Sessões Agendadas</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-3xl font-bold text-destructive">
                  {therapists.reduce((acc, t) => acc + t.missed_sessions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total de Faltas</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TherapistManagement;
