-- FASE 9.1: Endurecer RLS de dados clínicos (isolamento entre organizações)
-- Objetivo: Garantir que usuários de uma organização não vejam dados clínicos de outras organizações

-- ============================================================================
-- HELPER FUNCTION: Verificar se usuário pertence à mesma organização
-- ============================================================================

-- Função para verificar se um user_id pertence à mesma organização que auth.uid()
CREATE OR REPLACE FUNCTION public.is_same_organization(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_org_id uuid;
  target_org_id uuid;
BEGIN
  -- Obter organização do usuário autenticado
  SELECT ol.organization_id INTO auth_org_id
  FROM user_positions up
  JOIN organization_positions op ON op.id = up.position_id
  JOIN organization_levels ol ON ol.id = op.level_id
  WHERE up.user_id = auth.uid()
  LIMIT 1;
  
  -- Obter organização do usuário alvo
  SELECT ol.organization_id INTO target_org_id
  FROM user_positions up
  JOIN organization_positions op ON op.id = up.position_id
  JOIN organization_levels ol ON ol.id = op.level_id
  WHERE up.user_id = target_user_id
  LIMIT 1;
  
  -- Se algum não pertence a organização, retorna false
  IF auth_org_id IS NULL OR target_org_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Retorna true se são da mesma organização
  RETURN auth_org_id = target_org_id;
END;
$$;

-- ============================================================================
-- TABELA: patients
-- ============================================================================

-- Remover policies antigas que não consideram isolamento organizacional
DROP POLICY IF EXISTS "Admins can view patients of their subordinates" ON patients;
DROP POLICY IF EXISTS "Users can view their own patients" ON patients;
DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;

-- Admin pode tudo
CREATE POLICY "Admin can manage all patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono sempre pode ver/editar seus próprios pacientes
CREATE POLICY "Owner can view own patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can delete own patients"
  ON patients
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários da mesma organização podem ver pacientes (controle fino no front)
CREATE POLICY "Same org users can view patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (is_same_organization(user_id));

-- ============================================================================
-- TABELA: sessions
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view sessions of their patients" ON sessions;
DROP POLICY IF EXISTS "Users can insert sessions for their patients" ON sessions;
DROP POLICY IF EXISTS "Users can update sessions of their patients" ON sessions;
DROP POLICY IF EXISTS "Users can delete sessions of their patients" ON sessions;
DROP POLICY IF EXISTS "Admins can view sessions of subordinates" ON sessions;
DROP POLICY IF EXISTS "Accountants can view sessions for financial purposes" ON sessions;

-- Admin pode tudo
CREATE POLICY "Admin can manage all sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Accountants podem ver sessões (para fins financeiros)
CREATE POLICY "Accountants can view all sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'accountant'));

-- Dono do paciente pode gerenciar sessões de seus pacientes
CREATE POLICY "Owner can view sessions of own patients"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = sessions.patient_id
        AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert sessions for own patients"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = sessions.patient_id
        AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update sessions of own patients"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = sessions.patient_id
        AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete sessions of own patients"
  ON sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = sessions.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver sessões (controle fino no front)
CREATE POLICY "Same org users can view sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = sessions.patient_id
        AND is_same_organization(patients.user_id)
    )
  );

-- ============================================================================
-- TABELA: clinical_complaints
-- ============================================================================

-- Remover policy antiga
DROP POLICY IF EXISTS "Users can manage medications of their complaints" ON clinical_complaints;

-- Admin pode tudo
CREATE POLICY "Admin can manage all clinical complaints"
  ON clinical_complaints
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar queixas
CREATE POLICY "Owner can manage clinical complaints"
  ON clinical_complaints
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = clinical_complaints.patient_id
        AND patients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = clinical_complaints.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver queixas (controle fino no front)
CREATE POLICY "Same org users can view clinical complaints"
  ON clinical_complaints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = clinical_complaints.patient_id
        AND is_same_organization(patients.user_id)
    )
  );

-- ============================================================================
-- TABELA: complaint_symptoms
-- ============================================================================

-- Admin pode tudo
CREATE POLICY "Admin can manage all complaint symptoms"
  ON complaint_symptoms
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar sintomas
CREATE POLICY "Owner can manage complaint symptoms"
  ON complaint_symptoms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_symptoms.complaint_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_symptoms.complaint_id
        AND p.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver sintomas
CREATE POLICY "Same org users can view complaint symptoms"
  ON complaint_symptoms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_symptoms.complaint_id
        AND is_same_organization(p.user_id)
    )
  );

