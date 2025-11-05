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

    // Check if NFSe is issued and has a PDF URL
    if (nfseData.status !== "issued" && nfseData.status !== "processing") {
      throw new Error("NFSe is not in a valid state for email sending");
    }

    if (!nfseData.pdf_url) {
      throw new Error("NFSe PDF URL not available");
    }

    // Determine which email to use: alternate if available, otherwise patient email
    const recipientEmail = nfseData.patient?.use_alternate_nfse_contact && nfseData.patient?.nfse_alternate_email
      ? nfseData.patient.nfse_alternate_email
      : nfseData.patient?.email;

    if (!recipientEmail) {
      throw new Error("Patient email not found");
    }

    console.log("Downloading PDF from:", nfseData.pdf_url);

    // Download PDF from FocusNFe
    let pdfBuffer: ArrayBuffer;
    try {
      const pdfResponse = await fetch(nfseData.pdf_url);
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

    const patientName = nfseData.patient.name;
    const nfseNumber = nfseData.nfse_number || "Pendente";
    const issueDate = new Date(nfseData.issue_date).toLocaleDateString("pt-BR");
    const issueMonth = new Date(nfseData.issue_date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const serviceValue = Number(nfseData.service_value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    console.log("Sending email to:", recipientEmail);

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Espaço Mindware <no-reply@espacomindware.com.br>",
      to: [recipientEmail],
      subject: `Nota Fiscal Espaço Mindware - ${issueMonth}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B9D83; margin-bottom: 20px;">Espaço Mindware Psicologia</h2>
          
          <p>Olá, <strong>${patientName}</strong>!</p>
          
          <p>Segue em anexo a Nota Fiscal de Serviço Eletrônica referente aos atendimentos realizados.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B9D83; margin: 25px 0;">
            <p style="margin: 5px 0;"><strong>Número da NF-e:</strong> ${nfseNumber}</p>
            <p style="margin: 5px 0;"><strong>Data de Emissão:</strong> ${issueDate}</p>
            <p style="margin: 5px 0;"><strong>Valor Total:</strong> ${serviceValue}</p>
            ${nfseData.verification_code ? `<p style="margin: 5px 0;"><strong>Código de Verificação:</strong> ${nfseData.verification_code}</p>` : ""}
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
    const recipientPhone = nfseData.patient?.use_alternate_nfse_contact && nfseData.patient?.nfse_alternate_phone
      ? nfseData.patient.nfse_alternate_phone
      : nfseData.patient?.phone;
    
    const normalizedPhone = recipientPhone ? normalizePhone(recipientPhone) : null;

    console.log("Patient phone data:", {
      phone: nfseData.patient?.phone,
      alternate: nfseData.patient?.nfse_alternate_phone,
      useAlternate: nfseData.patient?.use_alternate_nfse_contact,
      recipientPhone,
      normalizedPhone
    });

    if (normalizedPhone && nfseData.pdf_url) {
      try {
        console.log("Sending WhatsApp message to:", normalizedPhone);
        
        // Try to use template first, fallback to direct document if template fails
        let whatsappResponse;
        
        try {
          // Use approved template: nfse_envio_v2 (created in English due to Meta's 4-week lock bug)
          whatsappResponse = await fetch(
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
                    patientName,
                    nfseNumber,
                    issueDate,
                    serviceValue,
                  ],
                  documentUrl: nfseData.pdf_url,
                },
              }),
            }
          );
          
          const templateResult = await whatsappResponse.json();
          
          // If template fails, fallback to direct document
          if (!whatsappResponse.ok || !templateResult.success) {
            console.log("Template failed, falling back to direct document:", templateResult);
            throw new Error("Template not available");
          }
        } catch (templateError) {
          console.log("Using fallback direct document method");
          
          whatsappResponse = await fetch(
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
                  documentUrl: nfseData.pdf_url,
                  filename: `NFSe_${nfseNumber}_${patientName.replace(/\s+/g, "_")}.pdf`,
                  caption: `📄 *Nota Fiscal Espaço Mindware*\n\n` +
                    `*Número:* ${nfseNumber}\n` +
                    `*Data:* ${issueDate}\n` +
                    `*Valor:* ${serviceValue}\n\n` +
                    `Olá, ${patientName}! Sua nota fiscal de ${issueMonth} está anexada.`,
                },
              }),
            }
          );
        }

        const whatsappResult = await whatsappResponse.json();
        
        if (whatsappResponse.ok && whatsappResult.success) {
          console.log("WhatsApp sent successfully");
          whatsappSent = true;
          
          // Register message in WhatsApp history
          try {
            const messageContent = `📄 NFS-e #${nfseNumber} enviada - ${issueMonth} (${serviceValue})`;
            
            // Check if conversation exists
            let conversationId: string;
            const { data: existingConv } = await supabase
              .from("whatsapp_conversations")
              .select("id")
              .eq("user_id", nfseData.user_id)
              .eq("patient_id", nfseData.patient_id)
              .eq("phone_number", normalizedPhone)
              .maybeSingle();

            if (existingConv) {
              conversationId = existingConv.id;
              await supabase
                .from("whatsapp_conversations")
                .update({
                  last_message_at: new Date().toISOString(),
                  last_message_from: "therapist",
                })
                .eq("id", conversationId);
            } else {
              const { data: newConv } = await supabase
                .from("whatsapp_conversations")
                .insert({
                  user_id: nfseData.user_id,
                  patient_id: nfseData.patient_id,
                  phone_number: normalizedPhone,
                  contact_name: patientName,
                  last_message_at: new Date().toISOString(),
                  last_message_from: "therapist",
                  status: "active",
                  unread_count: 0,
                })
                .select("id")
                .single();
              conversationId = newConv!.id;
            }

            // Insert message
            await supabase
              .from("whatsapp_messages")
              .insert({
                conversation_id: conversationId,
                direction: "outbound",
                message_type: "document",
                content: messageContent,
                status: "sent",
                metadata: {
                  type: "nfse",
                  nfseNumber: nfseNumber,
                  automatic: true,
                },
              });
          } catch (historyError) {
            console.error("Error registering in history:", historyError);
          }
        } else {
          console.error("Failed to send WhatsApp:", whatsappResult);
        }
      } catch (whatsappError) {
        console.error("Error sending WhatsApp:", whatsappError);
        // Don't fail the entire function if WhatsApp fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: whatsappSent ? "Email and WhatsApp sent successfully" : "Email sent successfully (WhatsApp not available)",
        emailId: emailResponse.data?.id,
        whatsappSent 
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
