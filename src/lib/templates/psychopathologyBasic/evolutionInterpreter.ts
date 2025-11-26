/**
 * ============================================================================
 * FASE C2.6 - Psychopathology Basic - Evolution Interpreter
 * ============================================================================
 * 
 * Extrai toda a lógica de interpretação de avaliações psíquicas
 * que estava hardcoded em ClinicalEvolution.tsx.
 * 
 * Este interpreter é específico do template psicopatológico básico.
 */

/**
 * Severity levels for psychic function interpretation
 */
export type Severity = 'normal' | 'moderate' | 'severe';

/**
 * Result of interpreting a single psychic function
 */
export interface FunctionInterpretation {
  text: string;
  severity: Severity;
  indicators?: Array<{
    label: string;
    value: number;
    scale: 'bipolar' | 'unipolar';
  }>;
}

/**
 * Interface for Clinical Evolution Interpreter
 * Defines the contract for interpreting session evaluations
 */
export interface ClinicalEvolutionInterpreter {
  /** Generate global clinical summary from a session evaluation */
  generateGlobalSummary: (evaluation: any) => string;
  
  /** Interpret a specific psychic function */
  interpretFunction: (functionId: string, data: any) => FunctionInterpretation;
  
  /** Individual function interpreters (optional, for advanced use) */
  interpretConsciousness?: (data: any) => FunctionInterpretation;
  interpretOrientation?: (data: any) => FunctionInterpretation;
  interpretMemory?: (data: any) => FunctionInterpretation;
  interpretMood?: (data: any) => FunctionInterpretation;
  interpretThought?: (data: any) => FunctionInterpretation;
  interpretLanguage?: (data: any) => FunctionInterpretation;
  interpretSensoperception?: (data: any) => FunctionInterpretation;
  interpretIntelligence?: (data: any) => FunctionInterpretation;
  interpretWill?: (data: any) => FunctionInterpretation;
  interpretPsychomotor?: (data: any) => FunctionInterpretation;
  interpretAttention?: (data: any) => FunctionInterpretation;
  interpretPersonality?: (data: any) => FunctionInterpretation;
}

/**
 * ============================================================================
 * GLOBAL SUMMARY (Resumo Clínico Geral)
 * ============================================================================
 */