-- ============================================================================
-- TABELA: complaint_specifiers
-- ============================================================================

-- Admin pode tudo
CREATE POLICY "Admin can manage all complaint specifiers"
  ON complaint_specifiers
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar especificadores
CREATE POLICY "Owner can manage complaint specifiers"
  ON complaint_specifiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_specifiers.complaint_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_specifiers.complaint_id
        AND p.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver especificadores
CREATE POLICY "Same org users can view complaint specifiers"
  ON complaint_specifiers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_specifiers.complaint_id
        AND is_same_organization(p.user_id)
    )
  );

-- ============================================================================
-- TABELA: complaint_medications
-- ============================================================================

-- Remover policy antiga
DROP POLICY IF EXISTS "Users can manage medications of their complaints" ON complaint_medications;

-- Admin pode tudo
CREATE POLICY "Admin can manage all complaint medications"
  ON complaint_medications
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar medicações
CREATE POLICY "Owner can manage complaint medications"
  ON complaint_medications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_medications.complaint_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_medications.complaint_id
        AND p.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver medicações
CREATE POLICY "Same org users can view complaint medications"
  ON complaint_medications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinical_complaints cc
      JOIN patients p ON p.id = cc.patient_id
      WHERE cc.id = complaint_medications.complaint_id
        AND is_same_organization(p.user_id)
    )
  );

-- ============================================================================
-- TABELA: session_evaluations
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view evaluations of their patients' sessions" ON session_evaluations;
DROP POLICY IF EXISTS "Users can insert evaluations for their patients' sessions" ON session_evaluations;
DROP POLICY IF EXISTS "Users can update evaluations of their patients' sessions" ON session_evaluations;
DROP POLICY IF EXISTS "Users can delete evaluations of their patients' sessions" ON session_evaluations;
DROP POLICY IF EXISTS "Admins can view evaluations of subordinates patients" ON session_evaluations;

-- Admin pode tudo
CREATE POLICY "Admin can manage all session evaluations"
  ON session_evaluations
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar avaliações
CREATE POLICY "Owner can manage session evaluations"
  ON session_evaluations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = session_evaluations.patient_id
        AND patients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = session_evaluations.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver avaliações
CREATE POLICY "Same org users can view session evaluations"
  ON session_evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = session_evaluations.patient_id
        AND is_same_organization(patients.user_id)
    )
  );

-- ============================================================================
-- TABELA: patient_files
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view files of their patients" ON patient_files;
DROP POLICY IF EXISTS "Users can insert files for their patients" ON patient_files;
DROP POLICY IF EXISTS "Users can delete files of their patients" ON patient_files;
DROP POLICY IF EXISTS "Admins can view files of subordinates patients" ON patient_files;

-- Admin pode tudo
CREATE POLICY "Admin can manage all patient files"
  ON patient_files
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar arquivos
CREATE POLICY "Owner can manage patient files"
  ON patient_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_files.patient_id
        AND patients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_files.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver arquivos
CREATE POLICY "Same org users can view patient files"
  ON patient_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_files.patient_id
        AND is_same_organization(patients.user_id)
    )
  );

-- ============================================================================
-- TABELA: consent_submissions
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view consent submissions for their patients" ON consent_submissions;
DROP POLICY IF EXISTS "Users can insert consent submissions for their patients" ON consent_submissions;
DROP POLICY IF EXISTS "Users can delete consent submissions for their patients" ON consent_submissions;

-- Admin pode tudo
CREATE POLICY "Admin can manage all consent submissions"
  ON consent_submissions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar consentimentos
CREATE POLICY "Owner can manage consent submissions"
  ON consent_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = consent_submissions.patient_id
        AND patients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = consent_submissions.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver consentimentos
CREATE POLICY "Same org users can view consent submissions"
  ON consent_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = consent_submissions.patient_id
        AND is_same_organization(patients.user_id)
    )
  );

-- ============================================================================
-- TABELA: patient_complaints (histórico de queixas)
-- ============================================================================

-- Admin pode tudo
CREATE POLICY "Admin can manage all patient complaints"
  ON patient_complaints
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono do paciente pode gerenciar histórico de queixas
CREATE POLICY "Owner can manage patient complaints"
  ON patient_complaints
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_complaints.patient_id
        AND patients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_complaints.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Usuários da mesma organização podem ver histórico de queixas
CREATE POLICY "Same org users can view patient complaints"
  ON patient_complaints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_complaints.patient_id
        AND is_same_organization(patients.user_id)
    )
  );