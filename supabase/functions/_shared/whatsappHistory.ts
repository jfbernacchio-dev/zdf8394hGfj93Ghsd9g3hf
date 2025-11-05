import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Register an automatic message in WhatsApp history
 * This creates/updates a conversation and adds a message record
 */
export async function registerWhatsAppMessage(
  supabase: SupabaseClient,
  params: {
    userId: string;
    patientId: string;
    phoneNumber: string;
    messageType: "text" | "document" | "template";
    content: string;
    metadata?: {
      type?: "consent" | "nfse";
      nfseNumber?: string;
      consentUrl?: string;
      documentUrl?: string;
      templateName?: string;
      [key: string]: any;
    };
    whatsappMessageId?: string;
  }
) {
  try {
    console.log("Registering WhatsApp message in history:", {
      userId: params.userId,
      patientId: params.patientId,
      phoneNumber: params.phoneNumber,
      messageType: params.messageType
    });

    // Get patient data to find/create conversation
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("name")
      .eq("id", params.patientId)
      .single();

    if (patientError) {
      console.error("Error fetching patient:", patientError);
      throw patientError;
    }

    // Check if conversation exists
    let conversationId: string;
    const { data: existingConv, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("user_id", params.userId)
      .eq("patient_id", params.patientId)
      .single();

    if (existingConv) {
      conversationId = existingConv.id;
      
      // Update conversation with new message info
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_from: "therapist",
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } else {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          user_id: params.userId,
          patient_id: params.patientId,
          phone_number: params.phoneNumber,
          contact_name: patient?.name || "Desconhecido",
          last_message_at: new Date().toISOString(),
          last_message_from: "therapist",
          status: "active",
          unread_count: 0,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        throw createError;
      }

      conversationId = newConv.id;
    }

    // Insert message
    const { error: messageError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        message_type: params.messageType,
        content: params.content,
        status: "sent",
        whatsapp_message_id: params.whatsappMessageId,
        metadata: {
          ...params.metadata,
          automatic: true,
          sent_via: "system",
        },
      });

    if (messageError) {
      console.error("Error inserting message:", messageError);
      throw messageError;
    }

    console.log("Successfully registered WhatsApp message in history");
    return { success: true, conversationId };
  } catch (error) {
    console.error("Error in registerWhatsAppMessage:", error);
    return { success: false, error };
  }
}
