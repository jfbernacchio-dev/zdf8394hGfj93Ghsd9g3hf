import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize phone number to always have country code (5511XXXXXXXXX)
function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 55, it's already normalized
  if (digits.startsWith('55')) {
    return digits;
  }
  
  // If starts with 11, add country code
  if (digits.startsWith('11')) {
    return '55' + digits;
  }
  
  // Otherwise assume it's missing both country and area code
  return '5511' + digits;
}

interface SendNFSeEmailRequest {
  nfseId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-nfse-email function v2");
    
    // Use service role key for internal calls
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { nfseId }: SendNFSeEmailRequest = await req.json();

    if (!nfseId) {
      throw new Error("NFSe ID is required");
    }

    console.log("Fetching NFSe data for:", nfseId);

    // Fetch NFSe data with patient information
    const { data: nfseData, error: nfseError } = await supabase
      .from("nfse_issued")
      .select(`
        *,
        patient:patients (
          name,
          email,
          cpf,
          phone,
          is_minor,
          guardian_name,
          guardian_phone_1,
          guardian_email,
          use_alternate_nfse_contact,
          nfse_alternate_email,
          nfse_alternate_phone
        )
      `)
      .eq("id", nfseId)
      .single();

    if (nfseError || !nfseData) {
      console.error("Error fetching NFSe:", nfseError);
      throw new Error("NFSe not found");
    }

    // Fetch therapist information separately
    const { data: therapistData } = await supabase
      .from("profiles")
      .select("full_name, phone, send_nfse_to_therapist")
      .eq("id", nfseData.user_id)
      .single();

    // Add therapist data to nfseData
    const nfseDataWithTherapist = {
      ...nfseData,
      therapist: therapistData
    };


    // Check if NFSe is issued and has a PDF URL
    if (nfseDataWithTherapist.status !== "issued" && nfseDataWithTherapist.status !== "processing") {
      throw new Error("NFSe is not in a valid state for email sending");
    }

    if (!nfseDataWithTherapist.pdf_url) {
      throw new Error("NFSe PDF URL not available");
    }

    // Determine which email to use: cascade logic
    // 1. Alternate contact (if marked)
    // 2. Guardian email (if minor AND available)
    // 3. Patient email
    let recipientEmail: string | undefined;
    if (nfseDataWithTherapist.patient?.use_alternate_nfse_contact && nfseDataWithTherapist.patient?.nfse_alternate_email) {
      recipientEmail = nfseDataWithTherapist.patient.nfse_alternate_email;
    } else if (nfseDataWithTherapist.patient?.is_minor && nfseDataWithTherapist.patient?.guardian_email) {
      recipientEmail = nfseDataWithTherapist.patient.guardian_email;
    } else {
      recipientEmail = nfseDataWithTherapist.patient?.email;
    }

    if (!recipientEmail) {
      throw new Error("Patient email not found");
    }

    console.log("Downloading PDF from:", nfseDataWithTherapist.pdf_url);

