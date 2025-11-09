-- ============================================================
-- Sistema de Queixa Clínica CID-10 Cap V (F00-F99)
-- ============================================================

-- 1. Catálogo oficial CID-10 (Cap V - Saúde Mental)
CREATE TABLE IF NOT EXISTS public.cid_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  group_code TEXT,
  group_name TEXT,
  source TEXT DEFAULT 'datasus',
  version TEXT DEFAULT 'v2008',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_cid_catalog_code ON public.cid_catalog(code);
CREATE INDEX IF NOT EXISTS idx_cid_catalog_group ON public.cid_catalog(group_code);
CREATE INDEX IF NOT EXISTS idx_cid_catalog_search ON public.cid_catalog USING GIN(to_tsvector('portuguese', title || ' ' || code));

-- 2. Packs de sintomas curados por CID
CREATE TABLE IF NOT EXISTS public.cid_symptom_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  group_code TEXT,
  symptoms JSONB NOT NULL DEFAULT '[]',
  specifiers JSONB DEFAULT '[]',
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_code_or_group CHECK (code IS NOT NULL OR group_code IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_symptom_packs_code ON public.cid_symptom_packs(code);
CREATE INDEX IF NOT EXISTS idx_symptom_packs_group ON public.cid_symptom_packs(group_code);

-- 3. Catálogo de medicações psiquiátricas
CREATE TABLE IF NOT EXISTS public.medication_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  substance TEXT NOT NULL,
  indications JSONB NOT NULL DEFAULT '[]',
  cid_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_common BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_class ON public.medication_catalog(class);
CREATE INDEX IF NOT EXISTS idx_medication_search ON public.medication_catalog USING GIN(to_tsvector('portuguese', substance || ' ' || class));

-- 4. Queixas clínicas (registro principal)
CREATE TABLE IF NOT EXISTS public.clinical_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  
  -- Diagnóstico principal
  cid_code TEXT,
  cid_title TEXT,
  cid_group TEXT,
  has_no_diagnosis BOOLEAN DEFAULT FALSE,
  
  -- Caracterização
  onset_type TEXT,
  onset_duration_weeks INTEGER,
  course TEXT,
  severity TEXT,
  functional_impairment TEXT,
  
  -- Risco
  suicidality TEXT,
  aggressiveness TEXT,
  vulnerabilities TEXT[],
  
  -- Comorbidades
  comorbidities JSONB DEFAULT '[]',
  
  -- Observações gerais
  clinical_notes TEXT,
  
  -- Metadados
  reported_by TEXT DEFAULT 'clinician',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_patient ON public.clinical_complaints(patient_id);
CREATE INDEX IF NOT EXISTS idx_complaints_cid ON public.clinical_complaints(cid_code);
CREATE INDEX IF NOT EXISTS idx_complaints_active ON public.clinical_complaints(is_active) WHERE is_active = TRUE;

-- 5. Sintomas da queixa
CREATE TABLE IF NOT EXISTS public.complaint_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.clinical_complaints(id) ON DELETE CASCADE,
  symptom_label TEXT NOT NULL,
  is_present BOOLEAN DEFAULT TRUE,
  frequency TEXT,
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_symptoms_complaint ON public.complaint_symptoms(complaint_id);

-- 6. Medicações da queixa
CREATE TABLE IF NOT EXISTS public.complaint_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.clinical_complaints(id) ON DELETE CASCADE,
  class TEXT NOT NULL,
  substance TEXT,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT TRUE,
  adverse_effects TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_medications_complaint ON public.complaint_medications(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_medications_current ON public.complaint_medications(is_current) WHERE is_current = TRUE;

-- 7. Especificadores adicionais
CREATE TABLE IF NOT EXISTS public.complaint_specifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.clinical_complaints(id) ON DELETE CASCADE,
  specifier_type TEXT NOT NULL,
  specifier_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_specifiers_complaint ON public.complaint_specifiers(complaint_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- cid_catalog: Leitura pública para usuários autenticados
ALTER TABLE public.cid_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view CID catalog"
  ON public.cid_catalog FOR SELECT
  TO authenticated
  USING (TRUE);

-- cid_symptom_packs: Leitura pública
ALTER TABLE public.cid_symptom_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view symptom packs"
  ON public.cid_symptom_packs FOR SELECT
  TO authenticated
  USING (TRUE);

-- medication_catalog: Leitura pública
ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view medication catalog"
  ON public.medication_catalog FOR SELECT
  TO authenticated
  USING (TRUE);

-- clinical_complaints: Apenas profissionais do paciente
ALTER TABLE public.clinical_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view complaints of their patients"
  ON public.clinical_complaints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = clinical_complaints.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert complaints for their patients"
  ON public.clinical_complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = clinical_complaints.patient_id
      AND patients.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update complaints of their patients"
  ON public.clinical_complaints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = clinical_complaints.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete complaints of their patients"
  ON public.clinical_complaints FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = clinical_complaints.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Admins podem ver queixas de pacientes de seus subordinados
CREATE POLICY "Admins can view complaints of subordinates patients"
  ON public.clinical_complaints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      JOIN public.profiles ON profiles.id = patients.user_id
      WHERE patients.id = clinical_complaints.patient_id
      AND profiles.created_by = auth.uid()
    )
  );

-- complaint_symptoms: Cascade com complaints
ALTER TABLE public.complaint_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage symptoms of their complaints"
  ON public.complaint_symptoms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_complaints cc
      JOIN public.patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_symptoms.complaint_id
      AND p.user_id = auth.uid()
    )
  );

-- complaint_medications: Cascade com complaints
ALTER TABLE public.complaint_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage medications of their complaints"
  ON public.complaint_medications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_complaints cc
      JOIN public.patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_medications.complaint_id
      AND p.user_id = auth.uid()
    )
  );

-- complaint_specifiers: Cascade com complaints
ALTER TABLE public.complaint_specifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage specifiers of their complaints"
  ON public.complaint_specifiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_complaints cc
      JOIN public.patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_specifiers.complaint_id
      AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_complaint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_complaint_timestamp
  BEFORE UPDATE ON public.clinical_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_complaint_timestamp();

CREATE TRIGGER trigger_update_symptom_pack_timestamp
  BEFORE UPDATE ON public.cid_symptom_packs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_complaint_timestamp();