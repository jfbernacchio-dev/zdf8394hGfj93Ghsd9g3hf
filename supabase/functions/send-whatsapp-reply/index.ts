import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN")!;
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { conversationId, message } = await req.json();

    console.log("Sending reply to conversation:", conversationId);

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error("Conversation not found");
    }

    // Check if window is expired
    const now = new Date();
    const windowExpires = new Date(conversation.window_expires_at);

    if (now > windowExpires) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Janela de 24h expirada. Só é possível enviar templates aprovados.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send WhatsApp message
    const whatsappApiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const messagePayload = {
      messaging_product: "whatsapp",
      to: conversation.phone_number,
      type: "text",
      text: {
        body: message,
      },
    };

    console.log("Sending WhatsApp message:", messagePayload);

    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("WhatsApp API error:", whatsappData);
      throw new Error(`WhatsApp API error: ${JSON.stringify(whatsappData)}`);
    }

    console.log("WhatsApp message sent:", whatsappData);

    // Save message to database
    const { data: savedMessage, error: saveError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        message_type: "text",
        content: message,
        whatsapp_message_id: whatsappData.messages[0].id,
        status: "sent",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving message:", saveError);
      throw new Error("Failed to save message");
    }

    // Update conversation
    await supabase
      .from("whatsapp_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_from: "therapist",
      })
      .eq("id", conversationId);

    return new Response(
      JSON.stringify({
        success: true,
        message: savedMessage,
        whatsappResponse: whatsappData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending reply:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
