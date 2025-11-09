-- Create session_evaluations table for detailed psychological function assessments
CREATE TABLE public.session_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  evaluated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 1. Consciência (Consciousness)
  consciousness_data JSONB DEFAULT '{
    "level": 0,
    "field": 0,
    "self_consciousness": 0,
    "oriented_auto": false,
    "disoriented_time": false,
    "disoriented_space": false,
    "depersonalization": false,
    "derealization": false,
    "notes": ""
  }'::jsonb,
  
  -- 2. Atenção e Concentração (Attention and Concentration)
  attention_data JSONB DEFAULT '{
    "range": 80,
    "concentration": 80,
    "distractibility": false,
    "notes": ""
  }'::jsonb,
  
  -- 3. Sensopercepção (Sensory Perception)
  sensoperception_data JSONB DEFAULT '{
    "global_perception": "normal",
    "auditory": false,
    "visual": false,
    "tactile": false,
    "olfactory": false,
    "kinesthetic": false,
    "mixed": false,
    "description": ""
  }'::jsonb,
  
  -- 4. Memória (Memory)
  memory_data JSONB DEFAULT '{
    "fixation": 80,
    "recall": 80,
    "auditory": false,
    "hypermnesia": false,
    "paramnesia": false,
    "amnesia": false,
    "phobias": false,
    "notes": ""
  }'::jsonb,
  
  -- 5. Pensamento (Thought)
  thought_data JSONB DEFAULT '{
    "course": 0,
    "tangential": false,
    "incoherent": false,
    "dissociated": false,
    "circumstantial": false,
    "delusional": false,
    "obsessive": false,
    "overvalued": false,
    "description": ""
  }'::jsonb,
  
  -- 6. Linguagem (Language)
  language_data JSONB DEFAULT '{
    "speech_rate": 0,
    "articulation": "normal",
    "observations": ""
  }'::jsonb,
  
  -- 7. Afetividade / Humor (Mood / Affect)
  mood_data JSONB DEFAULT '{
    "polarity": 0,
    "lability": 50,
    "emotional_responsiveness": true,
    "adequacy": "adequate",
    "notes": ""
  }'::jsonb,
  
  -- 8. Vontade / Atividade Volitiva (Will / Volition)
  will_data JSONB DEFAULT '{
    "volitional_energy": 0,
    "ambivalence": false,
    "impulse_control": 0,
    "observations": ""
  }'::jsonb,
  
  -- 9. Psicomotricidade (Psychomotor)
  psychomotor_data JSONB DEFAULT '{
    "motor_activity": 0,
    "tone_gestures": "normal",
    "facial_expressiveness": 50,
    "notes": ""
  }'::jsonb,
  
  -- 10. Orientação / Juízo / Crítica (Orientation / Judgment / Insight)
  orientation_data JSONB DEFAULT '{
    "time": true,
    "space": true,
    "person": true,
    "situation": true,
    "reality_judgment": "intact",
    "insight": 80,
    "comments": ""
  }'::jsonb,
  
  -- 11. Inteligência (Intelligence)
  intelligence_data JSONB DEFAULT '{
    "abstract_reasoning": 80,
    "learning_capacity": 80,
    "adaptive_capacity": "normal",
    "facial_expressivity": 50,
    "notes": ""
  }'::jsonb,
  
  -- 12. Personalidade / Eu (Personality / Self)
  personality_data JSONB DEFAULT '{
    "self_coherence": 80,
    "affective_stability": 80,
    "self_boundaries": "normal",
    "anxious": false,
    "narcissistic": false,
    "avoidant": false,
    "obsessive": false,
    "borderline": false,
    "histrionic": false,
    "antisocial": false,
    "observations": ""
  }'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_evaluations ENABLE ROW LEVEL SECURITY;

-- Create policies for session_evaluations
CREATE POLICY "Users can view evaluations of their patients' sessions"
  ON public.session_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = session_evaluations.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert evaluations for their patients' sessions"
  ON public.session_evaluations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = session_evaluations.patient_id
      AND patients.user_id = auth.uid()
    )
    AND evaluated_by = auth.uid()
  );

CREATE POLICY "Users can update evaluations of their patients' sessions"
  ON public.session_evaluations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = session_evaluations.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete evaluations of their patients' sessions"
  ON public.session_evaluations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = session_evaluations.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Admins can view evaluations of subordinates' patients
CREATE POLICY "Admins can view evaluations of subordinates patients"
  ON public.session_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      JOIN profiles ON profiles.id = patients.user_id
      WHERE patients.id = session_evaluations.patient_id
      AND profiles.created_by = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_session_evaluations_updated_at
  BEFORE UPDATE ON public.session_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_session_evaluations_session_id ON public.session_evaluations(session_id);
CREATE INDEX idx_session_evaluations_patient_id ON public.session_evaluations(patient_id);
CREATE INDEX idx_session_evaluations_created_at ON public.session_evaluations(created_at DESC);