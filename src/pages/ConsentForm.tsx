import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

export default function ConsentForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [guardianDocument, setGuardianDocument] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [token]);

  const loadPatientData = async () => {
    try {
      // First, find the consent submission by token
      const { data: submission, error: submissionError } = await supabase
        .from("consent_submissions")
        .select("patient_id, accepted_at")
        .eq("token", token)
        .single();

      if (submissionError || !submission) {
        toast.error("Link inválido ou expirado");
        setLoading(false);
        return;
      }

      // Check if already submitted
      if (submission.accepted_at) {
        toast.error("Termos já foram aceitos anteriormente");
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Now get patient data
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", submission.patient_id)
        .single();

      if (patientError) throw patientError;

      setPatient(patientData);
    } catch (error: any) {
      console.error("Error loading patient:", error);
      toast.error("Link inválido ou expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Apenas arquivos JPG, PNG ou PDF são permitidos");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
        return;
      }

      setGuardianDocument(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentAccepted || !privacyAccepted) {
      toast.error("Você precisa aceitar todos os termos");
      return;
    }

    if (patient?.is_minor && !guardianDocument) {
      toast.error("É obrigatório anexar o documento do responsável");
      return;
    }

    setSubmitting(true);

    try {
      let guardianDocData = null;

      if (guardianDocument) {
        // Convert file to base64
        const reader = new FileReader();
        guardianDocData = await new Promise((resolve) => {
          reader.onload = () => resolve({
            name: guardianDocument.name,
            type: guardianDocument.type,
            data: reader.result
          });
          reader.readAsDataURL(guardianDocument);
        });
      }

      const { data, error } = await supabase.functions.invoke("submit-consent-form", {
        body: {
          token: token,
          accepted: true,
          ipAddress: window.location.hostname,
          userAgent: navigator.userAgent,
          guardianDocumentFile: guardianDocData
        }
      });

      if (error) throw error;

      toast.success("Termos aceitos com sucesso!");
      setSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting consent:", error);
      toast.error(error.message || "Erro ao enviar consentimento");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Termos Aceitos!</CardTitle>
            <CardDescription>
              Obrigado por aceitar nossos termos de consentimento e política de privacidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Os documentos foram anexados ao seu prontuário e você já pode prosseguir com seu atendimento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>
              Este link de consentimento não é válido ou já expirou.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background to-secondary">
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {patient.is_minor 
                ? "Termo de Consentimento - Menor de Idade" 
                : "Termo de Consentimento e Política de Privacidade"}
            </CardTitle>
            <CardDescription>
              {patient.is_minor
                ? `Responsável: ${patient.guardian_name || "Não informado"} | Paciente: ${patient.name}`
                : `Paciente: ${patient.name}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Termo de Consentimento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Termo de Consentimento para Atendimento Psicológico</h3>
                <div className="max-h-96 overflow-y-auto p-4 border rounded-lg bg-muted/50 text-sm space-y-3">
                  <p><strong>ESPAÇO MINDWARE</strong></p>
                  <p>CNPJ: 00.000.000/0000-00</p>
                  <p className="mt-4">
                    <strong>TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA ATENDIMENTO PSICOLÓGICO
                    {patient.is_minor ? " - MENOR DE IDADE" : ""}</strong>
                  </p>
                  
                  {patient.is_minor && (
                    <>
                      <p><strong>Dados do Paciente (Menor):</strong></p>
                      <p>Nome: {patient.name}</p>
                      <p>Data de Nascimento: {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : "Não informado"}</p>
                      
                      <p className="mt-3"><strong>Dados do Responsável Legal:</strong></p>
                      <p>Nome: {patient.guardian_name || "Não informado"}</p>
                      <p>CPF: {patient.guardian_cpf || "Não informado"}</p>
                    </>
                  )}

                  <p className="mt-4">
                    <strong>1. OBJETIVO DO ATENDIMENTO</strong>
                  </p>
                  <p>
                    O atendimento psicológico tem como objetivo promover o bem-estar emocional e psicológico 
                    {patient.is_minor ? " do menor acima identificado" : ""}, através de intervenções baseadas 
                    em técnicas cientificamente validadas.
                  </p>

                  <p className="mt-3">
                    <strong>2. SIGILO PROFISSIONAL</strong>
                  </p>
                  <p>
                    Todas as informações compartilhadas durante as sessões são confidenciais e protegidas 
                    pelo Código de Ética Profissional do Psicólogo, exceto em situações de risco iminente 
                    à vida ou integridade física.
                  </p>

                  <p className="mt-3">
                    <strong>3. REGISTRO E PRONTUÁRIO</strong>
                  </p>
                  <p>
                    Serão mantidos registros das sessões em prontuário psicológico, seguindo as normas do 
                    Conselho Federal de Psicologia e da LGPD (Lei Geral de Proteção de Dados).
                  </p>

                  {patient.is_minor && (
                    <>
                      <p className="mt-3">
                        <strong>4. AUTORIZAÇÃO DO RESPONSÁVEL</strong>
                      </p>
                      <p>
                        Como responsável legal, autorizo o atendimento psicológico do menor acima identificado, 
                        estando ciente de que posso solicitar informações sobre o processo terapêutico, respeitando 
                        o sigilo profissional.
                      </p>
                    </>
                  )}

                  <p className="mt-3">
                    <strong>{patient.is_minor ? "5" : "4"}. CANCELAMENTOS E FALTAS</strong>
                  </p>
                  <p>
                    Cancelamentos devem ser comunicados com antecedência mínima de 24 horas. 
                    Faltas não justificadas poderão ser cobradas normalmente.
                  </p>

                  <p className="mt-3">
                    <strong>{patient.is_minor ? "6" : "5"}. DIREITOS DO PACIENTE</strong>
                  </p>
                  <p>
                    {patient.is_minor ? "O responsável e o " : "O "}paciente tem direito a:
                  </p>
                  <ul className="list-disc pl-6">
                    <li>Receber informações sobre o processo terapêutico</li>
                    <li>Interromper o atendimento a qualquer momento</li>
                    <li>Solicitar encaminhamento para outro profissional</li>
                    <li>Acessar, retificar ou excluir seus dados pessoais</li>
                  </ul>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent"
                    checked={consentAccepted}
                    onCheckedChange={(checked) => setConsentAccepted(checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm font-normal cursor-pointer">
                    Li e aceito o Termo de Consentimento para Atendimento Psicológico
                  </Label>
                </div>
              </div>

              {/* Política de Privacidade */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Política de Privacidade e Proteção de Dados (LGPD)</h3>
                <div className="max-h-64 overflow-y-auto p-4 border rounded-lg bg-muted/50 text-sm space-y-3">
                  <p><strong>POLÍTICA DE PRIVACIDADE - ESPAÇO MINDWARE</strong></p>
                  
                  <p className="mt-3">
                    <strong>1. COLETA DE DADOS</strong>
                  </p>
                  <p>
                    Coletamos dados pessoais necessários para a prestação dos serviços de psicologia, 
                    incluindo: nome, CPF, data de nascimento, contato, histórico clínico e informações 
                    sobre as sessões.
                  </p>

                  <p className="mt-3">
                    <strong>2. USO DOS DADOS</strong>
                  </p>
                  <p>
                    Os dados são utilizados exclusivamente para:
                  </p>
                  <ul className="list-disc pl-6">
                    <li>Prestação dos serviços de atendimento psicológico</li>
                    <li>Emissão de notas fiscais e documentos</li>
                    <li>Comunicação sobre agendamentos e cancelamentos</li>
                    <li>Cumprimento de obrigações legais</li>
                  </ul>

                  <p className="mt-3">
                    <strong>3. COMPARTILHAMENTO</strong>
                  </p>
                  <p>
                    Seus dados não são compartilhados com terceiros, exceto quando exigido por lei 
                    ou com seu consentimento expresso.
                  </p>

                  <p className="mt-3">
                    <strong>4. SEGURANÇA</strong>
                  </p>
                  <p>
                    Utilizamos medidas técnicas e organizacionais para proteger seus dados contra 
                    acesso não autorizado, perda ou alteração.
                  </p>

                  <p className="mt-3">
                    <strong>5. DIREITOS DO TITULAR</strong>
                  </p>
                  <p>
                    Você tem direito a:
                  </p>
                  <ul className="list-disc pl-6">
                    <li>Confirmar a existência de tratamento</li>
                    <li>Acessar seus dados</li>
                    <li>Corrigir dados incompletos ou incorretos</li>
                    <li>Solicitar a exclusão de dados (respeitando prazos legais)</li>
                    <li>Revogar o consentimento</li>
                  </ul>

                  <p className="mt-3">
                    <strong>6. RETENÇÃO DE DADOS</strong>
                  </p>
                  <p>
                    Os dados são mantidos pelo prazo mínimo exigido pelo Conselho Federal de Psicologia 
                    (5 anos após o encerramento do atendimento) e pela legislação aplicável.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                  />
                  <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer">
                    Li e aceito a Política de Privacidade e Proteção de Dados
                  </Label>
                </div>
              </div>

              {/* Upload de Documento (apenas para menores) */}
              {patient.is_minor && (
                <div className="space-y-4">
                  <Label htmlFor="document" className="text-base font-semibold">
                    Documento do Responsável *
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Anexe uma cópia do seu RG ou CNH (formatos aceitos: JPG, PNG ou PDF - máx. 5MB)
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <Input
                      id="document"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    {guardianDocument && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Upload className="h-4 w-4" />
                        {guardianDocument.name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de Submissão */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting || !consentAccepted || !privacyAccepted || (patient?.is_minor && !guardianDocument)}
                  size="lg"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Aceitar e Enviar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center pt-4">
                Ao clicar em "Aceitar e Enviar", você confirma que leu e concorda com todos os termos acima.
                {patient.is_minor && " Como responsável legal, você autoriza o atendimento do menor."}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
