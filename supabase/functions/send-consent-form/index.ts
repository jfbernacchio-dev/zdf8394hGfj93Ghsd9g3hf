import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

interface SendConsentRequest {
  patientId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { patientId }: SendConsentRequest = await req.json();

    if (!patientId) {
      throw new Error("ID do paciente é obrigatório");
    }

    // Get patient data
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .eq("user_id", user.id)
      .single();

    if (patientError || !patient) {
      throw new Error("Paciente não encontrado");
    }

    // Verificar se tem pelo menos um canal de comunicação (email ou telefone)
    const normalizedPhone = patient.phone ? normalizePhone(patient.phone) : null;
    if (!patient.email && !normalizedPhone) {
      throw new Error("Paciente não possui email nem telefone cadastrado");
    }

    // Check if already has consent
    if (patient.lgpd_consent_date && patient.privacy_policy_accepted) {
      throw new Error("Paciente já possui termos aceitos");
    }

    // Generate unique token for form access
    const token_hash = crypto.randomUUID();
    
    // Store token temporarily (expires in 7 days)
    const { error: tokenError } = await supabase
      .from("consent_submissions")
      .insert({
        patient_id: patientId,
        submission_type: patient.is_minor ? 'minor' : 'adult',
        token: token_hash,
        ip_address: null,
        user_agent: null,
        accepted_at: null // Will be set when form is submitted
      });

    if (tokenError) {
      console.error("Error storing token:", tokenError);
    }

    // Create consent form URL
    const baseUrl = Deno.env.get("FRONTEND_URL");
    if (!baseUrl) {
      throw new Error("FRONTEND_URL não configurada");
    }
    const consentUrl = `${baseUrl}/consent/${token_hash}`;

    // Prepare email
    const isMinor = patient.is_minor;
    const recipientName = isMinor ? patient.guardian_name || "Responsável" : patient.name;
    const patientName = patient.name;

    const emailSubject = isMinor 
      ? `Termos de Consentimento - ${patientName} (Menor de Idade)`
      : `Termos de Consentimento e Política de Privacidade - ${patientName}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 2px solid #0EA5E9;
            }
            .content {
              padding: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background-color: #0EA5E9;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .important {
              background-color: #FEF3C7;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Espaço Mindware</h1>
          </div>
          <div class="content">
            <h2>Olá, ${recipientName}!</h2>
            
            ${isMinor ? `
              <p>Você está recebendo este email porque é responsável legal por <strong>${patientName}</strong>, paciente do Espaço Mindware.</p>
              
              <p>Para que possamos iniciar ou continuar o atendimento, precisamos que você leia e aceite:</p>
              <ul>
                <li>Termo de Consentimento para Atendimento de Menores de Idade</li>
                <li>Política de Privacidade e Proteção de Dados (LGPD)</li>
              </ul>
              
              <div class="important">
                <strong>⚠️ Importante:</strong> Será necessário anexar uma cópia do seu documento de identidade (RG ou CNH).
              </div>
            ` : `
              <p>Para que possamos continuar seu atendimento e emitir notas fiscais, precisamos que você leia e aceite:</p>
              <ul>
                <li>Termo de Consentimento para Atendimento Psicológico</li>
                <li>Política de Privacidade e Proteção de Dados (LGPD)</li>
              </ul>
            `}
            
            <p>O processo é simples e leva apenas alguns minutos. Clique no botão abaixo para acessar o formulário:</p>
            
            <div style="text-align: center;">
              <a href="${consentUrl}" class="button">Acessar Formulário de Consentimento</a>
            </div>
            
            <p><small>Ou copie e cole este link no seu navegador:<br>${consentUrl}</small></p>
            
            <div class="important">
              <strong>📌 Atenção:</strong> Este link é válido por 7 dias e é de uso único.
            </div>
            
            <p>Caso tenha alguma dúvida, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br><strong>Equipe Mindware</strong></p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>Espaço Mindware - Atendimento Psicológico</p>
          </div>
        </body>
      </html>
    `;

