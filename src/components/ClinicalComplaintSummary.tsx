import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, FileText, AlertTriangle, Pill, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClinicalComplaintSummaryProps {
  patientId: string;
}

interface ComplaintData {
  id: string;
  cid_code: string | null;
  cid_title: string | null;
  has_no_diagnosis: boolean;
  severity: string | null;
  functional_impairment: string | null;
  suicidality: string | null;
  aggressiveness: string | null;
  clinical_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SymptomData {
  symptom_label: string;
  intensity: number | null;
}

interface MedicationData {
  class: string;
  substance: string | null;
  dosage: string | null;
  frequency: string | null;
  is_current: boolean;
}

export default function ClinicalComplaintSummary({ patientId }: ClinicalComplaintSummaryProps) {
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintData | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [medications, setMedications] = useState<MedicationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplaintData();
  }, [patientId]);

  const loadComplaintData = async () => {
    setLoading(true);

    // Load active complaint
    const { data: complaintData } = await supabase
      .from("clinical_complaints")
      .select("*")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (complaintData) {
      setComplaint(complaintData);

      // Load symptoms
      const { data: symptomsData } = await supabase
        .from("complaint_symptoms")
        .select("symptom_label, intensity")
        .eq("complaint_id", complaintData.id)
        .eq("is_present", true);

      if (symptomsData) setSymptoms(symptomsData);

      // Load current medications
      const { data: medsData } = await supabase
        .from("complaint_medications")
        .select("class, substance, dosage, frequency, is_current")
        .eq("complaint_id", complaintData.id)
        .eq("is_current", true);

      if (medsData) setMedications(medsData);
    }

    setLoading(false);
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "leve": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "moderado": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "grave": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "psicótico": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRiskColor = (risk: string | null) => {
    if (!risk || risk === "nenhum") return "bg-green-500/10 text-green-500";
    if (risk === "ideação" || risk === "verbal") return "bg-yellow-500/10 text-yellow-500";
    return "bg-red-500/10 text-red-500";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!complaint) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma queixa clínica registrada</p>
          <Button onClick={() => navigate(`/patients/${patientId}/complaint/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Queixa Clínica
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Diagnóstico Principal */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Diagnóstico</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/patients/${patientId}/complaint/${complaint.id}/edit`)}
          >
            Editar
          </Button>
        </div>

        {complaint.has_no_diagnosis ? (
          <div className="space-y-2">
            <Badge variant="outline" className="text-base">
              Sem diagnóstico específico
            </Badge>
            <p className="text-sm text-muted-foreground">
              Sessão de autoconhecimento/bem-estar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-primary">{complaint.cid_code}</div>
              <div className="text-sm text-muted-foreground mt-1">{complaint.cid_title}</div>
            </div>

            {complaint.severity && (
              <Badge className={getSeverityColor(complaint.severity)}>
                Gravidade: {complaint.severity}
              </Badge>
            )}

            {complaint.functional_impairment && (
              <div className="text-sm">
                <span className="text-muted-foreground">Prejuízo funcional:</span>{" "}
                <span className="font-medium">{complaint.functional_impairment}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Sintomas */}
      {symptoms.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Sintomas</h3>
          </div>
          <div className="space-y-2">
            {symptoms.slice(0, 6).map((symptom, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{symptom.symptom_label}</span>
                {symptom.intensity && (
                  <Badge variant="outline" className="ml-2">
                    {symptom.intensity}/5
                  </Badge>
                )}
              </div>
            ))}
            {symptoms.length > 6 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{symptoms.length - 6} outros sintomas
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Avaliação de Risco */}
      {(complaint.suicidality || complaint.aggressiveness) && (
        <Card className="p-6 border-destructive/50">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold">Avaliação de Risco</h3>
          </div>
          <div className="space-y-2">
            {complaint.suicidality && complaint.suicidality !== "nenhum" && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Suicidalidade:</span>
                <Badge className={getRiskColor(complaint.suicidality)}>
                  {complaint.suicidality}
                </Badge>
              </div>
            )}
            {complaint.aggressiveness && complaint.aggressiveness !== "nenhum" && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Agressividade:</span>
                <Badge className={getRiskColor(complaint.aggressiveness)}>
                  {complaint.aggressiveness}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Medicações */}
      {medications.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Medicações Atuais</h3>
          </div>
          <div className="space-y-3">
            {medications.map((med, index) => (
              <div key={index} className="space-y-1">
                <div className="font-medium text-sm">
                  {med.substance || med.class}
                </div>
                {(med.dosage || med.frequency) && (
                  <div className="text-xs text-muted-foreground">
                    {med.dosage} {med.frequency && `- ${med.frequency}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Observações */}
      {complaint.clinical_notes && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Observações Clínicas</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {complaint.clinical_notes}
          </p>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Última atualização: {new Date(complaint.updated_at).toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
}
