import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadMediaRequest {
  messageId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN")!;
    
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

    const { messageId }: DownloadMediaRequest = await req.json();

    if (!messageId) {
      throw new Error("ID da mensagem é obrigatório");
    }

    // Get message data
    const { data: message, error: msgError } = await supabase
      .from("whatsapp_messages")
      .select(`
        *,
        conversation:whatsapp_conversations!inner(user_id)
      `)
      .eq("id", messageId)
      .single();

    if (msgError || !message) {
      throw new Error("Mensagem não encontrada");
    }

    // Verify ownership
    if (message.conversation.user_id !== user.id) {
      throw new Error("Acesso negado");
    }

    // Check if already downloaded
    if (message.media_url && message.media_url.startsWith("http")) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          url: message.media_url 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const mediaId = message.media_url;
    if (!mediaId) {
      throw new Error("Mídia não encontrada");
    }

    console.log("Downloading media:", mediaId);

    // Step 1: Get media URL from WhatsApp
    const mediaInfoResponse = await fetch(
      `https://graph.facebook.com/v17.0/${mediaId}`,
      {
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
        },
      }
    );

    if (!mediaInfoResponse.ok) {
      throw new Error("Erro ao buscar informações da mídia");
    }

    const mediaInfo = await mediaInfoResponse.json();
    const mediaUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type || "image/jpeg";

    console.log("Media URL:", mediaUrl, "MIME:", mimeType);

    // Step 2: Download media from WhatsApp
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        "Authorization": `Bearer ${whatsappToken}`,
      },
    });

    if (!mediaResponse.ok) {
      throw new Error("Erro ao baixar mídia");
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();
    const extension = mimeType.split("/")[1] || "jpg";
    const fileName = `${message.id}.${extension}`;

    console.log("Uploading to storage:", fileName);

    // Step 3: Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("patient-files")
      .upload(`whatsapp-media/${fileName}`, mediaBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Erro ao fazer upload da mídia");
    }

    // Step 4: Get public URL
    const { data: urlData } = supabase.storage
      .from("patient-files")
      .getPublicUrl(`whatsapp-media/${fileName}`);

    const publicUrl = urlData.publicUrl;

    console.log("Public URL:", publicUrl);

    // Step 5: Update message with public URL
    const { error: updateError } = await supabase
      .from("whatsapp_messages")
      .update({ media_url: publicUrl })
      .eq("id", messageId);

    if (updateError) {
      console.error("Error updating message:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in download-whatsapp-media:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao baixar mídia" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});