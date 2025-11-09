import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SessionEvaluationForm from './SessionEvaluationForm';
import { formatBrazilianDate } from '@/lib/brazilianFormat';

export default function SessionEvaluationMock() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mockPatientId, setMockPatientId] = useState<string | null>(null);
  const [mockSessionId, setMockSessionId] = useState<string | null>(null);
  const [mockPatient, setMockPatient] = useState<any>(null);
  const [mockSession, setMockSession] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) {
      setupMockData();
    }
  }, [user]);

  const setupMockData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar ou criar paciente mock
      let { data: existingPatient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Paciente Mock - Avaliação de Sessão')
        .maybeSingle();

      if (patientError && patientError.code !== 'PGRST116') throw patientError;

      if (!existingPatient) {
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            name: 'Paciente Mock - Avaliação de Sessão',
            email: 'mock.session@example.com',
            phone: '(11) 99999-9999',
            session_value: 200,
            frequency: 'weekly',
            session_day: 'Monday',
            session_time: '14:00',
            status: 'active',
            no_nfse: true
          })
          .select()
          .single();

        if (createError) throw createError;
        existingPatient = newPatient;
      }

      setMockPatientId(existingPatient.id);
      setMockPatient(existingPatient);

      // Buscar ou criar sessão mock
      let { data: existingSession, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', existingPatient.id)
        .maybeSingle();

      if (sessionError && sessionError.code !== 'PGRST116') throw sessionError;

      if (!existingSession) {
        const today = new Date().toISOString().split('T')[0];
        const { data: newSession, error: createSessionError } = await supabase
          .from('sessions')
          .insert({
            patient_id: existingPatient.id,
            date: today,
            time: '14:00',
            value: 200,
            status: 'attended'
          })
          .select()
          .single();

        if (createSessionError) throw createSessionError;
        existingSession = newSession;
      }

      setMockSessionId(existingSession.id);
      setMockSession(existingSession);

      toast({
        title: 'Mock criado',
        description: 'Paciente e sessão mock foram configurados com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao configurar mock:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar os dados mock',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mockPatientId || !mockSessionId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Não foi possível criar os dados mock</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/schedule')}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <SessionEvaluationForm
        sessionId={mockSessionId}
        patientId={mockPatientId}
        isMock={true}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mock - Avaliação de Sessão</h1>
          <p className="text-muted-foreground">
            Ambiente de teste para o sistema de avaliação de funções psíquicas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados Mock Criados</CardTitle>
            <CardDescription>
              Os seguintes dados foram criados para teste. Você pode editar a avaliação da sessão abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{mockPatient?.name}</p>
                <p className="text-sm text-muted-foreground">{mockPatient?.email}</p>
                <p className="text-sm text-muted-foreground">{mockPatient?.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Sessão Agendada</p>
                <p className="text-sm text-muted-foreground">
                  Data: {formatBrazilianDate(mockSession?.date)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Horário: {mockSession?.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {mockSession?.status === 'attended' ? 'Realizada' : 'Agendada'}
                </p>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button onClick={() => setShowForm(true)} size="lg" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Preencher Avaliação da Sessão
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/schedule')}
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">ℹ️ Sobre o Mock</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Este é um ambiente de teste isolado. Você pode preencher a avaliação quantas vezes quiser sem afetar dados reais.
            </p>
            <p>
              <strong>O que será testado:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Formulário completo com 12 grupos de funções psíquicas</li>
              <li>Sliders para escalas contínuas (-100 a +100 ou 0-100)</li>
              <li>Checkboxes para múltiplas opções</li>
              <li>Dropdowns para categorias exclusivas</li>
              <li>Campos de texto para observações qualitativas</li>
              <li>Salvamento e recuperação dos dados</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}