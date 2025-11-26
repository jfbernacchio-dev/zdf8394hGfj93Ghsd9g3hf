/**
 * ============================================================================
 * FASE C2.4 - Clinical Complaint Form (Template-aware + History + Validation)
 * ============================================================================
 * 
 * Formulário de Queixa Clínica agora:
 * - Template-aware: usa Template Service da C2.2
 * - Histórico completo de queixas do paciente
 * - Validação robusta com Zod
 * - Mantém regra de queixa ativa única
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, Search, Plus, X, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { getUserIdsInOrganization } from "@/lib/organizationFilters";
import { useActiveClinicalTemplates } from "@/hooks/useActiveClinicalTemplates";
import ClinicalComplaintHistory from "@/components/ClinicalComplaintHistory";
import { 
  ClinicalComplaintSchema, 
  formatValidationErrors 
} from "@/lib/clinical/complaintValidation";

interface CIDOption {
  code: string;
  title: string;
  group_code: string;
}

interface Symptom {
  id: string;
  label: string;
  is_present?: boolean;
  frequency?: string;
  intensity?: number;
}

interface Medication {
  id: string;
  class: string;
  substance: string;
  dosage: string;
  frequency: string;
  start_date: string;
  is_current: boolean;
  adverse_effects?: string;
}

export default function ClinicalComplaintForm() {
  const { patientId, complaintId } = useParams();
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<any>(null);

  // 🎯 FASE C2.4: Template-aware
  const {
    activeRoleTemplate,
    activeTemplates,
    isLoading: templatesLoading,
  } = useActiveClinicalTemplates();

  // CID Selection
  const [cidSearch, setCidSearch] = useState("");
  const [cidOptions, setCidOptions] = useState<CIDOption[]>([]);
  const [selectedCID, setSelectedCID] = useState<CIDOption | null>(null);
  const [hasNoDiagnosis, setHasNoDiagnosis] = useState(false);

  // Symptoms
  const [availableSymptoms, setAvailableSymptoms] = useState<Symptom[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);

  // Clinical characterization
  const [onsetType, setOnsetType] = useState("");
  const [onsetDurationWeeks, setOnsetDurationWeeks] = useState("");
  const [course, setCourse] = useState("");
  const [severity, setSeverity] = useState("");
  const [functionalImpairment, setFunctionalImpairment] = useState("");

  // Risk assessment
  const [suicidality, setSuicidality] = useState("nenhum");
  const [aggressiveness, setAggressiveness] = useState("nenhum");
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);

  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationClasses, setMedicationClasses] = useState<string[]>([]);
  const [availableMedications, setAvailableMedications] = useState<any[]>([]);

  // Notes
  const [clinicalNotes, setClinicalNotes] = useState("");

  useEffect(() => {
    loadPatient();
    loadMedicationCatalog();
    if (complaintId) {
      loadComplaint();
    }
  }, [patientId, complaintId]);

  useEffect(() => {
    if (cidSearch.length >= 2) {
      searchCID();
    } else {
      setCidOptions([]);
    }
  }, [cidSearch]);

  useEffect(() => {
    if (selectedCID && !hasNoDiagnosis) {
      loadSymptoms();
    } else if (hasNoDiagnosis) {
      loadGenericSymptoms();
    }
  }, [selectedCID, hasNoDiagnosis]);

  const loadPatient = async () => {
    if (!organizationId) return;
    
    const orgUserIds = await getUserIdsInOrganization(organizationId);
    
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();
    
    if (data && orgUserIds.includes(data.user_id)) {
      setPatient(data);
    } else if (data) {
      toast.error('Paciente não pertence à organização ativa');
      navigate('/patients');
    }
  };

  const searchCID = async () => {
    const { data } = await supabase
      .from("cid_catalog")
      .select("code, title, group_code")
      .or(`code.ilike.%${cidSearch}%,title.ilike.%${cidSearch}%`)
      .limit(10);
    if (data) setCidOptions(data);
  };

  const loadSymptoms = async () => {
    if (!selectedCID) return;

    // Try to load specific symptoms for this code, fallback to group
    let { data } = await supabase
      .from("cid_symptom_packs")
      .select("symptoms")
      .eq("code", selectedCID.code)
      .single();

    if (!data) {
      const result = await supabase
        .from("cid_symptom_packs")
        .select("symptoms")
        .eq("group_code", selectedCID.group_code)
        .single();
      data = result.data;
    }

    if (data && data.symptoms) {
      setAvailableSymptoms(data.symptoms as unknown as Symptom[]);
    }
  };

  const loadGenericSymptoms = async () => {
    const { data } = await supabase
      .from("cid_symptom_packs")
      .select("symptoms")
      .eq("group_code", "NONE")
      .single();

    if (data && data.symptoms) {
      setAvailableSymptoms(data.symptoms as unknown as Symptom[]);
    }
  };

  const loadMedicationCatalog = async () => {
    const { data } = await supabase
      .from("medication_catalog")
      .select("*")
      .order("class", { ascending: true });

    if (data) {
      setAvailableMedications(data);
      const uniqueClasses = [...new Set(data.map(m => m.class))];
      setMedicationClasses(uniqueClasses);
    }
  };

  const loadComplaint = async () => {
    // Load existing complaint for editing
    const { data: complaint } = await supabase
      .from("clinical_complaints")
      .select("*")
      .eq("id", complaintId)
      .single();

    if (!complaint) return;

    setHasNoDiagnosis(complaint.has_no_diagnosis || false);
    if (complaint.cid_code) {
      setSelectedCID({
        code: complaint.cid_code,
        title: complaint.cid_title || '',
        group_code: complaint.cid_group || '',
      });
      setCidSearch(complaint.cid_code);
    }

    setOnsetType(complaint.onset_type || "");
    setOnsetDurationWeeks(complaint.onset_duration_weeks?.toString() || "");
    setCourse(complaint.course || "");
    setSeverity(complaint.severity || "");
    setFunctionalImpairment(complaint.functional_impairment || "");
    setSuicidality(complaint.suicidality || "nenhum");
    setAggressiveness(complaint.aggressiveness || "nenhum");
    setVulnerabilities(complaint.vulnerabilities || []);
    setClinicalNotes(complaint.clinical_notes || "");

    // Load symptoms
    const { data: symptoms } = await supabase
      .from("complaint_symptoms")
      .select("*")
      .eq("complaint_id", complaintId);
    if (symptoms) {
      setSelectedSymptoms(symptoms.map(s => ({
        id: s.symptom_label,
        label: s.symptom_label,
        is_present: s.is_present ?? undefined,
        frequency: s.frequency || undefined,
        intensity: s.intensity || undefined,
      })));
    }

    // Load medications
    const { data: meds } = await supabase
      .from("complaint_medications")
      .select("*")
      .eq("complaint_id", complaintId);
    if (meds) setMedications(meds);
  };

  const toggleSymptom = (symptom: Symptom) => {
    const exists = selectedSymptoms.find(s => s.id === symptom.id);
    if (exists) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s.id !== symptom.id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, { ...symptom, is_present: true, intensity: 3 }]);
    }
  };

  const updateSymptomIntensity = (symptomId: string, intensity: number) => {
    setSelectedSymptoms(
      selectedSymptoms.map(s => 
        s.id === symptomId ? { ...s, intensity } : s
      )
    );
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: crypto.randomUUID(),
        class: "",
        substance: "",
        dosage: "",
        frequency: "",
        start_date: new Date().toISOString().split('T')[0],
        is_current: true,
      }
    ]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const updateMedication = (id: string, field: string, value: any) => {
    setMedications(
      medications.map(m => 
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSubmit = async () => {
    if (!user || !organizationId) {
      toast.error("Usuário não autenticado");
      return;
    }

    // 🔐 FASE C2.4: Validação robusta com Zod
    const complaintData = {
      patient_id: patientId!,
      created_by: user.id,
      organization_id: organizationId,
      cid_code: hasNoDiagnosis ? null : (selectedCID?.code || null),
      cid_title: hasNoDiagnosis ? null : (selectedCID?.title || null),
      cid_group: hasNoDiagnosis ? null : (selectedCID?.group_code || null),
      has_no_diagnosis: hasNoDiagnosis,
      onset_type: onsetType || null,
      onset_duration_weeks: onsetDurationWeeks ? parseInt(onsetDurationWeeks) : null,
      course: course || null,
      severity: severity || null,
      functional_impairment: functionalImpairment || null,
      suicidality: suicidality || null,
      aggressiveness: aggressiveness || null,
      vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : null,
      clinical_notes: clinicalNotes || null,
      is_active: true,
    };

    // Validar com Zod
    const validation = ClinicalComplaintSchema.safeParse(complaintData);
    
    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      toast.error(errors[0] || "Dados da queixa inválidos");
      console.error("Erros de validação:", errors);
      return;
    }

    setLoading(true);

    try {
      let savedComplaintId = complaintId;

      // 🐛 FASE C2.1 - CORREÇÃO BUG-01: Desativar queixas antigas ANTES de salvar
      if (!complaintId) {
        // Apenas ao CRIAR nova queixa (não ao editar)
        const { error: deactivateError } = await supabase
          .from("clinical_complaints")
          .update({ is_active: false })
          .eq("patient_id", patientId)
          .eq("is_active", true);

        if (deactivateError) {
          console.error("Erro ao desativar queixas antigas:", deactivateError);
          // Não bloquear salvamento, mas logar
        }
      }

      if (complaintId) {
        await supabase
          .from("clinical_complaints")
          .update(complaintData)
          .eq("id", complaintId);
      } else {
        const { data, error } = await supabase
          .from("clinical_complaints")
          .insert(complaintData)
          .select()
          .single();

        if (error) throw error;
        savedComplaintId = data.id;
      }

      // Delete old symptoms and insert new ones
      if (savedComplaintId) {
        await supabase
          .from("complaint_symptoms")
          .delete()
          .eq("complaint_id", savedComplaintId);

        if (selectedSymptoms.length > 0) {
          const symptomsData = selectedSymptoms.map(s => ({
            complaint_id: savedComplaintId,
            symptom_label: s.label,
            is_present: s.is_present ?? true,
            frequency: s.frequency || null,
            intensity: s.intensity || null,
          }));

          await supabase.from("complaint_symptoms").insert(symptomsData);
        }

        // Delete old medications and insert new ones
        await supabase
          .from("complaint_medications")
          .delete()
          .eq("complaint_id", savedComplaintId);

        if (medications.length > 0) {
          const medsData = medications.map(m => ({
            complaint_id: savedComplaintId,
            class: m.class,
            substance: m.substance || null,
            dosage: m.dosage || null,
            frequency: m.frequency || null,
            start_date: m.start_date || null,
            is_current: m.is_current ?? true,
            adverse_effects: m.adverse_effects || null,
          }));

          await supabase.from("complaint_medications").insert(medsData);
        }
      }

      toast.success("Queixa clínica salva com sucesso!");
      navigate(`/patients/${patientId}`);
    } catch (error: any) {
      console.error("Error saving complaint:", error);
      toast.error("Erro ao salvar queixa clínica: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FASE C2.4: Verificar se template suporta queixa
  if (templatesLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  if (!activeRoleTemplate?.supportsComplaint) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Template não suporta queixa clínica</AlertTitle>
          <AlertDescription>
            O template ativo do seu perfil profissional não suporta o registro de queixas clínicas.
            {activeRoleTemplate && (
              <p className="mt-2">Template ativo: <strong>{activeRoleTemplate.label}</strong></p>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Ficha de Queixa Clínica</h1>
          <p className="text-muted-foreground">
            {patient?.name} - {complaintId ? "Editar" : "Nova"} Queixa
            {activeRoleTemplate && (
              <Badge variant="outline" className="ml-2">{activeRoleTemplate.label}</Badge>
            )}
          </p>
        </div>
      </div>

      {/* 📋 FASE C2.4: Layout com Histórico na Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diagnóstico CID-10 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Diagnóstico Principal (CID-10)</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <Checkbox
                checked={hasNoDiagnosis}
                onCheckedChange={(checked) => {
                  setHasNoDiagnosis(checked as boolean);
                  if (checked) {
                    setSelectedCID(null);
                    setCidSearch("");
                  }
                }}
              />
              <Label className="cursor-pointer">
                Sem diagnóstico - Sessão de autoconhecimento/bem-estar
              </Label>
            </div>

            {!hasNoDiagnosis && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou descrição (ex: F32.1 ou depressão)"
                    value={cidSearch}
                    onChange={(e) => setCidSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {cidOptions.length > 0 && !selectedCID && (
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                    {cidOptions.map((option) => (
                      <div
                        key={option.code}
                        className="p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedCID(option);
                          setCidSearch(option.code);
                          setCidOptions([]);
                        }}
                      >
                        <div className="font-medium">{option.code}</div>
                        <div className="text-sm text-muted-foreground">{option.title}</div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCID && (
                  <Alert>
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <strong>{selectedCID.code}</strong> - {selectedCID.title}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCID(null);
                          setCidSearch("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </Card>

          {/* Sintomas */}
          {(selectedCID || hasNoDiagnosis) && availableSymptoms.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sintomas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSymptoms.map((symptom) => {
                  const selected = selectedSymptoms.find(s => s.id === symptom.id);
                  return (
                    <div key={symptom.id} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={!!selected}
                          onCheckedChange={() => toggleSymptom(symptom)}
                        />
                        <Label className="cursor-pointer flex-1">{symptom.label}</Label>
                      </div>
                      {selected && (
                        <div className="ml-6">
                          <Label className="text-xs">Intensidade: {selected.intensity || 3}</Label>
                          <Input
                            type="range"
                            min="1"
                            max="5"
                            value={selected.intensity || 3}
                            onChange={(e) => updateSymptomIntensity(symptom.id, parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Caracterização Clínica */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Caracterização Clínica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Início</Label>
                <Select value={onsetType} onValueChange={setOnsetType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agudo">Agudo</SelectItem>
                    <SelectItem value="insidioso">Insidioso</SelectItem>
                    <SelectItem value="subagudo">Subagudo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Duração (semanas)</Label>
                <Input
                  type="number"
                  value={onsetDurationWeeks}
                  onChange={(e) => setOnsetDurationWeeks(e.target.value)}
                  placeholder="Ex: 8"
                  min="0"
                />
              </div>

              <div>
                <Label>Curso</Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="episódico">Episódico</SelectItem>
                    <SelectItem value="contínuo">Contínuo</SelectItem>
                    <SelectItem value="recorrente">Recorrente</SelectItem>
                    <SelectItem value="progressivo">Progressivo</SelectItem>
                    <SelectItem value="em remissão">Em Remissão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Gravidade</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                    <SelectItem value="psicótico">Psicótico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Prejuízo Funcional</Label>
                <Select value={functionalImpairment} onValueChange={setFunctionalImpairment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    <SelectItem value="mínimo">Mínimo</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                    <SelectItem value="incapacitante">Incapacitante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Avaliação de Risco */}
          <Card className="p-6 border-destructive">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-semibold">Avaliação de Risco</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Suicidalidade</Label>
                <Select value={suicidality} onValueChange={setSuicidality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    <SelectItem value="ideação">Ideação</SelectItem>
                    <SelectItem value="plano">Plano</SelectItem>
                    <SelectItem value="tentativa">Tentativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Agressividade</Label>
                <Select value={aggressiveness} onValueChange={setAggressiveness}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    <SelectItem value="verbal">Verbal</SelectItem>
                    <SelectItem value="física">Física</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Medicações */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Medicações</h2>
              <Button onClick={addMedication} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Medicação
              </Button>
            </div>

            <div className="space-y-4">
              {medications.map((med) => (
                <div key={med.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Medicação</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(med.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Classe</Label>
                      <Select
                        value={med.class}
                        onValueChange={(value) => updateMedication(med.id, "class", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a classe..." />
                        </SelectTrigger>
                        <SelectContent>
                          {medicationClasses.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Substância</Label>
                      <Select
                        value={med.substance}
                        onValueChange={(value) => updateMedication(med.id, "substance", value)}
                        disabled={!med.class}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a substância..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMedications
                            .filter(m => m.class === med.class)
                            .map((m) => (
                              <SelectItem key={m.substance} value={m.substance}>
                                {m.substance}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Dosagem</Label>
                      <Input
                        value={med.dosage}
                        onChange={(e) => updateMedication(med.id, "dosage", e.target.value)}
                        placeholder="Ex: 50mg"
                      />
                    </div>

                    <div>
                      <Label>Frequência</Label>
                      <Input
                        value={med.frequency}
                        onChange={(e) => updateMedication(med.id, "frequency", e.target.value)}
                        placeholder="Ex: 1x ao dia"
                      />
                    </div>

                    <div>
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={med.start_date}
                        onChange={(e) => updateMedication(med.id, "start_date", e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                      <Checkbox
                        checked={med.is_current}
                        onCheckedChange={(checked) => updateMedication(med.id, "is_current", checked)}
                      />
                      <Label>Medicação atual</Label>
                    </div>
                  </div>
                </div>
              ))}

              {medications.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma medicação adicionada
                </p>
              )}
            </div>
          </Card>

          {/* Observações Clínicas */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Observações Clínicas</h2>
            <Textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Observações adicionais, contexto, evolução, etc..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Mínimo 20 caracteres se não houver CID ou "sem diagnóstico"
            </p>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Queixa Clínica"}
            </Button>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p>Fonte: Códigos e títulos CID-10 - DataSUS/OMS versão 2008</p>
          </div>
        </div>

        {/* 📋 FASE C2.4: Histórico de Queixas - 1/3 */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ClinicalComplaintHistory
              patientId={patientId!}
              currentComplaintId={complaintId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
