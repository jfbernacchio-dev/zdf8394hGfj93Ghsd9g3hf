import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [guardianDocument, setGuardianDocument] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const BUILD_VERSION = "2025-11-06-23:55:FINAL";
    console.log(`=== ConsentForm mounted - BUILD: ${BUILD_VERSION} ===`);
    console.log("Token from URL:", token);
    
    if (!token) {
      console.error("❌ No token in URL");
      toast.error("Link inválido - token não encontrado");
      setLoading(false);
      return;
    }
    
    loadPatientData();
  }, [token]);

  const loadPatientData = async () => {
    try {
      console.log("📞 [CONSENT] Starting loadPatientData");
      console.log("📞 [CONSENT] Token:", token);
      console.log("📞 [CONSENT] Supabase client exists:", !!supabase);
      
      console.log("📞 [CONSENT] Calling supabase.functions.invoke...");
      const result = await supabase.functions.invoke("get-consent-data", {
        body: { token }
      });
      
      console.log("📦 [CONSENT] Full result:", JSON.stringify(result, null, 2));
      const { data, error } = result;

      if (error) {
        console.error("❌ Error from invoke:", error);
        toast.error("Link inválido ou expirado");
        setLoading(false);
        return;
      }

      if (data?.error) {
        console.log("⚠️ Server error:", data.error);
        if (data.alreadyAccepted) {
          setSubmitted(true);
        }
        toast.error(data.error);
        setLoading(false);
        return;
      }

      if (data?.patient) {
        console.log("✅ Patient loaded:", data.patient.name);
        setPatient(data.patient);
      } else {
        console.error("❌ No patient in response");
        toast.error("Dados do paciente não encontrados");
      }
    } catch (error: any) {
      console.error("❌ Catch error:", error);
      toast.error("Erro ao carregar dados do consentimento");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "image/jpeg", 
        "image/png", 
        "image/jpg", 
        "image/webp",
        "image/heic",
        "image/heif",
        "image/gif",
        "application/pdf"
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Apenas arquivos de imagem (JPG, PNG, WEBP, HEIC, GIF) ou PDF são permitidos");
        return;
      }

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
                <h3 className="text-lg font-semibold">
                  {patient.is_minor 
                    ? "Termo de Consentimento - Responsável Legal por Menor"
                    : "Termo de Consentimento - Adultos"}
                </h3>
                <div className="max-h-96 overflow-y-auto p-4 border rounded-lg bg-muted/50 text-sm space-y-3">
                  <p><strong>Espaço Mindware Psicologia Ltda.</strong></p>
                  <p>CNPJ: 41.709.325/0001-25</p>
                  <p>Endereço: Rua Ribeiro de Barros, 310 – São Paulo/SP</p>
                  <p>E-mail: contato@espacomindware.com.br | Telefone: (11) 3871-2894 | WhatsApp: (11) 9.8880-2007</p>
                  <p>Encarregado(a) de Dados (DPO): João Felipe Monteiro Dias Bernacchio</p>
                  <p>Contato: privacidade@espacomindware.com.br | Tel.: (11) 9.8456-4364</p>
                  
                  <p className="mt-4">
                    <strong>
                      {patient.is_minor 
                        ? "TERMO DE CONSENTIMENTO – RESPONSÁVEL LEGAL POR MENOR"
                        : "TERMO DE CONSENTIMENTO – ADULTOS"}
                    </strong>
                  </p>

                  {patient.is_minor ? (
                    <>
                      <p className="mt-3">
                        Na qualidade de responsável legal, autorizo o tratamento dos dados pessoais e sensíveis 
                        do(a) menor abaixo identificado(a) por Espaço Mindware Psicologia Ltda., conforme a 
                        Política de Privacidade.
                      </p>
                      
                      <p className="mt-3">
                        O tratamento destina-se à prestação de serviços psicológicos, registros clínicos, 
                        obrigações legais e tutela da saúde e do melhor interesse do menor.
                      </p>
                      
                      <p className="mt-3">
                        Posso solicitar informações, retificação ou exclusão de dados a qualquer momento: 
                        privacidade@espacomindware.com.br.
                      </p>

                      <div className="mt-4 p-3 bg-background rounded border">
                        <p><strong>Nome do(a) menor:</strong> {patient.name}</p>
                        <p><strong>Data de nascimento:</strong> {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : "Não informado"}</p>
                        <p><strong>Nome do Responsável Legal:</strong> {patient.guardian_name || "Não informado"}</p>
                        <p><strong>CPF do Responsável:</strong> {patient.guardian_cpf || "Não informado"}</p>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground">
                        Versão 1.1 – Última atualização: 30/10/2025
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3">
                        Declaro ter sido informado(a) sobre as práticas de tratamento de dados pessoais 
                        realizadas por Espaço Mindware Psicologia Ltda., conforme a Política de Privacidade.
                      </p>
                      
                      <p className="mt-3">
                        Autorizo o tratamento de meus dados pessoais e sensíveis para: execução do atendimento 
                        psicológico; registro clínico; comunicação e faturamento (NFS-e); cumprimento de obrigações 
                        legais e éticas; tutela da saúde e segurança.
                      </p>
                      
                      <p className="mt-3">
                        Posso revogar o consentimento a qualquer momento pelo e-mail privacidade@espacomindware.com.br. 
                        Mesmo após revogação, poderão ser mantidos dados necessários ao cumprimento de obrigações 
                        legais/éticas, tutela da saúde ou exercício regular de direitos.
                      </p>
                      
                      <p className="mt-3">
                        Os dados são armazenados com segurança e acessados apenas por profissionais autorizados.
                      </p>

                      <p className="mt-3 text-xs text-muted-foreground">
                        Versão 1.1 – Última atualização: 30/10/2025
                      </p>
                    </>
                  )}
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
                <div className="max-h-96 overflow-y-auto p-4 border rounded-lg bg-muted/50 text-sm space-y-3">
                  <p><strong>POLÍTICA DE PRIVACIDADE – ESPAÇO MINDWARE PSICOLOGIA LTDA.</strong></p>
                  
                  <p className="mt-3">
                    <strong>Espaço Mindware Psicologia Ltda.</strong>
                  </p>
                  <p>CNPJ: 41.709.325/0001-25</p>
                  <p>Endereço: Rua Ribeiro de Barros, 310 – São Paulo/SP</p>
                  <p>E-mail: contato@espacomindware.com.br | Telefone: (11) 3871-2894 | WhatsApp: (11) 9.8880-2007</p>
                  <p>Encarregado(a) de Dados (DPO): João Felipe Monteiro Dias Bernacchio</p>
                  <p>Contato: privacidade@espacomindware.com.br | Tel.: (11) 9.8456-4364</p>
                  
                  <p className="mt-4">
                    <strong>1. Finalidade e Âmbito</strong>
                  </p>
                  <p>
                    Esta Política informa como tratamos dados pessoais e sensíveis de pacientes e usuários, 
                    conforme a LGPD e resoluções aplicáveis do CFP.
                  </p>

                  <p className="mt-3">
                    <strong>2. Controlador e Canais</strong>
                  </p>
                  <p>
                    O controlador é Espaço Mindware Psicologia Ltda. (CNPJ 41.709.325/0001-25). 
                    Canal oficial: privacidade@espacomindware.com.br.
                  </p>

                  <p className="mt-3">
                    <strong>3. Bases Legais e Finalidades</strong>
                  </p>
                  <ul className="list-disc pl-6">
                    <li>Execução dos serviços psicológicos (art. 7º, V)</li>
                    <li>Cumprimento de obrigações legais e éticas (art. 7º, II; CFP)</li>
                    <li>Tutela da saúde e proteção da vida (art. 11, II, f; art. 7º, VII)</li>
                    <li>Exercício regular de direitos (art. 7º, VI)</li>
                    <li>Consentimento do titular quando aplicável (art. 7º, I; art. 11, I)</li>
                  </ul>

                  <p className="mt-3">
                    <strong>4. Dados Coletados</strong>
                  </p>
                  <p>
                    Identificação, informações clínicas, histórico terapêutico, registros de sessões e dados 
                    financeiros para emissão de NFS-e.
                  </p>

                  <p className="mt-3">
                    <strong>5. Operadores e Suboperadores</strong>
                  </p>
                  <p>
                    Utilizamos operadores para viabilizar a operação do serviço:
                  </p>
                  <ul className="list-disc pl-6">
                    <li>Lovable Cloud / Supabase – hospedagem da aplicação e banco de dados (possível processamento internacional);</li>
                    <li>FocusNFe – emissão de Notas Fiscais de Serviço eletrônicas (NFS-e);</li>
                    <li>Resend – envio de e-mails transacionais.</li>
                  </ul>
                  <p className="mt-2">
                    Todos atuam sob contratos/termos compatíveis com a LGPD, com cláusulas de proteção de dados 
                    (DPAs/termos equivalentes) e controles de segurança.
                  </p>

                  <p className="mt-3">
                    <strong>6. Registro de Operações (ROPA) e RIPD</strong>
                  </p>
                  <p>
                    Mantemos ROPA (art. 37 da LGPD) e Relatório de Impacto (RIPD) para fluxos de alto risco 
                    (dados sensíveis/menores).
                  </p>

                  <p className="mt-3">
                    <strong>7. Armazenamento, Segurança e Transferência Internacional</strong>
                  </p>
                  <p>
                    Autenticação multifator, criptografia e controle de acesso. Hospedagem em Lovable/Supabase. 
                    O uso de Lovable/Supabase e Resend pode implicar transferência internacional (EUA/Europa). 
                    Aplicamos salvaguardas contratuais adequadas (art. 33, VIII), criptografia e certificações 
                    de segurança (ISO 27001/SOC 2).
                  </p>

                  <p className="mt-3">
                    <strong>8. Retenção e Descarte</strong>
                  </p>
                  <p>
                    Prontuários e dados clínicos: mínimo de 5 anos após término do atendimento (Resolução CFP 
                    nº 001/2009). Após o prazo, eliminação segura ou anonimização, com registro de descarte.
                  </p>

                  <p className="mt-3">
                    <strong>9. Telepsicologia (TDICs)</strong>
                  </p>
                  <p>
                    Atendimentos online conforme a Resolução CFP nº 09/2024.
                  </p>

                  <p className="mt-3">
                    <strong>10. Direitos do Titular</strong>
                  </p>
                  <p>
                    Solicitações para confirmação, acesso, correção, anonimização, portabilidade e eliminação: 
                    privacidade@espacomindware.com.br.
                  </p>

                  <p className="mt-3">
                    <strong>11. Cookies e Rastreamento</strong>
                  </p>
                  <p>
                    Não utilizamos cookies de rastreamento ou anúncios no site institucional.
                  </p>

                  <p className="mt-3">
                    <strong>12. Treinamento e Confidencialidade</strong>
                  </p>
                  <p>
                    Profissionais vinculados assinam Termo de Confidencialidade e participam de treinamento periódico.
                  </p>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Versão 1.1 – Última atualização: 30/10/2025
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
                    Anexe uma cópia do seu RG ou CNH (formatos aceitos: JPG, PNG, WEBP, HEIC, GIF ou PDF - máx. 5MB)
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <Input
                      id="document"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp,image/heic,image/heif,image/gif,application/pdf"
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