    // Send email only if patient has email
    let emailSent = false;
    if (patient.email) {
      try {
        const emailResponse = await resend.emails.send({
          from: "Espaço Mindware <no-reply@espacomindware.com.br>",
          to: [patient.email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log("Consent form email sent:", emailResponse);
        emailSent = true;
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue to try WhatsApp
      }
    }

    // Send WhatsApp message if phone is available
    let whatsappSent = false;
    console.log("Patient phone data:", {
      phone: patient.phone,
      normalizedPhone: normalizedPhone,
      hasPhone: !!patient.phone,
      phoneType: typeof patient.phone
    });
    
    if (normalizedPhone) {
      try {
        console.log("Sending consent form via WhatsApp to:", normalizedPhone);
        
        // Try to use template first, fallback to text if template fails
        let whatsappResponse;
        
        try {
          // Use approved template: termo_consentimento (created in English due to Meta's 4-week lock bug)
          whatsappResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-whatsapp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                type: "template",
                data: {
                  to: normalizedPhone,
                  templateName: "termo_consentimento",
                  templateLanguage: "en", // Using English to avoid Meta's 4-week lock bug
                  parameters: [
                    recipientName,
                    consentUrl,
                  ],
                },
              }),
            }
          );
          
          const templateResult = await whatsappResponse.json();
          
          // If template fails, fallback to text message
          if (!whatsappResponse.ok || !templateResult.success) {
            console.log("Template failed, falling back to text message:", templateResult);
            throw new Error("Template not available");
          }
        } catch (templateError) {
          console.log("Using fallback text message method");
          
          const whatsappMessage = isMinor 
            ? `📋 *Termos de Consentimento - Espaço Mindware*\n\n` +
              `Olá, ${recipientName}!\n\n` +
              `Precisamos que você aceite os Termos de Consentimento e Política de Privacidade para continuar o atendimento de *${patientName}*.\n\n` +
              `⚠️ *Importante:* Será necessário anexar uma cópia do seu documento de identidade.\n\n` +
              `🔗 Acesse o formulário:\n${consentUrl}\n\n` +
              `📌 Este link é válido por 7 dias.`
            : `📋 *Termos de Consentimento - Espaço Mindware*\n\n` +
              `Olá, ${patientName}!\n\n` +
              `Precisamos que você aceite os Termos de Consentimento e Política de Privacidade para continuar seu atendimento.\n\n` +
              `🔗 Acesse o formulário:\n${consentUrl}\n\n` +
              `📌 Este link é válido por 7 dias.`;
          
          whatsappResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-whatsapp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                type: "text",
                data: {
                  to: normalizedPhone,
                  message: whatsappMessage,
                },
              }),
            }
          );
        }

        const whatsappResult = await whatsappResponse.json();
        
        console.log("WhatsApp response details:", {
          ok: whatsappResponse.ok,
          status: whatsappResponse.status,
          success: whatsappResult.success,
          result: whatsappResult
        });
        
        if (whatsappResponse.ok && whatsappResult.success) {
          console.log("WhatsApp sent successfully");
          whatsappSent = true;
          
          // Register message in WhatsApp history
          try {
            const messageContent = isMinor 
              ? `📋 Termos de Consentimento enviados para ${recipientName} (responsável por ${patientName})`
              : `📋 Termos de Consentimento enviados para ${patientName}`;
            
            // Check if conversation exists
            let conversationId: string;
            const { data: existingConv } = await supabase
              .from("whatsapp_conversations")
              .select("id")
              .eq("user_id", user.id)
              .eq("patient_id", patientId)
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
                  user_id: user.id,
                  patient_id: patientId,
                  phone_number: normalizedPhone,
                  contact_name: patient.name,
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
                message_type: "template",
                content: messageContent,
                status: "sent",
                metadata: {
                  type: "consent",
                  consentUrl: consentUrl,
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

    // Determinar mensagem de sucesso baseado nos canais enviados
    console.log("Final status:", { emailSent, whatsappSent, hasEmail: !!patient.email, hasPhone: !!normalizedPhone });
    
    let successMessage = "";
    if (emailSent && whatsappSent) {
      successMessage = "Email e WhatsApp de consentimento enviados com sucesso";
    } else if (emailSent) {
      successMessage = "Email de consentimento enviado com sucesso";
    } else if (whatsappSent) {
      successMessage = "WhatsApp de consentimento enviado com sucesso";
    } else {
      throw new Error("Não foi possível enviar por nenhum canal");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: successMessage,
        token: token_hash,
        emailSent,
        whatsappSent
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-consent-form:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao enviar email de consentimento" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
