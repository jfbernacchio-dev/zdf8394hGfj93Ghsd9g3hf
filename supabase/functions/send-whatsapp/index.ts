import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppTextMessage {
  to: string;
  message: string;
}

interface WhatsAppDocumentMessage {
  to: string;
  documentUrl: string;
  filename: string;
  caption?: string;
}

interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  templateLanguage?: string; // Default: pt_BR, can be overridden (e.g., "en" to avoid Meta's 4-week lock bug)
  parameters: string[];
  documentUrl?: string;
  filename?: string; // Optional filename for documents in templates
}

interface WhatsAppRequest {
  type: "text" | "document" | "template";
  data: WhatsAppTextMessage | WhatsAppDocumentMessage | WhatsAppTemplateMessage;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-whatsapp function");

    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!whatsappToken || !phoneNumberId) {
      throw new Error("WhatsApp credentials not configured");
    }

    const request: WhatsAppRequest = await req.json();
    const { type, data } = request;

    // Clean phone number - remove all non-digits and add country code if needed
    let cleanPhone = data.to.replace(/\D/g, "");
    
    // If doesn't start with country code, add Brazil code (55)
    if (!cleanPhone.startsWith("55")) {
      cleanPhone = "55" + cleanPhone;
    }

    console.log("Sending WhatsApp message to:", cleanPhone);

    const whatsappApiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    let messagePayload: any = {
      messaging_product: "whatsapp",
      to: cleanPhone,
    };

    if (type === "text") {
      const textData = data as WhatsAppTextMessage;
      messagePayload.type = "text";
      messagePayload.text = {
        body: textData.message,
      };
    } else if (type === "document") {
      const docData = data as WhatsAppDocumentMessage;
      messagePayload.type = "document";
      messagePayload.document = {
        link: docData.documentUrl,
        filename: docData.filename,
      };
      if (docData.caption) {
        messagePayload.document.caption = docData.caption;
      }
    } else if (type === "template") {
      const templateData = data as WhatsAppTemplateMessage;
      messagePayload.type = "template";
      messagePayload.template = {
        name: templateData.templateName,
        language: {
          code: templateData.templateLanguage || "pt_BR", // Use provided language or default to pt_BR
        },
        components: [] as any[],
      };

      // Add body parameters
      if (templateData.parameters && templateData.parameters.length > 0) {
        messagePayload.template.components.push({
          type: "body",
          parameters: templateData.parameters.map((param) => ({
            type: "text",
            text: param,
          })),
        });
      }

      // Add document header if provided
      if (templateData.documentUrl) {
        const documentParam: any = {
          type: "document",
          document: {
            link: templateData.documentUrl,
          },
        };
        
        // Add filename if provided
        if (templateData.filename) {
          documentParam.document.filename = templateData.filename;
        }
        
        messagePayload.template.components.unshift({
          type: "header",
          parameters: [documentParam],
        });
      }
    } else {
      throw new Error("Invalid message type");
    }

    console.log("WhatsApp payload:", JSON.stringify(messagePayload, null, 2));

    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });

    const responseData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("WhatsApp API error:", responseData);
      throw new Error(`WhatsApp API error: ${JSON.stringify(responseData)}`);
    }

    console.log("WhatsApp message sent successfully:", responseData);

    // Criar/atualizar conversa para abrir janela de 24h
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Buscar paciente pelo telefone normalizado
      const { data: patient } = await supabase
        .from("patients")
        .select("id, user_id, name")
        .or(`phone.eq.${cleanPhone},phone.eq.${cleanPhone.replace(/^55/, '')}`)
        .limit(1)
        .maybeSingle();

      if (patient) {
        const now = new Date();
        const windowExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Verificar se conversa existe
        const { data: existingConv } = await supabase
          .from("whatsapp_conversations")
          .select("*")
          .eq("phone_number", cleanPhone)
          .eq("user_id", patient.user_id)
          .maybeSingle();

        if (existingConv) {
          // Atualizar conversa existente - abre janela de 24h
          await supabase
            .from("whatsapp_conversations")
            .update({
              last_message_at: now.toISOString(),
              last_message_from: "therapist",
              window_expires_at: windowExpires.toISOString(),
            })
            .eq("id", existingConv.id);
          
          console.log("✅ Conversation updated - 24h window opened");
        } else {
          // Criar nova conversa
          await supabase
            .from("whatsapp_conversations")
            .insert({
              user_id: patient.user_id,
              patient_id: patient.id,
              phone_number: cleanPhone,
              contact_name: patient.name,
              last_message_at: now.toISOString(),
              last_message_from: "therapist",
              window_expires_at: windowExpires.toISOString(),
              unread_count: 0,
            });
          
          console.log("✅ Conversation created - 24h window opened");
        }
      }
    } catch (convError) {
      console.error("⚠️ Error updating conversation (non-critical):", convError);
      // Não falhar o envio se atualização da conversa falhar
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "WhatsApp message sent successfully",
        whatsappResponse: responseData,
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
    console.error("Error in send-whatsapp function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
