import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, FileText, Paperclip, Calendar, Edit, Loader2, ClipboardPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { SessionFileUpload } from './SessionFileUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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

  // Subscribe to real-time updates for session evaluations
  useEffect(() => {
    if (!selectedSessionId) return;

    const channel = supabase
      .channel(`session-eval-${selectedSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_evaluations',
          filter: `session_id=eq.${selectedSessionId}`
        },
        (payload) => {
          console.log('Evaluation updated:', payload);
          // Reload the evaluation when it changes
          loadEvaluation(selectedSessionId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSessionId]);

  const loadSessions = async () => {
    setLoading(true);
    
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'attended') // Apenas sessões que compareceram
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

  // For 0-100 scale (percentile)
  const getProgressColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // For -100 to +100 scale
  const getProgressColorBipolar = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue <= 15) return 'bg-green-500';
    if (absValue <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const generateSummary = (evaluation: SessionEvaluation): string => {
    const summaryParts: string[] = [];

    // ========== 1. CONSCIÊNCIA ==========
    const consciousness = evaluation.consciousness_data;
    const level = consciousness?.level || 0;
    const field = consciousness?.field || 0;
    const selfConsciousness = consciousness?.self_consciousness || 0;
    
    // Nível: -100 (coma) | 0 (lúcido/vígil) | +100 (confusão)
    if (level < -50) {
      summaryParts.push('rebaixamento significativo do nível de consciência (torpor/coma)');
    } else if (level < -20) {
      summaryParts.push('leve rebaixamento do nível de consciência (torpor leve)');
    } else if (level > 50) {
      summaryParts.push('confusão mental significativa');
    } else if (level > 20) {
      summaryParts.push('hipervigilância (nível aumentado)');
    }
    
    // Campo: -100 (estreitamento) | 0 (amplitude normal) | +100 (expansão caótica)
    if (field < -50) {
      summaryParts.push('estreitamento significativo do campo de consciência');
    } else if (field < -20) {
      summaryParts.push('leve estreitamento do campo de consciência');
    } else if (field > 50) {
      summaryParts.push('expansão caótica do campo de consciência');
    } else if (field > 20) {
      summaryParts.push('campo de consciência expandido');
    }
    
    // Auto-consciência: -100 (alienado do eu) | 0 (normal) | +100 (hiperautoconsciente/obsessivo)
    if (selfConsciousness < -50) {
      summaryParts.push('alienação significativa do eu');
    } else if (selfConsciousness < -20) {
      summaryParts.push('leve alienação do eu');
    } else if (selfConsciousness > 50) {
      summaryParts.push('hiperautoconciência obsessiva');
    } else if (selfConsciousness > 20) {
      summaryParts.push('autoconsciência aumentada');
    }
    
    // Fenômenos dissociativos
    if (consciousness?.depersonalization) {
      summaryParts.push('despersonalização');
    }
    if (consciousness?.derealization) {
      summaryParts.push('desrealização');
    }

    // ========== 2. ORIENTAÇÃO ==========
    const orientation = evaluation.orientation_data;
    const orientedCount = [orientation?.time, orientation?.space, orientation?.person, orientation?.situation].filter(Boolean).length;
    
    if (orientedCount === 0) {
      summaryParts.push('desorientação global (tempo, espaço, pessoa e situação)');
    } else if (orientedCount === 1) {
      summaryParts.push('desorientação severa (3 esferas)');
    } else if (orientedCount === 2) {
      summaryParts.push('desorientação significativa (2 esferas)');
    } else if (orientedCount === 3) {
      summaryParts.push('desorientação parcial (1 esfera)');
    }
    
    // Juízo de realidade
    if (orientation?.reality_judgment === 'severely_impaired') {
      summaryParts.push('juízo de realidade gravemente prejudicado');
    } else if (orientation?.reality_judgment === 'partially_impaired') {
      summaryParts.push('juízo de realidade parcialmente prejudicado');
    }
    
    // Insight (0-100, quanto maior melhor)
    const insight = orientation?.insight || 80;
    if (insight < 30) {
      summaryParts.push('insight severamente prejudicado');
    } else if (insight < 50) {
      summaryParts.push('insight significativamente prejudicado');
    } else if (insight < 70) {
      summaryParts.push('insight parcialmente prejudicado');
    }

    // ========== 3. ATENÇÃO E CONCENTRAÇÃO ==========
    const attention = evaluation.attention_data;
    const attentionRange = attention?.range || 80;
    const concentration = attention?.concentration || 80;
    
    // Amplitude da atenção: 0 (aprosexia) | 50 (normal) | 100 (hiperprosexia)
    if (attentionRange < 20) {
      summaryParts.push('aprosexia (amplitude de atenção severamente reduzida)');
    } else if (attentionRange < 40) {
      summaryParts.push('amplitude de atenção significativamente reduzida');
    } else if (attentionRange < 60) {
      summaryParts.push('amplitude de atenção levemente reduzida');
    } else if (attentionRange > 85) {
      summaryParts.push('hiperprosexia (amplitude de atenção aumentada)');
    }
    
    // Concentração: 0 (nenhuma) | 100 (excelente)
    if (concentration < 30) {
      summaryParts.push('concentração severamente prejudicada');
    } else if (concentration < 50) {
      summaryParts.push('concentração significativamente prejudicada');
    } else if (concentration < 70) {
      summaryParts.push('concentração levemente prejudicada');
    }
    
    if (attention?.distractibility) {
      summaryParts.push('distraibilidade presente');
    }

    // ========== 4. SENSOPERCEPÇÃO ==========
    const senso = evaluation.sensoperception_data;
    
    if (senso?.global_perception === 'hallucinatory') {
      summaryParts.push('percepção sem objeto (alucinações)');
    } else if (senso?.global_perception === 'distortive') {
      summaryParts.push('percepção distorsiva (ilusões)');
    } else if (senso?.global_perception === 'slightly_altered') {
      summaryParts.push('percepção levemente alterada');
    }
    
    const hallucinations = [];
    if (senso?.auditory) hallucinations.push('auditivas');
    if (senso?.visual) hallucinations.push('visuais');
    if (senso?.tactile) hallucinations.push('táteis');
    if (senso?.olfactory) hallucinations.push('olfativas');
    if (senso?.kinesthetic) hallucinations.push('cinestésicas');
    if (senso?.mixed) hallucinations.push('mistas');
    
    if (hallucinations.length > 0) {
      summaryParts.push(`alucinações ${hallucinations.join(', ')}`);
    }

    // ========== 5. MEMÓRIA ==========
    const memory = evaluation.memory_data;
    const fixation = memory?.fixation || 80;
    const recall = memory?.recall || 80;
    
    // Fixação (memória imediata): 0-100
    if (fixation < 30) {
      summaryParts.push('fixação (memória imediata) severamente prejudicada');
    } else if (fixation < 50) {
      summaryParts.push('fixação (memória imediata) significativamente prejudicada');
    } else if (fixation < 70) {
      summaryParts.push('fixação (memória imediata) levemente prejudicada');
    }
    
    // Evocação (curto prazo): 0-100
    if (recall < 30) {
      summaryParts.push('evocação (memória de curto prazo) severamente prejudicada');
    } else if (recall < 50) {
      summaryParts.push('evocação (memória de curto prazo) significativamente prejudicada');
    } else if (recall < 70) {
      summaryParts.push('evocação (memória de curto prazo) levemente prejudicada');
    }
    
    // Alterações específicas
    if (memory?.amnesia) {
      summaryParts.push('amnésia presente');
    }
    if (memory?.hypermnesia) {
      summaryParts.push('hipermnésia');
    }
    if (memory?.paramnesia) {
      summaryParts.push('paramnésia');
    }
    if (memory?.auditory) {
      summaryParts.push('memória auditória alterada');
    }
    if (memory?.phobias) {
      summaryParts.push('fobias presentes');
    }

    // ========== 6. PENSAMENTO ==========
    const thought = evaluation.thought_data;
    const course = thought?.course || 0;
    
    // Curso: -100 (lentificação) | 0 (normal) | +100 (fuga de ideias)
    if (course < -60) {
      summaryParts.push('pensamento muito lentificado (lentificação severa)');
    } else if (course < -30) {
      summaryParts.push('pensamento lentificado');
    } else if (course < -10) {
      summaryParts.push('pensamento levemente lentificado');
    } else if (course > 60) {
      summaryParts.push('fuga de ideias (pensamento muito acelerado)');
    } else if (course > 30) {
      summaryParts.push('pensamento acelerado');
    } else if (course > 10) {
      summaryParts.push('pensamento levemente acelerado');
    }
    
    // Forma do pensamento
    const formAlterations = [];
    if (thought?.tangential) formAlterations.push('tangencial');
    if (thought?.incoherent) formAlterations.push('incoerente');
    if (thought?.dissociated) formAlterations.push('dissociado');
    if (thought?.circumstantial) formAlterations.push('circunstancial');
    
    if (formAlterations.length > 0) {
      summaryParts.push(`pensamento com forma ${formAlterations.join(', ')}`);
    }
    
    // Conteúdo do pensamento
    const contentAlterations = [];
    if (thought?.delusional) contentAlterations.push('ideias delirantes');
    if (thought?.obsessive) contentAlterations.push('ideias obsessivas');
    if (thought?.overvalued) contentAlterations.push('ideias supervalorizadas');
    
    if (contentAlterations.length > 0) {
      summaryParts.push(`${contentAlterations.join(', ')}`);
    }

    // ========== 7. LINGUAGEM ==========
    const language = evaluation.language_data;
    const speechRate = language?.speech_rate || 0;
    
    // Velocidade: -100 (bradilalia) | 0 (ritmo normal) | +100 (taquilalia)
    if (speechRate < -60) {
      summaryParts.push('fala muito lentificada (bradilalia severa)');
    } else if (speechRate < -30) {
      summaryParts.push('fala lentificada (bradilalia)');
    } else if (speechRate < -10) {
      summaryParts.push('fala levemente lentificada');
    } else if (speechRate > 60) {
      summaryParts.push('fala muito acelerada (taquilalia severa)');
    } else if (speechRate > 30) {
      summaryParts.push('fala acelerada (taquilalia)');
    } else if (speechRate > 10) {
      summaryParts.push('fala levemente acelerada');
    }
    
    // Articulação
    if (language?.articulation && language.articulation !== 'normal') {
      const articulationMap: Record<string, string> = {
        'vague': 'discurso vago',
        'echolalia': 'ecolalia',
        'mutism': 'mutismo',
        'neologisms': 'neologismos'
      };
      summaryParts.push(articulationMap[language.articulation] || language.articulation);
    }

    // ========== 8. HUMOR / AFETIVIDADE ==========
    const mood = evaluation.mood_data;
    const polarity = mood?.polarity || 0;
    const lability = mood?.lability || 50;
    
    // Polaridade: -100 (depressivo) | 0 (eutímico) | +100 (eufórico)
    if (polarity < -70) {
      summaryParts.push('humor severamente deprimido (depressão grave)');
    } else if (polarity < -40) {
      summaryParts.push('humor deprimido (depressão)');
    } else if (polarity < -20) {
      summaryParts.push('humor levemente deprimido (subdepressivo)');
    } else if (polarity > 70) {
      summaryParts.push('humor eufórico (euforia)');
    } else if (polarity > 40) {
      summaryParts.push('humor elevado (hipertímico)');
    } else if (polarity > 20) {
      summaryParts.push('humor levemente elevado');
    }
    
    // Labilidade: 0-100 (quanto maior mais lábil)
    if (lability > 80) {
      summaryParts.push('labilidade emocional severa');
    } else if (lability > 65) {
      summaryParts.push('labilidade emocional significativa');
    } else if (lability > 50) {
      summaryParts.push('labilidade emocional presente');
    }
    
    // Adequação afetiva
    if (mood?.adequacy === 'inadequate') {
      summaryParts.push('afeto inadequado');
    } else if (mood?.adequacy === 'ambivalent') {
      summaryParts.push('afeto ambivalente');
    } else if (mood?.adequacy === 'paradoxical') {
      summaryParts.push('afeto paradoxal');
    }
    
    if (mood?.emotional_responsiveness === false) {
      summaryParts.push('responsividade emocional reduzida');
    }

    // ========== 9. VONTADE ==========
    const will = evaluation.will_data;
    const volitionalEnergy = will?.volitional_energy || 0;
    const impulseControl = will?.impulse_control || 0;
    
    // Energia volitiva: -100 (abulia) | 0 (normal) | +100 (hiperbulia)
    if (volitionalEnergy < -60) {
      summaryParts.push('abulia severa (energia volitiva muito reduzida)');
    } else if (volitionalEnergy < -30) {
      summaryParts.push('abulia (energia volitiva reduzida)');
    } else if (volitionalEnergy < -10) {
      summaryParts.push('energia volitiva levemente reduzida');
    } else if (volitionalEnergy > 60) {
      summaryParts.push('hiperbulia severa (energia volitiva muito aumentada)');
    } else if (volitionalEnergy > 30) {
      summaryParts.push('hiperbulia (energia volitiva aumentada)');
    } else if (volitionalEnergy > 10) {
      summaryParts.push('energia volitiva levemente aumentada');
    }
    
    // Controle de impulsos: -100 (impulsivo) | 0 (equilibrado) | +100 (inibido)
    if (impulseControl < -60) {
      summaryParts.push('impulsividade severa');
    } else if (impulseControl < -30) {
      summaryParts.push('impulsividade significativa');
    } else if (impulseControl < -10) {
      summaryParts.push('leve impulsividade');
    } else if (impulseControl > 60) {
      summaryParts.push('inibição volitiva excessiva');
    } else if (impulseControl > 30) {
      summaryParts.push('inibição volitiva significativa');
    } else if (impulseControl > 10) {
      summaryParts.push('leve inibição volitiva');
    }
    
    if (will?.ambivalence) {
      summaryParts.push('ambivalência presente');
    }

    // ========== 10. PSICOMOTRICIDADE ==========
    const psycho = evaluation.psychomotor_data;
    const motorActivity = psycho?.motor_activity || 0;
    const facialExpressiveness = psycho?.facial_expressiveness || 50;
    
    // Atividade motora: -100 (inibição) | 0 (normal) | +100 (agitação)
    if (motorActivity < -60) {
      summaryParts.push('lentificação psicomotora severa (inibição severa)');
    } else if (motorActivity < -30) {
      summaryParts.push('lentificação psicomotora (inibição)');
    } else if (motorActivity < -10) {
      summaryParts.push('leve lentificação psicomotora');
    } else if (motorActivity > 60) {
      summaryParts.push('agitação psicomotora severa');
    } else if (motorActivity > 30) {
      summaryParts.push('agitação psicomotora');
    } else if (motorActivity > 10) {
      summaryParts.push('leve agitação psicomotora');
    }
    
    // Tonus e gestos
    if (psycho?.tone_gestures === 'increased') {
      summaryParts.push('tonicidade e gestos aumentados');
    } else if (psycho?.tone_gestures === 'decreased') {
      summaryParts.push('tonicidade e gestos diminuídos (hipotonia)');
    }
    
    // Expressividade facial: 0-100 (quanto maior melhor)
    if (facialExpressiveness < 25) {
      summaryParts.push('expressividade facial severamente reduzida (hipomimia severa)');
    } else if (facialExpressiveness < 40) {
      summaryParts.push('expressividade facial significativamente reduzida (hipomimia)');
    } else if (facialExpressiveness < 50) {
      summaryParts.push('expressividade facial levemente reduzida');
    }

    // ========== 11. INTELIGÊNCIA ==========
    const intel = evaluation.intelligence_data;
    const learning = intel?.learning_capacity || 80;
    const reasoning = intel?.abstract_reasoning || 80;
    const facialExpressivity = intel?.facial_expressivity || 50;
    
    // Raciocínio abstrato: 0-100 (quanto maior melhor)
    if (reasoning < 30) {
      summaryParts.push('raciocínio abstrato severamente prejudicado');
    } else if (reasoning < 50) {
      summaryParts.push('raciocínio abstrato significativamente prejudicado');
    } else if (reasoning < 70) {
      summaryParts.push('raciocínio abstrato levemente prejudicado');
    }
    
    // Capacidade de aprendizagem: 0-100
    if (learning < 30) {
      summaryParts.push('capacidade de aprendizagem severamente prejudicada');
    } else if (learning < 50) {
      summaryParts.push('capacidade de aprendizagem significativamente prejudicada');
    } else if (learning < 70) {
      summaryParts.push('capacidade de aprendizagem levemente prejudicada');
    }
    
    // Capacidade adaptativa
    if (intel?.adaptive_capacity === 'significantly_impaired') {
      summaryParts.push('capacidade adaptativa severamente prejudicada');
    } else if (intel?.adaptive_capacity === 'reduced') {
      summaryParts.push('capacidade adaptativa reduzida');
    }

    // ========== 12. PERSONALIDADE ==========
    const personality = evaluation.personality_data;
    const selfCoherence = personality?.self_coherence || 80;
    const affectiveStability = personality?.affective_stability || 80;
    
    // Coerência do self: 0-100 (quanto maior melhor)
    if (selfCoherence < 30) {
      summaryParts.push('coerência do self severamente comprometida');
    } else if (selfCoherence < 50) {
      summaryParts.push('coerência do self significativamente comprometida');
    } else if (selfCoherence < 70) {
      summaryParts.push('coerência do self levemente comprometida');
    }
    
    // Estabilidade afetiva: 0-100
    if (affectiveStability < 30) {
      summaryParts.push('estabilidade afetiva severamente comprometida');
    } else if (affectiveStability < 50) {
      summaryParts.push('estabilidade afetiva significativamente comprometida');
    } else if (affectiveStability < 70) {
      summaryParts.push('estabilidade afetiva levemente comprometida');
    }
    
    // Fronteiras do self
    if (personality?.self_boundaries === 'diffuse') {
      summaryParts.push('fronteiras do self difusas');
    } else if (personality?.self_boundaries === 'rigid') {
      summaryParts.push('fronteiras do self rígidas');
    }
    
    // Traços de personalidade
    const traits = [];
    if (personality?.anxious) traits.push('ansioso');
    if (personality?.avoidant) traits.push('evitativo');
    if (personality?.obsessive) traits.push('obsessivo');
    if (personality?.borderline) traits.push('borderline');
    if (personality?.antisocial) traits.push('antissocial');
    if (personality?.narcissistic) traits.push('narcisista');
    if (personality?.histrionic) traits.push('histriônico');
    
    if (traits.length > 0) {
      summaryParts.push(`traços de personalidade ${traits.join(', ')}`);
    }

    // ========== RESULTADO FINAL ==========
    if (summaryParts.length === 0) {
      return 'Paciente não apresenta alterações significativas nas funções psíquicas avaliadas. Exame mental dentro dos padrões esperados para a normalidade, com consciência lúcida, orientação preservada, atenção e concentração adequadas, memória íntegra, pensamento organizado, linguagem fluente, humor eutímico, vontade preservada, psicomotricidade normal, funções intelectuais adequadas e personalidade estável.';
    }

    const connector = summaryParts.length > 8 ? '; ' : ', ';
    return `Paciente apresenta ${summaryParts.join(connector)}. ${summaryParts.length < 8 ? 'Demais funções psíquicas preservadas.' : ''}`;
  };

  const renderEvaluationCard = (
    title: string,
    data: any,
    getSummary: (data: any) => { text: string; severity: Severity; values?: { label: string; value: number; scale?: 'bipolar' | 'unipolar' }[] }
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
              {values.map((item) => {
                const isBipolar = item.scale === 'bipolar';
                const displayValue = isBipolar ? item.value : `${item.value}%`;
                const barWidth = isBipolar ? ((item.value + 100) / 2) : item.value;
                const barColor = isBipolar ? getProgressColorBipolar(item.value) : getProgressColor(item.value);
                
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{displayValue}</span>
                    </div>
                    {isBipolar ? (
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        {/* Center line at 50% for bipolar scales */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/20" />
                        <div
                          className={cn("h-full transition-all", barColor)}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    ) : (
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all", barColor)}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
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
        { label: 'Nível', value: level, scale: 'bipolar' as const },
        { label: 'Campo', value: field, scale: 'bipolar' as const },
        { label: 'Auto-consciência', value: selfConsciousness, scale: 'bipolar' as const }
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
      values: [{ label: 'Insight', value: insight, scale: 'unipolar' as const }]
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
        { label: 'Fixação', value: fixation, scale: 'unipolar' as const },
        { label: 'Evocação', value: recall, scale: 'unipolar' as const }
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
        { label: 'Polaridade', value: polarity, scale: 'bipolar' as const },
        { label: 'Labilidade', value: lability, scale: 'unipolar' as const }
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
      values: [{ label: 'Curso do Pensamento', value: course, scale: 'bipolar' as const }]
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
      values: [{ label: 'Velocidade da fala', value: speechRate, scale: 'bipolar' as const }]
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
        { label: 'Aprendizagem', value: learning, scale: 'unipolar' as const },
        { label: 'Raciocínio Abstrato', value: reasoning, scale: 'unipolar' as const }
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
        { label: 'Energia Volitiva', value: energy, scale: 'bipolar' as const },
        { label: 'Controle de Impulsos', value: impulse, scale: 'bipolar' as const }
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
        { label: 'Atividade Motora', value: activity, scale: 'bipolar' as const },
        { label: 'Expressividade Facial', value: facialExpressiveness, scale: 'unipolar' as const }
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
        { label: 'Amplitude', value: range, scale: 'unipolar' as const },
        { label: 'Concentração', value: concentration, scale: 'unipolar' as const }
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
        { label: 'Coerência do Self', value: coherence, scale: 'unipolar' as const },
        { label: 'Estabilidade Afetiva', value: stability, scale: 'unipolar' as const }
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
                            {session.has_evaluation ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/patients/${patientId}/sessions/${session.id}/evaluation`);
                                }}
                                title="Editar Avaliação"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/patients/${patientId}/sessions/${session.id}/evaluation`);
                                }}
                                title="Adicionar Avaliação"
                              >
                                <ClipboardPlus className="w-3 h-3" />
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
                <CardContent className="text-center p-8 space-y-4">
                  <p className="text-muted-foreground">Esta sessão não possui avaliação registrada</p>
                  <Button
                    onClick={() => navigate(`/patients/${patientId}/sessions/${selectedSessionId}/evaluation`)}
                    className="mx-auto"
                  >
                    <ClipboardPlus className="w-4 h-4 mr-2" />
                    Adicionar Avaliação
                  </Button>
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

interface EvaluationData {
  session_id: string;
  session_date: string;
  consciousness_data: any;
  orientation_data: any;
  memory_data: any;
  mood_data: any;
  thought_data: any;
  language_data: any;
  sensoperception_data: any;
  intelligence_data: any;
  will_data: any;
  psychomotor_data: any;
  attention_data: any;
  personality_data: any;
}

function PatientEvolutionMetrics({ patientId, period, setPeriod }: PatientEvolutionMetricsProps) {
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvaluations();
  }, [patientId, period]);

  const loadEvaluations = async () => {
    setLoading(true);
    
    let query = supabase
      .from('session_evaluations')
      .select(`
        *,
        sessions!inner(date, patient_id)
      `)
      .eq('sessions.patient_id', patientId)
      .order('sessions(date)', { ascending: true });

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

      query = query.gte('sessions.date', startDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading evaluations:', error);
      setLoading(false);
      return;
    }

    const formattedData = data?.map((item: any) => ({
      session_id: item.session_id,
      session_date: item.sessions?.date || '',
      consciousness_data: item.consciousness_data,
      orientation_data: item.orientation_data,
      memory_data: item.memory_data,
      mood_data: item.mood_data,
      thought_data: item.thought_data,
      language_data: item.language_data,
      sensoperception_data: item.sensoperception_data,
      intelligence_data: item.intelligence_data,
      will_data: item.will_data,
      psychomotor_data: item.psychomotor_data,
      attention_data: item.attention_data,
      personality_data: item.personality_data,
    })) || [];

    setEvaluations(formattedData);
    setLoading(false);
  };

  // Preparar dados para gráfico de Consciência (linha temporal)
  const consciousnessData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    nivel: ev.consciousness_data?.level || 0,
    campo: ev.consciousness_data?.field || 0,
  }));

  // Preparar dados para Orientação (pizza - tipos de alteração do juízo)
  const orientationIssues = evaluations.reduce((acc, ev) => {
    const data = ev.orientation_data;
    if (!data?.time) acc.temporal = (acc.temporal || 0) + 1;
    if (!data?.space) acc.espacial = (acc.espacial || 0) + 1;
    if (!data?.person) acc.pessoal = (acc.pessoal || 0) + 1;
    if (!data?.situation) acc.situacional = (acc.situacional || 0) + 1;
    if (data?.reality_judgment !== 'intact') acc.juizo_realidade = (acc.juizo_realidade || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const orientationPieData = Object.keys(orientationIssues).length > 0
    ? Object.entries(orientationIssues).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value
      }))
    : [{ name: 'Sem Sintomas', value: 100 }];

  // Preparar dados para Memória (radar)
  const memoryRadarData = evaluations.length > 0 ? [{
    function: 'Fixação',
    value: evaluations.reduce((sum, ev) => sum + (ev.memory_data?.fixation || 80), 0) / evaluations.length,
  }, {
    function: 'Evocação',
    value: evaluations.reduce((sum, ev) => sum + (ev.memory_data?.recall || 80), 0) / evaluations.length,
  }, {
    function: 'Autobiográfica',
    value: evaluations.reduce((sum, ev) => {
      const hasAmnesia = ev.memory_data?.amnesia ? -20 : 0;
      const hasHypermnesia = ev.memory_data?.hypermnesia ? 20 : 0;
      return sum + (80 + hasAmnesia + hasHypermnesia);
    }, 0) / evaluations.length,
  }] : [];

  // Preparar dados para Humor (linha polarizada)
  const moodData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    humor: ev.mood_data?.polarity || 0,
  }));

  // Preparar dados para Pensamento (linha de curso)
  const thoughtData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    curso: ev.thought_data?.course || 0,
  }));

  // Preparar dados para Linguagem (linha de ritmo)
  const languageData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    ritmo: ev.language_data?.speech_rate || 0,
  }));

  // Preparar dados para Sensopercepção (pizza)
  const sensoperceptionIssues = evaluations.reduce((acc, ev) => {
    const data = ev.sensoperception_data;
    if (data?.auditory) acc.auditiva = (acc.auditiva || 0) + 1;
    if (data?.visual) acc.visual = (acc.visual || 0) + 1;
    if (data?.tactile) acc.tatil = (acc.tatil || 0) + 1;
    if (data?.olfactory) acc.olfativa = (acc.olfativa || 0) + 1;
    if (data?.kinesthetic) acc.cinestesica = (acc.cinestesica || 0) + 1;
    if (data?.mixed) acc.mista = (acc.mista || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sensoperceptionPieData = Object.keys(sensoperceptionIssues).length > 0
    ? Object.entries(sensoperceptionIssues).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    : [{ name: 'Sem Sintomas', value: 100 }];

  // Preparar dados para Inteligência (radar)
  const intelligenceRadarData = evaluations.length > 0 ? [{
    function: 'Raciocínio Abstrato',
    value: evaluations.reduce((sum, ev) => sum + (ev.intelligence_data?.abstract_reasoning || 80), 0) / evaluations.length,
  }, {
    function: 'Capacidade de Aprendizado',
    value: evaluations.reduce((sum, ev) => sum + (ev.intelligence_data?.learning_capacity || 80), 0) / evaluations.length,
  }, {
    function: 'Adaptação',
    value: evaluations.reduce((sum, ev) => {
      const capacity = ev.intelligence_data?.adaptive_capacity;
      return sum + (capacity === 'normal' ? 80 : capacity === 'above' ? 95 : 50);
    }, 0) / evaluations.length,
  }] : [];

  // Preparar dados para Vontade (duas linhas)
  const willData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    energia: ev.will_data?.volitional_energy || 0,
    controle: ev.will_data?.impulse_control || 0,
  }));

  // Preparar dados para Psicomotricidade (linha de tônus)
  const psychomotorData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    tonus: ev.psychomotor_data?.motor_activity || 0,
  }));

  // Preparar dados para Atenção (linha)
  const attentionData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    atencao: ev.attention_data?.range || 80,
  }));

  // Preparar dados para Personalidade (duas linhas)
  const personalityData = evaluations.map(ev => ({
    date: format(new Date(ev.session_date), 'dd/MM', { locale: ptBR }),
    coerencia: ev.personality_data?.self_coherence || 80,
    estabilidade: ev.personality_data?.affective_stability || 80,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (evaluations.length === 0) {
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
              Nenhuma avaliação encontrada no período selecionado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Consciência */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Consciência</CardTitle>
            <CardDescription>Nível e Campo de Consciência</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              nivel: { label: "Nível", color: "hsl(var(--chart-1))" },
              campo: { label: "Campo", color: "hsl(var(--chart-2))" },
            }} className="h-[200px]">
              <LineChart data={consciousnessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-100, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="nivel" stroke="hsl(var(--chart-1))" name="Nível" />
                <Line type="monotone" dataKey="campo" stroke="hsl(var(--chart-2))" name="Campo" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 2. Orientação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Orientação</CardTitle>
            <CardDescription>Tipos de Alteração do Juízo de Realidade</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[200px]">
              <PieChart>
                <Pie
                  data={orientationPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orientationPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 3. Memória */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Memória</CardTitle>
            <CardDescription>Desempenho Médio por Tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[200px]">
              <RadarChart data={memoryRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="function" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar name="Memória" dataKey="value" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                <ChartTooltip />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 4. Humor / Afeto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Humor / Afeto</CardTitle>
            <CardDescription>Polaridade do Humor por Sessão</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              humor: { label: "Humor", color: "hsl(var(--chart-3))" },
            }} className="h-[200px]">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-100, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="humor" stroke="hsl(var(--chart-3))" name="Humor" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 5. Pensamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. Pensamento</CardTitle>
            <CardDescription>Curso do Pensamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              curso: { label: "Curso", color: "hsl(var(--chart-4))" },
            }} className="h-[200px]">
              <LineChart data={thoughtData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-100, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="curso" stroke="hsl(var(--chart-4))" name="Curso" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 6. Linguagem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">6. Linguagem</CardTitle>
            <CardDescription>Ritmo de Fala (Velocidade)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              ritmo: { label: "Ritmo", color: "hsl(var(--chart-5))" },
            }} className="h-[200px]">
              <LineChart data={languageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-100, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="ritmo" stroke="hsl(var(--chart-5))" name="Ritmo" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 7. Sensopercepção */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">7. Sensopercepção</CardTitle>
            <CardDescription>Tipos de Alteração no Período</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[200px]">
              <PieChart>
                <Pie
                  data={sensoperceptionPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sensoperceptionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 8. Inteligência */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">8. Inteligência</CardTitle>
            <CardDescription>Desempenho Cognitivo Médio</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[200px]">
              <RadarChart data={intelligenceRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="function" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar name="Inteligência" dataKey="value" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                <ChartTooltip />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 9. Vontade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">9. Vontade</CardTitle>
            <CardDescription>Energia Volitiva e Controle de Impulsos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              energia: { label: "Energia", color: "hsl(var(--chart-1))" },
              controle: { label: "Controle", color: "hsl(var(--chart-3))" },
            }} className="h-[200px]">
              <LineChart data={willData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-100, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="energia" stroke="hsl(var(--chart-1))" name="Energia Volitiva" />
                <Line type="monotone" dataKey="controle" stroke="hsl(var(--chart-3))" name="Controle de Impulsos" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 10. Psicomotricidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">10. Psicomotricidade</CardTitle>
            <CardDescription>Tônus Psicomotor</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              tonus: { label: "Tônus", color: "hsl(var(--chart-4))" },
            }} className="h-[200px]">
              <LineChart data={psychomotorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-100, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="tonus" stroke="hsl(var(--chart-4))" name="Tônus" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 11. Atenção */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">11. Atenção</CardTitle>
            <CardDescription>Amplitude da Atenção</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              atencao: { label: "Atenção", color: "hsl(var(--chart-5))" },
            }} className="h-[200px]">
              <LineChart data={attentionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="atencao" stroke="hsl(var(--chart-5))" name="Atenção" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 12. Personalidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">12. Personalidade</CardTitle>
            <CardDescription>Coerência do Self e Estabilidade Afetiva</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              coerencia: { label: "Coerência", color: "hsl(var(--chart-1))" },
              estabilidade: { label: "Estabilidade", color: "hsl(var(--chart-2))" },
            }} className="h-[200px]">
              <LineChart data={personalityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="coerencia" stroke="hsl(var(--chart-1))" name="Coerência do Self" />
                <Line type="monotone" dataKey="estabilidade" stroke="hsl(var(--chart-2))" name="Estabilidade Afetiva" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