export function generateGlobalSummary(evaluation: any): string {
  const summaryParts: string[] = [];

  // ========== 1. CONSCIÊNCIA ==========
  const consciousness = evaluation.consciousness_data;
  const level = consciousness?.level || 0;
  const field = consciousness?.field || 0;
  const selfConsciousness = consciousness?.self_consciousness || 0;
  
  if (level < -50) {
    summaryParts.push('rebaixamento significativo do nível de consciência (torpor/coma)');
  } else if (level < -20) {
    summaryParts.push('leve rebaixamento do nível de consciência (torpor leve)');
  } else if (level > 50) {
    summaryParts.push('confusão mental significativa');
  } else if (level > 20) {
    summaryParts.push('hipervigilância (nível aumentado)');
  }
  
  if (field < -50) {
    summaryParts.push('estreitamento significativo do campo de consciência');
  } else if (field < -20) {
    summaryParts.push('leve estreitamento do campo de consciência');
  } else if (field > 50) {
    summaryParts.push('expansão caótica do campo de consciência');
  } else if (field > 20) {
    summaryParts.push('campo de consciência expandido');
  }
  
  if (selfConsciousness < -50) {
    summaryParts.push('alienação significativa do eu');
  } else if (selfConsciousness < -20) {
    summaryParts.push('leve alienação do eu');
  } else if (selfConsciousness > 50) {
    summaryParts.push('hiperautoconciência obsessiva');
  } else if (selfConsciousness > 20) {
    summaryParts.push('autoconsciência aumentada');
  }
  
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
  
  if (orientation?.reality_judgment === 'severely_impaired') {
    summaryParts.push('juízo de realidade gravemente prejudicado');
  } else if (orientation?.reality_judgment === 'partially_impaired') {
    summaryParts.push('juízo de realidade parcialmente prejudicado');
  }
  
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
  
  if (attentionRange < 20) {
    summaryParts.push('aprosexia (amplitude de atenção severamente reduzida)');
  } else if (attentionRange < 40) {
    summaryParts.push('amplitude de atenção significativamente reduzida');
  } else if (attentionRange < 60) {
    summaryParts.push('amplitude de atenção levemente reduzida');
  } else if (attentionRange > 85) {
    summaryParts.push('hiperprosexia (amplitude de atenção aumentada)');
  }
  
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
  
  if (fixation < 30) {
    summaryParts.push('fixação (memória imediata) severamente prejudicada');
  } else if (fixation < 50) {
    summaryParts.push('fixação (memória imediata) significativamente prejudicada');
  } else if (fixation < 70) {
    summaryParts.push('fixação (memória imediata) levemente prejudicada');
  }
  
  if (recall < 30) {
    summaryParts.push('evocação (memória de curto prazo) severamente prejudicada');
  } else if (recall < 50) {
    summaryParts.push('evocação (memória de curto prazo) significativamente prejudicada');
  } else if (recall < 70) {
    summaryParts.push('evocação (memória de curto prazo) levemente prejudicada');
  }
  
  if (memory?.amnesia) {
    summaryParts.push('amnésia presente');
  }
  if (memory?.hypermnesia) {
    summaryParts.push('hipermnésia');
  }
  if (memory?.paramnesia) {
    summaryParts.push('paramnésia');
  }

  // ========== 6. PENSAMENTO ==========
  const thought = evaluation.thought_data;
  const course = thought?.course || 0;
  
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
  
  const formAlterations = [];
  if (thought?.tangential) formAlterations.push('tangencial');
  if (thought?.incoherent) formAlterations.push('incoerente');
  if (thought?.dissociated) formAlterations.push('dissociado');
  if (thought?.circumstantial) formAlterations.push('circunstancial');
  
  if (formAlterations.length > 0) {
    summaryParts.push(`pensamento com forma ${formAlterations.join(', ')}`);
  }
  
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
  
  if (lability > 80) {
    summaryParts.push('labilidade emocional severa');
  } else if (lability > 65) {
    summaryParts.push('labilidade emocional significativa');
  } else if (lability > 50) {
    summaryParts.push('labilidade emocional presente');
  }
  
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
  
  if (psycho?.tone_gestures === 'increased') {
    summaryParts.push('tonicidade e gestos aumentados');
  } else if (psycho?.tone_gestures === 'decreased') {
    summaryParts.push('tonicidade e gestos diminuídos (hipotonia)');
  }
  
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
  
  if (reasoning < 30) {
    summaryParts.push('raciocínio abstrato severamente prejudicado');
  } else if (reasoning < 50) {
    summaryParts.push('raciocínio abstrato significativamente prejudicado');
  } else if (reasoning < 70) {
    summaryParts.push('raciocínio abstrato levemente prejudicado');
  }
  
  if (learning < 30) {
    summaryParts.push('capacidade de aprendizagem severamente prejudicada');
  } else if (learning < 50) {
    summaryParts.push('capacidade de aprendizagem significativamente prejudicada');
  } else if (learning < 70) {
    summaryParts.push('capacidade de aprendizagem levemente prejudicada');
  }
  
  if (intel?.adaptive_capacity === 'significantly_impaired') {
    summaryParts.push('capacidade adaptativa severamente prejudicada');
  } else if (intel?.adaptive_capacity === 'reduced') {
    summaryParts.push('capacidade adaptativa reduzida');
  }

  // ========== 12. PERSONALIDADE ==========
  const personality = evaluation.personality_data;
  const selfCoherence = personality?.self_coherence || 80;
  const affectiveStability = personality?.affective_stability || 80;
  
  if (selfCoherence < 30) {
    summaryParts.push('coerência do self severamente comprometida');
  } else if (selfCoherence < 50) {
    summaryParts.push('coerência do self significativamente comprometida');
  } else if (selfCoherence < 70) {
    summaryParts.push('coerência do self levemente comprometida');
  }
  
  if (affectiveStability < 30) {
    summaryParts.push('estabilidade afetiva severamente comprometida');
  } else if (affectiveStability < 50) {
    summaryParts.push('estabilidade afetiva significativamente comprometida');
  } else if (affectiveStability < 70) {
    summaryParts.push('estabilidade afetiva levemente comprometida');
  }
  
  if (personality?.self_boundaries === 'diffuse') {
    summaryParts.push('fronteiras do self difusas');
  } else if (personality?.self_boundaries === 'rigid') {
    summaryParts.push('fronteiras do self rígidas');
  }
  
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
}

