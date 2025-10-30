import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubmitConsentRequest {
  token: string;
  accepted: boolean;
  ipAddress?: string;
  userAgent?: string;
  guardianDocumentFile?: {
    name: string;
    type: string;
    data: string; // base64
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      token, 
      accepted, 
      ipAddress, 
      userAgent,
      guardianDocumentFile 
    }: SubmitConsentRequest = await req.json();

    if (!token) {
      throw new Error("Token inválido");
    }

    if (!accepted) {
      throw new Error("É necessário aceitar os termos");
    }

    // Find consent submission by token
    const { data: submission, error: submissionError } = await supabase
      .from("consent_submissions")
      .select("patient_id, accepted_at")
      .eq("token", token)
      .single();

    if (submissionError || !submission) {
      throw new Error("Token inválido ou expirado");
    }

    if (submission.accepted_at) {
      throw new Error("Termos já foram aceitos anteriormente");
    }

    const patientId = submission.patient_id;

    // Get patient
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      throw new Error("Paciente não encontrado");
    }

    let guardianDocPath = null;

    // Handle guardian document upload for minors
    if (patient.is_minor && guardianDocumentFile) {
      const fileExt = guardianDocumentFile.name.split('.').pop();
      const fileName = `documento_responsavel_${Date.now()}.${fileExt}`;
      const filePath = `${patient.id}/${fileName}`;

      // Convert base64 to blob
      const base64Data = guardianDocumentFile.data.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("patient-files")
        .upload(filePath, binaryData, {
          contentType: guardianDocumentFile.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Error uploading guardian document:", uploadError);
        throw new Error("Erro ao fazer upload do documento do responsável");
      }

      guardianDocPath = filePath;

      // Add to patient_files table
      await supabase.from("patient_files").insert({
        patient_id: patient.id,
        file_name: fileName,
        file_path: filePath,
        file_type: guardianDocumentFile.type,
        category: "documentos",
        uploaded_by: patient.user_id
      });
    }

    // Update consent submission
    const { error: updateSubmissionError } = await supabase
      .from("consent_submissions")
      .update({
        accepted_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        guardian_document_path: guardianDocPath
      })
      .eq("token", token);

    if (updateSubmissionError) {
      console.error("Error updating submission:", updateSubmissionError);
    }

    // Update patient record
    const updateData: any = {
      lgpd_consent_date: new Date().toISOString(),
      privacy_policy_accepted: true,
      privacy_policy_accepted_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", patientId);

    if (updateError) {
      throw new Error("Erro ao atualizar dados do paciente");
    }

    // Generate consent confirmation document
    const consentType = patient.is_minor ? "TERMO_CONSENTIMENTO_MENORES" : "TERMO_CONSENTIMENTO_ADULTOS";
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    // Create consent document content
    const consentContent = `
COMPROVANTE DE ACEITE - ${consentType}
===========================================

Paciente: ${patient.name}
${patient.is_minor ? `Responsável: ${patient.guardian_name || 'Não informado'}
CPF Responsável: ${patient.guardian_cpf || 'Não informado'}` : ''}

Data de Aceite: ${dateStr} às ${timeStr}
IP: ${ipAddress || 'Não registrado'}
User Agent: ${userAgent || 'Não registrado'}

TERMOS ACEITOS:
- Termo de Consentimento para Atendimento Psicológico
- Política de Privacidade e Proteção de Dados (LGPD)

${patient.is_minor ? 'Documento do Responsável: Anexado' : ''}

Este documento comprova que os termos foram lidos e aceitos eletronicamente.

---
Gerado automaticamente pelo Sistema Espaço Mindware
`;

    const txtFileName = `comprovante_aceite_${Date.now()}.txt`;
    const txtPath = `${patient.id}/${txtFileName}`;
    
    // Upload consent document
    const { error: consentUploadError } = await supabase.storage
      .from("patient-files")
      .upload(txtPath, new TextEncoder().encode(consentContent), {
        contentType: "application/octet-stream",
        upsert: false
      });

    if (consentUploadError) {
      console.error("Error uploading consent document:", consentUploadError);
    } else {
      // Add consent document to patient files
      await supabase.from("patient_files").insert({
        patient_id: patient.id,
        file_name: txtFileName,
        file_path: txtPath,
        file_type: "application/octet-stream",
        category: "consentimentos",
        uploaded_by: patient.user_id
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Termos aceitos com sucesso" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-consent-form:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao processar consentimento" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