    // Download PDF from FocusNFe
    let pdfBuffer: ArrayBuffer;
    try {
      const pdfResponse = await fetch(nfseDataWithTherapist.pdf_url);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
      }
      pdfBuffer = await pdfResponse.arrayBuffer();
    } catch (downloadError) {
      console.error("Error downloading PDF:", downloadError);
      throw new Error("Failed to download PDF from FocusNFe");
    }

    // Convert ArrayBuffer to base64
    const pdfBase64 = btoa(
      new Uint8Array(pdfBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const patientName = nfseDataWithTherapist.patient.name;
    const guardianName = nfseDataWithTherapist.patient.guardian_name;
    const therapistName = nfseDataWithTherapist.therapist?.full_name;
    const nfseNumber = nfseDataWithTherapist.nfse_number || "Pendente";
    const issueDate = new Date(nfseDataWithTherapist.issue_date).toLocaleDateString("pt-BR");
    const issueMonth = new Date(nfseDataWithTherapist.issue_date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const serviceValue = Number(nfseDataWithTherapist.service_value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    console.log("Sending email to:", recipientEmail);

    // ⭐ Determinar nome correto do destinatário baseado no campo usado
    console.log("🔍 [RECIPIENT NAME DEBUG] Dados do paciente:", {
      patientName,
      guardianName,
      is_minor: nfseDataWithTherapist.patient?.is_minor,
      use_alternate_nfse_contact: nfseDataWithTherapist.patient?.use_alternate_nfse_contact,
      nfse_alternate_phone: nfseDataWithTherapist.patient?.nfse_alternate_phone,
      guardian_phone_1: nfseDataWithTherapist.patient?.guardian_phone_1,
    });
    
    let recipientDisplayName: string;
    if (nfseDataWithTherapist.patient?.use_alternate_nfse_contact && nfseDataWithTherapist.patient?.nfse_alternate_phone) {
      recipientDisplayName = `${patientName} (Contato Alternativo)`;
      console.log("📱 [RECIPIENT] Usando contato alternativo:", recipientDisplayName);
    } else if (nfseDataWithTherapist.patient?.is_minor && guardianName && nfseDataWithTherapist.patient?.guardian_phone_1) {
      recipientDisplayName = `${guardianName} (Responsável por ${patientName})`;
      console.log("👨‍👩‍👧 [RECIPIENT] Usando responsável:", recipientDisplayName);
    } else {
      recipientDisplayName = patientName;
      console.log("👤 [RECIPIENT] Usando paciente:", recipientDisplayName);
    }

    console.log("✅ [RECIPIENT FINAL] Nome final do destinatário:", recipientDisplayName);

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Espaço Mindware <no-reply@espacomindware.com.br>",
      to: [recipientEmail],
      subject: `Nota Fiscal Espaço Mindware - ${issueMonth}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B9D83; margin-bottom: 20px;">Espaço Mindware Psicologia</h2>
          
          <p>Olá, <strong>${recipientDisplayName}</strong>!</p>
          
          <p>Segue em anexo a Nota Fiscal de Serviço Eletrônica referente aos atendimentos realizados.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B9D83; margin: 25px 0;">
            <p style="margin: 5px 0;"><strong>Número da NF-e:</strong> ${nfseNumber}</p>
            <p style="margin: 5px 0;"><strong>Data de Emissão:</strong> ${issueDate}</p>
            <p style="margin: 5px 0;"><strong>Valor Total:</strong> ${serviceValue}</p>
            ${nfseDataWithTherapist.verification_code ? `<p style="margin: 5px 0;"><strong>Código de Verificação:</strong> ${nfseDataWithTherapist.verification_code}</p>` : ""}
          </div>
          
          <p>O documento PDF está anexado a este email para sua conveniência.</p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 13px;">
            <strong>Espaço Mindware Psicologia</strong><br>
            Em caso de dúvidas, entre em contato conosco.<br>
            <em>Este é um email automático, não é necessário respondê-lo.</em>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `NFSe_${nfseNumber}_${patientName.replace(/\s+/g, "_")}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    // Send WhatsApp message if phone is available
    let whatsappSent = false;
    // Determine which phone to use: cascade logic
    // 1. Alternate contact (if marked)
    // 2. Guardian phone (if minor AND available)
    // 3. Patient phone
    let recipientPhone: string | undefined;
    let phoneFieldUsed: 'phone' | 'guardian_phone_1' | 'nfse_alternate_phone' | undefined;
    
    console.log("📞 [PHONE SELECTION DEBUG] Iniciando seleção de telefone:", {
      use_alternate_nfse_contact: nfseDataWithTherapist.patient?.use_alternate_nfse_contact,
      nfse_alternate_phone: nfseDataWithTherapist.patient?.nfse_alternate_phone,
      is_minor: nfseDataWithTherapist.patient?.is_minor,
      guardian_phone_1: nfseDataWithTherapist.patient?.guardian_phone_1,
      phone: nfseDataWithTherapist.patient?.phone,
    });
    
    if (nfseDataWithTherapist.patient?.use_alternate_nfse_contact && nfseDataWithTherapist.patient?.nfse_alternate_phone) {
      recipientPhone = nfseDataWithTherapist.patient.nfse_alternate_phone;
      phoneFieldUsed = 'nfse_alternate_phone';
      console.log("📱 [PHONE] Usando telefone alternativo");
    } else if (nfseDataWithTherapist.patient?.is_minor && nfseDataWithTherapist.patient?.guardian_phone_1) {
      recipientPhone = nfseDataWithTherapist.patient.guardian_phone_1;
      phoneFieldUsed = 'guardian_phone_1';
      console.log("👨‍👩‍👧 [PHONE] Usando telefone do responsável");
    } else {
      recipientPhone = nfseDataWithTherapist.patient?.phone;
      phoneFieldUsed = 'phone';
      console.log("👤 [PHONE] Usando telefone do paciente");
    }
    
    const normalizedPhone = recipientPhone ? normalizePhone(recipientPhone) : null;

    console.log("✅ [PHONE FINAL] Dados finais do telefone:", {
      phone: nfseDataWithTherapist.patient?.phone,
      alternate: nfseDataWithTherapist.patient?.nfse_alternate_phone,
      guardian: nfseDataWithTherapist.patient?.guardian_phone_1,
      useAlternate: nfseDataWithTherapist.patient?.use_alternate_nfse_contact,
      recipientPhone,
      phoneFieldUsed,
      normalizedPhone,
      recipientDisplayName
    });

    if (normalizedPhone && nfseDataWithTherapist.pdf_url) {
      try {
        console.log("Sending WhatsApp message to:", normalizedPhone);
        
        // Get the file from storage to use the correct filename
        const { data: uploadedFiles } = await supabase
          .from("patient_files")
          .select("file_name, file_path")
          .eq("patient_id", nfseDataWithTherapist.patient_id)
          .eq("category", "NFSe")
          .order("uploaded_at", { ascending: false })
          .limit(1);

        const correctFilename = uploadedFiles && uploadedFiles.length > 0 
          ? uploadedFiles[0].file_name 
          : `NFSe_${nfseNumber}_${patientName.replace(/\s+/g, "_")}.pdf`;

        console.log("Using filename for WhatsApp:", correctFilename);
        
        // Try to use template first, fallback to direct document if template fails
        let whatsappResult;
        
        try {
          // Use approved template: nfse_envio_v2 (created in English due to Meta's 4-week lock bug)
          const whatsappResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                type: "template",
                data: {
                  to: normalizedPhone,
                  templateName: "nfse_envio_v2",
                  templateLanguage: "en", // Using English to avoid Meta's 4-week lock bug
                  parameters: [
                    recipientDisplayName, // ⭐ Nome correto do destinatário
                    nfseNumber,
                    issueDate,
                    serviceValue,
                  ],
                  documentUrl: nfseDataWithTherapist.pdf_url,
                  filename: correctFilename, // Add filename to template
                },
                metadata: {
                  patientId: nfseDataWithTherapist.patient_id,
                  userId: nfseDataWithTherapist.user_id,
                  phoneFieldUsed: phoneFieldUsed,
                  nfseNumber: nfseNumber,
                  recipientName: recipientDisplayName,
                  guardianName: guardianName
                }
              }),
            }
          );
          
          console.log("📤 [WHATSAPP METADATA] Metadata enviado para send-whatsapp:", {
            patientId: nfseDataWithTherapist.patient_id,
            phoneFieldUsed,
            recipientName: recipientDisplayName,
            guardianName
          });
          
          whatsappResult = await whatsappResponse.json();
          
          // If template fails, fallback to direct document
          if (!whatsappResponse.ok || !whatsappResult.success) {
            console.log("Template failed, falling back to direct document:", whatsappResult);
            throw new Error("Template not available");
          }
        } catch (templateError) {
          console.log("Using fallback direct document method");
          
          const fallbackResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                type: "document",
                data: {
                  to: normalizedPhone,
                  documentUrl: nfseDataWithTherapist.pdf_url,
                  filename: correctFilename, // Use the correct filename
                  caption: `📄 *Nota Fiscal Espaço Mindware*\n\n` +
                    `*Destinatário:* ${recipientDisplayName}\n` +
                    `*Número:* ${nfseNumber}\n` +
                    `*Data:* ${issueDate}\n` +
                    `*Valor:* ${serviceValue}\n\n` +
                    `Olá, ${recipientDisplayName.split(' ')[0]}! Sua nota fiscal de ${issueMonth} está anexada.`,
                },
                metadata: {
                  patientId: nfseDataWithTherapist.patient_id,
                  userId: nfseDataWithTherapist.user_id,
                  phoneFieldUsed: phoneFieldUsed,
                  nfseNumber: nfseNumber,
                  recipientName: recipientDisplayName,
                  guardianName: guardianName
                }
              }),
            }
          );
          
          console.log("📤 [WHATSAPP FALLBACK METADATA] Metadata enviado para send-whatsapp (fallback):", {
            patientId: nfseDataWithTherapist.patient_id,
            phoneFieldUsed,
            recipientName: recipientDisplayName,
            guardianName
          });
          
          whatsappResult = await fallbackResponse.json();
        }
        
        if (whatsappResult && whatsappResult.success) {
          console.log("WhatsApp sent successfully");
          whatsappSent = true;
          
          // Conversation management is handled by send-whatsapp function
        } else {
          console.error("Failed to send WhatsApp:", whatsappResult);
        }
      } catch (whatsappError) {
        console.error("Error sending WhatsApp:", whatsappError);
        // Don't fail the entire function if WhatsApp fails
      }
    }

    // Send copy to therapist if configured
    let therapistWhatsappSent = false;
    console.log("🔍 THERAPIST SEND CHECK:", {
      hasTherapist: !!nfseDataWithTherapist.therapist,
      therapistName: nfseDataWithTherapist.therapist?.full_name,
      sendNfseEnabled: nfseDataWithTherapist.therapist?.send_nfse_to_therapist,
      therapistPhone: nfseDataWithTherapist.therapist?.phone
    });
    
    if (nfseDataWithTherapist.therapist?.send_nfse_to_therapist && nfseDataWithTherapist.therapist?.phone) {
      try {
        const therapistPhone = normalizePhone(nfseDataWithTherapist.therapist.phone);
        console.log("✅ Sending copy to therapist at:", therapistPhone);

        // Get the file from storage to use the correct filename
        const { data: uploadedFiles } = await supabase
          .from("patient_files")
          .select("file_name")
          .eq("patient_id", nfseDataWithTherapist.patient_id)
          .eq("category", "NFSe")
          .order("uploaded_at", { ascending: false })
          .limit(1);

        const correctFilename = uploadedFiles && uploadedFiles.length > 0 
          ? uploadedFiles[0].file_name 
          : `NFSe_${nfseNumber}_${patientName.replace(/\s+/g, "_")}.pdf`;

        // Send WhatsApp to therapist using template (to avoid 24h window restriction)
        const therapistWhatsappResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              type: "template",
              data: {
                to: therapistPhone,
                templateName: "nfse_envio_v2",
                templateLanguage: "en",
                parameters: [
                  `${therapistName || 'Terapeuta'} (Cópia - Paciente: ${patientName})`, // ⭐ Nome correto
                  nfseNumber,
                  issueDate,
                  serviceValue,
                ],
                documentUrl: nfseDataWithTherapist.pdf_url,
                filename: correctFilename,
              },
              metadata: {
                patientId: nfseDataWithTherapist.patient_id,
                userId: nfseDataWithTherapist.user_id,
                phoneFieldUsed: 'therapist_phone',
                nfseNumber: nfseNumber // Para usar no content da mensagem
              }
            }),
          }
        );

        const therapistResult = await therapistWhatsappResponse.json();
        if (therapistResult && therapistResult.success) {
          console.log("WhatsApp sent successfully to therapist");
          therapistWhatsappSent = true;
        } else {
          console.error("Failed to send WhatsApp to therapist:", therapistResult);
        }
      } catch (therapistError) {
        console.error("Error sending WhatsApp to therapist:", therapistError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: whatsappSent ? "Email and WhatsApp sent successfully" : "Email sent successfully (WhatsApp not available)",
        emailId: emailResponse.data?.id,
        whatsappSent,
        therapistWhatsappSent
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-nfse-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
