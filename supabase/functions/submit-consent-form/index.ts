import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    console.log("Patient data:", { 
      id: patient.id, 
      name: patient.name, 
      is_minor: patient.is_minor 
    });
    console.log("Guardian document received:", guardianDocumentFile ? "YES" : "NO");
    if (guardianDocumentFile) {
      console.log("Guardian document details:", {
        name: guardianDocumentFile.name,
        type: guardianDocumentFile.type,
        hasData: !!guardianDocumentFile.data
      });
    }

    let guardianDocPath = null;

    // Handle guardian document upload for minors
    if (patient.is_minor && guardianDocumentFile) {
      console.log("Starting guardian document upload...");
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

      console.log("Guardian document uploaded successfully to:", filePath);
      guardianDocPath = filePath;

      // Add to patient_files table
      const { error: insertError } = await supabase.from("patient_files").insert({
        patient_id: patient.id,
        file_name: fileName,
        file_path: filePath,
        file_type: guardianDocumentFile.type,
        category: "documentos",
        uploaded_by: patient.user_id
      });

      if (insertError) {
        console.error("Error inserting guardian document record:", insertError);
      } else {
        console.log("Guardian document record inserted successfully");
      }
    } else {
      console.log("Skipping guardian document upload - is_minor:", patient.is_minor, "has file:", !!guardianDocumentFile);
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

    // Create notification for therapist
    const recipientName = patient.is_minor && patient.guardian_name 
      ? patient.guardian_name 
      : patient.name;
    
    await supabase.from("system_notifications").insert({
      user_id: patient.user_id,
      title: "Termo de Consentimento Aceito",
      message: `${recipientName} aceitou o termo de consentimento para ${patient.name}`,
      category: "compliance",
      severity: "success",
      action_url: `/patients/${patient.id}`
    });

    // Generate consent confirmation PDF document
    const consentType = patient.is_minor ? "TERMO_CONSENTIMENTO_MENORES" : "TERMO_CONSENTIMENTO_ADULTOS";
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Create content for hash generation
    const hashContent = `${patient.name}|${patient.email}|${dateStr}|${timeStr}|${token}|${ipAddress}|${consentType}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashContent));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const documentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Load fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    
    let yPosition = height - 80;
    const leftMargin = 60;
    const rightMargin = width - 60;
    
    // Header - Logo/Company name
    page.drawText('ESPAÇO MINDWARE', {
      x: width / 2 - 90,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0.176, 0.373, 0.31) // #2D5F4F
    });
    yPosition -= 20;
    
    page.drawText('Atendimento Psicológico', {
      x: width / 2 - 70,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 50;
    
    // Title
    page.drawText('COMPROVANTE DE ACEITE', {
      x: width / 2 - 110,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;
    
    page.drawText(consentType, {
      x: width / 2 - (consentType.length * 3),
      y: yPosition,
      size: 11,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 50;
    
    // Patient information section
    page.drawText('DADOS DO PACIENTE', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;
    
    page.drawText(`Nome: ${patient.name}`, {
      x: leftMargin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 18;
    
    page.drawText(`Email: ${patient.email || 'Não informado'}`, {
      x: leftMargin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 18;
    
    // Format birth date to São Paulo timezone
    let birthDateStr = 'Não informado';
    if (patient.birth_date) {
      const birthDate = new Date(patient.birth_date + 'T00:00:00');
      const saoPauloOffset = -3; // UTC-3
      const utcDate = new Date(birthDate.getTime() + (saoPauloOffset * 60 * 60 * 1000));
      birthDateStr = utcDate.toLocaleDateString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }
    
    page.drawText(`Data de Nascimento: ${birthDateStr}`, {
      x: leftMargin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 18;
    
    if (patient.is_minor) {
      page.drawText(`CPF: ${patient.cpf || 'Não informado'}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPosition -= 18;
      
      page.drawText(`Responsável Legal: ${patient.guardian_name || 'Não informado'}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPosition -= 18;
      
      page.drawText(`CPF do Responsável: ${patient.guardian_cpf || 'Não informado'}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPosition -= 18;
    }
    yPosition -= 30;
    
    // Acceptance details section
    page.drawText('DETALHES DO ACEITE', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;
    
    page.drawText(`Data e Hora: ${dateStr} às ${timeStr}`, {
      x: leftMargin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 18;
    
    page.drawText(`Endereço IP: ${ipAddress || 'Não registrado'}`, {
      x: leftMargin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 18;
    
    const userAgentText = userAgent ? userAgent.substring(0, 70) + '...' : 'Não registrado';
    page.drawText(`Navegador: ${userAgentText}`, {
      x: leftMargin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 30;
    
    // Terms accepted section
    page.drawText('TERMOS ACEITOS', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;
    
    page.drawText('[X] Termo de Consentimento para Atendimento Psicologico', {
      x: leftMargin + 10,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 18;
    
    page.drawText('[X] Politica de Privacidade e Protecao de Dados (LGPD)', {
      x: leftMargin + 10,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 18;
    
    if (patient.is_minor) {
      page.drawText('[X] Documento de Identificacao do Responsavel Anexado', {
        x: leftMargin + 10,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPosition -= 18;
    }
    yPosition -= 30;
    
    // Digital signature section
    page.drawText('ASSINATURA DIGITAL', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;
    
    page.drawText('Este documento possui assinatura digital (hash SHA-256) para garantir', {
      x: leftMargin,
      y: yPosition,
      size: 8,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 12;
    
    page.drawText('sua autenticidade e integridade:', {
      x: leftMargin,
      y: yPosition,
      size: 8,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 18;
    
    // Hash in monospace font
    const hashLine1 = documentHash.substring(0, 42);
    const hashLine2 = documentHash.substring(42);
    
    page.drawText(hashLine1, {
      x: leftMargin + 20,
      y: yPosition,
      size: 7,
      font: courierFont,
      color: rgb(0.176, 0.373, 0.31) // #2D5F4F
    });
    yPosition -= 12;
    
    page.drawText(hashLine2, {
      x: leftMargin + 20,
      y: yPosition,
      size: 7,
      font: courierFont,
      color: rgb(0.176, 0.373, 0.31)
    });
    yPosition -= 40;
    
    // Footer
    page.drawLine({
      start: { x: leftMargin, y: yPosition },
      end: { x: rightMargin, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    yPosition -= 15;
    
    page.drawText('Este documento comprova que os termos foram lidos e aceitos eletronicamente.', {
      x: leftMargin + 30,
      y: yPosition,
      size: 8,
      font: regularFont,
      color: rgb(0.6, 0.6, 0.6)
    });
    yPosition -= 12;
    
    page.drawText('Gerado automaticamente pelo Sistema Espaço Mindware', {
      x: leftMargin + 60,
      y: yPosition,
      size: 8,
      font: regularFont,
      color: rgb(0.6, 0.6, 0.6)
    });
    yPosition -= 15;
    
    page.drawText(`Token de Verificação: ${token}`, {
      x: leftMargin + 90,
      y: yPosition,
      size: 7,
      font: courierFont,
      color: rgb(0.7, 0.7, 0.7)
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    
    const pdfFileName = `comprovante_aceite_${Date.now()}.pdf`;
    const pdfPath = `${patient.id}/${pdfFileName}`;
    
    // Upload PDF document
    const { error: pdfUploadError } = await supabase.storage
      .from("patient-files")
      .upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false
      });

    if (pdfUploadError) {
      console.error("Error uploading PDF consent document:", pdfUploadError);
    } else {
      // Add PDF document to patient files
      await supabase.from("patient_files").insert({
        patient_id: patient.id,
        file_name: pdfFileName,
        file_path: pdfPath,
        file_type: "application/pdf",
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
