import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle webhook verification (GET request from Meta)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("Webhook verification attempt:", { mode, token });

      if (mode === "subscribe" && token === verifyToken) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      } else {
        console.log("Webhook verification failed");
        return new Response("Forbidden", { status: 403 });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Received webhook:", JSON.stringify(body, null, 2));

      // WhatsApp webhook structure
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === "messages") {
              const message = change.value.messages?.[0];
              const contact = change.value.contacts?.[0];

              if (!message) continue;

              const fromPhone = message.from;
              const contactName = contact?.profile?.name || fromPhone;
              const messageId = message.id;
              const timestamp = new Date(parseInt(message.timestamp) * 1000);

              console.log("Processing message from:", fromPhone);

              // Find patient by phone (try different formats)
              const phoneFormats = [
                fromPhone,
                fromPhone.replace(/^55/, ''), // Remove country code
                fromPhone.replace(/\D/g, ''), // Remove all non-digits
              ];

              const { data: patient } = await supabase
                .from("patients")
                .select("id, user_id, phone")
                .or(phoneFormats.map(p => `phone.eq.${p}`).join(','))
                .limit(1)
                .single();

              if (!patient) {
                console.log("Patient not found for phone:", fromPhone);
                return new Response(JSON.stringify({ success: true, message: "Patient not found" }), {
                  status: 200,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }

              console.log("Found patient:", patient.id, "for user:", patient.user_id);

              // Find or create conversation
              let conversation;
              const { data: existingConv } = await supabase
                .from("whatsapp_conversations")
                .select("*")
                .eq("phone_number", fromPhone)
                .eq("user_id", patient.user_id)
                .single();

              if (existingConv) {
                conversation = existingConv;
                console.log("Updating existing conversation:", existingConv.id);
                
                // Update conversation
                await supabase
                  .from("whatsapp_conversations")
                  .update({
                    last_message_at: timestamp.toISOString(),
                    last_message_from: "patient",
                    window_expires_at: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    unread_count: existingConv.unread_count + 1,
                    contact_name: contactName,
                  })
                  .eq("id", existingConv.id);
              } else {
                console.log("Creating new conversation for patient:", patient.id);
                
                // Create new conversation
                const { data: newConv, error: insertError } = await supabase
                  .from("whatsapp_conversations")
                  .insert({
                    user_id: patient.user_id,
                    patient_id: patient.id,
                    phone_number: fromPhone,
                    contact_name: contactName,
                    last_message_at: timestamp.toISOString(),
                    last_message_from: "patient",
                    window_expires_at: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    unread_count: 1,
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error creating conversation:", insertError);
                  throw insertError;
                }

                conversation = newConv;
                console.log("Created conversation:", newConv?.id);
              }

              if (!conversation) {
                console.error("Failed to create/find conversation");
                continue;
              }

              // Determine message type and content
              let messageType = "text";
              let content = "";
              let mediaUrl = null;
              const metadata: any = {};

              if (message.type === "text") {
                content = message.text.body;
              } else if (message.type === "image") {
                messageType = "image";
                content = message.image.caption || "📷 Imagem";
                mediaUrl = message.image.id;
                metadata.mimeType = message.image.mime_type;
              } else if (message.type === "document") {
                messageType = "document";
                content = message.document.filename || "📄 Documento";
                mediaUrl = message.document.id;
                metadata.mimeType = message.document.mime_type;
              } else if (message.type === "audio") {
                messageType = "audio";
                content = "🎵 Áudio";
                mediaUrl = message.audio.id;
                metadata.mimeType = message.audio.mime_type;
              } else if (message.type === "video") {
                messageType = "video";
                content = message.video.caption || "🎥 Vídeo";
                mediaUrl = message.video.id;
                metadata.mimeType = message.video.mime_type;
              }

              // Save message
              await supabase.from("whatsapp_messages").insert({
                conversation_id: conversation.id,
                direction: "inbound",
                message_type: messageType,
                content: content,
                whatsapp_message_id: messageId,
                media_url: mediaUrl,
                status: "received",
                metadata: metadata,
              });

              console.log("Message saved successfully");
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: any) {
    console.error("Webhook error:", error);
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
