import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
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

  // Estados para cada grupo de funções psíquicas
  const [consciousness, setConsciousness] = useState({
    level: 0,
    field: 0,
    self_consciousness: 0,
    oriented_auto: false,
    disoriented_time: false,
    disoriented_space: false,
    depersonalization: false,
    derealization: false,
    notes: ''
  });

  const [attention, setAttention] = useState({
    range: 80,
    concentration: 80,
    distractibility: false,
    notes: ''
  });

  const [sensoperception, setSensoperception] = useState({
    global_perception: 'normal',
    auditory: false,
    visual: false,
    tactile: false,
    olfactory: false,
    kinesthetic: false,
    mixed: false,
    description: ''
  });

  const [memory, setMemory] = useState({
    fixation: 80,
    recall: 80,
    auditory: false,
    hypermnesia: false,
    paramnesia: false,
    amnesia: false,
    phobias: false,
    notes: ''
  });

  const [thought, setThought] = useState({
    course: 0,
    tangential: false,
    incoherent: false,
    dissociated: false,
    circumstantial: false,
    delusional: false,
    obsessive: false,
    overvalued: false,
    description: ''
  });

  const [language, setLanguage] = useState({
    speech_rate: 0,
    articulation: 'normal',
    observations: ''
  });

  const [mood, setMood] = useState({
    polarity: 0,
    lability: 50,
    emotional_responsiveness: true,
    adequacy: 'adequate',
    notes: ''
  });

  const [will, setWill] = useState({
    volitional_energy: 0,
    ambivalence: false,
    impulse_control: 0,
    observations: ''
  });

  const [psychomotor, setPsychomotor] = useState({
    motor_activity: 0,
    tone_gestures: 'normal',
    facial_expressiveness: 50,
    notes: ''
  });

  const [orientation, setOrientation] = useState({
    time: true,
    space: true,
    person: true,
    situation: true,
    reality_judgment: 'intact',
    insight: 80,
    comments: ''
  });

  const [intelligence, setIntelligence] = useState({
    abstract_reasoning: 80,
    learning_capacity: 80,
    adaptive_capacity: 'normal',
    facial_expressivity: 50,
    notes: ''
  });

  const [personality, setPersonality] = useState({
    self_coherence: 80,
    affective_stability: 80,
    self_boundaries: 'normal',
    anxious: false,
    narcissistic: false,
    avoidant: false,
    obsessive: false,
    borderline: false,
    histrionic: false,
    antisocial: false,
    observations: ''
  });

  useEffect(() => {
    if (sessionId) {
      validateAndLoadSession();
    }
  }, [sessionId, user]);

  const validateAndLoadSession = async () => {
    if (!user || !organizationId) return;
    
    try {
      setLoading(true);
      
      // Validar organização
      const orgUserIds = await getUserIdsInOrganization(organizationId);
      
      // Buscar a sessão com informações do paciente
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

      // Validar que o paciente pertence à organização ativa
      if (!orgUserIds.includes(sessionData.patients.user_id)) {
        setValidationError('Esta sessão não pertence à organização ativa.');
        return;
      }

      // Validar que o terapeuta é o dono do paciente
      if (sessionData.patients.user_id !== user.id) {
        setValidationError('Você não tem permissão para avaliar esta sessão.');
        return;
      }

      // Validar que a sessão tem status "attended"
      if (sessionData.status !== 'attended') {
        setValidationError('Apenas sessões com status "Compareceu" podem ser avaliadas.');
        return;
      }

      // Validar que a data da sessão já passou
      const sessionDate = new Date(sessionData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (sessionDate > today) {
        setValidationError('Não é possível avaliar sessões futuras.');
        return;
      }

      // Se passou em todas as validações, carregar avaliação existente
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
        setSensoperception(data.sensoperception_data as any);
        setMemory(data.memory_data as any);
        setThought(data.thought_data as any);
        setLanguage(data.language_data as any);
        setMood(data.mood_data as any);
        setWill(data.will_data as any);
        setPsychomotor(data.psychomotor_data as any);
        setOrientation(data.orientation_data as any);
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
        consciousness_data: consciousness,
        attention_data: attention,
        sensoperception_data: sensoperception,
        memory_data: memory,
        thought_data: thought,
        language_data: language,
        mood_data: mood,
        will_data: will,
        psychomotor_data: psychomotor,
        orientation_data: orientation,
        intelligence_data: intelligence,
        personality_data: personality
      };

      // 🔐 FASE C2.1: Validação mínima usando função centralizada
      const validation = validateEvaluationMinimum(evaluationData);
      if (!validation.isValid) {
        toast({
          title: 'Validação',
          description: validation.errors[0],
          variant: 'destructive'
        });
        return;
      }

      // Check if evaluation already exists
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

  const getSliderColor = (value: number, range: { min: number; max: number }) => {
    const normalized = ((value - range.min) / (range.max - range.min)) * 100;
    if (normalized < 33) return 'hsl(var(--chart-1))'; // Verde
    if (normalized < 66) return 'hsl(var(--chart-3))'; // Laranja
    return 'hsl(var(--chart-5))'; // Vermelho
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
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">1. Consciência</CardTitle>
            <CardDescription className="text-xs">Base para todas as demais funções</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Nível de consciência</Label>
                <span className="text-sm font-medium">{consciousness.level}</span>
              </div>
              <Slider
                value={[consciousness.level]}
                onValueChange={(v) => setConsciousness({ ...consciousness, level: v[0] })}
                min={-100}
                max={100}
                step={1}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                -100 (coma) | -50 (torpor) | 0 (lúcido/vígil) | +50 (hipervigilante) | +100 (confusão)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Campo de consciência</Label>
                <span className="text-sm font-medium">{consciousness.field}</span>
              </div>
              <Slider
                value={[consciousness.field]}
                onValueChange={(v) => setConsciousness({ ...consciousness, field: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (estreitamento) | 0 (amplitude normal) | +100 (expansão caótica)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Auto-consciência</Label>
                <span className="text-sm font-medium">{consciousness.self_consciousness}</span>
              </div>
              <Slider
                value={[consciousness.self_consciousness]}
                onValueChange={(v) => setConsciousness({ ...consciousness, self_consciousness: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (alienado do eu) | 0 (normal) | +100 (hiperautoconsciente/obsessivo)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Contato com realidade</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oriented_auto"
                    checked={consciousness.oriented_auto}
                    onCheckedChange={(checked) => setConsciousness({ ...consciousness, oriented_auto: checked as boolean })}
                  />
                  <label htmlFor="oriented_auto" className="text-sm cursor-pointer">
                    Orientado auto/alopsiquicamente
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="disoriented_time"
                    checked={consciousness.disoriented_time}
                    onCheckedChange={(checked) => setConsciousness({ ...consciousness, disoriented_time: checked as boolean })}
                  />
                  <label htmlFor="disoriented_time" className="text-sm cursor-pointer">
                    Desorientado tempo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="disoriented_space"
                    checked={consciousness.disoriented_space}
                    onCheckedChange={(checked) => setConsciousness({ ...consciousness, disoriented_space: checked as boolean })}
                  />
                  <label htmlFor="disoriented_space" className="text-sm cursor-pointer">
                    Desorientado espaço
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="depersonalization"
                    checked={consciousness.depersonalization}
                    onCheckedChange={(checked) => setConsciousness({ ...consciousness, depersonalization: checked as boolean })}
                  />
                  <label htmlFor="depersonalization" className="text-sm cursor-pointer">
                    Despersonalização
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="derealization"
                    checked={consciousness.derealization}
                    onCheckedChange={(checked) => setConsciousness({ ...consciousness, derealization: checked as boolean })}
                  />
                  <label htmlFor="derealization" className="text-sm cursor-pointer">
                    Desrealização
                  </label>
                </div>
              </div>
            </div>

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
          </CardContent>
        </Card>

        {/* 2. ORIENTAÇÃO / JUÍZO / CRÍTICA */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">2. Orientação / Juízo / Crítica</CardTitle>
            <CardDescription className="text-xs">Orientação, juízo de realidade e insight</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-3">
              <Label>Orientação auto / alopsíquica</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation_time"
                    checked={orientation.time}
                    onCheckedChange={(checked) => setOrientation({ ...orientation, time: checked as boolean })}
                  />
                  <label htmlFor="orientation_time" className="text-sm cursor-pointer">
                    Tempo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation_space"
                    checked={orientation.space}
                    onCheckedChange={(checked) => setOrientation({ ...orientation, space: checked as boolean })}
                  />
                  <label htmlFor="orientation_space" className="text-sm cursor-pointer">
                    Espaço
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation_person"
                    checked={orientation.person}
                    onCheckedChange={(checked) => setOrientation({ ...orientation, person: checked as boolean })}
                  />
                  <label htmlFor="orientation_person" className="text-sm cursor-pointer">
                    Pessoa
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orientation_situation"
                    checked={orientation.situation}
                    onCheckedChange={(checked) => setOrientation({ ...orientation, situation: checked as boolean })}
                  />
                  <label htmlFor="orientation_situation" className="text-sm cursor-pointer">
                    Situação
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Juízo de realidade</Label>
              <Select
                value={orientation.reality_judgment}
                onValueChange={(value) => setOrientation({ ...orientation, reality_judgment: value })}
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Crítica e insight</Label>
                <span className="text-sm font-medium">{orientation.insight}</span>
              </div>
              <Slider
                value={[orientation.insight]}
                onValueChange={(v) => setOrientation({ ...orientation, insight: v[0] })}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                0 (sem insight) | 100 (crítico sobre a própria condição)
              </p>
            </div>

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
          </CardContent>
        </Card>

        {/* 3. SENSOPERCEPÇÃO */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">3. Sensopercepção</CardTitle>
            <CardDescription className="text-xs">Percepção sensorial e alterações perceptivas</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <Label>Percepção global</Label>
              <Select
                value={sensoperception.global_perception}
                onValueChange={(value) => setSensoperception({ ...sensoperception, global_perception: value })}
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

            <div className="space-y-3">
              <Label>Tipo de alteração (se presente)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auditory"
                    checked={sensoperception.auditory}
                    onCheckedChange={(checked) => setSensoperception({ ...sensoperception, auditory: checked as boolean })}
                  />
                  <label htmlFor="auditory" className="text-sm cursor-pointer">
                    Auditiva
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visual"
                    checked={sensoperception.visual}
                    onCheckedChange={(checked) => setSensoperception({ ...sensoperception, visual: checked as boolean })}
                  />
                  <label htmlFor="visual" className="text-sm cursor-pointer">
                    Visual
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tactile"
                    checked={sensoperception.tactile}
                    onCheckedChange={(checked) => setSensoperception({ ...sensoperception, tactile: checked as boolean })}
                  />
                  <label htmlFor="tactile" className="text-sm cursor-pointer">
                    Tátil
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="olfactory"
                    checked={sensoperception.olfactory}
                    onCheckedChange={(checked) => setSensoperception({ ...sensoperception, olfactory: checked as boolean })}
                  />
                  <label htmlFor="olfactory" className="text-sm cursor-pointer">
                    Olfativa
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="kinesthetic"
                    checked={sensoperception.kinesthetic}
                    onCheckedChange={(checked) => setSensoperception({ ...sensoperception, kinesthetic: checked as boolean })}
                  />
                  <label htmlFor="kinesthetic" className="text-sm cursor-pointer">
                    Cinestésica
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mixed"
                    checked={sensoperception.mixed}
                    onCheckedChange={(checked) => setSensoperception({ ...sensoperception, mixed: checked as boolean })}
                  />
                  <label htmlFor="mixed" className="text-sm cursor-pointer">
                    Mista
                  </label>
                </div>
              </div>
            </div>

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
          </CardContent>
        </Card>

        {/* 4. MEMÓRIA */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">4. Memória</CardTitle>
            <CardDescription className="text-xs">Fixação, evocação e memória autobiográfica</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Fixação (memória imediata)</Label>
                <span className="text-sm font-medium">{memory.fixation}</span>
              </div>
              <Slider
                value={[memory.fixation]}
                onValueChange={(v) => setMemory({ ...memory, fixation: v[0] })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Evocação (curto prazo)</Label>
                <span className="text-sm font-medium">{memory.recall}</span>
              </div>
              <Slider
                value={[memory.recall]}
                onValueChange={(v) => setMemory({ ...memory, recall: v[0] })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <Label>Alterações</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="memory_auditory"
                    checked={memory.auditory}
                    onCheckedChange={(checked) => setMemory({ ...memory, auditory: checked as boolean })}
                  />
                  <label htmlFor="memory_auditory" className="text-sm cursor-pointer">
                    Auditória
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hypermnesia"
                    checked={memory.hypermnesia}
                    onCheckedChange={(checked) => setMemory({ ...memory, hypermnesia: checked as boolean })}
                  />
                  <label htmlFor="hypermnesia" className="text-sm cursor-pointer">
                    Hipermnssia
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="paramnesia"
                    checked={memory.paramnesia}
                    onCheckedChange={(checked) => setMemory({ ...memory, paramnesia: checked as boolean })}
                  />
                  <label htmlFor="paramnesia" className="text-sm cursor-pointer">
                    Paramnésia
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="memory_amnesia"
                    checked={memory.amnesia}
                    onCheckedChange={(checked) => setMemory({ ...memory, amnesia: checked as boolean })}
                  />
                  <label htmlFor="memory_amnesia" className="text-sm cursor-pointer">
                    Amnésia
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="phobias"
                    checked={memory.phobias}
                    onCheckedChange={(checked) => setMemory({ ...memory, phobias: checked as boolean })}
                  />
                  <label htmlFor="phobias" className="text-sm cursor-pointer">
                    Fobias
                  </label>
                </div>
              </div>
            </div>

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
          </CardContent>
        </Card>

        {/* 5. PENSAMENTO */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">5. Pensamento</CardTitle>
            <CardDescription className="text-xs">Curso, forma e conteúdo do pensamento</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Curso do pensamento</Label>
                <span className="text-sm font-medium">{thought.course}</span>
              </div>
              <Slider
                value={[thought.course]}
                onValueChange={(v) => setThought({ ...thought, course: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (lentificação) | 0 (normal) | +100 (fuga de ideias)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Forma do pensamento</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tangential"
                    checked={thought.tangential}
                    onCheckedChange={(checked) => setThought({ ...thought, tangential: checked as boolean })}
                  />
                  <label htmlFor="tangential" className="text-sm cursor-pointer">
                    Tangencial
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incoherent"
                    checked={thought.incoherent}
                    onCheckedChange={(checked) => setThought({ ...thought, incoherent: checked as boolean })}
                  />
                  <label htmlFor="incoherent" className="text-sm cursor-pointer">
                    Incoerente
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dissociated"
                    checked={thought.dissociated}
                    onCheckedChange={(checked) => setThought({ ...thought, dissociated: checked as boolean })}
                  />
                  <label htmlFor="dissociated" className="text-sm cursor-pointer">
                    Dissociado
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="circumstantial"
                    checked={thought.circumstantial}
                    onCheckedChange={(checked) => setThought({ ...thought, circumstantial: checked as boolean })}
                  />
                  <label htmlFor="circumstantial" className="text-sm cursor-pointer">
                    Circunstancial
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Conteúdo do pensamento</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delusional"
                    checked={thought.delusional}
                    onCheckedChange={(checked) => setThought({ ...thought, delusional: checked as boolean })}
                  />
                  <label htmlFor="delusional" className="text-sm cursor-pointer">
                    Ideias delirantes
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="obsessive"
                    checked={thought.obsessive}
                    onCheckedChange={(checked) => setThought({ ...thought, obsessive: checked as boolean })}
                  />
                  <label htmlFor="obsessive" className="text-sm cursor-pointer">
                    Ideias obsessivas
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overvalued"
                    checked={thought.overvalued}
                    onCheckedChange={(checked) => setThought({ ...thought, overvalued: checked as boolean })}
                  />
                  <label htmlFor="overvalued" className="text-sm cursor-pointer">
                    Ideias supervalorizadas
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thought_description">Descrição livre do conteúdo</Label>
              <Textarea
                id="thought_description"
                value={thought.description}
                onChange={(e) => setThought({ ...thought, description: e.target.value })}
                placeholder="200-500 caracteres"
                minLength={200}
                maxLength={500}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* 6. LINGUAGEM */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">6. Linguagem</CardTitle>
            <CardDescription className="text-xs">Velocidade, articulação e coerência da fala</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Velocidade da fala</Label>
                <span className="text-sm font-medium">{language.speech_rate}</span>
              </div>
              <Slider
                value={[language.speech_rate]}
                onValueChange={(v) => setLanguage({ ...language, speech_rate: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (bradilalia) | 0 (ritmo normal) | +100 (taquilalia)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Articulação / coerência</Label>
              <Select
                value={language.articulation}
                onValueChange={(value) => setLanguage({ ...language, articulation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal / Coerente</SelectItem>
                  <SelectItem value="vague">Discurso vago</SelectItem>
                  <SelectItem value="echolalia">Ecolalia</SelectItem>
                  <SelectItem value="mutism">Mutismo</SelectItem>
                  <SelectItem value="neologisms">Neologismos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language_observations">Observações</Label>
              <Textarea
                id="language_observations"
                value={language.observations}
                onChange={(e) => setLanguage({ ...language, observations: e.target.value })}
                placeholder="Anotar exemplos clínicos (ex: fala acelerada com trocadilhos; fuga de ideias)..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 7. HUMOR / AFETIVIDADE */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">7. Humor / Afetividade</CardTitle>
            <CardDescription className="text-xs">Polaridade afetiva e reatividade emocional</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Polaridade afetiva principal</Label>
                <span className="text-sm font-medium">{mood.polarity}</span>
              </div>
              <Slider
                value={[mood.polarity]}
                onValueChange={(v) => setMood({ ...mood, polarity: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (depressivo) | 0 (eutímico) | +100 (eufórico)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Labilidade afetiva</Label>
                <span className="text-sm font-medium">{mood.lability}</span>
              </div>
              <Slider
                value={[mood.lability]}
                onValueChange={(v) => setMood({ ...mood, lability: v[0] })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emotional_responsiveness"
                checked={mood.emotional_responsiveness}
                onCheckedChange={(checked) => setMood({ ...mood, emotional_responsiveness: checked as boolean })}
              />
              <label htmlFor="emotional_responsiveness" className="text-sm cursor-pointer">
                Responsividade emocional apropriada
              </label>
            </div>

            <div className="space-y-2">
              <Label>Adequação afetiva</Label>
              <Select
                value={mood.adequacy}
                onValueChange={(value) => setMood({ ...mood, adequacy: value })}
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
          </CardContent>
        </Card>

        {/* 8. VONTADE */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">8. Vontade</CardTitle>
            <CardDescription className="text-xs">Energia volitiva e controle de impulsos</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Energia volitiva</Label>
                <span className="text-sm font-medium">{will.volitional_energy}</span>
              </div>
              <Slider
                value={[will.volitional_energy]}
                onValueChange={(v) => setWill({ ...will, volitional_energy: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (abulia) | 0 (normal) | +100 (hiperbulia)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Controle de impulsos</Label>
                <span className="text-sm font-medium">{will.impulse_control}</span>
              </div>
              <Slider
                value={[will.impulse_control]}
                onValueChange={(v) => setWill({ ...will, impulse_control: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (impulsivo) | 0 (equilibrado) | +100 (inibido)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ambivalence"
                checked={will.ambivalence}
                onCheckedChange={(checked) => setWill({ ...will, ambivalence: checked as boolean })}
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
          </CardContent>
        </Card>

        {/* 9. PSICOMOTRICIDADE */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">9. Psicomotricidade</CardTitle>
            <CardDescription className="text-xs">Atividade motora, tônus e expressividade</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Atividade motora geral</Label>
                <span className="text-sm font-medium">{psychomotor.motor_activity}</span>
              </div>
              <Slider
                value={[psychomotor.motor_activity]}
                onValueChange={(v) => setPsychomotor({ ...psychomotor, motor_activity: v[0] })}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -100 (inibição) | 0 (movimento normal) | +100 (agitação)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tônus e gestualidade</Label>
              <Select
                value={psychomotor.tone_gestures}
                onValueChange={(value) => setPsychomotor({ ...psychomotor, tone_gestures: value })}
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Expressividade facial</Label>
                <span className="text-sm font-medium">{psychomotor.facial_expressiveness}</span>
              </div>
              <Slider
                value={[psychomotor.facial_expressiveness]}
                onValueChange={(v) => setPsychomotor({ ...psychomotor, facial_expressiveness: v[0] })}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                0 (neutra) | 100 (muito expressiva)
              </p>
            </div>

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
          </CardContent>
        </Card>

        {/* 10. INTELIGÊNCIA */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">10. Inteligência</CardTitle>
            <CardDescription className="text-xs">Raciocínio, aprendizagem e capacidade adaptativa</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Raciocínio abstrato</Label>
                <span className="text-sm font-medium">{intelligence.abstract_reasoning}</span>
              </div>
              <Slider
                value={[intelligence.abstract_reasoning]}
                onValueChange={(v) => setIntelligence({ ...intelligence, abstract_reasoning: v[0] })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Capacidade de aprendizagem</Label>
                <span className="text-sm font-medium">{intelligence.learning_capacity}</span>
              </div>
              <Slider
                value={[intelligence.learning_capacity]}
                onValueChange={(v) => setIntelligence({ ...intelligence, learning_capacity: v[0] })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Capacidade adaptativa / prática</Label>
              <Select
                value={intelligence.adaptive_capacity}
                onValueChange={(value) => setIntelligence({ ...intelligence, adaptive_capacity: value })}
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
          </CardContent>
        </Card>

        {/* 11. ATENÇÃO E CONCENTRAÇÃO */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">11. Atenção e Concentração</CardTitle>
            <CardDescription className="text-xs">Capacidade de focar e sustentar a atenção</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Amplitude da atenção</Label>
                <span className="text-sm font-medium">{attention.range}</span>
              </div>
              <Slider
                value={[attention.range]}
                onValueChange={(v) => setAttention({ ...attention, range: v[0] })}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                0 (aprosexia) | 50 (normal) | 100 (hiperprosexia)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Concentração</Label>
                <span className="text-sm font-medium">{attention.concentration}</span>
              </div>
              <Slider
                value={[attention.concentration]}
                onValueChange={(v) => setAttention({ ...attention, concentration: v[0] })}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Sustentação atencional: 0 (nenhuma) | 100 (excelente)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="distractibility"
                checked={attention.distractibility}
                onCheckedChange={(checked) => setAttention({ ...attention, distractibility: checked as boolean })}
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
          </CardContent>
        </Card>

        {/* 12. PERSONALIDADE / EU */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">12. Personalidade / Eu</CardTitle>
            <CardDescription className="text-xs">Coerência, estabilidade e traços predominantes</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Coerência do eu</Label>
                <span className="text-sm font-medium">{personality.self_coherence}</span>
              </div>
              <Slider
                value={[personality.self_coherence]}
                onValueChange={(v) => setPersonality({ ...personality, self_coherence: v[0] })}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                0 (fragmentado) | 50 (moderado) | 100 (integrado)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Fronteiras do eu</Label>
              </div>
              <Select
                value={personality.self_boundaries}
                onValueChange={(value) => setPersonality({ ...personality, self_boundaries: value })}
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

            <div className="space-y-3">
              <Label>Traços predominantes</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anxious"
                    checked={personality.anxious}
                    onCheckedChange={(checked) => setPersonality({ ...personality, anxious: checked as boolean })}
                  />
                  <label htmlFor="anxious" className="text-sm cursor-pointer">
                    Ansioso
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="narcissistic"
                    checked={personality.narcissistic}
                    onCheckedChange={(checked) => setPersonality({ ...personality, narcissistic: checked as boolean })}
                  />
                  <label htmlFor="narcissistic" className="text-sm cursor-pointer">
                    Narcísico
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="avoidant"
                    checked={personality.avoidant}
                    onCheckedChange={(checked) => setPersonality({ ...personality, avoidant: checked as boolean })}
                  />
                  <label htmlFor="avoidant" className="text-sm cursor-pointer">
                    Evitativo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="obsessive"
                    checked={personality.obsessive}
                    onCheckedChange={(checked) => setPersonality({ ...personality, obsessive: checked as boolean })}
                  />
                  <label htmlFor="obsessive" className="text-sm cursor-pointer">
                    Obsessivo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="borderline"
                    checked={personality.borderline}
                    onCheckedChange={(checked) => setPersonality({ ...personality, borderline: checked as boolean })}
                  />
                  <label htmlFor="borderline" className="text-sm cursor-pointer">
                    Borderline
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="histrionic"
                    checked={personality.histrionic}
                    onCheckedChange={(checked) => setPersonality({ ...personality, histrionic: checked as boolean })}
                  />
                  <label htmlFor="histrionic" className="text-sm cursor-pointer">
                    Histriônico
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="antisocial"
                    checked={personality.antisocial}
                    onCheckedChange={(checked) => setPersonality({ ...personality, antisocial: checked as boolean })}
                  />
                  <label htmlFor="antisocial" className="text-sm cursor-pointer">
                    Antissocial
                  </label>
                </div>
              </div>
            </div>

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
          </CardContent>
        </Card>

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