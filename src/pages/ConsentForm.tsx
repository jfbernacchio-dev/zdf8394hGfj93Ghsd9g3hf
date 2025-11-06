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
  
  const APP_VERSION = "v2.0.1"; // Force new cache
  console.log(`=== ConsentForm ${APP_VERSION} mounted ===`);
  console.log("Token from URL:", token);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [guardianDocument, setGuardianDocument] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const clearCacheAndReload = async () => {
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Force hard reload
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Fallback to simple reload
      window.location.reload();
    }
  };

  useEffect(() => {
    const initializeAndLoad = async () => {
      console.log("🚀 ConsentForm initializing - v2.0.1");
      
      // NUCLEAR OPTION: Unregister ALL service workers and force reload if needed
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length > 0) {
            console.log(`⚠️ Found ${registrations.length} service workers - unregistering ALL`);
            await Promise.all(registrations.map(reg => reg.unregister()));
            
            // Delete all caches
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
              console.log(`🗑️ Deleted ${cacheNames.length} caches`);
            }
            
            // Force hard reload to get fresh code
            console.log("🔄 Forcing hard reload to clear service worker...");
            window.location.reload();
            return; // Don't proceed, let reload happen
          } else {
            console.log("✅ No service workers found");
          }
        }
      } catch (error) {
        console.error('❌ Service worker cleanup error:', error);
      }
      
      // Load patient data
      console.log("📡 Loading patient data...");
      loadPatientData();
    };
    
    initializeAndLoad();
  }, [token]);

  const loadPatientData = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      console.log("🔍 Loading patient data for token:", token);
      
      // Add cache busting parameter + random to ensure uniqueness
      const cacheBuster = `${Date.now()}_${Math.random()}`;
      
      const url = `${supabaseUrl}/functions/v1/get-consent-data?token=${token}&_cb=${cacheBuster}`;
      console.log("📡 Fetching from:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store', // Force no caching at fetch level
      });

      console.log("📥 Response status:", response.status, "OK:", response.ok);
      
      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok || data.error) {
        console.error("❌ Error in response:", { ok: response.ok, error: data.error, data });
        if (data.alreadyAccepted) {
          setSubmitted(true);
        }
        toast.error(data.error || "Erro ao carregar dados");
        setLoading(false);
        return;
      }

      console.log("Patient data received from API:", data.patient);
      console.log("Birth date value:", data.patient?.birth_date, "Type:", typeof data.patient?.birth_date);
      console.log("CPF value:", data.patient?.cpf, "Type:", typeof data.patient?.cpf);
      
      // Parse and verify date formatting
      if (data.patient?.birth_date) {
        const [year, month, day] = data.patient.birth_date.split('-');
        console.log("Date parsing - Year:", year, "Month:", month, "Day:", day);
        console.log("Formatted date will be:", `${day}/${month}/${year}`);
      }
      
      setPatient(data.patient);
    } catch (error: any) {
      console.error("Catch error loading patient:", error);
      toast.error("Link inválido ou expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
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
        {/* Cache Clear Button - Shows if old data detected */}
        {patient && patient.birth_date && (() => {
          const [year, month, day] = patient.birth_date.split('-');
          const formattedDate = `${day}/${month}/${year}`;
          // If date is showing as 12/03/2010 instead of 13/03/2010, we have cache issue
          const hasOldCache = formattedDate === "12/03/2010";
          
          if (hasOldCache) {
            return (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Detectamos que você está vendo uma versão desatualizada desta página.
                </p>
                <Button 
                  onClick={clearCacheAndReload}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800"
                >
                  Atualizar Página
                </Button>
              </div>
            );
          }
          return null;
        })()}
        
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
                        <p><strong>Data de nascimento:</strong> {patient.birth_date ? (() => {
                          const [year, month, day] = patient.birth_date.split('-');
                          return `${day}/${month}/${year}`;
                        })() : "Não informado"}</p>
                        <p><strong>CPF do(a) menor:</strong> {patient.cpf || "Não informado"}</p>
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
