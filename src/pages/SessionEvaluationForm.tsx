/**
 * ============================================================================
 * FASE C2.5A - SessionEvaluationForm (Refatorado)
 * ============================================================================
 * 
 * Formulário de avaliação de sessão baseado nas 12 funções psíquicas
 * (modelo Dalgalarrondo).
 * 
 * REFATORAÇÃO C2.5A:
 * - Componentização de elementos reutilizáveis
 * - Uso de defaults centralizados
 * - Tipos TypeScript explícitos
 * - Redução de repetição de código
 * - Mantém comportamento 100% idêntico ao original
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUserIdsInOrganization } from '@/lib/organizationFilters';
import { validateEvaluationMinimum } from '@/lib/clinical/validations';
import { DEFAULT_EVALUATION_VALUES } from '@/lib/clinical/constants';
import type {
  ConsciousnessData,
  AttentionData,
  OrientationData,
  SensoperceptionData,
  MemoryData,
  ThoughtData,
  LanguageData,
  MoodData,
  WillData,
  PsychomotorData,
  IntelligenceData,
  PersonalityData,
} from '@/lib/clinical/types';

// Componentes reutilizáveis criados na FASE C2.5A
import { PsychicFunctionCard } from '@/components/clinical/PsychicFunctionCard';
import { BipolarSlider } from '@/components/clinical/BipolarSlider';
import { PercentileSlider } from '@/components/clinical/PercentileSlider';
import { CheckboxGroup } from '@/components/clinical/CheckboxGroup';

interface SessionEvaluationFormProps {
  sessionId?: string;
  patientId?: string;
}

export default function SessionEvaluationForm({ sessionId: propSessionId, patientId: propPatientId }: SessionEvaluationFormProps) {
  const { sessionId: paramSessionId, patientId: paramPatientId } = useParams();
  const sessionId = propSessionId || paramSessionId;
  const patientId = propPatientId || paramPatientId;
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, organizationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Estados para cada grupo de funções psíquicas (usando defaults centralizados)
  const [consciousness, setConsciousness] = useState<ConsciousnessData>(DEFAULT_EVALUATION_VALUES.consciousness);
  const [attention, setAttention] = useState<AttentionData>(DEFAULT_EVALUATION_VALUES.attention);
  const [orientation, setOrientation] = useState<OrientationData>(DEFAULT_EVALUATION_VALUES.orientation);
  const [sensoperception, setSensoperception] = useState<SensoperceptionData>(DEFAULT_EVALUATION_VALUES.sensoperception);
  const [memory, setMemory] = useState<MemoryData>(DEFAULT_EVALUATION_VALUES.memory);
  const [thought, setThought] = useState<ThoughtData>(DEFAULT_EVALUATION_VALUES.thought);
  const [language, setLanguage] = useState<LanguageData>(DEFAULT_EVALUATION_VALUES.language);
  const [mood, setMood] = useState<MoodData>(DEFAULT_EVALUATION_VALUES.mood);
  const [will, setWill] = useState<WillData>(DEFAULT_EVALUATION_VALUES.will);
  const [psychomotor, setPsychomotor] = useState<PsychomotorData>(DEFAULT_EVALUATION_VALUES.psychomotor);
  const [intelligence, setIntelligence] = useState<IntelligenceData>(DEFAULT_EVALUATION_VALUES.intelligence);
  const [personality, setPersonality] = useState<PersonalityData>(DEFAULT_EVALUATION_VALUES.personality);

  useEffect(() => {
    if (sessionId) {
      validateAndLoadSession();
    }
  }, [sessionId, user]);

  const validateAndLoadSession = async () => {
    if (!user || !organizationId) return;
    
    try {
      setLoading(true);
      
      const orgUserIds = await getUserIdsInOrganization(organizationId);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          patients!inner(user_id, name)
        `)
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) throw sessionError;
      
      if (!sessionData) {
        setValidationError('Sessão não encontrada.');
        return;
      }

      if (!orgUserIds.includes(sessionData.patients.user_id)) {
        setValidationError('Esta sessão não pertence à organização ativa.');
        return;
      }

      if (sessionData.patients.user_id !== user.id) {
        setValidationError('Você não tem permissão para avaliar esta sessão.');
        return;
      }

      if (sessionData.status !== 'attended') {
        setValidationError('Apenas sessões com status "Compareceu" podem ser avaliadas.');
        return;
      }

      const sessionDate = new Date(sessionData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (sessionDate > today) {
        setValidationError('Não é possível avaliar sessões futuras.');
        return;
      }

      await loadExistingEvaluation();
      
    } catch (error: any) {
      console.error('Erro ao validar sessão:', error);
      setValidationError('Erro ao carregar informações da sessão.');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingEvaluation = async () => {
    try {
      const { data, error } = await supabase
        .from('session_evaluations')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConsciousness(data.consciousness_data as any);
        setAttention(data.attention_data as any);
        setOrientation(data.orientation_data as any);
        setSensoperception(data.sensoperception_data as any);
        setMemory(data.memory_data as any);
        setThought(data.thought_data as any);
        setLanguage(data.language_data as any);
        setMood(data.mood_data as any);
        setWill(data.will_data as any);
        setPsychomotor(data.psychomotor_data as any);
        setIntelligence(data.intelligence_data as any);
        setPersonality(data.personality_data as any);
      }
    } catch (error: any) {
      console.error('Erro ao carregar avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a avaliação existente',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!user || !sessionId || !patientId) {
      toast({
        title: 'Erro',
        description: 'Informações da sessão incompletas',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const evaluationData = {
        session_id: sessionId,
        patient_id: patientId,
        evaluated_by: user.id,
        consciousness_data: consciousness as any,
        attention_data: attention as any,
        orientation_data: orientation as any,
        sensoperception_data: sensoperception as any,
        memory_data: memory as any,
        thought_data: thought as any,
        language_data: language as any,
        mood_data: mood as any,
        will_data: will as any,
        psychomotor_data: psychomotor as any,
        intelligence_data: intelligence as any,
        personality_data: personality as any
      };

      const validation = validateEvaluationMinimum(evaluationData);
      if (!validation.isValid) {
        toast({
          title: 'Validação',
          description: validation.errors[0],
          variant: 'destructive'
        });
        return;
      }

      const { data: existing } = await supabase
        .from('session_evaluations')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('session_evaluations')
          .update(evaluationData)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('session_evaluations')
          .insert(evaluationData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Avaliação salva com sucesso!'
      });

      navigate(`/patients/${patientId}`, { state: { openTab: 'evolution' } });
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a avaliação',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Validação</AlertTitle>
          <AlertDescription className="mt-2">
            {validationError}
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => navigate(patientId ? `/patients/${patientId}` : '/patients')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/patients/${patientId}`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Avaliação de Sessão</h1>
          <p className="text-muted-foreground">Funções Psíquicas - Dalgalarrondo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. CONSCIÊNCIA */}
        <PsychicFunctionCard
          number={1}
          title="Consciência"
          description="Base para todas as demais funções"
        >
          <BipolarSlider
            label="Nível de consciência"
            value={consciousness.level}
            onChange={(v) => setConsciousness({ ...consciousness, level: v })}
            description="-100 (coma) | -50 (torpor) | 0 (lúcido/vígil) | +50 (hipervigilante) | +100 (confusão)"
          />

          <BipolarSlider
            label="Campo de consciência"
            value={consciousness.field}
            onChange={(v) => setConsciousness({ ...consciousness, field: v })}
            description="-100 (estreitamento) | 0 (amplitude normal) | +100 (expansão caótica)"
          />

          <BipolarSlider
            label="Auto-consciência"
            value={consciousness.self_consciousness}
            onChange={(v) => setConsciousness({ ...consciousness, self_consciousness: v })}
            description="-100 (alienado do eu) | 0 (normal) | +100 (hiperautoconsciente/obsessivo)"
          />

          <CheckboxGroup
            label="Contato com realidade"
            options={[
              {
                id: 'oriented_auto',
                label: 'Orientado auto/alopsiquicamente',
                checked: consciousness.oriented_auto,
                onChange: (c) => setConsciousness({ ...consciousness, oriented_auto: c })
              },
              {
                id: 'disoriented_time',
                label: 'Desorientado tempo',
                checked: consciousness.disoriented_time,
                onChange: (c) => setConsciousness({ ...consciousness, disoriented_time: c })
              },
              {
                id: 'disoriented_space',
                label: 'Desorientado espaço',
                checked: consciousness.disoriented_space,
                onChange: (c) => setConsciousness({ ...consciousness, disoriented_space: c })
              },
              {
                id: 'depersonalization',
                label: 'Despersonalização',
                checked: consciousness.depersonalization,
                onChange: (c) => setConsciousness({ ...consciousness, depersonalization: c })
              },
              {
                id: 'derealization',
                label: 'Desrealização',
                checked: consciousness.derealization,
                onChange: (c) => setConsciousness({ ...consciousness, derealization: c })
              }
            ]}
          />

          <div className="space-y-2">
            <Label htmlFor="consciousness_notes">Observações</Label>
            <Textarea
              id="consciousness_notes"
              value={consciousness.notes}
              onChange={(e) => setConsciousness({ ...consciousness, notes: e.target.value })}
              placeholder="Notas sobre consciência..."
              rows={3}
            />
          </div>
        </PsychicFunctionCard>

        {/* 2. ORIENTAÇÃO / JUÍZO / CRÍTICA */}
        <PsychicFunctionCard
          number={2}
          title="Orientação / Juízo / Crítica"
          description="Orientação, juízo de realidade e insight"
        >
          <CheckboxGroup
            label="Orientação auto / alopsíquica"
            options={[
              {
                id: 'orientation_time',
                label: 'Tempo',
                checked: orientation.time,
                onChange: (c) => setOrientation({ ...orientation, time: c })
              },
              {
                id: 'orientation_space',
                label: 'Espaço',
                checked: orientation.space,
                onChange: (c) => setOrientation({ ...orientation, space: c })
              },
              {
                id: 'orientation_person',
                label: 'Pessoa',
                checked: orientation.person,
                onChange: (c) => setOrientation({ ...orientation, person: c })
              },
              {
                id: 'orientation_situation',
                label: 'Situação',
                checked: orientation.situation,
                onChange: (c) => setOrientation({ ...orientation, situation: c })
              }
            ]}
          />

          <div className="space-y-2">
            <Label>Juízo de realidade</Label>
            <Select
              value={orientation.reality_judgment}
              onValueChange={(v) => setOrientation({ ...orientation, reality_judgment: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intact">Íntegro</SelectItem>
                <SelectItem value="partially_altered">Parcialmente alterado</SelectItem>
                <SelectItem value="severely_altered">Gravemente alterado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PercentileSlider
            label="Crítica e insight"
            value={orientation.insight}
            onChange={(v) => setOrientation({ ...orientation, insight: v })}
            description="0 (sem insight) | 100 (crítico sobre a própria condição)"
          />

          <div className="space-y-2">
            <Label htmlFor="orientation_comments">Comentário sobre insight e percepção de doença</Label>
            <Textarea
              id="orientation_comments"
              value={orientation.comments}
              onChange={(e) => setOrientation({ ...orientation, comments: e.target.value })}
              placeholder="Comentário sobre insight e percepção de doença..."
              rows={3}
            />
          </div>
        </PsychicFunctionCard>

        {/* 3. SENSOPERCEPÇÃO */}
        <PsychicFunctionCard
          number={3}
          title="Sensopercepção"
          description="Percepção sensorial e alterações perceptivas"
        >
          <div className="space-y-2">
            <Label>Percepção global</Label>
            <Select
              value={sensoperception.global_perception}
              onValueChange={(v) => setSensoperception({ ...sensoperception, global_perception: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="slightly_altered">Levemente alterada</SelectItem>
                <SelectItem value="distortive">Distorsiva (ilusões)</SelectItem>
                <SelectItem value="hallucinatory">Perceptiva sem objeto (alucinação)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CheckboxGroup
            label="Tipo de alteração (se presente)"
            options={[
              {
                id: 'auditory',
                label: 'Auditiva',
                checked: sensoperception.auditory,
                onChange: (c) => setSensoperception({ ...sensoperception, auditory: c })
              },
              {
                id: 'visual',
                label: 'Visual',
                checked: sensoperception.visual,
                onChange: (c) => setSensoperception({ ...sensoperception, visual: c })
              },
              {
                id: 'tactile',
                label: 'Tátil',
                checked: sensoperception.tactile,
                onChange: (c) => setSensoperception({ ...sensoperception, tactile: c })
              },
              {
                id: 'olfactory',
                label: 'Olfativa',
                checked: sensoperception.olfactory,
                onChange: (c) => setSensoperception({ ...sensoperception, olfactory: c })
              },
              {
                id: 'kinesthetic',
                label: 'Cinestésica',
                checked: sensoperception.kinesthetic,
                onChange: (c) => setSensoperception({ ...sensoperception, kinesthetic: c })
              },
              {
                id: 'mixed',
                label: 'Mista',
                checked: sensoperception.mixed,
                onChange: (c) => setSensoperception({ ...sensoperception, mixed: c })
              }
            ]}
          />

          <div className="space-y-2">
            <Label htmlFor="sensoperception_description">Descrição fenomenológica breve</Label>
            <Textarea
              id="sensoperception_description"
              value={sensoperception.description}
              onChange={(e) => setSensoperception({ ...sensoperception, description: e.target.value })}
              placeholder="Máx. 250 caracteres"
              maxLength={250}
              rows={2}
            />
          </div>
        </PsychicFunctionCard>

        {/* 4. MEMÓRIA */}
        <PsychicFunctionCard
          number={4}
          title="Memória"
          description="Fixação, evocação e memória autobiográfica"
        >
          <PercentileSlider
            label="Fixação (memória imediata)"
            value={memory.fixation}
            onChange={(v) => setMemory({ ...memory, fixation: v })}
          />

          <PercentileSlider
            label="Evocação (curto prazo)"
            value={memory.recall}
            onChange={(v) => setMemory({ ...memory, recall: v })}
          />

          <CheckboxGroup
            label="Alterações"
            options={[
              {
                id: 'memory_auditory',
                label: 'Auditória',
                checked: memory.auditory,
                onChange: (c) => setMemory({ ...memory, auditory: c })
              },
              {
                id: 'hypermnesia',
                label: 'Hipermnssia',
                checked: memory.hypermnesia,
                onChange: (c) => setMemory({ ...memory, hypermnesia: c })
              },
              {
                id: 'paramnesia',
                label: 'Paramnésia',
                checked: memory.paramnesia,
                onChange: (c) => setMemory({ ...memory, paramnesia: c })
              },
              {
                id: 'memory_amnesia',
                label: 'Amnésia',
                checked: memory.amnesia,
                onChange: (c) => setMemory({ ...memory, amnesia: c })
              },
              {
                id: 'phobias',
                label: 'Fobias',
                checked: memory.phobias,
                onChange: (c) => setMemory({ ...memory, phobias: c })
              }
            ]}
          />

          <div className="space-y-2">
            <Label htmlFor="memory_notes">Descrição livre do conteúdo</Label>
            <Textarea
              id="memory_notes"
              value={memory.notes}
              onChange={(e) => setMemory({ ...memory, notes: e.target.value })}
              placeholder="Descrição livre do conteúdo..."
              rows={2}
            />
          </div>
        </PsychicFunctionCard>

        {/* 5. PENSAMENTO */}
        <PsychicFunctionCard
          number={5}
          title="Pensamento"
          description="Curso, forma e conteúdo do pensamento"
        >
          <BipolarSlider
            label="Curso do pensamento"
            value={thought.course}
            onChange={(v) => setThought({ ...thought, course: v })}
            description="-100 (lentificação) | 0 (normal) | +100 (fuga de ideias)"
          />

          <CheckboxGroup
            label="Forma do pensamento"
            options={[
              {
                id: 'tangential',
                label: 'Tangencial',
                checked: thought.tangential,
                onChange: (c) => setThought({ ...thought, tangential: c })
              },
              {
                id: 'incoherent',
                label: 'Incoerente',
                checked: thought.incoherent,
                onChange: (c) => setThought({ ...thought, incoherent: c })
              },
              {
                id: 'dissociated',
                label: 'Dissociado',
                checked: thought.dissociated,
                onChange: (c) => setThought({ ...thought, dissociated: c })
              },
              {
                id: 'circumstantial',
                label: 'Circunstancial',
                checked: thought.circumstantial,
                onChange: (c) => setThought({ ...thought, circumstantial: c })
              }
            ]}
          />

          <CheckboxGroup
            label="Conteúdo do pensamento"
            options={[
              {
                id: 'delusional',
                label: 'Delirante',
                checked: thought.delusional,
                onChange: (c) => setThought({ ...thought, delusional: c })
              },
              {
                id: 'obsessive',
                label: 'Obsessivo',
                checked: thought.obsessive,
                onChange: (c) => setThought({ ...thought, obsessive: c })
              },
              {
                id: 'overvalued',
                label: 'Ideias supervalorizadas',
                checked: thought.overvalued,
                onChange: (c) => setThought({ ...thought, overvalued: c })
              }
            ]}
          />

          <div className="space-y-2">
            <Label htmlFor="thought_description">Fenomenologia do conteúdo</Label>
            <Textarea
              id="thought_description"
              value={thought.description}
              onChange={(e) => setThought({ ...thought, description: e.target.value })}
              placeholder="Descreva temas recorrentes, preocupações centrais..."
              rows={3}
            />
          </div>
        </PsychicFunctionCard>

        {/* 6. LINGUAGEM */}
        <PsychicFunctionCard
          number={6}
          title="Linguagem"
          description="Ritmo, articulação e coerência do discurso"
        >
          <BipolarSlider
            label="Ritmo de fala"
            value={language.speech_rate}
            onChange={(v) => setLanguage({ ...language, speech_rate: v })}
            description="-100 (muito lento) | 0 (normal) | +100 (muito rápido/pressão de fala)"
          />

          <div className="space-y-2">
            <Label>Articulação</Label>
            <Select
              value={language.articulation}
              onValueChange={(v) => setLanguage({ ...language, articulation: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="dysarthric">Disártrica</SelectItem>
                <SelectItem value="stuttering">Gagueira</SelectItem>
                <SelectItem value="neologisms">Neologismos</SelectItem>
                <SelectItem value="mutism">Mutismo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language_observations">Observações</Label>
            <Textarea
              id="language_observations"
              value={language.observations}
              onChange={(e) => setLanguage({ ...language, observations: e.target.value })}
              placeholder="Observações sobre a linguagem..."
              rows={3}
            />
          </div>
        </PsychicFunctionCard>

        {/* 7. HUMOR / AFETIVIDADE */}
        <PsychicFunctionCard
          number={7}
          title="Humor / Afetividade"
          description="Polaridade afetiva e reatividade emocional"
        >
          <BipolarSlider
            label="Polaridade afetiva principal"
            value={mood.polarity}
            onChange={(v) => setMood({ ...mood, polarity: v })}
            description="-100 (depressivo) | 0 (eutímico) | +100 (eufórico)"
          />

          <PercentileSlider
            label="Labilidade afetiva"
            value={mood.lability}
            onChange={(v) => setMood({ ...mood, lability: v })}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="emotional_responsiveness"
              checked={mood.emotional_responsiveness}
              onCheckedChange={(c) => setMood({ ...mood, emotional_responsiveness: c as boolean })}
            />
            <label htmlFor="emotional_responsiveness" className="text-sm cursor-pointer">
              Responsividade emocional apropriada
            </label>
          </div>

          <div className="space-y-2">
            <Label>Adequação afetiva</Label>
            <Select
              value={mood.adequacy}
              onValueChange={(v) => setMood({ ...mood, adequacy: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adequate">Adequado</SelectItem>
                <SelectItem value="blunted">Embotado</SelectItem>
                <SelectItem value="incongruent">Incongruente</SelectItem>
                <SelectItem value="parathymic">Paratímico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood_notes">Observações</Label>
            <Textarea
              id="mood_notes"
              value={mood.notes}
              onChange={(e) => setMood({ ...mood, notes: e.target.value })}
              placeholder="Observações sobre humor e afeto..."
              rows={2}
            />
          </div>
        </PsychicFunctionCard>

        {/* 8. VONTADE */}
        <PsychicFunctionCard
          number={8}
          title="Vontade"
          description="Energia volitiva e controle de impulsos"
        >
          <BipolarSlider
            label="Energia volitiva"
            value={will.volitional_energy}
            onChange={(v) => setWill({ ...will, volitional_energy: v })}
            description="-100 (abulia) | 0 (normal) | +100 (hiperbulia)"
          />

          <BipolarSlider
            label="Controle de impulsos"
            value={will.impulse_control}
            onChange={(v) => setWill({ ...will, impulse_control: v })}
            description="-100 (impulsivo) | 0 (equilibrado) | +100 (inibido)"
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ambivalence"
              checked={will.ambivalence}
              onCheckedChange={(c) => setWill({ ...will, ambivalence: c as boolean })}
            />
            <label htmlFor="ambivalence" className="text-sm cursor-pointer">
              Ambivalência presente
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="will_observations">Decisões, iniciativas ou inibições observadas</Label>
            <Textarea
              id="will_observations"
              value={will.observations}
              onChange={(e) => setWill({ ...will, observations: e.target.value })}
              placeholder="Decisões, iniciativas ou inibições observadas nesta sessão..."
              rows={2}
            />
          </div>
        </PsychicFunctionCard>

        {/* 9. PSICOMOTRICIDADE */}
        <PsychicFunctionCard
          number={9}
          title="Psicomotricidade"
          description="Atividade motora, tônus e expressividade"
        >
          <BipolarSlider
            label="Atividade motora geral"
            value={psychomotor.motor_activity}
            onChange={(v) => setPsychomotor({ ...psychomotor, motor_activity: v })}
            description="-100 (inibição) | 0 (movimento normal) | +100 (agitação)"
          />

          <div className="space-y-2">
            <Label>Tônus e gestualidade</Label>
            <Select
              value={psychomotor.tone_gestures}
              onValueChange={(v) => setPsychomotor({ ...psychomotor, tone_gestures: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="stereotyped">Estereotipado</SelectItem>
                <SelectItem value="catatonic">Catatônico</SelectItem>
                <SelectItem value="mannerisms">Maneirismos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PercentileSlider
            label="Expressividade facial"
            value={psychomotor.facial_expressiveness}
            onChange={(v) => setPsychomotor({ ...psychomotor, facial_expressiveness: v })}
            description="0 (neutra) | 100 (muito expressiva)"
          />

          <div className="space-y-2">
            <Label htmlFor="psychomotor_notes">Observações</Label>
            <Textarea
              id="psychomotor_notes"
              value={psychomotor.notes}
              onChange={(e) => setPsychomotor({ ...psychomotor, notes: e.target.value })}
              placeholder="Observações sobre psicomotricidade..."
              rows={2}
            />
          </div>
        </PsychicFunctionCard>

        {/* 10. INTELIGÊNCIA */}
        <PsychicFunctionCard
          number={10}
          title="Inteligência"
          description="Raciocínio, aprendizagem e capacidade adaptativa"
        >
          <PercentileSlider
            label="Raciocínio abstrato"
            value={intelligence.abstract_reasoning}
            onChange={(v) => setIntelligence({ ...intelligence, abstract_reasoning: v })}
          />

          <PercentileSlider
            label="Capacidade de aprendizagem"
            value={intelligence.learning_capacity}
            onChange={(v) => setIntelligence({ ...intelligence, learning_capacity: v })}
          />

          <div className="space-y-2">
            <Label>Capacidade adaptativa / prática</Label>
            <Select
              value={intelligence.adaptive_capacity}
              onValueChange={(v) => setIntelligence({ ...intelligence, adaptive_capacity: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="mild">Déficit leve</SelectItem>
                <SelectItem value="moderate">Déficit moderado</SelectItem>
                <SelectItem value="severe">Déficit grave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intelligence_notes">Observações</Label>
            <Textarea
              id="intelligence_notes"
              value={intelligence.notes}
              onChange={(e) => setIntelligence({ ...intelligence, notes: e.target.value })}
              placeholder="Observações sobre inteligência e capacidades cognitivas..."
              rows={2}
            />
          </div>
        </PsychicFunctionCard>

        {/* 11. ATENÇÃO E CONCENTRAÇÃO */}
        <PsychicFunctionCard
          number={11}
          title="Atenção e Concentração"
          description="Capacidade de focar e sustentar a atenção"
        >
          <PercentileSlider
            label="Amplitude da atenção"
            value={attention.range}
            onChange={(v) => setAttention({ ...attention, range: v })}
            description="0 (aprosexia) | 50 (normal) | 100 (hiperprosexia)"
          />

          <PercentileSlider
            label="Concentração"
            value={attention.concentration}
            onChange={(v) => setAttention({ ...attention, concentration: v })}
            description="Sustentação atencional: 0 (nenhuma) | 100 (excelente)"
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="distractibility"
              checked={attention.distractibility}
              onCheckedChange={(c) => setAttention({ ...attention, distractibility: c as boolean })}
            />
            <label htmlFor="distractibility" className="text-sm cursor-pointer">
              Distraibilidade presente
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attention_notes">Descrição fenomenológica</Label>
            <Textarea
              id="attention_notes"
              value={attention.notes}
              onChange={(e) => setAttention({ ...attention, notes: e.target.value })}
              placeholder="Breve descrição fenomenológica..."
              rows={2}
            />
          </div>
        </PsychicFunctionCard>

        {/* 12. PERSONALIDADE / EU */}
        <PsychicFunctionCard
          number={12}
          title="Personalidade / Eu"
          description="Coerência, estabilidade e traços predominantes"
        >
          <PercentileSlider
            label="Coerência do eu"
            value={personality.self_coherence}
            onChange={(v) => setPersonality({ ...personality, self_coherence: v })}
            description="0 (fragmentado) | 50 (moderado) | 100 (integrado)"
          />

          <PercentileSlider
            label="Estabilidade afetiva"
            value={personality.affective_stability}
            onChange={(v) => setPersonality({ ...personality, affective_stability: v })}
          />

          <div className="space-y-2">
            <Label>Fronteiras do eu</Label>
            <Select
              value={personality.self_boundaries}
              onValueChange={(v) => setPersonality({ ...personality, self_boundaries: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normais</SelectItem>
                <SelectItem value="dissociated">Dissociadas</SelectItem>
                <SelectItem value="diffuse">Difusas</SelectItem>
                <SelectItem value="alienated">Alienadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CheckboxGroup
            label="Traços predominantes"
            options={[
              {
                id: 'anxious',
                label: 'Ansioso',
                checked: personality.anxious,
                onChange: (c) => setPersonality({ ...personality, anxious: c })
              },
              {
                id: 'narcissistic',
                label: 'Narcísico',
                checked: personality.narcissistic,
                onChange: (c) => setPersonality({ ...personality, narcissistic: c })
              },
              {
                id: 'avoidant',
                label: 'Evitativo',
                checked: personality.avoidant,
                onChange: (c) => setPersonality({ ...personality, avoidant: c })
              },
              {
                id: 'obsessive',
                label: 'Obsessivo',
                checked: personality.obsessive,
                onChange: (c) => setPersonality({ ...personality, obsessive: c })
              },
              {
                id: 'borderline',
                label: 'Borderline',
                checked: personality.borderline,
                onChange: (c) => setPersonality({ ...personality, borderline: c })
              },
              {
                id: 'histrionic',
                label: 'Histriônico',
                checked: personality.histrionic,
                onChange: (c) => setPersonality({ ...personality, histrionic: c })
              },
              {
                id: 'antisocial',
                label: 'Antissocial',
                checked: personality.antisocial,
                onChange: (c) => setPersonality({ ...personality, antisocial: c })
              }
            ]}
          />

          <div className="space-y-2">
            <Label htmlFor="personality_observations">Observações sobre identidade e defesas</Label>
            <Textarea
              id="personality_observations"
              value={personality.observations}
              onChange={(e) => setPersonality({ ...personality, observations: e.target.value })}
              placeholder="Observações sobre identidade, coerência e defesas predominantes..."
              rows={3}
            />
          </div>
        </PsychicFunctionCard>

      </div>

      {/* Botão de salvar fixo no rodapé */}
      <div className="sticky bottom-0 bg-background border-t py-4 mt-8">
        <div className="container mx-auto max-w-6xl flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${patientId}`)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Avaliação
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
