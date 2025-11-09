import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, FileText, Paperclip, Calendar, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { SessionFileUpload } from './SessionFileUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

type Severity = 'normal' | 'moderate' | 'severe';

export function ClinicalEvolution({ patientId }: ClinicalEvolutionProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [evaluation, setEvaluation] = useState<SessionEvaluation | null>(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [patientId, period]);

  useEffect(() => {
    if (selectedSessionId) {
      loadEvaluation(selectedSessionId);
      const session = sessions.find(s => s.id === selectedSessionId);
      setSelectedSession(session || null);
      setClinicalNotes(session?.notes || '');
    }
  }, [selectedSessionId, sessions]);

  const loadSessions = async () => {
    setLoading(true);
    
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: true });

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

    const sessionIds = sessionsData?.map(s => s.id) || [];
    const { data: evaluationsData } = await supabase
      .from('session_evaluations')
      .select('session_id')
      .in('session_id', sessionIds);

    const evaluationSessionIds = new Set(evaluationsData?.map(e => e.session_id) || []);

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

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'normal':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'moderate':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'severe':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const generateSummary = (evaluation: SessionEvaluation): string => {
    const summaryParts: string[] = [];

    // 1. Consciousness
    const consciousness = evaluation.consciousness_data;
    if (consciousness?.level < 40) {
      summaryParts.push('rebaixamento do nível de consciência');
    } else if (consciousness?.depersonalization || consciousness?.derealization) {
      summaryParts.push('fenômenos dissociativos');
    }

    // 2. Orientation
    const orientation = evaluation.orientation_data;
    const orientedCount = [orientation?.time, orientation?.space, orientation?.person, orientation?.situation].filter(Boolean).length;
    if (orientedCount < 4) {
      summaryParts.push('desorientação parcial');
    }

    // 3. Memory
    const memory = evaluation.memory_data;
    const memoryAvg = ((memory?.fixation || 0) + (memory?.recall || 0)) / 2;
    if (memoryAvg < 50) {
      summaryParts.push('prejuízo de memória');
    }

    // 4. Mood
    const mood = evaluation.mood_data;
    if (mood?.polarity < -30) {
      summaryParts.push('humor deprimido');
    } else if (mood?.polarity > 30) {
      summaryParts.push('humor elevado');
    }
    if (mood?.lability > 60) {
      summaryParts.push('labilidade emocional');
    }

    // 5. Thought
    const thought = evaluation.thought_data;
    const thoughtAlterations = [];
    if (thought?.obsessive) thoughtAlterations.push('obsessivo');
    if (thought?.delusional) thoughtAlterations.push('delirante');
    if (thought?.incoherent) thoughtAlterations.push('incoerente');
    if (thought?.tangential) thoughtAlterations.push('tangencial');
    if (thoughtAlterations.length > 0) {
      summaryParts.push(`pensamento ${thoughtAlterations.join(', ')}`);
    }

    // 6. Language
    const language = evaluation.language_data;
    const speechRate = language?.speech_rate || 0;
    if (Math.abs(speechRate) > 50) {
      summaryParts.push(speechRate > 0 ? 'fala muito acelerada' : 'fala muito lentificada');
    } else if (Math.abs(speechRate) > 20) {
      summaryParts.push(speechRate > 0 ? 'fala acelerada' : 'fala lentificada');
    }

    // 7. Sensoperception
    const senso = evaluation.sensoperception_data;
    const hallucinations = [];
    if (senso?.auditory) hallucinations.push('auditivas');
    if (senso?.visual) hallucinations.push('visuais');
    if (senso?.tactile) hallucinations.push('táteis');
    if (senso?.olfactory) hallucinations.push('olfativas');
    if (hallucinations.length > 0) {
      summaryParts.push(`alucinações ${hallucinations.join(', ')}`);
    }

    // 8. Intelligence
    const intel = evaluation.intelligence_data;
    const intelAvg = ((intel?.learning_capacity || 0) + (intel?.abstract_reasoning || 0)) / 2;
    if (intelAvg < 50) {
      summaryParts.push('prejuízo das funções intelectuais');
    }

    // 9. Will
    const will = evaluation.will_data;
    if (will?.volitional_energy < 40) {
      summaryParts.push('energia volitiva reduzida');
    }
    if (will?.impulse_control < 40) {
      summaryParts.push('dificuldade no controle de impulsos');
    }

    // 10. Psychomotor
    const psycho = evaluation.psychomotor_data;
    const motorActivity = psycho?.motor_activity || 0;
    if (Math.abs(motorActivity) > 50) {
      summaryParts.push(motorActivity > 0 ? 'agitação psicomotora' : 'lentificação psicomotora');
    }

    // 11. Attention
    const attention = evaluation.attention_data;
    const attentionAvg = ((attention?.range || 0) + (attention?.concentration || 0)) / 2;
    if (attentionAvg < 50 || attention?.distractibility) {
      summaryParts.push('déficit de atenção');
    }

    // 12. Personality
    const personality = evaluation.personality_data;
    const traits = [];
    if (personality?.anxious) traits.push('ansioso');
    if (personality?.avoidant) traits.push('evitativo');
    if (personality?.obsessive) traits.push('obsessivo');
    if (personality?.borderline) traits.push('borderline');
    if (personality?.antisocial) traits.push('antissocial');
    if (personality?.narcissistic) traits.push('narcisista');
    if (traits.length > 0) {
      summaryParts.push(`traços de personalidade ${traits.join(', ')}`);
    }
    if ((personality?.self_coherence || 0) < 40 || (personality?.affective_stability || 0) < 40) {
      summaryParts.push('instabilidade da personalidade');
    }

    if (summaryParts.length === 0) {
      return 'Paciente não apresenta alterações significativas nas funções psíquicas avaliadas. Exame mental dentro dos padrões esperados.';
    }

    return `Paciente apresenta ${summaryParts.join(', ')}. ${summaryParts.length < 6 ? 'Demais funções psíquicas preservadas.' : ''}`;
  };

  const renderEvaluationCard = (
    title: string,
    data: any,
    getSummary: (data: any) => { text: string; severity: Severity; values?: { label: string; value: number }[] }
  ) => {
    if (!data) return null;

    const { text, severity, values } = getSummary(data);

    return (
      <Card className={cn("h-full", getSeverityColor(severity))}>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <p className="text-sm">{text}</p>
          {values && values.length > 0 && (
            <div className="space-y-2">
              {values.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", getProgressColor(item.value))}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const getConsciousnessSummary = (data: any) => {
    const level = data.level || 0;
    const field = data.field || 0;
    const selfConsciousness = data.self_consciousness || 0;
    let text = '';
    let severity: Severity = 'normal';

    // Level: -100 (coma) | 0 (normal) | +100 (confusão)
    if (Math.abs(level) <= 20) {
      text = 'Nível de consciência preservado, lúcido e vígil.';
    } else if (Math.abs(level) <= 50) {
      text = level < 0 
        ? 'Leve rebaixamento do nível de consciência (torpor leve).' 
        : 'Leve alteração do nível de consciência (hipervigilante).';
      severity = 'moderate';
    } else {
      text = level < 0 
        ? 'Rebaixamento significativo do nível de consciência.' 
        : 'Confusão mental presente.';
      severity = 'severe';
    }

    if (data.depersonalization || data.derealization) {
      text += ' Presença de fenômenos dissociativos.';
      severity = 'severe';
    }

    return { 
      text, 
      severity, 
      values: [
        { label: 'Nível', value: ((level + 100) / 2) },
        { label: 'Campo', value: ((field + 100) / 2) },
        { label: 'Auto-consciência', value: ((selfConsciousness + 100) / 2) }
      ] 
    };
  };

  const getOrientationSummary = (data: any) => {
    const oriented = [data.time, data.space, data.person, data.situation].filter(Boolean).length;
    let text = '';
    let severity: Severity = 'normal';

    if (oriented === 4) {
      text = 'Paciente orientado em tempo, espaço, pessoa e situação.';
    } else if (oriented >= 2) {
      text = 'Orientação parcialmente preservada.';
      severity = 'moderate';
    } else {
      text = 'Desorientação significativa.';
      severity = 'severe';
    }

    const insight = data.insight || 0;
    return {
      text,
      severity,
      values: [{ label: 'Insight', value: insight }]
    };
  };

  const getMemorySummary = (data: any) => {
    const fixation = data.fixation || 0;
    const recall = data.recall || 0;
    const avg = (fixation + recall) / 2;

    let text = '';
    let severity: Severity = 'normal';

    if (avg >= 70) {
      text = 'Memória preservada, sem prejuízos significativos.';
    } else if (avg >= 40) {
      text = 'Prejuízo leve a moderado de memória.';
      severity = 'moderate';
    } else {
      text = 'Prejuízo significativo de memória.';
      severity = 'severe';
    }

    if (data.amnesia) {
      text += ' Presença de amnésia.';
      severity = 'severe';
    }

    return {
      text,
      severity,
      values: [
        { label: 'Fixação', value: fixation },
        { label: 'Evocação', value: recall }
      ]
    };
  };

  const getMoodSummary = (data: any) => {
    const polarity = data.polarity || 0;
    const lability = data.lability || 0;

    let text = '';
    let severity: Severity = 'normal';

    // Polarity: -100 (depressivo) | 0 (eutímico) | +100 (eufórico)
    if (Math.abs(polarity) <= 20) {
      text = 'Humor eutímico, sem alterações significativas.';
    } else if (Math.abs(polarity) <= 60) {
      text = polarity < 0 ? 'Humor deprimido.' : 'Humor elevado.';
      severity = 'moderate';
    } else {
      text = polarity < 0 ? 'Humor severamente deprimido.' : 'Humor eufórico.';
      severity = 'severe';
    }

    if (lability > 60) {
      text += ' Labilidade emocional presente.';
      severity = 'moderate';
    }

    return {
      text,
      severity,
      values: [
        { label: 'Polaridade', value: ((polarity + 100) / 2) },
        { label: 'Labilidade', value: lability }
      ]
    };
  };

  const getThoughtSummary = (data: any) => {
    const course = data.course || 0;
    let text = '';
    let severity: Severity = 'normal';

    // Course: -100 (lentificação) | 0 (normal) | +100 (fuga de ideias)
    if (Math.abs(course) <= 20) {
      text = 'Pensamento com curso normal.';
    } else if (Math.abs(course) <= 50) {
      text = course < 0 ? 'Pensamento lentificado.' : 'Pensamento acelerado.';
      severity = 'moderate';
    } else {
      text = course < 0 ? 'Pensamento muito lentificado.' : 'Fuga de ideias presente.';
      severity = 'severe';
    }

    const alterations = [];
    if (data.obsessive) alterations.push('obsessivo');
    if (data.delusional) alterations.push('delirante');
    if (data.incoherent) alterations.push('incoerente');
    if (data.tangential) alterations.push('tangencial');

    if (alterations.length > 0) {
      text += ` Conteúdo ${alterations.join(', ')}.`;
      severity = data.delusional || data.incoherent ? 'severe' : 'moderate';
    }

    return { 
      text, 
      severity,
      values: [{ label: 'Curso do Pensamento', value: ((course + 100) / 2) }]
    };
  };

  const getLanguageSummary = (data: any) => {
    const speechRate = data.speech_rate || 0;
    let text = '';
    let severity: Severity = 'normal';

    // Speech rate: -100 (bradilalia) | 0 (normal) | +100 (taquilalia)
    if (Math.abs(speechRate) <= 20) {
      text = 'Linguagem preservada, ritmo e articulação normais.';
    } else if (Math.abs(speechRate) <= 50) {
      text = speechRate > 0 ? 'Fala acelerada (taquilalia leve).' : 'Fala lentificada (bradilalia leve).';
      severity = 'moderate';
    } else {
      text = speechRate > 0 ? 'Fala muito acelerada (taquilalia severa).' : 'Fala muito lentificada (bradilalia severa).';
      severity = 'severe';
    }

    return { 
      text, 
      severity,
      values: [{ label: 'Velocidade da fala', value: ((speechRate + 100) / 2) }]
    };
  };

  const getSensoperceptionSummary = (data: any) => {
    let text = 'Sensopercepção preservada.';
    let severity: Severity = 'normal';

    const hallucinations = [];
    if (data.auditory) hallucinations.push('auditivas');
    if (data.visual) hallucinations.push('visuais');
    if (data.tactile) hallucinations.push('táteis');
    if (data.olfactory) hallucinations.push('olfativas');

    if (hallucinations.length > 0) {
      text = `Presença de alucinações ${hallucinations.join(', ')}.`;
      severity = 'severe';
    }

    return { text, severity };
  };

  const getIntelligenceSummary = (data: any) => {
    const learning = data.learning_capacity || 0;
    const reasoning = data.abstract_reasoning || 0;
    const avg = (learning + reasoning) / 2;

    let text = '';
    let severity: Severity = 'normal';

    if (avg >= 70) {
      text = 'Funções intelectuais preservadas.';
    } else if (avg >= 40) {
      text = 'Leve prejuízo das funções intelectuais.';
      severity = 'moderate';
    } else {
      text = 'Prejuízo significativo das funções intelectuais.';
      severity = 'severe';
    }

    return {
      text,
      severity,
      values: [
        { label: 'Aprendizagem', value: learning },
        { label: 'Raciocínio Abstrato', value: reasoning }
      ]
    };
  };

  const getWillSummary = (data: any) => {
    const energy = data.volitional_energy || 0;
    const impulse = data.impulse_control || 0;

    let text = '';
    let severity: Severity = 'normal';

    // Energy: -100 (abulia) | 0 (normal) | +100 (hiperbulia)
    if (Math.abs(energy) <= 20) {
      text = 'Energia volitiva preservada.';
    } else if (Math.abs(energy) <= 50) {
      text = energy < 0 ? 'Energia volitiva reduzida (abulia leve).' : 'Energia volitiva aumentada (hiperbulia leve).';
      severity = 'moderate';
    } else {
      text = energy < 0 ? 'Abulia significativa presente.' : 'Hiperbulia significativa presente.';
      severity = 'severe';
    }

    // Impulse: -100 (impulsivo) | 0 (equilibrado) | +100 (inibido)
    if (Math.abs(impulse) > 50) {
      text += impulse < 0 ? ' Impulsividade significativa.' : ' Inibição volitiva excessiva.';
      severity = 'severe';
    } else if (Math.abs(impulse) > 20) {
      text += impulse < 0 ? ' Leve impulsividade.' : ' Leve inibição.';
      if (severity === 'normal') severity = 'moderate';
    }

    return { 
      text, 
      severity, 
      values: [
        { label: 'Energia Volitiva', value: ((energy + 100) / 2) },
        { label: 'Controle de Impulsos', value: ((impulse + 100) / 2) }
      ] 
    };
  };

  const getPsychomotorSummary = (data: any) => {
    const activity = data.motor_activity || 0;
    const facialExpressiveness = data.facial_expressiveness || 50;

    let text = '';
    let severity: Severity = 'normal';

    // Activity: -100 (inibição) | 0 (normal) | +100 (agitação)
    if (Math.abs(activity) <= 20) {
      text = 'Psicomotricidade preservada, sem alterações.';
    } else if (Math.abs(activity) <= 50) {
      text = activity > 0 ? 'Leve agitação psicomotora.' : 'Leve lentificação psicomotora (inibição).';
      severity = 'moderate';
    } else {
      text = activity > 0 ? 'Agitação psicomotora significativa.' : 'Lentificação psicomotora significativa (inibição severa).';
      severity = 'severe';
    }

    return { 
      text, 
      severity,
      values: [
        { label: 'Atividade Motora', value: ((activity + 100) / 2) },
        { label: 'Expressividade Facial', value: facialExpressiveness }
      ]
    };
  };

  const getAttentionSummary = (data: any) => {
    const range = data.range || 0;
    const concentration = data.concentration || 0;
    const avg = (range + concentration) / 2;

    let text = '';
    let severity: Severity = 'normal';

    if (avg >= 70) {
      text = 'Atenção e concentração preservadas.';
    } else if (avg >= 40) {
      text = 'Leve déficit de atenção e concentração.';
      severity = 'moderate';
    } else {
      text = 'Déficit significativo de atenção e concentração.';
      severity = 'severe';
    }

    if (data.distractibility) {
      text += ' Distraibilidade presente.';
      severity = 'moderate';
    }

    return {
      text,
      severity,
      values: [
        { label: 'Amplitude', value: range },
        { label: 'Concentração', value: concentration }
      ]
    };
  };

  const getPersonalitySummary = (data: any) => {
    const coherence = data.self_coherence || 0;
    const stability = data.affective_stability || 0;

    let text = '';
    let severity: Severity = 'normal';

    const traits = [];
    if (data.anxious) traits.push('ansioso');
    if (data.avoidant) traits.push('evitativo');
    if (data.obsessive) traits.push('obsessivo');
    if (data.borderline) traits.push('borderline');

    if (coherence >= 70 && stability >= 70 && traits.length === 0) {
      text = 'Personalidade estável, sem traços disfuncionais.';
    } else if (coherence >= 40 && stability >= 40) {
      text = traits.length > 0 
        ? `Traços de personalidade ${traits.join(', ')}.`
        : 'Estabilidade emocional moderada.';
      severity = 'moderate';
    } else {
      text = 'Instabilidade significativa da personalidade.';
      severity = 'severe';
    }

    return {
      text,
      severity,
      values: [
        { label: 'Coerência do Self', value: coherence },
        { label: 'Estabilidade Afetiva', value: stability }
      ]
    };
  };

  const handleSaveClinicalNotes = async () => {
    if (!selectedSessionId) return;

    setSavingNotes(true);
    const { error } = await supabase
      .from('sessions')
      .update({ notes: clinicalNotes })
      .eq('id', selectedSessionId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as anotações.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Anotações salvas com sucesso.',
      });
      loadSessions();
    }
    setSavingNotes(false);
  };

  return (
    <Tabs defaultValue="sessions" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="sessions">Avaliação de Sessões</TabsTrigger>
        <TabsTrigger value="evolution">Evolução do Paciente</TabsTrigger>
      </TabsList>

      <TabsContent value="sessions" className="mt-0">
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
                          <div className="flex items-center gap-2">
                            {session.time && (
                              <span className="text-xs text-muted-foreground">{session.time}</span>
                            )}
                            {session.has_evaluation && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/patients/${patientId}/sessions/${session.id}/evaluation`);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
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
                  <div>
                    <h2 className="text-2xl font-bold">Avaliação da Sessão</h2>
                    <span className="text-sm text-muted-foreground">
                      {format(parseISO(evaluation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo Clínico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{generateSummary(evaluation)}</p>
                    </CardContent>
                  </Card>

                  {/* Clinical Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Anotações Clínicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        placeholder="Adicione suas anotações clínicas sobre esta sessão..."
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleSaveClinicalNotes} disabled={savingNotes}>
                          {savingNotes ? 'Salvando...' : 'Salvar Anotações'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* File Upload */}
                  {selectedSession && (
                    <div className="flex justify-end">
                      <SessionFileUpload
                        sessionId={selectedSession.id}
                        sessionDate={selectedSession.date}
                        patientId={patientId}
                        onUploadComplete={loadSessions}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderEvaluationCard('1. Consciência', evaluation.consciousness_data, getConsciousnessSummary)}
                    {renderEvaluationCard('2. Orientação', evaluation.orientation_data, getOrientationSummary)}
                    {renderEvaluationCard('3. Memória', evaluation.memory_data, getMemorySummary)}
                    {renderEvaluationCard('4. Humor / Afeto', evaluation.mood_data, getMoodSummary)}
                    {renderEvaluationCard('5. Pensamento', evaluation.thought_data, getThoughtSummary)}
                    {renderEvaluationCard('6. Linguagem', evaluation.language_data, getLanguageSummary)}
                    {renderEvaluationCard('7. Sensopercepção', evaluation.sensoperception_data, getSensoperceptionSummary)}
                    {renderEvaluationCard('8. Inteligência', evaluation.intelligence_data, getIntelligenceSummary)}
                    {renderEvaluationCard('9. Vontade', evaluation.will_data, getWillSummary)}
                    {renderEvaluationCard('10. Psicomotricidade', evaluation.psychomotor_data, getPsychomotorSummary)}
                    {renderEvaluationCard('11. Atenção', evaluation.attention_data, getAttentionSummary)}
                    {renderEvaluationCard('12. Personalidade', evaluation.personality_data, getPersonalitySummary)}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="evolution" className="mt-0">
        <PatientEvolutionMetrics patientId={patientId} period={period} setPeriod={setPeriod} />
      </TabsContent>
    </Tabs>
  );
}

interface PatientEvolutionMetricsProps {
  patientId: string;
  period: string;
  setPeriod: (period: string) => void;
}

function PatientEvolutionMetrics({ patientId, period, setPeriod }: PatientEvolutionMetricsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Evolução do Paciente</h3>
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

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Área reservada para gráficos e métricas de evolução do paciente ao longo do tempo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