/**
 * ============================================================================
 * FUNCTION-SPECIFIC INTERPRETERS
 * ============================================================================
 */

export function interpretConsciousness(data: any): FunctionInterpretation {
  const level = data?.level || 0;
  const field = data?.field || 0;
  const selfConsciousness = data?.self_consciousness || 0;
  let text = '';
  let severity: Severity = 'normal';

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

  if (data?.depersonalization || data?.derealization) {
    text += ' Presença de fenômenos dissociativos.';
    severity = 'severe';
  }

  return { 
    text, 
    severity, 
    indicators: [
      { label: 'Nível', value: level, scale: 'bipolar' },
      { label: 'Campo', value: field, scale: 'bipolar' },
      { label: 'Auto-consciência', value: selfConsciousness, scale: 'bipolar' }
    ] 
  };
}

export function interpretOrientation(data: any): FunctionInterpretation {
  const oriented = [data?.time, data?.space, data?.person, data?.situation].filter(Boolean).length;
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

  const insight = data?.insight || 80;
  return {
    text,
    severity,
    indicators: [{ label: 'Insight', value: insight, scale: 'unipolar' }]
  };
}

export function interpretMemory(data: any): FunctionInterpretation {
  const fixation = data?.fixation || 80;
  const recall = data?.recall || 80;
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

  if (data?.amnesia) {
    text += ' Presença de amnésia.';
    severity = 'severe';
  }

  return {
    text,
    severity,
    indicators: [
      { label: 'Fixação', value: fixation, scale: 'unipolar' },
      { label: 'Evocação', value: recall, scale: 'unipolar' }
    ]
  };
}

export function interpretMood(data: any): FunctionInterpretation {
  const polarity = data?.polarity || 0;
  const lability = data?.lability || 50;

  let text = '';
  let severity: Severity = 'normal';

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
    indicators: [
      { label: 'Polaridade', value: polarity, scale: 'bipolar' },
      { label: 'Labilidade', value: lability, scale: 'unipolar' }
    ]
  };
}

export function interpretThought(data: any): FunctionInterpretation {
  const course = data?.course || 0;
  let text = '';
  let severity: Severity = 'normal';

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
  if (data?.obsessive) alterations.push('obsessivo');
  if (data?.delusional) alterations.push('delirante');
  if (data?.incoherent) alterations.push('incoerente');
  if (data?.tangential) alterations.push('tangencial');

  if (alterations.length > 0) {
    text += ` Conteúdo ${alterations.join(', ')}.`;
    severity = data?.delusional || data?.incoherent ? 'severe' : 'moderate';
  }

  return { 
    text, 
    severity,
    indicators: [{ label: 'Curso do Pensamento', value: course, scale: 'bipolar' }]
  };
}

export function interpretLanguage(data: any): FunctionInterpretation {
  const speechRate = data?.speech_rate || 0;
  let text = '';
  let severity: Severity = 'normal';

  if (Math.abs(speechRate) <= 20) {
    text = 'Linguagem preservada, ritmo e articulação normais.';
  } else if (Math.abs(speechRate) <= 50) {
    text = speechRate < 0 ? 'Fala lentificada (bradilalia).' : 'Fala acelerada (taquilalia).';
    severity = 'moderate';
  } else {
    text = speechRate < 0 ? 'Fala muito lentificada.' : 'Fala muito acelerada.';
    severity = 'severe';
  }

  if (data?.articulation && data.articulation !== 'normal') {
    text += ' Alteração de articulação presente.';
    severity = 'moderate';
  }

  return { 
    text, 
    severity,
    indicators: [{ label: 'Velocidade da Fala', value: speechRate, scale: 'bipolar' }]
  };
}

export function interpretSensoperception(data: any): FunctionInterpretation {
  let text = 'Sensopercepção preservada.';
  let severity: Severity = 'normal';

  if (data?.global_perception === 'hallucinatory') {
    text = 'Percepção sem objeto (alucinações presentes).';
    severity = 'severe';
  } else if (data?.global_perception === 'distortive') {
    text = 'Percepção distorsiva (ilusões presentes).';
    severity = 'moderate';
  }

  const hallucinations = [];
  if (data?.auditory) hallucinations.push('auditivas');
  if (data?.visual) hallucinations.push('visuais');
  if (data?.tactile) hallucinations.push('táteis');
  
  if (hallucinations.length > 0) {
    text += ` Alucinações ${hallucinations.join(', ')}.`;
    severity = 'severe';
  }

  return { text, severity };
}

