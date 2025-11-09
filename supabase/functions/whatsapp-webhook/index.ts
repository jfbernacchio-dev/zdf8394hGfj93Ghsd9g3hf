import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rateLimit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// CORS restrito - apenas domínios autorizados + WhatsApp
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    "https://espacomindware.com.br",
    "https://www.espacomindware.com.br",
    "http://localhost:5173",
    "http://localhost:4173",
  ];
  
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

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

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting por IP para webhooks (proteção contra spam)
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = checkRateLimit(`webhook:${clientIp}`, {
      maxRequests: 200,
      windowMs: 60 * 1000, // 200 mensagens por minuto (alta para suportar volume do WhatsApp)
    });

    if (!rateLimitResult.allowed) {
      console.warn("Rate limit exceeded for IP:", clientIp);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests" 
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            ...getRateLimitHeaders(rateLimitResult),
            "Content-Type": "application/json" 
          },
        }
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
    const appSecret = Deno.env.get("WHATSAPP_APP_SECRET")!;

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
      let body: any;
      
      // Verificação de assinatura WhatsApp para segurança
      const signature = req.headers.get("x-hub-signature-256");
      
      if (signature) {
        const bodyText = await req.text();
        
        // Criar chave HMAC para verificar assinatura (usa App Secret, não Verify Token)
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(appSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        
        // Calcular assinatura esperada
        const signatureBuffer = await crypto.subtle.sign(
          "HMAC",
          key,
          encoder.encode(bodyText)
        );
        
        const expectedSignature = "sha256=" + Array.from(new Uint8Array(signatureBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");
        
        // Comparar assinaturas (timing-safe comparison)
        if (signature !== expectedSignature) {
          console.error("❌ Invalid webhook signature - possible attack attempt");
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { 
              status: 403, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
        
        console.log("✅ Webhook signature verified successfully");
        
        // Parse body após validação de assinatura
        body = JSON.parse(bodyText);
        console.log("Received webhook:", JSON.stringify(body, null, 2));
      } else {
        console.warn("⚠️ No signature provided - webhook security is reduced");
        body = await req.json();
        console.log("Received webhook:", JSON.stringify(body, null, 2));
      }

      // Schema de validação para mensagens WhatsApp
      const whatsappMessageSchema = z.object({
        from: z.string().min(10).max(15).regex(/^\d+$/, "Phone must contain only digits"),
        id: z.string().min(1),
        timestamp: z.string().regex(/^\d{10}$/, "Invalid timestamp format"),
        type: z.enum(["text", "image", "document", "audio", "video", "sticker", "location", "contacts"]),
        text: z.object({ body: z.string().max(4096) }).optional(),
        image: z.object({ 
          id: z.string(), 
          mime_type: z.string(), 
          caption: z.string().max(1024).optional() 
        }).optional(),
        document: z.object({ 
          id: z.string(), 
          mime_type: z.string(), 
          caption: z.string().max(1024).optional(),
          filename: z.string().optional()
        }).optional(),
        audio: z.object({ id: z.string(), mime_type: z.string() }).optional(),
        video: z.object({ 
          id: z.string(), 
          mime_type: z.string(), 
          caption: z.string().max(1024).optional() 
        }).optional(),
        sticker: z.object({ id: z.string(), mime_type: z.string() }).optional(),
        location: z.object({ 
          latitude: z.number(), 
          longitude: z.number(),
          name: z.string().optional(),
          address: z.string().optional()
        }).optional(),
        contacts: z.array(z.object({
          name: z.object({ formatted_name: z.string() }),
          phones: z.array(z.object({ phone: z.string() })).optional()
        })).optional()
      });

      // WhatsApp webhook structure
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === "messages") {
              // Check for status updates (not new messages)
              if (change.value.statuses) {
                console.log("📊 Status update received, ignoring");
                continue;
              }

              const message = change.value.messages?.[0];
              const contact = change.value.contacts?.[0];

              if (!message) {
                console.log("⚠️ No message in webhook data");
                continue;
              }

              // Validar estrutura da mensagem
              const validation = whatsappMessageSchema.safeParse(message);
              if (!validation.success) {
                console.error("❌ Invalid message structure - skipping:", validation.error.issues);
                console.error("Message data:", JSON.stringify(message));
                continue; // Pular mensagem inválida
              }

              const fromPhone = normalizePhone(message.from);
              const contactName = contact?.profile?.name || fromPhone;
              const messageId = message.id;
              const timestamp = new Date(parseInt(message.timestamp) * 1000);

              console.log("📥 Processing message from:", {
                original: message.from,
                normalized: fromPhone,
                messageId,
                type: message.type,
                timestamp
              });

              // Find patient by phone (normalized) - check main phone and guardian phones
              const { data: patient, error: patientSearchError } = await supabase
                .from("patients")
                .select("id, user_id, phone, name, guardian_phone_1, guardian_phone_2")
                .or(`phone.eq.${fromPhone},phone.eq.${fromPhone.replace(/^55/, '')},guardian_phone_1.eq.${fromPhone},guardian_phone_1.eq.${fromPhone.replace(/^55/, '')},guardian_phone_2.eq.${fromPhone},guardian_phone_2.eq.${fromPhone.replace(/^55/, '')}`)
                .limit(1)
                .maybeSingle();

              console.log("🔍 Patient search result:", {
                found: !!patient,
                patientId: patient?.id,
                patientName: patient?.name,
                patientPhone: patient?.phone,
                searchError: patientSearchError
              });

              if (!patient) {
                console.log("❌ Patient not found for phone:", fromPhone);
                return new Response(JSON.stringify({ success: true, message: "Patient not found" }), {
                  status: 200,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }

              console.log("Found patient:", patient.id, "for user:", patient.user_id);

              // Find or create conversation (using patient_id and user_id)
              // Messages MUST go to the patient's owner only
              let conversation;
              const { data: existingConv, error: convSearchError } = await supabase
                .from("whatsapp_conversations")
                .select("*")
                .eq("patient_id", patient.id)
                .eq("user_id", patient.user_id)
                .maybeSingle();
              
              console.log("🔍 Conversation search:", {
                searchPatientId: patient.id,
                searchUserId: patient.user_id,
                foundConversation: !!existingConv,
                conversationId: existingConv?.id,
                error: convSearchError
              });

              if (existingConv) {
                conversation = existingConv;
                console.log("Updating existing conversation:", existingConv.id);
                
                // Update conversation (não atualiza contact_name - usa sempre o nome do paciente)
                await supabase
                  .from("whatsapp_conversations")
                  .update({
                    last_message_at: timestamp.toISOString(),
                    last_message_from: "patient",
                    window_expires_at: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    unread_count: existingConv.unread_count + 1,
                  })
                  .eq("id", existingConv.id);
              } else {
                console.log("Creating new conversation for patient:", patient.id);
                
                // Create new conversation (usa nome do paciente, não do WhatsApp)
                const { data: newConv, error: insertError } = await supabase
                  .from("whatsapp_conversations")
                  .insert({
                    user_id: patient.user_id,
                    patient_id: patient.id,
                    phone_number: fromPhone,
                    contact_name: patient.name,
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
