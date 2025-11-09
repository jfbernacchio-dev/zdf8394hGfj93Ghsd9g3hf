import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, FileText, Paperclip, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ClinicalEvolutionProps {
  patientId: string;
}

interface Session {
  id: string;
  date: string;
  time: string | null;
  status: string;
  notes: string | null;
  has_evaluation?: boolean;
  has_files?: boolean;
}

interface SessionEvaluation {
  id: string;
  session_id: string;
  patient_id: string;
  consciousness_data: any;
  orientation_data: any;
  attention_data: any;
  memory_data: any;
  mood_data: any;
  thought_data: any;
  language_data: any;
  sensoperception_data: any;
  intelligence_data: any;
  will_data: any;
  psychomotor_data: any;
  personality_data: any;
  created_at: string;
}

export function ClinicalEvolution({ patientId }: ClinicalEvolutionProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<SessionEvaluation | null>(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [patientId, period]);

  useEffect(() => {
    if (selectedSessionId) {
      loadEvaluation(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadSessions = async () => {
    setLoading(true);
    
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: true });

    // Apply period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'last_month':
          startDate = startOfMonth(subMonths(now, 1));
          break;
        case 'last_3_months':
          startDate = startOfMonth(subMonths(now, 3));
          break;
        case 'last_year':
          startDate = startOfMonth(subMonths(now, 12));
          break;
        default:
          startDate = new Date(0);
      }

      query = query.gte('date', startDate.toISOString().split('T')[0]);
    }

    const { data: sessionsData, error } = await query;

    if (error) {
      console.error('Error loading sessions:', error);
      setLoading(false);
      return;
    }

    // Check which sessions have evaluations
    const sessionIds = sessionsData?.map(s => s.id) || [];
    const { data: evaluationsData } = await supabase
      .from('session_evaluations')
      .select('session_id')
      .in('session_id', sessionIds);

    const evaluationSessionIds = new Set(evaluationsData?.map(e => e.session_id) || []);

    // Check which sessions have files
    const { data: filesData } = await supabase
      .from('patient_files')
      .select('id, file_name')
      .eq('patient_id', patientId)
      .eq('is_clinical', true);

    const sessionFiles = new Set(
      filesData?.filter(f => sessionIds.some(sid => f.file_name.includes(sid))).map(f => f.id) || []
    );

    const enrichedSessions = sessionsData?.map(session => ({
      ...session,
      has_evaluation: evaluationSessionIds.has(session.id),
      has_files: session.notes?.length > 0 || sessionFiles.size > 0
    })) || [];

    setSessions(enrichedSessions);

    // Select the last session with evaluation by default
    const lastEvaluatedSession = enrichedSessions
      .filter(s => s.has_evaluation)
      .pop();

    if (lastEvaluatedSession && !selectedSessionId) {
      setSelectedSessionId(lastEvaluatedSession.id);
    }

    setLoading(false);
  };

  const loadEvaluation = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error loading evaluation:', error);
      return;
    }

    setEvaluation(data);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      attended: 'Compareceu',
      missed: 'Falta',
      scheduled: 'Agendada',
      unscheduled: 'Desmarcada'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      attended: 'bg-accent/20 text-accent border-accent/30',
      missed: 'bg-red-500/20 text-red-600 border-red-500/30',
      scheduled: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      unscheduled: 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    };
    return colors[status] || 'bg-muted';
  };

  const renderEvaluationCard = (title: string, data: any, fields: { label: string; key: string; type?: string }[]) => {
    if (!data) return null;

    return (
      <Card className="h-full">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {fields.map((field) => {
            const value = data[field.key];
            if (value === undefined || value === null) return null;

            let displayValue: string;
            if (typeof value === 'boolean') {
              displayValue = value ? 'Sim' : 'Não';
            } else if (typeof value === 'number') {
              displayValue = value.toString();
            } else if (Array.isArray(value)) {
              displayValue = value.join(', ');
            } else {
              displayValue = value;
            }

            return (
              <div key={field.key} className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{field.label}</p>
                <p className="text-sm">{displayValue}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
      {/* Sidebar with sessions list */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sessões</h3>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="last_month">Último Mês</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
              <SelectItem value="last_year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[calc(100vh-400px)] pr-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma sessão encontrada</div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedSessionId === session.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(parseISO(session.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      {session.time && (
                        <span className="text-xs text-muted-foreground">{session.time}</span>
                      )}
                    </div>

                    <Badge variant="outline" className={cn("text-xs", getStatusColor(session.status))}>
                      {getStatusLabel(session.status)}
                    </Badge>

                    <div className="flex gap-2 flex-wrap">
                      {session.has_evaluation && (
                        <div className="flex items-center gap-1 text-xs text-accent">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Avaliação</span>
                        </div>
                      )}
                      {session.notes && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <FileText className="w-3 h-3" />
                          <span>Notas</span>
                        </div>
                      )}
                      {session.has_files && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <Paperclip className="w-3 h-3" />
                          <span>Arquivos</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main content - Evaluation display */}
      <div className="lg:col-span-3">
        {!selectedSessionId ? (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center p-8">
              <p className="text-muted-foreground">Selecione uma sessão para ver os detalhes</p>
            </CardContent>
          </Card>
        ) : !evaluation ? (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center p-8">
              <p className="text-muted-foreground">Esta sessão não possui avaliação registrada</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Avaliação da Sessão</h2>
                <span className="text-sm text-muted-foreground">
                  {format(parseISO(evaluation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderEvaluationCard('1. Consciência', evaluation.consciousness_data, [
                  { label: 'Nível', key: 'level' },
                  { label: 'Campo', key: 'field' },
                  { label: 'Autoconsciência', key: 'self_consciousness' },
                  { label: 'Despersonalização', key: 'depersonalization', type: 'boolean' },
                  { label: 'Desrealização', key: 'derealization', type: 'boolean' },
                  { label: 'Observações', key: 'notes' }
                ])}

                {renderEvaluationCard('2. Orientação', evaluation.orientation_data, [
                  { label: 'Tempo', key: 'time', type: 'boolean' },
                  { label: 'Espaço', key: 'space', type: 'boolean' },
                  { label: 'Pessoa', key: 'person', type: 'boolean' },
                  { label: 'Situação', key: 'situation', type: 'boolean' },
                  { label: 'Insight', key: 'insight' },
                  { label: 'Juízo de Realidade', key: 'reality_judgment' },
                  { label: 'Comentários', key: 'comments' }
                ])}

                {renderEvaluationCard('3. Memória', evaluation.memory_data, [
                  { label: 'Fixação', key: 'fixation' },
                  { label: 'Evocação', key: 'recall' },
                  { label: 'Auditiva', key: 'auditory', type: 'boolean' },
                  { label: 'Amnésia', key: 'amnesia', type: 'boolean' },
                  { label: 'Paramnésia', key: 'paramnesia', type: 'boolean' },
                  { label: 'Hipermnésia', key: 'hypermnesia', type: 'boolean' },
                  { label: 'Fobias', key: 'phobias', type: 'boolean' },
                  { label: 'Notas', key: 'notes' }
                ])}

                {renderEvaluationCard('4. Humor / Afeto', evaluation.mood_data, [
                  { label: 'Polaridade', key: 'polarity' },
                  { label: 'Labilidade', key: 'lability' },
                  { label: 'Adequação', key: 'adequacy' },
                  { label: 'Responsividade Emocional', key: 'emotional_responsiveness', type: 'boolean' },
                  { label: 'Notas', key: 'notes' }
                ])}

                {renderEvaluationCard('5. Pensamento', evaluation.thought_data, [
                  { label: 'Curso', key: 'course' },
                  { label: 'Obsessivo', key: 'obsessive', type: 'boolean' },
                  { label: 'Delirante', key: 'delusional', type: 'boolean' },
                  { label: 'Incoerente', key: 'incoherent', type: 'boolean' },
                  { label: 'Supervalorizado', key: 'overvalued', type: 'boolean' },
                  { label: 'Tangencial', key: 'tangential', type: 'boolean' },
                  { label: 'Circunstancial', key: 'circumstantial', type: 'boolean' },
                  { label: 'Dissociado', key: 'dissociated', type: 'boolean' },
                  { label: 'Descrição', key: 'description' }
                ])}

                {renderEvaluationCard('6. Linguagem', evaluation.language_data, [
                  { label: 'Velocidade da Fala', key: 'speech_rate' },
                  { label: 'Articulação', key: 'articulation' },
                  { label: 'Observações', key: 'observations' }
                ])}

                {renderEvaluationCard('7. Sensopercepção', evaluation.sensoperception_data, [
                  { label: 'Percepção Global', key: 'global_perception' },
                  { label: 'Auditiva', key: 'auditory', type: 'boolean' },
                  { label: 'Visual', key: 'visual', type: 'boolean' },
                  { label: 'Tátil', key: 'tactile', type: 'boolean' },
                  { label: 'Olfativa', key: 'olfactory', type: 'boolean' },
                  { label: 'Cinestésica', key: 'kinesthetic', type: 'boolean' },
                  { label: 'Mista', key: 'mixed', type: 'boolean' },
                  { label: 'Descrição', key: 'description' }
                ])}

                {renderEvaluationCard('8. Inteligência', evaluation.intelligence_data, [
                  { label: 'Capacidade de Aprendizagem', key: 'learning_capacity' },
                  { label: 'Raciocínio Abstrato', key: 'abstract_reasoning' },
                  { label: 'Capacidade Adaptativa', key: 'adaptive_capacity' },
                  { label: 'Expressividade Facial', key: 'facial_expressivity' },
                  { label: 'Notas', key: 'notes' }
                ])}

                {renderEvaluationCard('9. Vontade', evaluation.will_data, [
                  { label: 'Energia Volitiva', key: 'volitional_energy' },
                  { label: 'Controle de Impulsos', key: 'impulse_control' },
                  { label: 'Ambivalência', key: 'ambivalence', type: 'boolean' },
                  { label: 'Observações', key: 'observations' }
                ])}

                {renderEvaluationCard('10. Psicomotricidade', evaluation.psychomotor_data, [
                  { label: 'Atividade Motora', key: 'motor_activity' },
                  { label: 'Tom e Gestos', key: 'tone_gestures' },
                  { label: 'Expressividade Facial', key: 'facial_expressiveness' },
                  { label: 'Notas', key: 'notes' }
                ])}

                {renderEvaluationCard('11. Atenção', evaluation.attention_data, [
                  { label: 'Amplitude', key: 'range' },
                  { label: 'Concentração', key: 'concentration' },
                  { label: 'Distraibilidade', key: 'distractibility', type: 'boolean' },
                  { label: 'Notas', key: 'notes' }
                ])}

                {renderEvaluationCard('12. Personalidade', evaluation.personality_data, [
                  { label: 'Coerência do Self', key: 'self_coherence' },
                  { label: 'Limites do Self', key: 'self_boundaries' },
                  { label: 'Estabilidade Afetiva', key: 'affective_stability' },
                  { label: 'Ansioso', key: 'anxious', type: 'boolean' },
                  { label: 'Evitativo', key: 'avoidant', type: 'boolean' },
                  { label: 'Obsessivo', key: 'obsessive', type: 'boolean' },
                  { label: 'Antissocial', key: 'antisocial', type: 'boolean' },
                  { label: 'Borderline', key: 'borderline', type: 'boolean' },
                  { label: 'Histriônico', key: 'histrionic', type: 'boolean' },
                  { label: 'Narcisista', key: 'narcissistic', type: 'boolean' },
                  { label: 'Observações', key: 'observations' }
                ])}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