export function interpretIntelligence(data: any): FunctionInterpretation {
  const learning = data?.learning_capacity || 80;
  const reasoning = data?.abstract_reasoning || 80;
  const avg = (learning + reasoning) / 2;

  let text = '';
  let severity: Severity = 'normal';

  if (avg >= 70) {
    text = 'Funções intelectuais preservadas.';
  } else if (avg >= 40) {
    text = 'Prejuízo leve a moderado das funções intelectuais.';
    severity = 'moderate';
  } else {
    text = 'Prejuízo significativo das funções intelectuais.';
    severity = 'severe';
  }

  return {
    text,
    severity,
    indicators: [
      { label: 'Raciocínio', value: reasoning, scale: 'unipolar' },
      { label: 'Aprendizagem', value: learning, scale: 'unipolar' }
    ]
  };
}

export function interpretWill(data: any): FunctionInterpretation {
  const energy = data?.volitional_energy || 0;
  const impulse = data?.impulse_control || 0;

  let text = '';
  let severity: Severity = 'normal';

  if (Math.abs(energy) <= 20) {
    text = 'Energia volitiva preservada.';
  } else if (Math.abs(energy) <= 50) {
    text = energy < 0 ? 'Energia volitiva reduzida (abulia leve).' : 'Energia volitiva aumentada (hiperbulia leve).';
    severity = 'moderate';
  } else {
    text = energy < 0 ? 'Abulia significativa presente.' : 'Hiperbulia significativa presente.';
    severity = 'severe';
  }

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
    indicators: [
      { label: 'Energia Volitiva', value: energy, scale: 'bipolar' },
      { label: 'Controle de Impulsos', value: impulse, scale: 'bipolar' }
    ] 
  };
}

export function interpretPsychomotor(data: any): FunctionInterpretation {
  const activity = data?.motor_activity || 0;
  const facialExpressiveness = data?.facial_expressiveness || 50;

  let text = '';
  let severity: Severity = 'normal';

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
    indicators: [
      { label: 'Atividade Motora', value: activity, scale: 'bipolar' },
      { label: 'Expressividade Facial', value: facialExpressiveness, scale: 'unipolar' }
    ]
  };
}

export function interpretAttention(data: any): FunctionInterpretation {
  const range = data?.range || 80;
  const concentration = data?.concentration || 80;
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

  if (data?.distractibility) {
    text += ' Distraibilidade presente.';
    severity = 'moderate';
  }

  return {
    text,
    severity,
    indicators: [
      { label: 'Amplitude', value: range, scale: 'unipolar' },
      { label: 'Concentração', value: concentration, scale: 'unipolar' }
    ]
  };
}

export function interpretPersonality(data: any): FunctionInterpretation {
  const coherence = data?.self_coherence || 80;
  const stability = data?.affective_stability || 80;

  let text = '';
  let severity: Severity = 'normal';

  const traits = [];
  if (data?.anxious) traits.push('ansioso');
  if (data?.avoidant) traits.push('evitativo');
  if (data?.obsessive) traits.push('obsessivo');
  if (data?.borderline) traits.push('borderline');

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
    indicators: [
      { label: 'Coerência do Self', value: coherence, scale: 'unipolar' },
      { label: 'Estabilidade Afetiva', value: stability, scale: 'unipolar' }
    ]
  };
}

/**
 * Unified interpreter - maps function ID to interpreter
 */
export function interpretFunction(functionId: string, data: any): FunctionInterpretation {
  const interpreters: Record<string, (data: any) => FunctionInterpretation> = {
    consciousness: interpretConsciousness,
    orientation: interpretOrientation,
    memory: interpretMemory,
    mood: interpretMood,
    thought: interpretThought,
    language: interpretLanguage,
    sensoperception: interpretSensoperception,
    intelligence: interpretIntelligence,
    will: interpretWill,
    psychomotor: interpretPsychomotor,
    attention: interpretAttention,
    personality: interpretPersonality,
  };

  const interpreter = interpreters[functionId];
  if (!interpreter) {
    return {
      text: 'Função não implementada.',
      severity: 'normal'
    };
  }

  return interpreter(data);
}
